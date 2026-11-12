# AXIS Long-Term Maintenance Guide

This guide explains how to operate, update, troubleshoot, secure, and extend
the AXIS website without losing admin-managed content.

## 1. System overview

AXIS is an npm-workspaces application:

```text
client/                  Vite frontend and browser routes
server/                  Express API, SQLite database, and server routes
server/src/db/           Schema, seed data, migrations, and backups
server/src/routes/        Public and authenticated API endpoints
client/src/content/      Fixed, code-managed site copy
client/public/images/    Legacy static images
data/                    Local database, backups, and uploaded files
Dockerfile               Production image
docker-compose.yml       Production service and persistent volume
```

The public website reads database-backed content through the API. Admin edits
are saved directly to SQLite and uploaded media is stored under `UPLOAD_DIR`.
The admin token is a secret and must never be committed or documented with its
actual value.

Email notifications use SMTP. Form submissions remain stored in SQLite even
when the mail provider is unavailable.

## 2. Routine operations

### Start local development

```powershell
npm install
Copy-Item .env.example .env
notepad .env
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API is available at
`http://localhost:3000`.

### Build and test before publishing

```powershell
npm test
npm run build
```

Run both commands after frontend, API, validation, database, or content code
changes. A failed build or test must be fixed before deployment.

### Run production with Docker

```powershell
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f web
```

The default URL is `http://localhost:3000`. If that port is occupied, set
`AXIS_HOST_PORT=3001` in `.env`, then run:

```powershell
docker compose up -d --force-recreate
```

Check the service with `http://localhost:3001/api/health` when using port 3001.

## 3. Updating content through the website

Use `/admin` for normal content updates:

1. Sign in with the configured admin token.
2. Select **Website content**.
3. Choose products, projects, articles, events, team members, community builds,
   or discussion threads.
4. Use **New item** to create a record.
5. Edit the normal fields and click **Save**.
6. Use **Replace image** for supported image uploads.
7. Use **Delete** to hide an item from the public site.

Deletes are soft deletes. The database row remains available for references,
orders, and possible recovery. Uploaded files live in the persistent data
directory or Docker volume.

The following remains code-managed and is not currently editable in the admin
screen:

- services and FAQs;
- navigation and contact copy;
- studio address and Google Maps location;
- homepage discovery tiles;
- other values in `client/src/content/site.js`.

Change those values through code review, then rebuild the frontend.

The About page embeds Google Maps using `STUDIO.mapsQuery` in
`client/src/content/site.js`. Set `VITE_GOOGLE_MAPS_API_KEY` in `.env` with a
browser referrer restriction and the Google Maps Embed API enabled. Keep the
query specific enough to identify the correct building. If the location
changes, update the query and verify both the embedded map and the **Open in
Google Maps** link after rebuilding.

## 4. Code change procedure

Before editing:

1. Create a branch or make a clear local change set.
2. Identify the route, page, schema, seed data, and tests affected.
3. Check whether the content is database-managed or fixed in source code.

During editing:

- Follow the existing route, validation, and error-response patterns.
- Keep admin writes authenticated.
- Validate all user input on the server.
- Use SQLite-compatible values (`0`/`1` for booleans).
- Preserve existing data and avoid destructive migrations.
- Add focused tests for new behavior or fixed bugs.

Before release:

```powershell
npm test
npm run build
docker compose build
docker compose up -d
```

Verify `/api/health`, the homepage, `/admin`, an image URL, and at least one
public content page.

## 5. Database and migrations

The default local database is `data/axis.db`. Docker uses
`/app/data/axis.db`, persisted by the `axis-data` volume.

Schema changes must be safe for existing installations:

1. Add the new definition to `server/src/db/schema.sql`.
2. Add an idempotent migration in `server/src/db/index.js`, normally using
   `PRAGMA table_info(...)` before `ALTER TABLE`.
3. Update seed data only for new default content.
4. Update API routes and frontend forms.
5. Add a regression test.
6. Back up the database before deployment.
7. Test against both a new database and an existing database.

Do not use a bare one-time `ALTER TABLE` that fails when the server restarts.
For larger schema changes, introduce a versioned migration system rather than
adding increasingly complex startup checks.

## 6. Backups and restoration

Configure:

```env
DATABASE_PATH=./data/axis.db
BACKUP_DIR=./data/backups
BACKUP_RETENTION=14
```

Create a backup:

```powershell
npm run backup
```

With Docker:

```powershell
docker compose exec web npm run backup
```

The built-in retention count is not an off-site backup. Periodically copy
backups to separate storage and test restoring them.

Basic local restoration:

1. Stop the application.
2. Copy the chosen backup to the configured database path.
3. Confirm file permissions and ownership.
4. Start the application.
5. Check `/api/health` and verify representative content.

Never overwrite the only database copy. Keep the original file until the
restoration has been verified.

## 7. Images and uploads

Admin uploads are served from `/uploads/...` and stored in `UPLOAD_DIR`.
Docker persists them in the same `axis-data` volume as the database.

Supported admin image formats are JPEG, PNG, WebP, and GIF, up to 5 MB.
When an image is missing, verify:

```powershell
docker compose exec web printenv UPLOAD_DIR
docker compose exec web ls -la /app/data/uploads
docker compose logs web
```

Do not store secrets or unrelated files in the upload directory. For a larger
installation, move media to object storage and store only controlled URLs in
the database.

## 8. Security

- Generate a long random `ADMIN_TOKEN`.
- Keep `.env` out of Git and never paste the token into tickets or docs.
- Rotate the token after suspected exposure.
- Use HTTPS in production.
- Put the service behind a reverse proxy with a real domain.
- Set `TRUST_PROXY=1` only when the proxy is configured correctly.
- Restrict access to `/admin` where possible with network controls or SSO.
- Keep Node.js and npm dependencies updated.
- Review `npm audit` output before upgrades; test upgrades rather than applying
  breaking changes blindly.
- Do not expose SQLite or the data volume publicly.
- Keep Docker Desktop and the host operating system patched.

## 9. Performance and reliability

For the current SQLite deployment:

- keep indexes on frequently filtered columns;
- avoid loading large unbounded collections;
- paginate future admin and public list endpoints;
- optimize and resize uploaded images;
- cache immutable static assets;
- use production builds rather than Vite development mode;
- monitor database size and upload growth;
- keep backups outside the application container.

If traffic or write volume grows substantially, consider PostgreSQL, object
storage for media, a reverse proxy cache, and a background job system.

## 10. Monitoring and logs

Minimum health check:

```powershell
curl http://localhost:3000/api/health
```

Docker logs:

```powershell
docker compose logs --tail=200 web
docker compose logs -f web
```

Monitor:

- container restart loops;
- HTTP 5xx responses;
- failed uploads;
- database disk usage;
- backup age and backup restore success;
- host disk and memory usage.

For production, send structured logs and health-check results to an external
monitoring service. Do not log admin tokens, passwords, or private customer
data.

## 11. Troubleshooting

### Port 3000 is already allocated

Set `AXIS_HOST_PORT=3001` in `.env` and recreate the service:

```powershell
docker compose up -d --force-recreate
```

### Docker daemon is unavailable

Start Docker Desktop, wait for the Linux engine, and run:

```powershell
docker info
```

### Frontend build fails

Run the build outside Docker for a clearer error:

```powershell
npm run build
```

Inspect the first source error, fix it, then run:

```powershell
docker compose build --no-cache
```

### Admin login fails

Check that `.env` contains a non-empty `ADMIN_TOKEN`, then recreate the
container after changing it:

```powershell
docker compose up -d --force-recreate
```

Do not print the token while troubleshooting.

### Admin changes disappear

Confirm `SEED_ON_START=false`. Startup seeding can overwrite editable content
when explicitly enabled. Also verify the database is on persistent storage.

### Uploaded images are missing

Verify the file exists under `UPLOAD_DIR`, the API returns an `/uploads/...`
path, and the browser is using the same host and port as the API.

### Form emails are not arriving

Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
`MAIL_FROM`, and `MAIL_TO`. For Gmail, use an App Password rather than the
normal account password. Recreate the container after changing `.env`:

```powershell
docker compose up -d --force-recreate
docker compose logs --tail=200 web
```

The form record should still appear in the admin **Messages** tab when SMTP
delivery fails.

### Database errors occur after an update

Stop the service, create a backup, inspect the logs, and verify the migration
is idempotent. Do not delete the database as a first response.

## 12. Release and rollback checklist

### Release

- [ ] Review the code and database changes.
- [ ] Create and verify a database backup.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Build the Docker image.
- [ ] Deploy with the persistent volume unchanged.
- [ ] Check `/api/health`.
- [ ] Check homepage, admin login, content editing, and image display.
- [ ] Review logs for startup errors.

### Rollback

- [ ] Stop or scale down the current service.
- [ ] Preserve the current image and database.
- [ ] Deploy the previous known-good image.
- [ ] Restore the database only if the release changed data incompatibly.
- [ ] Verify health and representative user flows.
- [ ] Record the cause and corrective action.

## 13. Recommended future improvements

1. Add versioned migrations with a migration table.
2. Move fixed site copy into a database-backed settings collection.
3. Add browser tests for admin forms and image uploads.
4. Add pagination and search to admin collections.
5. Add audit history for admin changes.
6. Add role-based access instead of one shared token.
7. Add HTTPS reverse-proxy configuration and automated certificate renewal.
8. Add automated off-site backups and scheduled restore tests.
9. Add dependency scanning and CI checks for every pull request.
10. Add external uptime, error, and disk-space monitoring.

