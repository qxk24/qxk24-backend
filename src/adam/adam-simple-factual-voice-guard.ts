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

const ECHO_QUESTION_LINE =
  /^(?:Apa\s+(?:itu|ialah)\s+nama|Apakah\s+nama|What\s+is\s+the\s+name|Soalan\s+(?:anda|ini)\s+(?:berkaitan|menanyakan))/i;

function paragraphIsEchoQuestionOpener(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (ECHO_QUESTION_LINE.test(t)) return true;
  if (/^(?:Apa|Apakah|What|Siapa)\b/i.test(t) && /\?\s*$/.test(t) && t.length < 120) return true;
  return false;
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
