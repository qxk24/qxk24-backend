/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Compare Depth Routing Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAdamCompareTurn,
  isAdamTeachingDepthTurn,
} from '../src/adam/adam-response-generation';
import { resolveUserUmumCadanganTurn } from '../src/adam/adam-universal-scholar';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const ETHICS_COMPARE =
  'Apa perbezaan utilitarianisme dan deontologi?';

const ETHICS_PROSE = [
  'Hai QA, Utilitarianisme dan deontologi adalah dua pendekatan utama dalam etika moral.',
  'Utilitarianisme menilai tindakan berdasarkan akibatnya.',
  'Deontologi pula menilai tindakan berdasarkan kewajipan atau prinsip mutlak.',
  'Kedua-duanya bukan sekadar teori akademik, tetapi mencerminkan dua cara manusia berhadapan dengan pilihan hidup. Keseimbangan antara keduanya sering menjadi medan refleksi mendalam, bukan untuk memilih yang "lebih betul", tetapi untuk memahami apa yang kita sanggup pertahankan ketika tiada siapa melihat.',
].join('\n\n');

describe('compare / perbezaan ethics routing', () => {
  it('detects apa perbezaan as compare turn', () => {
    expect(isAdamCompareTurn(ETHICS_COMPARE)).toBe(true);
    expect(isAdamTeachingDepthTurn(ETHICS_COMPARE)).toBe(false);
    expect(resolveUserUmumCadanganTurn(ETHICS_COMPARE, [], [])).toBe(false);
  });

  it('injects compare depth overlay, not cadangan short format', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: ETHICS_COMPARE,
      participantName: 'QA',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/COMPARE \/ PERBEZAAN DEPTH/i);
    expect(prompt).toMatch(/TEACHING DEPTH/i);
    expect(prompt).not.toMatch(/CADANGAN \(this turn — substantive User ask\)/);
    expect(prompt).not.toMatch(/DILARANG: esei panjang/i);
  });

  it('preserves reflective prose on compare turn when model writes it', () => {
    const out = sanitizeUsersOutputSync(ETHICS_PROSE, ETHICS_COMPARE, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/utilitarianisme/i);
    expect(out).toMatch(/deontologi/i);
    expect(out).toMatch(/tiada siapa melihat/i);
  });
});
