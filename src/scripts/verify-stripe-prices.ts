/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Verify Stripe Price IDs vs canonical fees
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Usage (from alm-backend root):
 *   npm run verify:stripe-prices
 *   npm run verify:stripe-prices -- --required-only
 */

import {
  TUTOR_AGENT_PACKAGE_BANDS,
  quoteTutorAgentPackage,
  tutorAgentWholesaleStripeEnvKey,
} from '../adam/tutor/adam-tutor-agent-package.config';
import { ENV } from '../config/environments';
import { toStripeUnitAmount } from '../subscriptions/stripe-currency';

const STRIPE_API = 'https://api.stripe.com/v1';

type Currency = 'usd' | 'myr';
type Interval = 'month' | 'year' | 'one_time';

interface PriceExpectation {
  group:     string;
  label:     string;
  envKey:    string;
  amount:    number;
  currency:  Currency;
  interval?: Interval;
  required?: boolean;
}

interface StripePriceResponse {
  id:           string;
  active:       boolean;
  currency:     string;
  unit_amount:  number | null;
  unit_amount_decimal?: string | null;
  recurring?:   { interval?: string } | null;
  type?:        string;
  error?:       { message?: string };
}

function parseArgs(argv: string[]) {
  return { requiredOnly: argv.includes('--required-only') };
}

function envPriceId(key: string): string {
  const raw = (ENV as Record<string, string | boolean | number | undefined>)[key];
  return typeof raw === 'string' ? raw.trim() : '';
}

function pushEnvFee(
  out: PriceExpectation[],
  group: string,
  label: string,
  envKey: string,
  amount: number,
  currency: Currency,
  interval?: Interval,
  required = false,
): void {
  out.push({ group, label, envKey, amount, currency, interval, required });
}

function buildCatalog(): PriceExpectation[] {
  const catalog: PriceExpectation[] = [];

  pushEnvFee(catalog, 'ADAM Pro', 'Pro monthly', 'STRIPE_PRICE_ID_PRO_MONTHLY', ENV.ADAM_PRO_MONTHLY_USD, 'usd', 'month', true);
  pushEnvFee(catalog, 'ADAM Pro', 'Pro annual', 'STRIPE_PRICE_ID_PRO_ANNUAL', ENV.ADAM_PRO_ANNUAL_USD, 'usd', 'year', true);
  pushEnvFee(
    catalog,
    'ADAM General · Premium',
    'General Premium monthly',
    'STRIPE_PRICE_ID_GENERAL_PREMIUM_MONTHLY',
    ENV.ADAM_GENERAL_PREMIUM_MONTHLY_USD,
    'usd',
    'month',
    true,
  );
  pushEnvFee(
    catalog,
    'ADAM General · Premium',
    'General Premium annual',
    'STRIPE_PRICE_ID_GENERAL_PREMIUM_ANNUAL',
    ENV.ADAM_GENERAL_PREMIUM_ANNUAL_USD,
    'usd',
    'year',
    true,
  );
  pushEnvFee(catalog, 'ADAM Platform Premium', 'Platform Premium monthly', 'STRIPE_PRICE_ID_PREMIUM_MONTHLY', ENV.ADAM_PREMIUM_MONTHLY_USD, 'usd', 'month', false);
  pushEnvFee(catalog, 'ADAM Platform Premium', 'Platform Premium annual', 'STRIPE_PRICE_ID_PREMIUM_ANNUAL', ENV.ADAM_PREMIUM_ANNUAL_USD, 'usd', 'year', false);

  for (const band of TUTOR_AGENT_PACKAGE_BANDS) {
    const quote = quoteTutorAgentPackage(band);
    const envKey = tutorAgentWholesaleStripeEnvKey(band);
    catalog.push({
      group:    'ADAM Ejen',
      label:    `${band} · 100 PIN wholesale`,
      envKey,
      amount:   quote.totalMyr,
      currency: 'myr',
      interval: 'one_time',
      required: true,
    });
  }

  pushEnvFee(catalog, 'ADAM Token', 'Token $10', 'STRIPE_PRICE_ID_CREDITS_10', 10, 'usd', 'one_time', false);
  pushEnvFee(catalog, 'ADAM Token', 'Token $50', 'STRIPE_PRICE_ID_CREDITS_50', 50, 'usd', 'one_time', false);
  pushEnvFee(catalog, 'ADAM Token', 'Token $200', 'STRIPE_PRICE_ID_CREDITS_200', 200, 'usd', 'one_time', false);

  return catalog;
}

async function fetchStripePrice(priceId: string): Promise<StripePriceResponse> {
  const response = await fetch(`${STRIPE_API}/prices/${encodeURIComponent(priceId)}`, {
    headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
  });
  return response.json() as Promise<StripePriceResponse>;
}

function formatAmount(amount: number, currency: Currency): string {
  const code = currency.toUpperCase();
  if (currency === 'usd') return `$${amount.toFixed(2)}`;
  return `RM${amount.toFixed(2)}`;
}

function stripeInterval(price: StripePriceResponse): Interval {
  if (price.type === 'one_time' || !price.recurring?.interval) return 'one_time';
  return price.recurring.interval === 'year' ? 'year' : 'month';
}

async function main() {
  const { requiredOnly } = parseArgs(process.argv.slice(2));
  const catalog = buildCatalog().filter((row) => !requiredOnly || row.required);

  if (!ENV.STRIPE_SECRET_KEY) {
    console.error('[verify] STRIPE_SECRET_KEY missing — set in .env');
    process.exit(1);
  }

  const mode = ENV.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test';
  console.log(`\n=== Stripe price verification (${mode}) ===\n`);

  let pass = 0;
  let fail = 0;
  let skipped = 0;

  for (const row of catalog) {
    const priceId = envPriceId(row.envKey);
    if (!priceId) {
      skipped += 1;
      console.log(`SKIP  ${row.group} · ${row.label}`);
      console.log(`      env ${row.envKey} empty\n`);
      continue;
    }

    const expectedUnit = toStripeUnitAmount(row.amount, row.currency);
    let price: StripePriceResponse;
    try {
      price = await fetchStripePrice(priceId);
    } catch (err) {
      fail += 1;
      console.log(`FAIL  ${row.group} · ${row.label}`);
      console.log(`      ${row.envKey}=${priceId}`);
      console.log(`      network: ${err instanceof Error ? err.message : err}\n`);
      continue;
    }

    if (price.error) {
      fail += 1;
      console.log(`FAIL  ${row.group} · ${row.label}`);
      console.log(`      ${row.envKey}=${priceId}`);
      console.log(`      Stripe: ${price.error.message ?? 'unknown error'}\n`);
      continue;
    }

    const currencyOk = price.currency?.toLowerCase() === row.currency;
    const amountOk = price.unit_amount === expectedUnit;
    const intervalOk = !row.interval || stripeInterval(price) === row.interval;
    const activeOk = price.active !== false;

    if (currencyOk && amountOk && intervalOk && activeOk) {
      pass += 1;
      console.log(`PASS  ${row.group} · ${row.label}`);
      console.log(`      ${priceId} · ${formatAmount(row.amount, row.currency)} · ${row.interval ?? 'one_time'}\n`);
      continue;
    }

    fail += 1;
    console.log(`FAIL  ${row.group} · ${row.label}`);
    console.log(`      ${row.envKey}=${priceId}`);
    console.log(`      expected: ${formatAmount(row.amount, row.currency)} (${expectedUnit} ${row.currency}) · ${row.interval ?? 'one_time'}`);
    const actualAmount = price.unit_amount ?? price.unit_amount_decimal ?? '?';
    console.log(`      actual:   ${actualAmount} ${price.currency} · ${stripeInterval(price)} · active=${price.active}\n`);
  }

  const configured = pass + fail;
  console.log('--- Summary ---');
  console.log(`PASS: ${pass} · FAIL: ${fail} · SKIP (empty env): ${skipped} · checked: ${configured}/${catalog.length}`);

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[verify] Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
