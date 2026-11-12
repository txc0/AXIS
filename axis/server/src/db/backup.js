// Usage: npm run backup  →  BACKUP_DIR/axis-<timestamp>.db
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { openDb } from './index.js';

const db = openDb();
const dir = config.backupDir;
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `axis-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
await db.backup(file);
db.close();
const backups = fs.readdirSync(dir)
  .filter(name => /^axis-.*\.db$/.test(name))
  .sort()
  .reverse();
for (const old of backups.slice(config.backupRetention)) fs.unlinkSync(path.join(dir, old));
console.log(`Backup written to ${file}`);