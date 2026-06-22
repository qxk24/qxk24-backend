/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor — CE Theory & Algorithms Classifier
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
 * Depends on : tutor-law.ce-intent-classifier.ts
 * Consumed by: tutor-law.code-intent-classifier.ts (ce-theory route)
 *
 * KEY PEDAGOGY: intuition before notation; trace before complexity; never complete proofs.
 */

export type {
  TheoryClassifierInput,
  TheoryClassifierOutput,
} from './tutor-law.ce-theory.types';

export {
  TheoryIntent,
  TheoryTopic,
} from './tutor-law.ce-theory.types';

export { classifyTheoryIntent } from './tutor-law.ce-theory-classifier.core';

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { hasCEEquationPattern } from './tutor-law.ce-intent.signals';
import { classifyTheoryIntent } from './tutor-law.ce-theory-classifier.core';
import {
  THEORY_PROOF_SIGNALS,
  countTheoryHits,
} from './tutor-law.ce-theory.signals';
import type { CEClassifierOutput } from './tutor-law.ce-intent.types';
import type {
  TheoryClassifierInput,
  TheoryClassifierOutput,
  TheoryTopic,
} from './tutor-law.ce-theory.types';
import { TheoryTopic as TheoryTopicEnum } from './tutor-law.ce-theory.types';

export const CE_THEORY_ROUTE = 'ce-theory-classifier';
export const CE_THEORY_DISCRETE_ROUTE = 'ce-theory-classifier:discrete';

export function shouldRouteToCETheory(
  ceRouting: CEClassifierOutput | null | undefined,
): boolean {
  const route = ceRouting?.routeTo ?? '';
  return route === CE_THEORY_ROUTE || route.startsWith(`${CE_THEORY_ROUTE}:`);
}

export function buildTheoryClassifierInput(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    theoryPriorTopic?: TheoryTopic | null;
    stuckCount?:       number;
  };
}): TheoryClassifierInput {
  const rawText = input.userMessage ?? '';
  const blob = [rawText, ...(input.recentUserMessages ?? [])].join('\n');
  const normText = normalizeMathClassifierText(rawText);

  const discreteRoute = input.ceRouting?.routeTo === CE_THEORY_DISCRETE_ROUTE;
  const priorTopic = discreteRoute
    ? (input.sessionState?.theoryPriorTopic ?? TheoryTopicEnum.DISCRETE_MATH)
    : (input.sessionState?.theoryPriorTopic ?? null);

  return {
    rawText,
    normText,
    hasCodeBlock:    /```/.test(blob),
    hasEquation:     hasCEEquationPattern(rawText),
    hasProofAttempt: countTheoryHits(normText, THEORY_PROOF_SIGNALS) >= 1
      && /\b(?:saya|my|attempt|cuba)\b/i.test(rawText),
    stuckCount:      input.sessionState?.stuckCount ?? 0,
    priorTopic,
  };
}

export function classifyTutorCETheoryIntent(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    theoryPriorTopic?: TheoryTopic | null;
    stuckCount?:       number;
  };
}): TheoryClassifierOutput | null {
  if (!shouldRouteToCETheory(input.ceRouting)) return null;
  return classifyTheoryIntent(buildTheoryClassifierInput(input));
}
