/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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
import { getTokenUser, requireStudent, requireStudentOrGuru } from '../../middleware/auth.middleware';
import {
  requireActiveSubscription,
  requireTutorSubscription,
  getSubscriptionAccess,
} from '../../middleware/subscription-guard.middleware';
import {
  isTutorBillingEnforced,
  resolveTutorSubscriptionAccess,
} from '../../adam/adam-tutor-subscription.service';
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
import {
  getMacBridgeDashboardSettings,
  setMacBridgeRoutingForUser,
} from '../../adam/adam-mac-bridge-settings.service';
import { detectRegionFromHeaders } from '../../subscriptions/region-detector.service';
import {
  CREDIT_PACK_ID,
  getPremiumCreditPacks,
  resolveCreditPack,
  getCreditWalletSnapshot,
  isCreditPurchaseWired,
  extraMessageCostCents,
} from '../../freemium/adam-freemium-credit.service';
import { createAdamCreditCheckoutSession } from '../../freemium/adam-credit-stripe.service';
import { SubscriptionTier } from '../../subscriptions/subscription.schema';
import {
  checkTesterLimit,
  isTesterAccount,
} from '../../tester/alm-tester.service';
import {
  streamADAMChat,
  getOrCreateSession,
  createNewChatSession,
  listUserChatSessions,
  renameUserChatSession,
  deleteUserChatSession,
  resolveStudentChatSession,
  resolveTutorChatSession,
  loadMessageHistory,
  deleteFounderMessage,
  assertCanClearSessionChat,
  clearSessionChatHistory,
  getOrCreateGroupSession,
} from '../../adam/adam-chat.service';
import { attemptUnifiedAdamLogin } from '../../adam/adam-unified-login.service';
import {
  getStudentAccounts,
  issueAdamToken,
} from '../../adam/adam-student.service';
import {
  isStudentSelfRegisterEnabled,
} from '../../adam/adam-platform-settings.service';
import {
  registerStudentSelf,
  slugStudentUserId,
  studentRegisterRequiresCode,
  getAccountRole,
  getAccountLane,
} from '../../adam/adam-student-registry.service';
import {
  guardPelajarLane,
  guardUmumLane,
} from '../../adam/adam-account-lane-guard';
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
import {
  getTutorProfile,
  saveTutorProfile,
} from '../../adam/adam-tutor-profile.service';

const router = new Hono();

const LoginSchema = z.object({
  username: z.string().optional().default(''),
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
  accountLane:  z.enum(['umum', 'pelajar']).optional(),
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
  mode:         z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN', 'TUTOR']).default('QUESTIONING'),
  answerStyle:  z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:    z.array(z.string().min(1)).max(5).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

const TutorProfileSchema = z.object({
  level:      z.enum(['primary', 'secondary', 'university']),
  curriculum: z.enum([
    'national', 'international', 'us', 'uk', 'other',
    'kpm', 'cambridge', 'mixed', // legacy clients
  ]),
  language:   z.enum([
    'english', 'malay', 'arabic', 'mandarin', 'tamil',
    'indonesian', 'spanish', 'french', 'other',
  ]).optional(),
  yearLabel:   z.string().max(64).optional(),
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  localeNote:  z.string().max(120).optional(),
});

const TutorChatSchema = z.object({
  sessionId:     z.string().optional(),
  message:       z.string().max(100_000).optional(),
  answerStyle:   z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:     z.array(z.string().min(1)).max(5).optional(),
  tutorProfile:  TutorProfileSchema.optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

// GET /api/adam/student/pulse — learning command board aggregate
router.get('/pulse', requireStudentOrGuru, async (c) => {
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

const MacBridgeToggleSchema = z.object({
  open: z.boolean(),
});

// GET /api/adam/student/mac-bridge — Profesional+ local file bridge status
router.get('/mac-bridge', requireStudentOrGuru, async (c) => {
  const user = getTokenUser(c)!;
  return c.json({
    success: true,
    ...await getMacBridgeDashboardSettings(user.userId, false),
    kernel: 'ALAMTOLOGI',
  });
});

// PATCH /api/adam/student/mac-bridge — open/close bridge routing (Profesional+)
router.patch(
  '/mac-bridge',
  requireStudentOrGuru,
  zValidator('json', MacBridgeToggleSchema),
  async (c) => {
    const user = getTokenUser(c)!;
    const { open } = c.req.valid('json');
    try {
      const result = await setMacBridgeRoutingForUser(user.userId, false, open, user.userId);
      return c.json({
        success: true,
        ...await getMacBridgeDashboardSettings(user.userId, false),
        open:   result.open,
        kernel: 'ALAMTOLOGI',
      });
    } catch (err) {
      return c.json({ success: false, error: (err as Error).message }, 400);
    }
  },
);

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
  access: ReturnType<typeof getSubscriptionAccess>,
) {
  if (access?.tier === SubscriptionTier.PRO || access?.tier === SubscriptionTier.PROFESIONAL) {
    return getPremiumCreditPacks();
  }
  return [];
}

// GET /api/adam/student/freemium-status — quota for registered users
router.get('/freemium-status', requireStudent, attachSubscriptionAccess, async (c) => {
  const user = getTokenUser(c)!;
  const access = getSubscriptionAccess(c);
  const status = await getStudentFreemiumStatus(user.userId, access);
  const region = detectRegionFromHeaders(c.req.raw.headers);
  const packs  = creditPacksForAccess(access);

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
  const packs  = creditPacksForAccess(access);

  return c.json({
    success: true,
    wallet,
    packs,
    pack:         packs[0] ?? null,
    extraMessageCost: extraMessageCostCents() / 100,
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
  const pack = resolveCreditPack(body.packId);

  if (!pack) {
    return c.json({ success: false, error: 'Unknown credit pack.' }, 400);
  }

  const allowed = creditPacksForAccess(access);
  if (!allowed.length || !allowed.some((p) => p.id === pack.id)) {
    return c.json({
      success: false,
      error:   access?.tier === SubscriptionTier.PRO || access?.tier === SubscriptionTier.PROFESIONAL
        ? 'Credit pack not available for your plan.'
        : 'Usage credits are available on Pro only. Upgrade at /pricing.',
    }, 403);
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

  try {
    const checkout = await createAdamCreditCheckoutSession({
      userId: user.userId ?? '',
      packId: pack.id,
    });
    return c.json({
      success:     true,
      checkoutUrl: checkout.checkoutUrl,
      sessionId:   checkout.sessionId,
      pack,
      kernel:      'ALAMTOLOGI',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Credit checkout failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 503);
  }
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
      accountLane:  body.accountLane,
    });

    const token = issueAdamToken({
      userId:       created.userId,
      role:         'student',
      name:         created.name,
      isFounder:    false,
      accountLane:  created.accountLane,
    });

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data: {
        token,
        userId:      created.userId,
        name:        created.name,
        role:        'student',
        accountLane: created.accountLane,
        expiresIn:   '30d',
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
    const accountRole = await getAccountRole(account.userId);
    const accountLane = await getAccountLane(account.userId);
    const token = issueAdamToken({
      userId:       account.userId,
      role:         accountRole,
      name:         account.name,
      isFounder:    false,
      accountLane,
    });
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data: {
        token,
        userId:      account.userId,
        name:        account.name,
        role:        accountRole,
        accountLane,
        expiresIn:   '30d',
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

// POST /api/adam/student/login — unified sign-in (founder password or student account)
router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const result = await attemptUnifiedAdamLogin(username, password);

  if (result.kind === 'failure') {
    return c.json(
      {
        success: false,
        error:   result.error,
        hint:    result.hint,
        kernel:  'ALAMTOLOGI',
      },
      result.status,
    );
  }

  if (result.kind === 'founder') {
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data: {
        token:       result.token,
        role:        'founder',
        userId:      result.userId,
        name:        result.name,
        founderName: result.name,
        expiresIn:   '30d',
      },
      timestamp: new Date().toISOString(),
    });
  }

  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data: {
      token:       result.token,
      role:        result.role,
      userId:      result.userId,
      name:        result.name,
      accountLane: result.accountLane,
      expiresIn:   '30d',
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

// GET /api/adam/student/session — optional ?sessionId= for recents sidebar
router.get('/session', requireStudent, async (c) => {
  const laneBlock = await guardUmumLane(c);
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
    userId:  user.userId,
    name:    user.name,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/student/chat/sessions — ChatGPT-style recents
router.get('/chat/sessions', requireStudent, async (c) => {
  const laneBlock = await guardUmumLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const rawLimit = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
  const sessions = await listUserChatSessions(user.userId, 'student', limit);
  return c.json({
    success: true,
    sessions,
    count:   sessions.length,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/student/chat/sessions — new chat thread
router.post('/chat/sessions', requireStudent, async (c) => {
  const laneBlock = await guardUmumLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = await createNewChatSession(user.userId, 'student');
  return c.json({
    success: true,
    sessionId,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

const SessionTitleSchema = z.object({
  title: z.string().min(1).max(72),
});

// PATCH /api/adam/student/chat/sessions/:sessionId — rename thread
router.patch('/chat/sessions/:sessionId', requireStudent, zValidator('json', SessionTitleSchema), async (c) => {
  const laneBlock = await guardUmumLane(c);
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

// DELETE /api/adam/student/chat/sessions/:sessionId — remove thread
router.delete('/chat/sessions/:sessionId', requireStudent, async (c) => {
  const laneBlock = await guardUmumLane(c);
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

// GET /api/adam/student/group/session
router.get('/group/session', requireStudent, async (c) => {
  const laneBlock = await guardUmumLane(c);
  if (laneBlock) return laneBlock;
  const sessionId = await getOrCreateGroupSession();
  return c.json({ success: true, sessionId, kernel: 'ALAMTOLOGI' });
});

// POST /api/adam/student/chat — private 1:1 (umum / ADAM Learn)
router.post('/chat', requireStudent, requireActiveSubscription, zValidator('json', ChatSchema), async (c) => {
  const laneBlock = await guardUmumLane(c);
  if (laneBlock) return laneBlock;
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
  const laneBlock = await guardUmumLane(c);
  if (laneBlock) return laneBlock;
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
  const laneBlock = await guardUmumLane(c);
  if (laneBlock) return laneBlock;
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
  const laneBlock = await guardUmumLane(c);
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

// GET /api/adam/student/group/history
router.get('/group/history', requireStudent, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  const messages = await loadMessageHistory(sessionId, 100);
  return c.json({ success: true, messages, sessionId, kernel: 'ALAMTOLOGI' });
});

// ─── ADAM Tutor (conventional academics — separate lane) ───────

router.get('/tutor/profile', requireStudent, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const profile = await getTutorProfile(user.userId);
  return c.json({
    success: true,
    profile,
    kernel: 'ALAMTOLOGI',
  });
});

router.put('/tutor/profile', requireStudent, zValidator('json', TutorProfileSchema), async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const profile = await saveTutorProfile(user.userId, body);
  return c.json({
    success: true,
    profile,
    kernel: 'ALAMTOLOGI',
  });
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

router.get('/tutor/session', requireStudent, requireTutorSubscription, async (c) => {
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
    userId:  user.userId,
    name:    user.name,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.get('/tutor/chat/sessions', requireStudent, requireTutorSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const rawLimit = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
  const sessions = await listUserChatSessions(user.userId, 'tutor', limit);
  return c.json({
    success: true,
    sessions,
    count:   sessions.length,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.patch('/tutor/chat/sessions/:sessionId', requireStudent, requireTutorSubscription, zValidator('json', SessionTitleSchema), async (c) => {
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

router.delete('/tutor/chat/sessions/:sessionId', requireStudent, requireTutorSubscription, async (c) => {
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

router.post('/tutor/chat/sessions', requireStudent, requireTutorSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const sessionId = await createNewChatSession(user.userId, 'tutor');
  return c.json({
    success: true,
    sessionId,
    kernel:  'ALAMTOLOGI',
    timestamp: new Date().toISOString(),
  });
});

router.get('/tutor/chat/history/:sessionId', requireStudent, requireTutorSubscription, async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
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

// DELETE /api/adam/student/tutor/chat/history/:sessionId — clear tutor chat
router.delete('/tutor/chat/history/:sessionId', requireStudent, requireTutorSubscription, async (c) => {
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
      success:      true,
      sessionId,
      deletedCount,
      kernel:       'ALAMTOLOGI',
      timestamp:    new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not clear chat.';
    const status = msg.includes('denied') || msg.includes('cannot') ? 403 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

router.post('/tutor/chat', requireStudent, requireTutorSubscription, zValidator('json', TutorChatSchema), async (c) => {
  const laneBlock = await guardPelajarLane(c);
  if (laneBlock) return laneBlock;
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');

  let sessionId = body.sessionId;
  if (!sessionId) sessionId = await resolveTutorChatSession(user.userId);

  const message = body.message?.trim() ?? '';

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      if (message) {
        const layerGate = await runLayerGatePreCheck({
          userId:    user.userId,
          message,
          mode:      'TUTOR',
          isFounder: false,
          userName:  user.name ?? user.userId,
        });
        if (!layerGate.allowed) {
          await streamLayerGateBlockedTurn(s, sessionId!, layerGate);
          return;
        }
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
          { answerStyle: body.answerStyle, tutorProfile: body.tutorProfile },
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ADAM stream failed';
      await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
    }
    await s.write('event: adam_done\ndata: {}\n\n');
  });
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
