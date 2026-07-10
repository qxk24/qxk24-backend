/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Consumer Stripe Price Config
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
 * Canonical copy: docs/STRIPE_ADAM_GENERAL_PREMIUM_PRICES.md
 */

import { ENV } from '../config/environments';

export type AdamConsumerStripeProductId = 'pro' | 'general_premium';

export interface AdamConsumerStripePriceDef {
  productId:    AdamConsumerStripeProductId;
  billingCycle: 'monthly' | 'annual';
  sku:          string;
  productName:  string;
  description:  string;
  amountUsd:    number;
  currency:     'usd';
  envKey:       string;
  interval:     'month' | 'year';
}

export function consumerStripeMetadata(
  productId: AdamConsumerStripeProductId,
  sku: string,
  billingCycle: 'monthly' | 'annual',
): Record<string, string> {
  return {
    alamtologi_checkout_type: 'adam_subscription',
    alamtologi_product:       'ADAM_CONSUMER',
    alamtologi_consumer_sku:  productId,
    alamtologi_sku:           sku,
    alamtologi_billing_cycle: billingCycle,
  };
}

/** Consumer subscription prices — USD recurring. */
export const ADAM_CONSUMER_STRIPE_PRICES: readonly AdamConsumerStripePriceDef[] = [
  {
    productId:    'general_premium',
    billingCycle: 'monthly',
    sku:          'consumer.general_premium.monthly',
    productName:  'ADAM General · Premium',
    description:  'ADAM General — 100 messages/day · neural voice · deeper memory',
    amountUsd:    ENV.ADAM_GENERAL_PREMIUM_MONTHLY_USD,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_GENERAL_PREMIUM_MONTHLY',
    interval:     'month',
  },
  {
    productId:    'general_premium',
    billingCycle: 'annual',
    sku:          'consumer.general_premium.annual',
    productName:  'ADAM General · Premium (Annual)',
    description:  'ADAM General Premium billed annually (~2 months free)',
    amountUsd:    ENV.ADAM_GENERAL_PREMIUM_ANNUAL_USD,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_GENERAL_PREMIUM_ANNUAL',
    interval:     'year',
  },
  {
    productId:    'pro',
    billingCycle: 'monthly',
    sku:          'consumer.pro.monthly',
    productName:  'ADAM Tutor · Pro',
    description:  'ADAM Tutor — 100 messages/day · usage-credit wallet',
    amountUsd:    ENV.ADAM_PRO_MONTHLY_USD,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_PRO_MONTHLY',
    interval:     'month',
  },
  {
    productId:    'pro',
    billingCycle: 'annual',
    sku:          'consumer.pro.annual',
    productName:  'ADAM Tutor · Pro (Annual)',
    description:  'ADAM Tutor Pro billed annually (~2 months free)',
    amountUsd:    ENV.ADAM_PRO_ANNUAL_USD,
    currency:     'usd',
    envKey:       'STRIPE_PRICE_ID_PRO_ANNUAL',
    interval:     'year',
  },
] as const;
