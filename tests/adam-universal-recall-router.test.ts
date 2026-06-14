/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Recall Router Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD } from '../src/adam/adam-universal-scholar';
import { shouldRunUniversalTeachingRecall } from '../src/adam/adam-universal-recall-router';
import { formatTeachingRecordEpisodeLines } from '../src/qxk24brain/adam-teaching-record.service';

describe('universal recall router gate', () => {
  it('runs on substantive questions without bab keyword', () => {
    expect(shouldRunUniversalTeachingRecall({
      message: 'Apa bentuk bumi dan kenapa kelihatan bulat?',
      teachingAbsorption: false,
      bookAwareRecallLoaded: false,
    })).toBe(true);
  });

  it('skips light chat and founder teaching absorption', () => {
    expect(shouldRunUniversalTeachingRecall({
      message: 'Terima kasih ADAM',
      teachingAbsorption: false,
      bookAwareRecallLoaded: false,
    })).toBe(false);
    expect(shouldRunUniversalTeachingRecall({
      message: 'Kupas bab ini.',
      teachingAbsorption: true,
      bookAwareRecallLoaded: false,
    })).toBe(false);
  });

  it('skips when book-aware recall already loaded', () => {
    expect(shouldRunUniversalTeachingRecall({
      message: 'Terangkan faktor xyz',
      teachingAbsorption: false,
      bookAwareRecallLoaded: true,
    })).toBe(false);
  });

  it('skips guest trial', () => {
    expect(shouldRunUniversalTeachingRecall({
      message: 'Apa bentuk bumi?',
      teachingAbsorption: false,
      bookAwareRecallLoaded: false,
      isGuestTrial: true,
    })).toBe(false);
  });

  it('skips founder personal biography recall probe', () => {
    expect(shouldRunUniversalTeachingRecall({
      message: 'Adam kena rujuk kisah saya dari kecil',
      teachingAbsorption: false,
      bookAwareRecallLoaded: false,
    })).toBe(false);
  });
});

describe('universal recall policy alignment', () => {
  it('tier-1 hold allows explain-back synthesis when recall in context', () => {
    expect(ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD).toMatch(/UNIVERSAL TEACHING RECALL/);
    expect(ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD).toMatch(/EXPLAIN-BACK LAW/);
    expect(ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD).toMatch(/Phase 1B/);
    expect(ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD).not.toMatch(/INTERNAL ONLY on tier 1/);
  });

  it('student tier-1 prompt includes recall-aware overlay', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'QUESTIONING',
      isFounder: false,
      participantName: 'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    expect(prompt).toMatch(/teaching recall episodes are in context/i);
    expect(prompt).toMatch(/EXPLAIN-BACK LAW/);
  });
});

describe('formatTeachingRecordEpisodeLines', () => {
  it('formats episodes for universal block', () => {
    const lines = formatTeachingRecordEpisodeLines([{
      recordId: 'r1',
      founderId: 'masa-bayu',
      transformationId: 't1',
      entity_C_uid: 'C-1',
      masa_recorded: new Date('2026-06-01'),
      stage: 2,
      family: 'Earth shape',
      principle: 'Rotation',
      isNewFamily: false,
      teacherRole: 'founder',
      teacherName: 'Masa Bayu',
      episodeSummary: 'ABA rotation lesson',
      teachingIntent: 'P.alt taught rotation and observation',
      outcomeSummary: 'ADAM linked spin to apparent roundness',
      relationalTags: ['earth'],
      autoJudgment: 'MAKMUR',
      auditStatus: 'confirmed',
      kernel: 'v1.7.0',
      era: 'ERA_1',
      status: 'active',
    }]);
    expect(lines[0]).toMatch(/ABA rotation lesson/);
    expect(lines[0]).toMatch(/P\.alt taught/);
  });
});
