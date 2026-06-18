/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Builder Test
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
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { ADAM_UNIFIED_SURFACE_HYGIENE } from '../src/adam/adam-users-output-law';
import { ADAM_WARMTH_VOICE } from '../src/adam/adam-warmth-voice';

describe('buildAdamChatSystemPrompt — unified ADAM (student = founder voice)', () => {
  it('student stack: same character, Layer 5, knowledge laws, unified hygiene', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Apa itu fotosintesis?',
    });
    expect(prompt.split('UNIFIED ADAM SURFACE').length - 1).toBe(1);
    expect(prompt).toContain(ADAM_UNIFIED_SURFACE_HYGIENE.slice(0, 40));
    expect(prompt).toContain('WHO IS ADAM');
    expect(prompt).toContain('ADAM flows like water');
    expect(prompt).toContain('FIVE RULES — CHECK EVERY REPLY');
    expect(prompt).not.toContain('LAYER 5 — RESPONSE GENERATION');
    expect(prompt).toContain('UNIVERSAL SCHOLAR TIER-1');
    expect(prompt).not.toContain('TEORI MASABAYU');
    expect(prompt).toContain('USER MODE —');
    expect(prompt).toMatch(/Tier 1 default = ADAM-α/i);
    expect(prompt).toMatch(/TEACHING DEPTH|KULIAH BERSTRUKTUR|TEKNIKAL \+ ESEI/i);
    expect(prompt).not.toMatch(/FORBIDDEN:.*### headers \(unless structured technical turn\)/i);
    expect(prompt).not.toContain('ADAM EXPLAIN-BACK LAW (Founder seal');
    expect(prompt).not.toContain('ACTIVE TIER THIS TURN: 1 — β EXPLAIN-BACK');
    expect(prompt.split(ADAM_WARMTH_VOICE.slice(0, 32)).length - 1).toBe(1);
    expect(prompt).not.toContain('ADAM CHARACTER — SUPREME (Users turn)');
    expect(prompt).not.toContain('ANSWER FRAME (mandatory');
    expect(prompt).not.toContain('STUDENT OUTPUT LAW (L1) — SURFACE');
  });

  it('injects teaching-depth overlay from question shape', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
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
      usersKnowledgeTier: 1,
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

  it('founder substantive β: empirical pedagogy (konvensional — no constitutional stack)', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            true,
      participantName:      'Masa Bayu',
      founderStudentsBlock: '',
      userMessage:          'Boleh terangkan tentang komunikasi antara manusia?',
    });
    expect(prompt).toMatch(/FOUNDER EMPIRICAL/i);
    expect(prompt).not.toContain('ADAM EXPLAIN-BACK LAW (Founder seal');
  });
});
