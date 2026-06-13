/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Trader Registration Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import crypto from 'crypto';
import {
  NiagaTraderRegistrationModel,
  NiagaTraderStatus,
  type INiagaTraderRegistration,
} from './niaga-trader-registration.schema';
import { NiagaPartnerLicenseModel } from './niaga-partner-license.schema';
import { NiagaLicenseStatus } from './niaga.types';

export function newNiagaRegistrationId(): string {
  return `NIAGA-REG-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface NiagaTraderRegisterInput {
  userId:        string;
  channelCode:   string;
  businessName:  string;
  businessType:  string;
  state:         string;
  businessBrief?: string;
}

export async function validateNiagaChannelCode(channelCode: string): Promise<{
  valid: boolean;
  orgName?: string;
  error?: string;
}> {
  const code = channelCode.trim().toUpperCase();
  const license = await NiagaPartnerLicenseModel.findOne({ channelCode: code }).lean();
  if (!license) {
    return { valid: false, error: 'Channel code not found.' };
  }
  if (license.status !== NiagaLicenseStatus.ACTIVE) {
    return { valid: false, error: 'Channel code is suspended or expired.' };
  }
  return { valid: true, orgName: license.orgName };
}

export async function submitNiagaTraderRegistration(
  input: NiagaTraderRegisterInput,
): Promise<{ registrationId: string; status: NiagaTraderStatus }> {
  const channelCode = input.channelCode.trim().toUpperCase();
  const validation = await validateNiagaChannelCode(channelCode);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid channel code.');
  }

  const license = await NiagaPartnerLicenseModel.findOne({ channelCode }).lean();
  if (!license) throw new Error('Channel code not found.');

  if (license.maxActiveTraders != null) {
    const activeCount = await NiagaTraderRegistrationModel.countDocuments({
      channelCode,
      status: { $in: [NiagaTraderStatus.APPROVED, NiagaTraderStatus.ACTIVE] },
    });
    if (activeCount >= license.maxActiveTraders) {
      throw new Error('This channel has reached its active trader limit.');
    }
  }

  const existing = await NiagaTraderRegistrationModel.findOne({
    userId: input.userId,
    channelCode,
  });
  if (existing) {
    if (existing.status === NiagaTraderStatus.REJECTED) {
      existing.businessName = input.businessName.trim();
      existing.businessType = input.businessType.trim();
      existing.state = input.state.trim();
      existing.businessBrief = input.businessBrief?.trim() || null;
      existing.status = NiagaTraderStatus.PENDING;
      existing.rejectReason = null;
      existing.reviewedAt = null;
      await existing.save();
      return { registrationId: existing.registrationId, status: existing.status };
    }
    throw new Error(`You already have a ${existing.status} registration under this channel.`);
  }

  const pendingDup = await NiagaTraderRegistrationModel.findOne({
    userId: input.userId,
    status: NiagaTraderStatus.PENDING,
  });
  if (pendingDup) {
    throw new Error('You already have a pending trader registration.');
  }

  const registrationId = newNiagaRegistrationId();
  const doc = await NiagaTraderRegistrationModel.create({
    registrationId,
    userId:       input.userId,
    channelCode,
    businessName: input.businessName.trim(),
    businessType: input.businessType.trim(),
    state:        input.state.trim(),
    businessBrief: input.businessBrief?.trim() || null,
    status:       NiagaTraderStatus.PENDING,
  });

  return { registrationId: doc.registrationId, status: doc.status };
}

export async function listNiagaTraders(filters?: {
  channelCode?: string;
  status?: NiagaTraderStatus;
}): Promise<INiagaTraderRegistration[]> {
  const query: Record<string, unknown> = {};
  if (filters?.channelCode) query.channelCode = filters.channelCode.trim().toUpperCase();
  if (filters?.status) query.status = filters.status;

  return NiagaTraderRegistrationModel.find(query)
    .sort({ createdAt: -1 })
    .lean() as unknown as INiagaTraderRegistration[];
}

export async function approveNiagaTrader(
  registrationId: string,
  channelCode: string,
  approvedBy?: string,
): Promise<void> {
  const reg = await NiagaTraderRegistrationModel.findOne({
    registrationId,
    channelCode: channelCode.trim().toUpperCase(),
  });
  if (!reg) throw new Error('Registration not found for this channel.');
  if (reg.status !== NiagaTraderStatus.PENDING) {
    throw new Error(`Registration is already ${reg.status}.`);
  }

  reg.status = NiagaTraderStatus.APPROVED;
  reg.approvedBy = approvedBy?.trim() || null;
  reg.reviewedAt = new Date();
  await reg.save();
}

export async function rejectNiagaTrader(
  registrationId: string,
  channelCode: string,
  reason?: string,
  approvedBy?: string,
): Promise<void> {
  const reg = await NiagaTraderRegistrationModel.findOne({
    registrationId,
    channelCode: channelCode.trim().toUpperCase(),
  });
  if (!reg) throw new Error('Registration not found for this channel.');
  if (reg.status !== NiagaTraderStatus.PENDING) {
    throw new Error(`Registration is already ${reg.status}.`);
  }

  reg.status = NiagaTraderStatus.REJECTED;
  reg.rejectReason = reason?.trim() || null;
  reg.approvedBy = approvedBy?.trim() || null;
  reg.reviewedAt = new Date();
  await reg.save();
}

export async function activateNiagaTrader(registrationId: string): Promise<void> {
  const reg = await NiagaTraderRegistrationModel.findOne({ registrationId });
  if (!reg) return;
  if (reg.status === NiagaTraderStatus.ACTIVE) return;
  reg.status = NiagaTraderStatus.ACTIVE;
  reg.reviewedAt = new Date();
  await reg.save();
}

export async function countNiagaTraders(): Promise<{ pending: number; active: number }> {
  const [pending, active] = await Promise.all([
    NiagaTraderRegistrationModel.countDocuments({ status: NiagaTraderStatus.PENDING }),
    NiagaTraderRegistrationModel.countDocuments({ status: NiagaTraderStatus.ACTIVE }),
  ]);
  return { pending, active };
}

export async function getNiagaTraderRegistration(
  registrationId: string,
): Promise<INiagaTraderRegistration | null> {
  return NiagaTraderRegistrationModel.findOne({ registrationId }).lean() as unknown as INiagaTraderRegistration | null;
}

export async function getNiagaTraderByUser(
  userId: string,
): Promise<INiagaTraderRegistration | null> {
  return NiagaTraderRegistrationModel.findOne({ userId })
    .sort({ updatedAt: -1 })
    .lean() as unknown as INiagaTraderRegistration | null;
}
