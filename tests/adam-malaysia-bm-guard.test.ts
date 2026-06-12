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
