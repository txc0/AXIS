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

## 3. Website page-to-code map

The frontend is a small client-side application. Routes are registered in
[client/src/router.js](./client/src/router.js), page modules live in
[client/src/pages/](./client/src/pages/), and shared header/footer behavior
lives in [client/src/components/layout.js](./client/src/components/layout.js).

### Public pages

| Browser URL | Page module | Main purpose | Main data or code to edit |
|---|---|---|---|
| `/` | [client/src/pages/home.js](./client/src/pages/home.js) | Homepage, hero, shop preview, services, journal preview, builder | [client/src/content/site.js](./client/src/content/site.js), database catalog/articles, [client/src/styles/home.css](./client/src/styles/home.css) |
| `/architecture` | [client/src/pages/architecture.js](./client/src/pages/architecture.js) | Services, process, and project listing | `SERVICES` and `STEPS` in [client/src/content/site.js](./client/src/content/site.js), project records in the database |
| `/architecture/:slug` | [client/src/pages/architecture.js](./client/src/pages/architecture.js) | Individual architecture project | Project record in [server/src/db/seed-data.js](./server/src/db/seed-data.js) or the admin CMS |
| `/journal` | [client/src/pages/journal.js](./client/src/pages/journal.js) | Article listing and category filters | Article records in the database |
| `/journal/:slug` | [client/src/pages/journal.js](./client/src/pages/journal.js) | Individual journal article | Article record in the database or admin CMS |
| `/community` | [client/src/pages/community.js](./client/src/pages/community.js) | Community builds, events, threads, and member actions | Community records in the database; fixed labels in [client/src/content/site.js](./client/src/content/site.js) |
| `/about` | [client/src/pages/about.js](./client/src/pages/about.js) | Studio story, team, address, Google Maps, and contact form | `ABOUT` and `STUDIO` in [client/src/content/site.js](./client/src/content/site.js), team records in the database |
| `/care` | [client/src/pages/care.js](./client/src/pages/care.js) | Care tips, FAQs, and plant clinic form | `CARE` in [client/src/content/site.js](./client/src/content/site.js), [server/src/routes/forms.js](./server/src/routes/forms.js) |
| `/admin` | [client/src/pages/admin.js](./client/src/pages/admin.js) | Token-protected operations and content CMS | [server/src/routes/admin.js](./server/src/routes/admin.js), [client/src/styles/pages.css](./client/src/styles/pages.css) |

If a new page is needed, add a route entry and page module in the same pattern:

1. Create `client/src/pages/example.js`.
2. Export a page function that returns `title`, `html`, and optional `mount`.
3. Add a route entry in `client/src/router.js`.
4. Add navigation links in `client/index.html` or the relevant page.
5. Add focused styles in `client/src/styles/pages.css` or `home.css`.
6. Run `npm run build`.

### Where navigation links go

| Visible link or action | Destination | Defined in |
|---|---|---|
| Logo / `AXIS` | `/` | [client/index.html](./client/index.html) |
| Terrariums | `/#shop` with category filters | [client/index.html](./client/index.html), [client/src/router.js](./client/src/router.js) |
| Architecture | `/architecture` | [client/index.html](./client/index.html) |
| Shop | `/#shop` | [client/index.html](./client/index.html) |
| Journal | `/journal` | [client/index.html](./client/index.html) |
| Community | `/community` | [client/index.html](./client/index.html) |
| About AXIS | `/about` | [client/index.html](./client/index.html) |
| Visit the studio | `/about#visit` | [client/index.html](./client/index.html) |
| Contact | `/about#contact` | [client/index.html](./client/index.html) |
| Care guides | `/care` | [client/index.html](./client/index.html) |
| Design your own / Build | `/#build` | [client/index.html](./client/index.html), [client/src/pages/home.js](./client/src/pages/home.js) |
| Book a consultation | Modal form, then `POST /api/consultations` | [client/src/components/layout.js](./client/src/components/layout.js) |
| Join for free | Modal form, then `POST /api/members` | [client/src/components/layout.js](./client/src/components/layout.js) |
| My orders | Order lookup modal | [client/src/components/layout.js](./client/src/components/layout.js), [client/src/ui/cart.js](./client/src/ui/cart.js) |

Hash links such as `/#shop`, `/#build`, `/about#visit`, and
`/about#contact` are handled by the router after the page is rendered. If a
new section is added, give its container a unique `id` and link to that hash.

### Page editing recipes

- **Change global navigation or footer:** edit [client/index.html](./client/index.html).
- **Change the homepage hero or fixed sections:** edit
  [client/src/pages/home.js](./client/src/pages/home.js) and
  [client/src/content/site.js](./client/src/content/site.js).
- **Change products or builder options:** use the admin CMS, or edit
  [server/src/db/seed-data.js](./server/src/db/seed-data.js) and deliberately
  run `npm run seed`.
- **Change projects, articles, events, team, or community records:** use the
  admin CMS for live updates; use seed data for reviewed defaults.
- **Change About address, phone, email, hours, or map query:** edit `STUDIO` in
  [client/src/content/site.js](./client/src/content/site.js). The Google Maps
  key is configured through `VITE_GOOGLE_MAPS_API_KEY` in `.env`.
- **Change FAQs or care instructions:** edit `CARE` in
  [client/src/content/site.js](./client/src/content/site.js).
- **Change form behavior or mail delivery:** edit
  [server/src/routes/forms.js](./server/src/routes/forms.js),
  [server/src/schemas.js](./server/src/schemas.js), and
  [server/src/services/mail.js](./server/src/services/mail.js).
- **Change visual styles:** edit [client/src/styles/base.css](./client/src/styles/base.css),
  [client/src/styles/home.css](./client/src/styles/home.css), or
  [client/src/styles/pages.css](./client/src/styles/pages.css).

### Easy frontend theme changes

The safest way to change the visual theme is to edit the design tokens at the
top of [client/src/styles/base.css](./client/src/styles/base.css). Most
components use these CSS variables, so one edit changes the whole website:

```css
:root {
  --ink: #1a1a1a;       /* headings, buttons, main text */
  --muted: #8a8a8a;     /* labels and secondary text */
  --soft: #4a4a4a;      /* paragraph text */
  --line: #e6e6e6;      /* borders */
  --gray: #f4f4f4;      /* cards and bands */
  --bg: #fff;           /* page background */
  --accent: #5e6b55;    /* focus rings and green accents */
  --warn: #9a4b12;      /* validation errors */
  --pad: 48px;          /* desktop page padding */
}
```

For example, a dark green theme can start with:

```css
:root {
  --ink: #10251c;
  --muted: #6d8576;
  --soft: #30483b;
  --line: #cbd8d0;
  --gray: #edf4ef;
  --bg: #fbfdfb;
  --accent: #2f7654;
  --warn: #a4472a;
}
```

Theme workflow:

1. Change only the variables first.
2. Run `npm run dev` and check desktop and mobile widths.
3. Search for hard-coded colors with `rg "#[0-9a-fA-F]{3,8}" client/src`.
4. Replace any remaining page-specific colors only when necessary.
5. Run `npm run build`.
6. Rebuild Docker before publishing:
   `docker compose build && docker compose up -d`.

Use `base.css` for global colors, typography, spacing, buttons, header, and
footer. Use `home.css` for homepage-only layouts and `pages.css` for inner
pages, forms, admin screens, and responsive adjustments. Do not edit compiled
files under `client/dist`; they are regenerated by `npm run build`.

If multiple themes are needed later, add selectors such as
`body[data-theme="dark"]` below `:root`, then set the `data-theme` attribute
from one controlled UI setting. Keep the default theme in `:root` so the site
always has a readable fallback.

## 4. Environment configuration

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

## 5. Database and content process

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

## 6. Admin CMS process

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

## 7. API request process

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

## 8. Problems found and fixed

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

## 9. Docker deployment process

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

## 10. Backup process

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

## 11. Validation process

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

## 12. Recommended future maintenance

- Keep `ADMIN_TOKEN` private and rotate it when needed.
- Keep `SEED_ON_START=false` for production CMS usage.
- Run `npm test` and `npm run build` before deployment.
- Run database backups regularly.
- Copy backups off the host.
- Review `npm audit` regularly.
- Add versioned migrations before changing database columns.
- Use HTTPS through a reverse proxy in production.

### Future security roadmap

The current application has Helmet security headers, server-side validation,
rate limits, a honeypot field, authenticated admin routes, and restricted
uploads. Before treating the site as a high-traffic production service, add
the following controls.

#### Identity and admin access

- Replace the single shared `ADMIN_TOKEN` with individual admin accounts.
- Add role-based permissions, such as editor, manager, and administrator.
- Require multi-factor authentication for administrator accounts.
- Store passwords with a slow password hash such as Argon2 or bcrypt.
- Use short-lived sessions with secure, HttpOnly, SameSite cookies.
- Add login attempt throttling, account lockout, and session revocation.
- Record who created, changed, hid, or deleted each content record.
- Rotate all tokens and credentials on a defined schedule and after staff
  changes.

#### Network and browser security

- Put the service behind HTTPS with automatic certificate renewal.
- Restrict the reverse proxy and firewall to required ports only.
- Configure a strict production Content Security Policy and review every
  external domain before adding it.
- Add HSTS only after HTTPS is confirmed on every production hostname.
- Configure trusted proxy IPs instead of trusting arbitrary forwarded headers.
- Add CORS rules only if a separate frontend domain is introduced; otherwise
  keep same-origin requests.
- Use Cloudflare or an equivalent edge firewall for bot filtering, DDoS
  protection, request limits, and a traffic waiting room.

#### API and application protection

- Use a shared rate-limit store such as Redis when multiple Node containers
  are deployed; the current in-memory limiter is per process.
- Add request correlation IDs and structured security logs.
- Validate request size, content type, field length, and file type on every
  upload endpoint.
- Verify uploaded files by content signature, not only filename extension.
- Re-encode images and remove metadata before publishing them.
- Keep user-provided text escaped in HTML and avoid unsafe HTML injection.
- Add CSRF protection if authentication moves to cookies.
- Make order creation idempotent so retries cannot create duplicate orders.
- Add explicit authorization checks for every future admin endpoint.

#### Database and data protection

- Move from SQLite to PostgreSQL when concurrent writes or multiple
  application instances are required.
- Use a separate database user with only the permissions the application
  needs.
- Encrypt database connections and backups.
- Encrypt sensitive backups at rest and store them outside the web host.
- Define a backup retention policy and test restoration regularly.
- Minimize stored customer data and define deletion/retention periods.
- Never log passwords, tokens, SMTP credentials, payment data, or unnecessary
  personal information.

#### Secrets and dependencies

- Store SMTP credentials, admin secrets, API keys, and database credentials
  in a secret manager rather than `.env` files on production hosts.
- Restrict the Google Maps key by domain and API.
- Scan commits and CI artifacts for accidentally exposed secrets.
- Pin and review dependency updates through pull requests.
- Run `npm audit`, dependency scanning, and container image scanning in CI.
- Use a minimal non-root production Docker image and keep the base image
  patched.

#### Monitoring and incident response

- Alert on repeated authentication failures, rate-limit spikes, 4xx/5xx
  increases, unusual upload activity, and database errors.
- Monitor CPU, memory, disk, database size, backup age, and container restarts.
- Keep security logs separate from application logs with controlled access.
- Define an incident process: contain, preserve evidence, rotate secrets,
  restore service, notify affected users when required, and document the
  root cause.
- Perform a quarterly access review and an annual penetration test or
  independent security review.

Security changes should be implemented incrementally, tested in a staging
environment, and documented with the deployment and rollback procedure. Do
not enable a control such as HSTS, strict CSP, or proxy trust globally until
the production topology has been verified.
