/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Ordered List Repair Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-06
 * ============================================================
 */

import {
  outputHasRepeatedOrderedOnes,
  repairOrderedListNumbering,
} from '../src/adam/adam-ordered-list-repair';

describe('repairOrderedListNumbering', () => {
  it('detects repeated 1. markers', () => {
    expect(outputHasRepeatedOrderedOnes('1. **A**\n\n1. **B**')).toBe(true);
    expect(outputHasRepeatedOrderedOnes('1. **A**\n\n2. **B**')).toBe(false);
  });

  it('renumbers Niaga pitch deck sections', () => {
    const raw = [
      '1. **Tajuk Slide**',
      'Nama produk + tagline.',
      '',
      '1. **Masalah yang Dihadapi**',
      'Masalah makanan siap saji.',
      '',
      '1. **Penyelesaian (Produk Makanan)**',
      'Produk makanan semulajadi.',
    ].join('\n');

    const out = repairOrderedListNumbering(raw);
    expect(out).toContain('1. **Tajuk Slide**');
    expect(out).toContain('2. **Masalah yang Dihadapi**');
    expect(out).toContain('3. **Penyelesaian (Produk Makanan)**');
  });
});
