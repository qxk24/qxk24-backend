/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Auth Middleware
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import type { QXK24TokenPayload } from '../middleware/auth.middleware';
import { NiagaLicenseStatus } from './niaga.types';
import { resolveNiagaPartnerLicense } from './niaga-partner-portal.service';
import { resolveNiagaSubscriptionAccess, type NiagaSubscriptionAccess } from './niaga-subscription-access.service';
import type { INiagaPartnerLicense } from './niaga-partner-license.schema';

export const NIAGA_ACCESS_KEY = 'niagaSubscriptionAccess';

export function getNiagaPartnerLicense(c: Context): INiagaPartnerLicense | null {
  return c.get('niagaPartnerLicense') as INiagaPartnerLicense | undefined ?? null;
}

export function getNiagaSubscriptionAccess(c: Context): NiagaSubscriptionAccess | null {
  return c.get(NIAGA_ACCESS_KEY) as NiagaSubscriptionAccess | undefined ?? null;
}

export async function requireNiagaPartner(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const channelCode = c.req.header('X-Niaga-Channel-Code')?.trim();
  const portalToken = c.req.header('X-Niaga-Portal-Token')?.trim();

  if (!channelCode || !portalToken) {
    return c.json({
      success: false,
      error:   'Channel code and portal token required.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }

  const license = await resolveNiagaPartnerLicense(channelCode, portalToken);
  if (!license) {
    return c.json({
      success: false,
      error:   'Invalid channel credentials.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  if (license.status !== NiagaLicenseStatus.ACTIVE) {
    return c.json({
      success: false,
      error:   'Channel license is not active.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  c.set('niagaPartnerLicense', license);
  await next();
}

export async function requireNiagaSubscription(
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

  const access = await resolveNiagaSubscriptionAccess(user);
  c.set(NIAGA_ACCESS_KEY, access);

  if (!access.canChat) {
    return c.json({
      success:     false,
      error:       access.message ?? 'ADAM Niaga subscription required.',
      code:        access.code ?? 'NIAGA_SUBSCRIPTION_REQUIRED',
      upgradeUrl:  access.upgradeUrl,
      registerUrl: access.registerUrl,
      monthlyMYR:  access.monthlyMYR,
      usage:       access.usage,
      kernel:      'ALAMTOLOGI',
    }, 402);
  }

  await next();
}
