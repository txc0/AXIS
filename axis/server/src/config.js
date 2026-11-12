import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env') });

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const dbPath = env.DATABASE_PATH || './data/axis.db';
const resolveFromRoot = value => path.isAbsolute(value) ? value : path.resolve(root, value);

export const config = {
  root,
  isProd,
  port: Number(env.PORT) || 3000,
  dbPath: dbPath === ':memory:' ? dbPath : resolveFromRoot(dbPath),
  backupDir: resolveFromRoot(env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups')),
  backupRetention: Math.max(1, Number(env.BACKUP_RETENTION) || 14),
  uploadDir: resolveFromRoot(env.UPLOAD_DIR || path.join(path.dirname(dbPath), 'uploads')),
  adminToken: env.ADMIN_TOKEN || '',
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || env.SMTP_USER || '',
    to: env.MAIL_TO || env.SMTP_USER || '',
  },
  seedOnStart: env.SEED_ON_START === 'true',
  trustProxy: Number(env.TRUST_PROXY ?? (isProd ? 1 : 0)),
  clientDist: path.join(root, 'client', 'dist'),
};