/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  containsIndonesianDrift,
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
});

describe('containsIndonesianDrift', () => {
  it('flags Indonesian markers', () => {
    expect(containsIndonesianDrift('Saya faham kerana itu penting')).toBe(false);
    expect(containsIndonesianDrift('Saya faham karena itu penting')).toBe(true);
  });
});
