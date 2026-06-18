/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Science α Gold Shape Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAdamAlphaGenerationLaw,
  resolveAdamAnswerProfile,
} from '../src/adam/adam-answer-profile';
import { isAdamScienceNatureSynthesisTurn } from '../src/adam/adam-response-generation';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const ICE_ASK = 'Apakah yang berlaku apabila ais dipanaskan? Kenapa tidak terus menjadi wap?';

/** Konvensional textbook shape — reference for General lane (no Alamtologi). */
const ICE_GOLD_KONVENSIONAL = [
  'Hai QA, apabila ais dipanaskan, ais akan mencair dan bertukar menjadi air cecair.',
  'Kenapa? Ais terdiri daripada molekul air yang tersusun rapat dalam bentuk pepejal.',
  'Apabila haba dibekalkan:',
  '1. Molekul-molekul air menerima tenaga haba.',
  '2. Molekul bergerak dengan lebih cepat dan bergetar dengan lebih kuat.',
  '3. Ikatan yang mengekalkan susunan pepejal ais menjadi semakin lemah.',
  '4. Molekul dapat bergerak dengan lebih bebas, lalu ais mencair menjadi air cecair.',
  'Jika pemanasan diteruskan, air akan menerima lebih banyak tenaga haba dan akhirnya mendidih serta bertukar menjadi wap air (gas).',
  'Kenapa tidak terus menjadi wap? Kerana perubahan fasa mengikut urutan: pepejal → cecair → gas — haba mesti cukup untuk didih.',
  'Ringkasnya: ais menyerap haba, molekul bergerak lebih aktif, lalu ais mencair menjadi air.',
].join('\n\n');

describe('science α — konvensional gold shape (ais / fasa)', () => {
  it('routes ice ask to science synthesis + α profile', () => {
    expect(isAdamScienceNatureSynthesisTurn(ICE_ASK)).toBe(true);
    expect(resolveAdamAnswerProfile({ message: ICE_ASK, isFounder: false })).toBe('alpha');
  });

  it('injects science α generation law for ice ask', () => {
    const law = buildAdamAlphaGenerationLaw(ICE_ASK);
    expect(law).toMatch(/ADAM-α SAINS \/ ALAM/i);
    expect(law).toMatch(/pepejal.*cecair.*gas/i);
    expect(law).toMatch(/DILARANG.*Alamtologi/i);
  });

  it('preserves konvensional gold answer through student guard', () => {
    const out = sanitizeUsersOutputSync(ICE_GOLD_KONVENSIONAL, ICE_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/mencair|cecair/i);
    expect(out).toMatch(/molekul/i);
    expect(out).toMatch(/tenaga haba/i);
    expect(out).toMatch(/pepejal.*cecair.*gas/i);
    expect(out).not.toMatch(/Alamtologi|MASA\s*→\s*TENAGA|peringkat\s+2|sudut\s+Alamtologi/i);
  });

  it('strips philosophy essay tail but keeps peleburan mechanism', () => {
    const leak = [
      'Hai QA, Apabila ais dipanaskan, ia berubah menjadi air cecair, proses ini dikenali sebagai peleburan.',
      'Perubahan ini berlaku kerana tenaga haba yang diberikan kepada ais menyebabkan molekul-molekul ais bergetar semakin kuat.',
      'Apabila tenaga mencukupi (pada suhu 0°C pada paras laut), struktur padat runtuh dan molekul bergerak lebih bebas, membentuk keadaan cecair.',
      'Ini bukan sekadar perubahan bentuk, tetapi perubahan fasa yang dikawal oleh prinsip fizik asas: tenaga ditambah → gerakan molekul meningkat → susunan ruang berubah → sifat zat berubah. Tiada zat lenyap atau dicipta; hanya bentuk dan susunan tenaga yang berubah, sesuai dengan hukum keabadian jirim dan tenaga.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, ICE_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/peleburan/i);
    expect(out).toMatch(/0°C|0\s*°C/i);
    expect(out).toMatch(/molekul/i);
    expect(out).not.toMatch(/bukan\s+sekadar\s+perubahan\s+bentuk/i);
    expect(out).not.toMatch(/hukum\s+keabadian/i);
    expect(out).not.toMatch(/susunan\s+ruang\s+berubah/i);
  });
});
