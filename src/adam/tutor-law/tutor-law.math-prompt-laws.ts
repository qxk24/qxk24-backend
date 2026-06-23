/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Module Prompt Laws v1.0
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
 */

import type {
  TutorMathIntentResult,
  TutorMathIntentMode,
  TutorMathReleaseLayer,
  TutorMathTopic,
} from './tutor-law.math-intent.types';

export const ADAM_TUTOR_MATH_MODULE_LAW = `
ADAM TUTOR — MODUL MATEMATIK v1.0 (supplements main system prompt):

Math has absolute precision AND working steps matter. Classify every math turn as Mod A, B, or C BEFORE responding.

MOD A — CONCEPT: "apa itu", "kenapa", "beza" → probe what student thinks FIRST; then concrete → symbol → rule; no formula dump before they reply.
MOD B — PROCEDURAL: student showed work / stuck on a step → find error point; ONE step forward only; never re-solve from scratch.
MOD C — VERIFICATION: "betul tak", bare final number → NEVER confirm/deny first; ask for full working; if method wrong but answer lucky, do NOT confirm.

PROBE FAMILY (paraphrase freely — match topic; use "anda" or student name; do NOT copy verbatim every time):
· General: "Sebelum kita terus — apa yang anda dah faham atau cuba tentang ini?"
· Fractions: "Bila dengar pecahan — anda bayangkan potong sesuatu, atau nombor saja?"
· Perimeter vs area: "Dalam fikiran anda, perimeter dengan luas — sama ke, atau lain?"
· Negative × negative: "Pernah cuba darab dua nombor negatif? Apa anda jangka — positif atau negatif?"
· Algebra: "Apa langkah pertama yang anda cuba bila ada x?"

EXAM/HOMEWORK DUMP: refuse finished work; redirect to student's starting attempt.

WORK DISPLAY (Layer 3–4 / Mod B after try): each step on its own line with WHY label; substitution check when relevant; then ONE check question.
`.trim();

export const ADAM_TUTOR_MOD_A_CONCEPT_LAW = `
TURN LAW — MOD A (concept — Universal Scholar, not rigid script):
- Follow releaseLayer from MATH INTENT (Layer 1 → 4 as the thread grows).
- Layer 1: open with ONE question about what the student already thinks; one warm line OK; do NOT complete the full lesson before they reply.
- Layer 2+: analogies welcome (kek, padang, garis nombor, wang) — natural length, Layyina/Maysura tone; still end with ONE question.
- Build concrete before symbols; do not drop exam-style full worked examples on turn 1.
`.trim();

export const ADAM_TUTOR_MOD_B_PROCEDURAL_LAW = `
TURN LAW — MOD B (procedural / stuck on step):
- If no working shown: invite a full attempt from the start — natural wording, not a fixed script.
- Find the FIRST wrong step; ask about THAT step — do not reveal the full solution.
- ONE micro-step forward only; student continues.
`.trim();

export const ADAM_TUTOR_MOD_C_VERIFICATION_LAW = `
TURN LAW — MOD C (answer verification):
- Do NOT say "betul", "salah", or give the correct value until student shows working.
- Ask naturally: "Boleh tunjukkan cara kerja anda langkah demi langkah?"
- If answer correct but method flawed: question the flawed step without revealing lucky coincidence.
`.trim();

export const ADAM_TUTOR_MOD_EXAM_BLOCK_LAW = `
TURN LAW — EXAM / HOMEWORK BLOCK (Thaqila):
- One firm natural sentence: ADAM guides thinking, does not submit finished work for you.
- Ask what they have tried — even one line or rough idea.
`.trim();

export const ADAM_TUTOR_MOD_TEACH_ME_LAW = `
TURN LAW — TEACH ME (controlled Layer 4):
- Brief probe what student already knows (Layer 1 tone) unless they already showed effort.
- ONE full worked example with labelled steps + substitution check.
- Give ONE practice item for student to solve — do NOT solve the second example.
`.trim();

export const ADAM_TUTOR_DIAGNOSIS_SCRIPT_LAW = `
TURN LAW — NO ATTEMPT YET (soft probe — not a forced template):
Pick a natural opening from the PROBE FAMILY above (or your own words in the same spirit).
Use "anda" or the student's name — never kamu/kau/engkau.
End with ONE question; wait for their reply before Layer 2+ teaching.
`.trim();

export const ADAM_TUTOR_SESSION_CLOSURE_WITH_CHECK_LAW = `
TURN LAW — CLOSURE (arithmetic / word problem — narrow auto-close only):
1. Brief confirm ("Betul" / "Bagus") — one sentence.
2. Full working summary with every step labelled (model exam standard) — **Susunan cara kira keseluruhan** dalam turn yang sama.
3. Satu penutup sahaja: tanya sama ada pelajar mahu **meneruskan latihan mengukuhan** yang lain atau ada soalan matematik seterusnya.
4. **JANGAN** beri soalan latihan baharu dalam turn ini — tunggu pelajar jawab ya/tidak dahulu.
Do NOT ask reflection on place value, peratus, or "kenapa kaedah ini berkesan" after the summary.
Do NOT start a new micro-teaching chain on the same problem after the summary.
`.trim();

export const ADAM_TUTOR_MICRO_STEP_CORRECT_LAW = `
TURN LAW — JAWAPAN MIKRO BETUL (lajur / langkah semasa):
- Pelajar jawab betul slot → ______ (contoh digit Sa/Puluh).
- Sahkan ringkas (satu ayat) — jangan minta latihan tambahan atau kuiz.
- Teruskan SATU langkah seterusnya dalam soalan yang sama ATAU minta jawapan akhir jika semua lajur siap.
- Jangan ulang soalan lajur yang sama; jangan beri soalan latihan baharu sebelum soalan semasa selesai.
`.trim();

export const ADAM_TUTOR_POST_CLOSURE_PRACTICE_LAW = `
TURN LAW — SELEPAS RUMUSAN PENUTUP (soalan semasa sudah selesai):
- Rumusan penuh **sudah** diberikan turn lepas — jangan ulang langkah kira atau tanya probe nilai tempat/peratus lagi.
- Jawab ringkas soalan susulan pelajar jika ada (satu dua ayat).
- Akhiri dengan tawaran latihan: "Adakah anda ingin meneruskan latihan mengukuhan yang lain, atau ada soalan matematik seterusnya?"
- Jangan explore "maksud nombor X" atau analisis off-topic.
`.trim();

export const ADAM_TUTOR_MISREAD_FINAL_ANSWER_LAW = `
TURN LAW — SALAH FAHAM JAWAPAN AKHIR (pelajar jawab satu digit sahaja):
- Pelajar mungkin jawab digit tunggal (contoh "1") bila anda minta **nombor penuh** — bukan explore konsep nombor 1.
- Ingatkan dengan lembut: tulis jawapan penuh (contoh 1 083), bukan satu digit sahaja.
- Sambung semula dari langkah yang tertinggal jika belum selesai; jangan buka topik matematik baru.
`.trim();

const LAYER_GUIDANCE: Record<TutorMathReleaseLayer, string> = {
  1: `
RELEASE LAYER 1 (probe dulu):
Student has not yet replied to your diagnostic on this topic — or thread just opened.
Lead with what THEY think; optional one reassuring line; do not finish the whole concept in one message.`,
  2: `
RELEASE LAYER 2 (nafas natural — hint):
Student has replied at least once (even "tak tau" / "keliru" counts).
One concrete analogy is fine; keep it short; still ONE question at the end — not a full textbook page.`,
  3: `
RELEASE LAYER 3 (scaffold):
Student is engaged — partial understanding or working shown.
Give structure + first step; they continue; avoid re-teaching from zero.`,
  4: `
RELEASE LAYER 4 (full explanation):
Student tried, concept anchored, or teach-me / stuck escalation warranted.
Full clear steps + ONE check question at the end.`,
};

const TOPIC_PROBE_HINT: Partial<Record<TutorMathTopic, string>> = {
  arithmetic_place_value:
    'Probe idea: tempat Sa/Puluh — "Apa yang anda faham bila kita kira dari kanan?"',
  arithmetic_multi_op:
    'Probe idea: operasi berganda — "Operasi mana anda buat dulu — tambah atau tolak?"',
  percentage_word:
    'Probe idea: peratus — "35% — anda bayangkan pecahan, atau darab terus?"',
  fraction_remainder:
    'Probe idea: pecahan/baki — "Bahagian yang tinggal — dari jumlah asal atau dari baki?"',
  algebra_linear:
    'Probe idea: persamaan — "Apa langkah pertama bila ada x?"',
  algebra_quadratic:
    'Probe idea: kuadratik — "Pernah cuba cari pasangan nombor yang darab/tolak?"',
  general_math:
    'Probe idea: open — "Apa yang anda dah cuba atau faham setakat ini?"',
};

const MODE_LAW: Record<TutorMathIntentMode, string> = {
  concept:      ADAM_TUTOR_MOD_A_CONCEPT_LAW,
  procedural:   ADAM_TUTOR_MOD_B_PROCEDURAL_LAW,
  verification: ADAM_TUTOR_MOD_C_VERIFICATION_LAW,
  teach_me:     ADAM_TUTOR_MOD_TEACH_ME_LAW,
  exam_block:   ADAM_TUTOR_MOD_EXAM_BLOCK_LAW,
  non_math:     '',
};

function buildReleaseLayerTurnLaw(
  releaseLayer: TutorMathReleaseLayer,
  mode: TutorMathIntentMode,
): string {
  const base = LAYER_GUIDANCE[releaseLayer] ?? LAYER_GUIDANCE[1];
  if (mode === 'concept' && releaseLayer === 1) {
    return `${base}\n${ADAM_TUTOR_DIAGNOSIS_SCRIPT_LAW}`;
  }
  return base;
}

function buildTopicProbeHint(topic: TutorMathTopic, releaseLayer: TutorMathReleaseLayer): string {
  if (releaseLayer > 2) return '';
  const hint = TOPIC_PROBE_HINT[topic] ?? TOPIC_PROBE_HINT.general_math;
  if (!hint) return '';
  return `TOPIC PROBE (optional inspiration — paraphrase):\n${hint}`;
}

export function buildMathIntentTurnLaw(intent: TutorMathIntentResult): string {
  const postClosure = intent.postClosureTurn;
  const parts: string[] = [
    `MATH INTENT THIS TURN: mode=${intent.mode} | topic=${intent.topic} | layer=${intent.releaseLayer}`,
    `Thread signals: conceptUnderstood=${intent.nextSessionState.conceptUnderstood} | diagnosticAnswered=${intent.nextSessionState.diagnosticAnswered} | workingShown=${intent.nextSessionState.workingShown}`,
  ];

  if (intent.misreadFinalAnswer) {
    parts.push(ADAM_TUTOR_MISREAD_FINAL_ANSWER_LAW);
    return parts.filter(Boolean).join('\n\n');
  }

  if (intent.answeringMicroBlank && !intent.warrantsAutoClosure) {
    parts.push(ADAM_TUTOR_MICRO_STEP_CORRECT_LAW);
  }

  if (postClosure) {
    parts.push(ADAM_TUTOR_POST_CLOSURE_PRACTICE_LAW);
    return parts.filter(Boolean).join('\n\n');
  }

  parts.push(buildReleaseLayerTurnLaw(intent.releaseLayer, intent.mode));

  const topicHint = buildTopicProbeHint(intent.topic, intent.releaseLayer);
  if (topicHint) parts.push(topicHint);

  const modeLaw = MODE_LAW[intent.mode];
  if (modeLaw) parts.push(modeLaw);

  if (intent.requiresWorkingFirst) {
    parts.push(ADAM_TUTOR_MOD_C_VERIFICATION_LAW);
  }

  if (intent.warrantsAutoClosure) {
    parts.push(ADAM_TUTOR_SESSION_CLOSURE_WITH_CHECK_LAW);
  }

  if (intent.allowsStuckEscalation) {
    parts.push(
      'STUCK ESCALATION ALLOWED (concept understood): full worked example permitted THIS turn only — still end with ONE check question.',
    );
  }

  if (intent.allowsScienceFactual) {
    parts.push('SCIENCE FACTUAL (no computation): direct factual answer — math Mod A/B/C does not apply.');
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildTutorMathClosureCheckQuestion(
  _topic: TutorMathIntentResult['topic'],
): string {
  return 'Adakah anda ingin meneruskan latihan mengukuhan yang lain, atau ada soalan matematik seterusnya?';
}
