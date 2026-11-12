import { Router } from 'express';
import { HttpError } from '../lib/http-error.js';
import { validate } from '../middleware/validate.js';
import { formLimiter, lookupLimiter } from '../middleware/rate-limit.js';
import { createPricer } from '../services/pricing.js';
import { notifyFormSubmission } from '../services/mail.js';
import { schemas } from '../schemas.js';

const normPhone = s => String(s || '').replace(/[^\d+]/g, '');

export function formRoutes(db) {
  const r = Router();
  const pricer = createPricer(db);
  const q = {
    submission: db.prepare('INSERT INTO submissions (type, data) VALUES (?, ?)'),
    subscribe: db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)'),
    member: db.prepare('INSERT INTO members (email, name) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name'),
    order: db.prepare('INSERT INTO orders (name, phone, address, payment, items, total) VALUES (@name, @phone, @address, @payment, @items, @total)'),
    orderCode: db.prepare('UPDATE orders SET code = ? WHERE id = ?'),
    findOrder: db.prepare('SELECT code, phone, items, total, status, created_at FROM orders WHERE code = ?'),
    event: db.prepare('SELECT seats FROM events WHERE slug = ? AND active = 1'),
    taken: db.prepare('SELECT COALESCE(SUM(seats), 0) AS n FROM rsvps WHERE event_slug = ?'),
    rsvp: db.prepare('INSERT INTO rsvps (event_slug, name, phone, seats) VALUES (?, ?, ?, ?)'),
  };

  // Generic "save this form" endpoints. The admin panel lists them by type.
  for (const [path, type] of [['/consultations', 'consultation'], ['/contact', 'contact'], ['/clinic', 'clinic']]) {
    r.post(path, formLimiter, validate(schemas[type]), (req, res) => {
      q.submission.run(type, JSON.stringify(req.data));
      void notifyFormSubmission(type, req.data).catch(error => {
        console.error(`Could not send ${type} notification email:`, error.message);
      });
      res.status(201).json({ ok: true });
    });
  }

  r.post('/subscribe', formLimiter, validate(schemas.subscribe), (req, res) => {
    q.subscribe.run(req.data.email);
    res.status(201).json({ ok: true });
  });

  r.post('/members', formLimiter, validate(schemas.member), (req, res) => {
    q.member.run(req.data.email, req.data.name);
    res.status(201).json({ ok: true });
  });

  r.post('/cart/quote', lookupLimiter, validate(schemas.cart, { honeypot: false }), (req, res) => {
    res.json(pricer.quote(req.data.items));
  });

  const createOrder = db.transaction((customer, lines, total) => {
    const { lastInsertRowid: id } = q.order.run({ ...customer, items: JSON.stringify(lines), total });
    const code = `AX-${1000 + Number(id)}`;
    q.orderCode.run(code, id);
    return code;
  });

  r.post('/orders', formLimiter, validate(schemas.order, { honeypot: false }), (req, res) => {
    const { lines, total } = pricer.quote(req.data.items);
    if (lines.some(l => !l.valid)) throw new HttpError(409, 'Some items are no longer available. Please review your cart.');
    const saved = lines.map(({ index, valid, ...line }) => line);
    const code = createOrder(req.data.customer, saved, total);
    res.status(201).json({ code, total });
  });

  r.get('/orders/:code', lookupLimiter, (req, res) => {
    const o = q.findOrder.get(String(req.params.code).trim().toUpperCase());
    if (!o || !req.query.phone || normPhone(o.phone) !== normPhone(req.query.phone)) {
      throw new HttpError(404, 'We could not find an order with that number and phone.');
    }
    res.json({ code: o.code, status: o.status, total: o.total, created_at: o.created_at, items: JSON.parse(o.items).map(i => i.name) });
  });

  // A transaction so two people cannot grab the last seat at the same time.
  const book = db.transaction((slug, { name, phone, seats }) => {
    const ev = q.event.get(slug);
    if (!ev) throw new HttpError(404, 'Event not found.');
    const left = ev.seats - q.taken.get(slug).n;
    if (seats > left) throw new HttpError(409, left > 0 ? `Only ${left} seat(s) left.` : 'This event is fully booked.');
    q.rsvp.run(slug, name, phone, seats);
    return left - seats;
  });

  r.post('/events/:slug/rsvp', formLimiter, validate(schemas.rsvp), (req, res) => {
    const left = book(req.params.slug, req.data);
    res.status(201).json({ ok: true, seats_left: left });
  });

  return r;
}