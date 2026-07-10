/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import crypto from 'crypto';
import {
  TutorAgentModel,
  TutorAgentStatus,
  type ITutorAgent,
} from './adam-tutor-agent.schema';
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
} from './adam-tutor-register-code.schema';
import {
  TutorEnrollmentModel,
  TutorEnrollmentStatus,
} from './adam-tutor-enrollment.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM, tutorBandLabel } from './adam-tutor-register.constants';
import { listAgentWalletLedger, sumAgentCommission } from './adam-tutor-agent-wallet.service';
import {
  TutorAgentPackageStatus,
  type TutorAgentPackageTier,
} from './adam-tutor-agent-package.config';
import { serializeAgentPackage } from './adam-tutor-agent-package.service';
import { resolveAgentLicenseExpiry } from './adam-tutor-pricing-renewal.service';
import {
  ensureAgentMarketingStudent,
  marketingEnrollmentFilter,
  serializeAgentMarketingStudent,
  type TutorAgentMarketingStudentPublic,
} from './adam-tutor-agent-marketing.service';
import { agentDemoChatUserId } from './adam-tutor-agent-demo-chat.service';
import { isCharityTutorAgent } from './adam-tutor-charity-agent.config';
import type { TutorAgentProgramKind } from './adam-tutor-charity-agent.config';
import { TutorAgentWalletLedgerModel } from './adam-tutor-agent-wallet.schema';
import { ADAMFounderSessionModel } from '../adam.schema';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import {
  normalizeAgentMalaysiaAddress,
  normalizeAgentPayoutIdentity,
  normalizeMalaysiaPhone,
  validateAgentRegistrationInput,
} from './adam-tutor-agent-identity';
import { allocateTutorAgentCode } from './adam-tutor-agent-code';

export function newTutorAgentId(): string {
  return `TUTOR-AGT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newTutorAgentPortalToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export async function createTutorAgent(input: {
  orgName:             string;
  contactName:         string;
  email:               string;
  phone:               string;
  icNumber:            string;
  taxId:               string;
  bankName:            string;
  bankAccountNumber:   string;
  bankAccountHolder:   string;
  addressLine1:        string;
  addressLine2?:       string | null;
  postcode:            string;
  city:                string;
  state:               string;
  band?:               TutorSubscriptionLevel | null;
  packageTier?:        TutorAgentPackageTier;
  commissionPercent?:  number;
  notes?:              string;
  createdBy:           string;
}): Promise<ITutorAgent> {
  const regErr = validateAgentRegistrationInput(input);
  if (regErr) throw new Error(regErr);
  const payout = normalizeAgentPayoutIdentity(input);
  const address = normalizeAgentMalaysiaAddress(input);
  const phone = normalizeMalaysiaPhone(input.phone);

  const agentCode = await allocateTutorAgentCode();
  const hasPackage = Boolean(input.packageTier);
  const agentId = newTutorAgentId();

  const agent = await TutorAgentModel.create({
    agentId,
    agentCode,
    portalToken:       newTutorAgentPortalToken(),
    orgName:           input.orgName.trim(),
    contactName:       input.contactName.trim(),
    email:             input.email.trim().toLowerCase(),
    phone,
    icNumber:          payout.icNumber,
    taxId:             payout.taxId,
    bankName:          payout.bankName,
    bankAccountNumber: payout.bankAccountNumber,
    bankAccountHolder: payout.bankAccountHolder,
    addressLine1:      address.addressLine1,
    addressLine2:      address.addressLine2,
    postcode:          address.postcode,
    city:              address.city,
    state:             address.state,
    band:              input.band ?? null,
    packageTier:       input.packageTier ?? null,
    packageStatus:     hasPackage
      ? TutorAgentPackageStatus.PENDING
      : TutorAgentPackageStatus.LEGACY,
    pinBalance:        0,
    pinPurchasedTotal: 0,
    packagePaidAt:     null,
    commissionPercent: input.commissionPercent ?? 20,
    walletBalanceMyr:  0,
    status:            TutorAgentStatus.ACTIVE,
    createdBy:         input.createdBy,
    notes:             input.notes?.trim() || null,
  });

  await ensureAgentMarketingStudent(agent);
  return agent;
}

export async function listTutorAgents(limit = 100) {
  return TutorAgentModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export interface TutorAgentAdminRow extends TutorAgentPortalOverview {
  email:                  string;
  phone:                  string | null;
  icNumber:               string | null;
  taxId:                  string | null;
  bankName:               string | null;
  bankAccountNumber:      string | null;
  bankAccountHolder:      string | null;
  addressLine1:           string | null;
  addressLine2:           string | null;
  postcode:               string | null;
  city:                   string | null;
  status:                 TutorAgentStatus;
  bandLabel:              string | null;
  notes:                  string | null;
  createdBy:              string;
  createdAt:              string;
  packageStripeSessionId: string | null;
}

export async function listTutorAgentsForAdmin(limit = 100): Promise<TutorAgentAdminRow[]> {
  const agents = await TutorAgentModel.find()
    .sort({ createdAt: -1 })
    .limit(limit);

  return Promise.all(
    agents.map(async (agent) => {
      try {
        const overview = await getTutorAgentPortalOverview(agent);
        return {
          ...overview,
          email:                  agent.email,
          phone:                  agent.phone,
          icNumber:               agent.icNumber,
          taxId:                  agent.taxId,
          bankName:               agent.bankName,
          bankAccountNumber:      agent.bankAccountNumber,
          bankAccountHolder:      agent.bankAccountHolder,
          addressLine1:           agent.addressLine1,
          addressLine2:           agent.addressLine2,
          postcode:               agent.postcode,
          city:                   agent.city,
          status:                 agent.status,
          bandLabel:              agent.band
            ? TUTOR_REGISTER_BAND_LABELS_BM[agent.band]
            : null,
          notes:                  agent.notes,
          createdBy:              agent.createdBy,
          createdAt:              agent.createdAt.toISOString(),
          packageStripeSessionId: agent.packageStripeSessionId,
        };
    
      } catch (err) {
        console.error(err);
        throw err;
      }}),
  );
}

export async function getTutorAgentById(agentId: string): Promise<ITutorAgent | null> {
  return TutorAgentModel.findOne({ agentId });
}

export async function resolveTutorAgent(
  agentCode: string,
  portalToken: string,
): Promise<ITutorAgent | null> {
  return TutorAgentModel.findOne({
    agentCode:   agentCode.trim().toUpperCase(),
    portalToken: portalToken.trim(),
  });
}

export interface TutorAgentPortalOverview {
  agentId:            string;
  agentCode:          string;
  orgName:            string;
  contactName:        string;
  state:              string;
  commissionPercent:  number;
  walletBalanceMyr:   number;
  totalCommissionMyr: number;
  codesTotal:         number;
  codesAvailable:     number;
  codesRedeemed:      number;
  studentsTotal:      number;
  studentsPaid:       number;
  studentsComplete:   number;
  studentsPending:    number;
  marketingStudent:   TutorAgentMarketingStudentPublic;
  band:               TutorSubscriptionLevel | null;
  packageTier:        TutorAgentPackageTier | null;
  packageTierLabel:   string | null;
  packageStatus:      TutorAgentPackageStatus;
  pinBalance:         number;
  pinPurchasedTotal:  number;
  packagePaidAt:      string | null;
  packageExpiresAt:   string | null;
  packageRenewedAt:   string | null;
  packageRenewalCount: number;
  licenseActive:      boolean;
  packageQuote:       ReturnType<typeof serializeAgentPackage>['packageQuote'];
  agentProgram:       TutorAgentProgramKind;
  pinBalanceSchool:     number;
  pinBalanceUniversity: number;
  universityName:       string | null;
  matricNumber:         string | null;
}

export async function getTutorAgentPortalOverview(
  agent: ITutorAgent,
): Promise<TutorAgentPortalOverview> {
  if (!agent.marketingStudentUserId) {
    await ensureAgentMarketingStudent(agent);
  }

  const agentId = agent.agentId;
  const realStudents = marketingEnrollmentFilter();

  const [
    codesTotal,
    codesAvailable,
    codesRedeemed,
    studentsTotal,
    studentsPaid,
    studentsComplete,
    studentsPending,
    totalCommissionMyr,
  ] = await Promise.all([
    TutorRegisterCodeModel.countDocuments({ agentId }),
    TutorRegisterCodeModel.countDocuments({ agentId, status: 'available' }),
    TutorRegisterCodeModel.countDocuments({ agentId, status: 'redeemed' }),
    TutorEnrollmentModel.countDocuments({ agentId, ...realStudents }),
    TutorEnrollmentModel.countDocuments({ agentId, status: TutorEnrollmentStatus.PAID, ...realStudents }),
    TutorEnrollmentModel.countDocuments({ agentId, status: TutorEnrollmentStatus.COMPLETE, ...realStudents }),
    TutorEnrollmentModel.countDocuments({ agentId, status: TutorEnrollmentStatus.CODE_LOCKED, ...realStudents }),
    sumAgentCommission(agentId),
  ]);

  return {
    agentId:            agent.agentId,
    agentCode:          agent.agentCode,
    orgName:            agent.orgName,
    contactName:        agent.contactName,
    state:              agent.state,
    commissionPercent:  agent.commissionPercent,
    walletBalanceMyr:   agent.walletBalanceMyr,
    totalCommissionMyr,
    codesTotal,
    codesAvailable,
    codesRedeemed,
    studentsTotal,
    studentsPaid:       studentsPaid + studentsComplete,
    studentsComplete,
    studentsPending,
    marketingStudent:   serializeAgentMarketingStudent(agent),
    band:               agent.band,
    packageTier:        agent.packageTier,
    packageTierLabel:   serializeAgentPackage(agent).packageTierLabel,
    packageStatus:      agent.packageStatus,
    pinBalance:         isCharityTutorAgent(agent)
      ? (agent.pinBalanceSchool ?? 0) + (agent.pinBalanceUniversity ?? 0)
      : agent.pinBalance,
    pinPurchasedTotal:  agent.pinPurchasedTotal,
    packagePaidAt:      agent.packagePaidAt?.toISOString() ?? null,
    packageExpiresAt:   agent.packageExpiresAt?.toISOString() ?? null,
    packageRenewedAt:   agent.packageRenewedAt?.toISOString() ?? null,
    packageRenewalCount: agent.packageRenewalCount ?? 0,
    licenseActive:      Boolean(
      (() => {
        if (isCharityTutorAgent(agent)) {
          return Boolean(agent.studentVerifiedAt);
        }
        const exp = resolveAgentLicenseExpiry(agent);
        return exp && exp > new Date();
      })(),
    ),
    packageQuote:       serializeAgentPackage(agent).packageQuote,
    agentProgram:       agent.agentProgram ?? 'commercial',
    pinBalanceSchool:   agent.pinBalanceSchool ?? 0,
    pinBalanceUniversity: agent.pinBalanceUniversity ?? 0,
    universityName:     agent.universityName ?? null,
    matricNumber:       agent.matricNumber ?? null,
  };
}

export interface TutorAgentStudentRow {
  enrollmentId:  string;
  userId:        string;
  studentName:   string | null;
  schoolName:    string | null;
  state:         string | null;
  band:          string | null;
  bandLabel:     string;
  /** @deprecated use bandLabel */
  pinLabel:      string;
  registerCode:  string;
  status:        string;
  paidAt:        string | null;
  completedAt:   string | null;
  pricingChannel: string;
  agentPriceEndsAt: string | null;
  createdAt:     string;
}

export async function listTutorAgentStudents(
  agentId: string,
  limit = 100,
): Promise<TutorAgentStudentRow[]> {
  const rows = await TutorEnrollmentModel.find({ agentId, ...marketingEnrollmentFilter() })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((doc) => ({
    enrollmentId: doc.enrollmentId,
    userId:       doc.userId,
    studentName:  doc.studentName,
    schoolName:   doc.schoolName,
    state:        doc.state,
    band:         doc.band,
    bandLabel:    tutorBandLabel(doc.band),
    pinLabel:     tutorBandLabel(doc.band),
    registerCode: doc.registerCode,
    status:       doc.status,
    paidAt:       doc.paidAt?.toISOString() ?? null,
    completedAt:  doc.completedAt?.toISOString() ?? null,
    pricingChannel: doc.pricingChannel ?? 'agent',
    agentPriceEndsAt: doc.agentPriceEndsAt?.toISOString() ?? null,
    createdAt:    doc.createdAt.toISOString(),
  }));
}

export async function getTutorAgentWallet(agentId: string) {
  try {
    const agent = await TutorAgentModel.findOne({ agentId }).lean();
    if (!agent) return null;

    const ledger = await listAgentWalletLedger(agentId, 80);
    return {
      walletBalanceMyr:   agent.walletBalanceMyr,
      totalCommissionMyr: await sumAgentCommission(agentId),
      ledger: ledger.map((row) => ({
        ledgerId:     row.ledgerId,
        type:         row.type,
        amountMyr:    row.amountMyr,
        balanceAfter: row.balanceAfter,
        enrollmentId: row.enrollmentId,
        registerCode: row.registerCode,
        note:         row.note,
        recordedAt:   row.recordedAt.toISOString(),
      })),
    };

  } catch (err) {
    console.error(err);
    throw err;
  }}

/** Founder-only — remove agen with no redeemed PINs or linked students. */
export async function deleteTutorAgentByAdmin(agentId: string): Promise<{
  agentCode: string;
  orgName:   string;
}> {
  const agent = await TutorAgentModel.findOne({ agentId });
  if (!agent) throw new Error('Agen tidak dijumpai.');

  const realStudents = marketingEnrollmentFilter();
  const [studentCount, redeemedPins] = await Promise.all([
    TutorEnrollmentModel.countDocuments({ agentId, ...realStudents }),
    TutorRegisterCodeModel.countDocuments({
      agentId,
      status: TutorRegisterCodeStatus.REDEEMED,
    }),
  ]);

  if (studentCount > 0 || redeemedPins > 0) {
    throw new Error(
      `Tidak boleh padam agen — ${studentCount} pelajar dan ${redeemedPins} PIN ditebus masih terikat.`,
    );
  }

  const demoUserId = agentDemoChatUserId(agentId);

  await Promise.all([
    TutorAgentWalletLedgerModel.deleteMany({ agentId }),
    TutorRegisterCodeModel.deleteMany({ agentId }),
    TutorEnrollmentModel.deleteMany({
      agentId,
      registerCode: { $regex: /^MARKETING-/ },
    }),
    ADAMFounderSessionModel.deleteMany({ founderId: demoUserId, sessionType: 'tutor' }),
    TutorAgentModel.deleteOne({ agentId }),
  ]);

  return { agentCode: agent.agentCode, orgName: agent.orgName };
}
