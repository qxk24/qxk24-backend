/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM UI Plan (F1 — Turn Gate visibility)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * F1 — read-only UI planner: Turn Gate + recall/search gate → SSE steps.
 * User-facing copy uses Universal Intelligence (UI), never "agentic".
 */

import type { AdamBrainRiverTurn } from './adam-brain-river';
import type { SSEEventType } from './adam.types';

export type AdamUiPlanStepStatus = 'active' | 'done' | 'skipped';

export interface AdamUiPlanStep {
  id:     string;
  label:  string;
  status: AdamUiPlanStepStatus;
}

export type AdamUiPlanPhase = 'F1' | 'F3';

export interface AdamUiPlanPayload {
  phase:  AdamUiPlanPhase;
  lane:   string;
  topic?: string;
  steps:  AdamUiPlanStep[];
}

export function buildAdamTutorUiPlanPayload(input: {
  river:                 AdamBrainRiverTurn;
  tutorGuideSteps:       AdamUiPlanStep[];
}): AdamUiPlanPayload {
  const { river, tutorGuideSteps } = input;
  const topic = river.gate.iq.topicTitle?.trim() || undefined;
  const lane = river.gate.eq.lane;

  const steps: AdamUiPlanStep[] = [
    {
      id:     'understand',
      label:  topic
        ? `Understanding — ${topic.slice(0, 72)}`
        : 'Understanding your question',
      status: 'done',
    },
    ...tutorGuideSteps,
    {
      id:     'speak',
      label:  'UI Guide — pedagogical response',
      status: 'active',
    },
  ];

  return { phase: 'F3', lane, topic, steps };
}

export function buildAdamUiPlanPayload(input: {
  river:              AdamBrainRiverTurn;
  brainRecallLoaded:  boolean;
  brainRecallStable:  boolean;
  webSearchReason:    string | null;
  tutorGuideSteps?:   AdamUiPlanStep[];
}): AdamUiPlanPayload {
  if (input.tutorGuideSteps && input.tutorGuideSteps.length > 0) {
    return buildAdamTutorUiPlanPayload({
      river:           input.river,
      tutorGuideSteps: input.tutorGuideSteps,
    });
  }
  const { river, brainRecallLoaded, brainRecallStable, webSearchReason } = input;
  const { gate } = river;
  const topic = gate.iq.topicTitle?.trim() || undefined;
  const lane = gate.eq.lane;

  const steps: AdamUiPlanStep[] = [];

  steps.push({
    id:     'understand',
    label:  topic
      ? `Understanding — ${topic.slice(0, 72)}`
      : 'Understanding your question',
    status: 'done',
  });

  if (brainRecallLoaded) {
    steps.push({
      id:     'recall',
      label:  'Crystallised memory (C) loaded from Brain',
      status: 'done',
    });
  } else {
    steps.push({
      id:     'recall',
      label:  'Probing Brain memory',
      status: 'done',
    });
  }

  if (brainRecallStable) {
    steps.push({
      id:     'search-skip',
      label:  'Brain-first — stable topic, skipping redundant search',
      status: 'skipped',
    });
  } else if (webSearchReason) {
    steps.push({
      id:     'search',
      label:  'Factual verification on the web',
      status: 'active',
    });
  } else {
    steps.push({
      id:     'search-skip',
      label:  'No web search needed this turn',
      status: 'skipped',
    });
  }

  const laneLabel = lane === 'student'
    ? 'UI Guide — pedagogical response'
    : lane === 'founder'
      ? 'Founder lane — synthesis'
      : lane === 'niaga'
        ? 'Niaga lane — business context'
        : 'Preparing Universal Intelligence response';

  steps.push({
    id:     'speak',
    label:  laneLabel,
    status: 'active',
  });

  return { phase: 'F1', lane, topic, steps };
}

export function emitAdamUiPlanEvent(
  onEvent: (event: SSEEventType, data: string) => void,
  payload: AdamUiPlanPayload,
): void {
  onEvent('adam_ui_plan', JSON.stringify(payload));
}
