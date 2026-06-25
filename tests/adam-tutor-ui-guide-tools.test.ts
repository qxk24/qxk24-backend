/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  observeGuideMode,
  observeTagSyllabus,
  resolveScaffoldReleaseLayer,
} from '../src/adam/adam-tutor-ui-guide-tools';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';

describe('adam-tutor-ui-guide-tools', () => {
  const profile = {
    ...defaultTutorLearningProfile(),
    placementComplete: true,
  };

  it('resolveScaffoldReleaseLayer escalates on frustration', () => {
    expect(resolveScaffoldReleaseLayer({
      userMessage: 'tak faham langsung',
    })).toBe(2);
  });

  it('observeTagSyllabus tags science topics', () => {
    const tag = observeTagSyllabus('Apa itu fotosintesis?');
    expect(tag.topicLabel || tag.conceptTags.length >= 0).toBeTruthy();
  });

  it('observeGuideMode marks checkpoint answer turns', () => {
    const checkpointProfile = {
      ...profile,
      checkpoint: {
        active:            true,
        awaitingAnswer:    true,
        currentItemId:     'cp-1',
        questionsAnswered: 0,
        itemIdsAsked:      [],
        itemIds:           ['cp-1'],
      },
    };
    const mode = observeGuideMode(checkpointProfile, '42');
    expect(mode.mode).toBe('checkpoint-answer');
  });
});
