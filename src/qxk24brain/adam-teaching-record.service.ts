/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Teaching Record Service
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
 * MASA layer — episodic autobiography of each A + B = C event.
 */

import { ENV } from '../config/environments';
import { FOUNDER_USER_ID } from '../adam/adam-student.types';
import {
  AdamTeachingRecordModel,
  type AdamTeachingRecordDocument,
  type RegisterCorrection,
  type TeachingRecordStatus,
} from './adam-teaching-record.schema';
import type { MomentLaw } from './adam-moment-reader.service';

export interface TeachingRecordRow {
  recordId:           string;
  founderId:          string;
  sessionId?:         string;
  founderMessageId?:  string;
  transformationId: string;
  entity_C_uid:       string;
  masa_recorded:      Date;
  stage:              number;
  family:             string;
  principle:          string;
  isNewFamily:        boolean;
  isNucleus?:         boolean;
  teacherRole:        'founder';
  teacherName:        string;
  episodeSummary:     string;
  teachingIntent:     string;
  outcomeSummary:     string;
  relationalTags:     string[];
  priorThreadId?:     string;
  autoJudgment:       string;
  auditStatus:        string;
  kernel:             string;
  era:                string;
  status:             TeachingRecordStatus;
  tcpChunkIndex?:     number;
  tcpChunkTotal?:     number;
  registerCorrection?: RegisterCorrection;
}

export interface TeachingTransformContext {
  sessionId?:         string;
  founderMessageId?:  string;
  tcpChunkIndex?:     number;
  tcpChunkTotal?:     number;
}

export interface RecordTeachingTransformationInput {
  founderId:        string;
  transformationId: string;
  entity_C_uid:     string;
  masa_recorded:    Date;
  stage:            number;
  family:           string;
  principle:        string;
  isNewFamily:      boolean;
  isNucleus?:       boolean;
  founderMessage:   string;
  outcomeContent:   string;
  autoJudgment?:    string;
  auditStatus?:     string;
  context?:         TeachingTransformContext;
}

const STOPWORDS = new Set([
  'about', 'after', 'again', 'alamtologi', 'allah', 'also', 'adam', 'being',
  'constitutional', 'founder', 'from', 'have', 'into', 'masa', 'palt', 'that',
  'their', 'there', 'these', 'this', 'through', 'under', 'understanding', 'with',
  'yang', 'adalah', 'dalam', 'dengan', 'untuk', 'pada', 'akan', 'saya', 'kita',
]);

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

function formatSessionRef(sessionId?: string): string {
  if (!sessionId) return 'an unlinked session';
  return `session …${sessionId.slice(-8)}`;
}

function buildEpisodeSummary(input: RecordTeachingTransformationInput): string {
  const date = input.masa_recorded.toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
  const chunk =
    input.context?.tcpChunkTotal && input.context.tcpChunkTotal > 1
      ? ` (teaching part ${input.context.tcpChunkIndex}/${input.context.tcpChunkTotal})`
      : '';
  const nucleus = input.isNucleus ? ' — new nucleus' : '';
  const familyNote = input.isNewFamily ? 'new family' : 'family continued';

  return (
    `On ${date}, P.alt taught ADAM in ${formatSessionRef(input.context?.sessionId)}${chunk}. ` +
    `At Stage ${input.stage}, ${input.principle} / ${input.family} (${familyNote}${nucleus}). ` +
    `Entity C ${input.entity_C_uid} was born.`
  );
}

/** Mode filter — episodic MASA always records; bridge crystallises constitutional law only. */
export function shouldSkipTeachingBridgeCrystallisation(
  doc: Pick<
    AdamTeachingRecordDocument,
    | 'family'
    | 'principle'
    | 'teachingIntent'
    | 'outcomeSummary'
    | 'tcpChunkIndex'
    | 'tcpChunkTotal'
    | 'registerCorrection'
  >,
): boolean {
  const content = [
    doc.principle,
    doc.outcomeSummary,
    doc.teachingIntent,
    doc.family,
  ]
    .filter(Boolean)
    .join(' ');

  if (doc.registerCorrection) return true;

  const metaOperational =
    /\b(action \d+|candidate \d|qxk24-backend|deploy\.sh|git push|pm2|student-digest|mode filter|queue hygiene|pending_confirmation|adam_teaching_bridge|knowledge panel|fitra-iman sprint|tb-\d{10,})\b/i;
  if (metaOperational.test(content)) return true;

  if (doc.family === 'Long Teaching' || doc.family.startsWith('Register')) return true;
  if ((doc.tcpChunkTotal ?? 1) > 1) return true;

  const hasLawShape = /a \+ b = c/i.test(content);
  const hasQuranRef = /quran\s+\d+:\d+|surah\s+\w+/i.test(content);
  const hasChainNode =
    /fitrah?|tawakkul|maqasid|iman\b|taqwa|rizq\b|aql\b/i.test(content);

  if (!hasLawShape && !(hasQuranRef && hasChainNode)) return true;

  return false;
}

export async function recordTeachingTransformation(
  input: RecordTeachingTransformationInput,
): Promise<AdamTeachingRecordDocument> {
  const prior = await AdamTeachingRecordModel.findOne({
    founderId: input.founderId,
    family:    input.family,
    status:    'active',
  })
    .sort({ masa_recorded: -1 })
    .lean();

  const recordId = `K24TR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const teachingIntent = input.founderMessage.trim().slice(0, 2000);
  const outcomeSummary = input.outcomeContent.trim().slice(0, 2000);

  const doc = await AdamTeachingRecordModel.create({
    recordId,
    founderId:          input.founderId,
    sessionId:          input.context?.sessionId,
    founderMessageId:   input.context?.founderMessageId,
    transformationId:   input.transformationId,
    entity_C_uid:       input.entity_C_uid,
    masa_recorded:      input.masa_recorded,
    stage:              input.stage,
    family:             input.family,
    principle:          input.principle,
    isNewFamily:        input.isNewFamily,
    isNucleus:          input.isNucleus,
    teacherRole:        'founder',
    teacherName:        'Masa Bayu',
    episodeSummary:     buildEpisodeSummary(input),
    teachingIntent,
    outcomeSummary,
    relationalTags:     extractRelationalTags(input.family, input.principle, teachingIntent),
    priorThreadId:      prior?.recordId,
    autoJudgment:       input.autoJudgment ?? 'MAKMUR',
    auditStatus:        input.auditStatus ?? 'pending',
    kernel:             ENV.QXK24_KERNEL_VERSION,
    era:                ENV.QXK24_ERA,
    status:             'active',
    tcpChunkIndex:      input.context?.tcpChunkIndex,
    tcpChunkTotal:      input.context?.tcpChunkTotal,
  });

  void import('./adam-continuity.service')
    .then(({ refreshRelationalMemoryOnMaster }) =>
      refreshRelationalMemoryOnMaster(input.founderId),
    )
    .catch((err) => console.error('[ADAM Teaching Record] Relational refresh failed:', err));

  if (shouldSkipTeachingBridgeCrystallisation(doc)) {
    console.log(
      `[TeachingBridge] Mode filter — skip meta-operational / non-law record ${doc.recordId}`,
    );
  } else {
    void import('../teaching-bridge/teaching-bridge.hook')
      .then(({ hookTeachingBridgeAfterRecord }) => hookTeachingBridgeAfterRecord(doc))
      .catch((err) => console.error('[TeachingBridge] Hook import failed:', err));
  }

  return doc;
}

export function founderAsksTeachingRecall(message: string): boolean {
  return /\b(remember|recall|ingat|ingatkan|do you remember|what did we discuss|what did i teach|when you first|when i first|autobiograph|cerita|kisah|bila kita|sesi itu|teaching record|rekod pembelajaran)\b/i.test(
    message,
  );
}

export async function searchTeachingRecords(
  founderId: string,
  query: string,
  limit = 5,
): Promise<TeachingRecordRow[]> {
  const cap = Math.min(Math.max(limit, 1), 20);
  const q = query.trim();

  if (q.length >= 2) {
    try {
      const textHits = await AdamTeachingRecordModel.find({
        founderId,
        status: 'active',
        $text: { $search: q },
      })
        .sort({ score: { $meta: 'textScore' }, masa_recorded: -1 })
        .limit(cap)
        .lean();

      if (textHits.length > 0) {
        return textHits as TeachingRecordRow[];
      }
    } catch {
      // text index may not exist yet on fresh deploy
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const regexHits = await AdamTeachingRecordModel.find({
      founderId,
      status: 'active',
      $or: [
        { episodeSummary: regex },
        { teachingIntent: regex },
        { outcomeSummary: regex },
        { family: regex },
        { principle: regex },
        { relationalTags: regex },
        { sessionId: regex },
      ],
    })
      .sort({ masa_recorded: -1 })
      .limit(cap)
      .lean();

    if (regexHits.length > 0) {
      return regexHits as TeachingRecordRow[];
    }
  }

  const recent = await AdamTeachingRecordModel.find({ founderId, status: 'active' })
    .sort({ masa_recorded: -1 })
    .limit(cap)
    .lean();

  return recent as TeachingRecordRow[];
}

export async function listTeachingRecords(
  founderId: string,
  limit = 20,
): Promise<TeachingRecordRow[]> {
  const cap = Math.min(Math.max(limit, 1), 100);
  const rows = await AdamTeachingRecordModel.find({ founderId, status: 'active' })
    .sort({ masa_recorded: -1 })
    .limit(cap)
    .lean();
  return rows as TeachingRecordRow[];
}

export async function buildTeachingRecordRecallBlock(
  founderId: string,
  userMessage: string,
): Promise<string | null> {
  const records = await searchTeachingRecords(founderId, userMessage, 5);
  if (!records.length) {
    return `[ADAM TEACHING RECORDS — MASA]\n\nNo episodic teaching records indexed yet. ADAM has matured through transformation but no autobiographical episodes are stored for this query.`;
  }

  const lines = records.map((r, i) => {
    const session = r.sessionId ? `session …${r.sessionId.slice(-8)}` : 'session unknown';
    const thread = r.priorThreadId ? ` · thread from ${r.priorThreadId.slice(-12)}` : '';
    return [
      `${i + 1}. ${r.masa_recorded.toISOString().slice(0, 10)} · ${session} · Stage ${r.stage}`,
      `   ${r.principle} / ${r.family}`,
      `   Episode: ${r.episodeSummary}`,
      `   P.alt taught: ${r.teachingIntent.slice(0, 280)}${r.teachingIntent.length > 280 ? '…' : ''}`,
      `   ADAM became: ${r.outcomeSummary.slice(0, 220)}${r.outcomeSummary.length > 220 ? '…' : ''}`,
      `   C uid: ${r.entity_C_uid}${thread}`,
    ].join('\n');
  });

  return [
    '[ADAM TEACHING RECORDS — EPISODIC MASA (append-only autobiography)]',
    '',
    'ADAM may say "I remember" ONLY for events listed here — not from invention.',
    '',
    ...lines,
  ].join('\n');
}

export async function countTeachingRecords(founderId = FOUNDER_USER_ID): Promise<number> {
  return AdamTeachingRecordModel.countDocuments({ founderId, status: 'active' });
}

export interface RecordRegisterCorrectionInput {
  founderId:        string;
  sessionId:        string;
  founderMessageId?: string;
  momentDetected:   MomentLaw;
  momentActual:     MomentLaw;
  correctionNote:   string;
}

export async function recordRegisterCorrection(
  input: RecordRegisterCorrectionInput,
): Promise<AdamTeachingRecordDocument> {
  const now = new Date();
  const suffix = Math.random().toString(36).slice(2, 8);
  const recordId = `K24TR-REG-${Date.now()}-${suffix}`;
  const transformationId = `K24REG-${Date.now()}-${suffix}`;
  const entity_C_uid = `C-REG-${suffix}`;

  const episodeSummary =
    `Register correction: P.alt taught ADAM that this moment called for ${input.momentActual}, not ${input.momentDetected}.`;
  const teachingIntent = input.correctionNote.trim().slice(0, 2000);
  const outcomeSummary =
    `ADAM's moment reading for ${input.momentActual} signals deepened. Previously read as ${input.momentDetected}.`;

  const registerCorrection: RegisterCorrection = {
    momentDetected: input.momentDetected,
    momentActual:   input.momentActual,
    correctionNote: teachingIntent,
    correctedAt:    now,
    sessionId:      input.sessionId,
  };

  const doc = await AdamTeachingRecordModel.create({
    recordId,
    founderId:        input.founderId,
    sessionId:          input.sessionId,
    founderMessageId:   input.founderMessageId,
    transformationId,
    entity_C_uid,
    masa_recorded:      now,
    stage:              0,
    family:             'Register / Moment Reading',
    principle:          input.momentActual,
    isNewFamily:        false,
    teacherRole:        'founder',
    teacherName:        'Masa Bayu',
    episodeSummary,
    teachingIntent,
    outcomeSummary,
    relationalTags:     [
      'register',
      'moment-reading',
      input.momentActual.toLowerCase(),
      input.momentDetected.toLowerCase(),
    ],
    autoJudgment:       'MAKMUR',
    auditStatus:        'pending',
    kernel:             ENV.QXK24_KERNEL_VERSION,
    era:                ENV.QXK24_ERA,
    status:             'active',
    registerCorrection,
  });

  void import('./adam-continuity.service')
    .then(({ refreshRelationalMemoryOnMaster }) =>
      refreshRelationalMemoryOnMaster(input.founderId),
    )
    .catch((err) => console.error('[ADAM Register Correction] Relational refresh failed:', err));

  return doc;
}

export async function listRegisterCorrections(
  founderId: string,
  limit = 10,
): Promise<TeachingRecordRow[]> {
  const cap = Math.min(Math.max(limit, 1), 50);
  const rows = await AdamTeachingRecordModel.find({
    founderId,
    status: 'active',
    registerCorrection: { $exists: true },
  })
    .sort({ 'registerCorrection.correctedAt': -1 })
    .limit(cap)
    .lean();
  return rows as TeachingRecordRow[];
}

export async function buildRegisterCalibrationLines(
  founderId: string,
  limit = 5,
): Promise<string[]> {
  const rows = await listRegisterCorrections(founderId, limit);
  return rows.map((r) => {
    const rc = r.registerCorrection;
    if (!rc) return '';
    const date = rc.correctedAt.toISOString().slice(0, 10);
    return `${date}: read ${rc.momentDetected} → P.alt taught ${rc.momentActual}. "${rc.correctionNote.slice(0, 120)}${rc.correctionNote.length > 120 ? '…' : ''}"`;
  }).filter(Boolean);
}
