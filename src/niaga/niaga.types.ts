/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

export const NIAGA_ENTITY_TYPES = [
  'government',
  'koperasi',
  'company',
  'individual',
] as const;

export type NiagaEntityType = (typeof NIAGA_ENTITY_TYPES)[number];

export enum NiagaApplicationStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum NiagaLicenseTier {
  GOV  = 'GOV',
  K1   = 'K1',
  K2   = 'K2',
  K3   = 'K3',
  K4   = 'K4',
  CO_B = 'CO-B',
  CO_C = 'CO-C',
  IND  = 'IND',
}

export enum NiagaLicenseStatus {
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
  EXPIRED   = 'expired',
}

export interface NiagaTierTerms {
  tier:              NiagaLicenseTier;
  setupFeeMyr:       number;
  renewalFeeMyr:     number;
  wholesalePerSeat:  number;
  maxActiveTraders:  number | null;
}

export function isNiagaEntityType(value: string): value is NiagaEntityType {
  return (NIAGA_ENTITY_TYPES as readonly string[]).includes(value);
}
