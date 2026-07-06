/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Provision ADAM Stream Stripe Prices
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
 *   STRIPE_SECRET_KEY=sk_test_... npx ts-node --transpile-only src/scripts/provision-adam-stream-stripe-prices.ts
 */

import {
  ADAM_STREAM_STRIPE_PRICES,
  streamStripeMetadata,
} from '../adam/stream/adam-stream-stripe.config';

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripePost<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('Set STRIPE_SECRET_KEY before running this script.');
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
  console.log('Provisioning ADAM Stream Stripe products + prices...\n');

  const productCache = new Map<string, string>();

  for (const def of ADAM_STREAM_STRIPE_PRICES) {
    const productKey = def.planId;
    let productId = productCache.get(productKey);

    if (!productId) {
      const meta = streamStripeMetadata(def.planId, def.sku, def.billingCycle);
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
      console.log(`Product ${def.planId}: ${productId}`);
    }

    const unitAmount = Math.round(def.amountUsd * 100);
    const price = await stripePost<{ id: string }>('/prices', {
      product:                     productId,
      currency:                    def.currency,
      unit_amount:                 String(unitAmount),
      'recurring[interval]':       def.interval,
      'recurring[interval_count]': '1',
      nickname:                    `${def.planId} · ${def.billingCycle}`,
      [`metadata[alamtologi_sku]`]: def.sku,
      [`metadata[${'alamtologi_stream_plan'}`]: def.planId,
      [`metadata[${'alamtologi_billing_cycle'}`]: def.billingCycle,
      [`metadata[${'alamtologi_checkout_type'}`]: 'adam_stream_host',
    });

    console.log(`${def.envKey}=${price.id}  ($${def.amountUsd}/${def.interval})`);
  }

  console.log('\nDone. Paste the env lines above into alm-backend/.env');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
