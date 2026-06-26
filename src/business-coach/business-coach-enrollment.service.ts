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
import {
  BUSINESS_COACH_PUBLIC_REGISTER_CODE,
} from './business-coach.constants';
import {
  type BusinessCoachProfessionalDomain,
  isBusinessCoachProfessionalDomain,
} from './business-coach-domains';

export function newBusinessCoachEnrollmentId(): string {
  return `BC-ENR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface BusinessCoachEnrollmentPublic {
  enrollmentId:       string;
  status:             BusinessCoachEnrollmentStatus;
  registerCode:       string;
  distributorLabel:   string | null;
  businessName:       string | null;
  country:            string | null;
  businessFocus:      string | null;
  professionalDomain: BusinessCoachProfessionalDomain | null;
  domainProfile:      Record<string, unknown> | null;
  pricingChannel:     'public' | 'pin';
  paidAt:             string | null;
  completedAt:        string | null;
}

function toPublic(doc: IBusinessCoachEnrollment): BusinessCoachEnrollmentPublic {
  return {
    enrollmentId:       doc.enrollmentId,
    status:             doc.status,
    registerCode:       doc.registerCode,
    distributorLabel:   doc.distributorLabel,
    businessName:       doc.businessName,
    country:            doc.country,
    businessFocus:      doc.businessFocus,
    professionalDomain: doc.professionalDomain,
    domainProfile:      doc.domainProfile,
    pricingChannel:     doc.pricingChannel ?? 'pin',
    paidAt:             doc.paidAt?.toISOString() ?? null,
    completedAt:        doc.completedAt?.toISOString() ?? null,
  };
}

export async function getBusinessCoachEnrollmentForUser(
  userId: string,
): Promise<BusinessCoachEnrollmentPublic | null> {
  const doc = await BusinessCoachEnrollmentModel.findOne({ userId }).lean();
  if (!doc) return null;
  return toPublic(doc as unknown as IBusinessCoachEnrollment);
}

export async function startBusinessCoachPublicEnrollment(
  userId: string,
): Promise<BusinessCoachEnrollmentPublic> {
  if (userId === FOUNDER_USER_ID) {
    throw new Error('Register with a user account — not the admin account.');
  }

  const existing = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (existing) {
    if (existing.status === BusinessCoachEnrollmentStatus.COMPLETE) {
      throw new Error('Your ADAM Business Coach registration is already complete.');
    }
    if (existing.pricingChannel !== 'public') {
      throw new Error('You already started PIN registration. Continue with your PIN or use a new account for public checkout.');
    }
    if (existing.status === BusinessCoachEnrollmentStatus.CODE_LOCKED) {
      return toPublic(existing);
    }
    return toPublic(existing);
  }

  const doc = await BusinessCoachEnrollmentModel.create({
    enrollmentId:     newBusinessCoachEnrollmentId(),
    userId,
    registerCode:     BUSINESS_COACH_PUBLIC_REGISTER_CODE,
    distributorLabel: null,
    status:           BusinessCoachEnrollmentStatus.CODE_LOCKED,
    pricingChannel:   'public',
  });

  return toPublic(doc);
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

export async function setBusinessCoachProfessionalDomain(
  userId: string,
  professionalDomain: BusinessCoachProfessionalDomain,
): Promise<BusinessCoachEnrollmentPublic> {
  if (!isBusinessCoachProfessionalDomain(professionalDomain)) {
    throw new Error('Choose a valid professional domain.');
  }

  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Start ADAM Business Coach registration first.');
  }

  if (
    enrollment.status !== BusinessCoachEnrollmentStatus.CODE_LOCKED
    && enrollment.status !== BusinessCoachEnrollmentStatus.PROFILE_SAVED
  ) {
    throw new Error('Enrollment is not ready for domain selection.');
  }

  enrollment.professionalDomain = professionalDomain;
  await enrollment.save();
  return toPublic(enrollment);
}

export async function completeBusinessCoachEnrollmentProfile(
  userId: string,
  input: {
    professionalDomain: BusinessCoachProfessionalDomain;
    businessName?:      string;
    country:            string;
    businessFocus?:     string;
    domainProfile?:     Record<string, unknown>;
  },
): Promise<BusinessCoachEnrollmentPublic> {
  if (!isBusinessCoachProfessionalDomain(input.professionalDomain)) {
    throw new Error('Choose a valid professional domain.');
  }

  const country = input.country.trim();
  if (!country) {
    throw new Error('Country is required.');
  }

  const displayName = input.businessName?.trim()
    ?? (input.domainProfile?.organizationName as string | undefined)?.trim()
    ?? (input.domainProfile?.entityName as string | undefined)?.trim()
    ?? (input.domainProfile?.displayName as string | undefined)?.trim()
    ?? null;

  if (!displayName) {
    throw new Error('A display name is required for your domain profile.');
  }

  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Start ADAM Business Coach registration first.');
  }

  if (
    enrollment.status !== BusinessCoachEnrollmentStatus.CODE_LOCKED
    && enrollment.status !== BusinessCoachEnrollmentStatus.PROFILE_SAVED
  ) {
    throw new Error('Enrollment is not ready for profile update.');
  }

  enrollment.professionalDomain = input.professionalDomain;
  enrollment.country = country;
  enrollment.domainProfile = input.domainProfile ?? null;
  enrollment.businessName = displayName;
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
  channel:      'public' | 'pin';
  monthly:      number;
  currency:     string;
  label:        string;
}> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId });
  if (!enrollment) {
    throw new Error('Start ADAM Business Coach registration first.');
  }
  if (enrollment.status !== BusinessCoachEnrollmentStatus.PROFILE_SAVED) {
    throw new Error('Complete your domain profile before checkout.');
  }
  if (!enrollment.professionalDomain) {
    throw new Error('Choose your professional domain before checkout.');
  }

  const channel = enrollment.pricingChannel === 'public' ? 'public' : 'pin';
  const pricing = getBusinessCoachPricing(channel);
  return {
    enrollmentId: enrollment.enrollmentId,
    channel,
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

  if (enrollment.businessName && enrollment.country && enrollment.professionalDomain) {
    enrollment.status = BusinessCoachEnrollmentStatus.COMPLETE;
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  if (input.subscriptionId) {
    const { SubscriptionModel } = await import('../subscriptions/subscription.schema');
    await SubscriptionModel.findByIdAndUpdate(input.subscriptionId, {
      $set: {
        businessCoachChannel:      enrollment.pricingChannel ?? 'pin',
        businessCoachEnrollmentId: enrollment.enrollmentId,
      },
    });
  }

  if (
    enrollment.pricingChannel === 'pin'
    && enrollment.registerCode !== BUSINESS_COACH_PUBLIC_REGISTER_CODE
  ) {
    const { markBusinessCoachPinRedeemed } = await import('./business-coach-pin.service');
    await markBusinessCoachPinRedeemed(enrollment.registerCode, input.userId);
  }
}

export async function loadBusinessCoachDomainContext(
  userId: string,
): Promise<{
  professionalDomain: BusinessCoachProfessionalDomain;
  domainProfile:      Record<string, unknown> | null;
} | null> {
  const enrollment = await BusinessCoachEnrollmentModel.findOne({ userId }).lean();
  if (!enrollment?.professionalDomain) return null;
  if (!isBusinessCoachProfessionalDomain(enrollment.professionalDomain)) return null;
  return {
    professionalDomain: enrollment.professionalDomain,
    domainProfile:      enrollment.domainProfile ?? null,
  };
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
