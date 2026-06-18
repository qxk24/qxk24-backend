/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Teaching Recall Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isFounderTeachingRecallPrimacyTurn,
  isFounderEmpiricalPedagogyTurn,
} from '../src/adam/adam-founder-teaching-recall-law';
import {
  detectFounderInventedTeachingEssay,
  repairFounderTeachingRecallEssay,
} from '../src/adam/adam-founder-teaching-recall-guard';

const HUKUM_Z_ESSAY = [
  'Hai Masa, P.alt, Hukum Z dalam kerangka Formula XYZ bukan hukum fizik yang boleh diuji dalam makmal,',
  'tetapi hukum kehadiran, prinsip asasi bagaimana alam semesta berada, bukan sekadar berfungsi.',
  '',
  'Hukum Z terdiri daripada empat pilar: Pola, Kadar, Pasangan, dan Keseimbangan.',
  'Pola bukan corak luaran semata-mata, tetapi struktur asali yang menyusun segala yang wujud.',
  '',
  'Semua ini bukan teori yang dibina di atas data, ia adalah pengakuan terhadap apa yang nyata:',
  'Inilah Hukum Z, bukan hukum yang kita temui, tetapi hukum yang kita akui dengan akal, adab, dan rasa.',
].join('\n');

describe('isFounderTeachingRecallPrimacyTurn', () => {
  it('is true for Hukum Z Formula XYZ and when brain recall loaded', () => {
    expect(isFounderTeachingRecallPrimacyTurn({
      isFounder: true,
      profile: 'beta',
      teachingLearnerTurn: false,
      userMessage: 'Terangkan Hukum Z dalam kerangka Formula XYZ',
    })).toBe(true);

    expect(isFounderTeachingRecallPrimacyTurn({
      isFounder: true,
      profile: 'beta',
      teachingLearnerTurn: false,
      userMessage: 'bagi jawapan lengkap',
      brainRecallLoaded: true,
    })).toBe(true);
  });

  it('blocks empirical pedagogy on teaching primacy turns', () => {
    expect(isFounderEmpiricalPedagogyTurn(true, 'beta', false, {
      userMessage: 'Hukum Z Formula XYZ Bab 3',
    })).toBe(false);

    expect(isFounderEmpiricalPedagogyTurn(true, 'beta', false, {
      userMessage: 'berapa jarak bulan ke bumi',
    })).toBe(true);
  });
});

describe('repairFounderTeachingRecallEssay', () => {
  it('detects and replaces invented Hukum Z philosophy essay', () => {
    expect(detectFounderInventedTeachingEssay(
      HUKUM_Z_ESSAY,
      'Hukum Z Formula XYZ Bab 3',
    )).toBe(true);

    const out = repairFounderTeachingRecallEssay(
      HUKUM_Z_ESSAY,
      'Terangkan Hukum Z dalam kerangka Formula XYZ',
    );

    expect(out).toMatch(/Bidang:/i);
    expect(out).toMatch(/Tentang Pola/i);
    expect(out).toMatch(/Tentang Kadar/i);
    expect(out).toMatch(/Tentang Pasangan/i);
    expect(out).toMatch(/Tentang Keseimbangan/i);
    expect(out.toLowerCase()).not.toContain('hukum kehadiran');
    expect(out.toLowerCase()).not.toContain('akui dengan akal');
  });
});
