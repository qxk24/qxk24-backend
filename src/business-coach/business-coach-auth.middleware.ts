/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Auth Middleware
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import type { QXK24TokenPayload } from '../middleware/auth.middleware';
import {
  resolveBusinessCoachSubscriptionAccess,
  type BusinessCoachSubscriptionAccess,
} from './business-coach-subscription-access.service';

export const BUSINESS_COACH_ACCESS_KEY = 'businessCoachSubscriptionAccess';

export function getBusinessCoachSubscriptionAccess(
  c: Context,
): BusinessCoachSubscriptionAccess | null {
  return c.get(BUSINESS_COACH_ACCESS_KEY) as BusinessCoachSubscriptionAccess | undefined ?? null;
}

export async function requireBusinessCoachSubscription(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error:   'Authorization token required.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }

  const token = authHeader.split(' ')[1];

  let user: QXK24TokenPayload;
  try {
    user = verify(token, ENV.JWT_SECRET) as QXK24TokenPayload;
    if (user.role !== 'founder' && user.role !== 'student' && user.role !== 'guru') {
      return c.json({
        success: false,
        error:   'ADAM access required.',
        kernel:  'ALAMTOLOGI',
      }, 403);
    }
    c.set('qxk24User', user);
  } catch {
    return c.json({
      success: false,
      error:   'Invalid or expired token.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }

  const access = await resolveBusinessCoachSubscriptionAccess(user);
  c.set(BUSINESS_COACH_ACCESS_KEY, access);

  if (!access.canChat) {
    return c.json({
      success:     false,
      error:       access.message ?? 'ADAM Business Coach subscription required.',
      code:        'BUSINESS_COACH_SUBSCRIPTION_REQUIRED',
      registerUrl: access.registerUrl,
      checkoutUrl: access.checkoutUrl,
      access,
      kernel:      'ALAMTOLOGI',
    }, 402);
  }

  await next();
}
