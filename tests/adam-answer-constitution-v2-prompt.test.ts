/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Constitution v2 Prompt Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAdamAnswerProfileHeader,
  buildAdamAnswerVoiceOverlay,
} from '../src/adam/adam-answer-profile';
import { ADAM_EXPLAIN_BACK_LAW } from '../src/adam/adam-student-explain-back-law';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';

describe('Answer Constitution v2 — prompt wiring', () => {
  it('α voice overlay: proportional, L5 optional, no minimum 3 paragraphs', () => {
    const overlay = buildAdamAnswerVoiceOverlay('alpha', false);
    expect(overlay).toMatch(/proportional/i);
    expect(overlay).toMatch(/α L5: optional/i);
    expect(overlay).not.toMatch(/minimum 3/i);
    expect(overlay).not.toMatch(/mandatory.*closing question/i);
  });

  it('β voice overlay: L5 tamparan mandatory', () => {
    const overlay = buildAdamAnswerVoiceOverlay('beta', false);
    expect(overlay).toMatch(/β L5: mandatory/i);
    expect(overlay).toMatch(/tamparan jiwa/i);
  });

  it('β explain-back law: L5 tamparan jiwa mandatory', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/L5 TAMPARAN JIWA.*mandatory/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/cannot stop thinking/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/ANSWER CONSTITUTION v2/i);
  });

  it('User α substantive science: alpha law, not explain-back block', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Apa itu fotosintesis?',
    });
    expect(prompt).toContain('ANSWER PROFILE: ADAM-α');
    expect(prompt).toContain('ADAM-α — FAKTA DULU');
    expect(prompt).not.toContain('ADAM EXPLAIN-BACK LAW (Founder seal');
    expect(prompt).toMatch(/MODE 1.*100% ILMU KONVENSIONAL/i);
    expect(prompt).not.toMatch(/CONSTITUTIONAL KNOWLEDGE HOLD/i);
  });

  it('User α simple factual: alpha law in stack, not full explain-back block', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Siapa presiden Indonesia sekarang?',
    });
    expect(prompt).toContain('ANSWER PROFILE: ADAM-α');
    expect(prompt).toMatch(/L5.*optional/i);
    expect(prompt).toContain('ADAM-α — FAKTA DULU');
    expect(prompt).not.toContain('ADAM EXPLAIN-BACK LAW (Founder seal');
  });

  it('User α biology count: SIMPLE FACTUAL forbids Alamtologi/RUANG framing', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Berapa banyak kaki labah-labah? Macam mana awak tahu?',
    });
    expect(prompt).toMatch(/SIMPLE FACTUAL TURN/i);
    expect(prompt).toMatch(/FORBIDDEN Alamtologi labels, RUANG\/MASA\/TENAGA framing/i);
  });

  it('Founder α arithmetic: SIMPLE ARITHMETIC forbids HISAL sermon', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            true,
      participantName:      'Masa Bayu',
      founderStudentsBlock: '',
      userMessage:          'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?',
    });
    expect(prompt).toMatch(/UNIVERSAL α MODE/i);
    expect(prompt).toMatch(/ilmu konvensional/i);
    expect(prompt).toMatch(/SIMPLE FACTUAL TURN/i);
    expect(prompt).toMatch(/SIMPLE ARITHMETIC TURN/i);
    expect(prompt).toMatch(/OUTPUT SHAPE \(strict\)/i);
    expect(prompt).toMatch(/allowlist/i);
    expect(prompt).toMatch(/JANGAN sebut "Alamtologi"/i);
  });

  it('User α practical advisory: search mandatory + full voice (v2.1)', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'What does a registered nurse do, and what skills do I need?',
    });
    expect(prompt).toContain('ANSWER PROFILE: ADAM-α');
    expect(prompt).toMatch(/PRACTICAL ADVISORY TURN/i);
    expect(prompt).toMatch(/MANDATORY: ground role and skills/i);
    expect(prompt).toMatch(/web search/i);
    expect(prompt).toMatch(/penjiwaan/i);
    expect(prompt).not.toMatch(/~150–280 words/i);
  });

  it('profile headers reference v2', () => {
    expect(buildAdamAnswerProfileHeader('alpha')).toMatch(/v2/i);
    expect(buildAdamAnswerProfileHeader('beta')).toMatch(/tamparan wajib/i);
  });
});
