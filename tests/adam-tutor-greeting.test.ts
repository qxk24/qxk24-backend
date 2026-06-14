/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Greeting Test
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
