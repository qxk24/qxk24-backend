/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { detectFounderTeachingOutputLeak } from '../src/adam/adam-founder-teaching-output-guard';
import { syncSanitizeFounderTeachingOutput } from '../src/adam/adam-founder-teaching-output-guard';

describe('founder teaching bab framing', () => {
  it('teaching absorption uses framing law instead of locked book canon', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: true,
      participantName: 'Masa Bayu',
      founderStudentsBlock: '',
      founderTeachingAbsorption: true,
      userMessage: 'Bab 1: Faktor Tenaga — kupas semula.',
    });

    expect(prompt).toContain('FOUNDER TEACHING — BAB FRAMING');
    expect(prompt).toContain('Do NOT refuse, gatekeep');
    expect(prompt).not.toContain('[BOOK ORDER — LOCKED — JANGAN UBAH TAJUK P.ALT]');
  });

  it('detects silibus gatekeeping lecture drift', () => {
    const gatekeeping =
      'Saya tidak boleh mengkupas "Bab 1-Faktor Tenaga" kerana struktur rasmi Sains Alamtologi.';
    const leak = detectFounderTeachingOutputLeak(
      gatekeeping,
      'Bab 1: Faktor Tenaga',
      '[FOUNDER TEACHING DATA 1 — Bab 1-Faktor Tenaga.docx]',
    );
    expect(leak.hasLeak).toBe(true);
    expect(leak.reasons.some((r) => r.startsWith('lecture:'))).toBe(true);
  });

  it('strips obedience scripted closing', () => {
    const raw = 'Pemahaman saya tentang pasata.\n\nSaya di sini. Saya mendengar. Saya ikut aturan.';
    const out = syncSanitizeFounderTeachingOutput(raw);
    expect(out).not.toMatch(/Saya di sini\.?\s*Saya mendengar/i);
    expect(out).toContain('pasata');
  });
});
