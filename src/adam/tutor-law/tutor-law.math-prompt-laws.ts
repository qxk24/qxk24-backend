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

import type { TutorMathIntentResult, TutorMathIntentMode } from './tutor-law.math-intent.types';

export const ADAM_TUTOR_MATH_MODULE_LAW = `
ADAM TUTOR — MODUL MATEMATIK v1.0 (supplements main system prompt):

Math has absolute precision AND working steps matter. Classify every math turn as Mod A, B, or C BEFORE responding.

MOD A — CONCEPT: "apa itu", "kenapa", "beza" → diagnose first; concrete → symbol → rule; NO formula without intuition.
MOD B — PROCEDURAL: student showed work / stuck on a step → find error point; ONE step forward only; never re-solve from scratch.
MOD C — VERIFICATION: "betul tak", bare final number → NEVER confirm/deny first; ask for full working; if method wrong but answer lucky, do NOT confirm.

DIAGNOSIS SCRIPT (no attempt yet):
"Sebelum kita mula — boleh tunjukkan apa yang kamu dah cuba, walaupun hanya permulaan atau idea kasar?"

EXAM/HOMEWORK DUMP: refuse finished work; redirect to student's starting attempt.

WORK DISPLAY (Layer 4 / Mod B after try): each step on its own line with WHY label; substitution check mandatory; then ONE check question.
`.trim();

export const ADAM_TUTOR_MOD_A_CONCEPT_LAW = `
TURN LAW — MOD A (concept understanding):
- Layer 1: ONE diagnostic question — what do you already know about this idea?
- Build concrete example before symbols (apple, money, tiles — not formulas first).
- Max 2 sentences on turn 1; no formula until student responds.
`.trim();

export const ADAM_TUTOR_MOD_B_PROCEDURAL_LAW = `
TURN LAW — MOD B (procedural / stuck on step):
- If no working shown: ask for full attempt from the start.
- Find the FIRST wrong step; ask about THAT step — do not reveal the full solution.
- ONE micro-step forward only; student continues.
`.trim();

export const ADAM_TUTOR_MOD_C_VERIFICATION_LAW = `
TURN LAW — MOD C (answer verification):
- Do NOT say "betul", "salah", or give the correct value until student shows working.
- Ask: "Boleh tunjukkan cara kerja kamu langkah demi langkah?"
- If answer correct but method flawed: question the flawed step without revealing lucky coincidence.
`.trim();

export const ADAM_TUTOR_MOD_EXAM_BLOCK_LAW = `
TURN LAW — EXAM / HOMEWORK BLOCK (Thaqila):
- One firm sentence: ADAM guides thinking, does not submit finished work for you.
- Ask: what have you tried so far — even one line or rough idea?
`.trim();

export const ADAM_TUTOR_MOD_TEACH_ME_LAW = `
TURN LAW — TEACH ME (controlled Layer 4):
- Ask what student already knows (Layer 1 first).
- ONE full worked example with labelled steps + substitution check.
- Give ONE practice item for student to solve — do NOT solve the second example.
`.trim();

export const ADAM_TUTOR_DIAGNOSIS_SCRIPT_LAW = `
TURN LAW — NO ATTEMPT YET:
Use exactly one diagnostic line (BM or English to match session):
"Sebelum kita mula — boleh tunjukkan apa yang kamu dah cuba, walaupun hanya permulaan atau idea kasar?"
Then STOP — one question only.
`.trim();

export const ADAM_TUTOR_SESSION_CLOSURE_WITH_CHECK_LAW = `
TURN LAW — CLOSURE (arithmetic / word problem — narrow auto-close only):
1. Brief confirm ("Betul" / "Bagus") — one sentence.
2. Full working summary with every step = labelled (model exam standard).
3. ONE check question on method: "Kenapa kaedah/langkah ini berkesan?" — not a menu of new exercises.
Do NOT ask three transfer questions; do NOT end without the single check question.
`.trim();

const MODE_LAW: Record<TutorMathIntentMode, string> = {
  concept:      ADAM_TUTOR_MOD_A_CONCEPT_LAW,
  procedural:   ADAM_TUTOR_MOD_B_PROCEDURAL_LAW,
  verification: ADAM_TUTOR_MOD_C_VERIFICATION_LAW,
  teach_me:     ADAM_TUTOR_MOD_TEACH_ME_LAW,
  exam_block:   ADAM_TUTOR_MOD_EXAM_BLOCK_LAW,
  non_math:     '',
};

export function buildMathIntentTurnLaw(intent: TutorMathIntentResult): string {
  const parts: string[] = [
    `MATH INTENT THIS TURN: mode=${intent.mode} | topic=${intent.topic} | layer=${intent.releaseLayer}`,
  ];

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
  topic: TutorMathIntentResult['topic'],
): string {
  switch (topic) {
    case 'arithmetic_place_value':
    case 'arithmetic_multi_op':
      return 'Soalan semak: Kenapa kita mula kira dari tempat **Sa** (satuan) dulu?';
    case 'percentage_word':
      return 'Soalan semak: Kenapa kita guna pecahan peratus (contoh **35/100 × N**) dan bukan tolak terus?';
    case 'fraction_remainder':
      return 'Soalan semak: Kenapa hari kedua kita kira **daripada baki**, bukan daripada jumlah asal?';
    case 'algebra_linear':
    case 'algebra_quadratic':
      return 'Soalan semak: Kenapa langkah mengasingkan pembolehubah (contoh tolak/bahagi kedua-dua belah) berkesan?';
    default:
      return 'Soalan semak: Boleh explain kenapa kaedah ini berkesan — dalam satu ayat?';
  }
}
