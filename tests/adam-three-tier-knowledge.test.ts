/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  buildThreeTierTurnOverlay,
  paragraphIsThreeTierDoorOffer,
  resolveStudentKnowledgeTier,
  userOptedIntoAlamtologiTier,
  userOptedIntoQuranTier,
} from '../src/adam/adam-three-tier-knowledge';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';

describe('three-tier knowledge architecture', () => {
  it('defaults to tier 1 on conventional questions', () => {
    expect(resolveStudentKnowledgeTier('Apa punca diabetes?')).toBe(1);
    expect(buildThreeTierTurnOverlay(1)).toMatch(/ACTIVE TIER THIS TURN: 1/);
  });

  it('detects tier 2 opt-in', () => {
    expect(userOptedIntoAlamtologiTier('Ya, saya ingin sudut Alamtologi')).toBe(true);
    expect(resolveStudentKnowledgeTier('Ya, teruskan dari sudut Alamtologi')).toBe(2);
    expect(buildThreeTierTurnOverlay(2)).toMatch(/ACTIVE TIER THIS TURN: 2/);
  });

  it('detects tier 3 opt-in', () => {
    expect(userOptedIntoQuranTier('Ya, saya nak rujukan ayat Quran')).toBe(true);
    expect(resolveStudentKnowledgeTier('Nak pengesahan dari Quran')).toBe(3);
    expect(buildThreeTierTurnOverlay(3)).toMatch(/ACTIVE TIER THIS TURN: 3/);
  });

  it('tier door offers are kept by output guard', () => {
    const door =
      'Adakah anda ingin melihat soalan ini dari sudut Alamtologi selepas fakta saintifik tadi?';
    expect(paragraphIsThreeTierDoorOffer(door)).toBe(true);
    const out = sanitizeStudentOutputSync(
      `Diabetes berkaitan rintangan insulin.\n\n${door}`,
      'Apa punca diabetes?',
    );
    expect(out).toMatch(/sudut Alamtologi/i);
  });

  it('student prompt stack includes three-tier architecture', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    expect(prompt).toMatch(/THREE TIERS OF KNOWLEDGE/);
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 1/);
  });
});
