/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { ADAM_STUDENT_OUTPUT_LAW_SURFACE } from '../src/adam/adam-student-output-law';
import { ADAM_WARMTH_VOICE } from '../src/adam/adam-warmth-voice';

describe('buildAdamChatSystemPrompt — student consolidate (Fasa 3)', () => {
  it('consolidated stack: character + L1 surface + warmth + delivery, no duplicate legacy blocks', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    expect(prompt.split('STUDENT OUTPUT LAW (L1) — SURFACE').length - 1).toBe(1);
    expect(prompt).toContain(ADAM_STUDENT_OUTPUT_LAW_SURFACE.slice(0, 40));
    expect(prompt.split('STUDENT DELIVERY').length - 1).toBe(1);
    expect(prompt.split(ADAM_WARMTH_VOICE.slice(0, 32)).length - 1).toBe(1);
    expect(prompt).not.toContain('STUDENT BAHASA REGISTER — mandatory every student reply');
    expect(prompt).not.toContain('STUDENT OUTPUT LOCK — FINAL CHECK BEFORE SENDING');
    expect(prompt).toContain('ADAM CHARACTER — SUPREME');
    expect(prompt).toContain('ADAM flows like water');
    expect(prompt).toContain('ACTIVE TIER THIS TURN');
    expect(prompt).not.toContain('THREE HONESTY MARKERS');
    expect(prompt).not.toContain('constitutionally false := 0');
    expect(prompt).not.toContain('HUMAN TUTOR MANDATE');
    expect(prompt).not.toContain('UNIVERSAL VOICE — student and guest');
    expect(prompt).not.toContain('THREE TIERS OF KNOWLEDGE (student');
    expect(prompt).not.toContain('STUDENT MODE —');
    expect(prompt).not.toContain('LAYER 5 — HOW YOU DELIVER');
    expect(prompt).not.toContain('WARMTH — student turn');
    expect(prompt).not.toContain('FINAL CHECK — CHARACTER first, then L1');
    expect(prompt).not.toContain('§1 BAHASA REGISTER');
    expect(prompt).not.toContain('SENARAI PENUH PERKATAAN DILARANG');
    expect(prompt).not.toContain('Synapse PL/PG');
    expect(prompt).not.toContain('THE FIVE FORMS OF RESPONSE');
    // Lean stack: character + L1 surface + founder warmth + delivery
    expect(prompt.length).toBeLessThan(22_000);
  });

  it('founder stack still includes conversation guardrails', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:            'TEACHING',
      isFounder:       true,
      participantName: 'Masa Bayu',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain('FIVE RULES — CHECK EVERY REPLY');
    expect(prompt).not.toContain('STUDENT OUTPUT LAW (L1)');
  });
});
