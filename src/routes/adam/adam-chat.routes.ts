// ============================================================
// QXK24 ADAM Teaching Engine — Chat Routes (SSE)
// File: src/routes/adam/adam-chat.routes.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
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
  getOrCreateSession,
  loadMessageHistory,
  deleteFounderMessage,
  verifyADAMMessage,
} from '../../adam/adam-chat.service';
import { requireAuth, requireFounder } from '../../middleware/auth.middleware';
import type {
  ADAMApiResponse,
  ADAMChatSession,
  ConstitutionalJudgment,
} from '../../adam/adam.types';
import { ENV } from '../../config/environments';

const router = new Hono();

// ─── POST /api/adam/chat — Start / Continue SSE Stream ───────

const ChatSchema = z.object({
  sessionId:  z.string().optional(),
  message:    z.string().max(10000).optional(),
  uploadIds:  z.array(z.string().min(1)).max(5).optional(),
  mode:       z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN']),
  title:      z.string().max(120).optional(),
}).refine(
  (data) => (data.message?.trim()?.length ?? 0) > 0 || (data.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one teaching file (uploadIds).' },
);

router.post('/', requireFounder, zValidator('json', ChatSchema), async (c) => {
  const body      = c.req.valid('json');
  const mode      = body.mode;
  const message   = body.message?.trim() ?? '';
  const uploadIds = body.uploadIds ?? [];

  let sessionId = body.sessionId;
  if (!sessionId) {
    sessionId = await getOrCreateSession('masa-bayu');
  }

  // Set SSE headers
  c.header('Content-Type',  'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection',    'keep-alive');
  c.header('X-QXK24-Kernel', ENV.QXK24_KERNEL_VERSION);
  c.header('X-QXK24-Era',    ENV.QXK24_ERA);

  return stream(c, async (s) => {
    try {
      await streamADAMChat(sessionId!, message, mode, async (event, data) => {
        await s.write(`event: ${event}\ndata: ${data}\n\n`);
      }, uploadIds);
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

  let sessionId = body.sessionId;
  if (!sessionId) {
    sessionId = await getOrCreateSession('masa-bayu');
  }

  let fullResponse = '';
  let judgment: ConstitutionalJudgment = 'ISLAH';
  let k24Address = '';

  await streamADAMChat(sessionId, message, body.mode, (event, data) => {
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
  }, uploadIds);

  return c.json({
    success:   true,
    kernel:    'QXK24',
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
      kernel:  'QXK24',
    }, 400);
  }

  const messages = await loadMessageHistory(sessionId, 100);

  return c.json({
    success:   true,
    messages,
    total:     messages.length,
    sessionId,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/adam/chat/sessions — List Sessions ──────────────

router.get('/sessions', requireFounder, async (c) => {
  const mode  = c.req.query('mode') as any;
  const limit = parseInt(c.req.query('limit') ?? '20');

  const sessions = await listChatSessions(mode, limit);

  const response: ADAMApiResponse<{ sessions: ADAMChatSession[]; count: number }> = {
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { sessions, count: sessions.length },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// ─── DELETE /api/adam/chat/messages/:messageId — Remove founder message ──

router.delete('/messages/:messageId', requireFounder, async (c) => {
  const messageId = c.req.param('messageId') ?? '';
  if (!messageId) {
    return c.json({ success: false, error: 'messageId required.', kernel: 'QXK24' }, 400);
  }

  const deleted = await deleteFounderMessage(messageId, 'masa-bayu');
  if (!deleted) {
    return c.json({
      success: false,
      error:   'Message not found or cannot be deleted.',
      kernel:  'QXK24',
    }, 404);
  }

  return c.json({
    success:   true,
    messageId,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/adam/chat/:id — Get Single Session ──────────────

router.get('/:id', requireFounder, async (c) => {
  const id      = c.req.param('id')!;
  const session = await getChatSession(id);

  if (!session) {
    return c.json(
      { success: false, kernel: 'QXK24', error: 'Session not found', timestamp: new Date().toISOString() },
      404,
    );
  }

  const response: ADAMApiResponse<ADAMChatSession> = {
    success:   true,
    kernel:    'QXK24',
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
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data:      { verified, sessionId, messageId },
    timestamp: new Date().toISOString(),
  });
});

export default router;
