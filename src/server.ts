/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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

import { ENV } from './config/environments.js';
import { connectDatabase } from './config/database.js';
import { uploadBodyLimit } from './middleware/upload-limit.middleware.js';
import { registerRoutes } from './server/route-registry.js';
import { startAdamReflectionScheduler } from './qxk24brain/adam-reflection-scheduler.js';
import { startAdamAtomicRecoveryScheduler } from './qxk24brain/adam-atomic-recovery.scheduler.js';
import { startAdamIntegrityScheduler } from './qxk24brain/adam-integrity-scheduler.js';
import { startAdamRedundancyScheduler } from './qxk24brain/adam-redundancy.scheduler.js';
import { startAdamJournalBatchScheduler } from './adam/adam-journal-batch.scheduler.js';
import { connectConcurrencyRedis, disconnectConcurrencyRedis } from './qxk24brain/adam-concurrency.service.js';
import { initStudentRegistry } from './adam/adam-student.service.js';
import { initPlatformSettings } from './adam/adam-platform-settings.service.js';
import { initLlmPipeline } from './llm-pipeline/llm-pipeline.service.js';

const app = new Hono();

// ── Security Headers ──────────────────────────────────────
// cross-origin: allow alamtologi.com → api.alamtologi.com fetch (same-site but not same-origin)
app.use('*', secureHeaders({
  crossOriginResourcePolicy: 'cross-origin',
}));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = ENV.CORS_ORIGINS.split(',').map(o => o.trim());

app.use('*', cors({
  origin:      allowedOrigins,
  credentials: true,
  allowMethods:  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders:  [
    'Content-Type',
    'Authorization',
    'Accept',
    'Cache-Control',
    'Pragma',
    'X-App-Source',
    'X-QXK24-Kernel',
    'X-Request-ID',
    'X-Founder-Key',
    'X-QMS-Token',
    'X-Adam-Guest-Id',
  ],
}));

// ── Logger ────────────────────────────────────────────────
app.use('*', logger());

// ── Upload / body size limit (default 100MB) ──────────────
app.use('*', uploadBodyLimit);

// ── Constitutional Response Headers ───────────────────────
app.use('*', async (c, next) => {
  try {
    await next();
    c.res.headers.set('X-QXK24-Kernel',  ENV.QXK24_KERNEL_VERSION);
    c.res.headers.set('X-QXK24-Era',     ENV.QXK24_ERA);
    c.res.headers.set('X-QXK24-Stack',   ENV.QXK24_STACK);
    c.res.headers.set('X-LLM-Provider',  ENV.LLM_PROVIDER);

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ── Routes ────────────────────────────────────────────────
registerRoutes(app);

// ── Global Error Handler ──────────────────────────────────
app.onError((err, c) => {
  console.error('[ALAMTOLOGI] Unhandled error:', err.message);
  return c.json({
    success: false,
    error:   ENV.IS_PRODUCTION
      ? 'Internal constitutional error.'
      : err.message,
    kernel:  'ALAMTOLOGI',
    version: ENV.QXK24_KERNEL_VERSION
  }, 500);
});

// ── Bootstrap ─────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    await initPlatformSettings();
    await initLlmPipeline();
    await initStudentRegistry();
    await connectConcurrencyRedis();
    startAdamReflectionScheduler();
    startAdamAtomicRecoveryScheduler();
    startAdamIntegrityScheduler();
    startAdamRedundancyScheduler();
    startAdamJournalBatchScheduler();

    serve({ fetch: app.fetch, port: ENV.PORT }, () => {

    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ALAMTOLOGI] Bootstrap failed:', msg);
    process.exit(1);
  }
}

// ── Graceful Shutdown ─────────────────────────────────────
process.on('SIGTERM', async () => {
  try {

    await disconnectConcurrencyRedis();
    process.exit(0);

  } catch (err) {
    console.error(err);
    throw err;
  }});

process.on('SIGINT', async () => {
  try {

    await disconnectConcurrencyRedis();
    process.exit(0);

  } catch (err) {
    console.error(err);
    throw err;
  }});

process.on('unhandledRejection', (reason) => {
  console.error('[ALAMTOLOGI] Unhandled rejection:', reason);
});

bootstrap();

export default app;
