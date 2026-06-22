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
  buildTutorLevelScopeRefusalLaw,
  detectQuestionEducationBand,
  isQuestionBeyondStudentLevel,
} from '../src/adam/adam-tutor-law';

describe('tutor level scope (3 bands)', () => {
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

  it('V-TL-01: primary profile block locks Darjah 6 ceiling', () => {
    const block = buildAdamTutorProfileBlock(primaryProfile);
    expect(block).toMatch(/Sekolah Rendah|Darjah\/Tahun 1–6/i);
    expect(block).toMatch(/SKOP KATEGORI|SKOP MAKSIMUM/i);
    expect(block).toMatch(/DILARANG.*Tingkatan|SPM/i);
  });

  it('V-TL-02: secondary profile block forbids university', () => {
    const block = buildAdamTutorProfileBlock(secondaryProfile);
    expect(block).toMatch(/Sekolah Menengah/i);
    expect(block).toMatch(/ijazah|universiti/i);
  });

  it('V-TL-03: primary student — Tingkatan question is beyond scope', () => {
    expect(isQuestionBeyondStudentLevel(
      'Boleh ajar persamaan kuadratik Tingkatan 4?',
      primaryProfile,
    )).toBe(true);
    expect(detectQuestionEducationBand('Tingkatan 4')).toBe('secondary');
  });

  it('V-TL-04: primary student — Darjah 5 fraction is in scope', () => {
    expect(isQuestionBeyondStudentLevel(
      'Cara kira pecahan Darjah 5?',
      primaryProfile,
    )).toBe(false);
  });

  it('V-TL-05: secondary student — thesis question is beyond scope', () => {
    expect(isQuestionBeyondStudentLevel(
      'Macam mana tulis thesis degree?',
      secondaryProfile,
    )).toBe(true);
    expect(detectQuestionEducationBand('thesis degree')).toBe('university');
  });

  it('V-TL-06: university student — secondary topic is not beyond', () => {
    expect(isQuestionBeyondStudentLevel(
      'Explain SPM quadratic equations',
      universityProfile,
    )).toBe(false);
  });

  it('V-TL-07: refusal law instructs no teaching outside band', () => {
    const law = buildTutorLevelScopeRefusalLaw(primaryProfile);
    expect(law).toMatch(/LUAR SKOP KATEGORI/i);
    expect(law).toMatch(/DILARANG.*langkah kerja/i);
  });

  it('V-TL-08: agent ALL_BANDS demo skips scope lock', () => {
    const demo = buildAdamTutorProfileBlock({
      level:      'secondary',
      curriculum: 'national',
      language:   'malay',
      localeNote: 'ALL_BANDS',
    });
    expect(demo).toMatch(/all bands/i);
    expect(demo).not.toMatch(/SKOP KATEGORI/);
  });
});
