/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach Enrollment Service
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

import crypto from 'crypto';
import { FOUNDER_USER_ID } from '../adam/adam-student.types';
import { getBusinessCoachPricing } from '../subscriptions/tier-access.config';
import {
  lockBusinessCoachPin,
  validateBusinessCoachPin,
} from './business-coach-pin.service';
import {
  BusinessCoachEnrollmentModel,
  BusinessCoachEnrollmentStatus,
  type IBusinessCoachEnrollment,
} from './business-coach-enrollment.schema';
import type { AdamNiagaBusinessProfile } from '../adam/adam-niaga-law';

export function newBusinessCoachEnrollmentId(): string {
  return `BC-ENR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface BusinessCoachEnrollmentPublic {
  enrollmentId:     string;
  status:           BusinessCoachEnrollmentStatus;
  registerCode:     string;
  distributorLabel: string | null;
  businessName:     string | null;
  country:          string | null;
  businessFocus:    string | null;
  pricingChannel:   'public' | 'pin';
  paidAt:           string | null;
  completedAt:      string | null;
}

function toPublic(doc: IBusinessCoachEnrollment): BusinessCoachEnrollmentPublic {
  return {
    enrollmentId:     doc.enrollmentId,
    status:           doc.status,
    registerCode:     doc.registerCode,
    distributorLabel: doc.distributorLabel,
    businessName:     doc.businessName,
    country:          doc.country,
    businessFocus:    doc.businessFocus,
    pricingChannel:   doc.pricingChannel ?? 'pin',
    paidAt:           doc.paidAt?.toISOString() ?? null,
    completedAt:      doc.completedAt?.toISOString() ?? null,
  };
}

export async function getBusinessCoachEnrollmentForUser(
  userId: string,
): Promise<BusinessCoachEnrollmentPublic | null> {
  const doc = await BusinessCoachEnrollmentModel.findOne({ userId }).lean();
  if (!doc) return null;
  return toPublic(doc as unknown as IBusinessCoachEnrollment);
}

export async function lockBusinessCoachEnrollmentPin(
  userId: string,
  registerCode: string,
): Promise<BusinessCoachEnrollmentPublic> {
  if (userId === FOUNDER_USER_ID) {
    throw new Error('Register with a user account — not the admin account.');
  }

  const existing = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (existing?.status === BusinessCoachEnrollmentStatus.COMPLETE) {
    throw new Error('Your ADAM Business Coach registration is already complete.');
  }

  const locked = await lockBusinessCoachPin(registerCode, userId);

  if (existing) {
    existing.registerCode = locked.registerCode;
    existing.distributorLabel = locked.distributorLabel;
    existing.status = BusinessCoachEnrollmentStatus.CODE_LOCKED;
    existing.pricingChannel = 'pin';
    await existing.save();
    return toPublic(existing);
  }

  const doc = await BusinessCoachEnrollmentModel.create({
    enrollmentId:     newBusinessCoachEnrollmentId(),
    userId,
    registerCode:     locked.registerCode,
    distributorLabel: locked.distributorLabel,
    status:           BusinessCoachEnrollmentStatus.CODE_LOCKED,
    pricingChannel:   'pin',
  });

  return toPublic(doc);
}

export async function completeBusinessCoachEnrollmentProfile(
  userId: string,
  input: {
    businessName:  string;
    country:       string;
    businessFocus?: string;
  },
): Promise<BusinessCoachEnrollmentPublic> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Enter your ADAM Business Coach PIN first.');
  }

  if (
    enrollment.status !== BusinessCoachEnrollmentStatus.CODE_LOCKED
    && enrollment.status !== BusinessCoachEnrollmentStatus.PROFILE_SAVED
  ) {
    throw new Error('Enrollment is not ready for profile update.');
  }

  enrollment.businessName = input.businessName.trim();
  enrollment.country = input.country.trim();
  enrollment.businessFocus = input.businessFocus?.trim() || null;
  enrollment.status = BusinessCoachEnrollmentStatus.PROFILE_SAVED;

  if (enrollment.paidAt) {
    enrollment.status = BusinessCoachEnrollmentStatus.COMPLETE;
    enrollment.completedAt = enrollment.completedAt ?? new Date();
  }

  await enrollment.save();
  return toPublic(enrollment);
}

export async function getBusinessCoachEnrollmentCheckoutQuote(
  userId: string,
): Promise<{
  enrollmentId: string;
  channel:      'pin';
  monthly:      number;
  currency:     string;
  label:        string;
}> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Enter your ADAM Business Coach PIN first.');
  }
  if (enrollment.status !== BusinessCoachEnrollmentStatus.PROFILE_SAVED) {
    throw new Error('Complete your business profile before checkout.');
  }

  const pricing = getBusinessCoachPricing('pin');
  return {
    enrollmentId: enrollment.enrollmentId,
    channel:      'pin',
    monthly:      pricing.monthly,
    currency:     pricing.currency,
    label:        pricing.label,
  };
}

export async function markBusinessCoachEnrollmentPaid(input: {
  userId:          string;
  enrollmentId:    string;
  stripeSessionId?: string;
  subscriptionId?: string;
}): Promise<void> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({
    enrollmentId: input.enrollmentId,
    userId:       input.userId,
  });
  if (!enrollment) return;
  if (enrollment.status === BusinessCoachEnrollmentStatus.COMPLETE) return;

  enrollment.status = BusinessCoachEnrollmentStatus.PAID;
  enrollment.paidAt = enrollment.paidAt ?? new Date();
  if (input.stripeSessionId) enrollment.stripeSessionId = input.stripeSessionId;
  if (input.subscriptionId) enrollment.subscriptionId = input.subscriptionId;

  if (enrollment.businessName && enrollment.country) {
    enrollment.status = BusinessCoachEnrollmentStatus.COMPLETE;
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  if (input.subscriptionId) {
    const { SubscriptionModel } = await import('../subscriptions/subscription.schema');
    await SubscriptionModel.findByIdAndUpdate(input.subscriptionId, {
      $set: {
        businessCoachChannel:      'pin',
        businessCoachEnrollmentId: enrollment.enrollmentId,
      },
    });
  }

  const { markBusinessCoachPinRedeemed } = await import('./business-coach-pin.service');
  await markBusinessCoachPinRedeemed(enrollment.registerCode, input.userId);
}

export async function loadBusinessCoachProfile(
  userId: string,
): Promise<AdamNiagaBusinessProfile | null> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId }).lean();
  if (!enrollment?.businessName) return null;

  return {
    businessName:  enrollment.businessName,
    businessType:  enrollment.businessFocus ?? '',
    state:         enrollment.country ?? '',
    channelCode:   '',
    businessBrief: enrollment.businessFocus ?? '',
    partnerOrg:    enrollment.distributorLabel ?? null,
  };
}

export async function resolveBusinessCoachSubscriptionId(
  userId: string,
): Promise<string | null> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId }).lean();
  if (enrollment?.subscriptionId) return enrollment.subscriptionId;

  const { SubscriptionModel, SubscriptionStatus, SubscriptionTier } = await import(
    '../subscriptions/subscription.schema'
  );
  const sub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.BUSINESS_COACH,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
  })
    .sort({ createdAt: -1 })
    .lean();

  return sub?._id?.toString() ?? null;
}
