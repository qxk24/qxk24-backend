/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildStudentGreetingFallback,
  buildStudentGuidedPerspectiveFallback,
  isAdamLightChatTurn,
} from '../src/adam/adam-response-generation';

describe('Student greeting fallback', () => {
  it('detects salam as light chat', () => {
    expect(isAdamLightChatTurn('salam')).toBe(true);
  });

  it('returns waalaikumussalam for salam', () => {
    const out = buildStudentGreetingFallback('salam');
    expect(out).toMatch(/Waalaikumussalam/i);
    expect(out.length).toBeGreaterThan(10);
  });

  it('personalises hello when name provided', () => {
    expect(buildStudentGreetingFallback('hello', 'Ahmad')).toMatch(/Ahmad/);
  });

  it('guided perspective fallback keeps tutor voice for car topics', () => {
    const out = buildStudentGuidedPerspectiveFallback('kereta murah berkualiti');
    expect(out).toMatch(/bukan kontradiksi|keseimbangan/i);
    expect(out).not.toMatch(/MAAA|RM\d|tidak tersedia pada giliran/i);
  });
});
