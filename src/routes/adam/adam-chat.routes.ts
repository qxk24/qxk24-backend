/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

// ============================================================
// QXK24 ADAM Teaching Engine — Chat Routes (SSE)
// File: src/routes/adam/adam-chat.routes.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// Endpoints:
//   POST /api/adam/chat           → SSE stream
//   GET  /api/adam/chat/sessions  → list sessions
//   GET  /api/adam/chat/:id       → get session
//   POST /api/adam/chat/:id/verify/:msgId → verify message
// ============================================================

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  streamADAMChat,
  getChatSession,
  listChatSessions,
  createNewChatSession,
  resolveFounderTeachingSession,
  ensureSession,
  loadMessageHistory,
  deleteFounderMessage,
  assertCanClearSessionChat,
  clearSessionChatHistory,
  verifyADAMMessage,
  renameUserChatSession,
  deleteUserChatSession,
} from '../../adam/adam-chat.service';
import { requireFounder, getTokenUser } from '../../middleware/auth.middleware';
import type {
  ADAMApiResponse,
  ADAMChatSession,
  ConstitutionalJudgment,
} from '../../adam/adam.types';
import { ENV } from '../../config/environments';
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';
import { resolveFounderApiMode } from '../../adam/adam-founder-unified-mode';

const router = new Hono();

// ─── POST /api/adam/chat — Start / Continue SSE Stream ───────

const ChatSchema = z.object({
  sessionId:    z.string().optional(),
  message:      z.string().max(100_000).optional(),
  uploadIds:    z.array(z.string().min(1)).max(5).optional(),
  mode:         z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN', 'BUILDER']),
  answerStyle:  z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  title:        z.string().max(120).optional(),
  builderMode:      z.boolean().optional(),
  builderEvaluate:  z.boolean().optional(),
  /** @deprecated Natural flow: ADAM selects topic on "Tulis jurnal". Autonomous batch may still pass focus id. */
  journalTopicId:   z.string().min(1).max(200).optional(),
  /** Future autonomous batch only — enables [JOURNAL DAILY QUOTA] injection. */
  journalAutonomous: z.boolean().optional(),
}).refine(
  (data) => (data.message?.trim()?.length ?? 0) > 0 || (data.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one teaching file (uploadIds).' },
);

router.post('/', requireFounder, zValidator('json', ChatSchema), async (c) => {
  const body      = c.req.valid('json');
  const message   = body.message?.trim() ?? '';
  const mode      = resolveFounderApiMode(message, body.mode);
  const uploadIds = body.uploadIds ?? [];

  const authHeader = c.req.header('Authorization');
  const founderToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const user = getTokenUser(c);
  const founderId = user?.userId ?? 'masa-bayu';

  let sessionId = body.sessionId;
  if (!sessionId) {
    sessionId = await resolveFounderTeachingSession(founderId);
  } else {
    sessionId = await ensureSession(sessionId, founderId, 'founder');
  }

  // Set SSE headers
  c.header('Content-Type',  'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection',    'keep-alive');
  c.header('X-QXK24-Kernel', ENV.QXK24_KERNEL_VERSION);
  c.header('X-QXK24-Era',    ENV.QXK24_ERA);

  return stream(c, async (s) => {
    const user = getTokenUser(c);
    const participant = {
      userId:      user?.userId ?? 'masa-bayu',
      userName:    user?.name ?? 'Masa Bayu',
      role:        'founder' as const,
      sessionType: 'founder' as const,
    };

    try {
      await withSseKeepalive(s, () =>
        streamADAMChat(sessionId!, message, mode, async (event, data) => {
          await s.write(`event: ${event}\ndata: ${data}\n\n`);
        }, uploadIds, participant, {
          founderToken,
          answerStyle:       body.answerStyle,
          journalTopicId:    body.journalTopicId,
          journalAutonomous: body.journalAutonomous === true,
          forceBuilder:      body.builderMode === true || mode === 'AUDIT' || mode === 'BUILDER',
          clientBuilderMode: body.builderMode === true,
          builderEvaluate:   body.builderEvaluate === true,
        }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg, waqf: true })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

// ─── POST /api/adam/chat/simple — Clean JSON (non-streaming) ─

const SimpleChatSchema = ChatSchema;

router.post('/simple', requireFounder, zValidator('json', SimpleChatSchema), async (c) => {
  const body = c.req.valid('json');

  const message   = body.message?.trim() ?? '';
  const uploadIds = body.uploadIds ?? [];
  const mode      = resolveFounderApiMode(message, body.mode);

  const user = getTokenUser(c);
  const founderId = user?.userId ?? 'masa-bayu';

  let sessionId = body.sessionId;
  if (!sessionId) {
    sessionId = await resolveFounderTeachingSession(founderId);
  } else {
    sessionId = await ensureSession(sessionId, founderId, 'founder');
  }

  let fullResponse = '';
  let judgment: ConstitutionalJudgment = 'ISLAH';
  let k24Address = '';

  await streamADAMChat(sessionId, message, mode, (event, data) => {
    if (event === 'adam_chunk') {
      try {
        fullResponse += JSON.parse(data).text ?? '';
      } catch {
        // Ignore malformed chunk payload
      }
    }
    if (event === 'adam_complete') {
      try {
        const parsed = JSON.parse(data);
        judgment = parsed.judgment ?? 'ISLAH';
        k24Address = parsed.k24Address ?? '';
        fullResponse = parsed.response ?? fullResponse;
      } catch {
        // Ignore malformed completion payload
      }
    }
  }, uploadIds, {
    userId:      'masa-bayu',
    userName:    'Masa Bayu',
    role:        'founder',
    sessionType: 'founder',
  }, { answerStyle: body.answerStyle });

  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data: {
      sessionId,
      response: fullResponse,
      judgment,
      k24Address,
      mode: body.mode,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/adam/chat/history/:sessionId — Message history ──

router.get('/history/:sessionId', requireFounder, async (c) => {
  const sessionId = c.req.param('sessionId') ?? '';
  if (!sessionId) {
    return c.json({
      success: false,
      error:   'sessionId required.',
      kernel:  'ALAMTOLOGI',
    }, 400);
  }

  const rawLimit = parseInt(c.req.query('limit') ?? '100', 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, rawLimit))
    : 100;
  const messages = await loadMessageHistory(sessionId, limit);

  return c.json({
    success:   true,
    messages,
    total:     messages.length,
    sessionId,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/adam/chat/sessions — List Sessions ──────────────

router.post('/sessions', requireFounder, async (c) => {
  const user = getTokenUser(c);
  const founderId = user?.userId ?? 'masa-bayu';
  const sessionId = await createNewChatSession(founderId, 'founder');
  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { sessionId },
    timestamp: new Date().toISOString(),
  });
});

router.get('/sessions', requireFounder, async (c) => {
  const mode  = c.req.query('mode') as any;
  const limit = parseInt(c.req.query('limit') ?? '20', 10);
  const user = getTokenUser(c);
  const founderId = user?.userId ?? 'masa-bayu';

  const sessions = await listChatSessions(mode, limit, founderId);

  const response: ADAMApiResponse<{ sessions: ADAMChatSession[]; count: number }> = {
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { sessions, count: sessions.length },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

const SessionTitleSchema = z.object({
  title: z.string().min(1).max(72),
});

// ─── PATCH /api/adam/chat/sessions/:sessionId — Rename thread ──

router.patch('/sessions/:sessionId', requireFounder, zValidator('json', SessionTitleSchema), async (c) => {
  const user = getTokenUser(c);
  const founderId = user?.userId ?? 'masa-bayu';
  const sessionId = c.req.param('sessionId') ?? '';
  const { title } = c.req.valid('json');
  try {
    const ok = await renameUserChatSession(founderId, sessionId, 'founder', title, { isFounder: true });
    if (!ok) return c.json({ success: false, error: 'Session not found.', kernel: 'ALAMTOLOGI' }, 404);
    return c.json({
      success:   true,
      sessionId,
      title:     title.trim(),
      kernel:    'ALAMTOLOGI',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not rename chat.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 403);
  }
});

// ─── DELETE /api/adam/chat/sessions/:sessionId — Remove thread ──

router.delete('/sessions/:sessionId', requireFounder, async (c) => {
  const user = getTokenUser(c);
  const founderId = user?.userId ?? 'masa-bayu';
  const sessionId = c.req.param('sessionId') ?? '';
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
  }
  try {
    const ok = await deleteUserChatSession(founderId, sessionId, 'founder', { isFounder: true });
    if (!ok) return c.json({ success: false, error: 'Session not found.', kernel: 'ALAMTOLOGI' }, 404);
    return c.json({
      success:   true,
      sessionId,
      kernel:    'ALAMTOLOGI',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not delete chat.';
    const status = msg.includes('denied') || msg.includes('cannot') ? 403 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

// ─── DELETE /api/adam/chat/messages/:messageId — Remove founder message ──

router.delete('/messages/:messageId', requireFounder, async (c) => {
  const messageId = c.req.param('messageId') ?? '';
  if (!messageId) {
    return c.json({ success: false, error: 'messageId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  const deleted = await deleteFounderMessage(messageId, 'masa-bayu');
  if (!deleted) {
    return c.json({
      success: false,
      error:   'Message not found or cannot be deleted.',
      kernel:  'ALAMTOLOGI',
    }, 404);
  }

  return c.json({
    success:   true,
    messageId,
    kernel:    'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

// ─── DELETE /api/adam/chat/history/:sessionId — Clear all messages ──

router.delete('/history/:sessionId', requireFounder, async (c) => {
  const sessionId = c.req.param('sessionId') ?? '';
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    await assertCanClearSessionChat(sessionId, 'masa-bayu', { isFounder: true });
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

// ─── GET /api/adam/chat/:id — Get Single Session ──────────────

router.get('/:id', requireFounder, async (c) => {
  const id      = c.req.param('id')!;
  const session = await getChatSession(id);

  if (!session) {
    return c.json(
      { success: false, kernel: 'ALAMTOLOGI', error: 'Session not found', timestamp: new Date().toISOString() },
      404,
    );
  }

  const response: ADAMApiResponse<ADAMChatSession> = {
    success:   true,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      session,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// ─── POST /api/adam/chat/:id/verify/:msgId — Verify Message ──

router.post('/:id/verify/:msgId', requireFounder, async (c) => {
  const sessionId = c.req.param('id')!;
  const messageId = c.req.param('msgId')!;
  const verified  = await verifyADAMMessage(sessionId, messageId);

  return c.json({
    success:   verified,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { verified, sessionId, messageId },
    timestamp: new Date().toISOString(),
  });
});

export default router;
