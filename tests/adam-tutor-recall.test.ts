/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { detectContextRecallLoaded } from '../src/adam/adam-universal-recall-router';
import { TUTOR_UID_RECALL_HEADER } from '../src/adam/adam-tutor-recall.service';
import { shouldSkipTutorUidRecall } from '../src/adam/adam-user-brain.gate';

describe('adam-tutor-recall — UID scoped', () => {
  it('detectContextRecallLoaded recognises tutor UID recall header', () => {
    const loaded = detectContextRecallLoaded([
      { content: `${TUTOR_UID_RECALL_HEADER}\nPelajar: Ali` },
    ]);
    expect(loaded).toBe(true);
  });

  it('shouldSkipTutorUidRecall blocks empty student or message', () => {
    expect(shouldSkipTutorUidRecall('', 'fotosintesis')).toBe(true);
    expect(shouldSkipTutorUidRecall('ali', '')).toBe(true);
    expect(shouldSkipTutorUidRecall('ali', 'fotosintesis')).toBe(false);
  });
});
