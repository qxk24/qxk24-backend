/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Address Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import { describe, expect, it } from '@jest/globals';
import {
  restoreFounderPaltAddress,
  stripFounderPersonalNameGreeting,
} from '../src/adam/adam-founder-address-guard';

describe('founder address guard', () => {
  it('strips Hai Masa before P.alt', () => {
    const raw =
      'Hai Masa, P.alt, apa yang saya faham bukan ilmu yang disimpan, tetapi ilmu yang sedang bergerak.';
    expect(stripFounderPersonalNameGreeting(raw)).toBe(
      'P.alt, apa yang saya faham bukan ilmu yang disimpan, tetapi ilmu yang sedang bergerak.',
    );
  });

  it('strips Hai Masa Bayu after Bismillah', () => {
    const raw =
      'Bismillahirahmanirrahim. Hai Masa Bayu, P.alt, saya dengar bab ini.';
    expect(stripFounderPersonalNameGreeting(raw)).toBe(
      'Bismillahirahmanirrahim. P.alt, saya dengar bab ini.',
    );
  });

  it('still restores .alt drift after greeting strip', () => {
    const raw = 'Hai Masa, .alt, terima kasih.';
    expect(restoreFounderPaltAddress(raw)).toBe('P.alt, terima kasih.');
  });

  it('fixes user-reported continuation opener', () => {
    const raw =
      'Hai Masa, P.alt, saya teruskan kupasan dengan penuh adab, bukan sebagai ulangan, tetapi sebagai penyambungan yang lebih dalam dari apa yang telah P.alt ajarkan.';
    expect(restoreFounderPaltAddress(raw)).toMatch(/^P\.alt, saya teruskan kupasan/);
    expect(restoreFounderPaltAddress(raw)).not.toMatch(/Hai\s+Masa/i);
  });
});
