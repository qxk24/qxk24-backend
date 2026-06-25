/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { beginAdamBrainRiver } from '../src/adam/adam-brain-river';
import { buildAdamUiPlanPayload } from '../src/adam/adam-ui-plan';
import { resolveFounderTeachingFlags } from '../src/adam/adam-chat-stream-turn-context';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';
import { runTutorUiGuideLoop } from '../src/adam/adam-tutor-ui-guide-loop';
import { TUTOR_UI_GUIDE_LOOP_MAX_STEPS } from '../src/adam/adam-tutor-ui-guide-loop';

function makeRiver(message: string) {
  const teachingFlags = resolveFounderTeachingFlags({
    isFounder:               false,
    mode:                    'TUTOR',
    normalizedMessage:       message,
    hasTeachingUpload:       false,
    recentAssistantMessages: [],
    recentUserMessages:      [],
  });
  return beginAdamBrainRiver({
    isFounder:    false,
    mode:         'TUTOR',
    userMessage:  message,
    teachingFlags,
  });
}

describe('runTutorUiGuideLoop — F3 mini-loop', () => {
  const profile = {
    ...defaultTutorLearningProfile(),
    placementComplete: true,
  };

  it('caps internal tool steps at four', () => {
    const result = runTutorUiGuideLoop({
      studentId:         'uid-a',
      userMessage:       'Terangkan fotosintesis',
      profile,
      brainRecallLoaded: true,
      brainRecallStable: true,
    });
    expect(result.steps.length).toBeLessThanOrEqual(TUTOR_UI_GUIDE_LOOP_MAX_STEPS);
    expect(result.steps.some((s) => s.id === 'recall')).toBe(true);
    expect(result.steps.some((s) => s.id === 'guide')).toBe(true);
  });

  it('blocks crystallisation on checkpoint answer turns', () => {
    const checkpointProfile = {
      ...profile,
      checkpoint: {
        active:            true,
        awaitingAnswer:    true,
        currentItemId:     'cp-1',
        questionsAnswered: 1,
        itemIdsAsked:      ['cp-1'],
        itemIds:           ['cp-1'],
      },
    };
    const result = runTutorUiGuideLoop({
      studentId:         'uid-a',
      userMessage:       'Jawapan saya ialah 42',
      profile:           checkpointProfile,
      brainRecallLoaded: false,
      brainRecallStable: false,
    });
    expect(result.crystallisationBlocked).toBe(true);
    expect(result.steps.find((s) => s.id === 'guide')?.status).toBe('active');
  });
});

describe('buildAdamUiPlanPayload — F3 tutor', () => {
  it('emits F3 phase with UI Guide steps', () => {
    const river = makeRiver('Apa itu fotosintesis?');
    const guideSteps = runTutorUiGuideLoop({
      studentId:         'uid-a',
      userMessage:       'Apa itu fotosintesis?',
      profile:           defaultTutorLearningProfile(),
      brainRecallLoaded: true,
      brainRecallStable: true,
    }).steps;

    const payload = buildAdamUiPlanPayload({
      river,
      brainRecallLoaded: true,
      brainRecallStable: true,
      webSearchReason:   null,
      tutorGuideSteps:   guideSteps,
    });

    expect(payload.phase).toBe('F3');
    expect(payload.steps.find((s) => s.id === 'speak')?.label).toMatch(/UI Guide/i);
    expect(payload.steps.find((s) => s.id === 'syllabus')).toBeTruthy();
  });
});
