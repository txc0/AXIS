// Syncs seed-data.js into the content tables.
// - Rows are matched by slug (or grp+key) and updated in place.
// - Rows removed from seed-data.js are hidden (active = 0), never deleted, so old orders and bookings stay valid.
// - Customer tables (orders, rsvps, members, subscribers, submissions) are never touched.
import { pathToFileURL } from 'node:url';
import { openDb } from './index.js';
import data from './seed-data.js';

const TABLES = [
  // [table, columns, conflict keys, columns to keep on update]
  ['products', ['slug', 'name', 'price', 'image', 'category', 'description', 'sort', 'active'], ['slug']],
  ['builder_options', ['grp', 'key', 'name', 'price', 'wet', 'meta', 'sort', 'active'], ['grp', 'key']],
  ['projects', ['slug', 'name', 'location', 'year', 'type', 'area', 'status', 'art', 'bg', 'summary', 'body', 'sort', 'active'], ['slug']],
  ['articles', ['slug', 'title', 'category', 'published_at', 'minutes', 'image', 'excerpt', 'body', 'featured', 'active'], ['slug']],
  ['events', ['slug', 'starts_at', 'title', 'details', 'seats', 'active'], ['slug']],
  ['team', ['slug', 'name', 'role', 'initials', 'color', 'image', 'sort', 'active'], ['slug']],
  ['builds', ['slug', 'image', 'author', 'title', 'likes', 'sort', 'active'], ['slug'], ['likes']],
  ['threads', ['slug', 'initials', 'title', 'category', 'replies', 'posted_at', 'active'], ['slug']],
];

const toDb = v =>
  v === undefined ? null
    : typeof v === 'boolean' ? Number(v)
      : v !== null && typeof v === 'object' ? JSON.stringify(v)
        : v;

export function seed(db, { log = console.log } = {}) {
  db.transaction(() => {
    for (const [table, cols, keys, keep = []] of TABLES) {
      const rows = data[table] || [];
      const updates = cols.filter(c => !keys.includes(c) && !keep.includes(c)).map(c => `${c} = excluded.${c}`).join(', ');
      const stmt = db.prepare(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(c => '@' + c).join(', ')})
         ON CONFLICT(${keys.join(', ')}) DO UPDATE SET ${updates}`
      );
      db.prepare(`UPDATE ${table} SET active = 0`).run();
      rows.forEach((row, i) => {
        const full = {
          sort: i,
          likes: 0,
          wet: false,
          meta: {},
          featured: false,
          ...row,
          active: row.active === false ? 0 : 1,
        };
        stmt.run(Object.fromEntries(cols.map(c => [c, toDb(full[c])])));
      });
      log(`  ${table}: ${rows.length}`);
    }
  })();
}

// Allow "node src/db/seed.js" / "npm run seed"
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDb();
  console.log('Syncing content…');
  seed(db);
  db.close();
  console.log('Done.');
}