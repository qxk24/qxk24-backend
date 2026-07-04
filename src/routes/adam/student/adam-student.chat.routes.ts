/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Chat Routes (Learn / umum)
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
  runPencarianPreCheck,
  streamPencarianClosingTurn,
  pencarianStatusPayload,
  shouldRunPencarianGate,
} from '../../../subscriptions/pencarian-chat-gate.service';
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
import { checkTesterLimit, isTesterAccount } from '../../../tester/alm-tester.service';
import {
  streamADAMChat,
  getOrCreateSession,
  createNewChatSession,
  listUserChatSessions,
  renameUserChatSession,
  deleteUserChatSession,
  resolveStudentChatSession,
  loadMessageHistory,
  deleteFounderMessage,
  assertCanClearSessionChat,
  clearSessionChatHistory,
  getOrCreateGroupSession,
} from '../../../adam/adam-chat.service';
import {
  guardStudentChatLane,
  guardStudentSessionLane,
} from '../../../adam/adam-account-lane-guard';
import { assertStudentOwnsSession } from '../../../adam/adam-workspace.service';
import { ChatSchema, SessionTitleSchema } from './adam-student.schemas';

const router = new Hono();

router.get('/session', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
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
    sessionId = await resolveStudentChatSession(user.userId);
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

router.get('/chat/sessions', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const rawLimit = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
  const sessions = await listUserChatSessions(user.userId, 'student', limit);
  return c.json({
    success: true,
    sessions,
    count:     sessions.length,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.post('/chat/sessions', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = await createNewChatSession(user.userId, 'student');
  return c.json({
    success: true,
    sessionId,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.patch('/chat/sessions/:sessionId', requireStudent, zValidator('json', SessionTitleSchema), async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  const { title } = c.req.valid('json');
  try {
    const ok = await renameUserChatSession(user.userId, sessionId, 'student', title);
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId, title: title.trim() });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.delete('/chat/sessions/:sessionId', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  try {
    const ok = await deleteUserChatSession(user.userId, sessionId, 'student');
    if (!ok) return c.json({ success: false, error: 'Session not found.' }, 404);
    return c.json({ success: true, sessionId });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.get('/group/session', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
  if (laneBlock) return laneBlock;
  const sessionId = await getOrCreateGroupSession();
  return c.json({ success: true, sessionId, kernel: 'ALAMTOLOGI' });
});

router.post('/chat', requireStudent, requireActiveSubscription, zValidator('json', ChatSchema), async (c) => {
  const body = c.req.valid('json');
  const laneBlock = await guardStudentChatLane(c, body.mode);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const access = getSubscriptionAccess(c);

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await getOrCreateSession(user.userId, 'student');

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
            mode:      body.mode,
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
        if (pencarian.showWarning) {
          await s.write(
            `event: pencarian_warning\ndata: ${JSON.stringify({
              messagesUsed: pencarian.messagesUsed,
              totalLimit:   pencarian.totalLimit,
              message:      'Perjalanan kamu hampir ke penghujung — 20 mesej lagi.',
            })}\n\n`,
          );
        }
      }

      if (testerCheck && !testerCheck.canContinue) {
        await s.write(
          `event: tester_limit_reached\ndata: ${JSON.stringify({
            questionsUsed: testerCheck.questionsUsed,
            totalLimit:    testerCheck.totalLimit,
            message:       `You have used all ${testerCheck.totalLimit} test questions. Thank you for testing ADAM. Contact the Alamtologi team to extend your access.`,
          })}\n\n`,
        );
        await s.write('event: adam_done\ndata: {}\n\n');
        return;
      }

      if (testerCheck?.showWarning) {
        await s.write(
          `event: tester_warning\ndata: ${JSON.stringify({
            questionsUsed:      testerCheck.questionsUsed,
            questionsRemaining: testerCheck.questionsRemaining,
            totalLimit:         testerCheck.totalLimit,
            message:            `You have ${testerCheck.questionsRemaining} test questions remaining.`,
          })}\n\n`,
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
          body.mode === 'JOURNAL_GEN' || body.mode === 'AUDIT' ? 'QUESTIONING' : body.mode,
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        'student',
            sessionType: 'student',
          },
          { answerStyle: body.answerStyle },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

router.post('/group/chat', requireStudent, requireActiveSubscription, zValidator('json', ChatSchema), async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const sessionId = await getOrCreateGroupSession();
  const groupMessage = body.message?.trim() ?? '';

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      if (groupMessage) {
        const layerGate = await runLayerGatePreCheck({
          userId:    user.userId,
          message:   groupMessage,
          mode:      body.mode,
          isFounder: false,
          userName:  user.name ?? user.userId,
        });
        if (!layerGate.allowed) {
          await streamLayerGateBlockedTurn(s, sessionId, layerGate);
          return;
        }
      }

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId,
          groupMessage,
          body.mode === 'JOURNAL_GEN' || body.mode === 'AUDIT' ? 'QUESTIONING' : body.mode,
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        'student',
            sessionType: 'group',
          },
          { answerStyle: body.answerStyle },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

router.get('/chat/history/:sessionId', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
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

router.delete('/chat/history/:sessionId', requireStudent, async (c) => {
  const laneBlock = await guardStudentSessionLane(c);
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
      success:      true,
      sessionId,
      deletedCount,
      kernel:       'Alamtologi',
      timestamp:    new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not clear chat.';
    const status = msg.includes('denied') || msg.includes('cannot') ? 403 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

router.get('/group/history', requireStudent, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  const messages = await loadMessageHistory(sessionId, 100);
  return c.json({ success: true, messages, sessionId, kernel: 'ALAMTOLOGI' });
});

router.delete('/chat/messages/:messageId', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const messageId = c.req.param('messageId') ?? '';
  const deleted = await deleteFounderMessage(messageId, user.userId);
  if (!deleted) {
    return c.json({ success: false, error: 'Message not found.', kernel: 'ALAMTOLOGI' }, 404);
  }
  return c.json({ success: true, messageId, kernel: 'ALAMTOLOGI' });
});

export default router;
