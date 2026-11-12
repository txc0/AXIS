import { Router } from 'express';
import { HttpError } from '../lib/http-error.js';
import { validate } from '../middleware/validate.js';
import { likeLimiter } from '../middleware/rate-limit.js';
import { schemas, PAYMENTS } from '../schemas.js';

const parse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };
const cache = res => res.set('Cache-Control', 'public, max-age=60');

export function contentRoutes(db) {
  const r = Router();
  const q = {
    products: db.prepare('SELECT slug, name, price, image, category, description FROM products WHERE active = 1 ORDER BY sort'),
    options: db.prepare('SELECT grp, key, name, price, wet, meta FROM builder_options WHERE active = 1 ORDER BY grp, sort'),
    projects: db.prepare('SELECT slug, name, location, year, type, area, status, art, bg, summary, body FROM projects WHERE active = 1 ORDER BY sort'),
    articles: db.prepare('SELECT slug, title, category, published_at, minutes, image, excerpt, featured FROM articles WHERE active = 1 ORDER BY featured DESC, published_at DESC'),
    article: db.prepare('SELECT slug, title, category, published_at, minutes, image, excerpt, body FROM articles WHERE active = 1 AND slug = ?'),
    events: db.prepare(`SELECT e.slug, e.starts_at, e.title, e.details, e.seats,
      e.seats - COALESCE((SELECT SUM(seats) FROM rsvps r WHERE r.event_slug = e.slug), 0) AS seats_left
      FROM events e WHERE e.active = 1 ORDER BY e.starts_at`),
    team: db.prepare('SELECT slug, name, role, initials, color, image FROM team WHERE active = 1 ORDER BY sort'),
    builds: db.prepare('SELECT slug, image, author, title, likes FROM builds WHERE active = 1 ORDER BY sort'),
    threads: db.prepare('SELECT slug, initials, title, category, replies, posted_at FROM threads WHERE active = 1 ORDER BY posted_at DESC'),
    members: db.prepare('SELECT COUNT(*) AS n FROM members'),
    like: db.prepare('UPDATE builds SET likes = MAX(0, likes + ?) WHERE slug = ? AND active = 1'),
    likes: db.prepare('SELECT likes FROM builds WHERE slug = ?'),
  };
  // Events stay visible until three hours after they start.
  const upcoming = () => q.events.all().filter(e => new Date(e.starts_at).getTime() > Date.now() - 3 * 3600e3);
  const project = p => ({ ...p, body: parse(p.body, []) });

  r.get('/catalog', (req, res) => {
    const builder = { vessel: [], land: [], plant: [], accent: [] };
    for (const o of q.options.all()) {
      (builder[o.grp] ||= []).push({ key: o.key, name: o.name, price: o.price, wet: !!o.wet, ...parse(o.meta, {}) });
    }
    cache(res).json({ products: q.products.all(), builder, payments: PAYMENTS });
  });

  r.get('/projects', (req, res) => cache(res).json(q.projects.all().map(project)));
  r.get('/projects/:slug', (req, res) => {
    const all = q.projects.all();
    const i = all.findIndex(p => p.slug === req.params.slug);
    if (i < 0) throw new HttpError(404, 'Project not found');
    const next = all[(i + 1) % all.length];
    cache(res).json({ ...project(all[i]), next: { slug: next.slug, name: next.name } });
  });

  r.get('/articles', (req, res) => cache(res).json(q.articles.all().map(a => ({ ...a, featured: !!a.featured }))));
  r.get('/articles/:slug', (req, res) => {
    const a = q.article.get(req.params.slug);
    if (!a) throw new HttpError(404, 'Article not found');
    const others = q.articles.all().filter(x => x.slug !== a.slug);
    const related = [...others.filter(x => x.category === a.category), ...others.filter(x => x.category !== a.category)].slice(0, 3);
    cache(res).json({ article: { ...a, body: parse(a.body, []) }, related });
  });

  r.get('/events', (req, res) => res.json(upcoming()));
  r.get('/team', (req, res) => cache(res).json(q.team.all()));
  r.get('/community', (req, res) => res.json({
    members: q.members.get().n,
    builds: q.builds.all(),
    threads: q.threads.all(),
    events: upcoming(),
  }));

  r.post('/builds/:slug/like', likeLimiter, validate(schemas.like), (req, res) => {
    const info = q.like.run(req.data.liked ? 1 : -1, req.params.slug);
    if (!info.changes) throw new HttpError(404, 'Build not found');
    res.json({ likes: q.likes.get(req.params.slug).likes });
  });

  return r;
}