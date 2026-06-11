/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Student Kelas Access
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-11
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Student kelas access: Premium (Layer 1) OR Pas Kelas (Layer 2) OR guru seat quota.
 */

import { ENV } from '../config/environments';
import {
  AdamServerSubscriptionModel,
  AdamServerSubscriptionStatus,
} from '../adam-servers/adam-server.schema';
import { AdamServerId, AdamServerTier } from '../adam-servers/adam-server.types';
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionTier,
} from '../subscriptions/subscription.schema';
import { AdamGuruKelasModel, AdamGuruMemberModel } from './adam-guru.schema';

export type StudentKelasAccessReason =
  | 'founder'
  | 'guru'
  | 'premium'
  | 'pas_kelas'
  | 'guru_seat'
  | 'none';

export interface StudentKelasAccess {
  canAccess:        boolean;
  reason:           StudentKelasAccessReason;
  code?:            'KELAS_ACCESS_REQUIRED';
  message?:         string;
  premium:          boolean;
  pasKelas:         boolean;
  guruSeat:         boolean;
  guruSeatsUsed?:   number;
  guruSeatsLimit?:  number;
  guruSeatRank?:    number;
  pasKelasPriceMYR: number;
  upgradeUrl:       string;
  premiumUrl:       string;
}

export const PAS_KELAS_PRICE_MYR = 15;

const GURU_PLAN_TIERS = [
  AdamServerTier.STARTER,
  AdamServerTier.PROFESSIONAL,
  AdamServerTier.INSTITUTION,
] as const;

function appUrl(path: string): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://alamtologi.com').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function hasActivePremiumLayer1(userId: string): Promise<boolean> {
  const paidSub = await SubscriptionModel.findOne({
    userId,
    tier:   { $in: [SubscriptionTier.PELAJAR, SubscriptionTier.PROFESIONAL, SubscriptionTier.ENTERPRISE] },
    status: SubscriptionStatus.ACTIVE,
  }).sort({ updatedAt: -1 }).lean();

  if (!paidSub) return false;
  if (paidSub.currentPeriodEnd && paidSub.currentPeriodEnd < new Date()) return false;
  return true;
}

export async function hasActivePasKelas(userId: string): Promise<boolean> {
  const row = await AdamServerSubscriptionModel.findOne({
    userId,
    serverId: AdamServerId.GURU,
    tier:     AdamServerTier.STUDENT_KELAS,
    status:   AdamServerSubscriptionStatus.ACTIVE,
  }).lean();
  return Boolean(row);
}

export async function getGuruActivePlan(guruId: string) {
  return AdamServerSubscriptionModel.findOne({
    userId:   guruId,
    serverId: AdamServerId.GURU,
    tier:     { $in: GURU_PLAN_TIERS },
    status:   AdamServerSubscriptionStatus.ACTIVE,
  }).lean();
}

/** Unique students across all guru kelas, earliest join first (seat order). */
export async function listGuruStudentsBySeatOrder(guruId: string): Promise<Array<{
  userId:   string;
  joinedAt: Date;
}>> {
  const kelasRows = await AdamGuruKelasModel.find({ guruId, active: true }).lean();
  const kelasIds = kelasRows.map((k) => k.kelasId);
  if (!kelasIds.length) return [];

  const members = await AdamGuruMemberModel.find({
    kelasId: { $in: kelasIds },
    role:    'student',
  }).lean();

  const earliest = new Map<string, Date>();
  for (const m of members) {
    const prev = earliest.get(m.userId);
    const joined = m.joinedAt instanceof Date ? m.joinedAt : new Date(m.joinedAt);
    if (!prev || joined < prev) earliest.set(m.userId, joined);
  }

  return Array.from(earliest.entries())
    .map(([userId, joinedAt]) => ({ userId, joinedAt }))
    .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
}

export async function resolveGuruSeatForStudent(
  guruId: string,
  studentUserId: string,
  opts?: { includeProspectiveJoin?: boolean },
): Promise<{
  hasSeat:  boolean;
  used:     number;
  limit:    number;
  rank:     number | null;
}> {
  const plan = await getGuruActivePlan(guruId);
  if (!plan || plan.monthlyLimit <= 0) {
    return { hasSeat: false, used: 0, limit: 0, rank: null };
  }

  const ordered = await listGuruStudentsBySeatOrder(guruId);
  let rank = ordered.findIndex((s) => s.userId === studentUserId);
  const isMember = rank >= 0;

  if (!isMember && opts?.includeProspectiveJoin) {
    rank = ordered.length;
  } else if (!isMember) {
    return { hasSeat: false, used: ordered.length, limit: plan.monthlyLimit, rank: null };
  }

  const seatRank = rank + 1;
  return {
    hasSeat: seatRank <= plan.monthlyLimit,
    used:    ordered.length,
    limit:   plan.monthlyLimit,
    rank:    seatRank,
  };
}

export async function resolveStudentKelasAccess(input: {
  userId:     string;
  guruId:     string;
  memberRole: 'guru' | 'student';
  isFounder?: boolean;
  /** When false (invite preview), count prospective join for guru seat availability. */
  isMember?:  boolean;
}): Promise<StudentKelasAccess> {
  const premiumUrl = appUrl('/plans');
  const upgradeUrl = premiumUrl;

  const base: StudentKelasAccess = {
    canAccess:        false,
    reason:           'none',
    premium:          false,
    pasKelas:         false,
    guruSeat:         false,
    pasKelasPriceMYR: PAS_KELAS_PRICE_MYR,
    upgradeUrl,
    premiumUrl,
  };

  if (input.isFounder) {
    return { ...base, canAccess: true, reason: 'founder' };
  }

  if (input.memberRole === 'guru') {
    return { ...base, canAccess: true, reason: 'guru' };
  }

  const [premium, pasKelas, seat] = await Promise.all([
    hasActivePremiumLayer1(input.userId),
    hasActivePasKelas(input.userId),
    resolveGuruSeatForStudent(input.guruId, input.userId, {
      includeProspectiveJoin: input.isMember === false,
    }),
  ]);

  if (premium) {
    return {
      ...base,
      canAccess: true,
      reason:    'premium',
      premium:   true,
    };
  }

  if (pasKelas) {
    return {
      ...base,
      canAccess: true,
      reason:    'pas_kelas',
      pasKelas:  true,
    };
  }

  if (seat.hasSeat) {
    return {
      ...base,
      canAccess:       true,
      reason:          'guru_seat',
      guruSeat:        true,
      guruSeatsUsed:   seat.used,
      guruSeatsLimit:  seat.limit,
      guruSeatRank:    seat.rank ?? undefined,
    };
  }

  const seatFull = seat.limit > 0 && seat.used >= seat.limit;
  const guruNoPlan = seat.limit === 0;

  let message = 'Akses kelas memerlukan Premium, Pas Kelas (RM 15/bulan), atau tempat dalam kuota guru.';
  if (guruNoPlan) {
    message = 'Guru belum mempunyai pelan ADAMGuru aktif. Langgan Premium atau Pas Kelas untuk masuk kelas.';
  } else if (seatFull && input.isMember !== false) {
    message = `Kuota pelajar guru penuh (${seat.used}/${seat.limit}). Langgan Pas Kelas (RM 15/bulan) atau Premium untuk teruskan.`;
  } else if (seatFull) {
    message = `Kuota pelajar guru penuh (${seat.used}/${seat.limit}). Langgan Pas Kelas (RM 15/bulan) atau Premium sebelum menerima jemputan.`;
  }

  return {
    ...base,
    code:            'KELAS_ACCESS_REQUIRED',
    message,
    guruSeatsUsed:   seat.used,
    guruSeatsLimit:  seat.limit,
    guruSeatRank:    seat.rank ?? undefined,
  };
}
