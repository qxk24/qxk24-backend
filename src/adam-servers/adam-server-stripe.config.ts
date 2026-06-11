/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Stripe Catalog (Layer 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Create each Product + recurring Price in Stripe Dashboard, then paste price_… IDs into .env.
 * Canonical copy: docs/STRIPE_ADAMGURU_PRICES.md
 */

import { ENV } from '../config/environments';
import { AdamServerId, AdamServerTier } from './adam-server.types';

export interface AdamServerStripePriceDef {
  sku:            string;
  serverId:       AdamServerId;
  tier:           AdamServerTier;
  productName:    string;
  description:    string;
  monthlyMYR:     number;
  currency:       'myr';
  envKey:         string;
  studentSeats?:  number;
  subjectChannels?: number;
}

/** ADAMGuru — guru plans + student kelas pass (MYR, monthly). */
export const ADAMGURU_STRIPE_PRICES: AdamServerStripePriceDef[] = [
  {
    sku:              'guru.starter.monthly',
    serverId:         AdamServerId.GURU,
    tier:             AdamServerTier.STARTER,
    productName:      'ADAMGuru — Guru',
    description:      '1 subject channel · 20 students · guru teaches ADAM',
    monthlyMYR:       59,
    currency:         'myr',
    envKey:           'STRIPE_PRICE_ID_GURU_STARTER_MONTHLY',
    subjectChannels:  1,
    studentSeats:     20,
  },
  {
    sku:              'guru.professional.monthly',
    serverId:         AdamServerId.GURU,
    tier:             AdamServerTier.PROFESSIONAL,
    productName:      'ADAMGuru — Guru Pro',
    description:      '5 subject channels · 80 students',
    monthlyMYR:       129,
    currency:         'myr',
    envKey:           'STRIPE_PRICE_ID_GURU_PROFESSIONAL_MONTHLY',
    subjectChannels:  5,
    studentSeats:     80,
  },
  {
    sku:              'guru.institution.monthly',
    serverId:         AdamServerId.GURU,
    tier:             AdamServerTier.INSTITUTION,
    productName:      'ADAMGuru — Kampus',
    description:      'Unlimited subject channels · 300 students · 5 guru accounts',
    monthlyMYR:       399,
    currency:         'myr',
    envKey:           'STRIPE_PRICE_ID_GURU_INSTITUTION_MONTHLY',
    subjectChannels:  999,
    studentSeats:     300,
  },
  {
    sku:              'guru.student_kelas.monthly',
    serverId:         AdamServerId.GURU,
    tier:             AdamServerTier.STUDENT_KELAS,
    productName:      'ADAMGuru — Pas Kelas (pelajar)',
    description:      'Access invited guru kelas — no full private ADAM Premium desk',
    monthlyMYR:       15,
    currency:         'myr',
    envKey:           'STRIPE_PRICE_ID_GURU_STUDENT_KELAS_MONTHLY',
    studentSeats:     0,
  },
];

export function getAdamGuruStripePriceDef(
  tier: AdamServerTier,
): AdamServerStripePriceDef | undefined {
  return ADAMGURU_STRIPE_PRICES.find((p) => p.tier === tier);
}

export function getAdamServerStripePriceId(
  serverId: AdamServerId,
  tier: AdamServerTier,
): string {
  if (serverId !== AdamServerId.GURU) return '';
  const def = getAdamGuruStripePriceDef(tier);
  if (!def) return '';
  const value = (ENV as Record<string, string | boolean | number | undefined>)[def.envKey];
  return typeof value === 'string' ? value.trim() : '';
}

export function listAdamGuruStripeCatalogForDashboard(): Array<{
  sku:         string;
  productName: string;
  description: string;
  amount:      string;
  currency:    string;
  interval:    string;
  envKey:      string;
  configured:  boolean;
  priceId:     string | null;
  metadata:    Record<string, string>;
}> {
  return ADAMGURU_STRIPE_PRICES.map((p) => {
    const priceId = getAdamServerStripePriceId(p.serverId, p.tier);
    return {
      sku:         p.sku,
      productName: p.productName,
      description: p.description,
      amount:      `RM ${p.monthlyMYR}`,
      currency:    p.currency.toUpperCase(),
      interval:    'month',
      envKey:      p.envKey,
      configured:  Boolean(priceId),
      priceId:     priceId || null,
      metadata: {
        alamtologi_checkout_type: 'adam_server',
        alamtologi_server_id:     p.serverId,
        alamtologi_server_tier:   p.tier,
        alamtologi_sku:           p.sku,
      },
    };
  });
}
