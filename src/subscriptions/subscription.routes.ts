/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { getTokenUser, requireAdamUser, requireFounder } from '../middleware/auth.middleware';
import { routeSubscriptionCreation } from './payment-router.service';
import { detectRegionFromHeaders } from './region-detector.service';
import {
  checkPencarianLimit,
  purchasePencarianExtension,
  convertPencarianToPelajar,
  getPencarianUsage,
  getWaqfReport,
} from './pencarian-tracker.service';
import {
  getPelajarPricing,
  getProfesionalPricing,
  getStudioPricing,
  ENTERPRISE_PRICING,
  TIER_ACCESS,
} from './tier-access.config';
import {
  SubscriptionModel,
  SubscriptionTier,
  BillingCycle,
  PaymentProvider,
  SubscriptionStatus,
  SupportedRegion,
  FOUNDER_SUBSCRIPTION_ID,
} from './subscription.schema';
import {
  handleRazorpayWebhook,
  handleStripeWebhook,
  handleXenditWebhook,
  handlePaystackWebhook,
} from './webhook-handler.service';
import {
  getStripeGatewayStatus,
  confirmStripeCheckoutSession,
} from './stripe-gateway.service';
import { getProviderForRegion } from './tier-access.config';
import { ENV } from '../config/environments';
import {
  freeDailyLimit,
  pelajarMonthlyLimit,
} from '../freemium/adam-freemium-daily.service';
import {
  freeRollingLimit,
  getRollingQuotaSnapshot,
  profesionalRollingLimit,
  rollingWindowHours,
} from '../freemium/adam-freemium-rolling.service';
import { RollingQuotaBucket } from '../freemium/adam-freemium.schema';
import { pelajarDailySoftLimit } from '../freemium/adam-freemium-premium.service';
import { getPremiumCreditPacks } from '../freemium/adam-freemium-credit.service';
import { guestLifetimeLimit } from '../freemium/adam-freemium-guest.service';

const router = new Hono();

router.get('/pricing', (c) => {
  const region      = detectRegionFromHeaders(c.req.raw.headers);
  const pelajar     = getPelajarPricing(region);
  const profesional = getProfesionalPricing(region);
  const studio      = getStudioPricing(region);
  const stripe      = getStripeGatewayStatus();
  const paymentWired = ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;

  return c.json({
    region,
    payment: {
      stripe,
      regionalProvider: getProviderForRegion(region),
      wired:            paymentWired,
      comingSoon:       !paymentWired,
    },
    freemium: ENV.ADAM_FREEMIUM_ENABLED ? {
      guestLifetimeLimit:    guestLifetimeLimit(),
      freeRollingLimit:      freeRollingLimit(),
      rollingWindowHours:    rollingWindowHours(),
      pelajarMonthlyLimit:   pelajarMonthlyLimit(),
      pelajarDailySoftLimit: pelajarDailySoftLimit(),
      profesionalRollingLimit: profesionalRollingLimit(),
      premiumTopUps:         getPremiumCreditPacks(region),
      /** @deprecated Use freeRollingLimit */
      freeDailyLimit:        freeDailyLimit(),
    } : null,
    tiers: {
      pencarian: {
        label:         'Basic',
        monthlyAmount: 0,
        annualAmount:  0,
        currency:      pelajar.currency,
        description:   'Register free — deep questions in a rolling window, no payment required.',
        messageLimit:  ENV.ADAM_FREEMIUM_ENABLED ? freeRollingLimit() : 100,
        rollingLimit:  ENV.ADAM_FREEMIUM_ENABLED ? freeRollingLimit() : undefined,
        rollingWindowHours: ENV.ADAM_FREEMIUM_ENABLED ? rollingWindowHours() : undefined,
        guestLimit:    ENV.ADAM_FREEMIUM_ENABLED ? guestLifetimeLimit() : undefined,
        extensionFee:  pelajar.extensionFee,
      },
      pelajar: {
        label:         'Premium',
        monthlyAmount: pelajar.monthly,
        annualAmount:  pelajar.annual,
        currency:      pelajar.currency,
        description:   'Continuous constitutional memory — ADAM remembers you across every return.',
        savingsNote:   '2 months free with annual billing.',
        comingSoon:    !paymentWired,
        monthlyLimit:  ENV.ADAM_FREEMIUM_ENABLED ? pelajarMonthlyLimit() : undefined,
        dailySoftLimit: ENV.ADAM_FREEMIUM_ENABLED ? pelajarDailySoftLimit() : undefined,
        topUpPacks:    ENV.ADAM_FREEMIUM_ENABLED ? getPremiumCreditPacks(region) : undefined,
      },
      profesional: {
        label:         'Profesional',
        monthlyAmount: profesional.monthly,
        annualAmount:  profesional.annual,
        currency:      profesional.currency,
        description:   'Full relational memory, API, publishing — plus Builder mode when you ship code.',
        savingsNote:   '2 months free with annual billing.',
        comingSoon:    !paymentWired,
        rollingLimit:  ENV.ADAM_FREEMIUM_ENABLED ? profesionalRollingLimit() : undefined,
        rollingWindowHours: ENV.ADAM_FREEMIUM_ENABLED ? rollingWindowHours() : undefined,
      },
      studio: {
        label:         'Studio Pro',
        monthlyAmount: studio.monthly,
        annualAmount:  studio.annual,
        currency:      studio.currency,
        description:   'Unlimited builder sessions — inquiry while checkout is finalised.',
        savingsNote:   '2 months free with annual billing.',
      },
      enterprise: {
        label: 'Enterprise',
        tiers: ENTERPRISE_PRICING.map((t) => ({
          size:     t.label === 'kecil' ? 'small' : t.label === 'sederhana' ? 'medium' : 'large',
          maxUsers: t.maxUsers === -1 ? 'Unlimited' : t.maxUsers,
          monthly:  t.monthly[region]?.amount ?? t.monthly[SupportedRegion.OTHER]?.amount,
          annual:   t.annual[region]?.amount  ?? t.annual[SupportedRegion.OTHER]?.amount,
          currency: t.monthly[region]?.currency ?? 'USD',
        })),
        description: 'Organisational memory, white-label, and private deployment.',
      },
    },
  });
});

router.post('/create', requireAdamUser, async (c) => {
  const body = await c.req.json() as { tier?: SubscriptionTier; billingCycle?: BillingCycle };

  if (!body.tier || !body.billingCycle) {
    return c.json({ error: 'tier and billingCycle are required.' }, 400);
  }

  if (body.tier === SubscriptionTier.PENCARIAN) {
    return c.json({ error: 'Pencarian is a founder waqf — no payment required.' }, 400);
  }

  const stripe = getStripeGatewayStatus();
  const paymentWired = ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;
  if (!paymentWired) {
    return c.json({
      error:      'Payment gateway coming soon. Register free to use ADAM today.',
      comingSoon: true,
    }, 503);
  }

  const user = getTokenUser(c)!;

  try {
    const result = await routeSubscriptionCreation({
      userId:       user.userId,
      tier:         body.tier,
      billingCycle: body.billingCycle,
      headers:      c.req.raw.headers,
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

router.get('/me', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;

  const sub = await SubscriptionModel.findOne(
    { userId, status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.WAQF] } },
    {
      pencarianUsage: 1,
      tier: 1,
      status: 1,
      access: 1,
      billingCycle: 1,
      currentPeriodEnd: 1,
    },
  ).sort({ createdAt: -1 });

  if (!sub) {
    return c.json({
      tier:    SubscriptionTier.PENCARIAN,
      status:  SubscriptionStatus.WAQF,
      message: 'Selamat datang. Perjalanan kamu dibiayai oleh pengasas.',
    });
  }

  return c.json(sub);
});

router.get('/pencarian/usage', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;

  if (ENV.ADAM_FREEMIUM_ENABLED) {
    const limit = freeRollingLimit();
    const snap = await getRollingQuotaSnapshot(getTokenUser(c)!.userId, RollingQuotaBucket.FREE, limit);
    return c.json({
      totalMessagesUsed:  snap.questionsUsed,
      totalMessagesLimit: snap.limit,
      currentStage:       'KNOW',
      dateKey:            snap.windowStart.toISOString(),
      rollingLimit:       true,
      windowHours:        snap.windowHours,
      windowResetsAt:     snap.windowResetsAt.toISOString(),
    });
  }

  const usage = await getPencarianUsage(userId);

  if (!usage) {
    return c.json({ totalMessagesUsed: 0, totalMessagesLimit: 100, currentStage: 'KNOW' });
  }

  return c.json(usage);
});

router.post('/pencarian/check', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  const body   = await c.req.json() as {
    sessionId?:      string;
    messageContent?: string;
    sessionHistory?: string[];
  };

  const result = await checkPencarianLimit(
    userId,
    body.sessionId ?? '',
    body.messageContent ?? '',
    body.sessionHistory ?? [],
  );

  return c.json(result);
});

router.post('/pencarian/extend', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  const body   = await c.req.json() as {
    transactionId?: string;
    provider?:      PaymentProvider;
    amountPaid?:    number;
    currency?:      string;
  };

  const result = await purchasePencarianExtension(
    userId,
    body.transactionId ?? '',
    body.provider ?? PaymentProvider.MANUAL,
    body.amountPaid ?? 0,
    body.currency ?? 'MYR',
  );

  return c.json(result);
});

router.post('/pencarian/convert', requireAdamUser, async (c) => {
  await convertPencarianToPelajar(getTokenUser(c)!.userId);
  return c.json({ success: true, message: 'Selamat datang sebagai Pelajar Alamtologi.' });
});

router.post('/enterprise-inquiry', requireAdamUser, async (c) => {
  const body = await c.req.json() as {
    organisationName?: string;
    contactEmail?:     string;
    estimatedUsers?:   number;
    notes?:            string;
  };

  const access = {
    ...TIER_ACCESS[SubscriptionTier.ENTERPRISE],
    maxUsers: body.estimatedUsers ?? TIER_ACCESS[SubscriptionTier.ENTERPRISE].maxUsers,
  };

  await SubscriptionModel.create({
    userId:          getTokenUser(c)!.userId,
    founderId:       FOUNDER_SUBSCRIPTION_ID,
    tier:            SubscriptionTier.ENTERPRISE,
    status:          SubscriptionStatus.PENDING,
    billingCycle:    BillingCycle.ENTERPRISE,
    region:          detectRegionFromHeaders(c.req.raw.headers),
    currency:        'MYR',
    amountPerCycle:  0,
    provider:        PaymentProvider.MANUAL,
    access,
    enterpriseNotes: `Org: ${body.organisationName ?? ''} | Contact: ${body.contactEmail ?? ''} | Users: ${body.estimatedUsers ?? 0} | Notes: ${body.notes ?? ''}`,
    neverDelete:     true,
  });

  return c.json({
    received: true,
    message:  'Terima kasih. Pengasas akan menghubungi kamu secara peribadi.',
  });
});

router.get('/payment-config', (c) => {
  const region = detectRegionFromHeaders(c.req.raw.headers);
  return c.json({
    region,
    stripe: getStripeGatewayStatus(),
    regionalProvider: getProviderForRegion(region),
  });
});

router.get('/stripe/confirm', requireAdamUser, async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) {
    return c.json({ error: 'session_id is required.' }, 400);
  }

  try {
    const result = await confirmStripeCheckoutSession(sessionId, getTokenUser(c)!.userId);
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

router.get('/waqf-report', requireFounder, async (c) => {
  const report = await getWaqfReport();
  return c.json(report);
});

router.post('/webhooks/razorpay', handleRazorpayWebhook);
router.post('/webhooks/stripe',   handleStripeWebhook);
router.post('/webhooks/xendit',   handleXenditWebhook);
router.post('/webhooks/paystack', handlePaystackWebhook);

export default router;
