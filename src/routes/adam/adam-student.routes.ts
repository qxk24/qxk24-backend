/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Student Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ENV } from '../../config/environments';
import { getTokenUser, requireStudent } from '../../middleware/auth.middleware';
import {
  streamADAMChat,
  getOrCreateSession,
  loadMessageHistory,
  deleteFounderMessage,
  getOrCreateGroupSession,
} from '../../adam/adam-chat.service';
import {
  getStudentAccount,
  issueAdamToken,
  verifyStudentPassword,
} from '../../adam/adam-student.service';
import { STUDENT_ACCOUNTS } from '../../adam/adam-student.types';

const router = new Hono();

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const ChatSchema = z.object({
  sessionId: z.string().optional(),
  message:   z.string().max(10000).optional(),
  mode:      z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN']).default('QUESTIONING'),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0,
  { message: 'Message required.' },
);

// POST /api/adam/student/login
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const account = getStudentAccount(username.trim().toLowerCase());

  if (!account || !verifyStudentPassword(account.userId, password)) {
    await new Promise((r) => setTimeout(r, 800));
    return c.json({ success: false, error: 'Access denied.', kernel: 'QXK24' }, 401);
  }

  const token = issueAdamToken({
    userId:    account.userId,
    role:      'student',
    name:      account.name,
    isFounder: false,
  });

  return c.json({
    success: true,
    kernel:  'QXK24',
    data: {
      token,
      userId:   account.userId,
      name:     account.name,
      role:     'student',
      expiresIn: '30d',
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/student/accounts — public list of student usernames (for login UI)
router.get('/accounts', (c) => {
  return c.json({
    success: true,
    students: STUDENT_ACCOUNTS.map((s) => ({ userId: s.userId, name: s.name })),
    kernel: 'QXK24',
  });
});

// GET /api/adam/student/session
router.get('/session', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = await getOrCreateSession(user.userId, 'student');
  return c.json({
    success: true,
    sessionId,
    userId:  user.userId,
    name:    user.name,
    kernel:  'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/student/group/session
router.get('/group/session', requireStudent, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  return c.json({ success: true, sessionId, kernel: 'QXK24' });
});

// POST /api/adam/student/chat — private 1:1
router.post('/chat', requireStudent, zValidator('json', ChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await getOrCreateSession(user.userId, 'student');

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await streamADAMChat(
        sessionId!,
        body.message!.trim(),
        body.mode,
        async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
        [],
        {
          userId:      user.userId,
          userName:    user.name ?? user.userId,
          role:        'student',
          sessionType: 'student',
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

// POST /api/adam/student/group/chat
router.post('/group/chat', requireStudent, zValidator('json', ChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const sessionId = await getOrCreateGroupSession();

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await streamADAMChat(
        sessionId,
        body.message!.trim(),
        body.mode,
        async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
        [],
        {
          userId:      user.userId,
          userName:    user.name ?? user.userId,
          role:        'student',
          sessionType: 'group',
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
});

// GET /api/adam/student/chat/history/:sessionId
router.get('/chat/history/:sessionId', requireStudent, async (c) => {
  const sessionId = c.req.param('sessionId') ?? '';
  const messages = await loadMessageHistory(sessionId, 100);
  return c.json({ success: true, messages, sessionId, kernel: 'QXK24' });
});

// GET /api/adam/student/group/history
router.get('/group/history', requireStudent, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  const messages = await loadMessageHistory(sessionId, 100);
  return c.json({ success: true, messages, sessionId, kernel: 'QXK24' });
});

// DELETE /api/adam/student/chat/messages/:messageId
router.delete('/chat/messages/:messageId', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const messageId = c.req.param('messageId') ?? '';
  const deleted = await deleteFounderMessage(messageId, user.userId);
  if (!deleted) {
    return c.json({ success: false, error: 'Message not found.', kernel: 'QXK24' }, 404);
  }
  return c.json({ success: true, messageId, kernel: 'QXK24' });
});

export default router;
