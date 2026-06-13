/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Niaga Tier Test
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
import { resolveKoperasiTier, resolveNiagaTier, slugOrgForChannelCode } from '../src/niaga/niaga-tier.service';
import { NiagaLicenseTier } from '../src/niaga/niaga.types';

describe('niaga tier resolution', () => {
  it('resolves government to GOV with zero setup', () => {
    expect(resolveNiagaTier('government')).toBe(NiagaLicenseTier.GOV);
  });

  it('resolves koperasi by member count including AIM class', () => {
    expect(resolveKoperasiTier(200)).toBe(NiagaLicenseTier.K1);
    expect(resolveKoperasiTier(2_000)).toBe(NiagaLicenseTier.K2);
    expect(resolveKoperasiTier(20_000)).toBe(NiagaLicenseTier.K3);
    expect(resolveKoperasiTier(80_000)).toBe(NiagaLicenseTier.K4);
  });

  it('resolves individual to IND', () => {
    expect(resolveNiagaTier('individual')).toBe(NiagaLicenseTier.IND);
  });

  it('slugOrgForChannelCode strips non-alphanumerics', () => {
    expect(slugOrgForChannelCode('Koperasi Selangor Bhd')).toBe('KOPERASI');
    expect(slugOrgForChannelCode('MARA')).toBe('MARA');
  });
});
