import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../lib/http-error.js';
import { requireAdmin } from '../middleware/admin-auth.js';
import { validate } from '../middleware/validate.js';
import { schemas } from '../schemas.js';

const LISTS = {
  orders: 'SELECT id, code, name, phone, address, payment, items, total, status, created_at FROM orders ORDER BY id DESC LIMIT 500',
  rsvps: `SELECT r.id, e.title AS event, e.starts_at, r.name, r.phone, r.seats, r.created_at
          FROM rsvps r JOIN events e ON e.slug = r.event_slug ORDER BY r.id DESC LIMIT 500`,
  members: 'SELECT name, email, created_at FROM members ORDER BY created_at DESC LIMIT 2000',
  subscribers: 'SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT 5000',
};

const CONTENT = {
  products: { key: 'slug', columns: ['slug', 'name', 'price', 'image', 'category', 'description', 'sort', 'active'] },
  projects: { key: 'slug', columns: ['slug', 'name', 'location', 'year', 'type', 'area', 'status', 'art', 'bg', 'summary', 'body', 'sort', 'active'] },
  articles: { key: 'slug', columns: ['slug', 'title', 'category', 'published_at', 'minutes', 'image', 'excerpt', 'body', 'featured', 'active'] },
  events: { key: 'slug', columns: ['slug', 'starts_at', 'title', 'details', 'seats', 'active'] },
  team: { key: 'slug', columns: ['slug', 'name', 'role', 'initials', 'color', 'image', 'sort', 'active'] },
  builds: { key: 'slug', columns: ['slug', 'image', 'author', 'title', 'likes', 'sort', 'active'] },
  threads: { key: 'slug', columns: ['slug', 'initials', 'title', 'category', 'replies', 'posted_at', 'active'] },
};

const JSON_COLUMNS = new Set(['body', 'meta']);
const getContent = collection => {
  const definition = CONTENT[collection];
  if (!definition) throw new HttpError(404, 'Unknown content collection');
  return definition;
};
const fromDb = row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
  key,
  JSON_COLUMNS.has(key) && typeof value === 'string' ? JSON.parse(value) : value,
]));
const toDb = (key, value) => JSON_COLUMNS.has(key)
  ? JSON.stringify(value ?? (key === 'body' ? [] : {}))
  : typeof value === 'boolean' ? Number(value) : value;
const cleanContent = (definition, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'Content must be a JSON object');
  const result = {};
  for (const column of definition.columns) {
    if (Object.prototype.hasOwnProperty.call(data, column)) result[column] = toDb(column, data[column]);
  }
  if (!result[definition.key]) throw new HttpError(400, `${definition.key} is required`);
  return result;
};

export function adminRoutes(db, token) {
  const r = Router();
  r.use(requireAdmin(token));
  const count = sql => db.prepare(sql).get().n;

  r.get('/summary', (req, res) => {
    const open = type => count(`SELECT COUNT(*) AS n FROM submissions WHERE type = '${type}' AND status = 'new'`);
    res.json({
      orders: count("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'"),
      rsvps: count('SELECT COUNT(*) AS n FROM rsvps'),
      consultation: open('consultation'),
      contact: open('contact'),
      clinic: open('clinic'),
      members: count('SELECT COUNT(*) AS n FROM members'),
      subscribers: count('SELECT COUNT(*) AS n FROM subscribers'),
    });
  });

  r.get('/submissions', (req, res) => {
    const type = typeof req.query.type === 'string' ? req.query.type : '';
    const rows = db.prepare("SELECT id, type, data, status, created_at FROM submissions WHERE (? = '' OR type = ?) ORDER BY id DESC LIMIT 500").all(type, type);
    res.json(rows.map(s => ({ ...s, data: JSON.parse(s.data) })));
  });

  r.patch('/submissions/:id', validate(schemas.submissionStatus, { honeypot: false }), (req, res) => {
    const info = db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(req.data.status, Number(req.params.id));
    if (!info.changes) throw new HttpError(404, 'Submission not found');
    res.json({ ok: true });
  });

  r.patch('/orders/:id', validate(schemas.orderStatus, { honeypot: false }), (req, res) => {
    const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.data.status, Number(req.params.id));
    if (!info.changes) throw new HttpError(404, 'Order not found');
    res.json({ ok: true });
  });

  r.get('/content/:collection', (req, res) => {
    const definition = getContent(req.params.collection);
    const rows = db.prepare(`SELECT ${definition.columns.join(', ')} FROM ${req.params.collection} ORDER BY rowid DESC`).all();
    res.json(rows.map(fromDb));
  });

  r.post('/content/:collection', (req, res) => {
    const definition = getContent(req.params.collection);
    const data = cleanContent(definition, req.body?.data);
    const columns = Object.keys(data);
    const values = columns.map(column => data[column]);
    const placeholders = columns.map(() => '?').join(', ');
    const updates = columns.filter(column => column !== definition.key).map(column => `${column} = excluded.${column}`).join(', ');
    const statement = `INSERT INTO ${req.params.collection} (${columns.join(', ')}) VALUES (${placeholders})
      ON CONFLICT(${definition.key}) DO UPDATE SET ${updates || `${definition.key} = excluded.${definition.key}`}`;
    db.prepare(statement).run(...values);
    res.status(201).json({ ok: true, item: fromDb(db.prepare(`SELECT ${definition.columns.join(', ')} FROM ${req.params.collection} WHERE ${definition.key} = ?`).get(data[definition.key])) });
  });

  r.patch('/content/:collection/:key', (req, res) => {
    const definition = getContent(req.params.collection);
    const data = cleanContent(definition, { ...req.body?.data, [definition.key]: decodeURIComponent(req.params.key) });
    const columns = Object.keys(data).filter(column => column !== definition.key);
    if (!columns.length) throw new HttpError(400, 'No content changes supplied');
    const values = columns.map(column => data[column]);
    const info = db.prepare(`UPDATE ${req.params.collection} SET ${columns.map(column => `${column} = ?`).join(', ')} WHERE ${definition.key} = ?`)
      .run(...values, data[definition.key]);
    if (!info.changes) throw new HttpError(404, 'Content item not found');
    res.json({ ok: true });
  });

  r.delete('/content/:collection/:key', (req, res) => {
    const definition = getContent(req.params.collection);
    const info = db.prepare(`UPDATE ${req.params.collection} SET active = 0 WHERE ${definition.key} = ?`)
      .run(decodeURIComponent(req.params.key));
    if (!info.changes) throw new HttpError(404, 'Content item not found');
    res.json({ ok: true });
  });

  r.post('/uploads', (req, res) => {
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.data || ''));
    if (!match) throw new HttpError(400, 'Upload must be a JPEG, PNG, WebP, or GIF image');
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new HttpError(413, 'Images must be smaller than 5 MB');
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[match[1]];
    fs.mkdirSync(config.uploadDir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(config.uploadDir, filename), buffer);
    res.status(201).json({ url: `/uploads/${filename}` });
  });

  r.get('/:list', (req, res) => {
    const sql = LISTS[req.params.list];
    if (!sql) throw new HttpError(404, 'Unknown list');
    const rows = db.prepare(sql).all();
    res.json(req.params.list === 'orders' ? rows.map(o => ({ ...o, items: JSON.parse(o.items) })) : rows);
  });

  return r;
}