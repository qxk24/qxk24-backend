/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getTokenUser,
  requireAdamUser,
  requireFounder,
} from '../../middleware/auth.middleware';
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';
import {
  streamADAMChat,
  resolveNiagaChatSession,
} from '../../adam/adam-chat.service';
import { getBusinessCoachPricing } from '../../subscriptions/tier-access.config';
import { getStripeGatewayStatus } from '../../subscriptions/stripe-gateway.service';
import { validateBusinessCoachPin, generateBusinessCoachPins, revokeBusinessCoachPin, listBusinessCoachPins } from '../../business-coach/business-coach-pin.service';
import {
  completeBusinessCoachEnrollmentProfile,
  getBusinessCoachEnrollmentCheckoutQuote,
  getBusinessCoachEnrollmentForUser,
  loadBusinessCoachDomainContext,
  loadBusinessCoachProfile,
  lockBusinessCoachEnrollmentPin,
  setBusinessCoachProfessionalDomain,
  startBusinessCoachPublicEnrollment,
} from '../../business-coach/business-coach-enrollment.service';
import { BUSINESS_COACH_PROFESSIONAL_DOMAINS } from '../../business-coach/business-coach-domains';
import {
  createBusinessCoachEnrollmentCheckoutSession,
  syncBusinessCoachPaymentFromSession,
} from '../../business-coach/business-coach-stripe.service';
import {
  requireBusinessCoachSubscription,
  getBusinessCoachSubscriptionAccess,
} from '../../business-coach/business-coach-auth.middleware';
import { resolveBusinessCoachSubscriptionAccess } from '../../business-coach/business-coach-subscription-access.service';
import { BusinessCoachPinStatus } from '../../business-coach/business-coach-pin.schema';

const router = new Hono();

const PinValidateSchema = z.object({
  registerCode: z.string().min(6).max(64),
});

const PinLockSchema = z.object({
  registerCode: z.string().min(6).max(64),
});

const ProfileSchema = z.object({
  professionalDomain: z.enum(BUSINESS_COACH_PROFESSIONAL_DOMAINS),
  businessName:       z.string().min(2).max(200).optional(),
  country:            z.string().min(2).max(120),
  businessFocus:      z.string().max(500).optional(),
  domainProfile:      z.record(z.unknown()).optional(),
});

const DomainSchema = z.object({
  professionalDomain: z.enum(BUSINESS_COACH_PROFESSIONAL_DOMAINS),
});

const GeneratePinsSchema = z.object({
  count:            z.number().int().min(1).max(500).default(10),
  preferred:        z.string().min(6).max(64).optional(),
  distributorLabel: z.string().max(120).optional(),
  notes:            z.string().max(500).optional(),
});

const RevokePinSchema = z.object({
  registerCode: z.string().min(6).max(64),
});

const ChatSchema = z.object({
  sessionId:   z.string().optional(),
  message:     z.string().max(12000).optional(),
  uploadIds:   z.array(z.string()).optional(),
  answerStyle: z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
});

function userId(c: { get: (k: string) => unknown }): string {
  return getTokenUser(c as never)!.userId;
}

// GET /api/adam/business-coach/pricing — public
router.get('/pricing', async (c) => {
  const stripe = getStripeGatewayStatus();
  const paymentWired = stripe.enabled && stripe.configured;
  const pub = getBusinessCoachPricing('public');
  const pin = getBusinessCoachPricing('pin');

  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data: {
      public: {
        label:         pub.label,
        monthlyAmount: pub.monthly,
        currency:      pub.currency,
        channel:       'public',
        comingSoon:    !paymentWired,
      },
      pin: {
        label:         pin.label,
        monthlyAmount: pin.monthly,
        currency:      pin.currency,
        channel:       'pin',
        comingSoon:    !paymentWired,
      },
      paymentWired,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/business-coach/register/code/validate — public
router.post('/register/code/validate', zValidator('json', PinValidateSchema), async (c) => {
  try {
    const { registerCode } = c.req.valid('json');
    const result = await validateBusinessCoachPin(registerCode);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/business-coach/access — auth
router.get('/access', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const access = await resolveBusinessCoachSubscriptionAccess(user);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    access,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/business-coach/register/me — auth
router.get('/register/me', requireAdamUser, async (c) => {
  try {
    const enrollment = await getBusinessCoachEnrollmentForUser(userId(c));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/business-coach/register/public/start — auth (USD35 public checkout)
router.post('/register/public/start', requireAdamUser, async (c) => {
  try {
    const enrollment = await startBusinessCoachPublicEnrollment(userId(c));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      success: false,
      error:   (err as Error).message,
      kernel:  'ALAMTOLOGI',
    }, 400);
  }
});

// POST /api/adam/business-coach/register/code/lock — auth
router.post('/register/code/lock', requireAdamUser, zValidator('json', PinLockSchema), async (c) => {
  try {
    const enrollment = await lockBusinessCoachEnrollmentPin(
      userId(c),
      c.req.valid('json').registerCode,
    );
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      success: false,
      error:   (err as Error).message,
      kernel:  'ALAMTOLOGI',
    }, 400);
  }
});

// POST /api/adam/business-coach/register/domain — auth
router.post('/register/domain', requireAdamUser, zValidator('json', DomainSchema), async (c) => {
  try {
    const enrollment = await setBusinessCoachProfessionalDomain(
      userId(c),
      c.req.valid('json').professionalDomain,
    );
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      success: false,
      error:   (err as Error).message,
      kernel:  'ALAMTOLOGI',
    }, 400);
  }
});

// POST /api/adam/business-coach/register/profile — auth
router.post('/register/profile', requireAdamUser, zValidator('json', ProfileSchema), async (c) => {
  try {
    const enrollment = await completeBusinessCoachEnrollmentProfile(userId(c), c.req.valid('json'));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      success: false,
      error:   (err as Error).message,
      kernel:  'ALAMTOLOGI',
    }, 400);
  }
});

// GET /api/adam/business-coach/register/quote — auth
router.get('/register/quote', requireAdamUser, async (c) => {
  try {
    const quote = await getBusinessCoachEnrollmentCheckoutQuote(userId(c));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { quote },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      success: false,
      error:   (err as Error).message,
      kernel:  'ALAMTOLOGI',
    }, 400);
  }
});

// POST /api/adam/business-coach/register/checkout — auth (public USD35 or PIN USD23)
router.post('/register/checkout', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const { resolveStudentEmail } = await import('../../adam/tutor/adam-tutor-register-stripe.service');
    const result = await createBusinessCoachEnrollmentCheckoutSession({
      userId:        user.userId,
      customerEmail: await resolveStudentEmail(user.userId),
    });
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({
      success: false,
      error:   (err as Error).message,
      kernel:  'ALAMTOLOGI',
    }, 400);
  }
});

// POST /api/adam/business-coach/register/sync-payment — auth
router.post('/register/sync-payment', requireAdamUser, async (c) => {
  try {
    const body = await c.req.json() as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const result = await syncBusinessCoachPaymentFromSession(userId(c), sessionId);
    return c.json({
      success: result.activated,
      kernel:  'ALAMTOLOGI',
      data:    result,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/business-coach/chat — SSE (NIAGA coaching mode)
router.post('/chat', requireBusinessCoachSubscription, zValidator('json', ChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await resolveNiagaChatSession(user.userId);

  const message = body.message?.trim() ?? '';
  const niagaProfile = await loadBusinessCoachProfile(user.userId);
  const domainContext = await loadBusinessCoachDomainContext(user.userId);

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          'NIAGA',
          async (event: string, data: string) => {
 try {   await s.write(`event: ${event}\ndata: ${data}\n\n`); 
 } catch (err) {
   console.error(err);
   throw err;
 }},
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        user.role === 'guru' ? 'guru' : 'student',
            sessionType: 'niaga',
          },
          { answerStyle: body.answerStyle, niagaProfile: niagaProfile ?? undefined,
            businessCoachDomain: domainContext ?? undefined },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM Business Coach stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

// GET /api/adam/business-coach/admin/pins — founder
router.get('/admin/pins', requireFounder, async (c) => {
  try {
    const statusRaw = c.req.query('status')?.trim();
    const status = statusRaw && Object.values(BusinessCoachPinStatus).includes(statusRaw as BusinessCoachPinStatus)
      ? statusRaw as BusinessCoachPinStatus
      : undefined;
    const pins = await listBusinessCoachPins({ status, limit: 300 });
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { pins },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/business-coach/admin/pins/generate — founder
router.post('/admin/pins/generate', requireFounder, zValidator('json', GeneratePinsSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const pins = await generateBusinessCoachPins({
      count:            body.count,
      createdBy:        userId(c),
      preferred:        body.preferred,
      distributorLabel: body.distributorLabel,
      notes:            body.notes,
    });
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        count: pins.length,
        pins:  pins.map((p: { registerCode: string; distributorLabel: string | null; status: string }) => ({
          registerCode:     p.registerCode,
          distributorLabel: p.distributorLabel,
          status:           p.status,
        })),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/business-coach/admin/pins/revoke — founder
router.post('/admin/pins/revoke', requireFounder, zValidator('json', RevokePinSchema), async (c) => {
  try {
    const ok = await revokeBusinessCoachPin(c.req.valid('json').registerCode);
    return c.json({
      success: ok,
      kernel:  'ALAMTOLOGI',
      data:    { revoked: ok },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
