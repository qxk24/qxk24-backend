/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Stripe Price Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-06
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Create Products + recurring Prices in Stripe, then paste price_… IDs into .env.
 * Canonical copy: docs/STRIPE_ADAM_STREAM_PRICES.md
 */

import { ENV } from '../../config/environments';
import type {
  AdamStreamBillingCycle,
  AdamStreamHostPlanId,
  AdamStreamPaidPlanId,
} from './adam-stream.constants';

export interface AdamStreamStripePriceDef {
  planId:       AdamStreamPaidPlanId;
  billingCycle: AdamStreamBillingCycle;
  sku:          string;
  productName:  string;
  description:  string;
  amountUsd:    number;
  currency:     'usd';
  envKey:       string;
  interval:     'month' | 'year';
}

export const ADAM_STREAM_STRIPE_PRICES: readonly AdamStreamStripePriceDef[] = [
  {
    planId:       'business_starter',
    billingCycle: 'monthly',
    sku:          'stream.business_starter.monthly',
    productName:  'ADAM Stream — Business Starter',
    description:  'No 60-min group cap · smart noise cancellation · dial-in · local recording',
    amountUsd:    5,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_STREAM_BUSINESS_STARTER_MONTHLY',
    interval:     'month',
  },
  {
    planId:       'business_starter',
    billingCycle: 'annual',
    sku:          'stream.business_starter.annual',
    productName:  'ADAM Stream — Business Starter (Annual)',
    description:  'Business Starter billed annually (~2 months free)',
    amountUsd:    50,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_STREAM_BUSINESS_STARTER_ANNUAL',
    interval:     'year',
  },
  {
    planId:       'business_standard',
    billingCycle: 'monthly',
    sku:          'stream.business_standard.monthly',
    productName:  'ADAM Stream — Business Standard',
    description:  'Cloud recording · breakout rooms · polls & Q&A · up to 150 participants',
    amountUsd:    12,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_STREAM_BUSINESS_STANDARD_MONTHLY',
    interval:     'month',
  },
  {
    planId:       'business_standard',
    billingCycle: 'annual',
    sku:          'stream.business_standard.annual',
    productName:  'ADAM Stream — Business Standard (Annual)',
    description:  'Business Standard billed annually (~2 months free)',
    amountUsd:    120,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_STREAM_BUSINESS_STANDARD_ANNUAL',
    interval:     'year',
  },
  {
    planId:       'business_plus',
    billingCycle: 'monthly',
    sku:          'stream.business_plus.monthly',
    productName:  'ADAM Stream — Business Plus',
    description:  'Attendance tracking · advanced admin · up to 500 participants',
    amountUsd:    20,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_STREAM_BUSINESS_PLUS_MONTHLY',
    interval:     'month',
  },
  {
    planId:       'business_plus',
    billingCycle: 'annual',
    sku:          'stream.business_plus.annual',
    productName:  'ADAM Stream — Business Plus (Annual)',
    description:  'Business Plus billed annually (~2 months free)',
    amountUsd:    200,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_STREAM_BUSINESS_PLUS_ANNUAL',
    interval:     'year',
  },
] as const;

export function getAdamStreamStripePriceDef(
  planId: AdamStreamPaidPlanId,
  billingCycle: AdamStreamBillingCycle,
): AdamStreamStripePriceDef | null {
  return ADAM_STREAM_STRIPE_PRICES.find(
    (p) => p.planId === planId && p.billingCycle === billingCycle,
  ) ?? null;
}

export function getAdamStreamStripePriceId(
  planId: AdamStreamPaidPlanId,
  billingCycle: AdamStreamBillingCycle,
): string | null {
  const def = getAdamStreamStripePriceDef(planId, billingCycle);
  if (!def) return null;
  const value = (ENV as Record<string, string | boolean | number | undefined>)[def.envKey];
  const fromEnv = typeof value === 'string' ? value.trim() : '';
  return fromEnv || null;
}

export function listAdamStreamStripeCatalogForDashboard(): Array<{
  planId:       AdamStreamHostPlanId;
  sku:          string;
  productName:  string;
  description:  string;
  amount:       string;
  currency:     string;
  interval:     string;
  billingCycle: AdamStreamBillingCycle;
  envKey:       string;
  configured:   boolean;
  priceId:      string | null;
  metadata:     Record<string, string>;
}> {
  return ADAM_STREAM_STRIPE_PRICES.map((p) => {
    const priceId = getAdamStreamStripePriceId(p.planId, p.billingCycle);
    return {
      planId:       p.planId,
      sku:          p.sku,
      productName:  p.productName,
      description:  p.description,
      amount:       `$${p.amountUsd}`,
      currency:     p.currency.toUpperCase(),
      interval:     p.interval,
      billingCycle: p.billingCycle,
      envKey:       p.envKey,
      configured:   Boolean(priceId),
      priceId:      priceId || null,
      metadata:     streamStripeMetadata(p.planId, p.sku, p.billingCycle),
    };
  });
}

export function streamStripeMetadata(
  planId: AdamStreamHostPlanId,
  sku: string,
  billingCycle: AdamStreamBillingCycle,
): Record<string, string> {
  return {
    alamtologi_checkout_type: 'adam_stream_host',
    alamtologi_product:       'ADAM_STREAM',
    alamtologi_stream_plan:   planId,
    alamtologi_sku:           sku,
    alamtologi_billing_cycle: billingCycle,
  };
}
