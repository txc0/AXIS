import { config } from './config.js';
import { openDb } from './db/index.js';
import { seed } from './db/seed.js';
import { createApp } from './app.js';

const db = openDb();
const empty = !db.prepare('SELECT 1 FROM products LIMIT 1').get();
if (config.seedOnStart || empty) {
  console.log('Syncing content from seed-data.js');
  seed(db);
}

const app = createApp({ db });
const server = app.listen(config.port, () => {
  console.log(`AXIS API running on http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`);
  if (!config.adminToken) console.log('Admin panel disabled: set ADMIN_TOKEN in .env to enable /admin');
});

function shutdown() {
  console.log('Shutting down…');
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);