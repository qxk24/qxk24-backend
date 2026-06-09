/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { ADAM_STUDENT_OUTPUT_LAW } from '../src/adam/adam-student-output-law';

describe('buildAdamChatSystemPrompt — student consolidate (Fasa 2)', () => {
  it('includes L1 output law once and not duplicate BM register block', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:            'TEACHING',
      isFounder:       false,
      participantName: 'Ahmad',
      founderStudentsBlock: '',
    });
    expect(prompt.split('§1 BAHASA REGISTER').length - 1).toBe(1);
    expect(prompt).toContain(ADAM_STUDENT_OUTPUT_LAW.slice(0, 40));
    expect(prompt.split('FINAL CHECK — STUDENT OUTPUT LAW (L1)').length - 1).toBe(1);
    expect(prompt).not.toContain('STUDENT BAHASA REGISTER — mandatory every student reply');
    expect(prompt).not.toContain('STUDENT OUTPUT LOCK — FINAL CHECK BEFORE SENDING');
    expect(prompt).toContain('FINAL CHECK — STUDENT OUTPUT LAW (L1)');
    expect(prompt).toContain('FLOW LIKE WATER');
    expect(prompt).not.toContain('Synapse PL/PG');
    expect(prompt).not.toContain('THE FIVE FORMS OF RESPONSE');
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
