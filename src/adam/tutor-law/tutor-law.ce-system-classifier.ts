/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor — CE Systems (OS & Concurrency) Classifier
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
 * Consumed by: tutor-law.code-intent-classifier.ts (ce-system route)
 *
 * KEY PEDAGOGY: state/trace before policy; analysis before code; no complete drivers.
 */

export type {
  SystemClassifierInput,
  SystemClassifierOutput,
} from './tutor-law.ce-system.types';

export {
  SystemIntent,
  SystemTopic,
} from './tutor-law.ce-system.types';

export { classifySystemIntent } from './tutor-law.ce-system-classifier.core';

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { classifySystemIntent } from './tutor-law.ce-system-classifier.core';
import {
  SYS_CODE_MARKERS,
  SYS_SCENARIO_MARKERS,
  SYS_TIMING_MARKERS,
  countSystemHits,
} from './tutor-law.ce-system.signals';
import type { CEClassifierOutput } from './tutor-law.ce-intent.types';
import { CEAbstractionLayer } from './tutor-law.ce-intent.types';
import type {
  SystemClassifierInput,
  SystemClassifierOutput,
  SystemTopic,
} from './tutor-law.ce-system.types';

export const CE_SYSTEM_ROUTE = 'ce-system-classifier';

export function shouldRouteToCESystem(
  ceRouting: CEClassifierOutput | null | undefined,
): boolean {
  return ceRouting?.routeTo === CE_SYSTEM_ROUTE;
}

export function buildSystemClassifierInput(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    systemPriorTopic?: SystemTopic | null;
    stuckCount?:       number;
  };
}): SystemClassifierInput {
  const rawText = input.userMessage ?? '';
  const blob = [rawText, ...(input.recentUserMessages ?? [])].join('\n');
  const normText = normalizeMathClassifierText(rawText);

  return {
    rawText,
    normText,
    hasCodeSnippet:  countSystemHits(normText, SYS_CODE_MARKERS) >= 1
      || /```/.test(blob),
    hasScenarioDesc: countSystemHits(normText, SYS_SCENARIO_MARKERS) >= 1,
    hasTimingTrace:  countSystemHits(normText, SYS_TIMING_MARKERS) >= 1,
    stuckCount:      input.sessionState?.stuckCount ?? 0,
    priorTopic:      input.sessionState?.systemPriorTopic ?? null,
    abstractionLayer: input.ceRouting?.abstractionLayer ?? CEAbstractionLayer.OS,
  };
}

export function classifyTutorCESystemIntent(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    systemPriorTopic?: SystemTopic | null;
    stuckCount?:       number;
  };
}): SystemClassifierOutput | null {
  if (!shouldRouteToCESystem(input.ceRouting)) return null;
  return classifySystemIntent(buildSystemClassifierInput(input));
}
