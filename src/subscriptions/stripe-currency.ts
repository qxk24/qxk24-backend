/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Stripe Currency Helpers
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Stripe zero-decimal currencies — amount is whole units, not ×100. */
const STRIPE_ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG',
  'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'IDR',
]);

/** Convert display amount (e.g. 69.9 MYR) to Stripe unit_amount. */
export function toStripeUnitAmount(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  const normalized = Number.isFinite(amount) ? amount : 0;
  if (STRIPE_ZERO_DECIMAL.has(code)) {
    return Math.round(normalized);
  }
  return Math.round(normalized * 100);
}

/** Stripe Unix seconds → Date, or null when missing/invalid. */
export function stripeSecondsToDate(raw: unknown): Date | null {
  if (raw == null) return null;
  const seconds = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Reject Invalid Date values already stored on Mongo documents. */
export function validDateOrNull(value: Date | null | undefined): Date | null {
  if (!value) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

export type BillingCycleLike = 'MONTHLY' | 'ANNUAL' | string;

/** Estimate period end from billing cycle when Stripe omits period fields. */
export function computeBillingPeriodEnd(
  start: Date,
  billingCycle: BillingCycleLike,
): Date {
  const end = new Date(start);
  if (billingCycle === 'ANNUAL') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

/** Checkout/webhook payloads may return an id string or `{ id }`. */
export function stripeResourceId(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (raw && typeof raw === 'object' && 'id' in raw) {
    const id = (raw as { id?: unknown }).id;
    if (typeof id === 'string' && id.length > 0) return id;
  }
  return null;
}
