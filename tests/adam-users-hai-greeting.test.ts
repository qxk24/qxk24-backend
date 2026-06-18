/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Users Hai Greeting Policy Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  applyUsersHaiGreetingPolicy,
  ensureUsersHaiGreeting,
} from '../src/adam/adam-users-constitution';
import {
  stripLeadingUsersHaiGreeting,
  userAddressedAdamByName,
} from '../src/adam/adam-users-greeting';

describe('userAddressedAdamByName', () => {
  it('detects explicit Adam address', () => {
    expect(userAddressedAdamByName('Hai Adam, apakah inflasi?')).toBe(true);
    expect(userAddressedAdamByName('Adam, terangkan kos peluang')).toBe(true);
    expect(userAddressedAdamByName('Salam Adam')).toBe(true);
  });

  it('rejects substantive asks without Adam name', () => {
    expect(userAddressedAdamByName('Apakah kesan pencemaran udara?')).toBe(false);
    expect(userAddressedAdamByName('Terangkan mitosis')).toBe(false);
  });
});

describe('ensureUsersHaiGreeting — Adam-name policy', () => {
  const body = 'Kos peluang ialah nilai terbaik yang hilang apabila memilih satu alternatif.';

  it('strips unsolicited Hai when user did not call Adam', () => {
    const out = ensureUsersHaiGreeting(`Hai QA, ${body}`, 'QA', 'Apakah kos peluang?');
    expect(out).not.toMatch(/^Hai QA/i);
    expect(out).toMatch(/^Kos peluang/i);
  });

  it('keeps Hai when user called Adam by name', () => {
    const out = ensureUsersHaiGreeting(body, 'QA', 'Hai Adam, apakah kos peluang?');
    expect(out).toMatch(/^Hai QA,\s*Kos peluang/i);
  });

  it('applyUsersHaiGreetingPolicy strips model Hai on economics ask', () => {
    const out = applyUsersHaiGreetingPolicy(
      `Hai QA,\n\n### Apa itu inflasi?\n\nInflasi ialah kenaikan harga.`,
      'QA',
      'Apakah inflasi dan bagaimana ia diukur?',
    );
    expect(out).not.toMatch(/^Hai QA/i);
    expect(out).toContain('### Apa itu inflasi?');
  });
});

describe('stripLeadingUsersHaiGreeting', () => {
  it('removes Hai QA opener and capitalizes body', () => {
    const out = stripLeadingUsersHaiGreeting('Hai QA, mitosis ialah pembahagian sel.', 'QA');
    expect(out).toBe('Mitosis ialah pembahagian sel.');
  });
});
