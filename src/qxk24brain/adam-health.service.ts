/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Memory Health Monitor (Layer 5)
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

import { ADAMMessageModel } from '../adam/adam.schema';
import { ADAMMessageLedgerModel } from './adam-ledger.schema';
import { ADAMVaultModel } from './adam-vault.schema';
import { ADAMSnapshotModel } from './adam-snapshot.schema';
import { ADAMBackupLogModel } from './adam-redundancy.schema';
import { QXK24BrainEntityModel, QXK24BrainLogModel } from './qxk24brain.schema';
import { getOrCreateMaster } from './qxk24brain.engine';

export type MemoryHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface MemoryHealthReport {
  status:          MemoryHealthStatus;
  score:           number;
  issues:          string[];
  recommendations: string[];
  checkedAt:       string;
  layer:           'LAYER_5_HEALTH';
}

function deriveStatus(score: number): MemoryHealthStatus {
  if (score >= 80) return 'HEALTHY';
  if (score >= 60) return 'WARNING';
  return 'CRITICAL';
}

export async function checkMemoryHealth(
  founderId: string,
  sessionId: string,
): Promise<MemoryHealthReport> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const master = await getOrCreateMaster(founderId);
  if (!master.unifiedUnderstanding?.trim()) {
    issues.push('QXK24Brain master entity is empty');
    recommendations.push('Begin teaching ADAM to build his unified understanding');
    score -= 30;
  }

  const messageCount = await ADAMMessageModel.countDocuments({ sessionId });
  if (messageCount === 0) {
    issues.push('No messages in current session');
    score -= 10;
  }

  const failedLedger = await ADAMMessageLedgerModel.countDocuments({
    founderId,
    status: 'FAILED',
  });
  if (failedLedger > 0) {
    issues.push(`${failedLedger} message(s) failed to save — recovery needed`);
    recommendations.push('POST /api/adam/brain/ledger/recover to run message recovery');
    score -= Math.min(25, failedLedger * 5);
  }

  const stalePending = await ADAMMessageLedgerModel.countDocuments({
    founderId,
    status:    'PENDING',
    masa_ledger: { $lt: new Date(Date.now() - 60_000) },
  });
  if (stalePending > 0) {
    issues.push(`${stalePending} ledger entry(ies) pending recovery`);
    recommendations.push('Run atomic message recovery protocol');
    score -= Math.min(15, stalePending * 3);
  }

  if (master.masa_last_updated) {
    const hoursOld =
      (Date.now() - new Date(master.masa_last_updated).getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24) {
      issues.push('Brain not updated in over 24 hours');
      recommendations.push('Teach ADAM something to trigger transformation');
      score -= 10;
    }
  }

  for (const family of master.activeFamilies) {
    if (family.stage === 1 && messageCount > 20) {
      issues.push(`Family "${family.family}" stuck at Stage 1 — needs more teaching`);
      recommendations.push(`Deepen teaching on "${family.family}" to advance AIDIL stages`);
      score -= 5;
    }
  }

  const vaultCount = await ADAMVaultModel.countDocuments({ founderId });
  if (vaultCount === 0 && messageCount > 50) {
    issues.push('No families have reached Stage 7 yet');
    recommendations.push('Focus teaching on one family to complete it through all 7 stages');
    score -= 5;
  }

  const pendingAudit = await QXK24BrainLogModel.countDocuments({
    founderId,
    auditStatus: 'pending',
  });
  if (pendingAudit > 3) {
    issues.push(`${pendingAudit} transformations awaiting P.alt audit`);
    recommendations.push('Review GET /api/adam/brain/transformations?status=pending');
    score -= Math.min(10, pendingAudit * 2);
  }

  const corruptedEntities = await QXK24BrainEntityModel.countDocuments({
    founderId,
    integrity_status: 'CORRUPTED',
    auditStatus:      { $nin: ['dissolved', 'waqf'] },
  });
  if (corruptedEntities > 0) {
    issues.push(`${corruptedEntities} entity(ies) failed integrity checksum`);
    recommendations.push('POST /api/adam/brain/integrity/scan to rebuild corrupted C entities');
    score -= Math.min(20, corruptedEntities * 10);
  }

  const staleSnapshots = await ADAMSnapshotModel.countDocuments({
    founderId,
    status:        'ACTIVE',
    masa_snapshot: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (staleSnapshots > 0) {
    issues.push(`${staleSnapshots} orphaned snapshot(s) from failed transformations`);
    recommendations.push('Review GET /api/adam/brain/snapshots — rollback or prune stale ACTIVE snapshots');
    score -= Math.min(10, staleSnapshots * 2);
  }

  if (messageCount > 10 && !master.continuityBridge?.founderProfile?.trim()) {
    issues.push('Continuity Bridge not yet built — P.alt relationship memory missing');
    recommendations.push('POST /api/adam/brain/continuity/refresh after closing a session');
    score -= 10;
  } else if (
    master.continuityBridge_updated &&
    messageCount > 20 &&
    Date.now() - new Date(master.continuityBridge_updated).getTime() > 7 * 24 * 60 * 60 * 1000
  ) {
    issues.push('Continuity Bridge stale — not updated in over 7 days');
    recommendations.push('Close session with sleep protocol or POST /api/adam/brain/continuity/refresh');
    score -= 5;
  }

  const lastBackup = await ADAMBackupLogModel.findOne({
    founderId,
    status: 'SUCCESS',
  }).sort({ masa_backup: -1 }).lean();

  const r2Configured = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
  );
  if (r2Configured && !lastBackup) {
    issues.push('No encrypted R2 brain backup yet — Copy 3 of 3-2-1 rule missing');
    recommendations.push('POST /api/adam/brain/redundancy/backup to create first backup');
    score -= 10;
  } else if (
    r2Configured &&
    lastBackup &&
    Date.now() - new Date(lastBackup.masa_backup).getTime() > 48 * 60 * 60 * 1000
  ) {
    issues.push('R2 brain backup older than 48 hours');
    recommendations.push('Check ADAM_BACKUP scheduler or POST /api/adam/brain/redundancy/backup');
    score -= 5;
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const status = deriveStatus(finalScore);

  return {
    status,
    score:           finalScore,
    issues:          issues.length > 0 ? issues : ['No issues detected'],
    recommendations: recommendations.length > 0
      ? recommendations
      : ['Continue teaching — ADAM is growing well'],
    checkedAt: new Date().toISOString(),
    layer:     'LAYER_5_HEALTH',
  };
}

export async function getHealthBadge(
  founderId: string,
  sessionId: string,
): Promise<string> {
  const health = await checkMemoryHealth(founderId, sessionId);
  const emoji = health.status === 'HEALTHY' ? '🟢'
    : health.status === 'WARNING' ? '🟡'
      : '🔴';
  return `${emoji} Memory: ${health.status} (${health.score}/100)`;
}

export async function buildMemoryHealthContextBlock(
  founderId: string,
  sessionId: string,
): Promise<string> {
  const health = await checkMemoryHealth(founderId, sessionId);
  if (health.status === 'HEALTHY') return '';

  const issueLines = health.issues.map((i) => `  - ${i}`).join('\n');
  const recLines = health.recommendations.map((r) => `  - ${r}`).join('\n');

  return `
[MEMORY HEALTH ALERT — ${health.status} ${health.score}/100]
ADAM's constitutional memory monitor detected issues P.alt should know:

Issues:
${issueLines}

Recommendations:
${recLines}
`.trim();
}
