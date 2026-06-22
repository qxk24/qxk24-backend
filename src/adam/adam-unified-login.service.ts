/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Unified Login
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

import { sign } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import { getFounderPassword, verifyFounderPassword } from '../config/founder-auth';
import {
  getAccountLane,
  getAccountRole,
} from './adam-student-registry.service';
import {
  getStudentAccount,
  issueAdamToken,
  resolveStudentLoginUserIdAsync,
  verifyStudentPassword,
} from './adam-student.service';
import { FOUNDER_USER_ID } from './adam-student.types';

const FOUNDER_DISPLAY_NAME = 'Masa Bayu';

export type UnifiedLoginSuccess =
  | {
      kind:         'founder';
      token:        string;
      userId:       string;
      name:         string;
      role:         'founder';
      accountLane?: undefined;
    }
  | {
      kind:         'student';
      token:        string;
      userId:       string;
      name:         string;
      role:         'student' | 'guru';
      accountLane:  'umum' | 'pelajar';
    };

export type UnifiedLoginFailure = {
  kind:   'failure';
  error:  string;
  hint?:  string;
  status: 401 | 503;
};

export type UnifiedLoginResult = UnifiedLoginSuccess | UnifiedLoginFailure;

function issueFounderToken(): string {
  return sign(
    {
      userId:    FOUNDER_USER_ID,
      role:      'founder',
      isFounder: true,
      name:      FOUNDER_DISPLAY_NAME,
      kernel:    ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
    },
    ENV.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

function founderDeniedHint(submitted: string, expected: string): string {
  const lengthMismatch = submitted.length !== expected.length;
  return lengthMismatch
    ? `You entered ${submitted.length} characters; this server expects ${expected.length}. Check # and * at the end.`
    : 'Incorrect email or password. Try again or use Forgot password.';
}

async function authDelay(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/** One sign-in for founder and students — founder password only when username is blank. */
export async function attemptUnifiedAdamLogin(
  username: string,
  password: string,
): Promise<UnifiedLoginResult> {
  const submitted = password.trim();
  const loginId = username.trim();
  const founderPassword = getFounderPassword();

  if (!loginId && founderPassword && verifyFounderPassword(submitted, founderPassword)) {
    const token = issueFounderToken();
    return {
      kind:   'founder',
      token,
      userId: FOUNDER_USER_ID,
      name:   FOUNDER_DISPLAY_NAME,
      role:   'founder',
    };
  }

  if (!loginId) {
    await authDelay(800);
    if (!founderPassword) {
      return {
        kind:   'failure',
        error:  'Founder login is not configured on this server.',
        status: 503,
      };
    }
    return {
      kind:   'failure',
      error:  'Access denied.',
      hint:   founderDeniedHint(submitted, founderPassword),
      status: 401,
    };
  }

  const userId = await resolveStudentLoginUserIdAsync(loginId);
  if (!userId) {
    console.warn('[adam:unified-login] unknown login id', { username: loginId.slice(0, 40) });
    await authDelay(800);
    return {
      kind:   'failure',
      error:  'Access denied.',
      hint:   founderPassword ? founderDeniedHint(submitted, founderPassword) : undefined,
      status: 401,
    };
  }

  const account = getStudentAccount(userId);
  const passwordOk = account
    ? await verifyStudentPassword(account.userId, submitted)
    : false;

  if (!account || !passwordOk) {
    console.warn('[adam:unified-login] access denied', {
      userId,
      hasAccount: Boolean(account),
      passwordOk,
    });
    await authDelay(800);
    return {
      kind:   'failure',
      error:  'Access denied.',
      status: 401,
    };
  }

  const accountRole = await getAccountRole(account.userId);
  const accountLane = await getAccountLane(account.userId);
  const token = issueAdamToken({
    userId:       account.userId,
    role:         accountRole,
    name:         account.name,
    isFounder:    false,
    accountLane,
  });

  return {
    kind:        'student',
    token,
    userId:      account.userId,
    name:        account.name,
    role:        accountRole,
    accountLane,
  };
}
