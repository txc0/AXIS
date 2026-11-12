import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db/index.js';
import { seed } from '../src/db/seed.js';
import { createApp } from '../src/app.js';

let server, base, db;

before(async () => {
  db = openDb(':memory:');
  seed(db, { log: () => {} });
  const app = createApp({ db, adminToken: 'test-token', serveClient: false, log: false });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => new Promise(resolve => server.close(() => { db.close(); resolve(); })));

const call = (method, url, body, headers = {}) =>
  fetch(base + url, { method, headers: { 'content-type': 'application/json', ...headers }, body: body && JSON.stringify(body) });

test('health check responds', async () => {
  assert.equal((await call('GET', '/health')).status, 200);
});

test('catalog lists products and builder options', async () => {
  const c = await (await call('GET', '/catalog')).json();
  assert.ok(c.products.length > 0);
  assert.ok(c.builder.vessel.length > 0);
  assert.ok(c.payments.includes('Cash on delivery'));
});

test('orders are priced by the server, not the browser', async () => {
  const res = await call('POST', '/orders', {
    customer: { name: 'Test', phone: '01700000000', address: 'Dhanmondi', payment: 'Cash on delivery' },
    items: [
      { kind: 'product', slug: 'zen-stone-garden', price: 1 },
      { kind: 'custom', config: { vessel: 'jar', land: 'forest', plants: ['fern'], accents: ['led'] } },
    ],
  });
  assert.equal(res.status, 201);
  const order = await res.json();
  assert.equal(order.total, 135 + 60 + 25 + 28 + 20);
  assert.match(order.code, /^AX-\d+$/);
  assert.equal((await call('GET', `/orders/${order.code}?phone=017-0000-0000`)).status, 200);
  assert.equal((await call('GET', `/orders/${order.code}?phone=01800000000`)).status, 404);
});

test('unknown products are rejected', async () => {
  const res = await call('POST', '/orders', {
    customer: { name: 'Test', phone: '01700000000', address: 'Dhaka', payment: 'Cash on delivery' },
    items: [{ kind: 'product', slug: 'does-not-exist' }],
  });
  assert.equal(res.status, 409);
});

test('custom terrariums require a plant', async () => {
  const res = await call('POST', '/cart/quote', {
    items: [{ kind: 'custom', config: { vessel: 'jar', land: 'forest', plants: [], accents: [] } }],
  });
  assert.equal(res.status, 400);
});

test('events cannot be overbooked', async () => {
  db.prepare("INSERT INTO events (slug, starts_at, title, details, seats) VALUES ('test-event', ?, 'Test', '', 4)")
    .run(new Date(Date.now() + 864e5).toISOString());
  const book = seats => call('POST', '/events/test-event/rsvp', { name: 'A', phone: '01700000000', seats });
  assert.equal((await book(3)).status, 201);
  assert.equal((await book(2)).status, 409);
  assert.equal((await book(1)).status, 201);
  assert.equal((await book(1)).status, 409);
});

test('honeypot submissions are accepted but not saved', async () => {
  const before = db.prepare('SELECT COUNT(*) n FROM submissions').get().n;
  const res = await call('POST', '/contact', { name: 'Bot', email: 'bot@x.com', message: 'spam', website: 'http://spam' });
  assert.equal(res.status, 201);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM submissions').get().n, before);
});

test('admin endpoints require the token', async () => {
  assert.equal((await call('GET', '/admin/summary')).status, 401);
  assert.equal((await call('GET', '/admin/summary', null, { authorization: 'Bearer test-token' })).status, 200);
});

test('admin can manage website content', async () => {
  const headers = { authorization: 'Bearer test-token' };
  const created = await call('POST', '/admin/content/products', {
    data: { slug: 'admin-test', name: 'Admin test', price: 10, image: 'pr0', category: 'plants', description: 'Created in admin' },
  }, headers);
  assert.equal(created.status, 201);
  const updated = await call('PATCH', '/admin/content/products/admin-test', {
    data: { name: 'Updated in admin', description: 'Edited in admin', active: true },
  }, headers);
  assert.equal(updated.status, 200);
  assert.equal(db.prepare("SELECT name FROM products WHERE slug = 'admin-test'").get().name, 'Updated in admin');
  const hidden = await call('DELETE', '/admin/content/products/admin-test', null, headers);
  assert.equal(hidden.status, 200);
  assert.equal(db.prepare("SELECT active FROM products WHERE slug = 'admin-test'").get().active, 0);
});