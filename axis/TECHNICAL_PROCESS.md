# AXIS Technical Process

This document records how the AXIS website works, how it was repaired and
deployed, and how future updates should be made.

## 1. System architecture

AXIS is a single npm-workspaces repository:

```text
Browser
  |
  |-- Vite development server (:5173)
  |     |-- frontend in client/
  |     |-- /api proxy to Express (:3000)
  |
  |-- Express production server (:3000 inside Docker)
        |-- REST API under /api
        |-- SQLite database
        |-- compiled frontend from client/dist
        |-- persistent uploads under /uploads
```

The root `package.json` controls both workspaces:

- `client/`: Vite frontend
- `server/`: Express API and SQLite database

Production uses a multi-stage [Dockerfile](./Dockerfile). The build stage
installs dependencies and builds the frontend. The runtime stage contains the
compiled frontend, API, and production dependencies.

## 2. Local development process

From the repository root:

```powershell
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
```

The development server starts:

- frontend: `http://localhost:5173`
- API: `http://localhost:3000`

Vite proxies `/api/*` requests to Express, so frontend code uses relative API
URLs and works in both development and production.

## 3. Environment configuration

Important values in `.env`:

```env
NODE_ENV=development
PORT=3000
AXIS_HOST_PORT=3001
DATABASE_PATH=./data/axis.db
ADMIN_TOKEN=replace-with-a-private-token
SEED_ON_START=false
UPLOAD_DIR=./data/uploads
BACKUP_DIR=./data/backups
BACKUP_RETENTION=14
TRUST_PROXY=0
```

`ADMIN_TOKEN` must never be committed to source control. The current local
token is intentionally not recorded in this document.

`AXIS_HOST_PORT` is the host port used by Docker. The container still listens
on port 3000 internally. Port 3001 is used locally because another service was
already using host port 3000.

## 4. Database and content process

The database is SQLite and is opened in [server/src/db/index.js](./server/src/db/index.js).
The schema is defined in [server/src/db/schema.sql](./server/src/db/schema.sql).

Database groups:

- Content: products, builder options, projects, articles, events, team, builds,
  and discussion threads
- Customer data: orders, RSVPs, subscribers, members, and form submissions

The content seeder is [server/src/db/seed.js](./server/src/db/seed.js), with
editable initial content in [server/src/db/seed-data.js](./server/src/db/seed-data.js).

The seeder:

- upserts content by stable slug/key;
- preserves customer records;
- converts booleans and JSON fields into SQLite-compatible values;
- provides defaults for optional content fields;
- hides removed seed records instead of deleting them.

Startup behavior is deliberately safe:

- an empty database is seeded automatically;
- `SEED_ON_START=false` prevents future restarts from overwriting admin edits;
- `npm run seed` remains available for intentionally applying reviewed
  code-based seed changes.

## 5. Admin CMS process

The admin page is [client/src/pages/admin.js](./client/src/pages/admin.js).
The API is [server/src/routes/admin.js](./server/src/routes/admin.js).

### Login

1. Set `ADMIN_TOKEN` in `.env`.
2. Restart or recreate the server/container.
3. Open `/admin`.
4. Enter the configured token.

The browser stores the authenticated token only in `sessionStorage`.

### Content management

The Website Content section supports normal forms for:

- products;
- projects;
- articles;
- events;
- team members;
- community builds;
- discussion threads.

Each form supports:

- create;
- edit;
- numeric values;
- dates and times;
- select fields;
- visibility checkboxes;
- readable multiline text;
- image upload;
- delete/hide.

Deleting content is implemented as a soft delete (`active = 0`) so old links
and customer records remain safe.

### Image uploads

Images are uploaded through the authenticated API and stored under
`UPLOAD_DIR`. Express serves them at `/uploads/...`.

Docker stores this directory in the persistent `axis-data` volume, so uploaded
images survive container recreation and image rebuilds.

## 6. API request process

Public content:

```text
GET /api/catalog
GET /api/projects
GET /api/articles
GET /api/events
GET /api/team
GET /api/community
```

Customer actions:

```text
POST /api/orders
GET  /api/orders/:code?phone=...
POST /api/events/:slug/rsvp
POST /api/cart/quote
POST /api/contact
POST /api/consultations
POST /api/clinic
POST /api/subscribe
POST /api/members
```

Admin actions require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

Admin content endpoints:

```text
GET    /api/admin/content/:collection
POST   /api/admin/content/:collection
PATCH  /api/admin/content/:collection/:key
DELETE /api/admin/content/:collection/:key
POST   /api/admin/uploads
```

Request processing order:

```text
request
  -> security headers
  -> compression
  -> JSON body parsing
  -> API router
  -> rate limiting
  -> validation
  -> route handler
  -> database transaction/query
  -> JSON response
```

Orders are priced by [server/src/services/pricing.js](./server/src/services/pricing.js);
client-supplied prices are never trusted.

## 7. Problems found and fixed

### Seeder failure

The seed script converted missing optional values to `NULL`, which violated
SQLite `NOT NULL` constraints such as `builder_options.wet` and
`articles.featured`.

The seeder now supplies safe defaults before binding values.

### Frontend production build failure

The old homepage imported removed symbols (`h`, `shop`, and `builder`).
The homepage was rebuilt to use the current HTML renderers and API flow:

- `shopHtml` and `mountShop`;
- `builderHtml` and `mountBuilder`;
- `initStory`;
- live catalog and article data.

### Missing images

Seeded content referenced image keys that were not present in
`client/public/images`.

The prototype image extractor was run and restored the referenced image
assets, including product, article, hero, and custom-terrarium images.

### Docker port conflict

Host port 3000 was already used by another container. Docker Compose now
supports:

```env
AXIS_HOST_PORT=3001
```

The public website is therefore currently available at
`http://localhost:3001`.

### Documentation and backup issues

The documentation was corrected to:

- use the actual Compose service name `web`;
- use the correct database path;
- document the correct image extraction command;
- support configurable backup paths;
- retain only the configured number of backups.

## 8. Docker deployment process

Start Docker Desktop, then run:

```powershell
docker compose build
docker compose up -d
```

For an empty database only, seed once:

```powershell
docker compose exec web npm run seed
```

Do not run the seed command after admin edits unless you intentionally want to
reapply the code-defined seed content.

Useful operations:

```powershell
docker compose ps
docker compose logs -f web
docker compose exec web npm run backup
docker compose down
```

Health check:

```powershell
Invoke-WebRequest http://localhost:3001/api/health
```

Expected response:

```json
{"ok":true}
```

## 9. Backup process

Run:

```powershell
npm run backup
```

or inside Docker:

```powershell
docker compose exec web npm run backup
```

The backup process:

1. opens the live SQLite database;
2. creates a timestamped copy under `BACKUP_DIR`;
3. keeps the newest `BACKUP_RETENTION` copies;
4. removes older local copies.

Local backups are not a complete disaster-recovery strategy. Copy important
backups to separate storage.

## 10. Validation process

Run the API tests:

```powershell
npm test
```

Build the frontend:

```powershell
npm run build
```

Build and start Docker:

```powershell
docker compose build
docker compose up -d --force-recreate
```

Verify health:

```powershell
Invoke-WebRequest http://localhost:3001/api/health
```

The current verified API suite covers:

- health checks;
- catalog loading;
- server-side pricing;
- invalid products;
- custom terrarium plant validation;
- RSVP overbooking protection;
- honeypot submissions;
- admin authentication;
- admin content CRUD.

## 11. Recommended future maintenance

- Keep `ADMIN_TOKEN` private and rotate it when needed.
- Keep `SEED_ON_START=false` for production CMS usage.
- Run `npm test` and `npm run build` before deployment.
- Run database backups regularly.
- Copy backups off the host.
- Review `npm audit` regularly.
- Add versioned migrations before changing database columns.
- Use HTTPS through a reverse proxy in production.
