/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Region Detector
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { SupportedRegion } from './subscription.schema';

const COUNTRY_TO_REGION: Record<string, SupportedRegion> = {
  MY: SupportedRegion.MY,
  SG: SupportedRegion.SG,
  ID: SupportedRegion.ID,
  PH: SupportedRegion.PH,
  TH: SupportedRegion.TH,
  VN: SupportedRegion.VN,
  GB: SupportedRegion.GB,
  US: SupportedRegion.US,
  CA: SupportedRegion.US,
  AU: SupportedRegion.US,
  AE: SupportedRegion.AE,
  SA: SupportedRegion.SA,
  QA: SupportedRegion.AE,
  KW: SupportedRegion.AE,
  NG: SupportedRegion.NG,
  GH: SupportedRegion.GH,
  KE: SupportedRegion.KE,
  ZA: SupportedRegion.ZA,
  EG: SupportedRegion.EG,
  IN: SupportedRegion.IN,
  BD: SupportedRegion.IN,
  DE: SupportedRegion.EU,
  FR: SupportedRegion.EU,
  NL: SupportedRegion.EU,
  ES: SupportedRegion.EU,
  IT: SupportedRegion.EU,
  SE: SupportedRegion.EU,
  NO: SupportedRegion.EU,
  DK: SupportedRegion.EU,
  PL: SupportedRegion.EU,
  PT: SupportedRegion.EU,
  BE: SupportedRegion.EU,
  CH: SupportedRegion.EU,
  AT: SupportedRegion.EU,
  IE: SupportedRegion.EU,
  FI: SupportedRegion.EU,
};

function mapCountry(code: string | undefined): SupportedRegion | null {
  if (!code) return null;
  return COUNTRY_TO_REGION[code.toUpperCase()] ?? null;
}

export function detectRegionFromHeaders(headers: Headers, userRegion?: string | null): SupportedRegion {
  if (userRegion) {
    const mapped = mapCountry(userRegion);
    if (mapped) return mapped;
  }

  const cfCountry = headers.get('cf-ipcountry');
  const mappedCf = mapCountry(cfCountry ?? undefined);
  if (mappedCf) return mappedCf;

  const xCountry = headers.get('x-country') ?? headers.get('x-pricing-country');
  const mappedX = mapCountry(xCountry ?? undefined);
  if (mappedX) return mappedX;

  const lang = headers.get('accept-language') ?? '';
  if (lang.includes('ms') || lang.includes('en-MY')) return SupportedRegion.MY;
  if (lang.includes('id')) return SupportedRegion.ID;
  if (lang.includes('ar')) return SupportedRegion.AE;
  if (lang.includes('en-GB')) return SupportedRegion.GB;

  /** Site default before weak locale heuristics — iPhone Safari often sends en-US for MY users. */
  const fallback = (ENV.ADAM_DEFAULT_PRICING_REGION ?? 'MY').toUpperCase();
  const mappedFallback = mapCountry(fallback);
  if (mappedFallback) return mappedFallback;

  if (lang.includes('en-US')) return SupportedRegion.US;

  return SupportedRegion.OTHER;
}

