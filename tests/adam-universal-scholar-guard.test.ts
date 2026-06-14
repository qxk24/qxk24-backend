/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Scholar Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  paragraphIsConstitutionalValuesEssayLeak,
  paragraphIsUnsolicitedFaithSermon,
} from '../src/adam/adam-student-output-law';
import {
  UNIVERSAL_SCHOLAR_DOOR_EN,
  buildThreeTierTurnOverlay,
  paragraphIsUniversalScholarDoorOffer,
  resolveStudentKnowledgeTier,
  userOptedIntoQuranTier,
} from '../src/adam/adam-universal-scholar';

const DATA_ANALYST_Q = 'What does a data analyst do and what skills do they need?';

const REPLY2_MANIFESTO =
  'A data analyst\'s role runs far deeper than spreadsheets — clarity, responsibility, and service woven like three strands in one rope.';

const REPLY4_FAITH =
  'Spiritual accountability rises before Allah. The Quran reminds us: (Surah Al-Isra\' 17:34). Service becomes ibadah.';

const BAD_DOOR =
  'Would you like to explore this from other perspectives, for example stewardship, trust, or spiritual accountability?';

describe('Universal Scholar practical thread guards', () => {
  it('uses practical tier-1 door copy', () => {
    expect(UNIVERSAL_SCHOLAR_DOOR_EN).toMatch(/skills and tools/i);
    expect(paragraphIsUniversalScholarDoorOffer(UNIVERSAL_SCHOLAR_DOOR_EN)).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(BAD_DOOR)).toBe(false);
  });

  it('does not treat spiritual accountability acceptance as Quran tier', () => {
    expect(userOptedIntoQuranTier('Yes, spiritual accountability')).toBe(false);
    const prior = `Day-to-day analyst work.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`;
    expect(resolveStudentKnowledgeTier('Yes, spiritual accountability', [DATA_ANALYST_Q], [prior])).toBe(2);
    expect(resolveStudentKnowledgeTier('Nak rujukan ayat Quran', [DATA_ANALYST_Q], [prior])).toBe(3);
  });

  it('strips values-trifold and faith essays on practical thread follow-ups', () => {
    expect(paragraphIsConstitutionalValuesEssayLeak(REPLY2_MANIFESTO)).toBe(true);
    expect(paragraphIsUnsolicitedFaithSermon(REPLY4_FAITH)).toBe(true);

    const out = sanitizeStudentOutputSync(
      `They use SQL daily.\n\n${REPLY2_MANIFESTO}\n\n${REPLY4_FAITH}\n\n${BAD_DOOR}`,
      'Yes, tell me more',
      [DATA_ANALYST_Q],
    );
    expect(out).toMatch(/SQL daily/i);
    expect(out).not.toMatch(/three strands/i);
    expect(out).not.toMatch(/Surah/i);
    expect(out).not.toMatch(/spiritual accountability/i);
  });

  it('tier-2 practical overlay skips constitutional stack in prompt', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                    'TEACHING',
      isFounder:               false,
      participantName:         'Ahmad',
      userMessage:             'Yes, a real-world example please',
      recentUserMessages:      [DATA_ANALYST_Q],
      recentAssistantMessages: [`Overview.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`],
      founderStudentsBlock:    '',
      studentKnowledgeTier:    2,
    });
    expect(prompt).toMatch(/PRACTICAL ADVISORY TIER-2/i);
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 2 — PRACTICAL DEPTH/i);
    expect(prompt).not.toMatch(/ADAM_FOUNDER_NARRATIVE/);
    expect(buildThreeTierTurnOverlay(2, { practicalAdvisoryRoot: true })).toMatch(/150–250 words max/i);
  });
});
