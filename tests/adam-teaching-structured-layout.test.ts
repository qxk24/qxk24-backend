/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Structured Layout Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAdamTeachingDepthTurn,
} from '../src/adam/adam-response-generation';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const OPPORTUNITY_COST_ASK = 'Apa itu kos peluang?';

const CHATGPT_STYLE_SAMPLE = [
  'Hai QA, **Kos peluang (opportunity cost)** ialah nilai manfaat terbaik yang terpaksa dilepaskan.',
  '### Formula Ringkas',
  '> **Kos Peluang = Nilai alternatif terbaik yang dikorbankan**',
  '---',
  '### Contoh Nyata 1: Pelajar',
  'Pilihan:',
  '* Belajar untuk peperiksaan.',
  '* Bekerja sambilan dan memperoleh RM30.',
  '### Ringkasan',
  'Kos peluang bukan harga A, tetapi nilai terbaik yang hilang kerana tidak memilih B.',
].join('\n\n');

describe('teaching depth structured lecture layout', () => {
  it('detects apa itu as teaching depth', () => {
    expect(isAdamTeachingDepthTurn(OPPORTUNITY_COST_ASK)).toBe(true);
    expect(isAdamTeachingDepthTurn('Terangkan opportunity cost')).toBe(true);
  });

  it('injects teaching structured layout and depth overlay', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: OPPORTUNITY_COST_ASK,
      participantName: 'QA',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/TEACHING DEPTH/i);
    expect(prompt).toMatch(/KULIAH BERSTRUKTUR/i);
    expect(prompt).toMatch(/TEKNIKAL \+ ESEI/i);
    expect(prompt).toMatch(/### Formula|### Fasa|### Langkah/i);
    expect(prompt).not.toMatch(/DILARANG:.*### tajuk/i);
    expect(prompt).not.toMatch(/ACCESSIBLE HYBRID FORMAT/i);
    expect(prompt).not.toMatch(/FORBIDDEN:.*### headers \(unless structured technical turn\)/i);
  });

  it('preserves ### headers, bold, bullets, and horizontal rules on teaching turn', () => {
    const out = sanitizeUsersOutputSync(CHATGPT_STYLE_SAMPLE, OPPORTUNITY_COST_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/^### Formula Ringkas/m);
    expect(out).toMatch(/\*\*Kos peluang/);
    expect(out).toMatch(/^> \*\*Kos Peluang/m);
    expect(out).toMatch(/^---$/m);
    expect(out).toMatch(/^\* Belajar/m);
    expect(out).toMatch(/### Ringkasan/);
  });
});
