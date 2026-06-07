/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Google Sign-In
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/environments';
import { loginStudentWithGoogle } from './adam-student-registry.service';

let oauthClient: OAuth2Client | null = null;

export function isGoogleSignInEnabled(): boolean {
  return ENV.ADAM_GOOGLE_SIGNIN_ENABLED && Boolean(ENV.GOOGLE_OAUTH_CLIENT_ID.trim());
}

export function publicGoogleClientId(): string {
  return isGoogleSignInEnabled() ? ENV.GOOGLE_OAUTH_CLIENT_ID.trim() : '';
}

function getClient(): OAuth2Client {
  if (!oauthClient) {
    oauthClient = new OAuth2Client(ENV.GOOGLE_OAUTH_CLIENT_ID.trim());
  }
  return oauthClient;
}

export async function verifyGoogleIdToken(idToken: string): Promise<{
  googleSub: string;
  email:     string;
  name:      string;
  emailVerified: boolean;
}> {
  if (!isGoogleSignInEnabled()) {
    throw new Error('Google sign-in is not enabled on this stack.');
  }

  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: ENV.GOOGLE_OAUTH_CLIENT_ID.trim(),
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Google account did not return a verified email.');
  }

  if (!payload.email_verified) {
    throw new Error('Google email is not verified.');
  }

  const allowed = ENV.GOOGLE_ALLOWED_EMAIL_DOMAINS
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length > 0) {
    const domain = payload.email.split('@')[1]?.toLowerCase() ?? '';
    if (!allowed.includes(domain)) {
      throw new Error('This Google account is not on an allowed email domain.');
    }
  }

  return {
    googleSub:       payload.sub,
    email:           payload.email.toLowerCase(),
    name:            payload.name?.trim() || payload.email.split('@')[0],
    emailVerified:   Boolean(payload.email_verified),
  };
}

export async function authenticateGoogleIdToken(idToken: string) {
  const profile = await verifyGoogleIdToken(idToken);
  return loginStudentWithGoogle(profile);
}
