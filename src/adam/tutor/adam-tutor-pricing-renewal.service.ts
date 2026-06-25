/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pricing Renewal Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-25
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Agent PIN students: band-priced USD/mo for 12 months from first payment.
 * After window ends, extend only if agent license renewed; else → public band price.
 */

import { ENV } from '../../config/environments';
import {
  PaymentProvider,
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
} from '../../subscriptions/subscription.schema';
import { toStripeUnitAmount } from '../../subscriptions/stripe-currency';
import { tutorMonthlyUsdByLevel } from '../../subscriptions/tier-access.config';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import { TutorAgentModel } from './adam-tutor-agent.schema';
import {
  TutorEnrollmentModel,
  type ITutorEnrollment,
} from './adam-tutor-enrollment.schema';
import { TUTOR_AGENT_LICENSE_MONTHS } from './adam-tutor-register.constants';
import type { TutorPricingChannel } from './adam-tutor-pricing.types';

const STRIPE_API = 'https://api.stripe.com/v1';

export type PricingRenewalOutcome = 'unchanged' | 'extended' | 'switched' | 'restored';

export function addCalendarMonths(base: Date, months: number): Date {
  const out = new Date(base);
  out.setMonth(out.getMonth() + months);
  return out;
}

export function computeAgentPriceWindowEnd(start: Date): Date {
  return addCalendarMonths(start, TUTOR_AGENT_LICENSE_MONTHS);
}

export function computeAgentPackageExpiry(from: Date = new Date()): Date {
  return addCalendarMonths(from, TUTOR_AGENT_LICENSE_MONTHS);
}

export function tutorPublicMonthlyUsd(
  level?: TutorSubscriptionLevel | string | null,
): number {
  return tutorMonthlyUsdByLevel(level, 'public');
}

export function tutorAgentMonthlyUsd(
  level?: TutorSubscriptionLevel | string | null,
): number {
  return tutorMonthlyUsdByLevel(level, 'agent');
}

export function isAgentLicenseActive(
  packageExpiresAt: Date | null | undefined,
  at: Date = new Date(),
): boolean {
  return Boolean(packageExpiresAt && packageExpiresAt > at);
}

/** Legacy active agents without expiry — infer from packagePaidAt + 12 months. */
export function resolveAgentLicenseExpiry(agent: {
  packageStatus?: string;
  packagePaidAt?: Date | null;
  packageExpiresAt?: Date | null;
}): Date | null {
  if (agent.packageExpiresAt) return agent.packageExpiresAt;
  if (agent.packageStatus !== 'active' || !agent.packagePaidAt) return null;
  return computeAgentPackageExpiry(agent.packagePaidAt);
}

/** Stamp 12-month agent window on first successful student payment. */
export function stampEnrollmentAgentPriceWindow(
  enrollment: ITutorEnrollment,
  paidAt: Date,
): void {
  if (enrollment.agentPriceStartedAt) return;

  enrollment.agentPriceStartedAt = paidAt;
  enrollment.agentPriceEndsAt = computeAgentPriceWindowEnd(paidAt);
  enrollment.priceSwitchAt = enrollment.agentPriceEndsAt;
  enrollment.pricingChannel = 'agent';
  enrollment.priceSwitchedAt = null;
}

function stripeHeaders(): Record<string, string> {
  return {
    Authorization:  `Bearer ${ENV.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

async function stripePost<T>(path: string, params: Record<string, string>): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method:  'POST',
    headers: stripeHeaders(),
    body:    new URLSearchParams(params).toString(),
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

async function stripeGet<T>(path: string): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }
  return data;
}

/** Update Stripe subscription item to new USD monthly amount. */
export async function updateStripeSubscriptionMonthlyUsd(
  stripeSubId: string,
  monthlyUsd: number,
  productName: string,
  description: string,
): Promise<void> {
  if (!ENV.STRIPE_SECRET_KEY || !stripeSubId) return;

  const sub = await stripeGet<{
    items: { data: Array<{ id: string }> };
  }>(`/subscriptions/${stripeSubId}`);

  const itemId = sub.items?.data?.[0]?.id;
  if (!itemId) return;

  const unitAmount = toStripeUnitAmount(monthlyUsd, 'usd');

  await stripePost(`/subscriptions/${stripeSubId}`, {
    'items[0][id]':                                         itemId,
    'items[0][price_data][currency]':                       'usd',
    'items[0][price_data][unit_amount]':                    String(unitAmount),
    'items[0][price_data][recurring][interval]':              'month',
    'items[0][price_data][product_data][name]':              productName,
    'items[0][price_data][product_data][description]':       description,
    proration_behavior:                                     'none',
  });
}

async function syncSubscriptionPricing(
  subscriptionId: string,
  channel: TutorPricingChannel,
  monthlyUsd: number,
  agentPriceEndsAt: Date | null,
): Promise<void> {
  await SubscriptionModel.findByIdAndUpdate(subscriptionId, {
    $set: {
      pricingChannel:   channel,
      amountPerCycle:   monthlyUsd,
      currency:         'USD',
      agentPriceEndsAt: agentPriceEndsAt ?? undefined,
    },
  });
}

async function switchEnrollmentToPublicPricing(
  enrollment: ITutorEnrollment,
): Promise<void> {
  const now = new Date();
  const publicUsd = tutorPublicMonthlyUsd(enrollment.band);

  enrollment.pricingChannel = 'public';
  enrollment.priceSwitchedAt = now;
  await enrollment.save();

  if (!enrollment.subscriptionId) return;

  const sub = await SubscriptionModel.findById(enrollment.subscriptionId);
  if (!sub || sub.tier !== SubscriptionTier.TUTOR) return;

  await syncSubscriptionPricing(
    enrollment.subscriptionId,
    'public',
    publicUsd,
    enrollment.agentPriceEndsAt,
  );

  if (sub.provider === PaymentProvider.STRIPE && sub.providerSubId) {
    try {
      await updateStripeSubscriptionMonthlyUsd(
        sub.providerSubId,
        publicUsd,
        'ADAM Tutor',
        'Public monthly — agent license expired',
      );
    } catch (err) {
      console.error('[TutorPricingRenewal] Stripe public switch failed:', err);
    }
  }
}

async function restoreEnrollmentAgentPricing(
  enrollment: ITutorEnrollment,
  windowEnd: Date,
): Promise<void> {
  enrollment.pricingChannel = 'agent';
  enrollment.agentPriceEndsAt = windowEnd;
  enrollment.priceSwitchAt = windowEnd;
  enrollment.priceSwitchedAt = null;
  await enrollment.save();

  if (!enrollment.subscriptionId) return;

  const sub = await SubscriptionModel.findById(enrollment.subscriptionId);
  if (!sub || sub.tier !== SubscriptionTier.TUTOR) return;

  const agentUsd = tutorAgentMonthlyUsd(enrollment.band);
  await syncSubscriptionPricing(
    enrollment.subscriptionId,
    'agent',
    agentUsd,
    windowEnd,
  );

  if (sub.provider === PaymentProvider.STRIPE && sub.providerSubId) {
    try {
      await updateStripeSubscriptionMonthlyUsd(
        sub.providerSubId,
        agentUsd,
        'ADAM Tutor',
        'Agent channel — license renewed',
      );
    } catch (err) {
      console.error('[TutorPricingRenewal] Stripe agent restore failed:', err);
    }
  }
}

/** Evaluate one enrollment — extend agent window or switch to public. */
export async function processEnrollmentPricingRenewal(
  enrollmentId: string,
): Promise<PricingRenewalOutcome> {
  const enrollment = await TutorEnrollmentModel.findOne({ enrollmentId });
  if (!enrollment?.agentPriceEndsAt) return 'unchanged';

  const now = new Date();
  if (enrollment.agentPriceEndsAt > now) return 'unchanged';
  if (enrollment.pricingChannel === 'public' && enrollment.priceSwitchedAt) {
    return 'unchanged';
  }

  const agent = enrollment.agentId
    ? await TutorAgentModel.findOne({ agentId: enrollment.agentId })
    : null;

  const licenseExpiry = agent ? resolveAgentLicenseExpiry(agent) : null;

  if (isAgentLicenseActive(licenseExpiry, now)) {
    const nextEnd = computeAgentPriceWindowEnd(enrollment.agentPriceEndsAt);
    enrollment.agentPriceEndsAt = nextEnd;
    enrollment.priceSwitchAt = nextEnd;
    await enrollment.save();

    if (enrollment.subscriptionId) {
      await syncSubscriptionPricing(
        enrollment.subscriptionId,
        'agent',
        tutorAgentMonthlyUsd(enrollment.band),
        nextEnd,
      );
    }
    return 'extended';
  }

  await switchEnrollmentToPublicPricing(enrollment);
  return 'switched';
}

/** After agent renews license — restore agent pricing for switched students. */
export async function restoreAgentPricingAfterLicenseRenewal(
  agentId: string,
): Promise<number> {
  const agent = await TutorAgentModel.findOne({ agentId });
  const licenseExpiry = agent ? resolveAgentLicenseExpiry(agent) : null;
  if (!licenseExpiry || !isAgentLicenseActive(licenseExpiry)) {
    return 0;
  }

  const enrollments = await TutorEnrollmentModel.find({
    agentId,
    pricingChannel: 'public',
    priceSwitchedAt: { $ne: null },
  });

  let restored = 0;
  const windowEnd = computeAgentPriceWindowEnd(new Date());

  for (const enrollment of enrollments) {
    await restoreEnrollmentAgentPricing(enrollment, windowEnd);
    restored += 1;
  }

  return restored;
}

export interface PricingRenewalSweepResult {
  scanned:   number;
  extended:  number;
  switched:  number;
  unchanged: number;
}

/** Daily / webhook sweep — process enrollments past agent-price window. */
export async function sweepExpiredTutorAgentPricing(
  limit = 200,
): Promise<PricingRenewalSweepResult> {
  const now = new Date();
  const due = await TutorEnrollmentModel.find({
    agentPriceEndsAt: { $lte: now },
    pricingChannel:   'agent',
    priceSwitchedAt: null,
  })
    .sort({ agentPriceEndsAt: 1 })
    .limit(limit)
    .lean();

  const result: PricingRenewalSweepResult = {
    scanned:   due.length,
    extended:  0,
    switched:  0,
    unchanged: 0,
  };

  for (const row of due) {
    const outcome = await processEnrollmentPricingRenewal(row.enrollmentId);
    if (outcome === 'extended') result.extended += 1;
    else if (outcome === 'switched') result.switched += 1;
    else result.unchanged += 1;
  }

  return result;
}

/** Run pricing check for one user (invoice webhook hook). */
export async function processTutorPricingForUser(userId: string): Promise<PricingRenewalOutcome> {
  const enrollment = await TutorEnrollmentModel.findOne({ userId });
  if (!enrollment) return 'unchanged';
  return processEnrollmentPricingRenewal(enrollment.enrollmentId);
}

/** Active tutor subscriptions nearing window end — for proactive sweep. */
export async function sweepActiveTutorSubscriptions(limit = 100): Promise<PricingRenewalSweepResult> {
  const subs = await SubscriptionModel.find({
    tier:           SubscriptionTier.TUTOR,
    status:         SubscriptionStatus.ACTIVE,
    pricingChannel: 'agent',
    agentPriceEndsAt: { $lte: new Date() },
  })
    .limit(limit)
    .lean();

  const result: PricingRenewalSweepResult = {
    scanned:   subs.length,
    extended:  0,
    switched:  0,
    unchanged: 0,
  };

  for (const sub of subs) {
    if (!sub.tutorEnrollmentId) continue;
    const outcome = await processEnrollmentPricingRenewal(sub.tutorEnrollmentId);
    if (outcome === 'extended') result.extended += 1;
    else if (outcome === 'switched') result.switched += 1;
    else result.unchanged += 1;
  }

  return result;
}
