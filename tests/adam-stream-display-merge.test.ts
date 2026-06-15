/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Display Merge Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';

describe('resolveAdamTurnDisplayForSave', () => {
  it('keeps streamed teaching explain-back when repair swaps unrelated summary', () => {
    const streamed = [
      'Bismillahirahmanirahim.',
      'P.alt, ABA ialah asas pola X — segi empat sama sisi dan kiub.',
      'Huraian penuh hukum berkaitan dibawa ke Bab 3.',
    ].join(' ');
    const repaired = [
      'Bismillahirahmanirahim.',
      'P.alt, Bab 2 Formula XYZ ialah Faktor (X, Y, Z) — X pelaku, Y Pencipta, Z medan.',
    ].join(' ');
    expect(resolveAdamTurnDisplayForSave(streamed, repaired)).toBe(streamed);
  });

  it('accepts inquiry append on streamed explain-back', () => {
    const streamed = `${'P.alt, ABA ialah asas pola X. '.repeat(15)}`;
    const withInquiry = `${streamed}\n\n**[TEACHING INQUIRY — SITUASI NYATA]**\n\n1. Situasi nyata?`;
    expect(resolveAdamTurnDisplayForSave(streamed, withInquiry)).toBe(withInquiry.trim());
  });
});
