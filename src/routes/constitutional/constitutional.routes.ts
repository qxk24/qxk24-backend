/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Constitutional Routes
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
import {
  governAction,
  getKernelInfo,
  calculateAHRI
} from '../../services/qxk24/qxk24-constitutional.service';
import { ALAMTOLOGI_PRINCIPLES } from '../../services/qxk24/qxk24.types';
import { getDatabaseStatus } from '../../config/database';
import { requireServiceToken, requireAuth } from '../../middleware/auth.middleware';
import { ENV } from '../../config/environments';
import type { QXK24GovernRequest } from '../../services/qxk24/qxk24.types';

export const constitutionalRoutes = new Hono();

// ── POST /govern ──────────────────────────────────────────
constitutionalRoutes.post('/govern', requireServiceToken, async (c) => {
  try {
    const body = await c.req.json<Partial<QXK24GovernRequest>>();

    if (!body.action || typeof body.action !== 'string') {
      return c.json({ success: false, error: 'action is required.' }, 400);
    }

    const result = await governAction({
      action:        body.action.toUpperCase(),
      context:       body.context ?? {},
      appSource:     c.req.header('X-App-Source') ?? undefined,
      requestId:     c.req.header('X-Request-ID'),
      kernelVersion: ENV.QXK24_KERNEL_VERSION,
      timestamp:     new Date().toISOString()
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── GET /heartbeat ────────────────────────────────────────
constitutionalRoutes.get('/heartbeat', (c) => {
  const db = getDatabaseStatus();
  return c.json({
    success: true,
    data: {
      status:    db.connected ? 'healthy' : 'degraded',
      kernel:    'QXK24',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      eraName:   ENV.QXK24_ERA_NAME,
      uptime:    process.uptime(),
      timestamp: new Date().toISOString(),
      database:  db.state,
      services: {
        constitutional: true,
        journal:        true,
        qms:            true,
        adam:           true
      }
    }
  });
});

// ── GET /status ───────────────────────────────────────────
constitutionalRoutes.get('/status', (c) => {
  const info = getKernelInfo();
  const db   = getDatabaseStatus();
  return c.json({
    success: true,
    data: {
      ...info,
      database:    db,
      uptime:      process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp:   new Date().toISOString()
    }
  });
});

// ── GET /principles ───────────────────────────────────────
constitutionalRoutes.get('/principles', (c) => {
  const principles = Object.entries(ALAMTOLOGI_PRINCIPLES).map(
    ([id, data]) => ({ id, ...data })
  );
  return c.json({
    success: true,
    data: {
      framework:     'Alamtologi',
      founder:       'Masa Bayu',
      principles,
      kernel:        ENV.QXK24_KERNEL_VERSION,
      era:           ENV.QXK24_ERA,
      canonicalDate: '2026-05-28',
      immutable:     true
    }
  });
});

// ── POST /ahri ────────────────────────────────────────────
constitutionalRoutes.post('/ahri', requireServiceToken, async (c) => {
  try {
    const scores = await c.req.json<Partial<Record<string, number>>>();
    const result = calculateAHRI(scores);
    return c.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── POST /audit/sync ──────────────────────────────────────
constitutionalRoutes.post('/audit/sync', requireServiceToken, async (c) => {
  try {
    const { events, sourceApp, batchId } =
      await c.req.json<{
        events?: unknown[];
        sourceApp?: string;
        batchId?: string;
      }>();

    if (!events || !Array.isArray(events)) {
      return c.json({ success: false, error: 'events array required.' }, 400);
    }

    console.log(
      `[QXK24:SYNC] ${events.length} events | ` +
      `src=${sourceApp ?? 'unknown'} | batch=${batchId ?? 'none'}`
    );

    return c.json({
      success: true,
      data: {
        accepted:  events.length,
        rejected:  0,
        batchId:   batchId ?? `SYNC-${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── GET /declaration ──────────────────────────────────────
constitutionalRoutes.get('/declaration', requireAuth, (c) => {
  return c.json({
    success: true,
    data: {
      declaration:
        'QXK24 ensures digital systems serve truth, justice, and human ' +
        'dignity as defined by divine natural law — not corporate, ' +
        'political, or ego-driven interests.',
      founder:     'Masa Bayu',
      institute:   'QXK24 Constitutional Knowledge Institute',
      framework:   'Alamtologi',
      principles:  7,
      era:         ENV.QXK24_ERA,
      eraName:     ENV.QXK24_ERA_NAME,
      kernel:      ENV.QXK24_KERNEL_VERSION,
      declaredAt:  '2026-05-28T00:00:00.000Z',
      immutable:   true
    }
  });
});