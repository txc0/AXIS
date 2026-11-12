# AXIS

AXIS is a living architecture and terrarium studio website. It is a single
Node.js workspace containing:

- a Vite frontend with client-side routing;
- an Express API;
- a SQLite database;
- an admin area for orders and enquiries;
- a Docker production image.

For the complete implementation history and technical operating process, see
[TECHNICAL_PROCESS.md](./TECHNICAL_PROCESS.md).
For day-to-day operations, code changes, backups, security, troubleshooting,
and release procedures, see [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md).

## Requirements

- Node.js 22 (see `.nvmrc`; Node 20+ is supported by the package manifest)
- npm
- Docker Desktop for container deployment

## Run locally

From the repository root:

```powershell
npm install
Copy-Item .env.example .env
notepad .env
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:3000`.
Vite proxies `/api/*` to the API during development.

Set `ADMIN_TOKEN` in `.env` to enable the admin area at `/admin`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Run with Docker

Make sure Docker Desktop is running, then:

```powershell
Copy-Item .env.example .env
notepad .env
docker compose build
docker compose up -d
docker compose exec web npm run seed
```

Open `http://localhost:3000`, unless `AXIS_HOST_PORT` is set in `.env`. For
example, use `AXIS_HOST_PORT=3001` when another service already uses port 3000.

Useful commands:

```powershell
docker compose ps
docker compose logs -f web
docker compose exec web npm run backup
docker compose down
```

The SQLite database is stored in the `axis-data` Docker volume and survives
image rebuilds and container restarts.

## Updating the website

The site is designed for safe, code-reviewed content updates:

1. Edit `server/src/db/seed-data.js` for products, prices, builder options,
   projects, journal articles, events, team members, and community content.
2. Edit `client/src/content/site.js` for fixed copy such as services, FAQs,
   contact details, navigation copy, and homepage discovery tiles.
3. Add or replace images in `client/public/images/`.
4. Run `npm run seed` locally, or `docker compose exec web npm run seed` in
   production, when applying code-defined content.
5. Restart the server only when code or environment variables changed.

The admin editor is the preferred way to make live content changes. It saves
directly to SQLite and uploads images to the persistent `UPLOAD_DIR`. Startup
seeding is disabled by default so admin edits are not overwritten. The seeder
still fills an empty database automatically and can be run manually when
deploying reviewed changes from `seed-data.js`. It never deletes customer
orders, RSVPs, members, subscribers, or enquiries.

The About page uses Google Maps for the studio location. Set a browser-restricted
`VITE_GOOGLE_MAPS_API_KEY` in `.env` with the Google Maps Embed API enabled, then
rebuild the frontend. Update `STUDIO.mapsQuery` in
`client/src/content/site.js` when the physical address changes. Without a key,
the page shows a working **Open in Google Maps** fallback instead of a broken
embed.

## Email and SMTP

The contact, consultation, and plant-clinic forms save submissions to SQLite
and send an email notification to `MAIL_TO`. If the visitor supplies an email
address, the site also sends a confirmation reply. Configure SMTP in `.env`;
never commit the password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-google-app-password
MAIL_FROM=your-account@gmail.com
MAIL_TO=your-account@gmail.com
```

For Gmail, enable 2-Step Verification and create an App Password. Do not use
the normal Gmail account password. Restart Docker after changing `.env`:

```powershell
docker compose up -d --force-recreate
```

SMTP sends website notifications; receiving replies is handled by the inbox
configured in `MAIL_TO`. Mail failures are logged while the original form
submission remains saved in the admin panel.

To extract embedded prototype images:

```powershell
npm run extract-images -- "..\AXIS _ Living architecture, at every scale.html"
```

## Scripts

Run these from the repository root:

| Command | Purpose |
|---|---|
| `npm run dev` | Run the API and Vite development server |
| `npm run build` | Build the frontend for production |
| `npm start` | Run the production server |
| `npm run seed` | Synchronize editable seed content into SQLite |
| `npm run backup` | Create and retain database backups |
| `npm test` | Run the API test suite |
| `npm run extract-images -- file.html` | Extract base64 images from a prototype HTML file |

## Database and backups

The default database is `data/axis.db`. Configure these values in `.env`:

```env
DATABASE_PATH=./data/axis.db
BACKUP_DIR=./data/backups
BACKUP_RETENTION=14
```

`npm run backup` creates a timestamped SQLite copy and removes older copies
after the configured retention count. Backups should still be copied to
separate storage for disaster recovery.

The schema is created automatically on startup. For a schema change, add an
explicit, idempotent migration before deploying it; do not add a bare
one-time `ALTER TABLE` statement to `schema.sql`.

## Admin content editor and customer flows

- Set `ADMIN_TOKEN`, open `/admin`, and sign in.
- Use **Website content** to select products, projects, articles, events, team
  members, community builds, or discussion threads.
- Use the normal form fields to edit each record, click **Save**, and use
  **New item** to create one.
- Use **Replace image** to upload a JPEG, PNG, WebP, or GIF up to 5 MB.
- Team member forms include a profile image field; initials remain as a fallback.
- **Delete** removes an item from the public website without deleting its record,
  so existing links and customer records remain safe.
- `/admin` API requests require `Authorization: Bearer <ADMIN_TOKEN>`.
- Orders are priced on the server from database values.
- Order lookup requires both the order code and phone number.
- Event RSVPs are transaction-protected against overbooking.
- Forms use validation, rate limiting, and a honeypot field.
- Customer records are not overwritten by content seeding.

## Project map

| Area | Location |
|---|---|
| Frontend routes | `client/src/pages/` and `client/src/router.js` |
| Shared frontend copy | `client/src/content/site.js` |
| Frontend API client | `client/src/lib/api.js` |
| API routes | `server/src/routes/` |
| Validation | `server/src/schemas.js` |
| Pricing | `server/src/services/pricing.js` |
| Database schema | `server/src/db/schema.sql` |
| Editable database content | `server/src/db/seed-data.js` |
| Docker configuration | `Dockerfile` and `docker-compose.yml` |

## Long-term maintenance

Read [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) before changing the
database, deploying Docker, rotating the admin token, restoring backups, or
moving content from code into the admin CMS.

## Troubleshooting

### Port already allocated

Stop the process using the port, or set a different Docker host port:

```env
AXIS_HOST_PORT=3001
```

Then recreate the container:

```powershell
docker compose up -d --force-recreate
```

### Docker daemon unavailable

Start Docker Desktop and wait for the Linux engine to become ready. Verify
with:

```powershell
docker info
```

### Build errors

Run the same build outside Docker to get the complete source error:

```powershell
npm run build
```

Then rebuild the image:

```powershell
docker compose build --no-cache
```
