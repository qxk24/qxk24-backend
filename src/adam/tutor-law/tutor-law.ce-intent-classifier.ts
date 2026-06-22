/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor — Computer Engineering Master Classifier
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
 * POSITION IN PIPELINE:
 *   router.ts → code-intent-classifier → [isCE?] → ce-intent-classifier
 */

export type {
  CEClassifierInput,
  CEClassifierOutput,
} from './tutor-law.ce-intent.types';

export {
  CESubdomain,
  CEAbstractionLayer,
  CESecurityFlag,
} from './tutor-law.ce-intent.types';

export { classifyCEIntent, resolveCERouteTo } from './tutor-law.ce-intent-classifier.core';

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { classifyCEIntent } from './tutor-law.ce-intent-classifier.core';
import {
  CE_DOMAIN_MARKERS,
  DIAGRAM_SIGNALS,
  countCEHits,
  hasCEEquationPattern,
} from './tutor-law.ce-intent.signals';
import type {
  CEAbstractionLayer,
  CEClassifierInput,
  CESubdomain,
} from './tutor-law.ce-intent.types';

export function isTutorCEDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  const blob = normalizeMathClassifierText([message, ...recentUserMessages].join('\n'));
  if (!blob || blob.length < 6) return false;
  return countCEHits(blob, CE_DOMAIN_MARKERS) >= 1;
}

export function buildCEClassifierInput(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  sessionState?: {
    codeHasCodeBlock?:   boolean;
    cePriorSubdomain?:   CESubdomain | null;
    cePriorLayer?:       CEAbstractionLayer | null;
    stuckCount?:         number;
  };
}): CEClassifierInput {
  const rawText = input.userMessage ?? '';
  const blob = [rawText, ...(input.recentUserMessages ?? [])].join('\n');
  const normText = normalizeMathClassifierText(rawText);

  return {
    rawText,
    normText,
    hasCodeBlock:   input.sessionState?.codeHasCodeBlock ?? /```/.test(blob),
    hasEquation:    hasCEEquationPattern(rawText),
    hasDiagram:     countCEHits(normText, DIAGRAM_SIGNALS) >= 1,
    stuckCount:     input.sessionState?.stuckCount ?? 0,
    priorSubdomain: input.sessionState?.cePriorSubdomain ?? null,
    priorLayer:     input.sessionState?.cePriorLayer ?? null,
  };
}

export function classifyTutorCEIntent(
  userMessage: string,
  sessionState?: {
    codeHasCodeBlock?: boolean;
    cePriorSubdomain?: CESubdomain | null;
    cePriorLayer?:     CEAbstractionLayer | null;
    stuckCount?:       number;
  },
): ReturnType<typeof classifyCEIntent> {
  return classifyCEIntent(buildCEClassifierInput({ userMessage, sessionState }));
}
