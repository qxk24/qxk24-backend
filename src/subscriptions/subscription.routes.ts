/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
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
  getTutorPricing,
  listTutorLevelPricing,
  getConsumerProPricing,
  getConsumerPremiumPricing,
  consumerTierSavingsNote,
  ENTERPRISE_PRICING,
  TIER_ACCESS,
} from './tier-access.config';
import type { TutorSubscriptionLevel } from './subscription.schema';
import {
  SubscriptionModel,
  SubscriptionTier,
  BillingCycle,
  PaymentProvider,
  SubscriptionStatus,
  SupportedRegion,
  FOUNDER_SUBSCRIPTION_ID,
  resolveCheckoutTier,
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
import { grantFounderProfesionalBatch } from './founder-profesional-grant.service';
import {
  createFounderUnlimitedAccount,
  grantFounderUnlimitedBatch,
  listAdamAccountCategories,
} from './founder-unlimited-grant.service';
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
import { getPremiumCreditPacks, getPremiumCreditPacksForRegion, extraMessageCostCents } from '../freemium/adam-freemium-credit.service';
import { convertTutorUsdToRegionalFee } from '../adam/tutor/adam-tutor-fee-currency.service';
import { guestLifetimeLimit } from '../freemium/adam-freemium-guest.service';
import {
  consumerFreeDailyLimit,
  consumerProDailyLimit,
  isConsumerDailyPlan,
} from '../freemium/adam-freemium-consumer.service';

const router = new Hono();

router.get('/pricing', async (c) => {
  const region      = detectRegionFromHeaders(c.req.raw.headers);
  const pelajar     = getPelajarPricing(region);
  const profesional = getProfesionalPricing(region);
  const studio      = getStudioPricing(region);
  const stripe      = getStripeGatewayStatus();
  const paymentWired = ENV.STRIPE_ENABLED && stripe.enabled && stripe.configured;
  const consumerPlan = isConsumerDailyPlan();

  let myrRate: number | null = ENV.ADAM_USD_MYR_RATE > 0 ? ENV.ADAM_USD_MYR_RATE : null;
  if (region === SupportedRegion.MY) {
    try {
      const { getUsdMyrRate } = await import('../adam/tutor/adam-usd-myr-rate.service');
      const fx = await getUsdMyrRate();
      myrRate = fx.rate;
    } catch {
      /* PPP/env fallback inside getTutorPricing */
    }
  }

  const tutorTier = buildTutorPricingTier(paymentWired, region, myrRate);

  const consumerPro = consumerPlan ? getConsumerProPricing(region, myrRate) : null;
  const consumerPremium = consumerPlan ? getConsumerPremiumPricing(region, myrRate) : null;
  const consumerCreditPacks = consumerPlan
    ? getPremiumCreditPacksForRegion(region, myrRate)
    : [];
  const extraMsgRegional = convertTutorUsdToRegionalFee(
    extraMessageCostCents() / 100,
    region,
    myrRate,
  );

  return c.json({
    region,
    payment: {
      stripe,
      regionalProvider: getProviderForRegion(region),
      wired:            paymentWired,
      comingSoon:       !paymentWired,
    },
    consumerPlan: consumerPlan ? {
      freeDailyLimit:      consumerFreeDailyLimit(),
      proDailyLimit:       consumerProDailyLimit(),
      proMonthlyUsd:       consumerPro!.monthlyUsd,
      proAnnualUsd:        consumerPro!.annualUsd,
      premiumMonthlyUsd:   consumerPremium!.monthlyUsd,
      premiumAnnualUsd:    consumerPremium!.annualUsd,
      extraMessageCost:    extraMsgRegional.monthlyLocal,
      extraMessageCurrency: extraMsgRegional.currency,
      creditBundles:       consumerCreditPacks,
      timezone:            ENV.ADAM_FREEMIUM_TIMEZONE,
    } : null,
    freemium: ENV.ADAM_FREEMIUM_ENABLED ? {
      guestLifetimeLimit:    guestLifetimeLimit(),
      freeRollingLimit:      freeRollingLimit(),
      rollingWindowHours:    rollingWindowHours(),
      pelajarMonthlyLimit:   pelajarMonthlyLimit(),
      pelajarDailySoftLimit: pelajarDailySoftLimit(),
      profesionalRollingLimit: profesionalRollingLimit(),
      premiumTopUps:         getPremiumCreditPacks(),
      /** @deprecated Use freeRollingLimit */
      freeDailyLimit:        freeDailyLimit(),
    } : null,
    tiers: consumerPlan ? {
      basic: {
        label:         'Basic',
        monthlyAmount: 0,
        annualAmount:  0,
        currency:      'USD',
        description:   'Register free — 20 messages per day (Malaysia timezone).',
        messageLimit:  consumerFreeDailyLimit(),
        dailyLimit:    consumerFreeDailyLimit(),
        extensionFee:  pelajar.extensionFee,
      },
      pro: {
        label:            'Pro',
        monthlyAmount:      consumerPro!.monthly,
        annualAmount:     consumerPro!.annual,
        currency:         consumerPro!.currency,
        description:      '100 messages per day included. Add usage credits when you need more.',
        savingsNote:      consumerTierSavingsNote(consumerPro!),
        comingSoon:       !paymentWired,
        dailyLimit:       consumerProDailyLimit(),
        topUpPacks:       consumerCreditPacks,
        extraMessageCost: extraMsgRegional.monthlyLocal,
      },
      premium: {
        label:         'Premium',
        monthlyAmount: consumerPremium!.monthly,
        annualAmount:  consumerPremium!.annual,
        currency:      consumerPremium!.currency,
        description:   'Full relational memory, API access, publishing, and Builder mode.',
        savingsNote:   consumerTierSavingsNote(consumerPremium!),
        comingSoon:    !paymentWired,
        rollingLimit:  profesionalRollingLimit(),
        rollingWindowHours: rollingWindowHours(),
      },
      tutor: tutorTier,
    } : {
      basic: {
        label:         'Basic',
        monthlyAmount: 0,
        annualAmount:  0,
        currency:      'USD',
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
        topUpPacks:    ENV.ADAM_FREEMIUM_ENABLED ? getPremiumCreditPacks() : undefined,
      },
      profesional: {
        label:         'Profesional',
        monthlyAmount: profesional.monthly,
        annualAmount:  profesional.annual,
        currency:      profesional.currency,
        description:   'ADAM Consultant (all fields) + full memory, API, publishing, and Builder when you ship code.',
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
      tutor: tutorTier,
    },
  });
});

function buildTutorPricingTier(
  paymentWired: boolean,
  region: SupportedRegion,
  myrRate?: number | null,
) {
  const secondary = getTutorPricing('secondary', 'public', region, myrRate);
  return {
    label:         'ADAM Tutor',
    monthlyAmount: secondary.monthly,
    annualAmount:  0,
    currency:      secondary.currency,
    description:   'All academic subjects — priced by school level (monthly only).',
    monthlyOnly:   true,
    comingSoon:    !paymentWired,
    levels:        listTutorLevelPricing('public', region, myrRate),
  };
}

router.post('/create', requireAdamUser, async (c) => {
  const body = await c.req.json() as {
    tier?:         string;
    billingCycle?: BillingCycle;
    tutorLevel?:   TutorSubscriptionLevel;
  };

  if (!body.tier || !body.billingCycle) {
    return c.json({ error: 'tier and billingCycle are required.' }, 400);
  }

  const tier = resolveCheckoutTier(body.tier);
  if (!tier) {
    return c.json({ error: `Unknown tier: ${body.tier}` }, 400);
  }

  if (tier === SubscriptionTier.TUTOR && !body.tutorLevel) {
    return c.json({
      error: 'tutorLevel is required for ADAM Tutor (primary, secondary, or university).',
    }, 400);
  }

  if (tier === SubscriptionTier.BASIC) {
    return c.json({ error: 'Basic is free — register to chat, no payment required.' }, 400);
  }

  if (tier === SubscriptionTier.PRO && !isConsumerDailyPlan()) {
    return c.json({
      error: 'Pro is not open for new subscriptions on this deployment.',
    }, 403);
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
      tier,
      billingCycle: body.billingCycle,
      headers:      c.req.raw.headers,
      tutorLevel:   body.tutorLevel,
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
      tier:    SubscriptionTier.BASIC,
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
    message:  'Thank you. The Founder will contact you personally.',
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

/** GET /api/subscription/founder/categories — ADAM subscription + freemium quota categories. */
router.get('/founder/categories', requireFounder, (c) => {
  return c.json({
    success:    true,
    categories: listAdamAccountCategories(),
    kernel:     'ALAMTOLOGI',
  });
});

/** POST /api/subscription/founder/grant-unlimited — Founder waqf unlimited (all quota categories). */
router.post('/founder/grant-unlimited', requireFounder, async (c) => {
  const body = await c.req.json() as {
    identifiers?:  string[];
    userIds?:       string[];
    notes?:         string;
    tutorLevel?:    'primary' | 'secondary' | 'university';
    skipTutor?:     boolean;
    create?: {
      name:        string;
      password:    string;
      userId?:     string;
      email?:      string;
      accountRole?: 'student' | 'guru';
      accountLane?: 'umum' | 'pelajar';
    };
  };

  if (body.create?.name && body.create?.password) {
    const created = await createFounderUnlimitedAccount({
      name:        body.create.name,
      password:    body.create.password,
      userId:      body.create.userId,
      email:       body.create.email,
      notes:       body.notes,
      tutorLevel:  body.tutorLevel,
      skipTutor:   body.skipTutor,
      accountRole: body.create.accountRole,
      accountLane: body.create.accountLane,
    });
    return c.json({
      success: true,
      mode:    'create',
      result:  created,
      tier:    SubscriptionTier.ENTERPRISE,
      quota:   'unlimited',
      kernel:  'ALAMTOLOGI',
    }, 201);
  }

  const identifiers = [
    ...(body.identifiers ?? []),
    ...(body.userIds ?? []),
  ].map((s) => s.trim()).filter(Boolean);

  if (identifiers.length === 0) {
    return c.json({ error: 'identifiers, userIds, or create { name, password } required.' }, 400);
  }

  const results = await grantFounderUnlimitedBatch(identifiers, {
    notes:      body.notes,
    tutorLevel: body.tutorLevel,
    skipTutor:  body.skipTutor,
  });

  return c.json({
    success: results.some((r) => r.ok),
    mode:    'upgrade',
    results,
    tier:    SubscriptionTier.ENTERPRISE,
    quota:   'unlimited',
    kernel:  'ALAMTOLOGI',
  });
});

/** POST /api/subscription/founder/grant-profesional — Founder waqf upgrade (no Stripe). */
router.post('/founder/grant-profesional', requireFounder, async (c) => {
  const body = await c.req.json() as {
    identifiers?: string[];
    userIds?:      string[];
    notes?:        string;
    periodMonths?: number;
  };

  const identifiers = [
    ...(body.identifiers ?? []),
    ...(body.userIds ?? []),
  ].map((s) => s.trim()).filter(Boolean);

  if (identifiers.length === 0) {
    return c.json({ error: 'identifiers or userIds required.' }, 400);
  }

  const results = await grantFounderProfesionalBatch(identifiers, {
    notes:        body.notes,
    periodMonths: body.periodMonths,
  });

  return c.json({
    success: results.every((r) => r.ok),
    results,
    kernel:  'ALAMTOLOGI',
  });
});

router.post('/webhooks/razorpay', handleRazorpayWebhook);
router.post('/webhooks/stripe',   handleStripeWebhook);
router.post('/webhooks/xendit',   handleXenditWebhook);
router.post('/webhooks/paystack', handlePaystackWebhook);

export default router;
