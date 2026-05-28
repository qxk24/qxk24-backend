/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Main Server Entry
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';

import { ENV } from './config/environments';
import { connectDatabase } from './config/database';
import { registerRoutes } from './server/route-registry';

const app = new Hono();

// ── Security Headers ──────────────────────────────────────
app.use('*', secureHeaders());

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = ENV.CORS_ORIGINS.split(',').map(o => o.trim());

app.use('*', cors({
  origin:      allowedOrigins,
  credentials: true,
  allowMethods:  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders:  [
    'Content-Type',
    'Authorization',
    'X-App-Source',
    'X-QXK24-Kernel',
    'X-Request-ID',
    'X-Founder-Key',
    'X-QMS-Token'
  ]
}));

// ── Logger ────────────────────────────────────────────────
app.use('*', logger());

// ── Constitutional Response Headers ───────────────────────
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-QXK24-Kernel',  ENV.QXK24_KERNEL_VERSION);
  c.res.headers.set('X-QXK24-Era',     ENV.QXK24_ERA);
});

// ── Routes ────────────────────────────────────────────────
registerRoutes(app);

// ── Global Error Handler ──────────────────────────────────
app.onError((err, c) => {
  console.error('[QXK24] Unhandled error:', err.message);
  return c.json({
    success: false,
    error:   ENV.IS_PRODUCTION
      ? 'Internal constitutional error.'
      : err.message,
    kernel:  'QXK24',
    version: ENV.QXK24_KERNEL_VERSION
  }, 500);
});

// ── Bootstrap ─────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    serve({ fetch: app.fetch, port: ENV.PORT }, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║       QXK24 Constitutional Backend          ║');
      console.log(`║  Kernel  : ${ENV.QXK24_KERNEL_VERSION}                        ║`);
      console.log(`║  Era     : ${ENV.QXK24_ERA}                          ║`);
      console.log(`║  Port    : ${ENV.PORT}                              ║`);
      console.log(`║  Env     : ${ENV.NODE_ENV}                   ║`);
      console.log('║  Domain  : api.qxk24.com                    ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[QXK24] Bootstrap failed:', msg);
    process.exit(1);
  }
}

// ── Graceful Shutdown ─────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[QXK24] SIGTERM — shutting down gracefully.');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[QXK24] SIGINT — shutting down gracefully.');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('[QXK24] Unhandled rejection:', reason);
});

bootstrap();

export default app;
