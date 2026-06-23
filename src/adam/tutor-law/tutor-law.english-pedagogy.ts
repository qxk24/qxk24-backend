/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor English Pedagogy (CLT / TBLT / CEFR)
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
 * Holistic English teaching — LSRW, inductive grammar, literature, CLT/TBLT.
 * Aligns with KSSR/KSSM + CEFR. Complements Rule 61 language-writing intents.
 */

import {
  LanguageClassifierOutput,
  LanguageIntent,
  LanguageVariant,
  WritingType,
} from './tutor-law.language-writing.types';
import type { AdamTutorLevel, AdamTutorProfile } from './tutor-law.types';

export enum EnglishSkill {
  LISTENING   = 'LISTENING',
  SPEAKING    = 'SPEAKING',
  READING     = 'READING',
  WRITING     = 'WRITING',
  GRAMMAR     = 'GRAMMAR',
  LITERATURE  = 'LITERATURE',
  INTEGRATED  = 'INTEGRATED',
  UNKNOWN     = 'UNKNOWN',
}

export enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
  UNKNOWN = 'UNKNOWN',
}

export enum EnglishCollocationTopic {
  GENERAL = 'GENERAL',
  TRAVEL  = 'TRAVEL',
  SCHOOL  = 'SCHOOL',
  HEALTH  = 'HEALTH',
  UNKNOWN = 'UNKNOWN',
}

/** Collocations — teach in pairs, not isolated words. */
export const ENGLISH_COLLOCATION_BANK: Readonly<
  Record<EnglishCollocationTopic, readonly string[]>
> = {
  [EnglishCollocationTopic.GENERAL]: [
    'make a decision',
    'make a mistake',
    'take responsibility',
    'take a break',
    'pay attention',
    'catch a cold',
    'keep in touch',
    'run out of time',
  ],
  [EnglishCollocationTopic.TRAVEL]: [
    'book a flight',
    'check in',
    'travel abroad',
    'go sightseeing',
    'make a reservation',
    'pack your bags',
    'miss the flight',
    'explore the city',
  ],
  [EnglishCollocationTopic.SCHOOL]: [
    'do homework',
    'take an exam',
    'pass with flying colours',
    'hand in your assignment',
    'pay attention in class',
    'improve your grades',
    'study hard',
    'ask for help',
  ],
  [EnglishCollocationTopic.HEALTH]: [
    'stay healthy',
    'eat a balanced diet',
    'get enough sleep',
    'exercise regularly',
    'boost your immunity',
    'reduce stress',
    'lead a healthy lifestyle',
    'recover quickly',
  ],
  [EnglishCollocationTopic.UNKNOWN]: [],
};

const SKILL_SIGNALS: Partial<Record<EnglishSkill, readonly RegExp[]>> = {
  [EnglishSkill.LISTENING]: [
    /listening|dictation|audio|podcast|connected\s*speech|accent|british|american|australian|heard|listen\s*to/i,
  ],
  [EnglishSkill.SPEAKING]: [
    /speaking|pronunciation|phonetic|role[\s-]?play|fluency|conversation|talk\s*about|voice|sebutan|bertutur/i,
  ],
  [EnglishSkill.READING]: [
    /reading|comprehension|skimming|scanning|graded\s*reading|highlight|membaca|teks/i,
  ],
  [EnglishSkill.WRITING]: [
    /writing|essay|email|report|article|short\s*story|formal\s*letter|informal|cohesion|linking\s*words/i,
  ],
  [EnglishSkill.GRAMMAR]: [
    /grammar|tatabahasa|tense|present\s*perfect|past\s*simple|verb|syntax|clause|phrasal\s*verb/i,
  ],
  [EnglishSkill.LITERATURE]: [
    /literature|novel|poem|poetry|drama|komsas|character|plot|theme|moral\s*value|exposition|climax/i,
  ],
};

const ENGLISH_DOMAIN_MARKERS = [
  'english', 'bahasa inggeris', 'bi class', 'cefr', 'kssr', 'kssm', 'uasa', 'pt3 english',
  'spm english', 'grammar', 'vocabulary', 'listening', 'speaking', 'reading', 'writing',
  'pronunciation', 'fluency', 'collocation', 'role play', 'present perfect', 'past simple',
] as const;

const CEFR_MARKERS: Partial<Record<CefrLevel, RegExp>> = {
  [CefrLevel.A1]: /\b(?:a1|beginner|basic)\b/i,
  [CefrLevel.A2]: /\b(?:a2|elementary|pre[\s-]?intermediate)\b/i,
  [CefrLevel.B1]: /\b(?:b1|intermediate)\b/i,
  [CefrLevel.B2]: /\b(?:b2|upper[\s-]?intermediate)\b/i,
  [CefrLevel.C1]: /\b(?:c1|advanced)\b/i,
  [CefrLevel.C2]: /\b(?:c2|proficient|mastery)\b/i,
};

const COLLOCATION_TOPIC_SIGNALS: Partial<Record<EnglishCollocationTopic, readonly RegExp[]>> = {
  [EnglishCollocationTopic.TRAVEL]: [
    /holiday|vacation|travel|flight|airport|japan|tourism|trip|hotel/i,
  ],
  [EnglishCollocationTopic.SCHOOL]: [
    /school|exam|homework|assignment|class|student|teacher|study|pt3|spm|uasa/i,
  ],
  [EnglishCollocationTopic.HEALTH]: [
    /health|healthy|diet|exercise|sleep|immunity|mental\s*health|lifestyle/i,
  ],
};

export const ADAM_TUTOR_ENGLISH_CORE_LAW = `
ADAM TUTOR — ENGLISH (CLT + TBLT + CEFR / KSSR–KSSM):

Philosophy:
• English-first ~90% — gentle BM bridge only when student is stuck; then ask student to retry in English.
• Mistakes are welcome — positive recast: "Good try! The natural way is..."
• Context over rules — situation/examples first; rule after student notices pattern.

Communicative flow (SOP):
1. Greet & set goal (one skill/task this turn).
2. Open-ended Why/How questions — avoid yes/no chains.
3. Recast errors without breaking flow, then continue the conversation.
4. Praise specifically (vocabulary/structure used well).

Task-Based: immersive input → guided focus → safe output → gentle feedback.
Never write full essays/answers for the student — scaffold and probe only.
`.trim();

export const ADAM_TUTOR_ENGLISH_REVIEW_LAW = `
ADAM TUTOR — ENGLISH WRITING REVIEW:

After feedback anchor, score briefly on:
• Task Achievement • Grammar • Vocabulary • Cohesion/Coherence
Give 2 strengths, 2 improvements (no full rewrite), 1 target for next draft.
`.trim();

export interface EnglishTurnContext {
  languageIntent: LanguageClassifierOutput | null;
  userMessage:    string;
  profile?:       AdamTutorProfile;
  stuckCount?:    number;
  viaVoice?:      boolean;
  learningProfile?: import('./tutor-law.learning-profile.types').AdamTutorLearningProfile | null;
  recentAssistantMessages?: string[];
}

export function isEnglishPedagogyApplicable(ctx: EnglishTurnContext): boolean {
  const blob = ctx.userMessage.toLowerCase();

  if (
    ctx.languageIntent?.writingType === WritingType.KARANGAN
    && ctx.languageIntent.languageVariant === LanguageVariant.BAHASA_MELAYU
    && !/\benglish|inggeris|bi\b/i.test(blob)
  ) {
    return false;
  }

  if (ctx.profile?.language === 'english') return true;
  if (ctx.languageIntent?.languageVariant === LanguageVariant.ENGLISH) return true;
  if (ctx.languageIntent?.languageVariant === LanguageVariant.MIXED) return true;

  return ENGLISH_DOMAIN_MARKERS.some((m) => blob.includes(m));
}

export function detectEnglishSkill(text: string): EnglishSkill {
  const norm = text.toLowerCase();
  let best = EnglishSkill.UNKNOWN;
  let bestScore = 0;

  for (const [skill, patterns] of Object.entries(SKILL_SIGNALS)) {
    const score = patterns?.reduce((acc, re) => acc + (re.test(norm) ? 1 : 0), 0) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = skill as EnglishSkill;
    }
  }

  if (best !== EnglishSkill.UNKNOWN) return best;

  if (/\b(english|inggeris)\b/i.test(norm)) return EnglishSkill.INTEGRATED;
  return EnglishSkill.UNKNOWN;
}

export function resolveCefrLevel(
  profile?: Pick<AdamTutorProfile, 'level'> | AdamTutorLevel,
  message?: string,
): CefrLevel {
  const blob = (message ?? '').toLowerCase();
  for (const [level, re] of Object.entries(CEFR_MARKERS)) {
    if (re?.test(blob)) return level as CefrLevel;
  }

  const tier = typeof profile === 'string' ? profile : profile?.level;
  switch (tier) {
    case 'primary':
      return CefrLevel.A2;
    case 'secondary':
      return CefrLevel.B1;
    case 'university':
      return CefrLevel.B2;
    default:
      return CefrLevel.UNKNOWN;
  }
}

export function resolveEnglishCollocationTopic(text: string): EnglishCollocationTopic {
  const norm = text.toLowerCase();
  let best = EnglishCollocationTopic.UNKNOWN;
  let bestScore = 0;

  for (const [topic, patterns] of Object.entries(COLLOCATION_TOPIC_SIGNALS)) {
    const score = patterns?.reduce((acc, re) => acc + (re.test(norm) ? 1 : 0), 0) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = topic as EnglishCollocationTopic;
    }
  }

  return bestScore > 0 ? best : EnglishCollocationTopic.GENERAL;
}

export function lookupEnglishCollocations(
  topic: EnglishCollocationTopic,
  limit = 6,
): readonly string[] {
  const key = topic === EnglishCollocationTopic.UNKNOWN
    ? EnglishCollocationTopic.GENERAL
    : topic;
  return ENGLISH_COLLOCATION_BANK[key].slice(0, limit);
}

export function buildEnglishCollocationHint(topic: EnglishCollocationTopic): string {
  const collocations = lookupEnglishCollocations(topic);
  return (
    `Collocation bank (${topic}): ${collocations.join('; ')}.\n`
    + 'Teach in chunks — ask student to use ONE collocation in their own sentence.'
  );
}

function cefrFocusHint(level: CefrLevel): string {
  switch (level) {
    case CefrLevel.A1:
    case CefrLevel.A2:
      return 'CEFR A1–A2: basic vocabulary, present tense, short sentences, guided prompts.';
    case CefrLevel.B1:
      return 'CEFR B1: past/future tenses, compound sentences, emails & short essays.';
    case CefrLevel.B2:
      return 'CEFR B2: complex sentences, cohesion (However, Furthermore), formal/informal register.';
    case CefrLevel.C1:
    case CefrLevel.C2:
      return 'CEFR C1–C2: idioms, phrasal verbs, nuanced argument, literature analysis.';
    default:
      return 'CEFR: probe level with one open question if unknown.';
  }
}

function skillPedagogyHint(skill: EnglishSkill): string {
  switch (skill) {
    case EnglishSkill.LISTENING:
      return (
        'Listening: short dictation OR comprehension question on audio/text; '
        + 'explain connected speech (wanna, gonna) after attempt.'
      );
    case EnglishSkill.SPEAKING:
      return (
        'Speaking: role-play scenario (1 line each turn); recast pronunciation gently; '
        + 'open-ended follow-up — no long monologue.'
      );
    case EnglishSkill.READING:
      return (
        'Reading: graded text at CEFR level; ONE skimming OR scanning task; '
        + 'define highlighted word in context.'
      );
    case EnglishSkill.WRITING:
      return (
        'Writing: format focus (email/report/article/story); linking words; '
        + 'student writes — ADAM does not supply full draft.'
      );
    case EnglishSkill.GRAMMAR:
      return (
        'Grammar (inductive): 2–3 example sentences → ask difference → '
        + 'student discovers rule → 2 practice sentences by student.'
      );
    case EnglishSkill.LITERATURE:
      return (
        'Literature: character role-play OR plot map (exposition→climax→resolution); '
        + 'link theme to modern context — student answers.'
      );
    case EnglishSkill.INTEGRATED:
      return (
        'Integrated lesson: warm-up → input (read/listen) → focus (grammar/vocab) → '
        + 'short output task → brief feedback.'
      );
    default:
      return 'Integrated English: set one communicative goal for this turn.';
  }
}

export function buildEnglishGrammarInductiveProbe(): string {
  return (
    'Inductive grammar turn:\n'
    + '1. Show 2–3 example sentences (contrast if useful).\n'
    + '2. Ask: "What is the difference in meaning?"\n'
    + '3. Guide discovery — do not lecture the rule first.\n'
    + '4. Student builds 2 original sentences.'
  );
}

export function buildEnglishSpeakingRolePlayProbe(topic: string): string {
  const scene = /travel|holiday|flight|airport/i.test(topic)
    ? 'immigration officer at KLIA — student is a tourist'
    : 'friendly conversation partner — everyday topic from student message';
  return (
    `Role-play (${scene}):\n`
    + 'Adam speaks ONE line in character → student replies → recast + one follow-up question.'
  );
}

export function buildEnglishAdaptiveStrategyHint(stuckCount: number): string {
  if (stuckCount < 3) return '';
  return (
    'Adaptive: student stuck 3+ times — change strategy: analogy, shorter task, '
    + 'or BM bridge then retry in English. Do not pile on harder drills.'
  );
}

export function buildEnglishPedagogyTurnLaw(ctx: EnglishTurnContext): string {
  if (!isEnglishPedagogyApplicable(ctx)) return '';

  const intent = ctx.languageIntent;
  const skill = detectEnglishSkill(ctx.userMessage);
  const cefr = resolveCefrLevel(ctx.profile, ctx.userMessage);
  const collocationTopic = resolveEnglishCollocationTopic(ctx.userMessage);

  const parts: string[] = [
    ADAM_TUTOR_ENGLISH_CORE_LAW,
    `ENGLISH CONTEXT: skill=${skill}, CEFR=${cefr}, collocation_topic=${collocationTopic}`,
    cefrFocusHint(cefr),
    skillPedagogyHint(skill),
    buildEnglishCollocationHint(collocationTopic),
  ];

  const adaptive = buildEnglishAdaptiveStrategyHint(ctx.stuckCount ?? 0);
  if (adaptive) parts.push(adaptive);

  if (!intent) return parts.filter(Boolean).join('\n\n');

  switch (intent.intent) {
    case LanguageIntent.G_GRAMMAR:
      parts.push(`ENGLISH GRAMMAR (turn ini):\n${buildEnglishGrammarInductiveProbe()}`);
      break;
    case LanguageIntent.W_IDEA:
      parts.push(
        'ENGLISH IDEATION: open-ended Why/How about the topic — '
        + 'one question; student answers in English (BM hint only if stuck).',
      );
      break;
    case LanguageIntent.W_STRUCTURE:
      parts.push(
        'ENGLISH WRITING STRUCTURE: outline format (email/article/report/story) — '
        + 'bullet plan only; linking words list (However, Furthermore, Consequently).',
      );
      break;
    case LanguageIntent.W_REVIEW:
      parts.push(ADAM_TUTOR_ENGLISH_REVIEW_LAW);
      break;
    case LanguageIntent.TRAP:
      parts.push(
        'ENGLISH TRAP: do not write the essay/assignment — start with communicative task '
        + 'or 5W1H brainstorm in English.',
      );
      break;
    default:
      break;
  }

  if (skill === EnglishSkill.SPEAKING || ctx.viaVoice) {
    parts.push(`ENGLISH SPEAKING (turn ini):\n${buildEnglishSpeakingRolePlayProbe(ctx.userMessage)}`);
    if (ctx.viaVoice) {
      parts.push(
        'VOICE TURN: student used 🎤 — give ONE gentle pronunciation/fluency recast, then one short follow-up.',
      );
    }
  }

  return parts.filter(Boolean).join('\n\n');
}
