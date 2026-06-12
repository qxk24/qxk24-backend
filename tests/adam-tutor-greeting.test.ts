/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorGreetingFallback,
  enforceTutorReplyGuards,
} from '../src/adam/adam-tutor-law';

describe('buildTutorGreetingFallback', () => {
  it('uses universal tutor intro without Bismillah', () => {
    const out = buildTutorGreetingFallback('hi', 'Ahmad', { level: 'secondary', curriculum: 'national', language: 'malay' });
    expect(out).toContain('Cikgu ADAM');
    expect(out).toContain('Saya akan bimbing anda sampai faham');
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).not.toMatch(/\bkamu\b/i);
  });
});

describe('enforceTutorReplyGuards', () => {
  it('strips Bismillah and fixes broken Malay intro', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      'Salam, Pelajar. Saya Cikgu ADAM, saya bimbing faham; saya tidak beri jawapan siap untuk dikumpul.',
    ].join('\n');
    const out = enforceTutorReplyGuards(raw, { level: 'secondary', curriculum: 'national', language: 'malay' });
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).toContain('saya akan bimbing anda sampai faham');
    expect(out).toContain('tanpa latihan');
    expect(out).not.toMatch(/Salam,\s*Pelajar/i);
  });
});
