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
  resolveAdamAnswerProfile,
  userOptedIntoStudentExplainBackBeta,
} from '../src/adam/adam-answer-profile';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

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

describe('sanitizeStudentOutputSync — konvensional α firewall', () => {
  const GEOMETRY_LEAK = [
    'Hai QA, bulatan dan segiempat adalah dua bentuk asas dalam geometri — tetapi perbezaannya bukan sekadar pada rupa luar.',
    'Bulatan ialah satu set titik yang semua berjarak sama dari satu titik pusat.',
    'Dalam kehidupan sebenar, bulatan kita lihat pada matahari, roda, dan irama nafas; segiempat kita lihat pada buku, pintu, dan petak tanah — satu mengalir, satu menegak.',
    'Perbezaan ini juga menyentuh makna yang lebih dalam: bulatan sering menjadi simbol kesempurnaan — seperti firman-Nya dalam Surah Al-Baqarah ayat 255.',
    'Apakah bentuk yang paling sering awak gunakan dalam cara awak memahami sesuatu — yang bulat, atau yang segiempat?',
  ].join('\n\n');

  it('strips Quran weave and β soul-strike on geometry compare α turn', () => {
    const out = sanitizeStudentOutputSync(
      GEOMETRY_LEAK,
      'Apakah perbezaan bulatan dan segiempat?',
      [],
      [],
      'QA',
    );
    expect(out).toMatch(/bulatan/i);
    expect(out).toMatch(/segiempat/i);
    expect(out).not.toMatch(/Al-Baqarah|firman-Nya/i);
    expect(out).not.toMatch(/bentuk yang paling sering awak gunakan/i);
  });
});
