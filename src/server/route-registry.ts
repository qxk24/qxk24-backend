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
import adamUploadRoutes from '../routes/adam/adam-upload.routes';
import adamKnowledgeRoutes from '../routes/adam/adam-knowledge.routes';
import { qxk24BrainRoutes } from '../qxk24brain/qxk24brain.routes';
import adamStudentRoutes from '../routes/adam/adam-student.routes';
import adamConsultRoutes from '../routes/adam/adam-consult.routes';
import adamWorkspaceRoutes from '../routes/adam/adam-workspace.routes';
import { ENV } from '../config/environments';

export function registerRoutes(app: Hono): void {

  // ── Health (public) ──────────────────────────────────
  app.get('/health', (c) => {
    return c.json({
      status:      'operational',
      kernel:      'QXK24',
      version:     ENV.QXK24_KERNEL_VERSION,
      era:         ENV.QXK24_ERA,
      eraName:     ENV.QXK24_ERA_NAME,
      stack:       ENV.QXK24_STACK,
      llmProvider: ENV.LLM_PROVIDER,
      timestamp:   new Date().toISOString(),
      domain:      'api.qxk24.com',
    });
  });

  // ── Constitutional ────────────────────────────────────
  app.route('/api/constitutional', constitutionalRoutes);
  app.route('/api/adam/auth',          adamAuthRoutes);
  app.route('/api/adam/chat',          adamChatRoutes);
  app.route('/api/adam/upload',        adamUploadRoutes);
  app.route('/api/adam/knowledge',     adamKnowledgeRoutes);
  app.route('/api/adam/brain',         qxk24BrainRoutes);
  app.route('/api/adam/student',       adamStudentRoutes);
  app.route('/api/adam/consults',      adamConsultRoutes);
  app.route('/api/adam/determination', adamDeterminationRoutes);
  app.route('/api/adam/journal',       adamJournalRoutes);
  app.route('/api/adam/succession',    adamSuccessionRoutes);
  app.route('/api/workspaces',         adamWorkspaceRoutes);

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
  console.log('  GET  /api/adam/chat/history/:sessionId');
  console.log('  GET  /api/adam/auth/session');
  console.log('  POST /api/adam/upload');
  console.log('  *    /api/adam/knowledge');
  console.log('  *    /api/adam/brain');
  console.log('  *    /api/adam/student');
  console.log('  *    /api/adam/consults');
  console.log('  *    /api/adam/determination');
  console.log('  *    /api/adam/journal');
  console.log('  *    /api/adam/succession');
  console.log('  *    /api/workspaces');
}