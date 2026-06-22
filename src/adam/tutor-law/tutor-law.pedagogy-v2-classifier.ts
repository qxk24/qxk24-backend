/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Classifier
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

export type {
  PedagogyV2ClassifierOutput,
  PedagogyV2SessionState,
  PedagogyV2TurnInput,
  PedagogyV2TurnResult,
} from './tutor-law.pedagogy-v2.types';

export {
  PedagogyV2Intent,
  IThinkMapType,
  CrossCurricularCluster,
} from './tutor-law.pedagogy-v2.types';

export { classifyPedagogyV2Intent } from './tutor-law.pedagogy-v2-classifier.core';

import { classifyPedagogyV2Intent } from './tutor-law.pedagogy-v2-classifier.core';
import {
  buildPedagogyV2TurnResult,
  derivePedagogyV2SessionState,
  mergePedagogyV2SessionState,
} from './tutor-law.pedagogy-v2-mode';
import type {
  PedagogyV2TurnInput,
  PedagogyV2TurnResult,
} from './tutor-law.pedagogy-v2.types';

export {
  defaultPedagogyV2SessionState,
  derivePedagogyV2SessionState,
  mergePedagogyV2SessionState,
  commitPedagogyV2SessionState,
  buildPedagogyV2TurnResult,
  pedagogyV2SkipsZeroAnswer,
} from './tutor-law.pedagogy-v2-mode';

export {
  ADAM_TUTOR_PEDAGOGY_V2_CORE_LAW,
  buildPedagogyV2TurnLaw,
} from './tutor-law.pedagogy-v2-prompt-laws';

/** Full Pedagogy v2 result for prompt laws and guards. */
export function classifyPedagogyV2Turn(
  input: PedagogyV2TurnInput,
): PedagogyV2TurnResult {
  const derived = derivePedagogyV2SessionState(input);
  const merged = mergePedagogyV2SessionState(input.sessionState, derived);
  const output = classifyPedagogyV2Intent(input, merged);
  return buildPedagogyV2TurnResult(output, merged);
}
