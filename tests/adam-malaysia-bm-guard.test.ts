/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Malaysia Bm Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  containsIndonesianDrift,
  fixBmBerPrefixReduplicationSpelling,
  sanitizeMalaysiaBmDrift,
} from '../src/adam/adam-malaysia-bm-guard';

describe('sanitizeMalaysiaBmDrift', () => {
  it('replaces common Indonesian words in Malay replies', () => {
    const raw = 'Ini berlaku karena sistem teknis tidak efisien, tapi bisa diperbaiki.';
    const out = sanitizeMalaysiaBmDrift(raw, 'ms');
    expect(out).toContain('kerana');
    expect(out).toContain('teknikal');
    expect(out).toContain('cekap');
    expect(out).toContain('boleh');
    expect(out).not.toMatch(/\bkarena\b/i);
    expect(out).not.toMatch(/\bbisa\b/i);
  });

  it('leaves English replies unchanged', () => {
    const raw = 'Because the system is inefficient, it can be fixed.';
    expect(sanitizeMalaysiaBmDrift(raw, 'en')).toBe(raw);
  });

  it('fixes double-r reduplication spelling (berramai-ramai)', () => {
    const raw = 'Hidupan liar hidup berramai-ramai di hutan tropika.';
    const out = sanitizeMalaysiaBmDrift(raw, 'ms');
    expect(out).toContain('beramai-ramai');
    expect(out).not.toMatch(/berramai/i);
  });

  it('replaces Indonesian siap saji with Malaysian siap makan', () => {
    const raw = 'Produk makanan siap saji untuk pasaran bandar.';
    const out = sanitizeMalaysiaBmDrift(raw, 'ms');
    expect(out).toContain('makanan siap makan');
    expect(out).not.toMatch(/siap saji/i);
  });

  it('replaces Indonesian kemitraan with Malaysian kerjasama', () => {
    const raw =
      'Cadangkan potensi kemitraan dengan pihak lain seperti restoran, pasar raya, atau penghantaran makanan.';
    const out = sanitizeMalaysiaBmDrift(raw, 'ms');
    expect(out).toContain('potensi kerjasama');
    expect(out).not.toMatch(/kemitraan/i);
  });
});

describe('fixBmBerPrefixReduplicationSpelling', () => {
  it('normalises berr stem-reduplication generically', () => {
    expect(fixBmBerPrefixReduplicationSpelling('Hidup berramai-ramai di sana.')).toBe(
      'Hidup beramai-ramai di sana.',
    );
  });
});

describe('containsIndonesianDrift', () => {
  it('flags Indonesian markers', () => {
    expect(containsIndonesianDrift('Saya faham kerana itu penting')).toBe(false);
    expect(containsIndonesianDrift('Saya faham karena itu penting')).toBe(true);
  });
});
