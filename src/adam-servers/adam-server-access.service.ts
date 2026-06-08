/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Access (Layer 2)
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

import { ENV } from '../config/environments';
import { malaysiaDateKey } from '../freemium/adam-freemium-date';
import {
  AdamServerSubscriptionModel,
  AdamServerSubscriptionStatus,
  type IAdamServerSubscription,
} from './adam-server.schema';
import { AdamServerId } from './adam-server.types';
import { getServerCatalogEntry } from './adam-server-pricing.config';

export function isLayer2Open(): boolean {
  return ENV.ADAM_LAYER2_ENABLED;
}

export async function getActiveServerSubscription(
  userId: string,
  serverId: AdamServerId,
): Promise<IAdamServerSubscription | null> {
  if (!userId) return null;
  return AdamServerSubscriptionModel.findOne({
    userId,
    serverId,
    status: AdamServerSubscriptionStatus.ACTIVE,
  }).exec();
}

export async function userHasServerAccess(
  userId: string,
  serverId: AdamServerId,
): Promise<boolean> {
  if (!isLayer2Open()) return false;
  const sub = await getActiveServerSubscription(userId, serverId);
  return sub !== null;
}

export interface UserServerStatus {
  serverId:     AdamServerId;
  slug:         string;
  name:         string;
  subscribed:   boolean;
  tier:         string | null;
  monthlyLimit: number | null;
  usedThisMonth: number | null;
}

export async function getUserServerStatuses(userId: string): Promise<UserServerStatus[]> {
  const periodKey = malaysiaDateKey();
  const subs = userId
    ? await AdamServerSubscriptionModel.find({
        userId,
        status: AdamServerSubscriptionStatus.ACTIVE,
      }).exec()
    : [];

  return (Object.values(AdamServerId) as AdamServerId[]).map((serverId) => {
    const catalog = getServerCatalogEntry(serverId);
    const sub = subs.find((s) => s.serverId === serverId && s.periodKey === periodKey)
      ?? subs.find((s) => s.serverId === serverId);
    return {
      serverId,
      slug:          catalog.slug,
      name:          catalog.name,
      subscribed:    Boolean(sub) && isLayer2Open(),
      tier:          sub?.tier ?? null,
      monthlyLimit:  sub?.monthlyLimit ?? null,
      usedThisMonth: sub?.usedThisMonth ?? null,
    };
  });
}

/** Founder/testing — grant server access without payment (manual only). */
export async function grantServerSubscription(
  userId: string,
  serverId: AdamServerId,
  tier: IAdamServerSubscription['tier'],
  monthlyLimit: number,
): Promise<IAdamServerSubscription> {
  const periodKey = malaysiaDateKey();
  return AdamServerSubscriptionModel.findOneAndUpdate(
    { userId, serverId },
    {
      userId,
      serverId,
      tier,
      status:        AdamServerSubscriptionStatus.ACTIVE,
      monthlyLimit,
      usedThisMonth: 0,
      periodKey,
    },
    { upsert: true, new: true },
  ).exec() as Promise<IAdamServerSubscription>;
}
