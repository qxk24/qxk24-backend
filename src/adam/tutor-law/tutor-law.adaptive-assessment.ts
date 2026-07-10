/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Adaptive Assessment (ZPD / Stealth)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Measures current learning level + Zone of Proximal Development — NOT IQ.
 * Prompt-layer MVP; BKT/DKT persistence is a future data-layer extension.
 */

import type { AdamTutorProfile } from './tutor-law.types';
import type { AdamTutorLearningProfile } from './tutor-law.learning-profile.types';
import { buildLearningProfilePromptSummary } from './tutor-law.learning-profile-bkt';

export enum LearnerMasteryBand {
  NOT_STARTED = 'NOT_STARTED',
  STRUGGLING  = 'STRUGGLING',
  LEARNING    = 'LEARNING',
  MASTERED    = 'MASTERED',
}

export enum LearnerEmotionalSignal {
  FRUSTRATED = 'FRUSTRATED',
  CONFIDENT  = 'CONFIDENT',
  BORED      = 'BORED',
  CURIOUS    = 'CURIOUS',
  NEUTRAL    = 'NEUTRAL',
}

export enum AdaptiveAssessmentPhase {
  ONBOARDING  = 'ONBOARDING',
  PLACEMENT   = 'PLACEMENT',
  CONTINUOUS  = 'CONTINUOUS',
  CHECKPOINT  = 'CHECKPOINT',
}

/** Knowledge-graph concept keys (English grammar MVP). */
export const KNOWLEDGE_CONCEPT_GRAPH: Readonly<Record<string, {
  label:    string;
  parent?:  string;
}>> = {
  'grammar.tenses.present_simple':     { label: 'Present Simple', parent: 'grammar.tenses' },
  'grammar.tenses.past_simple':        { label: 'Past Simple', parent: 'grammar.tenses' },
  'grammar.tenses.present_continuous': { label: 'Present Continuous', parent: 'grammar.tenses' },
  'grammar.tenses.past_continuous':    { label: 'Past Continuous', parent: 'grammar.tenses' },
  'grammar.tenses.present_perfect':  { label: 'Present Perfect', parent: 'grammar.tenses' },
  'grammar.tenses.future':           { label: 'Future Tenses', parent: 'grammar.tenses' },
  'grammar.articles':                  { label: 'Articles (a/an/the)', parent: 'grammar' },
  'grammar.irregular_verbs':           { label: 'Irregular Verbs', parent: 'grammar' },
  'grammar.conditionals':              { label: 'Conditionals', parent: 'grammar' },
  'writing.cohesion':                  { label: 'Cohesion & Linking Words', parent: 'writing' },
  'writing.structure':                 { label: 'Paragraph Structure', parent: 'writing' },
  'vocabulary.collocation':            { label: 'Collocations', parent: 'vocabulary' },
  'reading.comprehension':             { label: 'Reading Comprehension', parent: 'reading' },
  'speaking.pronunciation':            { label: 'Speaking — Pronunciation', parent: 'speaking' },
  'speaking.fluency':                  { label: 'Speaking — Fluency', parent: 'speaking' },
  'math.arithmetic.addition':          { label: 'Matematik — Tambah', parent: 'math.arithmetic' },
  'math.arithmetic.subtraction':       { label: 'Matematik — Tolak', parent: 'math.arithmetic' },
  'math.arithmetic.multiplication':    { label: 'Matematik — Darab', parent: 'math.arithmetic' },
  'math.arithmetic.division':          { label: 'Matematik — Bahagi', parent: 'math.arithmetic' },
  'math.fractions.operations':         { label: 'Matematik — Pecahan', parent: 'math.fractions' },
  'math.percentage.basic':             { label: 'Matematik — Peratus', parent: 'math.percentage' },
  'bm.spelling':                       { label: 'BM — Ejaan', parent: 'bm' },
  'bm.grammar.connectors':             { label: 'BM — Kata Hubung', parent: 'bm.grammar' },
  'bm.grammar.affixes':                { label: 'BM — Imbuhan', parent: 'bm.grammar' },
  'bm.writing.structure':              { label: 'BM — Struktur Karangan', parent: 'bm.writing' },
};

const CONCEPT_ERROR_SIGNALS: Readonly<Record<string, RegExp>> = {
  'grammar.irregular_verbs':          /\bgoed\b|\beated\b|\brunned\b|\bseed\b/i,
  'grammar.tenses.present_continuous': /\b(it|he|she)\s+rains\b|\b(is|are)\s+not\s+rain\b/i,
  'grammar.tenses.present_perfect':   /\bhave\s+went\b|\bhas\s+go\b/i,
  'grammar.articles':                 /\b(a)\s+[aeiou]|\b(an)\s+[^aeiou]/i,
  'grammar.conditionals':             /\bif\s+i\s+was\s+you\b/i,
};

export interface StealthAssessmentSnapshot {
  shortResponse:      boolean;
  longEngaged:        boolean;
  frustrationHit:     boolean;
  boredomHit:         boolean;
  hintRequest:        boolean;
  giveUp:             boolean;
  selfCorrection:     boolean;
  deepQuestion:       boolean;
  inferredConcepts:   string[];
}

export interface AdaptiveAssessmentTurnContext {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                AdamTutorProfile;
  stuckCount?:             number;
  turnIndex?:              number;
  learningProfile?:        AdamTutorLearningProfile | null;
  placementPrompt?:        string | null;
  checkpointPrompt?:       string | null;
  contentPrompt?:          string | null;
  contentId?:              string | null;
}

export const ADAM_TUTOR_ADAPTIVE_ETHICS_LAW = `
ADAM TUTOR — PENILAIAN ADAPTIF (bukan IQ):

❌ JANGAN label pelajar: pintar, lemah, bodoh, genius, slow learner.
✅ UKUR: tahap pembelajaran semasa + gaya + corak kesilapan + ZPD (Zona Pembangunan Proksimal).

❌ JANGAN satu ujian tetapkan tahap selama-lamanya.
✅ Penilaian berterusan setiap interaksi (stealth assessment).

❌ JANGAN bandingkan pelajar dengan pelajar lain.
✅ Bandingkan kemajuan dengan diri sendiri semalam — growth mindset ("belum kuasai", bukan "tak boleh").
`.trim();

export const ADAM_TUTOR_ZPD_LAW = `
ADAM TUTOR — ZPD (Vygotsky):

Pilih kandungan di zon 0.4–0.8 penguasaan — mencabar tetapi boleh capai dengan scaffolding.
Terlalu mudah → bosan; terlalu sukar → frustrasi.
Satu langkah / satu soalan setiap turn; ubah strategi bila pelajar tersekat 3+ kali.
`.trim();

const FRUSTRATION_MARKERS = [
  "i don't understand", "tak faham", "confused", "give up", "too hard",
  "susah", "pening", '???', 'i hate', 'cannot', "can't do",
] as const;

const BOREDOM_MARKERS = [
  'boring', 'bosan', 'too easy', 'mudah sangat', 'already know', 'dah tahu',
] as const;

const HINT_MARKERS = [
  'hint', 'bantu', 'help me', 'tak tahu', "don't know", 'clue', 'example please',
] as const;

const GIVE_UP_MARKERS = [
  'skip', 'next question', 'never mind', 'tak nak', 'give up', 'forget it',
] as const;

const ONBOARDING_MARKERS = [
  'first time', 'baru mula', 'new here', 'just registered', 'belum pernah',
  'how good am i', 'what level', 'placement', 'diagnostic', 'check my level',
] as const;

const CHECKPOINT_MARKERS = [
  'progress report', 'checkpoint', 'two weeks', '2 minggu', 'how am i doing',
  'my progress', 'semak kemajuan',
] as const;

export function detectLearnerEmotionalSignal(
  message: string,
  recentMessages: string[] = [],
): LearnerEmotionalSignal {
  const blob = [message, ...recentMessages].join('\n').toLowerCase();

  if (FRUSTRATION_MARKERS.some((m) => blob.includes(m))) {
    return LearnerEmotionalSignal.FRUSTRATED;
  }
  if (BOREDOM_MARKERS.some((m) => blob.includes(m))) {
    return LearnerEmotionalSignal.BORED;
  }
  if (/\b(why|how come|what if|curious|kenapa|bagaimana)\b/i.test(blob)) {
    return LearnerEmotionalSignal.CURIOUS;
  }
  if (/\b(let me try|i think i can|confident|yakin|boleh)\b/i.test(blob)) {
    return LearnerEmotionalSignal.CONFIDENT;
  }

  return LearnerEmotionalSignal.NEUTRAL;
}

export function detectAdaptiveAssessmentPhase(
  message: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): AdaptiveAssessmentPhase {
  const userBlob = [message, ...recentUserMessages].join('\n').toLowerCase();
  const assistantBlob = recentAssistantMessages.join('\n').toLowerCase();

  if (CHECKPOINT_MARKERS.some((m) => userBlob.includes(m))) {
    return AdaptiveAssessmentPhase.CHECKPOINT;
  }
  if (
    ONBOARDING_MARKERS.some((m) => userBlob.includes(m))
    || /before we start|get to know you|warm-up|self-assessment/i.test(assistantBlob)
  ) {
    return AdaptiveAssessmentPhase.ONBOARDING;
  }
  if (
    /placement|diagnostic|question \d|q\d\b|adaptive test/i.test(userBlob + assistantBlob)
  ) {
    return AdaptiveAssessmentPhase.PLACEMENT;
  }

  return AdaptiveAssessmentPhase.CONTINUOUS;
}

export function inferConceptTagsFromMessage(text: string): string[] {
  const tags: string[] = [];
  for (const [tag, re] of Object.entries(CONCEPT_ERROR_SIGNALS)) {
    if (re.test(text)) tags.push(tag);
  }
  return tags;
}

export function analyzeStealthAssessment(
  ctx: AdaptiveAssessmentTurnContext,
): StealthAssessmentSnapshot {
  const msg = ctx.userMessage.trim();
  const wordCount = msg.split(/\s+/).filter(Boolean).length;
  const lower = msg.toLowerCase();

  return {
    shortResponse:    wordCount > 0 && wordCount <= 3,
    longEngaged:      wordCount >= 25,
    frustrationHit:   FRUSTRATION_MARKERS.some((m) => lower.includes(m)),
    boredomHit:       BOREDOM_MARKERS.some((m) => lower.includes(m)),
    hintRequest:      HINT_MARKERS.some((m) => lower.includes(m)),
    giveUp:           GIVE_UP_MARKERS.some((m) => lower.includes(m)),
    selfCorrection:     /\b(wait|actually|sorry|i mean|eh tak|maaf)\b/i.test(lower),
    deepQuestion:     /\b(why|how|what if)\b/i.test(lower) && wordCount >= 6,
    inferredConcepts:   inferConceptTagsFromMessage(msg),
  };
}

export function masteryBandFromStealth(
  snapshot: StealthAssessmentSnapshot,
  stuckCount = 0,
): LearnerMasteryBand {
  if (snapshot.giveUp || (snapshot.frustrationHit && stuckCount >= 2)) {
    return LearnerMasteryBand.STRUGGLING;
  }
  if (snapshot.hintRequest && stuckCount >= 1) {
    return LearnerMasteryBand.LEARNING;
  }
  if (snapshot.selfCorrection || snapshot.deepQuestion) {
    return LearnerMasteryBand.LEARNING;
  }
  if (snapshot.shortResponse && !snapshot.frustrationHit) {
    return LearnerMasteryBand.LEARNING;
  }
  if (snapshot.longEngaged && !snapshot.frustrationHit) {
    return LearnerMasteryBand.MASTERED;
  }
  return LearnerMasteryBand.LEARNING;
}

export function buildKnowledgeGraphHint(conceptTags: string[]): string {
  if (conceptTags.length === 0) return '';

  const lines = conceptTags.slice(0, 3).map((tag) => {
    const node = KNOWLEDGE_CONCEPT_GRAPH[tag];
    const label = node?.label ?? tag;
    return `• ${label} → band: NEEDS PRACTICE (guide discovery, jangan lecture panjang)`;
  });

  return (
    'Knowledge graph update (turn ini):'
    + '\n'
    + lines.join('\n')
    + '\nGuna inductive probe — tanya corak, bukan hantar rule penuh.'
  );
}

export function buildPlacementProbeTurn(): string {
  return (
    'Placement adaptif IRT (satu soalan turn ini, 12–20 soalan keseluruhan):\n'
    + 'Guna PLACEMENT ITEM dari prompt — jangan cipta soalan lain.\n'
    + 'Kesukaran soalan menyesuaikan jawapan pelajar (bukan IQ).\n'
    + 'Satu soalan sahaja setiap turn; jangan hantar berbilang soalan sekali gus.\n'
    + 'Jangan umumkan "IQ" atau label pelajar pintar/lemah.'
  );
}

export function buildOnboardingSelfAssessmentProbe(): string {
  return (
    'Onboarding self-assessment (turn ini):\n'
    + '1. Confidence 1–5 tentang subjek/topik\n'
    + '2. Apa yang paling sukar? (speaking/grammar/writing/vocab/reading)\n'
    + '3. Matlamat pelajar (peperiksaan / lancar / gred)\n'
    + 'Tanya SATU item setiap turn — mesra, tanpa tekanan.'
  );
}

export function buildCheckpointReportProbe(): string {
  return (
    'Checkpoint 2 minggu (6 soalan mini, satu per turn):\n'
    + 'Buka dengan tawaran ringkas 5 minit — banding kemajuan vs diri sendiri semasa placement/lepas.\n'
    + 'Selepas selesai: 2 kuat, 1 fokus ZPD, tanpa label IQ atau banding pelajar lain.'
  );
}

function emotionalAdaptationHint(signal: LearnerEmotionalSignal): string {
  switch (signal) {
    case LearnerEmotionalSignal.FRUSTRATED:
      return (
        'Emosi: FRUSTRATED — permudah, satu langkah, analogi/bm bridge jika perlu, '
        + 'puji usaha spesifik, jangan tambah drill sukar.'
      );
    case LearnerEmotionalSignal.BORED:
      return (
        'Emosi: BORED — naik cabaran sedikit, konteks menarik, atau tawarkan pilihan topik.'
      );
    case LearnerEmotionalSignal.CURIOUS:
      return (
        'Emosi: CURIOUS — jawab soalan mendalam ringkas, kemudian probe balik pelajar.'
      );
    case LearnerEmotionalSignal.CONFIDENT:
      return (
        'Emosi: CONFIDENT — tawarkan satu langkah ZPD seterusnya, bukan ulang mudah.'
      );
    default:
      return '';
  }
}

function stealthAdaptationHint(snapshot: StealthAssessmentSnapshot): string {
  const parts: string[] = [];

  if (snapshot.shortResponse && snapshot.frustrationHit) {
    parts.push('Stealth: respons pendek + frustrasi — check understanding, simplify.');
  }
  if (snapshot.hintRequest) {
    parts.push('Stealth: hint diminta — beri scaffold minimum, bukan jawapan penuh.');
  }
  if (snapshot.giveUp) {
    parts.push('Stealth: give-up signal — motivasi + task lebih kecil, celebrate small win.');
  }
  if (snapshot.selfCorrection) {
    parts.push('Stealth: self-correction — kuatkan metakognisi, tanya bagaimana mereka sedar.');
  }
  if (snapshot.deepQuestion) {
    parts.push('Stealth: soalan mendalam — pelajar aktif; jawab ringkas lalu extend.');
  }

  return parts.join('\n');
}

export function buildAdaptiveAssessmentTurnLaw(
  ctx: AdaptiveAssessmentTurnContext,
): string {
  const recentUser = ctx.recentUserMessages ?? [];
  const recentAssistant = ctx.recentAssistantMessages ?? [];

  const phase = detectAdaptiveAssessmentPhase(
    ctx.userMessage,
    recentUser,
    recentAssistant,
  );
  const emotion = detectLearnerEmotionalSignal(ctx.userMessage, recentUser);
  const stealth = analyzeStealthAssessment(ctx);
  const stuckCount = ctx.stuckCount ?? ctx.learningProfile?.stealth.stuckStreak ?? 0;
  const mastery = masteryBandFromStealth(stealth, stuckCount);

  const parts: string[] = [
    ADAM_TUTOR_ADAPTIVE_ETHICS_LAW,
    ADAM_TUTOR_ZPD_LAW,
    `ADAPTIVE CONTEXT: phase=${phase}, mastery_band=${mastery}, emotion=${emotion}`,
  ];

  const profileSummary = buildLearningProfilePromptSummary(ctx.learningProfile);
  if (profileSummary) {
    parts.push(`PERSISTED LEARNING STATE:\n${profileSummary}`);
  }
  if (ctx.placementPrompt) {
    parts.push(`PLACEMENT ITEM (turn ini — satu soalan sahaja):\n${ctx.placementPrompt}`);
  }

  if (ctx.checkpointPrompt) {
    parts.push(
      'CHECKPOINT ITEM (turn ini — satu soalan sahaja, 6 soalan keseluruhan):\n'
      + ctx.checkpointPrompt,
    );
    if ((ctx.learningProfile?.checkpoint?.questionsAnswered ?? 0) === 0) {
      parts.push(buildCheckpointReportProbe());
    }
  }

  if (ctx.contentPrompt) {
    parts.push(ctx.contentPrompt);
  }

  const emotional = emotionalAdaptationHint(emotion);
  if (emotional) parts.push(emotional);

  const stealthHint = stealthAdaptationHint(stealth);
  if (stealthHint) parts.push(stealthHint);

  const graphHint = buildKnowledgeGraphHint(stealth.inferredConcepts);
  if (graphHint) parts.push(graphHint);

  switch (phase) {
    case AdaptiveAssessmentPhase.ONBOARDING:
      parts.push(buildOnboardingSelfAssessmentProbe());
      break;
    case AdaptiveAssessmentPhase.PLACEMENT:
      parts.push(buildPlacementProbeTurn());
      break;
    case AdaptiveAssessmentPhase.CHECKPOINT:
      parts.push(buildCheckpointReportProbe());
      break;
    default:
      break;
  }

  if (stuckCount >= 3) {
    parts.push(
      'Adaptive: pelajar tersekat 3+ turn — ubah strategi (analogi, BM bridge, task lebih kecil).',
    );
  }

  if ((ctx.turnIndex ?? 0) > 0 && (ctx.turnIndex ?? 0) % 5 === 0) {
    parts.push(
      'Continuous calibration: ringkas refleksi kemajuan vs sesi lepas — satu ayat, bukan laporan panjang.',
    );
  }

  return parts.filter(Boolean).join('\n\n');
}

export function lookupKnowledgeConceptLabel(tag: string): string | null {
  return KNOWLEDGE_CONCEPT_GRAPH[tag]?.label ?? null;
}
