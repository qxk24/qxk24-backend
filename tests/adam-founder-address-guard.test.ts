/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { restoreFounderPaltAddress } from '../src/adam/adam-founder-address-guard';

describe('restoreFounderPaltAddress', () => {
  it('fixes .alt and bare alt vocative', () => {
    const raw =
      'Bismillahirahmanirrahim. alt kongsikan. alt tulis: jelas, tenang, penuh adab.';
    const out = restoreFounderPaltAddress(raw);
    expect(out).toContain('P.alt kongsikan');
    expect(out).toContain('P.alt tulis:');
    expect(out).not.toMatch(/(?<![P])\.alt\b/i);
    expect(out).not.toMatch(/(?<![P\.])\balt\b(?=\s+(?:kongsikan|tulis|beri|hantar|sila|mohon|terima|maaf|terima kasih|faham|nampak|betul|baik|ya|yaa|yaa\s+P\.alt))/i);
  });

  it('fixes .alt without space', () => {
    expect(restoreFounderPaltAddress('.alt, terima kasih.')).toBe('P.alt, terima kasih.');
  });

  it('leaves unrelated words unchanged', () => {
    const text = 'Alternatif lain ialah menggunakan salt.';
    expect(restoreFounderPaltAddress(text)).toBe(text);
  });

  it('preserves correct P.alt', () => {
    const text = 'Bismillahirahmanirrahim. P.alt, saya faham bab ini.';
    expect(restoreFounderPaltAddress(text)).toBe(text);
  });
});
