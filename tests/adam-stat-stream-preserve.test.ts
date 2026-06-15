/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Stream Preserve Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  alphaStatPersistedStreamBody,
  alphaStatStreamPreserveOk,
  KPTM_FULL_VOICE_REGRESSION_SAMPLE,
} from '../src/adam/adam-stat-stream-preserve';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';

describe('alphaStatPersistedStreamBody — permanent α stat policy', () => {
  it('persists canonical KPTM full-voice essay verbatim', () => {
    const persisted = alphaStatPersistedStreamBody(KPTM_FULL_VOICE_REGRESSION_SAMPLE);
    expect(persisted).toBe(KPTM_FULL_VOICE_REGRESSION_SAMPLE);
    expect(alphaStatStreamPreserveOk(KPTM_FULL_VOICE_REGRESSION_SAMPLE, persisted)).toBe(true);
  });

  it('keeps enrollment, graduan, and full paragraphs — rejects compact stub save', () => {
    const stub = 'KPTM: 18,000 (verified via web search, kptm.edu.my).';
    const saved = resolveAdamTurnDisplayForSave(KPTM_FULL_VOICE_REGRESSION_SAMPLE, stub);
    expect(saved).toBe(KPTM_FULL_VOICE_REGRESSION_SAMPLE);
    expect(saved).toMatch(/18,000.*pelajar/i);
    expect(saved).toMatch(/62,000.*graduan/i);
    expect(saved).toMatch(/MASA yang sedang bergerak/i);
    expect(saved).toMatch(/menyusun surat rasmi kepada KPTM/i);
    expect(saved.length).toBeGreaterThan(stub.length * 4);
  });
});
