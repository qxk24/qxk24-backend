/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Route Registry
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
import { constitutionalRoutes } from '../routes/constitutional/constitutional.routes';
import adamAuthRoutes from '../routes/adam/adam-auth.routes';
import adamChatRoutes from '../routes/adam/adam-chat.routes';
import adamDeterminationRoutes from '../routes/adam/adam-determination.routes';
import adamJournalRoutes from '../routes/adam/adam-journal.routes';
import adamSuccessionRoutes from '../routes/adam/adam-succession.routes';
import { ENV } from '../config/environments';

export function registerRoutes(app: Hono): void {

  // ── Health (public) ──────────────────────────────────
  app.get('/health', (c) => {
    return c.json({
      status:    'operational',
      kernel:    'QXK24',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      eraName:   ENV.QXK24_ERA_NAME,
      timestamp: new Date().toISOString(),
      domain:    'api.qxk24.com'
    });
  });

  // ── Constitutional ────────────────────────────────────
  app.route('/api/constitutional', constitutionalRoutes);
  app.route('/api/adam/auth',          adamAuthRoutes);
  app.route('/api/adam/chat',          adamChatRoutes);
  app.route('/api/adam/determination', adamDeterminationRoutes);
  app.route('/api/adam/journal',       adamJournalRoutes);
  app.route('/api/adam/succession',    adamSuccessionRoutes);

  // ── 404 Fallback ─────────────────────────────────────
  app.notFound((c) => {
    return c.json({
      success: false,
      error:   'Route not found.',
      kernel:  'QXK24',
      version: ENV.QXK24_KERNEL_VERSION
    }, 404);
  });

  console.log('[QXK24] Routes registered:');
  console.log('  GET  /health');
  console.log('  *    /api/constitutional');
  console.log('  *    /api/adam/auth');
  console.log('  *    /api/adam/chat');
  console.log('  *    /api/adam/determination');
  console.log('  *    /api/adam/journal');
  console.log('  *    /api/adam/succession');
}