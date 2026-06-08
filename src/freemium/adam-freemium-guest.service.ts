/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Guest Tracker
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import { AdamGuestFreemiumModel } from './adam-freemium.schema';

export interface GuestQuotaSnapshot {
  guestId:             string;
  questionsUsed:       number;
  questionsRemaining:  number;
  lifetimeLimit:       number;
  limitReached:        boolean;
  registerGate:        boolean;
}

export function guestLifetimeLimit(): number {
  return ENV.ADAM_FREEMIUM_GUEST_LIMIT;
}

export function isGuestUserId(userId: string): boolean {
  return userId.startsWith('guest:');
}

export function guestSessionUserId(guestId: string): string {
  return `guest:${guestId}`;
}

export function newGuestId(): string {
  return crypto.randomUUID();
}

export function normalizeGuestId(raw: string | undefined | null): string | null {
  const id = (raw ?? '').trim();
  if (!id) return null;
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) return null;
  return id;
}

export async function getGuestQuotaSnapshot(guestId: string): Promise<GuestQuotaSnapshot> {
  const limit = guestLifetimeLimit();
  const doc = await AdamGuestFreemiumModel.findOne({ guestId }).lean();
  const used = doc?.questionsUsed ?? 0;

  return {
    guestId,
    questionsUsed:      used,
    questionsRemaining: Math.max(0, limit - used),
    lifetimeLimit:      limit,
    limitReached:       used >= limit,
    registerGate:       used >= limit,
  };
}

/** Reserve one guest question — lifetime cap, no daily reset. */
export async function reserveGuestQuestion(
  guestId: string,
  sessionId?: string,
): Promise<GuestQuotaSnapshot> {
  const limit = guestLifetimeLimit();
  const doc = await AdamGuestFreemiumModel.findOneAndUpdate(
    { guestId },
    {
      $inc: { questionsUsed: 1 },
      ...(sessionId ? { $set: { lastSessionId: sessionId } } : {}),
    },
    { upsert: true, new: true },
  ).lean();

  const used = doc?.questionsUsed ?? 1;
  return {
    guestId,
    questionsUsed:      used,
    questionsRemaining: Math.max(0, limit - used),
    lifetimeLimit:      limit,
    limitReached:       used > limit,
    registerGate:       used > limit,
  };
}

export async function canGuestAsk(guestId: string): Promise<boolean> {
  const snap = await getGuestQuotaSnapshot(guestId);
  return snap.questionsUsed < snap.lifetimeLimit;
}
