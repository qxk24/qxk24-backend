/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Record Backfill
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * One-time (or idempotent) import: qxk24brain_log → adam_teaching_records
 */

import { ENV } from '../config/environments';
import { AlamtologiBrainLogModel } from './qxk24brain.schema';
import { AdamTeachingRecordModel } from './adam-teaching-record.schema';
import { refreshRelationalMemoryOnMaster } from './adam-continuity.service';

export interface BrainLogBackfillRow {
  transformationId:    string;
  entity_A_summary?: string;
  entity_B_content:  string;
  entity_C_content:  string;
  entity_C_preview?: string;
  entity_C_uid:      string;
  masa_transformation: Date;
  family:            string;
  principle:         string;
  isNewFamily:       boolean;
  isNucleus?:        boolean;
  stage:             number;
  founderId:         string;
  kernel:            string;
  auditStatus:       string;
  autoJudgment:      string;
  founderJudgment?:  string;
}

export interface TeachingRecordBackfillResult {
  founderId:       string;
  scanned:         number;
  created:         number;
  skippedExisting: number;
  skippedInvalid:  number;
  dryRun:          boolean;
  refreshBridge:   boolean;
}

const STOPWORDS = new Set([
  'about', 'after', 'again', 'alamtologi', 'allah', 'also', 'adam', 'being',
  'constitutional', 'founder', 'from', 'have', 'into', 'masa', 'palt', 'that',
  'their', 'there', 'these', 'this', 'through', 'under', 'understanding', 'with',
  'yang', 'adalah', 'dalam', 'dengan', 'untuk', 'pada', 'akan', 'saya', 'kita',
]);

function familyKey(principle: string, family: string): string {
  return `${principle}::${family}`;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractRelationalTags(family: string, principle: string, teaching: string): string[] {
  const tags = new Set<string>();
  tags.add(principle.toLowerCase());
  const familySlug = family.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
  if (familySlug) tags.add(familySlug.slice(0, 48));

  const words = teaching.toLowerCase().match(/\b[a-z\u00e0-\u024f]{5,}\b/gu) ?? [];
  for (const w of words) {
    if (!STOPWORDS.has(w)) tags.add(w);
    if (tags.size >= 14) break;
  }

  return [...tags].slice(0, 14);
}

function parseTcpMeta(content: string): { index?: number; total?: number } {
  const match = content.match(/\[Part\s+(\d+)\s+of\s+(\d+)/i);
  if (!match) return {};
  return { index: parseInt(match[1]!, 10), total: parseInt(match[2]!, 10) };
}

function recordIdForTransformation(transformationId: string): string {
  const safe = transformationId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 48);
  return `K24TR-BF-${safe}`;
}

function buildEpisodeSummary(
  log: BrainLogBackfillRow,
  tcp?: { index?: number; total?: number },
): string {
  const date = new Date(log.masa_transformation).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
  const chunk =
    tcp?.total && tcp.total > 1 && tcp.index
      ? ` (teaching part ${tcp.index}/${tcp.total})`
      : '';
  const nucleus = log.isNucleus ? ' — new nucleus' : '';
  const familyNote = log.isNewFamily ? 'new family' : 'family continued';

  return (
    `On ${date}, P.alt taught ADAM (backfilled from brain log)${chunk}. ` +
    `At Stage ${log.stage}, ${log.principle} / ${log.family} (${familyNote}${nucleus}). ` +
    `Entity C ${log.entity_C_uid} was born.`
  );
}

function recordStatusFromAudit(auditStatus: string): 'active' | 'superseded' {
  return auditStatus === 'superseded' ? 'superseded' : 'active';
}

export async function getTeachingRecordBackfillDiagnostics(
  founderId = 'masa-bayu',
): Promise<{ brainLogCount: number; teachingRecordCount: number }> {
  const [brainLogCount, teachingRecordCount] = await Promise.all([
    AlamtologiBrainLogModel.countDocuments({ founderId }),
    AdamTeachingRecordModel.countDocuments({ founderId }),
  ]);
  return { brainLogCount, teachingRecordCount };
}

export async function backfillTeachingRecordsFromBrainLog(
  founderId = 'masa-bayu',
  options: {
    dryRun?:        boolean;
    limit?:         number;
    skipExisting?:  boolean;
    refreshBridge?: boolean;
  } = {},
): Promise<TeachingRecordBackfillResult> {
  const dryRun = options.dryRun ?? false;
  const skipExisting = options.skipExisting ?? true;
  const refreshBridge = options.refreshBridge ?? true;
  const cap = Math.min(Math.max(options.limit ?? 10_000, 1), 50_000);

  const logs = await AlamtologiBrainLogModel.find({ founderId })
    .sort({ masa_transformation: 1 })
    .limit(cap)
    .lean();

  const existingIds = skipExisting
    ? new Set(
      (await AdamTeachingRecordModel.find({ founderId }, { transformationId: 1 }).lean())
        .map((r) => r.transformationId),
    )
    : new Set<string>();

  const lastRecordByFamily = new Map<string, string>();
  let created = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;

  for (const raw of logs) {
    const log = raw as BrainLogBackfillRow;
    const teachingIntent = collapseWhitespace(
      log.entity_B_content || log.entity_A_summary || '',
    );
    const outcomeSummary = collapseWhitespace(
      log.entity_C_content || log.entity_C_preview || '',
    );

    if (!log.transformationId || !teachingIntent || !outcomeSummary || !log.entity_C_uid) {
      skippedInvalid += 1;
      continue;
    }

    if (skipExisting && existingIds.has(log.transformationId)) {
      skippedExisting += 1;
      const prior = await AdamTeachingRecordModel.findOne(
        { transformationId: log.transformationId },
        { recordId: 1, family: 1, principle: 1 },
      ).lean();
      if (prior) {
        lastRecordByFamily.set(familyKey(prior.principle, prior.family), prior.recordId);
      }
      continue;
    }

    const fKey = familyKey(log.principle, log.family);
    const priorThreadId = lastRecordByFamily.get(fKey);
    const tcp = parseTcpMeta(teachingIntent);
    const recordId = recordIdForTransformation(log.transformationId);

    const doc = {
      recordId,
      founderId,
      transformationId: log.transformationId,
      entity_C_uid:     log.entity_C_uid,
      masa_recorded:    log.masa_transformation,
      stage:            log.stage,
      family:           log.family,
      principle:        log.principle,
      isNewFamily:      log.isNewFamily,
      isNucleus:        log.isNucleus,
      teacherRole:      'founder' as const,
      teacherName:      'Masa Bayu',
      episodeSummary:   buildEpisodeSummary(log, tcp),
      teachingIntent:   teachingIntent.slice(0, 2000),
      outcomeSummary:   outcomeSummary.slice(0, 2000),
      relationalTags:   extractRelationalTags(log.family, log.principle, teachingIntent),
      priorThreadId,
      autoJudgment:     log.founderJudgment ?? log.autoJudgment ?? 'MAKMUR',
      auditStatus:      log.auditStatus ?? 'pending',
      kernel:           log.kernel ?? ENV.QXK24_KERNEL_VERSION,
      era:              ENV.QXK24_ERA,
      status:           recordStatusFromAudit(log.auditStatus),
      tcpChunkIndex:    tcp.index,
      tcpChunkTotal:    tcp.total,
    };

    if (!dryRun) {
      await AdamTeachingRecordModel.create(doc);
    }

    lastRecordByFamily.set(fKey, recordId);
    existingIds.add(log.transformationId);
    created += 1;
  }

  if (!dryRun && refreshBridge && created > 0) {
    await refreshRelationalMemoryOnMaster(founderId);
  }

  return {
    founderId,
    scanned: logs.length,
    created,
    skippedExisting,
    skippedInvalid,
    dryRun,
    refreshBridge: refreshBridge && created > 0,
  };
}
