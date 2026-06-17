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
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getTokenUser,
  requireAdamUser,
  requireFounderOrPlatformAdmin,
} from '../../middleware/auth.middleware';
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
import { listTutorRegisterPricing } from '../../adam/tutor/adam-tutor-pricing.service';
import { getUsdMyrRate } from '../../adam/tutor/adam-usd-myr-rate.service';
import { TutorRegisterCodeModel } from '../../adam/tutor/adam-tutor-register-code.schema';
import {
  TutorAgentModel,
  TutorAgentStatus,
} from '../../adam/tutor/adam-tutor-agent.schema';
import {
  TutorEnrollmentModel,
  TutorEnrollmentStatus,
} from '../../adam/tutor/adam-tutor-enrollment.schema';
import {
  createTutorAgent,
  getTutorAgentPortalOverview,
  getTutorAgentWallet,
  listTutorAgentStudents,
  listTutorAgents,
  resolveTutorAgent,
} from '../../adam/tutor/adam-tutor-agent.service';
import { getTutorAgent, requireTutorAgent } from '../../adam/tutor/adam-tutor-agent-auth.middleware';

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
  count:      z.number().int().min(1).max(50).optional(),
  agentId:    z.string().min(8).max(64).optional(),
  agentLabel: z.string().min(2).max(120).optional(),
  notes:      z.string().max(500).optional(),
  preferred:  z.string().min(8).max(40).optional(),
});

const AdminCreateAgentSchema = z.object({
  orgName:           z.string().min(2).max(200),
  contactName:       z.string().min(2).max(120),
  email:             z.string().email().max(160),
  phone:             z.string().min(6).max(40).optional(),
  state:             z.string().min(2).max(80),
  commissionPercent: z.number().min(0).max(50).optional(),
  notes:             z.string().max(500).optional(),
});

const AgentLoginSchema = z.object({
  agentCode:   z.string().min(8).max(40),
  portalToken: z.string().min(16).max(128),
});

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
      message: 'Kod daftar disahkan. Teruskan ke bayaran.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kod daftar gagal.';
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
  const [
    available,
    locked,
    redeemed,
    revoked,
    pricing,
    fx,
    agentsActive,
    enrollCodeLocked,
    enrollPaid,
    enrollComplete,
    recentEnrollments,
  ] = await Promise.all([
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.AVAILABLE }),
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.LOCKED }),
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.REDEEMED }),
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.REVOKED }),
    listTutorRegisterPricing(),
    getUsdMyrRate(),
    TutorAgentModel.countDocuments({ status: TutorAgentStatus.ACTIVE }),
    TutorEnrollmentModel.countDocuments({ status: TutorEnrollmentStatus.CODE_LOCKED }),
    TutorEnrollmentModel.countDocuments({ status: TutorEnrollmentStatus.PAID }),
    TutorEnrollmentModel.countDocuments({ status: TutorEnrollmentStatus.COMPLETE }),
    TutorEnrollmentModel.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    {
      pricing,
      fx: {
        usdMyrRate: fx.rate,
        source:     fx.source,
        fetchedAt:  fx.fetchedAt,
        provider:   fx.provider,
      },
      stats: {
        available,
        locked,
        redeemed,
        revoked,
        total: available + locked + redeemed + revoked,
      },
      enrollments: {
        code_locked: enrollCodeLocked,
        paid:        enrollPaid,
        complete:    enrollComplete,
        total:       enrollCodeLocked + enrollPaid + enrollComplete,
      },
      agentsActive,
      recentEnrollments: recentEnrollments.map((row) => ({
        enrollmentId: row.enrollmentId,
        studentName:    row.studentName,
        schoolName:     row.schoolName,
        state:          row.state,
        band:           row.band,
        status:         row.status,
        agentLabel:     row.agentLabel,
        registerCode:   row.registerCode,
        updatedAt:      row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : String(row.updatedAt ?? ''),
      })),
      phase: 'MY',
    },
    timestamp: new Date().toISOString(),
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
      message: `${codes.length} kod daftar dijana.`,
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
  const agents = await listTutorAgents();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    {
      agents: agents.map((a) => ({
        agentId:           a.agentId,
        agentCode:         a.agentCode,
        orgName:           a.orgName,
        contactName:       a.contactName,
        email:             a.email,
        state:             a.state,
        commissionPercent: a.commissionPercent,
        walletBalanceMyr:  a.walletBalanceMyr,
        status:            a.status,
        createdAt:         a.createdAt,
      })),
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/admin/agents — founder create agent
router.post('/admin/agents', requireFounderOrPlatformAdmin, zValidator('json', AdminCreateAgentSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const founder = getTokenUser(c)!;
    const agent = await createTutorAgent({
      ...body,
      createdBy: founder.userId,
    });
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        agent: {
          agentId:           agent.agentId,
          agentCode:         agent.agentCode,
          portalToken:       agent.portalToken,
          orgName:           agent.orgName,
          contactName:       agent.contactName,
          email:             agent.email,
          state:             agent.state,
          commissionPercent: agent.commissionPercent,
          walletBalanceMyr:  agent.walletBalanceMyr,
        },
      },
      message: 'Ejen dicipta. Kongsi kod ejen + token portal untuk log masuk dashboard.',
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mencipta ejen.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/agent/portal/login
router.post('/agent/portal/login', zValidator('json', AgentLoginSchema), async (c) => {
  const { agentCode, portalToken } = c.req.valid('json');
  const agent = await resolveTutorAgent(agentCode, portalToken);
  if (!agent || agent.status !== 'active') {
    return c.json({ success: false, error: 'Kelayakan ejen tidak sah.', kernel: 'ALAMTOLOGI' }, 403);
  }
  const overview = await getTutorAgentPortalOverview(agent);
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
  const overview = await getTutorAgentPortalOverview(agent);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { overview },
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

export default router;
