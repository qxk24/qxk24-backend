/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Partner Application Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import {
  NiagaPartnerApplicationModel,
  type INiagaPartnerApplication,
} from './niaga-partner-application.schema';
import {
  NiagaPartnerLicenseModel,
  type INiagaPartnerLicense,
} from './niaga-partner-license.schema';
import {
  NiagaApplicationStatus,
  NiagaLicenseStatus,
  NiagaLicenseTier,
  type NiagaEntityType,
  isNiagaEntityType,
} from './niaga.types';
import {
  allocateChannelCode,
  newNiagaApplicationId,
  newNiagaLicenseId,
  newNiagaPortalToken,
  niagaRenewalDueFromNow,
} from './niaga-channel-code.service';
import { getNiagaTierTerms, resolveNiagaTier } from './niaga-tier.service';
import { countNiagaTraders } from './niaga-trader.service';
import { computeNiagaMrr } from './niaga-payment-ledger.service';

export interface NiagaPartnerApplyInput {
  applicationId?: string;
  entityType:     NiagaEntityType;
  orgName:        string;
  contactName:    string;
  email:          string;
  phone:          string;
  state:          string;
  memberCount?:   number;
  programSummary: string;
  locale?:        string;
}

export interface NiagaAdminOverview {
  pendingApplications:   number;
  activeLicenses:        number;
  suspendedLicenses:     number;
  totalApplications:     number;
  pendingTraders:        number;
  activeTraders:         number;
  mrrRetailMyr:          number;
  mrrWholesaleMyr:       number;
}

export interface NiagaApproveInput {
  channelCode?:  string;
  parentCode?:   string;
  companyTier?:  'B' | 'C';
  notes?:        string;
  reviewedBy?:   string;
}

export async function submitNiagaPartnerApplication(
  input: NiagaPartnerApplyInput,
): Promise<{ applicationId: string; status: NiagaApplicationStatus }> {
  if (!isNiagaEntityType(input.entityType)) {
    throw new Error('Invalid entity type.');
  }

  const email = input.email.trim().toLowerCase();
  const programSummary = input.programSummary.trim();

  if (programSummary.length < 40) {
    throw new Error('Programme summary must be at least 40 characters.');
  }

  const pending = await NiagaPartnerApplicationModel.findOne({
    email,
    status: NiagaApplicationStatus.PENDING,
  });
  if (pending) {
    throw new Error('An application with this email is already under review.');
  }

  const applicationId = input.applicationId?.trim() || newNiagaApplicationId();

  const existingId = await NiagaPartnerApplicationModel.findOne({ applicationId });
  if (existingId) {
    throw new Error('Application reference already exists.');
  }

  const doc = await NiagaPartnerApplicationModel.create({
    applicationId,
    entityType:     input.entityType,
    orgName:        input.orgName.trim(),
    contactName:    input.contactName.trim(),
    email,
    phone:          input.phone.trim(),
    state:          input.state.trim(),
    memberCount:    input.entityType === 'koperasi' && input.memberCount != null
      ? input.memberCount
      : null,
    programSummary,
    locale:         input.locale?.trim() || 'ms',
    status:         NiagaApplicationStatus.PENDING,
  });

  return { applicationId: doc.applicationId, status: doc.status };
}

export async function getNiagaAdminOverview(): Promise<NiagaAdminOverview> {
  const [
    pendingApplications,
    activeLicenses,
    suspendedLicenses,
    totalApplications,
    traderCounts,
    mrr,
  ] = await Promise.all([
    NiagaPartnerApplicationModel.countDocuments({ status: NiagaApplicationStatus.PENDING }),
    NiagaPartnerLicenseModel.countDocuments({ status: NiagaLicenseStatus.ACTIVE }),
    NiagaPartnerLicenseModel.countDocuments({ status: NiagaLicenseStatus.SUSPENDED }),
    NiagaPartnerApplicationModel.countDocuments({}),
    countNiagaTraders(),
    computeNiagaMrr(),
  ]);

  return {
    pendingApplications,
    activeLicenses,
    suspendedLicenses,
    totalApplications,
    pendingTraders:  traderCounts.pending,
    activeTraders:   traderCounts.active,
    mrrRetailMyr:    mrr.retail,
    mrrWholesaleMyr: mrr.wholesale,
  };
}

export async function listNiagaPartnerApplications(
  status?: NiagaApplicationStatus,
): Promise<INiagaPartnerApplication[]> {
  const filter = status ? { status } : {};
  return NiagaPartnerApplicationModel.find(filter)
    .sort({ createdAt: -1 })
    .lean() as unknown as INiagaPartnerApplication[];
}

export async function listNiagaPartnerLicenses(): Promise<INiagaPartnerLicense[]> {
  return NiagaPartnerLicenseModel.find()
    .sort({ createdAt: -1 })
    .lean() as unknown as INiagaPartnerLicense[];
}

export async function approveNiagaPartnerApplication(
  applicationId: string,
  input: NiagaApproveInput = {},
): Promise<{ applicationId: string; licenseId: string; channelCode: string; tier: NiagaLicenseTier; portalToken: string }> {
  const app = await NiagaPartnerApplicationModel.findOne({ applicationId });
  if (!app) throw new Error('Application not found.');
  if (app.status !== NiagaApplicationStatus.PENDING) {
    throw new Error(`Application is already ${app.status}.`);
  }

  const existingLicense = await NiagaPartnerLicenseModel.findOne({ applicationId });
  if (existingLicense) {
    throw new Error('License already issued for this application.');
  }

  const tier = resolveNiagaTier(app.entityType, app.memberCount, input.companyTier);
  const terms = getNiagaTierTerms(tier);
  const channelCode = await allocateChannelCode(app.orgName, input.channelCode);
  const licenseId = newNiagaLicenseId();
  const portalToken = newNiagaPortalToken();
  const setupPaid = tier === NiagaLicenseTier.GOV || terms.setupFeeMyr === 0;

  await NiagaPartnerLicenseModel.create({
    licenseId,
    applicationId:    app.applicationId,
    channelCode,
    parentCode:       input.parentCode?.trim() || null,
    entityType:       app.entityType,
    tier,
    orgName:          app.orgName,
    contactName:      app.contactName,
    email:            app.email,
    phone:            app.phone,
    state:            app.state,
    memberCount:        app.memberCount,
    setupFeeMyr:      terms.setupFeeMyr,
    renewalFeeMyr:    terms.renewalFeeMyr,
    wholesalePerSeat: terms.wholesalePerSeat,
    maxActiveTraders: terms.maxActiveTraders,
    setupPaid,
    renewalDue:       niagaRenewalDueFromNow(),
    status:           NiagaLicenseStatus.ACTIVE,
    approvedBy:       input.reviewedBy?.trim() || null,
    notes:            input.notes?.trim() || null,
    portalToken,
  });

  app.status = NiagaApplicationStatus.APPROVED;
  app.licenseId = licenseId;
  app.channelCode = channelCode;
  app.reviewedBy = input.reviewedBy?.trim() || null;
  app.reviewedAt = new Date();
  await app.save();

  return { applicationId, licenseId, channelCode, tier, portalToken };
}

export async function rejectNiagaPartnerApplication(
  applicationId: string,
  reason?: string,
  reviewedBy?: string,
): Promise<void> {
  const app = await NiagaPartnerApplicationModel.findOne({ applicationId });
  if (!app) throw new Error('Application not found.');
  if (app.status !== NiagaApplicationStatus.PENDING) {
    throw new Error(`Application is already ${app.status}.`);
  }

  app.status = NiagaApplicationStatus.REJECTED;
  app.rejectReason = reason?.trim() || null;
  app.reviewedBy = reviewedBy?.trim() || null;
  app.reviewedAt = new Date();
  await app.save();
}

export async function suspendNiagaPartnerLicense(
  channelCode: string,
  reviewedBy?: string,
): Promise<void> {
  const license = await NiagaPartnerLicenseModel.findOne({ channelCode: channelCode.trim().toUpperCase() });
  if (!license) throw new Error('License not found.');
  license.status = NiagaLicenseStatus.SUSPENDED;
  license.approvedBy = reviewedBy?.trim() || license.approvedBy;
  await license.save();
}
