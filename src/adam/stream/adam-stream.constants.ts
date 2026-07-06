/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Constants
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
 */

export const ADAM_STREAM_CHECKOUT_TYPE = 'adam_stream_host';

export type AdamStreamHostPlanId =
  | 'percuma'
  | 'business_starter'
  | 'business_standard'
  | 'business_plus'
  | 'enterprise';

export type AdamStreamBillingCycle = 'monthly' | 'annual';

export const ADAM_STREAM_PAID_PLANS = [
  'business_starter',
  'business_standard',
  'business_plus',
] as const satisfies readonly AdamStreamHostPlanId[];

export type AdamStreamPaidPlanId = typeof ADAM_STREAM_PAID_PLANS[number];
