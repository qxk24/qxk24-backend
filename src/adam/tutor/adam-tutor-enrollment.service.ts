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
  TUTOR_REGISTER_BAND_LABELS_BM,
  TUTOR_REGISTER_PHASE_COUNTRY,
} from './adam-tutor-register.constants';
import {
  getTutorBandPricing,
} from './adam-tutor-pricing.service';
import {
  lockTutorRegisterCode,
  markTutorCodeRedeemed,
  type TutorCodeValidation,
  validateTutorRegisterCode,
} from './adam-tutor-register-code.service';
import { creditTutorAgentCommission } from './adam-tutor-agent-wallet.service';
import {
  TutorEnrollmentModel,
  TutorEnrollmentStatus,
  type ITutorEnrollment,
} from './adam-tutor-enrollment.schema';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

export function newTutorEnrollmentId(): string {
  return `TUTOR-ENR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface TutorEnrollmentPublic {
  enrollmentId:  string;
  status:        TutorEnrollmentStatus;
  band:          TutorSubscriptionLevel;
  bandLabel:     string;
  agentLabel:    string | null;
  registerCode:  string;
  studentName:   string | null;
  schoolName:    string | null;
  state:         string | null;
  yearLabel:     string | null;
  language:      string | null;
  paidAt:        string | null;
  completedAt:   string | null;
}

function toPublic(doc: ITutorEnrollment): TutorEnrollmentPublic {
  return {
    enrollmentId: doc.enrollmentId,
    status:       doc.status,
    band:         doc.band,
    bandLabel:    TUTOR_REGISTER_BAND_LABELS_BM[doc.band],
    agentLabel:   doc.agentLabel,
    registerCode: doc.registerCode,
    studentName:  doc.studentName,
    schoolName:   doc.schoolName,
    state:        doc.state,
    yearLabel:    doc.yearLabel,
    language:     doc.language,
    paidAt:       doc.paidAt?.toISOString() ?? null,
    completedAt:  doc.completedAt?.toISOString() ?? null,
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
  const existing = await TutorEnrollmentModel.findOne({ userId });
  if (existing?.status === TutorEnrollmentStatus.COMPLETE) {
    throw new Error('Pendaftaran ADAM Tutor anda sudah lengkap.');
  }

  const locked = await lockTutorRegisterCode(registerCode, userId);

  if (existing) {
    existing.registerCode = locked.registerCode;
    existing.band = locked.band;
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
    band:         locked.band,
    agentLabel:   locked.agentLabel,
    agentId:      locked.agentId ?? null,
    status:       TutorEnrollmentStatus.CODE_LOCKED,
  });

  return toPublic(doc);
}

export interface TutorCheckoutQuote {
  band:          TutorSubscriptionLevel;
  bandLabel:     string;
  monthlyUsd:    number;
  monthlyMyr:    number;
  usdMyrRate:    number;
  rateSource?:   string;
  rateFetchedAt?: string;
  currency:      'USD';
  agentLabel:    string | null;
  registerCode:  string;
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

  if (enrollment.status !== TutorEnrollmentStatus.CODE_LOCKED) {
    throw new Error('PIN tidak sah atau belum dikunci.');
  }

  return {
    band:         enrollment.band,
    bandLabel:    TUTOR_REGISTER_BAND_LABELS_BM[enrollment.band],
    ...(await (async () => {
      const p = await getTutorBandPricing(enrollment.band);
      return {
        monthlyUsd:    p.monthlyUsd,
        monthlyMyr:    p.monthlyMyr,
        usdMyrRate:    p.usdMyrRate,
        rateSource:    p.rateSource,
        rateFetchedAt: p.rateFetchedAt,
        currency:      'USD' as const,
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

  enrollment.status = TutorEnrollmentStatus.PAID;
  enrollment.paidAt = new Date();
  if (input.stripeSessionId) enrollment.stripeSessionId = input.stripeSessionId;
  if (input.subscriptionId) enrollment.subscriptionId = input.subscriptionId;
  await enrollment.save();

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
    studentName: string;
    schoolName:  string;
    state:       string;
    yearLabel?:  string;
    language?:   string;
    curriculum?: string;
  },
): Promise<TutorEnrollmentPublic> {
  const enrollment = await TutorEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Tiada pendaftaran PIN. Sila masukkan PIN anda.');
  }

  if (enrollment.status !== TutorEnrollmentStatus.PAID
    && enrollment.status !== TutorEnrollmentStatus.COMPLETE) {
    throw new Error('Sila selesaikan bayaran sebelum mengisi borang pendaftaran.');
  }

  const studentName = input.studentName.trim();
  const schoolName = input.schoolName.trim();
  const state = input.state.trim();
  if (!studentName || !schoolName || !state) {
    throw new Error('Nama, sekolah, dan negeri diperlukan.');
  }

  const account = await ADAMStudentAccountModel.findOne({ userId });
  if (!account) {
    throw new Error('Akaun pelajar tidak dijumpai.');
  }

  account.name = studentName;
  account.accountLane = 'pelajar';
  await account.save();

  const language = input.language?.trim() || 'malay';
  const curriculum = input.curriculum?.trim() || 'kpm';

  await saveTutorProfile(userId, {
    level:       enrollment.band,
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
  enrollment.status = TutorEnrollmentStatus.COMPLETE;
  enrollment.completedAt = new Date();
  await enrollment.save();

  return toPublic(enrollment);
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
