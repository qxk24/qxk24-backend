/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Tutor Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
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
  requireActiveSubscription,
  getSubscriptionAccess,
} from '../../../middleware/subscription-guard.middleware';
import {
  buildFreemiumStatusPayloadForUser,
  isFreemiumEnabled,
  runStudentFreemiumPreCheck,
  streamFreemiumBlockedTurn,
} from '../../../freemium/adam-freemium-gate.service';
import {
  runPencarianPreCheck,
  streamPencarianClosingTurn,
  pencarianStatusPayload,
  shouldRunPencarianGate,
} from '../../../subscriptions/pencarian-chat-gate.service';
import { checkTesterLimit, isTesterAccount } from '../../../tester/alm-tester.service';
import {
  isTutorBillingEnforced,
  resolveTutorSubscriptionAccess,
} from '../../../adam/adam-tutor-subscription.service';
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
  resolveTutorChatSession,
  loadMessageHistory,
  assertCanClearSessionChat,
  clearSessionChatHistory,
} from '../../../adam/adam-chat.service';
import { guardPelajarLane } from '../../../adam/adam-account-lane-guard';
import { assertStudentOwnsSession } from '../../../adam/adam-workspace.service';
import { getTutorProfile, saveTutorProfile } from '../../../adam/adam-tutor-profile.service';
import { SessionTitleSchema, TutorChatSchema, TutorProfileSchema } from './adam-student.schemas';

const router = new Hono();

router.get('/tutor/profile', requireStudent, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const profile = await getTutorProfile(user.userId);
  return c.json({ success: true, profile, kernel: 'ALAMTOLOGI' });
});

router.put('/tutor/profile', requireStudent, zValidator('json', TutorProfileSchema), async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const profile = await saveTutorProfile(user.userId, body);
  return c.json({ success: true, profile, kernel: 'ALAMTOLOGI' });
});

router.get('/tutor/subscription', requireStudent, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const tutorLevel = c.req.query('tutorLevel')?.trim() || undefined;
  const access = await resolveTutorSubscriptionAccess(user.userId, tutorLevel);
  return c.json({
    success:         true,
    billingEnforced: isTutorBillingEnforced(),
    ...access,
    kernel:          'ALAMTOLOGI',
  });
});

router.get('/tutor/session', requireStudent, requireActiveSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
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
    sessionId = await resolveTutorChatSession(user.userId);
  }
  return c.json({
    success: true,
    sessionId,
    userId:    user.userId,
    name:      user.name,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.get('/tutor/chat/sessions', requireStudent, requireActiveSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const rawLimit = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
  const sessions = await listUserChatSessions(user.userId, 'tutor', limit);
  return c.json({
    success: true,
    sessions,
    count:     sessions.length,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.patch('/tutor/chat/sessions/:sessionId', requireStudent, requireActiveSubscription, zValidator('json', SessionTitleSchema), async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  const { title } = c.req.valid('json');
  try {
    const ok = await renameUserChatSession(user.userId, sessionId, 'tutor', title);
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId, title: title.trim() });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.delete('/tutor/chat/sessions/:sessionId', requireStudent, requireActiveSubscription, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  try {
    const ok = await deleteUserChatSession(user.userId, sessionId, 'tutor');
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.post('/tutor/chat/sessions', requireStudent, requireActiveSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = await createNewChatSession(user.userId, 'tutor');
  return c.json({
    success: true,
    sessionId,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.get('/tutor/chat/history/:sessionId', requireStudent, requireActiveSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
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

router.delete('/tutor/chat/history/:sessionId', requireStudent, requireActiveSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    await assertCanClearSessionChat(sessionId, user.userId, { isFounder: false });
    const deletedCount = await clearSessionChatHistory(sessionId);
    return c.json({
      success:   true,
      sessionId,
      deletedCount,
      kernel:    'ALAMTOLOGI',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not clear chat.';
    const status = msg.includes('denied') || msg.includes('cannot') ? 403 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

router.post('/tutor/chat', requireStudent, requireActiveSubscription, zValidator('json', TutorChatSchema), async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const access = getSubscriptionAccess(c);

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await resolveTutorChatSession(user.userId);

  const message = body.message?.trim() ?? '';

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      const runFreemium = isFreemiumEnabled() && message && access?.tier !== 'TESTER';
      const runPencarian = !runFreemium && shouldRunPencarianGate(access) && message;
      const runTester = Boolean(message) && await isTesterAccount(user.userId);
      const runLayerGate = Boolean(message);

      const [freemium, pencarian, testerCheck, layerGate] = await Promise.all([
        runFreemium
          ? runStudentFreemiumPreCheck(user.userId, access)
          : Promise.resolve(null),
        runPencarian
          ? runPencarianPreCheck(user.userId, sessionId!, message)
          : Promise.resolve(null),
        runTester
          ? checkTesterLimit(user.userId, sessionId!)
          : Promise.resolve(null),
        runLayerGate
          ? runLayerGatePreCheck({
            userId:    user.userId,
            message,
            mode:      'TUTOR',
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
          `event: freemium_status\ndata: ${JSON.stringify(await buildFreemiumStatusPayloadForUser(user.userId, freemium))}\n\n`,
        );
      } else if (pencarian) {
        if (!pencarian.canContinue) {
          await streamPencarianClosingTurn(s, sessionId!, pencarian);
          return;
        }
        await s.write(
          `event: pencarian_status\ndata: ${JSON.stringify(pencarianStatusPayload(pencarian))}\n\n`,
        );
      }

      if (testerCheck && !testerCheck.canContinue) {
        await s.write(
          `event: tester_limit_reached\ndata: ${JSON.stringify({
            questionsUsed: testerCheck.questionsUsed,
            totalLimit:    testerCheck.totalLimit,
            message:       `You have used all ${testerCheck.totalLimit} test questions.`,
          })}\n\n`,
        );
        await s.write('event: adam_done\ndata: {}\n\n');
        return;
      }

      if (layerGate && !layerGate.allowed) {
        await streamLayerGateBlockedTurn(s, sessionId!, layerGate);
        return;
      }

      if (body.tutorProfile) {
        await saveTutorProfile(user.userId, body.tutorProfile);
      }

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          'TUTOR',
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        'student',
            sessionType: 'tutor',
          },
          {
            answerStyle:  body.answerStyle,
            tutorProfile: body.tutorProfile,
            viaVoice:     body.viaVoice,
            responseMs:   body.responseMs,
          },
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
