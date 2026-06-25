/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Agent Portal Routes
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
import { withSseKeepalive } from '../../../adam/adam-sse-keepalive';
import {
  runLayerGatePreCheck,
  streamLayerGateBlockedTurn,
} from '../../../adam-servers/adam-layer-gate.service';
import { streamADAMChat } from '../../../adam/adam-chat.service';
import { ADAM_MAIL_INBOX_HINT } from '../../../adam/adam-mail.service';
import { agentMarketingTutorProfile } from '../../../adam/tutor/adam-tutor-agent-marketing.constants';
import {
  agentDemoDisplayName,
  createAgentDemoChatSession,
  listAgentDemoChatSessions,
  loadAgentDemoChatHistory,
  resolveAgentDemoChatSession,
} from '../../../adam/tutor/adam-tutor-agent-demo-chat.service';
import { ENV } from '../../../config/environments';
import {
  getTutorAgentById,
  getTutorAgentPortalOverview,
  getTutorAgentWallet,
  listTutorAgentStudents,
  resolveTutorAgent,
} from '../../../adam/tutor/adam-tutor-agent.service';
import { getTutorAgent, requireTutorAgent } from '../../../adam/tutor/adam-tutor-agent-auth.middleware';
import {
  listTutorAgentPackages,
  type TutorAgentPackageTier,
} from '../../../adam/tutor/adam-tutor-agent-package.config';
import {
  requestTutorAgentPackage,
  serializeAgentPackage,
} from '../../../adam/tutor/adam-tutor-agent-package.service';
import {
  createTutorAgentPackageCheckoutSession,
  simulateTutorAgentPackagePayment,
  syncTutorAgentPackageFromSession,
} from '../../../adam/tutor/adam-tutor-agent-package-stripe.service';
import {
  listAgentAvailableRegisterCodes,
  sendTutorAgentPinInvite,
} from '../../../adam/tutor/adam-tutor-agent-pin-invite.service';
import { getStripeGatewayStatus } from '../../../subscriptions/stripe-gateway.service';
import {
  AgentDemoChatSchema,
  AgentLoginSchema,
  AgentPackageRequestSchema,
  AgentPinEmailSchema,
  prepareAgentPortalSession,
} from './adam-tutor-register.schemas';

const router = new Hono();
// POST /api/adam/tutor/agent/portal/login
router.post('/agent/portal/login', zValidator('json', AgentLoginSchema), async (c) => {
  const { agentCode, portalToken } = c.req.valid('json');
  const agent = await resolveTutorAgent(agentCode, portalToken);
  if (!agent || agent.status !== 'active') {
    return c.json({ success: false, error: 'Invalid agen credentials.', kernel: 'ALAMTOLOGI' }, 403);
  }
  const ready = await prepareAgentPortalSession(agent);
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
  const ready = await prepareAgentPortalSession(agent);
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
      catalog: listTutorAgentPackages(),
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
        tier: body.tier,
        renewal: body.renewal,
      });
      const quote = serializeAgentPackage(updated).packageQuote;
      const renewing = body.renewal === true;
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { agent: serializeAgentPackage(updated), quote },
        message: renewing
          ? `Beli lagi ${quote?.tierLabel ?? body.tier} — RM${quote?.totalMyr.toFixed(2) ?? '?'} (bayaran penuh · +PIN terkumpul).`
          : `Pakej ${quote?.tierLabel ?? body.tier} dipilih — RM${quote?.totalMyr.toFixed(2) ?? '?'}. Teruskan bayaran Stripe.`,
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

    if (!agent.packageTier) {
      return c.json({
        success: false,
        error:   'Pilih pakej (tier) dahulu.',
        kernel:  'ALAMTOLOGI',
      }, 400);
    }

    if (!stripe.configured && ENV.NODE_ENV !== 'production') {
      const updated = await simulateTutorAgentPackagePayment(agent, {
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

    const isRenewal = agent.packageStatus === 'active';
    const result = await createTutorAgentPackageCheckoutSession(agent, { renewal: isRenewal });
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
  const ready = await prepareAgentPortalSession(agent);
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
        message: `PIN emailed to ${result.studentEmail}. ${ADAM_MAIL_INBOX_HINT}`,
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
