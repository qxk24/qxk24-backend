/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Plan Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isUsersTechnicalPlan,
  resolveAdamAnswerPlan,
} from '../src/adam/adam-answer-plan';
import {
  beginAdamBrainRiver,
  resolveBrainRiverBranchPolicy,
} from '../src/adam/adam-brain-river';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { repairTechnicalKonvensionalDisplayStructure } from '../src/adam/adam-technical-display-structure';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const EMPTY_TEACHING = NO_FOUNDER_TEACHING_FLAGS;

describe('resolveAdamAnswerPlan — Users v1', () => {
  it('routes kos peluang to Users technical direct', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu kos peluang?',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(plan.lane).toBe('users');
    expect(plan.usersMode).toBe('technical');
    expect(plan.usersIntent).toBe('substantive');
    expect(plan.answerPolicy).toBe('direct');
    expect(plan.legacyChannelId).toBe('users-technical');
    expect(isUsersTechnicalPlan(plan)).toBe(true);
  });

  it('routes salam to Users general light', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'salam',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(plan.lane).toBe('users');
    expect(plan.usersMode).toBe('general');
    expect(plan.usersIntent).toBe('light');
    expect(isUsersTechnicalPlan(plan)).toBe(false);
  });

  it('routes fotosintesis to Users technical', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu fotosintesis?',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(plan.usersMode).toBe('technical');
    expect(plan.answerPolicy).toBe('direct');
  });

  it('passes Tutor through as Student withhold (v1 unchanged)', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TUTOR',
      userMessage: 'A - 4 = 2',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(plan.lane).toBe('student');
    expect(plan.answerPolicy).toBe('withhold');
  });
});

describe('brain river — Users technical finalize from answer plan', () => {
  it('enables usersTechnicalFinalize for fotosintesis via plan not legacy channel', () => {
    const river = beginAdamBrainRiver({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu fotosintesis?',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(river.channel.channelId).toBe('users-technical');
    expect(river.answerPlan.usersMode).toBe('technical');

    const policy = resolveBrainRiverBranchPolicy(river.channel, {
      knowledgeMode: 'konvensional',
      isGuestTrial: false,
      isFounder: false,
      userMessage: 'Apa itu fotosintesis?',
      answerPlan: river.answerPlan,
    });
    expect(policy.usersTechnicalFinalize).toBe(true);
  });
});

describe('Users direct technical prompt + repair', () => {
  it('injects DIRECT TECHNICAL law when answerPlan is technical', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu kos peluang?',
      teachingFlags: EMPTY_TEACHING,
    });
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      participantName: 'QA',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage: 'Apa itu kos peluang?',
      answerPlan: plan,
    });
    expect(prompt).toContain('USERS DIRECT TECHNICAL');
    expect(prompt).toContain('ANSWER SHAPE — DEFINITIONAL');
    expect(prompt).not.toContain('TEKNIKAL + ESEI = C');
    expect(prompt).not.toContain('ADAM GENERAL PROSE KONVENSIONAL');
  });

  it('injects COMPARATIVE shape for jenayah vs sivil', () => {
    const ask = 'Apa perbezaan antara hukum jenayah dan hukum sivil?';
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: EMPTY_TEACHING,
    });
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      participantName: 'QA',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage: ask,
      answerPlan: plan,
    });
    expect(prompt).toContain('ANSWER SHAPE — COMPARATIVE');
    expect(prompt).toContain('Jadual 1');
    expect(prompt).not.toContain('COMPARATIVE FORMAL DATA');
  });

  it('injects ### structure for kos peluang prose via answer plan repair', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu kos peluang?',
      teachingFlags: EMPTY_TEACHING,
    });
    const prose = [
      'Hai QA, kos peluang ialah nilai terbaik yang hilang apabila memilih satu alternatif.',
      'Contoh: jika RM100 dibelanjakan buku, kos peluangnya ialah barang lain yang tidak dibeli.',
      'Idea ini penting dalam ekonomi dan keputusan harian.',
    ].join('\n\n');
    const out = repairTechnicalKonvensionalDisplayStructure(prose, 'Apa itu kos peluang?', {
      answerPlan: plan,
    });
    expect(out).toMatch(/^### /m);
    expect(out).not.toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });
});
