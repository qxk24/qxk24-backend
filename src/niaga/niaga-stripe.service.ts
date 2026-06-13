/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Stripe Checkout
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import {
  assertStripeReady,
  type StripeCheckoutResult,
} from '../subscriptions/stripe-gateway.service';
import { stripeResourceId } from '../subscriptions/stripe-currency';
import { NIAGA_SKU_SEAT, NIAGA_SKU_SEAT_ANN } from './niaga.constants';
import { NiagaPartnerLicenseModel } from './niaga-partner-license.schema';
import {
  NiagaSubscriptionModel,
  NiagaBillingCycle,
  NiagaSubscriptionStatus,
} from './niaga-subscription.schema';
import { NiagaTraderStatus } from './niaga-trader-registration.schema';
import { getNiagaTraderRegistration, activateNiagaTrader } from './niaga-trader.service';
import { getNiagaStripePriceDef, getNiagaStripePriceId } from './niaga-stripe.config';
import {
  recordNiagaLedgerEntry,
} from './niaga-payment-ledger.service';
import { NiagaLedgerType } from './niaga-payment-ledger.schema';

const STRIPE_API = 'https://api.stripe.com/v1';
const VALID_SKUS = new Set([NIAGA_SKU_SEAT, NIAGA_SKU_SEAT_ANN]);

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

function newNiagaSubscriptionId(): string {
  return `NIAGA-SUB-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export async function createNiagaSeatCheckoutSession(input: {
  userId:         string;
  customerEmail?: string;
  registrationId: string;
  sku?:           string;
}): Promise<StripeCheckoutResult & { subscriptionId: string }> {
  assertStripeReady();

  const sku = input.sku?.trim() || NIAGA_SKU_SEAT;
  if (!VALID_SKUS.has(sku)) {
    throw new Error(`Unknown Niaga SKU: ${sku}`);
  }

  const def = getNiagaStripePriceDef(sku);
  if (!def) throw new Error(`Unknown Niaga SKU: ${sku}`);

  const priceId = getNiagaStripePriceId(sku);
  if (!priceId) {
    throw new Error(
      `Stripe price not configured. Add ${def.envKey} to backend .env.`,
    );
  }

  const reg = await getNiagaTraderRegistration(input.registrationId);
  if (!reg) throw new Error('Trader registration not found.');
  if (reg.userId !== input.userId) {
    throw new Error('Registration does not belong to this account.');
  }
  if (reg.status !== NiagaTraderStatus.APPROVED && reg.status !== NiagaTraderStatus.ACTIVE) {
    throw new Error('Partner must approve your registration before payment.');
  }

  const license = await NiagaPartnerLicenseModel.findOne({
    channelCode: reg.channelCode,
  }).lean();
  if (!license) throw new Error('Partner license not found.');

  const wholesale = license.wholesalePerSeat;
  const commission = Math.round((def.amountMyr - wholesale) * 100) / 100;
  const subscriptionId = newNiagaSubscriptionId();

  await NiagaSubscriptionModel.findOneAndUpdate(
    { registrationId: reg.registrationId },
    {
      $set: {
        subscriptionId,
        registrationId:       reg.registrationId,
        userId:               input.userId,
        channelCode:          reg.channelCode,
        sku,
        amountMyr:            def.amountMyr,
        wholesaleAmountMyr:   wholesale,
        partnerCommissionMyr: commission,
        billingCycle:         def.billingCycle,
        status:               NiagaSubscriptionStatus.PENDING,
      },
    },
    { upsert: true },
  );

  const params: Record<string, string> = {
    mode:                       'subscription',
    'line_items[0][price]':     priceId,
    'line_items[0][quantity]':  '1',
    success_url:                `${appUrl()}/niaga/daftar?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:                 `${appUrl()}/niaga/daftar?cancelled=1`,
    client_reference_id:        subscriptionId,
    billing_address_collection: 'auto',
    'metadata[checkoutType]':   'niaga_seat',
    'metadata[userId]':         input.userId,
    'metadata[registrationId]': reg.registrationId,
    'metadata[subscriptionId]': subscriptionId,
    'metadata[channelCode]':    reg.channelCode,
    'metadata[sku]':              sku,
    'metadata[wholesaleAmount]': String(wholesale),
    'metadata[licenseId]':      license.licenseId,
    'subscription_data[metadata][checkoutType]':   'niaga_seat',
    'subscription_data[metadata][userId]':         input.userId,
    'subscription_data[metadata][registrationId]': reg.registrationId,
    'subscription_data[metadata][subscriptionId]': subscriptionId,
    'subscription_data[metadata][channelCode]':    reg.channelCode,
  };

  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  await NiagaSubscriptionModel.updateOne(
    { subscriptionId },
    { $set: { stripeSessionId: session.id } },
  );

  return { sessionId: session.id, checkoutUrl: session.url, subscriptionId };
}

export async function activateNiagaFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== 'niaga_seat') return false;

  const userId = meta.userId?.trim();
  const registrationId = meta.registrationId?.trim();
  const subscriptionId = meta.subscriptionId?.trim();
  const channelCode = meta.channelCode?.trim().toUpperCase();
  const paymentStatus = session.payment_status as string | undefined;

  if (!userId || !registrationId || !subscriptionId || !channelCode) return false;
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') return false;

  const stripeSubId = stripeResourceId(session.subscription);
  const stripeCustomerId = stripeResourceId(session.customer);
  const stripeSessionId = session.id as string | undefined;

  const sub = await NiagaSubscriptionModel.findOne({ subscriptionId });
  if (!sub) return false;

  const periodEnd = new Date();
  if (sub.billingCycle === NiagaBillingCycle.ANNUAL) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  sub.status = NiagaSubscriptionStatus.ACTIVE;
  sub.stripeSessionId = stripeSessionId ?? sub.stripeSessionId;
  sub.stripeSubscriptionId = stripeSubId ?? sub.stripeSubscriptionId;
  sub.stripeCustomerId = stripeCustomerId ?? sub.stripeCustomerId;
  sub.currentPeriodEnd = periodEnd;
  await sub.save();

  await activateNiagaTrader(registrationId);

  const existingLedger = await import('./niaga-payment-ledger.schema').then(
    (m) => m.NiagaPaymentLedgerModel.findOne({ stripeSessionId }).lean(),
  );
  if (!existingLedger) {
    await recordNiagaLedgerEntry({
      type:            NiagaLedgerType.TRADER_RETAIL,
      amountMyr:       sub.amountMyr,
      channelCode,
      userId,
      subscriptionId,
      stripeSessionId: stripeSessionId ?? null,
      note:            `Retail ${sub.sku}`,
    });
    await recordNiagaLedgerEntry({
      type:            NiagaLedgerType.WHOLESALE,
      amountMyr:       sub.wholesaleAmountMyr,
      channelCode,
      userId,
      subscriptionId,
      stripeSessionId: stripeSessionId ?? null,
      note:            'Wholesale to QIUBBX',
    });
    if (sub.partnerCommissionMyr > 0) {
      await recordNiagaLedgerEntry({
        type:            NiagaLedgerType.PARTNER_COMMISSION,
        amountMyr:       sub.partnerCommissionMyr,
        channelCode,
        userId,
        subscriptionId,
        stripeSessionId: stripeSessionId ?? null,
        note:            'Partner commission (Model A)',
      });
    }
  }

  return true;
}
