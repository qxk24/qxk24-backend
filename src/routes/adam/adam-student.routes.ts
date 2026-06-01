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
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';
import { getTokenUser, requireStudent } from '../../middleware/auth.middleware';
import {
  requireActiveSubscription,
  getSubscriptionAccess,
} from '../../middleware/subscription-guard.middleware';
import {
  runPencarianPreCheck,
  streamPencarianClosingTurn,
  pencarianStatusPayload,
  shouldRunPencarianGate,
} from '../../subscriptions/pencarian-chat-gate.service';
import {
  streamADAMChat,
  getOrCreateSession,
  loadMessageHistory,
  deleteFounderMessage,
  assertCanClearSessionChat,
  clearSessionChatHistory,
  getOrCreateGroupSession,
} from '../../adam/adam-chat.service';
import {
  getStudentAccount,
  getStudentAccounts,
  issueAdamToken,
  resolveStudentLoginUserId,
  verifyStudentPassword,
} from '../../adam/adam-student.service';
import {
  isStudentSelfRegisterEnabled,
  registerStudentSelf,
  slugStudentUserId,
  studentRegisterRequiresCode,
} from '../../adam/adam-student-registry.service';
import {
  authenticateGoogleIdToken,
  isGoogleSignInEnabled,
  publicGoogleClientId,
} from '../../adam/adam-google-auth.service';
import {
  changeStudentPassword,
  completeStudentPasswordReset,
  isPasswordResetEnabled,
  requestStudentPasswordReset,
} from '../../adam/adam-password-reset.service';
import { assertStudentOwnsSession } from '../../adam/adam-workspace.service';
import { buildStudentPulse } from '../../adam/adam-student-pulse.service';

const router = new Hono();

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const UserIdSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9-]+$/, 'Login id: lowercase letters, numbers, hyphens only.');

const RegisterSchema = z.object({
  name:         z.string().min(2).max(80),
  userId:       UserIdSchema.optional(),
  email:        z.string().email().max(120).optional(),
  password:     z.string().min(6).max(128),
  registerCode: z.string().max(64).optional(),
});

const GoogleSchema = z.object({
  idToken: z.string().min(20),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email().max(120),
  stack: z.enum(['lab', 'production']).optional(),
});

const ResetPasswordSchema = z.object({
  token:       z.string().min(20),
  newPassword: z.string().min(6).max(128),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6).max(128),
});

const ChatSchema = z.object({
  sessionId:  z.string().optional(),
  message:    z.string().max(100_000).optional(),
  mode:       z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN']).default('QUESTIONING'),
  uploadIds:  z.array(z.string().min(1)).max(5).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

// GET /api/adam/student/pulse — learning command board aggregate
router.get('/pulse', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const pulse = await buildStudentPulse(
    user.userId,
    user.name ?? user.userId,
  );
  return c.json({
    success: true,
    pulse,
    kernel:  'QXK24',
  });
});

// GET /api/adam/student/auth-config — public auth capabilities
router.get('/auth-config', (c) => {
  return c.json({
    success: true,
    googleEnabled:       isGoogleSignInEnabled(),
    googleClientId:      publicGoogleClientId(),
    passwordResetEnabled: isPasswordResetEnabled(),
    stack:               ENV.QXK24_STACK,
    kernel:              'QXK24',
  });
});

// GET /api/adam/student/register-status — public registration gate
router.get('/register-status', (c) => {
  return c.json({
    success:      true,
    enabled:      isStudentSelfRegisterEnabled(),
    requiresCode: studentRegisterRequiresCode(),
    kernel:       'QXK24',
  });
});

// POST /api/adam/student/register — self-service student account (when enabled)
router.post('/register', zValidator('json', RegisterSchema), async (c) => {
  if (!isStudentSelfRegisterEnabled()) {
    return c.json({
      success: false,
      error:   'Registration is closed.',
      kernel:  'QXK24',
    }, 403);
  }

  const body = c.req.valid('json');

  try {
    const created = await registerStudentSelf({
      name:         body.name,
      password:     body.password,
      userId:       body.userId ?? slugStudentUserId(body.name),
      email:        body.email,
      registerCode: body.registerCode,
    });

    const token = issueAdamToken({
      userId:    created.userId,
      role:      'student',
      name:      created.name,
      isFounder: false,
    });

    return c.json({
      success: true,
      kernel:  'QXK24',
      data: {
        token,
        userId:    created.userId,
        name:      created.name,
        role:      'student',
        expiresIn: '30d',
      },
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    const status = msg.includes('closed') || msg.includes('code') ? 403 : 400;
    await new Promise((r) => setTimeout(r, 600));
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, status);
  }
});

// POST /api/adam/student/google — Google Sign-In (ID token)
router.post('/google', zValidator('json', GoogleSchema), async (c) => {
  const { idToken } = c.req.valid('json');
  try {
    const account = await authenticateGoogleIdToken(idToken);
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
        userId:    account.userId,
        name:      account.name,
        role:      'student',
        expiresIn: '30d',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 401);
  }
});

// POST /api/adam/student/forgot-password
router.post('/forgot-password', zValidator('json', ForgotPasswordSchema), async (c) => {
  const body = c.req.valid('json');
  const stack = body.stack ?? (ENV.QXK24_STACK === 'lab' ? 'lab' : 'production');
  const result = await requestStudentPasswordReset(body.email, stack);
  return c.json({
    success: true,
    sent:    result.sent,
    message: result.message,
    kernel:  'QXK24',
  });
});

// POST /api/adam/student/reset-password
router.post('/reset-password', zValidator('json', ResetPasswordSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    await completeStudentPasswordReset(body.token, body.newPassword);
    return c.json({ success: true, message: 'Password updated. You can sign in now.', kernel: 'QXK24' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reset failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 400);
  }
});

// POST /api/adam/student/change-password — logged-in student
router.post('/change-password', requireStudent, zValidator('json', ChangePasswordSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  try {
    await changeStudentPassword(user.userId, body.currentPassword, body.newPassword);
    return c.json({ success: true, message: 'Password updated.', kernel: 'QXK24' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Password change failed.';
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, 400);
  }
});

// POST /api/adam/student/login
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const userId = resolveStudentLoginUserId(username);

  if (!userId) {
    console.warn('[adam:student-login] unknown login id', { username: username.trim().slice(0, 40) });
    await new Promise((r) => setTimeout(r, 800));
    return c.json({ success: false, error: 'Access denied.', kernel: 'QXK24' }, 401);
  }

  const account = getStudentAccount(userId);
  const passwordOk = account
    ? await verifyStudentPassword(account.userId, password)
    : false;

  if (!account || !passwordOk) {
    console.warn('[adam:student-login] access denied', {
      userId,
      hasAccount: Boolean(account),
      passwordOk,
    });
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
    students: getStudentAccounts().map((s) => ({ userId: s.userId, name: s.name })),
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
router.post('/chat', requireStudent, requireActiveSubscription, zValidator('json', ChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const access = getSubscriptionAccess(c);

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await getOrCreateSession(user.userId, 'student');

  const message = body.message?.trim() ?? '';

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      if (shouldRunPencarianGate(access) && message) {
        const pencarian = await runPencarianPreCheck(user.userId, sessionId!, message);

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

      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId!,
          message,
          body.mode,
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        'student',
            sessionType: 'student',
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

// POST /api/adam/student/group/chat
router.post('/group/chat', requireStudent, requireActiveSubscription, zValidator('json', ChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const sessionId = await getOrCreateGroupSession();

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await withSseKeepalive(s, () =>
        streamADAMChat(
          sessionId,
          body.message?.trim() ?? '',
          body.mode,
          async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
          body.uploadIds ?? [],
          {
            userId:      user.userId,
            userName:    user.name ?? user.userId,
            role:        'student',
            sessionType: 'group',
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

// GET /api/adam/student/chat/history/:sessionId
router.get('/chat/history/:sessionId', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  const allowed = await assertStudentOwnsSession(user.userId, sessionId);
  if (!allowed) {
    return c.json({ success: false, error: 'Session access denied.', kernel: 'QXK24' }, 403);
  }
  const rawLimit = parseInt(c.req.query('limit') ?? '100', 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, rawLimit))
    : 100;
  const messages = await loadMessageHistory(sessionId, limit);
  return c.json({ success: true, messages, sessionId, kernel: 'QXK24' });
});

// DELETE /api/adam/student/chat/history/:sessionId — clear private chat
router.delete('/chat/history/:sessionId', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const sessionId = c.req.param('sessionId') ?? '';
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'QXK24' }, 400);
  }

  try {
    await assertCanClearSessionChat(sessionId, user.userId, { isFounder: false });
    const deletedCount = await clearSessionChatHistory(sessionId);
    return c.json({
      success:      true,
      sessionId,
      deletedCount,
      kernel:       'QXK24',
      timestamp:    new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not clear chat.';
    const status = msg.includes('denied') || msg.includes('cannot') ? 403 : 400;
    return c.json({ success: false, error: msg, kernel: 'QXK24' }, status);
  }
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
