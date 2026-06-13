/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Tier Resolution
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import {
  NiagaLicenseTier,
  type NiagaEntityType,
  type NiagaTierTerms,
} from './niaga.types';

const TIER_TERMS: Record<NiagaLicenseTier, Omit<NiagaTierTerms, 'tier'>> = {
  [NiagaLicenseTier.GOV]:  { setupFeeMyr: 0, renewalFeeMyr: 0, wholesalePerSeat: 33, maxActiveTraders: null },
  [NiagaLicenseTier.K1]:   { setupFeeMyr: 500, renewalFeeMyr: 300, wholesalePerSeat: 35, maxActiveTraders: null },
  [NiagaLicenseTier.K2]:   { setupFeeMyr: 2500, renewalFeeMyr: 1200, wholesalePerSeat: 33, maxActiveTraders: null },
  [NiagaLicenseTier.K3]:   { setupFeeMyr: 5000, renewalFeeMyr: 2500, wholesalePerSeat: 31, maxActiveTraders: null },
  [NiagaLicenseTier.K4]:   { setupFeeMyr: 0, renewalFeeMyr: 0, wholesalePerSeat: 29, maxActiveTraders: null },
  [NiagaLicenseTier.CO_B]: { setupFeeMyr: 2500, renewalFeeMyr: 1200, wholesalePerSeat: 32, maxActiveTraders: null },
  [NiagaLicenseTier.CO_C]: { setupFeeMyr: 10000, renewalFeeMyr: 5000, wholesalePerSeat: 30, maxActiveTraders: null },
  [NiagaLicenseTier.IND]:  { setupFeeMyr: 500, renewalFeeMyr: 300, wholesalePerSeat: 35, maxActiveTraders: 50 },
};

export function resolveKoperasiTier(memberCount: number | null | undefined): NiagaLicenseTier {
  const n = memberCount ?? 0;
  if (n >= 50_000) return NiagaLicenseTier.K4;
  if (n >= 5_000) return NiagaLicenseTier.K3;
  if (n >= 500) return NiagaLicenseTier.K2;
  return NiagaLicenseTier.K1;
}

export function resolveNiagaTier(
  entityType: NiagaEntityType,
  memberCount?: number | null,
  companyTier?: 'B' | 'C',
): NiagaLicenseTier {
  switch (entityType) {
    case 'government':
      return NiagaLicenseTier.GOV;
    case 'individual':
      return NiagaLicenseTier.IND;
    case 'company':
      return companyTier === 'C' ? NiagaLicenseTier.CO_C : NiagaLicenseTier.CO_B;
    case 'koperasi':
      return resolveKoperasiTier(memberCount);
    default:
      return NiagaLicenseTier.CO_B;
  }
}

export function getNiagaTierTerms(tier: NiagaLicenseTier): NiagaTierTerms {
  return { tier, ...TIER_TERMS[tier] };
}

export function slugOrgForChannelCode(orgName: string): string {
  const slug = orgName
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8);
  return slug || 'PARTNER';
}
