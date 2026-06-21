/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Routes
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

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';
import {
  runLayerGatePreCheck,
  streamLayerGateBlockedTurn,
} from '../../adam-servers/adam-layer-gate.service';
import { streamADAMChat } from '../../adam/adam-chat.service';
import { agentMarketingTutorProfile } from '../../adam/tutor/adam-tutor-agent-marketing.constants';
import {
  agentDemoDisplayName,
  assertAgentDemoOwnsSession,
  createAgentDemoChatSession,
  listAgentDemoChatSessions,
  loadAgentDemoChatHistory,
  resolveAgentDemoChatSession,
} from '../../adam/tutor/adam-tutor-agent-demo-chat.service';
import {
  getTokenUser,
  requireAdamUser,
  requireFounderOrPlatformAdmin,
} from '../../middleware/auth.middleware';
import { buildTutorAdminDashboardOverview } from '../../adam/tutor/adam-tutor-admin-dashboard.service';
import { validateTutorRegisterCode } from '../../adam/tutor/adam-tutor-register-code.service';
import {
  generateTutorRegisterCodes,
  listTutorRegisterCodes,
  revokeTutorRegisterCode,
} from '../../adam/tutor/adam-tutor-register-code.service';
import { TutorRegisterCodeStatus } from '../../adam/tutor/adam-tutor-register-code.schema';
import {
  completeTutorEnrollmentProfile,
  getTutorEnrollmentCheckoutQuote,
  getTutorEnrollmentForUser,
  lockTutorEnrollmentCode,
  resolveTutorEnrollmentAccess,
} from '../../adam/tutor/adam-tutor-enrollment.service';
import {
  createTutorRegisterCheckoutSession,
  resolveStudentEmail,
  simulateTutorRegisterPayment,
  syncTutorPaymentFromSession,
} from '../../adam/tutor/adam-tutor-register-stripe.service';
import { getStripeGatewayStatus } from '../../subscriptions/stripe-gateway.service';
import { ENV } from '../../config/environments';
import { TutorAgentModel } from '../../adam/tutor/adam-tutor-agent.schema';
import { TutorAgentPackageStatus } from '../../adam/tutor/adam-tutor-agent-package.config';
import {
  sendTutorAgentPortalCredentialsEmail,
  rotateAndEmailTutorAgentPortalCredentials,
} from '../../adam/tutor/adam-tutor-agent-credentials-email.service';
import {
  ensureQaTestAgentPinsMinted,
  provisionTutorTestAgent,
} from '../../adam/tutor/adam-tutor-test-agent.service';
import {
  createTutorAgent,
  deleteTutorAgentByAdmin,
  getTutorAgentById,
  getTutorAgentPortalOverview,
  getTutorAgentWallet,
  listTutorAgentStudents,
  listTutorAgentsForAdmin,
  resolveTutorAgent,
} from '../../adam/tutor/adam-tutor-agent.service';
import { getTutorAgent, requireTutorAgent } from '../../adam/tutor/adam-tutor-agent-auth.middleware';
import { isValidTutorAgentLoginCode } from '../../adam/tutor/adam-tutor-agent-code';
import { MALAYSIA_STATES } from '../../adam/tutor/adam-tutor-agent-identity';
import {
  TUTOR_AGENT_PACKAGE_TIERS,
  listTutorAgentPackageCatalog,
  type TutorAgentPackageTier,
} from '../../adam/tutor/adam-tutor-agent-package.config';
import {
  activateTutorAgentPackage,
  requestTutorAgentPackage,
  serializeAgentPackage,
} from '../../adam/tutor/adam-tutor-agent-package.service';
import {
  createTutorAgentPackageCheckoutSession,
  simulateTutorAgentPackagePayment,
  syncTutorAgentPackageFromSession,
} from '../../adam/tutor/adam-tutor-agent-package-stripe.service';
import {
  listAgentAvailableRegisterCodes,
  sendTutorAgentPinInvite,
} from '../../adam/tutor/adam-tutor-agent-pin-invite.service';

const router = new Hono();

const CodeValidateSchema = z.object({
  registerCode: z.string().min(6).max(40),
});

const CodeLockSchema = z.object({
  registerCode: z.string().min(6).max(40),
});

const ProfileCompleteSchema = z.object({
  studentName: z.string().min(2).max(80),
  schoolName:  z.string().min(2).max(200),
  state:       z.string().min(2).max(80),
  yearLabel:   z.string().max(64).optional(),
  language:    z.enum([
    'malay', 'english', 'arabic', 'mandarin', 'tamil',
    'indonesian', 'spanish', 'french', 'other',
  ]).optional(),
  curriculum: z.enum([
    'national', 'kpm', 'cambridge', 'mixed', 'international', 'us', 'uk', 'other',
  ]).optional(),
});

const AdminGenerateSchema = z.object({
  band:       z.enum(['primary', 'secondary', 'university']),
  count:      z.number().int().min(1).max(30_000).optional(),
  agentId:    z.string().min(8).max(64).optional(),
  agentLabel: z.string().min(2).max(120).optional(),
  notes:      z.string().max(500).optional(),
  preferred:  z.string().min(8).max(40).optional(),
});

const MALAYSIA_STATE_ENUM = MALAYSIA_STATES as unknown as [string, ...string[]];

const AdminCreateAgentSchema = z.object({
  orgName:             z.string().min(2).max(200),
  contactName:         z.string().min(2).max(120),
  email:               z.string().email().max(160),
  phone:               z.string().min(9).max(40),
  icNumber:            z.string().min(11).max(20),
  taxId:               z.string().min(10).max(20),
  bankName:            z.string().min(2).max(80),
  bankAccountNumber:   z.string().min(8).max(20),
  bankAccountHolder:   z.string().min(3).max(120),
  addressLine1:        z.string().min(5).max(160),
  addressLine2:        z.string().max(160).optional(),
  postcode:            z.string().regex(/^\d{5}$/),
  city:                z.string().min(2).max(80),
  state:               z.enum(MALAYSIA_STATE_ENUM),
  band:                z.enum(['primary', 'secondary', 'university']),
  packageTier:         z.enum(TUTOR_AGENT_PACKAGE_TIERS),
  commissionPercent:   z.number().min(0).max(50).optional(),
  notes:               z.string().max(500).optional(),
});

const AdminTestAgentSchema = z.object({
  email:       z.string().email().max(200),
  orgName:     z.string().min(2).max(120).optional(),
  contactName: z.string().min(2).max(80).optional(),
  sendEmail:   z.boolean().optional(),
});

const AgentSelfRegisterSchema = AdminCreateAgentSchema.omit({
  commissionPercent: true,
  notes:             true,
});

const AgentPackageRequestSchema = z.object({
  band: z.enum(['primary', 'secondary', 'university']),
  tier: z.enum(TUTOR_AGENT_PACKAGE_TIERS),
});

const AdminActivatePackageSchema = z.object({
  band: z.enum(['primary', 'secondary', 'university']),
  tier: z.enum(TUTOR_AGENT_PACKAGE_TIERS),
});

const AgentLoginSchema = z.object({
  agentCode: z.string().trim().min(7).max(41).refine(
    isValidTutorAgentLoginCode,
    { message: 'Invalid agen code format.' },
  ),
  portalToken: z.string().min(16).max(128),
});

const AgentPinEmailSchema = z.object({
  registerCode: z.string().min(6).max(40),
  studentEmail: z.string().email().max(200),
  studentName:  z.string().max(80).optional(),
});

const AgentRegisterCompleteSchema = z.object({
  sessionId: z.string().min(8).max(200),
});

const AgentDemoChatSchema = z.object({
  sessionId: z.string().optional(),
  message:   z.string().max(100_000).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0,
  { message: 'Provide a message.' },
);

const AdminListSchema = z.object({
  band:   z.enum(['primary', 'secondary', 'university']).optional(),
  status: z.enum(['available', 'locked', 'redeemed', 'revoked']).optional(),
  limit:  z.coerce.number().int().min(1).max(500).optional(),
});

function userId(c: { get: (key: string) => unknown }): string {
  const user = getTokenUser(c as Parameters<typeof getTokenUser>[0]);
  if (!user?.userId) throw new Error('User ID missing from token.');
  return user.userId;
}

// POST /api/adam/tutor/agent/register — public self-registration → Stripe checkout
router.post('/agent/register', zValidator('json', AgentSelfRegisterSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const existing = await TutorAgentModel.findOne({ email: body.email.trim().toLowerCase() });
    if (existing) {
      return c.json({
        success: false,
        error:   'Email already registered. Sign in at the agen portal if you already have credentials.',
        kernel:  'ALAMTOLOGI',
      }, 409);
    }

    const agent = await createTutorAgent({
      ...body,
      createdBy: 'agent-self-register',
    });

    const stripe = getStripeGatewayStatus();
    const registerCheckoutPaths = {
      successPath: '/adam/tutor/agen/daftar/complete?session_id={CHECKOUT_SESSION_ID}',
      cancelPath:  '/adam/tutor/agen/daftar?cancelled=1',
    };

    if (!stripe.configured && ENV.NODE_ENV !== 'production') {
      const updated = await simulateTutorAgentPackagePayment(agent, {
        band: body.band,
        tier: body.packageTier,
      });
      const mail = await sendTutorAgentPortalCredentialsEmail(updated);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    {
          simulated:   true,
          orgName:       updated.orgName,
          agentCode:     updated.agentCode,
          portalToken:   updated.portalToken,
          pinBalance:    updated.pinBalance,
          packageStatus: updated.packageStatus,
          credentialsEmailSent: mail.sent,
          message:       mail.sent
            ? 'Package activated (dev simulation). Credentials emailed and shown below.'
            : 'Package activated (dev simulation). Save your agen code and portal token below.',
        },
        timestamp: new Date().toISOString(),
      }, 201);
    }

    const checkout = await createTutorAgentPackageCheckoutSession(agent, registerCheckoutPaths);

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        orgName:     agent.orgName,
        checkoutUrl: checkout.checkoutUrl,
        totalMyr:    checkout.totalMyr,
        pinCount:    checkout.pinCount,
        message:     'Continue to payment. Your agen code and portal token are issued after successful payment.',
      },
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Agen registration failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/agent/register/complete — public; reveal credentials after Stripe payment
router.post('/agent/register/complete', zValidator('json', AgentRegisterCompleteSchema), async (c) => {
  try {
    const { sessionId } = c.req.valid('json');
    if (!ENV.STRIPE_SECRET_KEY) {
      return c.json({
        success: false,
        error:   'Payment verification is not configured.',
        kernel:  'ALAMTOLOGI',
      }, 503);
    }

    const session = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
    }).then((r) => r.json() as Promise<Record<string, unknown>>);

    const meta = session.metadata as Record<string, string> | undefined;
    if (meta?.checkoutType !== 'tutor_agent_package' || !meta.agentId) {
      return c.json({ success: false, error: 'Invalid checkout session.', kernel: 'ALAMTOLOGI' }, 400);
    }

    if (session.payment_status !== 'paid') {
      return c.json({ success: false, error: 'Payment not completed yet.', kernel: 'ALAMTOLOGI' }, 402);
    }

    await syncTutorAgentPackageFromSession(meta.agentId, sessionId);

    const agent = await TutorAgentModel.findOne({ agentId: meta.agentId });
    if (!agent || agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
      return c.json({ success: false, error: 'Package activation failed.', kernel: 'ALAMTOLOGI' }, 400);
    }

    const mail = await sendTutorAgentPortalCredentialsEmail(agent);

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        orgName:       agent.orgName,
        agentCode:     agent.agentCode,
        portalToken:   agent.portalToken,
        pinBalance:    agent.pinBalance,
        packageStatus: agent.packageStatus,
        credentialsEmailSent: mail.sent,
        message:       mail.sent
          ? `Payment successful. Credentials emailed to ${mail.email}. Copy them below as backup.`
          : 'Payment successful. Save your agen code and portal token — they are shown once.',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to complete registration.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/register/code/validate — public; no fee disclosed
router.post('/register/code/validate', zValidator('json', CodeValidateSchema), async (c) => {
  const { registerCode } = c.req.valid('json');
  const result = await validateTutorRegisterCode(registerCode);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    result,
    phase:   'MY',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/register/access — auth; enrollment gate for /adam/tutor
router.get('/register/access', requireAdamUser, async (c) => {
  const uid = userId(c);
  const access = await resolveTutorEnrollmentAccess(uid);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    access,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/register/me — auth
router.get('/register/me', requireAdamUser, async (c) => {
  const enrollment = await getTutorEnrollmentForUser(userId(c));
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { enrollment },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/register/code/lock — auth; lock kod to student
router.post('/register/code/lock', requireAdamUser, zValidator('json', CodeLockSchema), async (c) => {
  try {
    const { registerCode } = c.req.valid('json');
    const enrollment = await lockTutorEnrollmentCode(userId(c), registerCode);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      message: 'PIN disahkan. Teruskan ke bayaran.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PIN gagal.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tutor/register/checkout-quote — auth; fee only after kod locked
router.get('/register/checkout-quote', requireAdamUser, async (c) => {
  try {
    const quote = await getTutorEnrollmentCheckoutQuote(userId(c));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    quote,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quote unavailable.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/register/checkout — auth
router.post('/register/checkout', requireAdamUser, async (c) => {
  try {
    const uid = userId(c);
    const email = await resolveStudentEmail(uid);
    const stripe = getStripeGatewayStatus();

    if (!stripe.configured && ENV.NODE_ENV !== 'production') {
      await simulateTutorRegisterPayment(uid);
      const enrollment = await getTutorEnrollmentForUser(uid);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { simulated: true, enrollment },
        message: 'Bayaran simulasi (dev). Sila isi borang pendaftaran.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await createTutorRegisterCheckoutSession({
      userId:        uid,
      customerEmail: email,
    });

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/register/sync-payment — auth; after Stripe return
router.post('/register/sync-payment', requireAdamUser, async (c) => {
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  const ok = await syncTutorPaymentFromSession(userId(c), sessionId);
  const enrollment = await getTutorEnrollmentForUser(userId(c));

  return c.json({
    success: ok,
    kernel:  'ALAMTOLOGI',
    data:    { paid: ok, enrollment },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/register/complete — auth; profile form after paid
router.post('/register/complete', requireAdamUser, zValidator('json', ProfileCompleteSchema), async (c) => {
  try {
    const enrollment = await completeTutorEnrollmentProfile(userId(c), c.req.valid('json'));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      message: 'Pendaftaran ADAM Tutor lengkap. Selamat belajar!',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Borang pendaftaran gagal.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tutor/admin/overview — founder dashboard stats + pricing
router.get('/admin/overview', requireFounderOrPlatformAdmin, async (c) => {
  const data = await buildTutorAdminDashboardOverview();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    {
      ...data,
      agentsActive: data.agents.active,
    },
    timestamp: data.generatedAt,
  });
});

// GET /api/adam/tutor/admin/codes — founder
router.get('/admin/codes', requireFounderOrPlatformAdmin, async (c) => {
  const query = c.req.query();
  const parsed = AdminListSchema.safeParse(query);
  const filters = parsed.success
    ? {
        band:   parsed.data.band,
        status: parsed.data.status as TutorRegisterCodeStatus | undefined,
        limit:  parsed.data.limit,
      }
    : {};
  const codes = await listTutorRegisterCodes(filters);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { codes },
    count:   codes.length,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/admin/codes/generate — founder
router.post('/admin/codes/generate', requireFounderOrPlatformAdmin, zValidator('json', AdminGenerateSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const founder = getTokenUser(c)!;
    const codes = await generateTutorRegisterCodes({
      band:       body.band,
      count:      body.count ?? 1,
      agentId:    body.agentId,
      agentLabel: body.agentLabel,
      notes:      body.notes,
      preferred:  body.preferred,
      createdBy:  founder.userId,
    });

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        codes: codes.map((doc) => ({
          codeId:       doc.codeId,
          registerCode: doc.registerCode,
          band:         doc.band,
          agentId:      doc.agentId,
          agentLabel:   doc.agentLabel,
          status:       doc.status,
          createdAt:    doc.createdAt,
        })),
      },
      message: `${codes.length} PIN dijana.`,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menjana kod.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/admin/codes/revoke — founder
router.post('/admin/codes/revoke', requireFounderOrPlatformAdmin, zValidator('json', CodeValidateSchema), async (c) => {
  const { registerCode } = c.req.valid('json');
  const ok = await revokeTutorRegisterCode(registerCode);
  return c.json({
    success: ok,
    kernel:  'ALAMTOLOGI',
    message: ok ? 'Kod dibatalkan.' : 'Kod tidak dijumpai atau sudah digunakan.',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/admin/agents — founder
router.get('/admin/agents', requireFounderOrPlatformAdmin, async (c) => {
  const agents = await listTutorAgentsForAdmin();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { agents },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/admin/agents — disabled; agen self-register at /adam/tutor/agen/daftar
router.post('/admin/agents', requireFounderOrPlatformAdmin, async (c) => {
  return c.json({
    success: false,
    error:   'Admin cannot create agen accounts. Agen register and pay at /adam/tutor/agen/daftar.',
    kernel:  'ALAMTOLOGI',
  }, 403);
});

// POST /api/adam/tutor/admin/agents/:agentId/activate-package — founder marks package paid
router.post(
  '/admin/agents/:agentId/activate-package',
  requireFounderOrPlatformAdmin,
  zValidator('json', AdminActivatePackageSchema),
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const agentId = c.req.param('agentId');
      const body = c.req.valid('json');
      const agent = await activateTutorAgentPackage(agentId, {
        band:        body.band,
        tier:        body.tier,
        activatedBy: founder.userId,
      });
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { agent: { agentId: agent.agentId, ...serializeAgentPackage(agent) } },
        message: `Pakej ${body.tier} diaktifkan — ${agent.pinBalance} PIN tersedia.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengaktifkan pakej.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/agents/test-account — create or refresh QA test agen
router.post(
  '/admin/agents/test-account',
  requireFounderOrPlatformAdmin,
  zValidator('json', AdminTestAgentSchema),
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const body = c.req.valid('json');
      const result = await provisionTutorTestAgent({
        email:       body.email,
        orgName:     body.orgName,
        contactName: body.contactName,
        activatedBy: founder.userId,
        sendEmail:   body.sendEmail,
      });
      const action = result.created ? 'created' : 'refreshed';
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    result,
        message: result.credentialsEmailSent
          ? `QA test agen ${action}. Credentials emailed to ${result.email}.`
          : `QA test agen ${action}. Copy credentials below — email was not sent.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to provision QA test agen.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/agents/:agentId/send-credentials — email portal token (resets token)
router.post(
  '/admin/agents/:agentId/send-credentials',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const agentId = c.req.param('agentId');
      if (!agentId) {
        return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
      }
      const agent = await getTutorAgentById(agentId);
      if (!agent) {
        return c.json({ success: false, error: 'Agen not found.', kernel: 'ALAMTOLOGI' }, 404);
      }

      const result = await rotateAndEmailTutorAgentPortalCredentials(agent);

      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    {
          agentId:   result.agent.agentId,
          agentCode: result.agent.agentCode,
          email:     result.email,
        },
        message: `Portal credentials emailed to ${result.email}. Previous portal token no longer works.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to email portal credentials.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/adam/tutor/admin/agents/:agentId/students — founder
router.get('/admin/agents/:agentId/students', requireFounderOrPlatformAdmin, async (c) => {
  const agentId = c.req.param('agentId');
  if (!agentId) {
    return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
  }
  const agent = await getTutorAgentById(agentId);
  if (!agent) {
    return c.json({ success: false, error: 'Agen not found.', kernel: 'ALAMTOLOGI' }, 404);
  }
  const students = await listTutorAgentStudents(agentId);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { students, total: students.length },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/admin/agents/:agentId/wallet — founder
router.get('/admin/agents/:agentId/wallet', requireFounderOrPlatformAdmin, async (c) => {
  const agentId = c.req.param('agentId');
  if (!agentId) {
    return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
  }
  const wallet = await getTutorAgentWallet(agentId);
  if (!wallet) {
    return c.json({ success: false, error: 'Agen not found.', kernel: 'ALAMTOLOGI' }, 404);
  }
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { wallet },
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/adam/tutor/admin/agents/:agentId — founder removes agen (no students / redeemed PINs)
router.delete('/admin/agents/:agentId', requireFounderOrPlatformAdmin, async (c) => {
  const agentId = c.req.param('agentId');
  if (!agentId) {
    return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    const result = await deleteTutorAgentByAdmin(agentId);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      message: `Agen ${result.orgName} (${result.agentCode}) telah dipadam.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam agen.';
    const status = msg.includes('tidak dijumpai') ? 404 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

// POST /api/adam/tutor/agent/portal/login
router.post('/agent/portal/login', zValidator('json', AgentLoginSchema), async (c) => {
  const { agentCode, portalToken } = c.req.valid('json');
  const agent = await resolveTutorAgent(agentCode, portalToken);
  if (!agent || agent.status !== 'active') {
    return c.json({ success: false, error: 'Invalid agen credentials.', kernel: 'ALAMTOLOGI' }, 403);
  }
  const ready = await ensureQaTestAgentPinsMinted(agent, 'portal:auto-mint');
  const overview = await getTutorAgentPortalOverview(ready);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { overview, orgName: agent.orgName },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/overview
router.get('/agent/portal/overview', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const ready = await ensureQaTestAgentPinsMinted(agent, 'portal:auto-mint');
  const overview = await getTutorAgentPortalOverview(ready);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { overview },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/packages — full catalog (all bands)
router.get('/agent/portal/packages', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    {
      catalog: listTutorAgentPackageCatalog(),
      agent:   serializeAgentPackage(agent),
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/agent/portal/package/request — agent selects band + tier (pending payment)
router.post(
  '/agent/portal/package/request',
  requireTutorAgent,
  zValidator('json', AgentPackageRequestSchema),
  async (c) => {
    try {
      const agent = getTutorAgent(c)!;
      const body = c.req.valid('json');
      const updated = await requestTutorAgentPackage(agent, {
        band: body.band,
        tier: body.tier,
      });
      const quote = serializeAgentPackage(updated).packageQuote;
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { agent: serializeAgentPackage(updated), quote },
        message: `Pakej ${quote?.tierLabel ?? body.tier} dipilih — RM${quote?.totalMyr.toFixed(2) ?? '?'}. Teruskan bayaran Stripe.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memilih pakej.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/agent/portal/package/checkout — Stripe MYR one-time
router.post('/agent/portal/package/checkout', requireTutorAgent, async (c) => {
  try {
    const agent = getTutorAgent(c)!;
    const stripe = getStripeGatewayStatus();

    if (!agent.band || !agent.packageTier) {
      return c.json({
        success: false,
        error:   'Pilih pakej (kategori + tier) dahulu.',
        kernel:  'ALAMTOLOGI',
      }, 400);
    }

    if (!stripe.configured && ENV.NODE_ENV !== 'production') {
      const updated = await simulateTutorAgentPackagePayment(agent, {
        band: agent.band,
        tier: agent.packageTier as TutorAgentPackageTier,
      });
      const overview = await getTutorAgentPortalOverview(updated);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { simulated: true, overview, agent: serializeAgentPackage(updated) },
        message: 'Bayaran pakej simulasi (dev). PIN telah dikredit.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await createTutorAgentPackageCheckoutSession(agent);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout gagal.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/agent/portal/package/sync-payment — after Stripe return
router.post('/agent/portal/package/sync-payment', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  const ok = await syncTutorAgentPackageFromSession(agent.agentId, sessionId);
  const refreshed = await getTutorAgentById(agent.agentId);
  const overview = await getTutorAgentPortalOverview(refreshed ?? agent);

  return c.json({
    success: ok,
    kernel:  'ALAMTOLOGI',
    data:    { paid: ok, overview },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/students
router.get('/agent/portal/students', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const students = await listTutorAgentStudents(agent.agentId);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { students, total: students.length },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/wallet
router.get('/agent/portal/wallet', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const wallet = await getTutorAgentWallet(agent.agentId);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { wallet },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/codes — available PINs for email invite
router.get('/agent/portal/codes', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const ready = await ensureQaTestAgentPinsMinted(agent, 'portal:auto-mint');
  const codes = await listAgentAvailableRegisterCodes(ready.agentId);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { codes, total: codes.length },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/agent/portal/codes/send-email — email PIN to student
router.post(
  '/agent/portal/codes/send-email',
  requireTutorAgent,
  zValidator('json', AgentPinEmailSchema),
  async (c) => {
    try {
      const agent = getTutorAgent(c)!;
      const body = c.req.valid('json');
      const result = await sendTutorAgentPinInvite(agent, body);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    result,
        message: `PIN emailed to ${result.studentEmail}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send PIN email.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/agent/portal/demo/chat/sessions — new demo thread
router.post('/agent/portal/demo/chat/sessions', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const sessionId = await createAgentDemoChatSession(agent);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { sessionId },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/demo/chat/sessions
router.get('/agent/portal/demo/chat/sessions', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const sessions = await listAgentDemoChatSessions(agent);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { sessions },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/portal/demo/chat/history/:sessionId
router.get('/agent/portal/demo/chat/history/:sessionId', requireTutorAgent, async (c) => {
  const agent = getTutorAgent(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  try {
    const messages = await loadAgentDemoChatHistory(agent, sessionId);
    return c.json({ success: true, kernel: 'ALAMTOLOGI', data: { messages, sessionId } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'History unavailable.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 403);
  }
});

// POST /api/adam/tutor/agent/portal/demo/chat — SSE; unlimited all-band tutor demo
router.post('/agent/portal/demo/chat', requireTutorAgent, zValidator('json', AgentDemoChatSchema), async (c) => {
  const agent = getTutorAgent(c)!;
  const body = c.req.valid('json');
  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await resolveAgentDemoChatSession(agent);

  const message = body.message?.trim() ?? '';
  const displayName = agentDemoDisplayName(agent);
  const tutorProfile = agentMarketingTutorProfile();

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      if (message) {
        const layerGate = await runLayerGatePreCheck({
          userId:    agent.agentId,
          message,
          mode:      'TUTOR',
          isFounder: false,
          userName:  displayName,
        });
        if (!layerGate.allowed) {
          await streamLayerGateBlockedTurn(s, sessionId!, layerGate);
          return;
        }
      }

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          'TUTOR',
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          [],
          {
            userId:      agent.agentId,
            userName:    displayName,
            role:        'student',
            sessionType: 'tutor',
          },
          { tutorProfile },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

export default router;
