/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Bismillah Grammar Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildFinalResponseForSave } from '../src/adam/adam-chat-stream-post-finalize';
import { ensureUsersHaiGreeting } from '../src/adam/adam-users-constitution';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const GRAMMAR_ASK = 'Apakah kata nama am? Beri contoh.';

const GRAMMAR_BISMILLAH_LEAK = [
  'Hai QA, bismillahirahmanirrahim.',
  '',
  'Kata nama am ialah kata nama yang merujuk kepada kumpulan umum atau jenis benda, orang, haiwan, atau perkara secara tidak khusus, bukan nama individu atau tempat tertentu.',
  'Contohnya: kucing.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n');

describe('student grammar — Bismillah strip', () => {
  it('ensureUsersHaiGreeting strips Bismillah when Hai QA already matches', () => {
    const out = ensureUsersHaiGreeting(
      GRAMMAR_BISMILLAH_LEAK,
      'QA',
      'Hai Adam, apakah kata nama am?',
    );
    expect(out).toMatch(/^Hai QA,\s*Kata nama am/i);
    expect(out).not.toMatch(/bismillah/i);
  });

  it('sanitizeUsersOutputSync removes inline Bismillah after Hai greeting', () => {
    const out = sanitizeUsersOutputSync(
      GRAMMAR_BISMILLAH_LEAK,
      'Hai Adam, apakah kata nama am?',
      [],
      [],
      'QA',
      {
      enforceUsersGreeting: true,
    },
    );
    expect(out).not.toMatch(/bismillah/i);
    expect(out).toMatch(/kata nama am/i);
  });

  it('buildFinalResponseForSave last-mile strips Bismillah for students', () => {
    const saved = buildFinalResponseForSave({
      shell: {
        userMessage: 'Hai Adam, apakah kata nama am?',
        isFounder: false,
        participant: { userName: 'QA' },
      } as never,
      fullResponse: GRAMMAR_BISMILLAH_LEAK,
      journal: {} as never,
      journalSealCleanResponse: GRAMMAR_BISMILLAH_LEAK,
    });
    expect(saved).not.toMatch(/bismillah/i);
    expect(saved).toMatch(/Contohnya: kucing/i);
  });
});
