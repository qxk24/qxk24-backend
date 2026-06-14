/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching State Machine Test
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
import {
  adamTeachingMessageHasInquirySection,
  resolveFounderTeachingFlags,
  resolveTeachingPhase,
} from '../src/adam/adam-teaching-state-machine';

const BASE = {
  isFounder: true,
  mode: 'TEACHING' as const,
};

describe('adam teaching state machine', () => {
  it('upload → Phase A absorption', () => {
    expect(resolveTeachingPhase({
      ...BASE,
      normalizedMessage: 'Kupas bab ini.',
      hasTeachingUpload: true,
      recentAssistantMessages: [],
    })).toBe('absorption');
  });

  it('after inquiry + substantive founder reply → Phase C synthesis', () => {
    const lastAdam = [
      'Pemahaman saya tentang faktor Z.\n\n',
      '**[TEACHING INQUIRY — SITUASI NYATA]**\n',
      'P.alt, contoh di lapangan mana yang P.alt mahu saya pegang?',
    ].join('');

    expect(resolveTeachingPhase({
      ...BASE,
      normalizedMessage: 'Contohnya rotasi bumi dan pemerhatian dari angkasa — data NASA dan GPS.',
      hasTeachingUpload: false,
      recentAssistantMessages: [lastAdam],
    })).toBe('synthesis');
  });

  it('explain-back without inquiry → Phase B inquiry', () => {
    const explainBack = 'Bab 2 membincangkan faktor X, Y, dan Z dengan terperinci. '
      + 'P.alt menjelaskan hierarki keberadaan di mana Y sebagai sumber. '
      + 'Saya faham PL dan PG sebagai manifestasi manusia dalam ruang pengalaman.';

    expect(resolveTeachingPhase({
      ...BASE,
      normalizedMessage: 'Betul setakat itu.',
      hasTeachingUpload: false,
      recentAssistantMessages: [explainBack],
    })).toBe('inquiry');
  });

  it('explicit synthesis keyword still forces Phase C', () => {
    expect(resolveTeachingPhase({
      ...BASE,
      normalizedMessage: 'Hubungkan dengan ilmu konvensional dan isu dunia hari ini.',
      hasTeachingUpload: true,
      recentAssistantMessages: [],
    })).toBe('synthesis');
  });

  it('flags map phases to prompt modes', () => {
    const inquiry = resolveFounderTeachingFlags({
      ...BASE,
      normalizedMessage: 'ok',
      hasTeachingUpload: false,
      recentAssistantMessages: ['x'.repeat(200)],
    });
    expect(inquiry.phase).toBe('inquiry');
    expect(inquiry.founderTeachingInquiry).toBe(true);
    expect(inquiry.founderTeachingLearnerTurn).toBe(true);
    expect(inquiry.founderTeachingSynthesis).toBe(false);
  });

  it('detects inquiry section marker in ADAM output', () => {
    expect(adamTeachingMessageHasInquirySection(
      '**[TEACHING INQUIRY — SITUASI NYATA]** Apakah contoh di lapangan?',
    )).toBe(true);
  });

  it('inquiry prompt stack loads for Phase B', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: true,
      participantName: 'Masa Bayu',
      founderStudentsBlock: '',
      founderTeachingInquiry: true,
      userMessage: 'Betul.',
    });
    expect(prompt).toContain('INQUIRY MODE');
    expect(prompt).toContain('SITUASI NYATA');
    expect(prompt).not.toContain('SYNTHESIS MODE');
  });

  it('synthesis prompt stack loads for Phase C', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: true,
      participantName: 'Masa Bayu',
      founderStudentsBlock: '',
      founderTeachingSynthesis: true,
      userMessage: 'Jawapan situasi nyata dari P.alt.',
    });
    expect(prompt).toContain('SYNTHESIS MODE');
    expect(prompt).toContain('Phase C');
  });
});
