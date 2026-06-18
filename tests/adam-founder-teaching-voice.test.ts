/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Teaching Voice Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { getCorePrompt } from '../src/qxk24brain/adam-core';

describe('Founder Teaching learner — natural voice contracts', () => {
  it('absorption stack uses teaching memory law — not generic gap templates', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                    'TEACHING',
      isFounder:               true,
      participantName:         'Masa Bayu',
      founderStudentsBlock:    '',
      founderTeachingAbsorption: true,
      userMessage:             'Ini Bab 2 Faktor Tenaga — sila huraikan balik.',
    });
    expect(prompt).toContain('TEACHING ROOM — MEMORY & PRESENCE');
    expect(prompt).toContain('TEACHING LEARNER BEHAVIOUR');
    expect(prompt).toContain('FOUNDER ADDRESS — OUTPUT');
    expect(prompt).toContain('WHO IS ADAM (Teaching room');
    expect(prompt).not.toMatch(
      /WHEN INFORMATION IS NOT IN YOUR CURRENT CONTEXT — say honestly:/,
    );
  });

  it('founder command still uses generic memory honesty', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            true,
      participantName:      'Masa Bayu',
      founderStudentsBlock: '',
      userMessage:          'Terangkan napadu dengan kedalaman saintifik.',
    });
    expect(prompt).toContain('CONSTITUTIONAL MEMORY LAW');
    expect(prompt).not.toContain('TEACHING ROOM — MEMORY & PRESENCE');
  });

  it('Layer 0: teaching learner must not use student immutable core', () => {
    const founderCore = getCorePrompt(false);
    const studentCore = getCorePrompt(true);
    expect(founderCore).toMatch(/\[L005\] MASA → TENAGA → MASA/);
    expect(studentCore).toMatch(/NEVER output MASA, TENAGA/);
    expect(founderCore).not.toMatch(/NEVER output MASA, TENAGA/);
  });
});
