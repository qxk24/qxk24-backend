/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Auth Routes
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
import { zValidator } from '@hono/zod-validator';
import { ENV } from '../../../config/environments';
import { getTokenUser, requireStudent, requireStudentOrGuru } from '../../../middleware/auth.middleware';
import {
  getMacBridgeDashboardSettings,
  setMacBridgeRoutingForUser,
} from '../../../adam/adam-mac-bridge-settings.service';
import { buildStudentPulse } from '../../../adam/adam-student-pulse.service';
import { attemptUnifiedAdamLogin } from '../../../adam/adam-unified-login.service';
import { getStudentAccounts, issueAdamToken } from '../../../adam/adam-student.service';
import { isStudentSelfRegisterEnabled } from '../../../adam/adam-platform-settings.service';
import {
  registerStudentSelf,
  slugStudentUserId,
  studentRegisterRequiresCode,
  getAccountRole,
  getAccountLane,
} from '../../../adam/adam-student-registry.service';
import {
  authenticateGoogleIdToken,
  isGoogleSignInEnabled,
  publicGoogleClientId,
} from '../../../adam/adam-google-auth.service';
import {
  changeStudentPassword,
  completeStudentPasswordReset,
  isPasswordResetEnabled,
  requestStudentPasswordReset,
} from '../../../adam/adam-password-reset.service';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  GoogleSchema,
  LoginSchema,
  MacBridgeToggleSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from './adam-student.schemas';

const router = new Hono();

router.get('/pulse', requireStudentOrGuru, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const pulse = await buildStudentPulse(user.userId, user.name ?? user.userId);
    return c.json({ success: true, pulse, kernel: 'ALAMTOLOGI' });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.get('/mac-bridge', requireStudentOrGuru, async (c) => {
  try {
    const user = getTokenUser(c)!;
    return c.json({
      success: true,
      ...await getMacBridgeDashboardSettings(user.userId, false),
      kernel: 'ALAMTOLOGI',
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.patch('/mac-bridge', requireStudentOrGuru, zValidator('json', MacBridgeToggleSchema), async (c) => {
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
});

router.get('/auth-config', (c) => {
  return c.json({
    success: true,
    googleEnabled:        isGoogleSignInEnabled(),
    googleClientId:       publicGoogleClientId(),
    passwordResetEnabled: isPasswordResetEnabled(),
    stack:                ENV.QXK24_STACK,
    kernel:               'Alamtologi',
  });
});

router.get('/register-status', (c) => {
  return c.json({
    success:             true,
    enabled:             isStudentSelfRegisterEnabled(),
    googleSignupEnabled: isGoogleSignInEnabled(),
    requiresCode:        studentRegisterRequiresCode(),
    kernel:              'Alamtologi',
  });
});

router.post('/register', zValidator('json', RegisterSchema), async (c) => {
  if (!isStudentSelfRegisterEnabled()) {
    return c.json({ success: false, error: 'Registration is closed.', kernel: 'ALAMTOLOGI' }, 403);
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
      userId:      created.userId,
      role:        'student',
      name:        created.name,
      isFounder:   false,
      accountLane: created.accountLane,
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

router.post('/google', zValidator('json', GoogleSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const account = await authenticateGoogleIdToken(body.idToken, {
      accountLane: body.accountLane,
    });
    const accountRole = await getAccountRole(account.userId);
    const accountLane = await getAccountLane(account.userId);
    const token = issueAdamToken({
      userId:      account.userId,
      role:        accountRole,
      name:        account.name,
      isFounder:   false,
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

router.post('/forgot-password', zValidator('json', ForgotPasswordSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const stack = body.stack ?? (ENV.QXK24_STACK === 'lab' ? 'lab' : 'production');
    const result = await requestStudentPasswordReset(body.email, stack);
    return c.json({
      success: true,
      sent:    result.sent,
      message: result.message,
      kernel:  'ALAMTOLOGI',
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

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

router.post('/login', zValidator('json', LoginSchema), async (c) => {
  try {
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

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.get('/accounts', (c) => {
  return c.json({
    success: true,
    students: getStudentAccounts().map((s) => ({ userId: s.userId, name: s.name })),
    kernel: 'ALAMTOLOGI',
  });
});

export default router;
