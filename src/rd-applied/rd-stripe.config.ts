/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D & Applied Science Stripe Catalog
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Canonical copy: alm-backend/docs/STRIPE_RD_APPLIED_PRICES.md
 */

import { ENV } from '../config/environments';
import { RdAppliedSku } from './rd-applied.types';

export interface RdStripePriceDef {
  sku:         RdAppliedSku;
  productName: string;
  description: string;
  annualUsd:   number;
  currency:    'usd';
  envKey:      string;
  productLine: 'rd' | 'applied' | 'bundle';
}

export const RD_APPLIED_STRIPE_PRICES: RdStripePriceDef[] = [
  {
    sku:         RdAppliedSku.RD_IND_SOLO,
    productName: 'Alamtologi R&D Eksklusif — Individual',
    description: 'One category · one project · two Full documents per year',
    annualUsd:   4500,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL',
    productLine: 'rd',
  },
  {
    sku:         RdAppliedSku.RD_GRAD_SOLO,
    productName: 'Alamtologi R&D — Graduate Solo',
    description: 'Master/PhD — Phase 0 → SATL → Journal + Thesis',
    annualUsd:   4500,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL',
    productLine: 'rd',
  },
  {
    sku:         RdAppliedSku.RD_GRAD_EDU,
    productName: 'Alamtologi R&D — Graduate `.edu` PPP',
    description: 'Master/PhD with verified university email (~40% PPP)',
    annualUsd:   2700,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL',
    productLine: 'rd',
  },
  {
    sku:         RdAppliedSku.RD_LAB_5,
    productName: 'Alamtologi R&D — Lab (5 seat)',
    description: 'One shared project · two Full documents',
    annualUsd:   45000,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_RD_LAB_5_ANNUAL',
    productLine: 'rd',
  },
  {
    sku:         RdAppliedSku.AS_IND_SOLO,
    productName: 'Alamtologi Applied Science — Individual',
    description: 'Reference Source Code + Applied Solution (Pack ID required)',
    annualUsd:   9000,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL',
    productLine: 'applied',
  },
  {
    sku:         RdAppliedSku.AS_LAB_5,
    productName: 'Alamtologi Applied Science — Lab (5 seat)',
    description: 'Shared REF + SOL product arc (Pack ID required)',
    annualUsd:   90000,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_AS_LAB_5_ANNUAL',
    productLine: 'applied',
  },
  {
    sku:         RdAppliedSku.BUNDLE_IND_AS_SOLO,
    productName: 'Bundle — Industri R&D + Applied Solo',
    description: 'Industry whitepapers + REF + SOL — one project',
    annualUsd:   12000,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL',
    productLine: 'bundle',
  },
  {
    sku:         RdAppliedSku.BUNDLE_IND_AS_LAB,
    productName: 'Bundle — Industri R&D + Applied Lab',
    description: 'Lab industry R&D + shared product',
    annualUsd:   120000,
    currency:    'usd',
    envKey:      'STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL',
    productLine: 'bundle',
  },
];

export function getRdStripePriceDef(sku: RdAppliedSku): RdStripePriceDef | undefined {
  return RD_APPLIED_STRIPE_PRICES.find((p) => p.sku === sku);
}

export function getRdStripePriceId(sku: RdAppliedSku): string {
  const def = getRdStripePriceDef(sku);
  if (!def) return '';
  const value = (ENV as Record<string, string | boolean | number | undefined>)[def.envKey];
  return typeof value === 'string' ? value.trim() : '';
}

export function parseRdAppliedSku(raw: string | undefined | null): RdAppliedSku | null {
  const normalized = raw?.trim().toUpperCase();
  if (!normalized) return null;
  const values = Object.values(RdAppliedSku) as string[];
  return values.includes(normalized) ? (normalized as RdAppliedSku) : null;
}

export function listRdStripeCatalogForApi(): Array<{
  sku:         string;
  productName: string;
  description: string;
  annualUsd:   number;
  currency:    string;
  interval:    string;
  envKey:      string;
  configured:  boolean;
  priceId:     string | null;
  productLine: string;
  selfServe:   boolean;
}> {
  return RD_APPLIED_STRIPE_PRICES.map((p) => {
    const priceId = getRdStripePriceId(p.sku);
    return {
      sku:         p.sku,
      productName: p.productName,
      description: p.description,
      annualUsd:   p.annualUsd,
      currency:    p.currency.toUpperCase(),
      interval:    'year',
      envKey:      p.envKey,
      configured:  Boolean(priceId),
      priceId:     priceId || null,
      productLine: p.productLine,
      selfServe:   true,
    };
  });
}
