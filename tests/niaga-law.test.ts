/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Niaga Law Test
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
import { isAdamNiagaMode, isNiagaSnapshotRequest } from '../src/adam/adam-niaga-law';

describe('adam niaga law', () => {
  it('recognises NIAGA chat mode', () => {
    expect(isAdamNiagaMode('NIAGA')).toBe(true);
    expect(isAdamNiagaMode('TUTOR')).toBe(false);
  });

  it('detects snapshot requests', () => {
    expect(isNiagaSnapshotRequest('Generate my business snapshot for this quarter')).toBe(true);
    expect(isNiagaSnapshotRequest('berapa stok harini')).toBe(false);
  });
});
