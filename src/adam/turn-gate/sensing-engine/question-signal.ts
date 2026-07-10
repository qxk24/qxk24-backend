/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing — Question Signal (S1)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

import {
  isAdamOpinionEvaluativeTurn,
  isAdamProcedureHowToTurn,
  isAdamRecordSuperlativeTurn,
  isAdamTranslationTurn,
} from '../../adam-domain-detectors';
import {
  isAdamCompareTurn,
  isAdamContinuationDepthTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
  isAdamSimpleArithmeticTurn,
  isAdamSimpleFactualTurn,
} from '../../adam-response-generation';
import { isAdamProseCraftTurn } from '../../adam-prose-craft';
import type { AdamSurfaceKind } from './adam-sensing.types';

/** QuestionSignalReader — surface kind without domain routing. */
export function readQuestionSignal(message: string): AdamSurfaceKind {
  const t = message.trim();
  if (!t || isAdamLightChatTurn(t)) return 'greeting';
  if (isAdamProseCraftTurn(t)) return 'prose-craft';
  if (isAdamRecordSuperlativeTurn(t)) return 'record-superlative';
  if (isAdamSimpleFactualTurn(t)) return 'factual';
  if (isAdamSimpleArithmeticTurn(t)) return 'arithmetic';
  if (isAdamRelationalPersonalTurn(t)) return 'relational';
  if (isAdamPracticalAdvisoryTurn(t)) return 'practical';
  if (isAdamContinuationDepthTurn(t)) return 'continuation';
  if (/\b(?:terangkan|jelaskan|huraikan)\s+lagi\b/i.test(t)) return 'depth';
  if (isAdamCompareTurn(t)) return 'comparative';
  if (isAdamTranslationTurn(t)) return 'translation';
  if (isAdamProcedureHowToTurn(t)) return 'procedure-howto';
  if (isAdamOpinionEvaluativeTurn(t)) return 'opinion-evaluative';
  if (/\b(?:apakah\s+kesan|apakah\s+implikasi|bagaimana\s+ia\s+mempengaruhi|mengapa\s+berlaku)\b/i.test(t)) {
    return 'causal';
  }
  if (/\b(?:apa\s+itu|apakah|definisi|maksud)\b/i.test(t)) return 'definitional';
  if (/\b(?:dan\s+bagaimana|serta\s+kesan|yang\s+dimaksudkan)\b/i.test(t)) return 'compound';
  if (/\b(?:stress|stres|cemas|sedih|penat|letih|burnout)\b/i.test(t)) return 'wellbeing';
  return 'substantive';
}
