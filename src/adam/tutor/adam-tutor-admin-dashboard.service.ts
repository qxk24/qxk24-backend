/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Admin Dashboard Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import { TutorAgentModel, TutorAgentStatus } from './adam-tutor-agent.schema';
import { TutorAgentPackageStatus } from './adam-tutor-agent-package.config';
import { TutorAgentWalletLedgerModel } from './adam-tutor-agent-wallet.schema';
import {
  TutorEnrollmentModel,
  TutorEnrollmentStatus,
} from './adam-tutor-enrollment.schema';
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
} from './adam-tutor-register-code.schema';
import { listTutorRegisterCodes } from './adam-tutor-register-code.service';
import { listTutorRegisterPricing } from './adam-tutor-pricing.service';
import { getUsdMyrRate } from './adam-usd-myr-rate.service';
import { marketingEnrollmentFilter } from './adam-tutor-agent-marketing.service';

const ACTIVITY_DAYS = 14;

const BAND_LABELS_EN: Record<TutorSubscriptionLevel, string> = {
  primary:    'Primary',
  secondary:  'Secondary',
  university: 'University',
};

export interface TutorAdminActivityPoint {
  date:              string;
  label:             string;
  enrollments:       number;
  pinsRedeemed:      number;
  agentsRegistered:  number;
}

export interface TutorAdminDistributionSlice {
  name:  string;
  value: number;
}

export interface TutorAdminAgentSummary {
  agentId:            string;
  agentCode:          string;
  orgName:            string;
  contactName:        string;
  email:              string;
  state:              string;
  status:             string;
  packageStatus:      string;
  packageTier:        string | null;
  packageTierLabel:   string | null;
  band:               string | null;
  bandLabel:          string | null;
  pinBalance:         number;
  pinPurchasedTotal:  number;
  codesAvailable:     number;
  codesRedeemed:      number;
  studentsTotal:      number;
  studentsPaid:       number;
  walletBalanceMyr:   number;
  totalCommissionMyr: number;
  commissionPercent:  number;
  createdAt:          string;
}

export interface TutorAdminDashboardData {
  pricing:               Awaited<ReturnType<typeof listTutorRegisterPricing>>;
  fx: {
    usdMyrRate: number;
    source:     string;
    fetchedAt:  string;
    provider:   string;
  };
  stats: {
    available: number;
    locked:    number;
    redeemed:  number;
    revoked:   number;
    total:     number;
  };
  enrollments: {
    code_locked: number;
    paid:        number;
    complete:    number;
    total:       number;
  };
  agents: {
    total:              number;
    active:             number;
    suspended:          number;
    pendingPackage:     number;
    packageActive:      number;
    legacy:             number;
    totalPinBalance:    number;
    totalPinPurchased:  number;
    totalWalletMyr:     number;
    totalCommissionMyr: number;
    totalStudents:      number;
  };
  activitySeries:        TutorAdminActivityPoint[];
  pinDistribution:       TutorAdminDistributionSlice[];
  enrollmentDistribution: TutorAdminDistributionSlice[];
  agentPackageDistribution: TutorAdminDistributionSlice[];
  agentSummaries:          TutorAdminAgentSummary[];
  recentEnrollments: Array<{
    enrollmentId: string;
    studentName:  string | null;
    schoolName:   string | null;
    state:        string | null;
    band:         TutorSubscriptionLevel | null;
    status:       string;
    agentLabel:   string | null;
    registerCode: string;
    updatedAt:    string;
  }>;
  recentPins: Array<{
    codeId:       string;
    registerCode: string;
    band:         TutorSubscriptionLevel | null;
    agentLabel:   string | null;
    status:       string;
    createdAt:    string;
  }>;
  phase:       string;
  generatedAt: string;
}

function isoDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayLabel(isoDay: string): string {
  try {
    return new Date(`${isoDay}T12:00:00.000Z`).toLocaleDateString('en-MY', {
      day:   'numeric',
      month: 'short',
    });
  } catch {
    return isoDay;
  }
}

function lastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(isoDayKey(d));
  }
  return keys;
}

function mapDailyCounts(
  dayKeys: string[],
  rows: { _id: string; count: number }[],
): Map<string, number> {
  const map = new Map(dayKeys.map((k) => [k, 0]));
  for (const row of rows) {
    if (map.has(row._id)) map.set(row._id, row.count);
  }
  return map;
}

async function aggregateDailyCounts(
  model: typeof TutorEnrollmentModel | typeof TutorRegisterCodeModel | typeof TutorAgentModel,
  dateField: string,
  since: Date,
  match: Record<string, unknown> = {},
): Promise<{ _id: string; count: number }[]> {
  return model.aggregate([
    { $match: { ...match, [dateField]: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function buildTutorAdminDashboardOverview(): Promise<TutorAdminDashboardData> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (ACTIVITY_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const dayKeys = lastNDayKeys(ACTIVITY_DAYS);
  const realStudents = marketingEnrollmentFilter();

  const [
    available,
    locked,
    redeemed,
    revoked,
    pricing,
    fx,
    agentsTotal,
    agentsActive,
    agentsSuspended,
    agentsPendingPackage,
    agentsPackageActive,
    agentsLegacy,
    agentPinBalance,
    agentPinPurchased,
    agentWalletTotal,
    commissionTotal,
    agentStudentsTotal,
    enrollCodeLocked,
    enrollPaid,
    enrollComplete,
    enrollDaily,
    pinRedeemedDaily,
    agentsDaily,
    recentEnrollments,
    recentPins,
    agents,
    commissionByAgent,
  ] = await Promise.all([
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.AVAILABLE }),
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.LOCKED }),
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.REDEEMED }),
    TutorRegisterCodeModel.countDocuments({ status: TutorRegisterCodeStatus.REVOKED }),
    listTutorRegisterPricing(),
    getUsdMyrRate(),
    TutorAgentModel.countDocuments({}),
    TutorAgentModel.countDocuments({ status: TutorAgentStatus.ACTIVE }),
    TutorAgentModel.countDocuments({ status: TutorAgentStatus.SUSPENDED }),
    TutorAgentModel.countDocuments({ packageStatus: TutorAgentPackageStatus.PENDING }),
    TutorAgentModel.countDocuments({ packageStatus: TutorAgentPackageStatus.ACTIVE }),
    TutorAgentModel.countDocuments({ packageStatus: TutorAgentPackageStatus.LEGACY }),
    TutorAgentModel.aggregate<{ totalPin: number }>([
      { $group: { _id: null, totalPin: { $sum: '$pinBalance' } } },
    ]),
    TutorAgentModel.aggregate<{ totalPin: number }>([
      { $group: { _id: null, totalPin: { $sum: '$pinPurchasedTotal' } } },
    ]),
    TutorAgentModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$walletBalanceMyr' } } },
    ]),
    TutorAgentWalletLedgerModel.aggregate<{ total: number }>([
      { $match: { type: 'commission' } },
      { $group: { _id: null, total: { $sum: '$amountMyr' } } },
    ]),
    TutorEnrollmentModel.countDocuments({ agentId: { $ne: null }, ...realStudents }),
    TutorEnrollmentModel.countDocuments({ status: TutorEnrollmentStatus.CODE_LOCKED }),
    TutorEnrollmentModel.countDocuments({ status: TutorEnrollmentStatus.PAID }),
    TutorEnrollmentModel.countDocuments({ status: TutorEnrollmentStatus.COMPLETE }),
    aggregateDailyCounts(TutorEnrollmentModel, 'updatedAt', since, realStudents),
    aggregateDailyCounts(
      TutorRegisterCodeModel,
      'redeemedAt',
      since,
      { status: TutorRegisterCodeStatus.REDEEMED, redeemedAt: { $ne: null } },
    ),
    aggregateDailyCounts(TutorAgentModel, 'createdAt', since),
    TutorEnrollmentModel.find(realStudents)
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean(),
    listTutorRegisterCodes({ limit: 20 }),
    TutorAgentModel.find().sort({ createdAt: -1 }).limit(100).lean(),
    TutorAgentWalletLedgerModel.aggregate<{ _id: string; total: number }>([
      { $match: { type: 'commission' } },
      { $group: { _id: '$agentId', total: { $sum: '$amountMyr' } } },
    ]),
  ]);

  const agentIds = agents.map((a) => a.agentId);

  const [codeStats, studentStats] = agentIds.length > 0
    ? await Promise.all([
        TutorRegisterCodeModel.aggregate<{ _id: { agentId: string; status: string }; count: number }>([
          { $match: { agentId: { $in: agentIds } } },
          { $group: { _id: { agentId: '$agentId', status: '$status' }, count: { $sum: 1 } } },
        ]),
        TutorEnrollmentModel.aggregate<{ _id: string; total: number; paid: number }>([
          { $match: { agentId: { $in: agentIds }, ...realStudents } },
          {
            $group: {
              _id:   '$agentId',
              total: { $sum: 1 },
              paid:  {
                $sum: {
                  $cond: [
                    { $in: ['$status', [TutorEnrollmentStatus.PAID, TutorEnrollmentStatus.COMPLETE]] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ])
    : [[], []];

  const codesByAgent = new Map<string, Record<string, number>>();
  for (const row of codeStats) {
    const agentId = row._id.agentId;
    const bucket = codesByAgent.get(agentId) ?? {};
    bucket[row._id.status] = row.count;
    codesByAgent.set(agentId, bucket);
  }

  const studentsByAgent = new Map(studentStats.map((r) => [r._id, r]));
  const commissionMap = new Map(commissionByAgent.map((r) => [r._id, r.total]));

  const enrollMap = mapDailyCounts(dayKeys, enrollDaily);
  const pinMap = mapDailyCounts(dayKeys, pinRedeemedDaily);
  const agentMap = mapDailyCounts(dayKeys, agentsDaily);

  const activitySeries: TutorAdminActivityPoint[] = dayKeys.map((date) => ({
    date,
    label:            dayLabel(date),
    enrollments:      enrollMap.get(date) ?? 0,
    pinsRedeemed:     pinMap.get(date) ?? 0,
    agentsRegistered: agentMap.get(date) ?? 0,
  }));

  const agentSummaries: TutorAdminAgentSummary[] = agents.map((agent) => {
    const codes = codesByAgent.get(agent.agentId) ?? {};
    const students = studentsByAgent.get(agent.agentId);
    return {
      agentId:            agent.agentId,
      agentCode:          agent.agentCode,
      orgName:            agent.orgName,
      contactName:        agent.contactName,
      email:              agent.email,
      state:              agent.state,
      status:             agent.status,
      packageStatus:      agent.packageStatus,
      packageTier:        agent.packageTier,
      packageTierLabel:   agent.packageTier
        ? agent.packageTier.charAt(0).toUpperCase() + agent.packageTier.slice(1)
        : null,
      band:               agent.band,
      bandLabel:          agent.band ? BAND_LABELS_EN[agent.band] : null,
      pinBalance:         agent.pinBalance ?? 0,
      pinPurchasedTotal:  agent.pinPurchasedTotal ?? 0,
      codesAvailable:     codes.available ?? 0,
      codesRedeemed:      codes.redeemed ?? 0,
      studentsTotal:      students?.total ?? 0,
      studentsPaid:         students?.paid ?? 0,
      walletBalanceMyr:   agent.walletBalanceMyr ?? 0,
      totalCommissionMyr: commissionMap.get(agent.agentId) ?? 0,
      commissionPercent:  agent.commissionPercent ?? 20,
      createdAt:          agent.createdAt.toISOString(),
    };
  });

  return {
    pricing,
    fx: {
      usdMyrRate: fx.rate,
      source:     fx.source,
      fetchedAt:  fx.fetchedAt,
      provider:   fx.provider,
    },
    stats: {
      available,
      locked,
      redeemed,
      revoked,
      total: available + locked + redeemed + revoked,
    },
    enrollments: {
      code_locked: enrollCodeLocked,
      paid:        enrollPaid,
      complete:    enrollComplete,
      total:       enrollCodeLocked + enrollPaid + enrollComplete,
    },
    agents: {
      total:              agentsTotal,
      active:             agentsActive,
      suspended:          agentsSuspended,
      pendingPackage:     agentsPendingPackage,
      packageActive:      agentsPackageActive,
      legacy:             agentsLegacy,
      totalPinBalance:    agentPinBalance[0]?.totalPin ?? 0,
      totalPinPurchased:  agentPinPurchased[0]?.totalPin ?? 0,
      totalWalletMyr:     Math.round((agentWalletTotal[0]?.total ?? 0) * 100) / 100,
      totalCommissionMyr: Math.round((commissionTotal[0]?.total ?? 0) * 100) / 100,
      totalStudents:      agentStudentsTotal,
    },
    activitySeries,
    pinDistribution: [
      { name: 'Available', value: available },
      { name: 'Locked', value: locked },
      { name: 'Redeemed', value: redeemed },
      { name: 'Revoked', value: revoked },
    ].filter((s) => s.value > 0),
    enrollmentDistribution: [
      { name: 'Awaiting payment', value: enrollCodeLocked },
      { name: 'Paid', value: enrollPaid },
      { name: 'Complete', value: enrollComplete },
    ].filter((s) => s.value > 0),
    agentPackageDistribution: [
      { name: 'Package active', value: agentsPackageActive },
      { name: 'Pending payment', value: agentsPendingPackage },
      { name: 'Legacy', value: agentsLegacy },
    ].filter((s) => s.value > 0),
    agentSummaries,
    recentEnrollments: recentEnrollments.map((row) => ({
      enrollmentId: row.enrollmentId,
      studentName:  row.studentName,
      schoolName:   row.schoolName,
      state:        row.state,
      band:         row.band,
      status:       row.status,
      agentLabel:   row.agentLabel,
      registerCode: row.registerCode,
      updatedAt:    row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt ?? ''),
    })),
    recentPins: recentPins.map((row) => ({
      codeId:       row.codeId,
      registerCode: row.registerCode,
      band:         row.band,
      agentLabel:   row.agentLabel,
      status:       row.status,
      createdAt:    row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt ?? ''),
    })),
    phase:       'MY',
    generatedAt: new Date().toISOString(),
  };
}
