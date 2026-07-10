/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM UI Plan Payload (F1 / F3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { AdamBrainRiverTurn } from './adam-brain-river';

export interface AdamUiPlanStep {
  id:     string;
  label:  string;
  status: 'active' | 'skipped' | 'done';
}

export interface AdamUiPlanPayload {
  phase: 'F1' | 'F3';
  steps: AdamUiPlanStep[];
}

export function buildAdamUiPlanPayload(input: {
  river:               AdamBrainRiverTurn;
  brainRecallLoaded:   boolean;
  brainRecallStable:   boolean;
  webSearchReason:     string | null;
  tutorGuideSteps?:    AdamUiPlanStep[];
}): AdamUiPlanPayload {
  if (input.tutorGuideSteps?.length) {
    return {
      phase: 'F3',
      steps: [
        ...input.tutorGuideSteps,
        { id: 'speak', label: 'UI Guide — synthesize reply', status: 'active' },
        { id: 'syllabus', label: 'Syllabus alignment', status: 'active' },
      ],
    };
  }

  const steps: AdamUiPlanStep[] = [];

  if (input.brainRecallStable && input.brainRecallLoaded) {
    steps.push({ id: 'search-skip', label: 'Brain-first — skip web search', status: 'skipped' });
  } else if (input.webSearchReason) {
    steps.push({ id: 'search', label: 'Web verification active', status: 'active' });
  } else {
    steps.push({ id: 'search-skip', label: 'No web search this turn', status: 'skipped' });
  }

  return { phase: 'F1', steps };
}
