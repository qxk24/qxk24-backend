/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Package Stripe Checkout
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
 */

import { ENV } from '../../config/environments';
import {
  assertStripeReady,
  type StripeCheckoutResult,
} from '../../subscriptions/stripe-gateway.service';
import { normalizeTutorSubscriptionLevel } from '../../subscriptions/tier-access.config';
import {
  assertTutorAgentPackageStripePriceIds,
  isTutorAgentPackageTier,
  quoteTutorAgentPackage,
  TUTOR_AGENT_PACKAGE_TIER_LABELS,
  tutorAgentPackageStripeEnvKey,
  tutorAgentPackageStripePriceId,
  type TutorAgentPackageTier,
} from './adam-tutor-agent-package.config';
import {
  activateTutorAgentPackage,
  requestTutorAgentPackage,
} from './adam-tutor-agent-package.service';
import { TutorAgentModel, type ITutorAgent } from './adam-tutor-agent.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM } from './adam-tutor-register.constants';

const STRIPE_API = 'https://api.stripe.com/v1';
const CHECKOUT_TYPE = 'tutor_agent_package';

function appUrl(): string {
  return (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
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

function checkoutBranding(): Record<string, string> {
  const logoUrl = `${appUrl()}/adam.jpg`;
  return {
    'branding_settings[display_name]':      'ADAM Tutor · Alamtologi',
    'branding_settings[button_color]':     '#4f46e5',
    'branding_settings[background_color]':  '#fafafa',
    'branding_settings[font_family]':      'inter',
    'branding_settings[logo][type]':        'url',
    'branding_settings[logo][url]':         logoUrl,
    'custom_text[submit][message]':         '1 PIN = 1 akaun pelajar ADAM Tutor · tidak boleh dikongsi.',
  };
}

function myrUnitAmount(totalMyr: number): number {
  return Math.round(totalMyr * 100);
}

function buildLineItem(
  band: ReturnType<typeof normalizeTutorSubscriptionLevel>,
  tier: TutorAgentPackageTier,
  quote: ReturnType<typeof quoteTutorAgentPackage>,
): Record<string, string> {
  const priceId = tutorAgentPackageStripePriceId(band, tier);
  if (priceId) {
    return {
      'line_items[0][price]':    priceId,
      'line_items[0][quantity]': '1',
    };
  }

  if (ENV.NODE_ENV === 'production' || ENV.STRIPE_ENABLED) {
    const envKey = tutorAgentPackageStripeEnvKey(band, tier);
    throw new Error(
      `Stripe Price ID pakej ejen belum dikonfigurasi (${envKey}). Cipta Price di Stripe Dashboard — lihat docs/STRIPE_ADAM_TUTOR_PRICES.md`,
    );
  }

  const productName = `ADAM Tutor Agen — ${quote.tierLabel} (${TUTOR_REGISTER_BAND_LABELS_BM[band]})`;
  const description = `${quote.pinCount} PIN · RM${quote.pricePerPinMyr.toFixed(2)}/PIN · 1 PIN = 1 akaun`;

  return {
    'line_items[0][price_data][currency]':                  'myr',
    'line_items[0][price_data][unit_amount]':               String(myrUnitAmount(quote.totalMyr)),
    'line_items[0][price_data][product_data][name]':         productName,
    'line_items[0][price_data][product_data][description]': description,
    'line_items[0][quantity]':                              '1',
  };
}

export async function createTutorAgentPackageCheckoutSession(
  agent: ITutorAgent,
  paths?: { successPath?: string; cancelPath?: string; renewal?: boolean },
): Promise<StripeCheckoutResult & { totalMyr: number; pinCount: number }> {
  assertStripeReady();
  if (ENV.STRIPE_ENABLED) {
    assertTutorAgentPackageStripePriceIds();
  }

  if (!agent.band || !agent.packageTier) {
    throw new Error('Pilih pakej (band sekolah + tier) sebelum bayar.');
  }

  const isRenewal = paths?.renewal === true
    || agent.packageStatus === 'active';

  const band = normalizeTutorSubscriptionLevel(agent.band);
  const tier = agent.packageTier;
  if (!isTutorAgentPackageTier(tier)) {
    throw new Error('Tier pakej tidak sah.');
  }

  const quote = quoteTutorAgentPackage(band, tier);
  const lineItem = buildLineItem(band, tier, quote);

  const successPath = paths?.successPath ?? '/adam/tutor/agen?paid=1&session_id={CHECKOUT_SESSION_ID}';
  const cancelPath = paths?.cancelPath ?? '/adam/tutor/agen?cancelled=1';

  const params: Record<string, string> = {
    mode:                       'payment',
    ...lineItem,
    ...checkoutBranding(),
    success_url:                `${appUrl()}${successPath}`,
    cancel_url:                 `${appUrl()}${cancelPath}`,
    client_reference_id:        agent.agentId,
    customer_email:             agent.email,
    billing_address_collection: 'required',
    'metadata[checkoutType]':   CHECKOUT_TYPE,
    'metadata[agentId]':        agent.agentId,
    'metadata[agentCode]':      agent.agentCode,
    'metadata[band]':           band,
    'metadata[tier]':             tier,
    'metadata[pinCount]':       String(quote.pinCount),
    'metadata[totalMyr]':       String(quote.totalMyr),
    'metadata[isRenewal]':      isRenewal ? 'true' : 'false',
  };

  const session = await stripePost<{ id: string; url: string }>(
    '/checkout/sessions',
    params,
  );

  agent.packageStripeSessionId = session.id;
  await agent.save();

  return {
    sessionId:   session.id,
    checkoutUrl: session.url,
    totalMyr:    quote.totalMyr,
    pinCount:    quote.pinCount,
  };
}

export async function activateTutorAgentPackageFromStripeCheckout(
  session: Record<string, unknown>,
): Promise<boolean> {
  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== CHECKOUT_TYPE) return false;

  const paymentStatus = session.payment_status as string | undefined;
  if (paymentStatus !== 'paid') return false;

  const agentId = meta.agentId?.trim();
  const tier = meta.tier?.trim();
  const band = meta.band?.trim();
  const sessionId = String(session.id ?? '');

  if (!agentId || !tier || !band || !sessionId || !isTutorAgentPackageTier(tier)) {
    return false;
  }

  const existing = await TutorAgentModel.findOne({ agentId }).lean();
  const isRenewal = meta.isRenewal === 'true';

  if (existing?.packageLastFulfilledSessionId === sessionId) {
    return true;
  }

  if (
    !isRenewal
    && existing?.packageStripeSessionId === sessionId
    && existing.packageStatus === 'active'
  ) {
    return true;
  }

  await activateTutorAgentPackage(agentId, {
    band:            normalizeTutorSubscriptionLevel(band),
    tier:            tier as TutorAgentPackageTier,
    activatedBy:     `stripe:${sessionId}`,
    stripeSessionId: sessionId,
    isRenewal,
  });

  return true;
}

export async function syncTutorAgentPackageFromSession(
  agentId: string,
  stripeSessionId: string,
): Promise<boolean> {
  if (!ENV.STRIPE_SECRET_KEY || !stripeSessionId) return false;

  const session = await fetch(`${STRIPE_API}/checkout/sessions/${stripeSessionId}`, {
    headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
  }).then((r) => r.json() as Promise<Record<string, unknown>>);

  const meta = session.metadata as Record<string, string> | undefined;
  if (meta?.checkoutType !== CHECKOUT_TYPE || meta.agentId !== agentId) return false;

  return activateTutorAgentPackageFromStripeCheckout(session);
}

/** Dev / QA — activate package without Stripe when billing not wired. */
export async function simulateTutorAgentPackagePayment(
  agent: ITutorAgent,
  input: { band: ReturnType<typeof normalizeTutorSubscriptionLevel>; tier: TutorAgentPackageTier },
): Promise<ITutorAgent> {
  await requestTutorAgentPackage(agent, { band: input.band, tier: input.tier });
  return activateTutorAgentPackage(agent.agentId, {
    band:        input.band,
    tier:        input.tier,
    activatedBy: 'simulate:dev',
  });
}

export { TUTOR_AGENT_PACKAGE_TIER_LABELS };
