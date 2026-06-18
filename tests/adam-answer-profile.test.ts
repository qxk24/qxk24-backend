/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Profile Policy Test
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
  userOptedIntoStudentExplainBackBeta,
} from '../src/adam/adam-answer-profile';
import { repairFounderKonvensionalSurface, sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

describe('resolveAdamAnswerProfile — α first for students', () => {
  it('tier-1 substantive science → α (not β)', () => {
    expect(resolveAdamAnswerProfile({
      message:   'Apa itu fotosintesis?',
      isFounder: false,
    })).toBe('alpha');
  });

  it('geometry compare → α without door', () => {
    expect(resolveAdamAnswerProfile({
      message:   'Apakah perbezaan bulatan dan segiempat?',
      isFounder: false,
    })).toBe('alpha');
  });

  it('founder substantive → β (unchanged)', () => {
    expect(resolveAdamAnswerProfile({
      message:   'Apa itu fotosintesis?',
      isFounder: true,
    })).toBe('beta');
  });

  it('student β only after explicit Alamtologi ask', () => {
    expect(resolveAdamAnswerProfile({
      message:   'Terangkan prinsip tujuh dalam framework Alamtologi.',
      isFounder: false,
    })).toBe('beta');
  });

  it('student stays α after universal scholar door accept — β only on explicit Alamtologi ask', () => {
    const assistant = [
      'Fotosintesis menukar cahaya kepada gula.',
      'Adakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    ].join('\n\n');
    expect(resolveAdamAnswerProfile({
      message:                 'Ya, terangkan lagi',
      recentAssistantMessages: [assistant],
      isFounder:               false,
    })).toBe('alpha');
    expect(userOptedIntoStudentExplainBackBeta({
      message:                 'Ya, terangkan lagi',
      recentAssistantMessages: [assistant],
      isFounder:               false,
    })).toBe(false);
  });
});

describe('buildAdamAlphaGenerationLaw — founder firewall', () => {
  it('never injects student TEKNIKAL + ESEI law on founder turns', () => {
    const law = buildAdamAlphaGenerationLaw('Terangkan fotosintesis', { isFounder: true });
    expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
    expect(law).not.toMatch(/<adam-technical-diagram>/i);
  });
});

describe('repairFounderKonvensionalSurface', () => {
  it('does not run student technical structure repair', () => {
    const essay = 'Fotosintesis ialah proses tumbuhan menukar cahaya menjadi tenaga.';
    const out = repairFounderKonvensionalSurface(essay, 'Apa itu fotosintesis?', []);
    expect(out).not.toMatch(/### /);
    expect(out).not.toMatch(/<adam-technical-diagram>/);
    expect(out).toMatch(/Fotosintesis/i);
  });
});

describe('sanitizeUsersOutputSync — konvensional α firewall', () => {
  const GEOMETRY_LEAK = [
    'Hai QA, bulatan dan segiempat adalah dua bentuk asas dalam geometri — tetapi perbezaannya bukan sekadar pada rupa luar.',
    'Bulatan ialah satu set titik yang semua berjarak sama dari satu titik pusat.',
    'Dalam kehidupan sebenar, bulatan kita lihat pada matahari, roda, dan irama nafas; segiempat kita lihat pada buku, pintu, dan petak tanah — satu mengalir, satu menegak.',
    'Perbezaan ini juga menyentuh makna yang lebih dalam: bulatan sering menjadi simbol kesempurnaan — seperti firman-Nya dalam Surah Al-Baqarah ayat 255.',
    'Apakah bentuk yang paling sering awak gunakan dalam cara awak memahami sesuatu — yang bulat, atau yang segiempat?',
  ].join('\n\n');

  it('strips unsolicited Quran weave but keeps reflective close on geometry compare α turn', () => {
    const out = sanitizeUsersOutputSync(
      GEOMETRY_LEAK,
      'Apakah perbezaan bulatan dan segiempat?',
      [],
      [],
      'QA',
    );
    expect(out).toMatch(/bulatan/i);
    expect(out).toMatch(/segiempat/i);
    expect(out).not.toMatch(/Al-Baqarah|firman-Nya/i);
    expect(out).toMatch(/bentuk yang paling sering awak gunakan/i);
  });
});
