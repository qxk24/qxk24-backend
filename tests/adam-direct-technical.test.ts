/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Direct Technical Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  ADAM_DIRECT_TECHNICAL_REPLY_LAW,
  isDirectTechnicalHowToQuestion,
} from '../src/adam/adam-direct-technical-law';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';

describe('isDirectTechnicalHowToQuestion', () => {
  it('detects hyperlink how-to as direct technical', () => {
    expect(isDirectTechnicalHowToQuestion('Bagaimana nak buat hyperlink dalam Word?')).toBe(true);
    expect(isDirectTechnicalHowToQuestion('cara buat hiperpautan')).toBe(true);
  });

  it('does not treat substantive ilmu as direct technical', () => {
    expect(isDirectTechnicalHowToQuestion('Apa itu komunikasi?')).toBe(false);
    expect(isDirectTechnicalHowToQuestion('Terangkan apa itu ALAMIN')).toBe(false);
    expect(isDirectTechnicalHowToQuestion('Bagaimana komunikasi berlaku dalam keluarga?')).toBe(false);
  });

  it('detects spec precision questions', () => {
    expect(isDirectTechnicalHowToQuestion('Berapa km/l enjin 1.3?')).toBe(true);
  });

  it('skips light chat', () => {
    expect(isDirectTechnicalHowToQuestion('salam')).toBe(false);
  });
});

describe('buildAdamChatSystemPrompt — direct technical routing', () => {
  it('uses Direct Technical Law instead of Explain-Back for hyperlink question', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Kujaafar',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Bagaimana nak buat hyperlink?',
    });
    expect(prompt).toContain('ADAM DIRECT TECHNICAL REPLY');
    expect(prompt).not.toContain('GOLD PATTERNS');
    expect(prompt).not.toContain('PHASE 1A');
    expect(prompt).toMatch(/FORBIDDEN ON THIS TURN/i);
  });

  it('keeps Explain-Back Law for general substantive question', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Kujaafar',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Apa itu komunikasi?',
    });
    expect(prompt).toContain('ADAM EXPLAIN-BACK LAW');
    expect(prompt).not.toContain('ADAM DIRECT TECHNICAL REPLY (this turn');
    expect(prompt).toContain('PHASE 1A');
  });

  it('embeds direct technical forbidden Alamtologi weave', () => {
    expect(ADAM_DIRECT_TECHNICAL_REPLY_LAW).toMatch(/IZWA|RUANG/i);
    expect(ADAM_DIRECT_TECHNICAL_REPLY_LAW).toMatch(/hyperlink/i);
  });
});
