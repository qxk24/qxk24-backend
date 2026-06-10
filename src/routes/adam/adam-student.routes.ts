/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
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
  freemiumStatusPayload,
  getStudentFreemiumStatus,
  isFreemiumEnabled,
  runStudentFreemiumPreCheck,
  streamFreemiumBlockedTurn,
} from '../../freemium/adam-freemium-gate.service';
import {
  runLayerGatePreCheck,
  streamLayerGateBlockedTurn,
} from '../../adam-servers/adam-layer-gate.service';
import { attachSubscriptionAccess } from '../../middleware/subscription-guard.middleware';
import { detectRegionFromHeaders } from '../../subscriptions/region-detector.service';
import {
  CREDIT_PACK_ID,
  getBasicCreditPackOffer,
  getPremiumCreditPacks,
  resolveCreditPack,
  getCreditWalletSnapshot,
  isCreditPurchaseWired,
} from '../../freemium/adam-freemium-credit.service';
import { SubscriptionTier } from '../../subscriptions/subscription.schema';
import {
  checkTesterLimit,
  isTesterAccount,
} from '../../tester/alm-tester.service';
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
} from '../../adam/adam-platform-settings.service';
import {
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
  sessionId:    z.string().optional(),
  message:      z.string().max(100_000).optional(),
  mode:         z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN']).default('QUESTIONING'),
  answerStyle:  z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:    z.array(z.string().min(1)).max(5).optional(),
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
    kernel:  'ALAMTOLOGI',
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
    kernel:              'Alamtologi',
  });
});

function creditPacksForAccess(
  region: ReturnType<typeof detectRegionFromHeaders>,
  access: ReturnType<typeof getSubscriptionAccess>,
) {
  if (access?.tier === SubscriptionTier.PELAJAR) {
    return getPremiumCreditPacks(region);
  }
  return [getBasicCreditPackOffer(region)];
}

// GET /api/adam/student/freemium-status — quota for registered users
router.get('/freemium-status', requireStudent, attachSubscriptionAccess, async (c) => {
  const user = getTokenUser(c)!;
  const access = getSubscriptionAccess(c);
  const status = await getStudentFreemiumStatus(user.userId, access);
  const region = detectRegionFromHeaders(c.req.raw.headers);
  const packs  = creditPacksForAccess(region, access);

  return c.json({
    success: true,
    freemium: freemiumStatusPayload(status),
    credits: {
      balance:      status.creditBalance,
      packs,
      pack:         packs[0],
      paymentWired: isCreditPurchaseWired(),
    },
    tier:     access?.tier ?? 'PENCARIAN',
    payment:  { comingSoon: !isCreditPurchaseWired() },
    kernel:   'Alamtologi',
  });
});

const BuyCreditSchema = z.object({
  packId: z.string().optional().default(CREDIT_PACK_ID),
});

// GET /api/adam/student/credits — wallet + pack pricing
router.get('/credits', requireStudent, attachSubscriptionAccess, async (c) => {
  const user = getTokenUser(c)!;
  const access = getSubscriptionAccess(c);
  const region = detectRegionFromHeaders(c.req.raw.headers);
  const wallet = await getCreditWalletSnapshot(user.userId);
  const packs  = creditPacksForAccess(region, access);

  return c.json({
    success: true,
    wallet,
    packs,
    pack:         packs[0],
    paymentWired: isCreditPurchaseWired(),
    kernel:       'Alamtologi',
  });
});

// POST /api/adam/student/credits/buy — purchase credit pack (payment gateway when wired)
router.post('/credits/buy', requireStudent, attachSubscriptionAccess, zValidator('json', BuyCreditSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const access = getSubscriptionAccess(c);
  const region = detectRegionFromHeaders(c.req.raw.headers);
  const pack = resolveCreditPack(body.packId, region);

  if (!pack) {
    return c.json({ success: false, error: 'Unknown credit pack.' }, 400);
  }

  const allowed = creditPacksForAccess(region, access);
  if (!allowed.some((p) => p.id === pack.id)) {
    return c.json({ success: false, error: 'Credit pack not available for your plan.' }, 400);
  }

  if (!isCreditPurchaseWired()) {
    return c.json({
      success:      false,
      comingSoon:   true,
      error:        'Credit checkout is opening soon.',
      pack,
      packs:        allowed,
      creditsUrl:   '/adam/credits',
      kernel:       'ALAMTOLOGI',
    }, 503);
  }

  // Future: create Stripe checkout for credit pack, grant on webhook confirm.
  return c.json({
    success: false,
    error:   'Credit checkout is not configured yet.',
    kernel:  'ALAMTOLOGI',
  }, 503);
});

// GET /api/adam/student/register-status — public registration gate
router.get('/register-status', (c) => {
  const googleSignupEnabled = isGoogleSignInEnabled();
  return c.json({
    success:             true,
    enabled:             isStudentSelfRegisterEnabled(),
    googleSignupEnabled,
    requiresCode:        studentRegisterRequiresCode(),
    kernel:              'Alamtologi',
  });
});

// POST /api/adam/student/register — self-service student account (when enabled)
router.post('/register', zValidator('json', RegisterSchema), async (c) => {
  if (!isStudentSelfRegisterEnabled()) {
    return c.json({
      success: false,
      error:   'Registration is closed.',
      kernel:  'ALAMTOLOGI',
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
      kernel:  'ALAMTOLOGI',
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
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
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
      kernel:  'ALAMTOLOGI',
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
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 401);
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
    kernel:  'ALAMTOLOGI',
  });
});

// POST /api/adam/student/reset-password
router.post('/reset-password', zValidator('json', ResetPasswordSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    await completeStudentPasswordReset(body.token, body.newPassword);
    return c.json({ success: true, message: 'Password updated. You can sign in now.', kernel: 'ALAMTOLOGI' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reset failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/student/change-password — logged-in student
router.post('/change-password', requireStudent, zValidator('json', ChangePasswordSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  try {
    await changeStudentPassword(user.userId, body.currentPassword, body.newPassword);
    return c.json({ success: true, message: 'Password updated.', kernel: 'ALAMTOLOGI' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Password change failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/student/login
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const userId = resolveStudentLoginUserId(username);

  if (!userId) {
    console.warn('[adam:student-login] unknown login id', { username: username.trim().slice(0, 40) });
    await new Promise((r) => setTimeout(r, 800));
    return c.json({ success: false, error: 'Access denied.', kernel: 'ALAMTOLOGI' }, 401);
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
    return c.json({ success: false, error: 'Access denied.', kernel: 'ALAMTOLOGI' }, 401);
  }

  const token = issueAdamToken({
    userId:    account.userId,
    role:      'student',
    name:      account.name,
    isFounder: false,
  });

  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
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
    kernel: 'ALAMTOLOGI',
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
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/student/group/session
router.get('/group/session', requireStudent, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  return c.json({ success: true, sessionId, kernel: 'ALAMTOLOGI' });
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
          `event: freemium_status\ndata: ${JSON.stringify(freemiumStatusPayload(freemium))}\n\n`,
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

// POST /api/adam/student/group/chat
router.post('/group/chat', requireStudent, requireActiveSubscription, zValidator('json', ChatSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const sessionId = await getOrCreateGroupSession();

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  const groupMessage = body.message?.trim() ?? '';

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

// GET /api/adam/student/chat/history/:sessionId
router.get('/chat/history/:sessionId', requireStudent, async (c) => {
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

// DELETE /api/adam/student/chat/history/:sessionId — clear private chat
router.delete('/chat/history/:sessionId', requireStudent, async (c) => {
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

// GET /api/adam/student/group/history
router.get('/group/history', requireStudent, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  const messages = await loadMessageHistory(sessionId, 100);
  return c.json({ success: true, messages, sessionId, kernel: 'ALAMTOLOGI' });
});

// DELETE /api/adam/student/chat/messages/:messageId
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
