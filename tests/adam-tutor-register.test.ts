/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  TUTOR_REGISTER_BAND_LABELS_BM,
  TUTOR_REGISTER_BAND_PREFIX,
  TUTOR_REGISTER_PHASE_COUNTRY,
} from '../src/adam/tutor/adam-tutor-register.constants';

describe('adam-tutor-register.constants', () => {
  it('phase 1 is Malaysia only', () => {
    expect(TUTOR_REGISTER_PHASE_COUNTRY).toBe('MY');
  });

  it('maps bands to BM labels', () => {
    expect(TUTOR_REGISTER_BAND_LABELS_BM.primary).toBe('Sekolah Rendah');
    expect(TUTOR_REGISTER_BAND_LABELS_BM.secondary).toBe('Sekolah Menengah');
    expect(TUTOR_REGISTER_BAND_LABELS_BM.university).toBe('Kolej & Universiti');
  });

  it('uses distinct code prefixes per band', () => {
    expect(TUTOR_REGISTER_BAND_PREFIX.primary).toBe('RENDAH');
    expect(TUTOR_REGISTER_BAND_PREFIX.secondary).toBe('MENENGAH');
    expect(TUTOR_REGISTER_BAND_PREFIX.university).toBe('UNIV');
  });
});
