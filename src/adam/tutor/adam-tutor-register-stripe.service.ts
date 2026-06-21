/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Stripe Checkout
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../../config/environments';
import {
  assertStripeReady,
  tutorStripePriceId,
  type StripeCheckoutResult,
} from '../../subscriptions/stripe-gateway.service';
import { stripeResourceId } from '../../subscriptions/stripe-currency';
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
  BillingCycle,
  PaymentProvider,
  SupportedRegion,
} from '../../subscriptions/subscription.schema';
import { normalizeTutorSubscriptionLevel } from '../../subscriptions/tier-access.config';
import { getTutorBandPricing, tutorRegisterRegion } from './adam-tutor-pricing.service';
import { TutorEnrollmentModel, TutorEnrollmentStatus } from './adam-tutor-enrollment.schema';
import { markTutorEnrollmentPaid } from './adam-tutor-enrollment.service';
import { ADAMStudentAccountModel } from '../adam-student.schema';

const STRIPE_API = 'https://api.stripe.com/v1';

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
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

function tutorAgentStripePriceId(level: string): string {
  return tutorStripePriceId(normalizeTutorSubscriptionLevel(level), 'agent');
}

function newMongoSubscriptionId(): string {
  return `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function createTutorRegisterCheckoutSession(input: {
  userId:         string;
  customerEmail?: string;
}): Promise<StripeCheckoutResult & { enrollmentId: string }> {
  assertStripeReady();

  const enrollment = await TutorEnrollmentModel.findOne({ userId: input.userId });
  if (!enrollment) {
    throw new Error('Sila masukkan PIN terlebih dahulu.');
  }
  if (enrollment.status !== TutorEnrollmentStatus.CODE_LOCKED) {
    throw new Error('PIN tidak sedia untuk bayaran.');
  }

  const band = normalizeTutorSubscriptionLevel(enrollment.band);
  const priceId = tutorAgentStripePriceId(band);
  if (!priceId) {
    throw new Error(
      'Stripe harga Tutor belum dikonfigurasi. Hubungi pentadbir.',
    );
  }

  const pricing = await getTutorBandPricing(band, 'agent', tutorRegisterRegion());
  const region = tutorRegisterRegion();

  const sub = await SubscriptionModel.create({
    userId:         input.userId,
    tier:           SubscriptionTier.TUTOR,
    tutorLevel:     band,
    status:         SubscriptionStatus.PENDING,
    billingCycle:   BillingCycle.MONTHLY,
    region,
    currency:       pricing.currency,
    amountPerCycle: pricing.monthlyAmount,
    provider:       PaymentProvider.STRIPE,
  });

  const mongoId = sub._id?.toString() ?? newMongoSubscriptionId();

  const params: Record<string, string> = {
    mode:                       'subscription',
    'line_items[0][price]':     priceId,
    'line_items[0][quantity]':  '1',
    success_url:                `${appUrl()}/adam/tutor/daftar?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:                 `${appUrl()}/adam/tutor/daftar?cancelled=1`,
    client_reference_id:        mongoId,
    billing_address_collection: 'auto',
    'metadata[checkoutType]':   'tutor_register',
    'metadata[userId]':         input.userId,
    'metadata[enrollmentId]':   enrollment.enrollmentId,
    'metadata[registerCode]':   enrollment.registerCode,
    'metadata[subscriptionId]': mongoId,
    'metadata[tutorLevel]':     band,
    'subscription_data[metadata][checkoutType]':   'tutor_register',
    'subscription_data[metadata][userId]':         input.userId,
    'subscription_data[metadata][enrollmentId]':   enrollment.enrollmentId,
    'subscription_data[metadata][registerCode]':   enrollment.registerCode,
    'subscription_data[metadata][subscriptionId]': mongoId,
    'subscription_data[metadata][tutorLevel]':     band,
  };

  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $set: { providerSubId: session.id },
  });

  enrollment.subscriptionId = mongoId;
  enrollment.stripeSessionId = session.id;
  await enrollment.save();

  return {
    sessionId:    session.id,
    checkoutUrl:  session.url,
    enrollmentId: enrollment.enrollmentId,
  };
}

export async function activateTutorRegisterFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== 'tutor_register') return false;

  const userId = meta.userId?.trim();
  const enrollmentId = meta.enrollmentId?.trim();
  const mongoId = meta.subscriptionId?.trim();
  const paymentStatus = session.payment_status as string | undefined;

  if (!userId || !enrollmentId || !mongoId) return false;
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return false;

  const stripeSubId = stripeResourceId(session.subscription);
  const stripeCustomerId = stripeResourceId(session.customer);
  const stripeSessionId = session.id as string | undefined;

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await SubscriptionModel.findByIdAndUpdate(mongoId, {
    $set: {
      status:            SubscriptionStatus.ACTIVE,
      provider:          PaymentProvider.STRIPE,
      providerSubId:     stripeSubId ?? stripeSessionId,
      providerCustomerId: stripeCustomerId ?? undefined,
      currentPeriodStart: new Date(),
      currentPeriodEnd:   periodEnd,
    },
  });

  await markTutorEnrollmentPaid({
    userId,
    enrollmentId,
    stripeSessionId: stripeSessionId ?? undefined,
    subscriptionId:  mongoId,
  });

  return true;
}

/** Dev / QA — mark paid without Stripe when billing not wired. */
export async function simulateTutorRegisterPayment(userId: string): Promise<void> {
  const enrollment = await TutorEnrollmentModel.findOne({ userId });
  if (!enrollment || enrollment.status !== TutorEnrollmentStatus.CODE_LOCKED) {
    throw new Error('Tiada PIN untuk disimulasikan.');
  }

  const band = normalizeTutorSubscriptionLevel(enrollment.band);
  const pricing = await getTutorBandPricing(band, 'agent', tutorRegisterRegion());
  const region = tutorRegisterRegion();

  const sub = await SubscriptionModel.create({
    userId,
    tier:           SubscriptionTier.TUTOR,
    tutorLevel:     band,
    status:         SubscriptionStatus.ACTIVE,
    billingCycle:   BillingCycle.MONTHLY,
    region,
    currency:       pricing.currency,
    amountPerCycle: pricing.monthlyAmount,
    provider:       PaymentProvider.MANUAL,
    currentPeriodStart: new Date(),
    currentPeriodEnd:   (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    })(),
  });

  await markTutorEnrollmentPaid({
    userId,
    enrollmentId:   enrollment.enrollmentId,
    subscriptionId: sub._id?.toString(),
  });
}

export async function syncTutorPaymentFromSession(
  userId: string,
  stripeSessionId: string,
): Promise<boolean> {
  if (!ENV.STRIPE_SECRET_KEY || !stripeSessionId) return false;

  const session = await fetch(`${STRIPE_API}/checkout/sessions/${stripeSessionId}`, {
    headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
  }).then((r) => r.json() as Promise<Record<string, unknown>>);

  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== 'tutor_register' || meta.userId !== userId) return false;

  return activateTutorRegisterFromStripeCheckout(session);
}

export async function resolveStudentEmail(userId: string): Promise<string | undefined> {
  const doc = await ADAMStudentAccountModel.findOne({ userId }).lean();
  return doc?.email;
}
