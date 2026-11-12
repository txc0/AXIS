import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.js';

export function createApp({
  db,
  adminToken = config.adminToken,
  serveClient = fs.existsSync(path.join(config.clientDist, 'index.html')),
  log = true,
}) {
  const app = express();
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: null, // HTTPS is handled by the reverse proxy
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  if (log) {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        if (req.path.startsWith('/api')) console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
      });
      next();
    });
  }

  app.use('/uploads', express.static(config.uploadDir, { immutable: true, maxAge: '1y' }));
  app.use('/api', express.json({ limit: '8mb' }), apiRouter(db, { adminToken }));

  if (serveClient) {
    const dist = config.clientDist;
    app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(dist, { index: false, maxAge: '7d' }));
    // Single-page app: every non-API URL returns index.html and the client router takes over.
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}