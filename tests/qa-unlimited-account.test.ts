/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Qa Unlimited Account Test
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
import { isQaUnlimitedNotes, QA_UNLIMITED_NOTES } from '../src/qa/qa-unlimited-account.service';

describe('QA unlimited account markers', () => {
  it('detects QA unlimited enterprise notes', () => {
    expect(isQaUnlimitedNotes(QA_UNLIMITED_NOTES)).toBe(true);
    expect(isQaUnlimitedNotes('Founder grant — ADAM Profesional')).toBe(false);
    expect(isQaUnlimitedNotes(null)).toBe(false);
  });
});
