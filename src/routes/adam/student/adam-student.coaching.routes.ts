/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Coaching Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-03
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
import { getTokenUser, requireStudent } from '../../../middleware/auth.middleware';
import {
  requireCoachingSubscription,
  rejectToolsLaneOnly,
  rejectNiagaLaneOnly,
  getSubscriptionAccess,
  getCoachingSubscriptionAccess,
} from '../../../middleware/subscription-guard.middleware';
import { resolveCoachingSubscriptionAccess } from '../../../adam/adam-coaching-subscription.service';
import {
  buildFreemiumStatusPayloadForUser,
  isFreemiumEnabled,
  runStudentFreemiumPreCheck,
  streamFreemiumBlockedTurn,
} from '../../../freemium/adam-freemium-gate.service';
import {
  runLayerGatePreCheck,
  streamLayerGateBlockedTurn,
} from '../../../adam-servers/adam-layer-gate.service';
import {
  streamADAMChat,
  createNewChatSession,
  listUserChatSessions,
  renameUserChatSession,
  deleteUserChatSession,
  resolveCoachingChatSession,
  loadMessageHistory,
} from '../../../adam/adam-chat.service';
import { assertStudentOwnsSession } from '../../../adam/adam-workspace.service';
import { CoachingChatSchema, SessionTitleSchema } from './adam-student.schemas';

const router = new Hono();

router.use('/coaching/*', requireStudent, rejectToolsLaneOnly, rejectNiagaLaneOnly);

router.get('/coaching/subscription', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const access = await resolveCoachingSubscriptionAccess(user.userId);
  return c.json({
    success:         true,
    billingEnforced: false,
    ...access,
    kernel:          'ALAMTOLOGI',
  });
});

router.get('/coaching/session', requireStudent, requireCoachingSubscription, async (c) => {
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
    sessionId = await resolveCoachingChatSession(user.userId);
  }
  return c.json({
    success: true,
    sessionId,
    userId:  user.userId,
    name:    user.name,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.get('/coaching/chat/sessions', requireStudent, requireCoachingSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const rawLimit = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
  const sessions = await listUserChatSessions(user.userId, 'coaching', limit);
  return c.json({
    success: true,
    sessions,
    count:   sessions.length,
    kernel:  'ALAMTOLOGI',
  });
});

router.patch('/coaching/chat/sessions/:sessionId', requireStudent, requireCoachingSubscription, zValidator('json', SessionTitleSchema), async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  const { title } = c.req.valid('json');
  try {
    const ok = await renameUserChatSession(user.userId, sessionId, 'coaching', title);
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId, title: title.trim() });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.delete('/coaching/chat/sessions/:sessionId', requireStudent, requireCoachingSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  try {
    const ok = await deleteUserChatSession(user.userId, sessionId, 'coaching');
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.post('/coaching/chat/sessions', requireStudent, requireCoachingSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = await createNewChatSession(user.userId, 'coaching');
  return c.json({
    success: true,
    sessionId,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.get('/coaching/chat/history/:sessionId', requireStudent, requireCoachingSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  const allowed = await assertStudentOwnsSession(user.userId, sessionId);
  if (!allowed) {
    return c.json({ success: false, error: 'Session access denied.', kernel: 'ALAMTOLOGI' }, 403);
  }
  const rawLimit = parseInt(c.req.query('limit') ?? '100', 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, rawLimit))
    : 100;
  const messages = await loadMessageHistory(sessionId, limit);
  return c.json({ success: true, messages, sessionId, kernel: 'ALAMTOLOGI' });
});

router.post('/coaching/chat', requireStudent, requireCoachingSubscription, zValidator('json', CoachingChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const access = getSubscriptionAccess(c);
  const coachingAccess = getCoachingSubscriptionAccess(c);

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await resolveCoachingChatSession(user.userId);

  const message = body.message?.trim() ?? '';

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      const runFreemium = isFreemiumEnabled() && Boolean(message) && Boolean(coachingAccess?.freemium);

      const [freemium, layerGate] = await Promise.all([
        runFreemium
          ? runStudentFreemiumPreCheck(user.userId, access)
          : Promise.resolve(null),
        message
          ? runLayerGatePreCheck({
            userId:    user.userId,
            message,
            mode:      'COACHING',
            isFounder: false,
            userName:  user.name ?? user.userId,
          })
          : Promise.resolve(null),
      ]);

      if (freemium) {
        if (!freemium.canContinue) {
          await streamFreemiumBlockedTurn(s, sessionId!, freemium);
          return;
        }

        await s.write(
          `event: freemium_status\ndata: ${JSON.stringify(
            await buildFreemiumStatusPayloadForUser(user.userId, freemium),
          )}\n\n`,
        );
      }

      if (layerGate && !layerGate.allowed) {
        await streamLayerGateBlockedTurn(s, sessionId!, layerGate);
        return;
      }

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          'COACHING',
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        'student',
            sessionType: 'coaching',
          },
          { answerStyle: body.answerStyle, viaVoice: body.viaVoice },
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
