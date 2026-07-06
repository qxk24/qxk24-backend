/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Simple Factual Voice Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { isAdamSingleTokenConceptTurn } from './adam-stable-curriculum-search-gate';
import {
  isAdamLightChatTurn,
  isAdamSimpleFactualTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { outputHasKonvensionalFrameworkLeak } from './adam-users-output-law';
import {
  userAskedForAlamtologi,
  userAskedForConstitutionalStructure,
} from './adam-universal-voice';

const ECHO_QUESTION_LINE =
  /^(?:Apa\s+(?:itu|ialah)\s+nama|Apakah\s+nama|What\s+is\s+the\s+name|Soalan\s+(?:anda|ini)\s+(?:berkaitan|menanyakan))/i;

function paragraphIsEchoQuestionOpener(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (ECHO_QUESTION_LINE.test(t)) return true;
  if (/^(?:Apa|Apakah|What|Siapa)\b/i.test(t) && /\?\s*$/.test(t) && t.length < 120) return true;
  return false;
}

/** Unsolicited Alamtologi weave on definitional / "Apa itu" turns. */
export function outputHasSimpleFactualAlamtologiLeak(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (outputHasKonvensionalFrameworkLeak(t)) return true;
  if (/\bDalam\s+(?:konteks|perspektif|lens[ae]|pandangan)\s+Alamtologi\b/i.test(t)) return true;
  if (/\b(?:sudut|perspektif)\s+Alamtologi\b/i.test(t)) return true;
  if (/\bAlamtologi\b/i.test(t) && /\b(?:TENAGA|MASA|CAHAYA|RUANG|IZWA)\b/.test(t)) return true;
  return false;
}

/** Post-stream repair stripped framework from a simple factual turn — keep sanitized surface. */
export function isSimpleFactualFrameworkLeakRepair(
  raw: string,
  surface: string,
  userMessage: string,
): boolean {
  if (!isAdamSimpleFactualTurn(userMessage)) return false;
  if (userAskedForAlamtologi(userMessage)) return false;
  if (userAskedForConstitutionalStructure(userMessage)) return false;
  const prev = raw.trim();
  const next = surface.trim();
  if (!prev || !next || prev === next) return false;
  return outputHasSimpleFactualAlamtologiLeak(prev);
}

/** Philosophy / virtue tail after a plain definitional answer. */
export function paragraphIsSimpleFactualPhilosophyTail(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bhikmah\s+dan\s+adab\b/i.test(t)) return true;
  if (/\b(?:bentuk|semua)\s+tenaga\b/i.test(t)) return true;
  if (/\bamanah\b/i.test(t) && /\b(?:teknologi|kuasa|kekuasaan)\b/i.test(t)) return true;
  if (/\bAllah\b/i.test(t) && /\b(?:mengetahui|segala-galanya)\b/i.test(t)) return true;
  return false;
}

/** Drop virtue / amanah sermon tails on α simple factual turns. */
export function stripSimpleFactualPhilosophyTail(text: string, userMessage: string): string {
  const t = stripLeadingAdamSalutation(userMessage).trim();
  if (!t || isAdamLightChatTurn(t)) return text;
  if (!isAdamSimpleFactualTurn(t)) return text;
  if (userAskedForAlamtologi(t) || userAskedForConstitutionalStructure(t)) return text;

  return text
    .split(/\n{2,}/)
    .filter((para) => !paragraphIsSimpleFactualPhilosophyTail(para))
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Strip question-echo openers on α simple factual turns (V-H03). */
export function stripSimpleFactualEchoOpener(text: string, userMessage: string): string {
  const t = stripLeadingAdamSalutation(userMessage).trim();
  if (!t || isAdamLightChatTurn(t)) return text;
  if (!isAdamSimpleFactualTurn(t) && !isAdamSingleTokenConceptTurn(t)) return text;

  const parts = text.split(/\n{2,}/);
  while (parts.length > 1 && paragraphIsEchoQuestionOpener(parts[0]!)) {
    parts.shift();
  }
  if (parts.length === 1 && paragraphIsEchoQuestionOpener(parts[0]!)) {
    return '';
  }
  return parts.join('\n\n').trim();
}
