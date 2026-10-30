import express from 'express';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { catalogRouter } from './routes/catalog.js';
import { authRouter } from './routes/auth.js';
import { shopRouter } from './routes/shop.js';
import { adminRouter } from './routes/admin.js';
import { addressRouter } from './routes/addresses.js';
import { errorHandler, notFound } from './middleware/errors.js';

export const app = express();
app.disable('x-powered-by');
app.use((request, response, next) => {
  response.set('X-Content-Type-Options', 'nosniff');
  response.vary('Origin');
  if (request.headers.origin === env.frontendOrigin) {
    response.set('Access-Control-Allow-Origin', env.frontendOrigin);
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use((req,res,next) => {
  if (['POST','PUT','PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Yêu cầu phải chứa JSON object.' } });
  next();
});
app.use('/api', apiRouter);
app.use('/api', catalogRouter);
app.use('/api', addressRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', (req,res,next) => {
  if (/^\/(cart|orders)(\/|$)/.test(req.path) || /^\/products\/\d+\/reviews$/.test(req.path)) return shopRouter(req,res,next);
  next();
});
app.use(notFound);
app.use(errorHandler);