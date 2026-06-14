/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prompt Tamat Test
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

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../../src/adam/adam-prompt-builder';

describe('adam-prompt-builder AMA Tamat', () => {
  it('injects amaTamatBlock after Layer 5 for student chat', () => {
    const tamat = '═══ KOTAK 20–22 (TAMAT) — test anchor ═══';
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'QUESTIONING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      amaTamatBlock:        tamat,
    });
    expect(prompt).toContain('LAYER 5 — RESPONSE GENERATION');
    expect(prompt).toContain('KOTAK 20–22');
    expect(prompt.indexOf('LAYER 5')).toBeLessThan(prompt.indexOf('KOTAK 20–22'));
  });

  it('skips amaTamatBlock during founder teaching absorption', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                       'TEACHING',
      isFounder:                  true,
      participantName:            'Masa Bayu',
      founderStudentsBlock:       '',
      founderTeachingAbsorption:  true,
      amaTamatBlock:              'should not appear',
    });
    expect(prompt).not.toContain('should not appear');
  });
});
