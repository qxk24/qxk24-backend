/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor UI Guide Loop (F3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { AdamTutorLearningProfile } from './tutor-law/tutor-law.learning-profile.types';
import type { AdamUiPlanStep } from './adam-ui-plan';
import { observeGuideMode, observeTagSyllabus } from './adam-tutor-ui-guide-tools';

export const TUTOR_UI_GUIDE_LOOP_MAX_STEPS = 4;

export function runTutorUiGuideLoop(input: {
  studentId:           string;
  userMessage:         string;
  profile:             AdamTutorLearningProfile;
  brainRecallLoaded:   boolean;
  brainRecallStable:   boolean;
}): { steps: AdamUiPlanStep[]; crystallisationBlocked: boolean } {
  void input.studentId;
  observeTagSyllabus(input.userMessage);
  observeGuideMode(input.profile, input.userMessage);

  const steps = ([
    {
      id:     'recall',
      label:  input.brainRecallLoaded ? 'UID recall loaded' : 'UID recall probe',
      status: input.brainRecallLoaded ? 'done' : 'active',
    },
    { id: 'guide', label: 'UI Guide scaffold', status: 'active' },
    { id: 'tag', label: 'Syllabus tag', status: 'active' },
    { id: 'scaffold', label: 'Scaffold release', status: 'active' },
  ] as AdamUiPlanStep[]).slice(0, TUTOR_UI_GUIDE_LOOP_MAX_STEPS);

  const crystallisationBlocked = Boolean(
    input.profile.checkpoint?.active && input.profile.checkpoint?.awaitingAnswer,
  );

  return { steps, crystallisationBlocked };
}
