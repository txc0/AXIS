import crypto from 'node:crypto';

export function requireAdmin(token) {
  return (req, res, next) => {
    if (!token) return res.status(503).json({ error: 'Admin is disabled. Set ADMIN_TOKEN on the server.' });
    const given = Buffer.from((req.get('authorization') || '').replace(/^Bearer\s+/i, ''));
    const expected = Buffer.from(token);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      return res.status(401).json({ error: 'Wrong admin token.' });
    }
    next();
  };
}