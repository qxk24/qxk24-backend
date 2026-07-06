/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  requireAdamUser,
  getTokenUser,
} from '../../middleware/auth.middleware';
import { rejectToolsLaneOnly } from '../../middleware/subscription-guard.middleware';
import { requirePlatformAdminModule } from '../../middleware/platform-admin.middleware';
import { NIAGA_ENTITY_TYPES, NiagaApplicationStatus } from '../../niaga/niaga.types';
import {
  approveNiagaPartnerApplication,
  getNiagaAdminOverview,
  listNiagaPartnerApplications,
  listNiagaPartnerLicenses,
  rejectNiagaPartnerApplication,
  submitNiagaPartnerApplication,
  suspendNiagaPartnerLicense,
} from '../../niaga/niaga-partner-application.service';
import {
  submitNiagaTraderRegistration,
  validateNiagaChannelCode,
  listNiagaTraders,
  getNiagaTraderByUser,
} from '../../niaga/niaga-trader.service';
import { createNiagaSeatCheckoutSession } from '../../niaga/niaga-stripe.service';
import { listNiagaPaymentLedger } from '../../niaga/niaga-payment-ledger.service';
import {
  getNiagaPartnerPortalOverview,
  listNiagaPartnerPendingTraders,
  listNiagaPartnerTraders,
  partnerApproveNiagaTrader,
  partnerRejectNiagaTrader,
  resolveNiagaPartnerLicense,
} from '../../niaga/niaga-partner-portal.service';
import {
  requireNiagaPartner,
  requireNiagaSubscription,
  getNiagaPartnerLicense,
  getNiagaSubscriptionAccess,
} from '../../niaga/niaga-partner-auth.middleware';
import { NIAGA_SKU_SEAT, NIAGA_SKU_SEAT_ANN } from '../../niaga/niaga.constants';
import {
  streamADAMChat,
  loadMessageHistory,
  resolveNiagaChatSession,
  assertCanClearSessionChat,
  clearSessionChatHistory,
  createNewChatSession,
  listUserChatSessions,
  renameUserChatSession,
  deleteUserChatSession,
} from '../../adam/adam-chat.service';
import { assertStudentOwnsSession } from '../../adam/adam-workspace.service';
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';
import { SessionTitleSchema } from '../adam/student/adam-student.schemas';
import { resolveNiagaSubscriptionAccess } from '../../niaga/niaga-subscription-access.service';
import { loadNiagaBusinessProfile, resolveNiagaSubscriptionId } from '../../niaga/niaga-business-context.service';
import { recordNiagaChatMessage } from '../../niaga/niaga-usage.service';
import {
  exportNiagaAdminLedgerCsv,
  exportNiagaCommissionCsv,
} from '../../niaga/niaga-commission-export.service';
import {
  buildNiagaCashflowTemplate,
  type NiagaCashflowFormat,
} from '../../niaga/niaga-cashflow-template.service';

const router = new Hono();

/** Tools-lane free accounts cannot use Niaga trader/chat APIs. */
router.use('/trader/*', requireAdamUser, rejectToolsLaneOnly);
router.use('/chat/*', requireAdamUser, rejectToolsLaneOnly);

const ApplySchema = z.object({
  applicationId:  z.string().min(8).max(64).optional(),
  entityType:     z.enum(NIAGA_ENTITY_TYPES),
  orgName:        z.string().min(2).max(200),
  contactName:    z.string().min(2).max(120),
  email:          z.string().email().max(160),
  phone:          z.string().min(6).max(40),
  state:          z.string().min(2).max(80),
  memberCount:    z.number().int().min(1).optional(),
  programSummary: z.string().min(40).max(4000),
  locale:         z.string().min(2).max(8).optional(),
});

const RejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

const ApproveSchema = z.object({
  channelCode: z.string().min(6).max(40).optional(),
  parentCode:  z.string().min(6).max(40).optional(),
  companyTier: z.enum(['B', 'C']).optional(),
  notes:       z.string().max(1000).optional(),
});

const SuspendSchema = z.object({
  channelCode: z.string().min(6).max(40),
});

const requireNiagaAdmin = requirePlatformAdminModule('niaga');

const TraderRegisterSchema = z.object({
  channelCode:   z.string().min(6).max(40),
  businessName:  z.string().min(2).max(200),
  businessType:  z.string().min(2).max(120),
  state:         z.string().min(2).max(80),
  businessBrief: z.string().max(2000).optional(),
});

const ChannelValidateSchema = z.object({
  channelCode: z.string().min(6).max(40),
});

const CheckoutSchema = z.object({
  registrationId: z.string().min(8).max(64),
  sku:            z.enum([NIAGA_SKU_SEAT, NIAGA_SKU_SEAT_ANN]).optional(),
});

const PartnerLoginSchema = z.object({
  channelCode: z.string().min(6).max(40),
  portalToken: z.string().min(16).max(128),
});

const PartnerRejectTraderSchema = z.object({
  reason: z.string().max(500).optional(),
});

const NiagaChatSchema = z.object({
  sessionId:   z.string().optional(),
  message:     z.string().max(100_000).optional(),
  answerStyle: z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:   z.array(z.string().min(1)).max(5).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

function reviewerId(c: { get: (key: string) => unknown }): string | undefined {
  const user = getTokenUser(c as Parameters<typeof getTokenUser>[0]);
  return user?.userId ?? user?.name ?? undefined;
}

function userId(c: { get: (key: string) => unknown }): string {
  const user = getTokenUser(c as Parameters<typeof getTokenUser>[0]);
  if (!user?.userId) throw new Error('User ID missing from token.');
  return user.userId;
}

// POST /api/niaga/partner/apply — public partner license application
router.post('/partner/apply', zValidator('json', ApplySchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await submitNiagaPartnerApplication(body);
    return c.json({
      success:       true,
      applicationId: result.applicationId,
      status:        result.status,
      kernel:        'ALAMTOLOGI',
      operator:        'QIUBBX Technologies (M) Sdn Bhd',
      message:         'Application received. QIUBBX will review your channel license request.',
      timestamp:     new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Application failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/niaga/channel/validate — public channel code lookup
router.post('/channel/validate', zValidator('json', ChannelValidateSchema), async (c) => {
  const { channelCode } = c.req.valid('json');
  const result = await validateNiagaChannelCode(channelCode);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    result,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/niaga/trader/register — authenticated trader registration
router.post('/trader/register', requireAdamUser, zValidator('json', TraderRegisterSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await submitNiagaTraderRegistration({
      ...body,
      userId: userId(c),
    });
    return c.json({
      success:        true,
      kernel:         'ALAMTOLOGI',
      registrationId: result.registrationId,
      status:         result.status,
      message:        'Registration submitted. Your channel partner will review it.',
      timestamp:      new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/niaga/trader/me — current user's trader registration
router.get('/trader/me', requireAdamUser, async (c) => {
  const reg = await getNiagaTraderByUser(userId(c));
  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    data:      { registration: reg },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/niaga/trader/checkout — Stripe checkout for approved trader
router.post('/trader/checkout', requireAdamUser, zValidator('json', CheckoutSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createNiagaSeatCheckoutSession({
      userId:         userId(c),
      customerEmail:  undefined,
      registrationId: body.registrationId,
      sku:            body.sku,
    });
    return c.json({
      success:        true,
      kernel:         'ALAMTOLOGI',
      checkoutUrl:    result.checkoutUrl,
      sessionId:      result.sessionId,
      subscriptionId: result.subscriptionId,
      timestamp:      new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/niaga/partner/portal/login — validate partner credentials
router.post('/partner/portal/login', zValidator('json', PartnerLoginSchema), async (c) => {
  const { channelCode, portalToken } = c.req.valid('json');
  const license = await resolveNiagaPartnerLicense(channelCode, portalToken);
  if (!license || license.status !== 'active') {
    return c.json({ success: false, error: 'Invalid credentials.', kernel: 'ALAMTOLOGI' }, 403);
  }
  const overview = await getNiagaPartnerPortalOverview(license);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { overview, orgName: license.orgName },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/partner/portal/overview
router.get('/partner/portal/overview', requireNiagaPartner, async (c) => {
  const license = getNiagaPartnerLicense(c)!;
  const overview = await getNiagaPartnerPortalOverview(license);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    overview,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/partner/portal/traders/pending
router.get('/partner/portal/traders/pending', requireNiagaPartner, async (c) => {
  const license = getNiagaPartnerLicense(c)!;
  const traders = await listNiagaPartnerPendingTraders(license.channelCode);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { traders, total: traders.length },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/partner/portal/traders
router.get('/partner/portal/traders', requireNiagaPartner, async (c) => {
  const license = getNiagaPartnerLicense(c)!;
  const traders = await listNiagaPartnerTraders(license.channelCode);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { traders, total: traders.length },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/niaga/partner/portal/traders/:registrationId/approve
router.post('/partner/portal/traders/:registrationId/approve', requireNiagaPartner, async (c) => {
  const license = getNiagaPartnerLicense(c)!;
  const registrationId = c.req.param('registrationId') ?? '';
  try {
    await partnerApproveNiagaTrader(license.channelCode, registrationId);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      message:   'Trader approved. They can now pay RM49.90 to activate.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Approval failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/niaga/partner/portal/traders/:registrationId/reject
router.post(
  '/partner/portal/traders/:registrationId/reject',
  requireNiagaPartner,
  zValidator('json', PartnerRejectTraderSchema),
  async (c) => {
    const license = getNiagaPartnerLicense(c)!;
    const registrationId = c.req.param('registrationId') ?? '';
    const { reason } = c.req.valid('json');
    try {
      await partnerRejectNiagaTrader(license.channelCode, registrationId, reason);
      return c.json({
        success:   true,
        kernel:    'ALAMTOLOGI',
        message:   'Trader registration rejected.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reject failed.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/niaga/admin/overview — QIUBBX Niaga module console
router.get('/admin/overview', requireNiagaAdmin, async (c) => {
  const overview = await getNiagaAdminOverview();
  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    operator:  'QIUBBX Technologies (M) Sdn Bhd',
    data:      overview,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/admin/applications
router.get('/admin/applications', requireNiagaAdmin, async (c) => {
  const statusParam = c.req.query('status');
  const status = statusParam && Object.values(NiagaApplicationStatus).includes(statusParam as NiagaApplicationStatus)
    ? (statusParam as NiagaApplicationStatus)
    : undefined;

  const [applications, overview] = await Promise.all([
    listNiagaPartnerApplications(status),
    getNiagaAdminOverview(),
  ]);

  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    data:      { applications, overview },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/admin/licenses
router.get('/admin/licenses', requireNiagaAdmin, async (c) => {
  const licenses = await listNiagaPartnerLicenses();
  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    data:      { licenses, total: licenses.length },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/admin/traders
router.get('/admin/traders', requireNiagaAdmin, async (c) => {
  const statusParam = c.req.query('status');
  const traders = await listNiagaTraders(
    statusParam ? { status: statusParam as import('../../niaga/niaga-trader-registration.schema').NiagaTraderStatus } : undefined,
  );
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { traders, total: traders.length },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/admin/payments/ledger
router.get('/admin/payments/ledger', requireNiagaAdmin, async (c) => {
  const ledger = await listNiagaPaymentLedger();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { ledger, total: ledger.length },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/niaga/admin/applications/:applicationId/approve
router.post(
  '/admin/applications/:applicationId/approve',
  requireNiagaAdmin,
  zValidator('json', ApproveSchema),
  async (c) => {
    const applicationId = c.req.param('applicationId') ?? '';
    const body = c.req.valid('json');
    try {
      const result = await approveNiagaPartnerApplication(applicationId, {
        ...body,
        reviewedBy: reviewerId(c),
      });
      return c.json({
        success:   true,
        kernel:    'ALAMTOLOGI',
        data:      result,
        message:   `Approved. Channel code ${result.channelCode} issued (${result.tier}). Portal token issued — share with partner.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/niaga/admin/applications/:applicationId/reject
router.post(
  '/admin/applications/:applicationId/reject',
  requireNiagaAdmin,
  zValidator('json', RejectSchema),
  async (c) => {
    const applicationId = c.req.param('applicationId') ?? '';
    const { reason } = c.req.valid('json');
    try {
      await rejectNiagaPartnerApplication(applicationId, reason, reviewerId(c));
      return c.json({
        success:   true,
        kernel:    'ALAMTOLOGI',
        message:   'Application rejected.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reject failed.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/niaga/admin/licenses/suspend
router.post('/admin/licenses/suspend', requireNiagaAdmin, zValidator('json', SuspendSchema), async (c) => {
  const { channelCode } = c.req.valid('json');
  try {
    await suspendNiagaPartnerLicense(channelCode, reviewerId(c));
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      message:   `License ${channelCode.toUpperCase()} suspended.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Suspend failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/niaga/templates/cashflow?format=xlsx|pdf|docx&delivery=json|attachment
// delivery=json → { filename, type, base64 } for in-chat cards + preview
// delivery=attachment (default) → binary download stream
router.get('/templates/cashflow', requireAdamUser, rejectToolsLaneOnly, async (c) => {
  const formatRaw = (c.req.query('format') ?? 'xlsx').toLowerCase();
  const format = (['xlsx', 'pdf', 'docx'].includes(formatRaw)
    ? formatRaw
    : 'xlsx') as NiagaCashflowFormat;
  const delivery = (c.req.query('delivery') ?? 'attachment').toLowerCase();
  try {
    const file = await buildNiagaCashflowTemplate(format);
    if (delivery === 'json') {
      return c.json({
        success:  true,
        filename: file.filename,
        type:     format,
        mimeType: file.contentType,
        base64:   file.buffer.toString('base64'),
        kernel:   'ALAMTOLOGI',
      });
    }
    return new Response(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        'Content-Type':        file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Cache-Control':       'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not build template.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 500);
  }
});

// GET /api/niaga/chat/subscription — trader access + usage
router.get('/chat/subscription', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const access = await resolveNiagaSubscriptionAccess(user);
  return c.json({
    success:         true,
    billingEnforced: (await import('../../niaga/niaga-subscription-access.service')).isNiagaBillingEnforced(),
    ...access,
    kernel:          'ALAMTOLOGI',
  });
});

// GET /api/niaga/chat/session
router.get('/chat/session', requireNiagaSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const preferred = c.req.query('sessionId')?.trim();
  let sessionId: string;
  if (preferred) {
    const allowed = await assertStudentOwnsSession(user.userId, preferred);
    if (!allowed) {
      return c.json({ success: false, error: 'Session access denied.', kernel: 'ALAMTOLOGI' }, 403);
    }
    sessionId = preferred;
  } else {
    sessionId = await resolveNiagaChatSession(user.userId);
  }
  return c.json({
    success:   true,
    sessionId,
    userId:    user.userId,
    name:      user.name,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/chat/sessions — recents sidebar
router.get('/chat/sessions', requireNiagaSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const rawLimit = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
  const sessions = await listUserChatSessions(user.userId, 'niaga', limit);
  return c.json({
    success: true,
    sessions,
    count:   sessions.length,
    kernel:  'ALAMTOLOGI',
  });
});

router.patch(
  '/chat/sessions/:sessionId',
  requireNiagaSubscription,
  zValidator('json', SessionTitleSchema),
  async (c) => {
    const user = getTokenUser(c)!;
    const sessionId = c.req.param('sessionId') ?? '';
    const { title } = c.req.valid('json');
    try {
      const ok = await renameUserChatSession(user.userId, sessionId, 'niaga', title);
      if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
      return c.json({ success: true, sessionId, title: title.trim() });
    } catch (err) {
      return c.json({ success: false, error: (err as Error).message }, 403);
    }
  },
);

router.delete('/chat/sessions/:sessionId', requireNiagaSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  try {
    const ok = await deleteUserChatSession(user.userId, sessionId, 'niaga');
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.post('/chat/sessions', requireNiagaSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = await createNewChatSession(user.userId, 'niaga');
  return c.json({
    success: true,
    sessionId,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/niaga/chat/history/:sessionId
router.get('/chat/history/:sessionId', requireNiagaSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  const allowed = await assertStudentOwnsSession(user.userId, sessionId);
  if (!allowed) {
    return c.json({ success: false, error: 'Session access denied.', kernel: 'ALAMTOLOGI' }, 403);
  }
  const rawLimit = parseInt(c.req.query('limit') ?? '100', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 100;
  const messages = await loadMessageHistory(sessionId, limit);
  return c.json({ success: true, messages, sessionId, kernel: 'ALAMTOLOGI' });
});

// DELETE /api/niaga/chat/history/:sessionId
router.delete('/chat/history/:sessionId', requireNiagaSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  try {
    await assertCanClearSessionChat(sessionId, user.userId, { isFounder: false });
    const deletedCount = await clearSessionChatHistory(sessionId);
    return c.json({ success: true, sessionId, deletedCount, kernel: 'ALAMTOLOGI' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not clear chat.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 403);
  }
});

// POST /api/niaga/chat — SSE ADAM Niaga advisor
router.post('/chat', requireNiagaSubscription, zValidator('json', NiagaChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const access = getNiagaSubscriptionAccess(c);

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await resolveNiagaChatSession(user.userId);

  const message = body.message?.trim() ?? '';
  const niagaProfile = await loadNiagaBusinessProfile(user.userId);
  const subscriptionId = await resolveNiagaSubscriptionId(user.userId);

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      if (access?.usage?.dailySoftExceeded && message) {
        await s.write(`event: niaga_usage\ndata: ${JSON.stringify({
          warning: 'Daily soft cap reached — consider spacing messages for better advice quality.',
          usage: access.usage,
        })}\n\n`);
      }

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          'NIAGA',
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        user.role === 'guru' ? 'guru' : 'student',
            sessionType: 'niaga',
          },
          { answerStyle: body.answerStyle, niagaProfile: niagaProfile ?? undefined },
        ),
      );

      if (message && subscriptionId) {
        const usage = await recordNiagaChatMessage(user.userId, subscriptionId);
        await s.write(`event: niaga_usage\ndata: ${JSON.stringify({ usage })}\n\n`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM Niaga stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

// GET /api/niaga/admin/payments/export
router.get('/admin/payments/export', requireNiagaAdmin, async (c) => {
  const csv = await exportNiagaAdminLedgerCsv();
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="niaga-ledger.csv"');
  return c.body(csv);
});

// GET /api/niaga/partner/portal/reports/commission.csv
router.get('/partner/portal/reports/commission.csv', requireNiagaPartner, async (c) => {
  const license = getNiagaPartnerLicense(c)!;
  const monthKey = c.req.query('month')?.trim();
  const csv = await exportNiagaCommissionCsv({
    channelCode: license.channelCode,
    monthKey,
  });
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="niaga-commission-${license.channelCode}.csv"`);
  return c.body(csv);
});

export default router;
