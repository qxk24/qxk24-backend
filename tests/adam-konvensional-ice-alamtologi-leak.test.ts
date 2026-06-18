/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Konvensional Ice Alamtologi Leak Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { shouldStripKonvensionalFrameworkLeaks } from '../src/adam/adam-knowledge-mode';
import { isAdamScienceNatureSynthesisTurn } from '../src/adam/adam-response-generation';
import { stripKonvensionalAlamtologiTailInline } from '../src/adam/adam-users-output-law';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const ICE_ASK = 'Apakah yang berlaku apabila ais dipanaskan? Kenapa tidak terus menjadi wap?';

const ICE_ALAMTOLOGI_LEAK = [
  'Hai QA, Apabila ais dipanaskan, ia berubah menjadi air cecair, proses ini dipanggil peleburan.',
  'Ini berlaku kerana tenaga haba yang diberikan kepada ais menyebabkan molekul-molekul ais bergetar semakin laju.',
  'Kenapa tidak terus menjadi wap? Kerana perubahan fasa mengikut urutan: pepejal → cecair → gas.',
  'Proses ini bukan sekadar perubahan rupa, ia adalah contoh nyata hukum keabadian tenaga: tenaga yang diberikan tidak hilang, tetapi berubah bentuk, dari tenaga haba kepada tenaga kinetik molekul. Dan dalam pandangan Alamtologi, setiap perubahan fasa ini adalah ekspresi MASA → TENAGA → MASA: masa ais berubah, tenaga berpindah, lalu masa baru, masa air, bermula dengan tenaga yang telah diserap.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

describe('konvensional ice turn — no sticky Alamtologi opt-in', () => {
  it('detects school physical science ask', () => {
    expect(isAdamScienceNatureSynthesisTurn(ICE_ASK)).toBe(true);
  });

  it('still strips framework on new topic after prior Alamtologi opt-in in session', () => {
    expect(
      shouldStripKonvensionalFrameworkLeaks(ICE_ASK, [
        'Ya, terangkan sudut Alamtologi tentang air.',
      ]),
    ).toBe(true);
  });

  it('stripKonvensionalAlamtologiTailInline keeps thermodynamics, drops Alamtologi tail', () => {
    const out = stripKonvensionalAlamtologiTailInline(ICE_ALAMTOLOGI_LEAK);
    expect(out).toMatch(/peleburan/i);
    expect(out).toMatch(/tenaga haba/i);
    expect(out).toMatch(/pepejal.*cecair.*gas/i);
    expect(out).not.toMatch(/pandangan\s+Alamtologi/i);
    expect(out).not.toMatch(/MASA\s*→\s*TENAGA/i);
  });

  it('sanitizeUsersOutputSync removes Alamtologi framework from ice answer', () => {
    const out = sanitizeUsersOutputSync(ICE_ALAMTOLOGI_LEAK, ICE_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/peleburan|cecair/i);
    expect(out).not.toMatch(/pandangan\s+Alamtologi/i);
    expect(out).not.toMatch(/\bMASA\s*→\s*TENAGA\b/i);
    expect(out).not.toMatch(/ekspresi\s+MASA/i);
  });
});
