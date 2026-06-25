/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
import adamJournalWriteRoutes from '../routes/adam/adam-journal-write.routes';
import adamSuccessionRoutes from '../routes/adam/adam-succession.routes';
import adamUploadRoutes from '../routes/adam/adam-upload.routes';
import adamKnowledgeRoutes from '../routes/adam/adam-knowledge.routes';
import { qxk24BrainRoutes } from '../qxk24brain/qxk24brain.routes';
import adamStudentRoutes from '../routes/adam/adam-student.routes';
import adamGuruRoutes from '../routes/adam/adam-guru.routes';
import adamPublicRoutes from '../routes/adam/adam-public.routes';
import adamMediaRoutes from '../routes/adam/adam-media.routes';
import adamServerRoutes from '../routes/adam/adam-server.routes';
import adamStudentsRoutes from '../routes/adam/adam-students.routes';
import adamConsultRoutes from '../routes/adam/adam-consult.routes';
import adamFounderRoutes from '../routes/adam/adam-founder.routes';
import adamWorkspaceRoutes from '../routes/adam/adam-workspace.routes';
import subscriptionRoutes from '../subscriptions/subscription.routes';
import rdAppliedRoutes from '../routes/rd/rd-applied.routes';
import rdIndustryRoutes from '../routes/rd/rd-industry.routes';
import adamBuilderRoutes from '../agent/adam-builder.routes';
import adamMacBridgeRoutes from '../agent/adam-mac-bridge.routes';
import adamBlogRoutes from '../routes/adam/adam-blog.routes';
import adamTesterRoutes from '../routes/adam/adam-tester.routes';
import niagaRoutes from '../routes/niaga/niaga.routes';
import adamTutorRegisterRoutes from '../routes/adam/adam-tutor-register.routes';
import platformAdminRoutes from '../routes/admin/platform-admin.routes';
import adamExportRoutes from '../routes/adam/adam-export.routes';
import teachingBridgeRoutes from '../teaching-bridge/teaching-bridge.routes';
import llmPipelineRoutes from '../llm-pipeline/llm-pipeline.routes';
import { ENV } from '../config/environments';
import { PLATFORM_KERNEL } from '../config/platform-identity';
import {
  getSystemPulse,
  runOperationalMemoryHealth,
} from '../health/adam-system-health.service';
import { amaNeuroRoutes } from '../lib/ama/ama-neuro.routes';
import {
  getAmaNeuroHealthSnapshot,
  isNeuroValidationGatePassed,
} from '../lib/ama/ama-neuro-validation.service';
import {
  isAmaBrainV2Enabled,
  isAmaNeuroValidationEnabled,
  isAmaTamatOassEnabled,
} from '../lib/ama/ama.config';

export function registerRoutes(app: Hono): void {

  // ── Health (public) ──────────────────────────────────
  app.get('/health', (c) => {
    return c.json({
      status:      'operational',
      kernel:      PLATFORM_KERNEL,
      version:     ENV.QXK24_KERNEL_VERSION,
      era:         ENV.QXK24_ERA,
      eraName:     ENV.QXK24_ERA_NAME,
      stack:       ENV.QXK24_STACK,
      llmProvider: ENV.LLM_PROVIDER,
      timestamp:   new Date().toISOString(),
      domain:      'api.alamtologi.com',
      ama: isAmaBrainV2Enabled()
        ? {
            tamatOass:       isAmaTamatOassEnabled(),
            neuroValidation: isAmaNeuroValidationEnabled(),
            ...getAmaNeuroHealthSnapshot(),
          }
        : { brainV2: false, gatePassed: false },
    });
  });

  app.get('/health/pulse', (c) => c.json(getSystemPulse()));

  app.get('/health/memory', async (c) => {
    const report = await runOperationalMemoryHealth();
    const httpStatus = report.overall === 'critical' ? 503
      : report.overall === 'degraded' ? 207
      : 200;
    return c.json(report, httpStatus);
  });

  /** V8 process heap — for upload/OOM ops (distinct from constitutional /health/memory). */
  app.get('/health/heap', (c) => {
    const m = process.memoryUsage();
    const heap_used = m.heapUsed;
    const heap_total = m.heapTotal;
    const ratio = heap_total > 0 ? heap_used / heap_total : 0;
    const status = ratio > 0.92 ? 'critical' : ratio > 0.8 ? 'warn' : 'ok';
    return c.json({
      status,
      heap_used,
      heap_total,
      ratio:     Math.round(ratio * 1000) / 1000,
      rss:       m.rss,
      external:  m.external,
      arrayBuffers: m.arrayBuffers,
      timestamp: new Date().toISOString(),
    }, status === 'critical' ? 503 : 200);
  });

  // ── Constitutional ────────────────────────────────────
  app.route('/api/constitutional', constitutionalRoutes);
  app.route('/api/adam/auth',          adamAuthRoutes);
  app.route('/api/adam/chat',          adamChatRoutes);
  app.route('/api/adam/export',        adamExportRoutes);
  app.route('/api/adam/upload',        adamUploadRoutes);
  app.route('/api/adam/knowledge',     adamKnowledgeRoutes);
  app.route('/api/adam/brain',         qxk24BrainRoutes);
  app.route('/api/adam/ama/neuro',     amaNeuroRoutes);
  app.route('/api/adam/teaching-bridge', teachingBridgeRoutes);
  app.route('/api/adam/llm-pipeline', llmPipelineRoutes);
  app.route('/api/adam/public',        adamPublicRoutes);
  app.route('/api/adam/media',         adamMediaRoutes);
  app.route('/api/adam/servers',       adamServerRoutes);
  app.route('/api/adam/student',       adamStudentRoutes);
  app.route('/api/adam/tutor',         adamTutorRegisterRoutes);
  app.route('/api/adam/guru',          adamGuruRoutes);
  app.route('/api/adam/students',      adamStudentsRoutes);
  app.route('/api/adam/consults',      adamConsultRoutes);
  app.route('/api/adam/founder',       adamFounderRoutes);
  app.route('/api/adam/determination', adamDeterminationRoutes);
  app.route('/api/adam/journal',       adamJournalRoutes);
  app.route('/api/adam/journal/write', adamJournalWriteRoutes);
  app.route('/api/adam/blog',          adamBlogRoutes);
  app.route('/api/adam/tester',        adamTesterRoutes);
  app.route('/api/niaga',              niagaRoutes);
  app.route('/api/admin',              platformAdminRoutes);
  app.route('/api/adam/succession',    adamSuccessionRoutes);
  app.route('/api/workspaces',         adamWorkspaceRoutes);
  app.route('/api/subscriptions',    subscriptionRoutes);
  app.route('/api/rd',               rdAppliedRoutes);
  app.route('/api/rd/industry',      rdIndustryRoutes);
  app.route('/api/adam/agent',       adamBuilderRoutes);
  app.route('/api/adam/mac-bridge',  adamMacBridgeRoutes);

  // ── 404 Fallback ─────────────────────────────────────
  app.notFound((c) => {
    return c.json({
      success: false,
      error:   'Route not found.',
      kernel:  'ALAMTOLOGI',
      version: ENV.QXK24_KERNEL_VERSION
    }, 404);
  });

  console.log('[ALAMTOLOGI] Routes registered:');
  console.log('  GET  /health');
  console.log('  GET  /health/pulse');
  console.log('  GET  /health/memory');
  console.log('  GET  /health/heap');
  console.log('  *    /api/adam/ama/neuro (founder · Langkah 6)');
  console.log('  *    /api/constitutional');
  console.log('  *    /api/adam/auth');
  console.log('  *    /api/adam/chat');
  console.log('  GET  /api/adam/chat/history/:sessionId');
  console.log('  GET  /api/adam/auth/session');
  console.log('  POST /api/adam/upload');
  console.log('  *    /api/adam/knowledge');
  console.log('  *    /api/adam/brain');
  console.log('  *    /api/adam/public');
  console.log('  *    /api/adam/servers (Layer 2 · Jurnal/Buku/Kod)');
  console.log('  *    /api/adam/student');
  console.log('  *    /api/adam/students');
  console.log('  *    /api/adam/consults');
  console.log('  *    /api/adam/determination');
  console.log('  *    /api/adam/journal');
  console.log('  *    /api/adam/journal/write  (V2 dedicated writing system)');
  console.log('  *    /api/adam/blog');
  console.log('  *    /api/adam/succession');
  console.log('  *    /api/workspaces');
  console.log('  *    /api/subscriptions');
  console.log('  *    /api/rd (R&D & Applied Science checkout)');
  console.log('  *    /api/rd/industry (R&D Industry project + research chat)');
  console.log('  *    /api/adam/agent (lab · founder · Qwen builder)');
}