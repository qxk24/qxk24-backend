/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { ADAM_UNIFIED_SURFACE_HYGIENE } from '../src/adam/adam-student-output-law';
import { ADAM_WARMTH_VOICE } from '../src/adam/adam-warmth-voice';

describe('buildAdamChatSystemPrompt — unified ADAM (student = founder voice)', () => {
  it('student stack: same character, Layer 5, knowledge laws, unified hygiene', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    expect(prompt.split('UNIFIED ADAM SURFACE').length - 1).toBe(1);
    expect(prompt).toContain(ADAM_UNIFIED_SURFACE_HYGIENE.slice(0, 40));
    expect(prompt).toContain('WHO IS ADAM');
    expect(prompt).toContain('ADAM flows like water');
    expect(prompt).toContain('FIVE RULES — CHECK EVERY REPLY');
    expect(prompt).toContain('LAYER 5 — RESPONSE GENERATION');
    expect(prompt).toContain('THE FIVE FORMS OF RESPONSE');
    expect(prompt).toContain('TEORI MASABAYU');
    expect(prompt).toContain('STUDENT MODE —');
    expect(prompt).toContain('ADAM EXPLAIN-BACK LAW');
    expect(prompt).toContain('ACTIVE TIER THIS TURN: 1');
    expect(prompt.indexOf('ADAM EXPLAIN-BACK LAW')).toBeLessThan(prompt.indexOf('TEORI MASABAYU'));
    expect(prompt.split(ADAM_WARMTH_VOICE.slice(0, 32)).length - 1).toBe(1);
    expect(prompt).not.toContain('ADAM CHARACTER — SUPREME (student turn)');
    expect(prompt).not.toContain('ANSWER FRAME (mandatory');
    expect(prompt).not.toContain('STUDENT OUTPUT LAW (L1) — SURFACE');
  });

  it('injects teaching-depth overlay from question shape', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
      userMessage:          'Boleh terangkan bagaimana ini berfungsi?',
    });
    expect(prompt).toContain('TEACHING DEPTH (this turn)');
    const salamPrompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      userMessage:          'salam',
    });
    expect(salamPrompt).not.toContain('TEACHING DEPTH (this turn)');
  });

  it('injects continuation overlay for tell-me-more', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
      userMessage:          'Tell me more about it',
    });
    expect(prompt).toContain('CONTINUATION (this turn)');
    expect(prompt).not.toContain('TEACHING DEPTH (this turn)');
  });

  it('founder stack still includes conversation guardrails', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:            'TEACHING',
      isFounder:       true,
      participantName: 'Masa Bayu',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain('FIVE RULES — CHECK EVERY REPLY');
    expect(prompt).not.toContain('UNIFIED ADAM SURFACE');
  });

  it('founder substantive chat: universal Explain-Back Law before constitutional stack', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            true,
      participantName:      'Masa Bayu',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain('ADAM EXPLAIN-BACK LAW');
    expect(prompt).toMatch(/ALL substantive turns/i);
    expect(prompt.indexOf('ADAM EXPLAIN-BACK LAW')).toBeLessThan(prompt.indexOf('TEORI MASABAYU'));
    expect(prompt).toContain('ADAM CONSTITUTIONAL HOLD');
  });
});
