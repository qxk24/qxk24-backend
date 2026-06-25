/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Level Scope Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAdamTutorProfileBlock,
  buildTutorAboveBaselineGuidanceLaw,
  detectQuestionEducationBand,
  isQuestionAboveBaselineLevel,
} from '../src/adam/adam-tutor-law';

describe('tutor level scope (soft baseline — no band-lock)', () => {
  const primaryProfile = {
    level:      'primary' as const,
    curriculum: 'national' as const,
    language:   'malay' as const,
    yearLabel:  'Darjah 4',
  };

  const secondaryProfile = {
    level:      'secondary' as const,
    curriculum: 'national' as const,
    language:   'malay' as const,
    yearLabel:  'Tingkatan 4',
  };

  const universityProfile = {
    level:      'university' as const,
    curriculum: 'national' as const,
    language:   'english' as const,
  };

  it('V-TL-01: primary profile block states baseline as guidance, NOT a lock', () => {
    const block = buildAdamTutorProfileBlock(primaryProfile);
    expect(block).toMatch(/Sekolah Rendah|Darjah/i);
    expect(block).toMatch(/panduan lembut|BUKAN sekatan|BUKAN kunci/i);
    expect(block).toMatch(/JANGAN sekat atau tolak/i);
    expect(block).not.toMatch(/DILARANG/);
    expect(block).not.toMatch(/SKOP KATEGORI/);
  });

  it('V-TL-02: secondary block invites teaching above/below baseline', () => {
    const block = buildAdamTutorProfileBlock(secondaryProfile);
    expect(block).toMatch(/Sekolah Menengah/i);
    expect(block).toMatch(/lebih tinggi.*lebih rendah|lebih rendah.*lebih tinggi/i);
  });

  it('V-TL-03: primary baseline — Tingkatan question is above baseline (diagnostic only)', () => {
    expect(isQuestionAboveBaselineLevel(
      'Boleh ajar persamaan kuadratik Tingkatan 4?',
      primaryProfile,
    )).toBe(true);
    expect(detectQuestionEducationBand('Tingkatan 4')).toBe('secondary');
  });

  it('V-TL-04: primary baseline — Darjah 5 fraction is within baseline', () => {
    expect(isQuestionAboveBaselineLevel(
      'Cara kira pecahan Darjah 5?',
      primaryProfile,
    )).toBe(false);
  });

  it('V-TL-05: secondary baseline — thesis question is above baseline', () => {
    expect(isQuestionAboveBaselineLevel(
      'Macam mana tulis thesis degree?',
      secondaryProfile,
    )).toBe(true);
    expect(detectQuestionEducationBand('thesis degree')).toBe('university');
  });

  it('V-TL-06: university baseline — secondary topic is not above', () => {
    expect(isQuestionAboveBaselineLevel(
      'Explain SPM quadratic equations',
      universityProfile,
    )).toBe(false);
  });

  it('V-TL-07: above-baseline guidance teaches from basics and never refuses', () => {
    const law = buildTutorAboveBaselineGuidanceLaw(primaryProfile);
    expect(law).toMatch(/MELEBIHI ARAS BIASA/i);
    expect(law).toMatch(/mulakan dari (konsep )?asas|ajar dari asas/i);
    expect(law).not.toMatch(/DILARANG/);
    expect(law).toMatch(/JANGAN.*luar skop|JANGAN.*naik taraf/i);
  });

  it('V-TL-08: agent ALL_BANDS demo skips any baseline note', () => {
    const demo = buildAdamTutorProfileBlock({
      level:      'secondary',
      curriculum: 'national',
      language:   'malay',
      localeNote: 'ALL_BANDS',
    });
    expect(demo).toMatch(/all bands/i);
    expect(demo).not.toMatch(/ARAS BIASA PELAJAR/);
  });
});
