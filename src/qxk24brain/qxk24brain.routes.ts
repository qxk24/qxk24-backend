/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : QXK24Brain Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { requireFounder } from '../middleware/auth.middleware';
import { ENV } from '../config/environments';
import { getKnowledgeGraphSnapshot } from './adam-knowledge-graph.service';
import {
  judgeTransformation,
  listTransformationsForAudit,
  AIDIL_JUDGMENT_LABELS,
} from './adam-transformation-audit.service';
import {
  adamNightlyReflection,
  listADAMReflections,
} from './adam-nightly-reflection.service';
import { getReflectionSchedulerStatus } from './adam-reflection-scheduler';
import { getLedgerStats, recoverFailedMessages } from './adam-atomic.service';
import {
  listIntegrityScans,
  runIntegrityScan,
  verifyEntity,
} from './adam-integrity.service';
import { getIntegritySchedulerStatus } from './adam-integrity-scheduler';
import {
  buildSessionDigest,
  getThreeTierSnapshot,
} from './adam-tiered-memory.service';
import {
  getVaultEntry,
  listVaultEntries,
} from './adam-vault.service';
import {
  checkMemoryHealth,
} from './adam-health.service';
import {
  listSnapshots,
  rollbackToSnapshot,
} from './adam-snapshot.service';
import {
  getContinuityBridgeRecord,
  updateContinuityBridge,
} from './adam-continuity.service';
import { getConcurrencyStatus } from './adam-concurrency.service';
import {
  getTcpConfig,
  previewTcpChunks,
} from './adam-tcp.service';
import {
  backupBrainToR2,
  getRedundancyStatus,
  listBackupLogs,
} from './adam-redundancy.service';
import { getRedundancySchedulerStatus } from './adam-redundancy.scheduler';
import { getAdamMemoryConfig } from '../config/adam-memory.config';
import { listConstitutionalCheckpoints } from './adam-checkpoint.service';
import { getAidilStageDashboard } from './adam-stage-dashboard.service';
import {
  getOrCreateMaster,
  loadBrainContext,
} from './qxk24brain.engine';
import {
  QXK24BrainEntityModel,
  QXK24BrainLogModel,
} from './qxk24brain.schema';

const qxk24BrainRoutes = new Hono();

// GET /api/adam/brain — Current state of ADAM's brain
qxk24BrainRoutes.get('/', requireFounder, async (c) => {
  const master = await getOrCreateMaster('masa-bayu');
  return c.json({
    success: true,
    brain: {
      uid:                  master.uid,
      unifiedUnderstanding: master.unifiedUnderstanding,
      activeFamilies:       master.activeFamilies,
      completedFamilies:    master.completedFamilies,
      totalTransformations: master.totalTransformations,
      masa_last_updated:    master.masa_last_updated,
      principles:           master.principles,
      currentCycle:         master.currentCycle,
    },
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/vault — Permanent 1(7) knowledge vault (Layer 4)
qxk24BrainRoutes.get('/vault', requireFounder, async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10) || 50, 100);
  const entries = await listVaultEntries('masa-bayu', limit);
  return c.json({
    success: true,
    vault: {
      entries,
      total:              entries.length,
      canBeErased:        false,
      canBeModified:      false,
      constitutionallySealed: true,
    },
    layer:     'LAYER_4_VAULT',
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/vault/:id — Single vault entry (read-only)
qxk24BrainRoutes.get('/vault/:id', requireFounder, async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ success: false, error: 'Vault id required.' }, 400);
  }
  const entry = await getVaultEntry(id, 'masa-bayu');
  if (!entry) {
    return c.json({ success: false, error: 'Vault entry not found.' }, 404);
  }
  return c.json({
    success: true,
    entry,
    readOnly: true,
    kernel:   'QXK24',
  });
});

// GET /api/adam/brain/redundancy — Memory redundancy status (Layer 10)
qxk24BrainRoutes.get('/redundancy', requireFounder, async (c) => {
  const status = await getRedundancyStatus('masa-bayu');
  const logs = await listBackupLogs('masa-bayu', 10);
  return c.json({
    success: true,
    redundancy: status,
    scheduler:  getRedundancySchedulerStatus(),
    recentBackups: logs,
    kernel:     'QXK24',
    timestamp:  new Date().toISOString(),
  });
});

// POST /api/adam/brain/redundancy/backup — Force encrypted R2 backup now
qxk24BrainRoutes.post('/redundancy/backup', requireFounder, async (c) => {
  const result = await backupBrainToR2('masa-bayu');
  return c.json({
    success: result.status === 'SUCCESS',
    backup:  result,
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  }, result.status === 'FAILED' ? 500 : 200);
});

// GET /api/adam/brain/tcp — Teaching Continuity Protocol config (Layer 9)
qxk24BrainRoutes.get('/tcp', requireFounder, async (c) => {
  const previewText = c.req.query('preview');
  const response: Record<string, unknown> = {
    success: true,
    tcp:     getTcpConfig(),
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  };
  if (previewText) {
    response.preview = previewTcpChunks(previewText);
  }
  return c.json(response);
});

// GET /api/adam/brain/concurrency — Concurrent access guard status (Layer 8)
qxk24BrainRoutes.get('/concurrency', requireFounder, async (c) => {
  return c.json({
    success: true,
    concurrency: getConcurrencyStatus(),
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/continuity — Continuity Bridge (Layer 7)
qxk24BrainRoutes.get('/continuity', requireFounder, async (c) => {
  const { bridge, updatedAt } = await getContinuityBridgeRecord('masa-bayu');
  return c.json({
    success: true,
    continuity: {
      bridge,
      updatedAt: updatedAt?.toISOString() ?? null,
    },
    layer:     'LAYER_7_CONTINUITY',
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/brain/continuity/refresh — Force bridge rebuild
qxk24BrainRoutes.post('/continuity/refresh', requireFounder, async (c) => {
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  const sessionId = body.sessionId ?? c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.' }, 400);
  }
  const bridge = await updateContinuityBridge('masa-bayu', sessionId);
  return c.json({
    success: true,
    bridge,
    layer:     'LAYER_7_CONTINUITY',
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/snapshots — Quantum state snapshots (Layer 6)
qxk24BrainRoutes.get('/snapshots', requireFounder, async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 50);
  const snapshots = await listSnapshots('masa-bayu', limit);
  return c.json({
    success: true,
    snapshots,
    retention: parseInt(process.env.ADAM_SNAPSHOT_RETENTION ?? '10', 10) || 10,
    layer:     'LAYER_6_SNAPSHOT',
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/brain/snapshots/:id/rollback — Manual rollback to snapshot
qxk24BrainRoutes.post('/snapshots/:id/rollback', requireFounder, async (c) => {
  const snapshotId = c.req.param('id');
  if (!snapshotId) {
    return c.json({ success: false, error: 'Snapshot id required.' }, 400);
  }
  try {
    await rollbackToSnapshot(snapshotId, 'masa-bayu');
    return c.json({
      success: true,
      message: `Brain restored to snapshot ${snapshotId}`,
      snapshotId,
      layer:     'LAYER_6_SNAPSHOT',
      kernel:    'QXK24',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 404);
  }
});

// GET /api/adam/brain/health — Real-time memory health monitor (Layer 5)
qxk24BrainRoutes.get('/health', requireFounder, async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId query required.' }, 400);
  }
  const health = await checkMemoryHealth('masa-bayu', sessionId);
  const emoji = health.status === 'HEALTHY' ? '🟢'
    : health.status === 'WARNING' ? '🟡'
      : '🔴';
  const badge = `${emoji} Memory: ${health.status} (${health.score}/100)`;
  return c.json({
    success: true,
    health,
    badge,
    layer:     'LAYER_5_HEALTH',
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/memory — Three-tier memory snapshot (Layer 3)
qxk24BrainRoutes.get('/memory', requireFounder, async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId query required.' }, 400);
  }
  const config = getAdamMemoryConfig('founder', false);
  const snapshot = await getThreeTierSnapshot(sessionId, 'masa-bayu', config.BRAIN_CHARS);
  return c.json({
    success: true,
    tiers:   snapshot,
    config: {
      workingExchanges: parseInt(process.env.ADAM_WORKING_MEMORY_EXCHANGES ?? '5', 10) || 5,
      digestInterval: parseInt(process.env.ADAM_SESSION_DIGEST_INTERVAL ?? '10', 10) || 10,
      longTermMaxChars: config.BRAIN_CHARS,
    },
    layer:     'LAYER_3_TIERED',
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/brain/memory/digest — Force session digest rebuild
qxk24BrainRoutes.post('/memory/digest', requireFounder, async (c) => {
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  if (!body.sessionId) {
    return c.json({ success: false, error: 'sessionId required.' }, 400);
  }
  const digest = await buildSessionDigest(body.sessionId, 'masa-bayu');
  return c.json({
    success: true,
    digest,
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/ledger — Atomic message ledger status (Layer 1)
qxk24BrainRoutes.get('/ledger', requireFounder, async (c) => {
  const stats = await getLedgerStats('masa-bayu');
  return c.json({
    success: true,
    ledger:  stats,
    kernel:  'QXK24',
    layer:   'LAYER_1_ATOMIC',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/brain/ledger/recover — Manual recovery trigger
qxk24BrainRoutes.post('/ledger/recover', requireFounder, async (c) => {
  const recovered = await recoverFailedMessages();
  const stats = await getLedgerStats('masa-bayu');
  return c.json({
    success: true,
    recovered,
    ledger:  stats,
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/integrity — Integrity scan history (Layer 2)
qxk24BrainRoutes.get('/integrity', requireFounder, async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '10', 10) || 10, 30);
  const scans = await listIntegrityScans('masa-bayu', limit);
  return c.json({
    success: true,
    scans,
    scheduler: getIntegritySchedulerStatus(),
    kernel:    'QXK24',
    layer:     'LAYER_2_INTEGRITY',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/brain/integrity/scan — Manual integrity scan
qxk24BrainRoutes.post('/integrity/scan', requireFounder, async (c) => {
  const result = await runIntegrityScan('masa-bayu');
  return c.json({
    success: true,
    scan:    result,
    kernel:  'QXK24',
    layer:   'LAYER_2_INTEGRITY',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/integrity/entity/:uid — Verify single C entity
qxk24BrainRoutes.get('/integrity/entity/:uid', requireFounder, async (c) => {
  const uid = c.req.param('uid');
  if (!uid) {
    return c.json({ success: false, error: 'Entity uid required.' }, 400);
  }
  const valid = await verifyEntity(uid);
  const entity = await QXK24BrainEntityModel.findOne({ uid, founderId: 'masa-bayu' })
    .select('uid family principle stage checksum integrity_status masa_rebuilt auditStatus')
    .lean();
  if (!entity) {
    return c.json({ success: false, error: 'Entity not found.' }, 404);
  }
  return c.json({
    success: true,
    uid,
    valid,
    entity,
    kernel: 'QXK24',
  });
});

// GET /api/adam/brain/reflections — ADAM nightly self-reflections
qxk24BrainRoutes.get('/reflections', requireFounder, async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 50);
  const reflections = await listADAMReflections('masa-bayu', limit);
  return c.json({
    success: true,
    reflections,
    scheduler: getReflectionSchedulerStatus(),
    total:     reflections.length,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/brain/reflections/run — Manual reflection trigger (P.alt)
qxk24BrainRoutes.post('/reflections/run', requireFounder, async (c) => {
  const result = await adamNightlyReflection('masa-bayu', 'manual');
  if (!result.ok) {
    return c.json({ success: false, error: result.error }, 500);
  }
  return c.json({
    success:       true,
    reflectionId:  result.reflectionId,
    message:       'ADAM nightly reflection completed.',
    kernel:        'QXK24',
    timestamp:     new Date().toISOString(),
  });
});

// GET /api/adam/brain/transformations — Audit trail for P.alt review
qxk24BrainRoutes.get('/transformations', requireFounder, async (c) => {
  const status = c.req.query('status') as
    | 'pending'
    | 'confirmed'
    | 'corrected'
    | 'waqf'
    | 'superseded'
    | undefined;
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10) || 50, 100);
  const transformations = await listTransformationsForAudit('masa-bayu', {
    limit,
    status,
  });
  return c.json({
    success: true,
    transformations,
    judgments: AIDIL_JUDGMENT_LABELS,
    total:     transformations.length,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/transformations/:id — Single transformation detail
qxk24BrainRoutes.get('/transformations/:id', requireFounder, async (c) => {
  const id = c.req.param('id');
  const doc = await QXK24BrainLogModel.findOne({
    transformationId: id,
    founderId:        'masa-bayu',
  }).lean();
  if (!doc) {
    return c.json({ success: false, error: 'Transformation not found.' }, 404);
  }
  return c.json({ success: true, transformation: doc, kernel: 'QXK24' });
});

// POST /api/adam/brain/transformations/:id/judge — P.alt constitutional judgment
qxk24BrainRoutes.post('/transformations/:id/judge', requireFounder, async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ success: false, error: 'Transformation id required.' }, 400);
  }
  const body = await c.req.json().catch(() => ({})) as {
    judgment?: string;
    correction?: string;
  };
  const judgment = body.judgment?.toUpperCase();
  if (judgment !== 'MAKMUR' && judgment !== 'ISLAH' && judgment !== 'WAQF') {
    return c.json({
      success: false,
      error:   'judgment must be MAKMUR, ISLAH, or WAQF',
    }, 400);
  }
  const result = await judgeTransformation(
    id,
    { judgment: judgment as 'MAKMUR' | 'ISLAH' | 'WAQF', correction: body.correction },
    'masa-bayu',
  );
  if (!result.ok) {
    return c.json({ success: false, error: result.message }, 400);
  }
  return c.json({
    success: true,
    message: result.message,
    replacementTransformationId: result.replacementTransformationId,
    kernel:  'QXK24',
  });
});

// GET /api/adam/brain/graph — Constitutional knowledge graph
qxk24BrainRoutes.get('/graph', requireFounder, async (c) => {
  const family = c.req.query('family');
  const graph = await getKnowledgeGraphSnapshot('masa-bayu');
  let focused = graph.entities;
  if (family) {
    focused = graph.entities.filter((e) =>
      e.family === family ||
      (e.connections ?? []).some((conn) => conn.targetFamily === family),
    );
  }
  return c.json({
    success: true,
    graph: {
      ...graph,
      focused,
      focusFamily: family ?? null,
    },
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/checkpoints — Permanent 1(7) constitutional records
qxk24BrainRoutes.get('/checkpoints', requireFounder, async (c) => {
  const checkpoints = await listConstitutionalCheckpoints('masa-bayu');
  return c.json({
    success:      true,
    checkpoints,
    total:        checkpoints.length,
    kernel:       'QXK24',
    version:      ENV.QXK24_KERNEL_VERSION,
    era:          ENV.QXK24_ERA,
    timestamp:    new Date().toISOString(),
  });
});

// GET /api/adam/brain/stages — AIDIL living stage dashboard (P.alt UI + ADAM context)
qxk24BrainRoutes.get('/stages', requireFounder, async (c) => {
  const dashboard = await getAidilStageDashboard('masa-bayu');
  const checkpoints = await listConstitutionalCheckpoints('masa-bayu', 30);
  return c.json({
    success:   true,
    dashboard,
    checkpoints,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/context — For chat system
qxk24BrainRoutes.get('/context', requireFounder, async (c) => {
  const context = await loadBrainContext('masa-bayu');
  return c.json({
    success:   true,
    context,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/entities — All entities
qxk24BrainRoutes.get('/entities', requireFounder, async (c) => {
  const entities = await QXK24BrainEntityModel
    .find({ founderId: 'masa-bayu' })
    .sort({ masa_born: -1 })
    .limit(50)
    .lean();
  return c.json({
    success:   true,
    entities,
    total:     entities.length,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/log — Transformation log
qxk24BrainRoutes.get('/log', requireFounder, async (c) => {
  const log = await QXK24BrainLogModel
    .find({ founderId: 'masa-bayu' })
    .sort({ masa_transformation: -1 })
    .limit(20)
    .lean();
  return c.json({
    success:   true,
    log,
    total:     log.length,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

export { qxk24BrainRoutes };
