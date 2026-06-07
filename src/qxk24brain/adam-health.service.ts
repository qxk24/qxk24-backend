/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Memory Health Monitor (Layer 5)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMFounderSessionModel, ADAMMessageModel } from '../adam/adam.schema';
import { ADAMMessageLedgerModel } from './adam-ledger.schema';
import { ADAMVaultModel } from './adam-vault.schema';
import { ADAMSnapshotModel } from './adam-snapshot.schema';
import { ADAMBackupLogModel } from './adam-redundancy.schema';
import { AlamtologiBrainEntityModel, AlamtologiBrainLogModel } from './qxk24brain.schema';
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

const HEALTH_CACHE_MS = 30_000;
const healthCache = new Map<string, { at: number; report: MemoryHealthReport }>();

function deriveStatus(score: number): MemoryHealthStatus {
  if (score >= 80) return 'HEALTHY';
  if (score >= 60) return 'WARNING';
  return 'CRITICAL';
}

/** Session where founder teaching actually lives — not just the newest empty shell. */
export async function resolvePrimaryFounderSessionId(
  founderId: string,
): Promise<string | null> {
  const fromMessage = await ADAMMessageModel.findOne({
    founderId,
    sessionType: 'founder',
  })
    .sort({ createdAt: -1 })
    .select('sessionId')
    .lean();

  if (fromMessage?.sessionId) return fromMessage.sessionId;

  const doc = await ADAMFounderSessionModel.findOne({
    founderId,
    sessionType: 'founder',
  })
    .sort({ updatedAt: -1 })
    .lean();

  return doc?.sessionId ?? null;
}

export async function checkMemoryHealth(
  founderId: string,
  sessionId: string,
): Promise<MemoryHealthReport> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const isLab = process.env.QXK24_STACK === 'lab';

  const master = await getOrCreateMaster(founderId);

  const [
    messageCount,
    founderMessageCount,
    failedLedger,
    stalePending,
    vaultCount,
    pendingAudit,
    corruptedEntities,
    staleSnapshots,
    lastBackup,
  ] = await Promise.all([
    ADAMMessageModel.countDocuments({ sessionId }),
    ADAMMessageModel.countDocuments({ founderId, sessionType: 'founder' }),
    ADAMMessageLedgerModel.countDocuments({ founderId, status: 'FAILED' }),
    ADAMMessageLedgerModel.countDocuments({
      founderId,
      status:      'PENDING',
      masa_ledger: { $lt: new Date(Date.now() - 60_000) },
    }),
    ADAMVaultModel.countDocuments({ founderId }),
    AlamtologiBrainLogModel.countDocuments({ founderId, auditStatus: 'pending' }),
    AlamtologiBrainEntityModel.countDocuments({
      founderId,
      integrity_status: 'CORRUPTED',
      auditStatus:      { $nin: ['dissolved', 'waqf'] },
    }),
    ADAMSnapshotModel.countDocuments({
      founderId,
      status:        'ACTIVE',
      masa_snapshot: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    ADAMBackupLogModel.findOne({ founderId, status: 'SUCCESS' })
      .sort({ masa_backup: -1 })
      .lean(),
  ]);

  if (!master.unifiedUnderstanding?.trim()) {
    issues.push('Alamtologi Brain master entity is empty');
    recommendations.push('Begin teaching ADAM to build his unified understanding');
    score -= 30;
  }

  if (founderMessageCount === 0) {
    issues.push('No founder teaching messages recorded yet');
    score -= 10;
  } else if (messageCount === 0) {
    // New session shell while teaching history exists — not a health fault.
  }

  if (failedLedger > 0) {
    issues.push(`${failedLedger} message(s) failed to save — recovery needed`);
    recommendations.push('POST /api/adam/brain/ledger/recover to run message recovery');
    score -= Math.min(25, failedLedger * 5);
  }

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

  const stuckFamilies = master.activeFamilies.filter(
    (family) => family.stage === 1 && founderMessageCount > 20,
  );
  if (stuckFamilies.length > 0) {
    const named = stuckFamilies.slice(0, 3).map((f) => `"${f.family}"`).join(', ');
    const suffix = stuckFamilies.length > 3 ? ` (+${stuckFamilies.length - 3} more)` : '';
    issues.push(
      `${stuckFamilies.length} famil${stuckFamilies.length === 1 ? 'y' : 'ies'} at Stage 1 (early AIDIL): ${named}${suffix}`,
    );
    recommendations.push('Deepen teaching on families you want to advance through AIDIL stages');
    // Advisory — many Stage-1 families are normal after lab import or broad teaching
    score -= Math.min(isLab ? 8 : 20, stuckFamilies.length * (isLab ? 2 : 5));
  }

  if (
    vaultCount === 0 &&
    founderMessageCount > 50 &&
    (master.completedFamilies?.length ?? 0) === 0
  ) {
    issues.push('No families sealed at Stage 7 yet');
    recommendations.push('Focus teaching on one family to complete it through all 7 stages');
    score -= isLab ? 3 : 5;
  }

  if (pendingAudit > 3) {
    if (isLab && pendingAudit >= 20) {
      issues.push(`${pendingAudit} transformations in audit backlog (lab — review when ready)`);
      recommendations.push('Review GET /api/adam/brain/transformations?status=pending when auditing');
      score -= 3;
    } else {
      issues.push(`${pendingAudit} transformations awaiting P.alt audit`);
      recommendations.push('Review GET /api/adam/brain/transformations?status=pending');
      score -= Math.min(10, pendingAudit * 2);
    }
  }

  if (corruptedEntities > 0) {
    issues.push(`${corruptedEntities} entity(ies) failed integrity checksum`);
    recommendations.push('POST /api/adam/brain/integrity/scan to rebuild corrupted C entities');
    score -= Math.min(20, corruptedEntities * 10);
  }

  if (staleSnapshots > 0) {
    issues.push(`${staleSnapshots} orphaned snapshot(s) from failed transformations`);
    recommendations.push('Review GET /api/adam/brain/snapshots — rollback or prune stale ACTIVE snapshots');
    score -= Math.min(10, staleSnapshots * 2);
  }

  if (founderMessageCount > 10 && !master.continuityBridge?.founderProfile?.trim()) {
    issues.push('Continuity Bridge not yet built — P.alt relationship memory optional until session close');
    recommendations.push('POST /api/adam/brain/continuity/refresh after closing a teaching session');
    score -= isLab ? 5 : 10;
  } else if (
    master.continuityBridge_updated &&
    founderMessageCount > 20 &&
    Date.now() - new Date(master.continuityBridge_updated).getTime() > 7 * 24 * 60 * 60 * 1000
  ) {
    issues.push('Continuity Bridge stale — not updated in over 7 days');
    recommendations.push('Close session with sleep protocol or POST /api/adam/brain/continuity/refresh');
    score -= 5;
  }

  const r2Configured = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
  );
  if (r2Configured && !lastBackup) {
    issues.push(
      isLab
        ? 'No R2 brain backup on lab yet (optional pilot copy)'
        : 'No encrypted R2 brain backup yet — Copy 3 of 3-2-1 rule missing',
    );
    recommendations.push('POST /api/adam/brain/redundancy/backup to create first backup');
    score -= isLab ? 3 : 10;
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

/** Cached health for command-board polling — avoids hammering Mongo every 8s. */
export async function checkMemoryHealthCached(
  founderId: string,
  sessionId: string,
): Promise<MemoryHealthReport> {
  const key = `${founderId}:${sessionId}`;
  const hit = healthCache.get(key);
  if (hit && Date.now() - hit.at < HEALTH_CACHE_MS) {
    return hit.report;
  }

  const report = await checkMemoryHealth(founderId, sessionId);
  healthCache.set(key, { at: Date.now(), report });
  return report;
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
