/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Enrollment Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ADAMStudentAccountModel } from '../adam-student.schema';
import { isTutorQaBypassUser } from '../adam-tutor-subscription.service';
import { saveTutorProfile } from '../adam-tutor-profile.service';
import {
  TUTOR_REGISTER_BAND_FALLBACK,
  TUTOR_REGISTER_BAND_LABELS_BM,
  TUTOR_REGISTER_PHASE_COUNTRY,
  TUTOR_AGENT_LICENSE_MONTHS,
} from './adam-tutor-register.constants';
import { getTutorBandPricing } from './adam-tutor-pricing.service';
import {
  lockTutorRegisterCode,
  markTutorCodeRedeemed,
  type TutorCodeValidation,
  validateTutorRegisterCode,
} from './adam-tutor-register-code.service';
import { creditTutorAgentCommission } from './adam-tutor-agent-wallet.service';
import { FOUNDER_USER_ID } from '../adam-student.types';
import type { GuardianRelationship } from './adam-tutor-parent-guardian.schema';
import {
  TutorEnrollmentModel,
  TutorEnrollmentStatus,
  type ITutorEnrollment,
} from './adam-tutor-enrollment.schema';
import {
  normalizeSubjectsTaken,
  upsertParentGuardian,
} from './adam-tutor-parent.service';
import {
  stampEnrollmentAgentPriceWindow,
} from './adam-tutor-pricing-renewal.service';
import type { TutorPricingChannel } from './adam-tutor-pricing.types';

export function newTutorEnrollmentId(): string {
  return `TUTOR-ENR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface TutorEnrollmentPublic {
  enrollmentId:  string;
  status:        TutorEnrollmentStatus;
  pinLabel:      string;
  /** @deprecated use pinLabel */
  bandLabel:     string;
  agentLabel:    string | null;
  registerCode:  string;
  studentName:   string | null;
  schoolName:    string | null;
  state:         string | null;
  yearLabel:     string | null;
  language:      string | null;
  subjectsTaken: string[];
  paidAt:        string | null;
  completedAt:   string | null;
  pricingChannel?: TutorPricingChannel;
  agentPriceEndsAt?: string | null;
}

function toPublic(doc: ITutorEnrollment): TutorEnrollmentPublic {
  const bandLabel = doc.band
    ? TUTOR_REGISTER_BAND_LABELS_BM[doc.band]
    : TUTOR_REGISTER_BAND_LABELS_BM[TUTOR_REGISTER_BAND_FALLBACK];
  return {
    enrollmentId: doc.enrollmentId,
    status:       doc.status,
    pinLabel:     bandLabel,
    bandLabel,
    agentLabel:   doc.agentLabel,
    registerCode: doc.registerCode,
    studentName:  doc.studentName,
    schoolName:   doc.schoolName,
    state:        doc.state,
    yearLabel:    doc.yearLabel,
    language:     doc.language,
    subjectsTaken: doc.subjectsTaken ?? [],
    paidAt:       doc.paidAt?.toISOString() ?? null,
    completedAt:  doc.completedAt?.toISOString() ?? null,
    pricingChannel: doc.pricingChannel ?? 'agent',
    agentPriceEndsAt: doc.agentPriceEndsAt?.toISOString() ?? null,
  };
}

/** QA seed accounts and founder-created pelajar skip kod flow. */
export async function isTutorKodDaftarBypass(userId: string): Promise<boolean> {
  if (isTutorQaBypassUser(userId)) return true;

  const doc = await ADAMStudentAccountModel.findOne({ userId }).lean();
  if (!doc) return false;

  if (doc.accountLane === 'pelajar' && doc.createdBy !== 'self-register') {
    return true;
  }

  return false;
}

export async function getTutorEnrollmentForUser(
  userId: string,
): Promise<TutorEnrollmentPublic | null> {
  const doc = await TutorEnrollmentModel.findOne({ userId }).lean();
  if (!doc) return null;
  return toPublic(doc as unknown as ITutorEnrollment);
}

export async function lockTutorEnrollmentCode(
  userId: string,
  registerCode: string,
): Promise<TutorEnrollmentPublic> {
  if (userId === FOUNDER_USER_ID) {
    throw new Error('Daftar dengan akaun pelajar — bukan akaun pentadbir.');
  }

  const existing = await TutorEnrollmentModel.findOne({ userId });
  if (existing?.status === TutorEnrollmentStatus.COMPLETE) {
    throw new Error('Pendaftaran ADAM Tutor anda sudah lengkap.');
  }

  const locked = await lockTutorRegisterCode(registerCode, userId);

  if (existing) {
    existing.registerCode = locked.registerCode;
    existing.band = locked.band ?? TUTOR_REGISTER_BAND_FALLBACK;
    existing.agentLabel = locked.agentLabel;
    existing.agentId = locked.agentId ?? null;
    existing.status = TutorEnrollmentStatus.CODE_LOCKED;
    await existing.save();
    return toPublic(existing);
  }

  const doc = await TutorEnrollmentModel.create({
    enrollmentId: newTutorEnrollmentId(),
    userId,
    registerCode: locked.registerCode,
    band:         locked.band ?? TUTOR_REGISTER_BAND_FALLBACK,
    agentLabel:   locked.agentLabel,
    agentId:      locked.agentId ?? null,
    status:       TutorEnrollmentStatus.CODE_LOCKED,
  });

  return toPublic(doc);
}

export interface TutorCheckoutQuote {
  pinLabel:       string;
  /** @deprecated use pinLabel */
  bandLabel:      string;
  /** Canonical default base (USD). */
  monthlyUsd:     number;
  /** Public list price for same band — shown on PIN checkout only, not /pricing. */
  publicMonthlyUsd: number;
  /** Regional fee in country currency. */
  monthlyAmount:  number;
  currency:       string;
  /** MYR equivalent when currency is MYR or for legacy clients. */
  monthlyMyr:     number;
  usdMyrRate?:    number;
  rateSource?:    string;
  rateFetchedAt?: string;
  agentLabel:     string | null;
  registerCode:   string;
  pricingChannel: TutorPricingChannel;
  agentPriceEndsAt: string | null;
  monthlyPaymentsRemaining?: number;
}

export async function getTutorEnrollmentCheckoutQuote(
  userId: string,
): Promise<TutorCheckoutQuote> {
  const enrollment = await TutorEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Sila masukkan PIN terlebih dahulu.');
  }

  if (enrollment.status === TutorEnrollmentStatus.PAID
    || enrollment.status === TutorEnrollmentStatus.COMPLETE) {
    throw new Error('Bayaran untuk kod ini sudah selesai.');
  }

  if (enrollment.status !== TutorEnrollmentStatus.PROFILE_SAVED) {
    if (enrollment.status === TutorEnrollmentStatus.CODE_LOCKED) {
      throw new Error('Sila lengkapkan borang pendaftaran sebelum bayar.');
    }
    throw new Error('PIN tidak sah atau belum dikunci.');
  }

  return {
    pinLabel:     enrollment.band
      ? TUTOR_REGISTER_BAND_LABELS_BM[enrollment.band]
      : TUTOR_REGISTER_BAND_LABELS_BM[TUTOR_REGISTER_BAND_FALLBACK],
    bandLabel:    enrollment.band
      ? TUTOR_REGISTER_BAND_LABELS_BM[enrollment.band]
      : TUTOR_REGISTER_BAND_LABELS_BM[TUTOR_REGISTER_BAND_FALLBACK],
    ...(await (async () => {
      const band = enrollment.band ?? TUTOR_REGISTER_BAND_FALLBACK;
      const channel = enrollment.pricingChannel ?? 'agent';
      const p = await getTutorBandPricing(
        band,
        channel === 'public' ? 'public' : 'agent',
      );
      const publicP = await getTutorBandPricing(band, 'public');
      const endsAt = enrollment.agentPriceEndsAt;
      const monthsLeft = endsAt
        ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
        : TUTOR_AGENT_LICENSE_MONTHS;
      return {
        monthlyUsd:    p.monthlyUsd,
        publicMonthlyUsd: publicP.monthlyUsd,
        monthlyAmount: p.monthlyAmount,
        currency:      p.currency,
        monthlyMyr:    p.monthlyMyr,
        usdMyrRate:    p.usdMyrRate,
        rateSource:    p.rateSource,
        rateFetchedAt: p.rateFetchedAt,
        pricingChannel: channel,
        agentPriceEndsAt: endsAt?.toISOString() ?? null,
        monthlyPaymentsRemaining: channel === 'agent' ? monthsLeft : undefined,
      };
    })()),
    agentLabel:   enrollment.agentLabel,
    registerCode: enrollment.registerCode,
  };
}

export async function markTutorEnrollmentPaid(input: {
  userId:         string;
  enrollmentId:   string;
  stripeSessionId?: string;
  subscriptionId?: string;
}): Promise<void> {
  const enrollment = await TutorEnrollmentModel.findOne({
    enrollmentId: input.enrollmentId,
    userId:       input.userId,
  });
  if (!enrollment) return;

  if (enrollment.status === TutorEnrollmentStatus.COMPLETE) return;

  const paidAt = enrollment.paidAt ?? new Date();
  const isFirstPayment = !enrollment.paidAt;

  enrollment.status = TutorEnrollmentStatus.PAID;
  enrollment.paidAt = paidAt;
  if (input.stripeSessionId) enrollment.stripeSessionId = input.stripeSessionId;
  if (input.subscriptionId) enrollment.subscriptionId = input.subscriptionId;

  if (isFirstPayment) {
    stampEnrollmentAgentPriceWindow(enrollment, paidAt);
  }

  if (enrollment.studentName && enrollment.schoolName && enrollment.state) {
    enrollment.status = TutorEnrollmentStatus.COMPLETE;
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  if (input.subscriptionId) {
    const { SubscriptionModel } = await import('../../subscriptions/subscription.schema');
    await SubscriptionModel.findByIdAndUpdate(input.subscriptionId, {
      $set: {
        pricingChannel:    enrollment.pricingChannel,
        agentPriceEndsAt:  enrollment.agentPriceEndsAt,
        tutorEnrollmentId: enrollment.enrollmentId,
      },
    });
  }

  await markTutorCodeRedeemed(enrollment.registerCode, input.userId);

  if (enrollment.agentId) {
    await creditTutorAgentCommission({
      agentId:      enrollment.agentId,
      enrollmentId: enrollment.enrollmentId,
      userId:       enrollment.userId,
      registerCode: enrollment.registerCode,
      band:         enrollment.band,
    });
  }
}

export async function completeTutorEnrollmentProfile(
  userId: string,
  input: {
    studentName:      string;
    schoolName:       string;
    state:            string;
    yearLabel?:       string;
    language?:        string;
    curriculum?:      string;
    subjectsTaken?:   string[];
    guardianName?:    string;
    guardianEmail?:   string;
    guardianRelationship?: GuardianRelationship;
    guardianConsent?: boolean;
  },
): Promise<{
  enrollment:          TutorEnrollmentPublic;
  parentAccessToken?:  string;
  parentGuardianHint?: string;
}> {
  const enrollment = await TutorEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Tiada pendaftaran PIN. Sila masukkan PIN anda.');
  }

  if (enrollment.status === TutorEnrollmentStatus.COMPLETE) {
    throw new Error('Pendaftaran ADAM Tutor anda sudah lengkap.');
  }

  const canCompleteProfile =
    enrollment.status === TutorEnrollmentStatus.CODE_LOCKED
    || enrollment.status === TutorEnrollmentStatus.PROFILE_SAVED
    || enrollment.status === TutorEnrollmentStatus.PAID;

  if (!canCompleteProfile) {
    throw new Error('Sila masukkan PIN terlebih dahulu.');
  }

  if (userId === FOUNDER_USER_ID) {
    throw new Error('Daftar dengan akaun pelajar — bukan akaun pentadbir.');
  }

  const studentName = input.studentName.trim();
  const schoolName = input.schoolName.trim();
  const state = input.state.trim();
  if (!studentName || !schoolName || !state) {
    throw new Error('Nama, sekolah, dan negeri diperlukan.');
  }

  const account = await ADAMStudentAccountModel.findOne({ userId, active: true })
    ?? await ADAMStudentAccountModel.findOne({ userId });
  if (!account) {
    throw new Error(
      'Akaun pelajar belum wujud. Daftar akaun pelajar percuma dahulu (bukan log masuk pentadbir).',
    );
  }

  account.name = studentName;
  account.accountLane = 'pelajar';
  await account.save();

  const language = input.language?.trim() || 'english';
  const curriculum = input.curriculum?.trim() || 'kpm';

  const tutorLevel = enrollment.band ?? TUTOR_REGISTER_BAND_FALLBACK;

  await saveTutorProfile(userId, {
    level:       tutorLevel,
    curriculum:  curriculum as 'national' | 'kpm' | 'cambridge' | 'mixed' | 'international' | 'us' | 'uk' | 'other',
    language:    language as 'malay' | 'english' | 'arabic' | 'mandarin' | 'tamil' | 'indonesian' | 'spanish' | 'french' | 'other',
    yearLabel:   input.yearLabel?.trim() || undefined,
    countryCode: TUTOR_REGISTER_PHASE_COUNTRY,
    localeNote:  schoolName,
  });

  enrollment.studentName = studentName;
  enrollment.schoolName = schoolName;
  enrollment.state = state;
  enrollment.yearLabel = input.yearLabel?.trim() || null;
  enrollment.language = language;
  enrollment.subjectsTaken = normalizeSubjectsTaken(input.subjectsTaken);
  enrollment.status = TutorEnrollmentStatus.PROFILE_SAVED;
  await enrollment.save();

  let parentAccessToken: string | undefined;
  let parentGuardianHint: string | undefined;

  const guardianName = input.guardianName?.trim();
  const guardianEmail = input.guardianEmail?.trim();
  if (guardianName && guardianEmail && input.guardianConsent === true) {
    const linked = await upsertParentGuardian({
      studentUserId: userId,
      guardianName,
      guardianEmail,
      relationship: input.guardianRelationship,
      consent:      true,
    });
    parentAccessToken = linked.parentAccessToken;
    parentGuardianHint = linked.guardian.accessTokenHint;
  }

  return {
    enrollment: toPublic(enrollment),
    parentAccessToken,
    parentGuardianHint,
  };
}

export async function resolveTutorEnrollmentAccess(userId: string): Promise<{
  required:   boolean;
  complete:   boolean;
  enrollment: TutorEnrollmentPublic | null;
}> {
  if (await isTutorKodDaftarBypass(userId)) {
    return { required: false, complete: true, enrollment: null };
  }

  const enrollment = await getTutorEnrollmentForUser(userId);
  if (!enrollment) {
    return { required: true, complete: false, enrollment: null };
  }

  return {
    required:   true,
    complete:   enrollment.status === TutorEnrollmentStatus.COMPLETE,
    enrollment,
  };
}

export async function confirmTutorCodeStillValid(
  registerCode: string,
): Promise<TutorCodeValidation> {
  return validateTutorRegisterCode(registerCode);
}
