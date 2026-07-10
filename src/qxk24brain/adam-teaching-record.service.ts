/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
  founderAsksPersonalBiography,
  recordLooksLikeFounderCanonicalBiography,
  recordLooksLikeThirdPartyBiography,
} from '../adam/adam-knowledge-prompts';
import { filterTeachingRecordsForChapter } from '../adam/book-aware-recall/record-chapter-filter';
import {
  buildBab1AsasConstitutionalRecallBlock,
  buildBab2FaktorXyzConstitutionalRecallBlock,
  buildBab3HukumConstitutionalRecallBlock,
  buildBab4SainsConstitutionalRecallBlock,
  buildBab5MasaConstitutionalRecallBlock,
  buildBab6TenagaConstitutionalRecallBlock,
  buildChapterConstitutionalRecallBlock,
  chapterHasConstitutionalBackbone,
} from '../adam/book-aware-recall/constitutional-backbone';
import {
  AdamTeachingRecordModel,
  type AdamTeachingRecordDocument,
  type RegisterCorrection,
  type TeachingRecordStatus,
} from './adam-teaching-record.schema';
import type { MomentLaw } from './adam-moment-reader.service';
import type { BrainRecallExportSurface } from '../adam/adam-brain-recall-filter';
import { sanitizeOutcomeLineForKonvensional } from '../adam/adam-brain-recall-filter';
import {
  buildMongoRegexFromLiteral,
  clipMongoTextSearchQuery,
} from './mongo-regex-safe';

export { founderAsksTeachingRecall } from '../adam/book-aware-recall/teaching-recall-probes';

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
  teacherRole:        'founder' | 'inquiry' | 'tutor';
  teacherName:        string;
  aSource?:           'founder' | 'inquiry' | 'conventional' | 'quran' | 'tutor';
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
  /** AMA v2 — when true, transform runs but B is not appended to Kotak 3 */
  skipEpisodicAppend?: boolean;
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
  const family = (doc.family ?? '').trim();
  const teachingIntent = (doc.teachingIntent ?? '').trim();

  if (doc.registerCorrection) return true;
  if (family === 'Long Teaching' || family.startsWith('Register')) return true;
  if ((doc.tcpChunkTotal ?? 1) > 1) return true;

  // Meta-operational signals — founder turn only (outcome may echo session context)
  const metaOperational =
    /\b(action \d+|candidate \d|qxk24-backend|deploy\.sh|git push|pm2|student-digest|mode filter|queue hygiene|pending_confirmation|adam_teaching_bridge|knowledge panel|fitra-iman sprint|tb-\d{10,})\b/i;
  if (metaOperational.test(`${family} ${teachingIntent}`)) return true;

  // Constitutional law shape — founder teaching intent only
  const hasLawShape = /a \+ b = c/i.test(teachingIntent);
  const hasQuranRef = /quran\s+\d+:\d+|surah\s+\w+/i.test(teachingIntent);
  const hasChainNode =
    /fitrah?|tawakkul|maqasid|iman\b|taqwa|rizq\b|aql\b/i.test(teachingIntent);

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

  const skipBridge = shouldSkipTeachingBridgeCrystallisation(doc.toObject());
  const isLastTcpChunk =
    (doc.tcpChunkTotal ?? 1) > 1 &&
    doc.tcpChunkIndex === doc.tcpChunkTotal;

  if (skipBridge && (isLastTcpChunk || doc.family === 'Long Teaching')) {
    void import('../llm-pipeline/syllabus-teaching-progress')
      .then(({ markChapterProgressFromTeaching }) =>
        markChapterProgressFromTeaching(teachingIntent, {
          family:    doc.family,
          principle: doc.principle,
        }),
      )
      .catch((err) => console.error('[LLM Pipeline] Chapter progress mark failed:', err));
  }

  if (skipBridge) {

  } else {
    void import('../teaching-bridge/teaching-bridge.hook')
      .then(({ hookTeachingBridgeAfterRecord }) => hookTeachingBridgeAfterRecord(doc))
      .catch((err) => console.error('[TeachingBridge] Hook import failed:', err));
  }

  return doc;
}

export interface RecordTransformEpisodeInput {
  founderId:        string;
  aSource:          'founder' | 'inquiry' | 'conventional' | 'quran' | 'tutor';
  sessionId:        string;
  userMessageId?:   string;
  studentId?:       string;
  episodeSummary:   string;
  teachingIntent:   string;
  outcomeSummary:   string;
  relationalTags:   string[];
  questionHash:     string;
  webSearchUsed:    boolean;
  recallHit:        boolean;
  conventionalRefs?: string[];
  tier?:            number;
}

/** Unified episode writer — inquiry / conventional crystallisation (P0). */
export async function recordTransformEpisode(
  input: RecordTransformEpisodeInput,
): Promise<AdamTeachingRecordDocument> {
  const priorQuery: Record<string, unknown> = {
    founderId: input.founderId,
    family:    'Inquiry Synthesis',
    status:    'active',
    teacherRole: 'inquiry',
  };
  if (input.studentId?.trim()) {
    priorQuery['transformMeta.studentId'] = input.studentId.trim();
  }
  const prior = await AdamTeachingRecordModel.findOne(priorQuery)
    .sort({ masa_recorded: -1 })
    .lean();

  const suffix = Math.random().toString(36).slice(2, 8);
  const recordId = `K24TR-INQ-${Date.now()}-${suffix}`;
  const transformationId = `K24TX-INQ-${Date.now()}-${suffix}`;
  const entity_C_uid = `K24B-INQUIRY-${input.questionHash}-${Date.now()}`;
  const masa = new Date();
  const tags = [
    ...new Set([
      ...input.relationalTags.map((t) => t.toLowerCase().trim()).filter(Boolean),
      input.aSource,
      'inquiry-synthesis',
    ]),
  ];

  const doc = await AdamTeachingRecordModel.create({
    recordId,
    founderId:        input.founderId,
    sessionId:        input.sessionId,
    founderMessageId: input.userMessageId,
    transformationId,
    entity_C_uid,
    masa_recorded:    masa,
    stage:            1,
    family:           'Inquiry Synthesis',
    principle:        'CAHAYA',
    isNewFamily:      false,
    isNucleus:        false,
    teacherRole:      'inquiry',
    teacherName:      'Universal inquiry',
    aSource:          input.aSource,
    episodeSummary:   input.episodeSummary.trim().slice(0, 500),
    teachingIntent:   input.teachingIntent.trim().slice(0, 2000),
    outcomeSummary:   input.outcomeSummary.trim().slice(0, 2000),
    relationalTags:   tags,
    priorThreadId:    prior?.recordId,
    autoJudgment:     'MAKMUR',
    auditStatus:      'pending',
    kernel:           ENV.QXK24_KERNEL_VERSION,
    era:              ENV.QXK24_ERA,
    status:           'active',
    transformMeta: {
      sessionId:        input.sessionId,
      userMessageId:    input.userMessageId,
      studentId:        input.studentId,
      webSearchUsed:    input.webSearchUsed,
      recallHit:        input.recallHit,
      conventionalRefs: (input.conventionalRefs ?? []).slice(0, 8),
      questionHash:     input.questionHash,
      tier:             input.tier ?? 1,
      masaCrystallised: masa,
    },
  });

  void import('./adam-continuity.service')
    .then(({ refreshRelationalMemoryOnMaster }) =>
      refreshRelationalMemoryOnMaster(input.founderId),
    )
    .catch((err) => console.error('[ADAM Transform Record] Relational refresh failed:', err));

  void import('../teaching-bridge/teaching-bridge.hook')
    .then(({ hookTeachingBridgeAfterRecord }) => hookTeachingBridgeAfterRecord(doc))
    .catch((err) => console.error('[TeachingBridge] Inquiry hook failed:', err));

  return doc;
}

/** Skip duplicate inquiry crystallisation within cooldown window. */
export async function findRecentTransformByQuestionHash(
  founderId: string,
  questionHash: string,
  cooldownMs: number,
): Promise<TeachingRecordRow | null> {
  const since = new Date(Date.now() - cooldownMs);
  const row = await AdamTeachingRecordModel.findOne({
    founderId,
    status:    'active',
    aSource:   { $in: ['inquiry', 'conventional'] },
    'transformMeta.questionHash': questionHash,
    masa_recorded: { $gte: since },
  })
    .sort({ masa_recorded: -1 })
    .lean();
  return row ? (row as TeachingRecordRow) : null;
}

export interface TeachingRecordSearchOptions {
  /** When true — never return unrelated recent episodes (chapter-scoped recall). */
  skipRecentFallback?: boolean;
  /** Scope inquiry recall to one user (transformMeta.studentId). */
  studentId?:          string;
  /** Filter teacherRole — e.g. inquiry-only for student relational recall. */
  teacherRoles?:       string[];
  /** Filter tutor-lane episodes (transformMeta.channelLane). */
  channelLane?:        string;
}

export async function searchTeachingRecords(
  founderId: string,
  query: string,
  limit = 5,
  options: TeachingRecordSearchOptions = {},
): Promise<TeachingRecordRow[]> {
  const cap = Math.min(Math.max(limit, 1), 20);
  const q = query.trim();
  const { skipRecentFallback = false, studentId, teacherRoles, channelLane } = options;

  const scopeFilter: Record<string, unknown> = {
    founderId,
    status: 'active',
  };
  if (studentId?.trim()) {
    scopeFilter['transformMeta.studentId'] = studentId.trim();
  }
  if (channelLane?.trim()) {
    scopeFilter['transformMeta.channelLane'] = channelLane.trim();
  }
  if (teacherRoles?.length) {
    scopeFilter.teacherRole = { $in: teacherRoles };
  }

  if (q.length >= 2) {
    const textQ = clipMongoTextSearchQuery(q);

    try {
      const textHits = await AdamTeachingRecordModel.find({
        ...scopeFilter,
        $text: { $search: textQ },
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

    const regex = buildMongoRegexFromLiteral(q);
    if (!regex) {
      if (skipRecentFallback) return [];
      const recent = await AdamTeachingRecordModel.find(scopeFilter)
        .sort({ masa_recorded: -1 })
        .limit(cap)
        .lean();
      return recent as TeachingRecordRow[];
    }

    const regexHits = await AdamTeachingRecordModel.find({
      ...scopeFilter,
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

  if (skipRecentFallback) return [];

  const recent = await AdamTeachingRecordModel.find(scopeFilter)
    .sort({ masa_recorded: -1 })
    .limit(cap)
    .lean();

  return recent as TeachingRecordRow[];
}

/** Chapter-scoped search — tries each term; no unrelated recent fallback. */
export async function searchTeachingRecordsForChapter(
  founderId: string,
  searchTerms: string[],
  limit = 5,
): Promise<TeachingRecordRow[]> {
  const cap = Math.min(Math.max(limit, 1), 20);
  const seen = new Set<string>();
  const merged: TeachingRecordRow[] = [];

  for (const term of searchTerms) {
    const t = term.trim();
    if (t.length < 2) continue;
    const hits = await searchTeachingRecords(founderId, t, cap, { skipRecentFallback: true });
    for (const row of hits) {
      const key = row.recordId || row.transformationId;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
      if (merged.length >= cap) return merged;
    }
  }

  return merged;
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
  searchTerms?: string[],
  chapterId?: string,
): Promise<string | null> {
  if (founderAsksPersonalBiography(userMessage)) {
    return null;
  }

  const terms = searchTerms?.filter((t) => t.trim().length >= 2) ?? [];
  let records = terms.length > 0
    ? await searchTeachingRecordsForChapter(founderId, terms, 5)
    : await searchTeachingRecords(founderId, userMessage, 5, { skipRecentFallback: true });

  records = filterTeachingRecordsForChapter(records, chapterId);
  if (!chapterId?.startsWith('alamin')) {
    records = records.filter((row) => !recordLooksLikeThirdPartyBiography(row));
  } else {
    records = records.filter((row) => !recordLooksLikeFounderCanonicalBiography(row));
  }

  if (!records.length) {
    if (chapterId === 'bab-1-asas') {
      return [
        '[P.ALT TEACHING RECORDS — Bab 1 Formula XYZ · tiada episod tambahan dalam indeks Mongo]',
        '',
        'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
        'JANGAN kata tiada rekod atau minta P.alt mengajar semula Bab 1.',
        '',
        buildBab1AsasConstitutionalRecallBlock(),
      ].join('\n');
    }
    if (chapterId === 'bab-2-faktor-xyz') {
      return [
        '[P.ALT TEACHING RECORDS — Bab 2 Formula XYZ · tiada episod tambahan dalam indeks Mongo]',
        '',
        'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
        'JANGAN jawab Bab 2 dengan Cara Kira / HISAL ASAS / Operasi Tambah.',
        '',
        buildBab2FaktorXyzConstitutionalRecallBlock(),
      ].join('\n');
    }
    if (chapterId === 'bab-3-hukum') {
      return [
        '[P.ALT TEACHING RECORDS — Bab 3 Formula XYZ · tiada episod tambahan dalam indeks Mongo]',
        '',
        'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
        'JANGAN jawab Bab 3 dengan Cara Kira AIDIL atau Operasi SuNom.',
        '',
        buildBab3HukumConstitutionalRecallBlock(),
      ].join('\n');
    }
    if (chapterId === 'bab-4-sains') {
      return [
        '[P.ALT TEACHING RECORDS — Bab 4 Formula XYZ · tiada episod tambahan dalam indeks Mongo]',
        '',
        'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
        'JANGAN jawab Bab 4 dengan Nombor 20 AIDIL atau Pola Garis SuNom.',
        '',
        buildBab4SainsConstitutionalRecallBlock(),
      ].join('\n');
    }
    if (chapterId === 'bab-5-masa') {
      return [
        '[P.ALT TEACHING RECORDS — Bab 5 Formula XYZ · tiada episod tambahan dalam indeks Mongo]',
        '',
        'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
        'JANGAN jawab Bab 5 dengan Nombor 24 AIDIL atau Aplikasi KM HISAL ASAS.',
        '',
        buildBab5MasaConstitutionalRecallBlock(),
      ].join('\n');
    }
    if (chapterId === 'bab-6-tenaga') {
      return [
        '[P.ALT TEACHING RECORDS — Bab 6 Formula XYZ · tiada episod tambahan dalam indeks Mongo]',
        '',
        'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
        'JANGAN jawab Bab 6 dengan Aplikasi Graf / Operasi Tambah HISAL ASAS atau Operasi Tolak AIDIL.',
        '',
        buildBab6TenagaConstitutionalRecallBlock(),
      ].join('\n');
    }
    if (chapterId && chapterHasConstitutionalBackbone(chapterId)) {
      const backbone = buildChapterConstitutionalRecallBlock(chapterId);
      if (backbone) {
        return [
          `[P.ALT TEACHING RECORDS — ${chapterId} · tiada episod tambahan dalam indeks Mongo]`,
          '',
          'Jawab penuh dari CONSTITUTIONAL BACKBONE meterai (sudah dimuat pada giliran ini).',
          'JANGAN campur bab HISAL/AIDIL/SuNom dengan nombor bab yang sama.',
          '',
          backbone,
        ].join('\n');
      }
    }
    return terms.length > 0
      ? `[P.ALT TEACHING RECORDS — tiada episod tepat untuk bab ini dalam indeks]\n\nGunakan SEALED ANCHOR dan buku yang P.alt ajar — jangan ganti dengan AIDIL atau bab lain.`
      : `[ADAM TEACHING RECORDS — MASA]\n\nNo episodic teaching records indexed yet. ADAM has matured through transformation but no autobiographical episodes are stored for this query.`;
  }

  return formatChapterTeachingRecordsBlock(records);
}

/** Shared episode lines for chapter-scoped and universal recall. */
export function formatTeachingRecordEpisodeLines(records: TeachingRecordRow[]): string[] {
  return records.map((r, i) => {
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
}

function formatChapterTeachingRecordsBlock(records: TeachingRecordRow[]): string {
  return [
    '[P.ALT TEACHING RECORDS — Formula XYZ · HISAL (AIDIL/ASAS/SuNom) · lived sessions]',
    '',
    'BOOK ORDER: Sains Alamtologi — Bab 1–6, Bab 7 HISAL (7.1 AIDIL, 7.2 ASAS, 7.3 SuNom, 7.4 GANDA).',
    'ADAM may say "I remember" ONLY for episodes listed here — not from invention.',
    '',
    ...formatTeachingRecordEpisodeLines(records),
  ].join('\n');
}

function formatKonvensionalTeachingRecallBlock(records: TeachingRecordRow[]): string | null {
  const lines: string[] = [];
  for (const r of records) {
    const outcome = sanitizeOutcomeLineForKonvensional(r.outcomeSummary);
    const episode = sanitizeOutcomeLineForKonvensional(r.episodeSummary);
    if (outcome) lines.push(`- ${outcome}`);
    else if (episode) lines.push(`- ${episode}`);
  }
  if (!lines.length) return null;
  return [
    '[KONVENSIONAL BRAIN RECALL — universal synthesis only]',
    'Brain C episod — gunakan hanya baris di bawah untuk L2/L3 konvensional.',
    'FORBIDDEN outward: HISAL, AIDIL, TAJU, Formula XYZ, waqf, PL/PG, label Alamtologi.',
    '',
    ...lines,
  ].join('\n');
}

/**
 * Universal Recall Router — semantic/text search on every substantive turn.
 * Returns null when no indexed episodes match (no empty placeholder).
 */
export async function buildUniversalTeachingRecallBlock(
  founderId: string,
  userMessage: string,
  exportSurface: BrainRecallExportSurface = 'sintesis',
): Promise<string | null> {
  if (founderAsksPersonalBiography(userMessage)) return null;

  let records = await searchTeachingRecords(
    founderId,
    userMessage,
    5,
    { skipRecentFallback: true },
  );
  records = records.filter((row) => !recordLooksLikeThirdPartyBiography(row));
  if (!records.length) return null;

  if (exportSurface === 'konvensional') {
    return formatKonvensionalTeachingRecallBlock(records);
  }

  if (exportSurface === 'alamtologi') {
    return formatChapterTeachingRecordsBlock(records);
  }

  return [
    '[UNIVERSAL TEACHING RECALL — episod P.alt relevan dengan soalan ini]',
    '',
    'Synthesise A+B=C from these episodes — EXPLAIN-BACK LAW: Phase 1B conventional grounding first,',
    'then Phase 2 insight in your own universal scholar voice.',
    'Never copy-paste P.alt transcript or meterai labels. No "Alamtologi" billboard unless user asked faith/framework.',
    'ADAM may reference lived teaching ONLY from episodes listed below — not from invention.',
    '',
    ...formatTeachingRecordEpisodeLines(records),
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
