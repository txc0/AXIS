import { Router } from 'express';
import { contentRoutes } from './content.js';
import { formRoutes } from './forms.js';
import { adminRoutes } from './admin.js';

export function apiRouter(db, { adminToken }) {
  const r = Router();
  r.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  r.get('/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ ok: true, time: new Date().toISOString() });
  });

  r.use(contentRoutes(db));
  r.use(formRoutes(db));
  r.use('/admin', adminRoutes(db, adminToken));
  r.use((req, res) => res.status(404).json({ error: 'Not found' }));
  return r;
}