/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Provision ADAM Consumer Stripe Prices
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
 * Usage (test mode recommended):
 *   STRIPE_SECRET_KEY=sk_test_... npx ts-node --transpile-only src/scripts/provision-adam-consumer-stripe-prices.ts
 *
 * Or from alm-backend with .env loaded:
 *   npm run provision:consumer-stripe-prices
 */

import {
  ADAM_CONSUMER_STRIPE_PRICES,
  consumerStripeMetadata,
} from '../subscriptions/adam-consumer-stripe.config';
import { ENV } from '../config/environments';

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripePost<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = ENV.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('Set STRIPE_SECRET_KEY in .env before running this script.');
  }

  const response = await fetch(`${STRIPE_API}${path}`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

async function main(): Promise<void> {

  const productCache = new Map<string, string>();

  for (const def of ADAM_CONSUMER_STRIPE_PRICES) {
    const productKey = def.productId;
    let productId = productCache.get(productKey);

    if (!productId) {
      const meta = consumerStripeMetadata(def.productId, def.sku, def.billingCycle);
      const productParams: Record<string, string> = {
        name:        def.productName.replace(/ \(Annual\)$/, ''),
        description: def.description,
      };
      for (const [k, v] of Object.entries(meta)) {
        productParams[`metadata[${k}]`] = v;
      }

      const product = await stripePost<{ id: string }>('/products', productParams);
      productId = product.id;
      productCache.set(productKey, productId);

    }

    const unitAmount = Math.round(def.amountUsd * 100);
    const meta = consumerStripeMetadata(def.productId, def.sku, def.billingCycle);
    const priceParams: Record<string, string> = {
      product:                     productId,
      currency:                    def.currency,
      unit_amount:                 String(unitAmount),
      'recurring[interval]':       def.interval,
      'recurring[interval_count]': '1',
      nickname:                    `${def.productId} · ${def.billingCycle}`,
    };
    for (const [k, v] of Object.entries(meta)) {
      priceParams[`metadata[${k}]`] = v;
    }

    const price = await stripePost<{ id: string }>('/prices', priceParams);

  }

}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
