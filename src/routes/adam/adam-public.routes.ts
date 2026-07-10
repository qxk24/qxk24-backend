/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Public Routes (Guest Freemium)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
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
  getOrCreateSession,
  streamADAMChat,
} from '../../adam/adam-chat.service';
import {
  freemiumStatusPayload,
  isPublicFreemiumEnabled,
  runGuestFreemiumPreCheck,
  streamFreemiumBlockedTurn,
} from '../../freemium/adam-freemium-gate.service';
import {
  getGuestQuotaSnapshot,
  guestLifetimeLimit,
  guestSessionUserId,
  newGuestId,
  normalizeGuestId,
} from '../../freemium/adam-freemium-guest.service';
import { isStudentSelfRegisterEnabled } from '../../adam/adam-platform-settings.service';
import { pelajarMonthlyLimit } from '../../freemium/adam-freemium-daily.service';
import {
  freeRollingLimit,
  profesionalRollingLimit,
  rollingWindowHours,
} from '../../freemium/adam-freemium-rolling.service';
import { pelajarDailySoftLimit } from '../../freemium/adam-freemium-premium.service';
import { getPremiumCreditPacks } from '../../freemium/adam-freemium-credit.service';
import {
  runLayerGatePreCheck,
  streamLayerGateBlockedTurn,
} from '../../adam-servers/adam-layer-gate.service';
import { runSiteHelperChat } from '../../adam/adam-site-helper.service';
import { checkSiteHelperRateLimit } from '../../adam/adam-site-helper-rate-limit';

const router = new Hono();

const GUEST_COOKIE = 'adam_guest_id';
const GUEST_HEADER = 'x-adam-guest-id';

const PublicChatSchema = z.object({
  sessionId: z.string().optional(),
  message:   z.string().min(1).max(8_000),
  guestId:   z.string().optional(),
}).refine(
  (d) => d.message.trim().length > 0,
  { message: 'Message is required.' },
);

function readGuestId(c: { req: { header: (n: string) => string | undefined; raw: Request } }): string | null {
  const header = normalizeGuestId(c.req.header(GUEST_HEADER));
  if (header) return header;

  const cookie = c.req.header('cookie') ?? '';
  const match = cookie.match(new RegExp(`${GUEST_COOKIE}=([^;]+)`));
  return normalizeGuestId(match?.[1] ? decodeURIComponent(match[1]) : null);
}

function guestCookie(guestId: string): string {
  const maxAge = 60 * 60 * 24 * 365;
  return `${GUEST_COOKIE}=${encodeURIComponent(guestId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`;
}

// GET /api/adam/public/freemium-status
router.get('/freemium-status', async (c) => {
  try {
    let guestId = readGuestId(c);
    const issued = !guestId;
    if (!guestId) guestId = newGuestId();

    const snap = await getGuestQuotaSnapshot(guestId);

    if (issued) {
      c.header('Set-Cookie', guestCookie(guestId));
    }

    return c.json({
      success: true,
      guestId,
      registerEnabled: isStudentSelfRegisterEnabled(),
      guest: {
        questionsUsed:      snap.questionsUsed,
        questionsRemaining: snap.questionsRemaining,
        lifetimeLimit:      snap.lifetimeLimit,
        limitReached:       snap.limitReached,
        registerGate:       snap.registerGate,
      },
      registeredFree: {
        rollingLimit:       freeRollingLimit(),
        rollingWindowHours: rollingWindowHours(),
        note:               'Register free — deep questions in a rolling window.',
      },
      paid: {
        comingSoon: false,
        note:       'Premium, Profesional & Enterprise — see /pricing/packages.',
      },
      kernel: 'Alamtologi',
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/public/chat — guest try (no auth)
router.post('/chat', zValidator('json', PublicChatSchema), async (c) => {
  if (!isPublicFreemiumEnabled()) {
    return c.json({
      success: false,
      error:   'Guest chat is not available.',
      kernel:  'ALAMTOLOGI',
    }, 503);
  }

  const body = c.req.valid('json');
  let guestId = normalizeGuestId(body.guestId) ?? readGuestId(c) ?? newGuestId();
  const sessionUserId = guestSessionUserId(guestId);
  const message = body.message.trim();
  let sessionId = body.sessionId;

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');
  c.header('Set-Cookie', guestCookie(guestId));
  c.header('X-Adam-Guest-Id', guestId);

  return stream(c, async (s) => {
    try {
      await s.write(
        `event: freemium_guest_id\ndata: ${JSON.stringify({ guestId })}\n\n`,
      );

      const sessionPromise = sessionId
        ? Promise.resolve(sessionId)
        : getOrCreateSession(sessionUserId, 'student');

      const [freemium, resolvedSessionId] = await Promise.all([
        runGuestFreemiumPreCheck(guestId, sessionId),
        sessionPromise,
      ]);
      sessionId = resolvedSessionId;

      if (!freemium.canContinue) {
        await streamFreemiumBlockedTurn(s, sessionId, freemium);
        return;
      }

      await s.write(
        `event: freemium_status\ndata: ${JSON.stringify(freemiumStatusPayload(freemium))}\n\n`,
      );

      if (freemium.limitReached && freemium.registerGate) {
        await s.write(
          `event: freemium_register_gate\ndata: ${JSON.stringify({
            message:     'This is your last trial question. Sign up free to continue with ADAM.',
            registerUrl: '/register?next=/adam/chat',
          })}\n\n`,
        );
      }

      const layerGate = await runLayerGatePreCheck({
        message,
        mode:      'QUESTIONING',
        isFounder: false,
        userName:  'Guest',
      });
      if (!layerGate.allowed) {
        await streamLayerGateBlockedTurn(s, sessionId!, layerGate);
        return;
      }

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          'QUESTIONING',
          async (event, data) => {
 try {   await s.write(`event: ${event}\ndata: ${data}\n\n`); 
 } catch (err) {
   console.error(err);
   throw err;
 }},
          [],
          {
            userId:      sessionUserId,
            userName:    'Guest',
            role:        'student',
            sessionType: 'student',
          },
          { answerStyle: 'natural' },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

const SiteHelperSchema = z.object({
  message: z.string().min(1).max(2_000),
  history: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string().min(1).max(1_200),
  })).max(8).optional(),
});

// POST /api/adam/public/site-helper — marketing FAQ (no auth)
router.post('/site-helper', zValidator('json', SiteHelperSchema), async (c) => {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    ?? c.req.header('x-real-ip')
    ?? 'unknown';

  const limit = checkSiteHelperRateLimit(ip);
  if (!limit.allowed) {
    return c.json({
      success: false,
      error:   'Too many requests. Please try again later.',
      kernel:  'ALAMTOLOGI',
    }, 429);
  }

  const body = c.req.valid('json');
  try {
    const { reply } = await runSiteHelperChat({
      message: body.message,
      history: body.history,
    });
    return c.json({ success: true, reply, kernel: 'Alamtologi' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Site helper failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/public/site-helper/greeting
router.get('/site-helper/greeting', (c) => {
  return c.json({
    success: true,
    greeting:
      'Hello — I\'m ADAM, your guide on qxk24.com. Ask me about ADAM, Alamtologi, registration, or our plans. For full teaching chat, register free and open ADAM at qxk24.com/adam/chat.',
    kernel: 'Alamtologi',
  });
});

// GET /api/adam/public/limits — marketing copy for web
router.get('/limits', (c) => {
  return c.json({
    success: true,
    guest: {
      lifetimeLimit: guestLifetimeLimit(),
      label:         'Guest (no account)',
    },
    free: {
      rollingLimit:     freeRollingLimit(),
      rollingWindowHours: rollingWindowHours(),
      label:            'Basic (registered)',
    },
    pelajar: {
      monthlyLimit:      pelajarMonthlyLimit(),
      dailySoftLimit:    pelajarDailySoftLimit(),
      topUpPacks:        getPremiumCreditPacks(),
      label:             'Premium',
      comingSoon:        false,
    },
    profesional: {
      rollingLimit:      profesionalRollingLimit(),
      rollingWindowHours: rollingWindowHours(),
      label:             'Profesional',
      comingSoon:        false,
    },
    enterprise:  { comingSoon: true, label: 'Enterprise' },
    paymentGateway: { wired: false, label: 'Coming soon' },
    kernel: 'Alamtologi',
  });
});

export default router;
