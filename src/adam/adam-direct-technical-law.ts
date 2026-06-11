/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Direct Technical Reply Law
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Root cause at generation: direct procedural / tool questions are NOT
 * substantive explain-back turns — no Alamtologi phases, no guards.
 */

import { isAdamLightChatTurn } from './adam-response-generation';
import { isTechnicalPrecisionQuestion } from './adam-universal-voice';

/** User wants steps, shortcuts, or tool procedure — not ilmu/philosophy depth. */
const DIRECT_HOW_TO_PROCEDURE =
  /\b(?:bagaimana\s+(?:nak|untuk|saya|aku|kita|anda)?\s*(?:buat|bina|create|set\s*up|setup|tambah|insert|letak|pasang|install|muat\s*naik|upload|download|export|import|salin|copy|paste|pautkan|linkkan)|cara\s+(?:buat|guna|menggunakan|letak|pasang|set|configure|konfigurasi|membuat)|how\s+to\s+(?:make|create|add|set\s*up|insert|link|hyperlink|install|export|import)|langkah[\s-]?(?:untuk|membuat)|step[\s-]by[\s-]step|shortcut|tekan\s+(?:ctrl|alt|cmd)|(?:ctrl|alt|cmd)\+|hyperlink|hiperpautan|hiperlink|bookmark|table\s+of\s+contents|senarai\s+kandungan|pautan\s+(?:dalam|ke|ke\s+pada)|link\s+(?:in|to|within)|anchor\s+link|rujukan\s+cr|cross[\s-]reference|format\s+(?:dokumen|word|excel)|(?:word|excel|powerpoint|google\s+docs?|notion|markdown)\b)/i;

/** Substantive concept / ilmu question — explain-back, not procedure-only. */
const SUBSTANTIVE_ILMU_ASK =
  /\b(?:apa\s+itu|apa\s+ialah|what\s+is|terangkan|jelaskan|huraikan|kenapa|mengapa|makna|hikmah|erti|definisi|maksud|komunikasi|alamtologi|alamin|tubuh|jiwa|nafas|hati|iman|quran|doa|penyakit|diabetes|tekanan\s+darah|fotosintesis|mitokondria|evolusi|psikologi|neuro)\b/i;

const DEPTH_OR_FRAMEWORK_ASK =
  /\b(makna\s+hidup|hikmah|alamtologi|izwa|tenaga|masa\s+→|ruang\s+kehadiran|jiwa|penceritaan|philosophy|erti\s+hidup|komunikasi\s+alam|teori\s+masa)\b/i;

const OFFICE_TOOL_CONTEXT =
  /\b(hyperlink|hiperpautan|hiperlink|pautan|bookmark|word|excel|powerpoint|google\s+docs?|notion|markdown|html|css|pdf|dokumen|document|ctrl|shortcut|insert|export|import|debug|syntax|compile|npm|docker|git|excel|spreadsheet)\b/i;

/**
 * Direct technical turn — procedure, specs, or tool how-to.
 * Replaces Explain-Back Law for this turn (generation routing, not post-stream guard).
 */
export function isDirectTechnicalHowToQuestion(message: string): boolean {
  const t = message.trim();
  if (!t || isAdamLightChatTurn(t)) return false;

  if (isTechnicalPrecisionQuestion(t)) return true;

  if (!DIRECT_HOW_TO_PROCEDURE.test(t)) return false;

  if (DEPTH_OR_FRAMEWORK_ASK.test(t)) return false;

  if (SUBSTANTIVE_ILMU_ASK.test(t) && !OFFICE_TOOL_CONTEXT.test(t)) return false;

  return true;
}

/** @deprecated Alias — same routing */
export function isDirectTechnicalTurn(message: string): boolean {
  return isDirectTechnicalHowToQuestion(message);
}

export const ADAM_DIRECT_TECHNICAL_REPLY_LAW = `
ADAM DIRECT TECHNICAL REPLY (this turn — NOT Explain-Back Law):

TURN TYPE: Direct technical / procedural question.
The student wants steps, shortcuts, specs, or tool instructions — NOT ilmu umum, NOT Alamtologi depth.

VOICE:
- Warm tutor, plain BM — helpful colleague at the keyboard, not philosopher.
- Bismillah when natural; then answer immediately.
- Short paragraphs or numbered steps when they help; no essay prelude.

DELIVER:
1. Answer the exact question FIRST — langkah, shortcut, menu path, syntax, or verified figure.
2. Use search hits honestly when specs or versions matter; never invent menu names.
3. Optional ONE line of practical tip at the end — no metaphor stack.

FORBIDDEN ON THIS TURN:
- Phase 1A/1B/2/3 explain-back sequence, gold pattern shapes, three lived pictures.
- Alamtologi labels (IZWA, RUANG, MASA, TENAGA, AMA, Leraian), framework billboard, Quran ayat.
- "Apa yang berlaku sebenarnya" philosophical reframes of a simple Ctrl+click or hyperlink step.
- Soul-touching closing question — end when the procedure is clear.

WHEN IN DOUBT: If they asked "how do I do X in Word/Excel/code", stay procedural. If they asked "apa itu komunikasi", that is a different turn type.
`.trim();
