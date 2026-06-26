/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Business Coach PIN Service
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
import { BUSINESS_COACH_PIN_PREFIX } from './business-coach.constants';
import {
  BusinessCoachPinModel,
  BusinessCoachPinStatus,
  type IBusinessCoachPin,
} from './business-coach-pin.schema';

export function newBusinessCoachPinId(): string {
  return `BC-PIN-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function normalizeRegisterCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function randomCodeSuffix(): string {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

export async function allocateBusinessCoachPin(
  preferred?: string | null,
): Promise<string> {
  const trimmed = preferred ? normalizeRegisterCode(preferred) : '';
  if (trimmed) {
    const taken = await BusinessCoachPinModel.exists({ registerCode: trimmed });
    if (taken) throw new Error(`PIN ${trimmed} is already in use.`);
    return trimmed;
  }

  const prefix = BUSINESS_COACH_PIN_PREFIX;
  for (let i = 0; i < 200; i += 1) {
    const code = `${prefix}-${randomCodeSuffix()}`;
    const taken = await BusinessCoachPinModel.exists({ registerCode: code });
    if (!taken) return code;
  }

  throw new Error('Could not generate a unique PIN.');
}

export interface BusinessCoachPinValidation {
  valid:            boolean;
  distributorLabel?: string | null;
  error?:           string;
}

export async function validateBusinessCoachPin(
  raw: string,
): Promise<BusinessCoachPinValidation> {
  const registerCode = normalizeRegisterCode(raw);
  if (registerCode.length < 8) {
    return { valid: false, error: 'Invalid PIN.' };
  }

  const doc = await BusinessCoachPinModel.findOne({ registerCode }).lean();
  if (!doc) {
    return { valid: false, error: 'PIN not found.' };
  }

  if (doc.status === BusinessCoachPinStatus.REVOKED) {
    return { valid: false, error: 'This PIN has been revoked.' };
  }

  if (doc.status === BusinessCoachPinStatus.REDEEMED) {
    return {
      valid: false,
      error: 'This PIN has already been used. One PIN = one account.',
    };
  }

  return {
    valid:            true,
    distributorLabel: doc.distributorLabel,
  };
}

export async function getBusinessCoachPin(
  registerCode: string,
): Promise<IBusinessCoachPin | null> {
  return BusinessCoachPinModel.findOne({
    registerCode: normalizeRegisterCode(registerCode),
  });
}

export async function generateBusinessCoachPins(input: {
  count:            number;
  createdBy:        string;
  preferred?:       string | null;
  distributorLabel?: string | null;
  notes?:           string | null;
}): Promise<IBusinessCoachPin[]> {
  const count = Math.min(Math.max(input.count, 1), 500);
  const created: IBusinessCoachPin[] = [];

  for (let i = 0; i < count; i += 1) {
    const registerCode = await allocateBusinessCoachPin(
      i === 0 ? input.preferred : null,
    );
    const doc = await BusinessCoachPinModel.create({
      codeId:           newBusinessCoachPinId(),
      registerCode,
      distributorLabel: input.distributorLabel?.trim() || null,
      status:           BusinessCoachPinStatus.AVAILABLE,
      createdBy:        input.createdBy,
      notes:            input.notes?.trim() || null,
    });
    created.push(doc);
  }

  return created;
}

export async function listBusinessCoachPins(filters?: {
  status?: BusinessCoachPinStatus;
  limit?:  number;
}) {
  const query: Record<string, unknown> = {};
  if (filters?.status) query.status = filters.status;

  return BusinessCoachPinModel.find(query)
    .sort({ createdAt: -1 })
    .limit(filters?.limit ?? 200)
    .lean();
}

export async function revokeBusinessCoachPin(
  registerCode: string,
): Promise<boolean> {
  const result = await BusinessCoachPinModel.updateOne(
    {
      registerCode: normalizeRegisterCode(registerCode),
      status: { $in: [BusinessCoachPinStatus.AVAILABLE, BusinessCoachPinStatus.LOCKED] },
    },
    {
      $set: {
        status:   BusinessCoachPinStatus.REVOKED,
        lockedBy: null,
        lockedAt: null,
      },
    },
  );
  return result.modifiedCount > 0;
}

export async function lockBusinessCoachPin(
  registerCode: string,
  userId: string,
): Promise<IBusinessCoachPin> {
  const code = normalizeRegisterCode(registerCode);
  const validation = await validateBusinessCoachPin(code);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid PIN.');
  }

  const doc = await BusinessCoachPinModel.findOne({ registerCode: code });
  if (!doc) throw new Error('PIN not found.');

  if (doc.status === BusinessCoachPinStatus.LOCKED) {
    if (doc.lockedBy === userId) return doc;
    throw new Error('This PIN is locked by another user.');
  }

  if (doc.status !== BusinessCoachPinStatus.AVAILABLE) {
    throw new Error('PIN is not available.');
  }

  doc.status = BusinessCoachPinStatus.LOCKED;
  doc.lockedBy = userId;
  doc.lockedAt = new Date();
  await doc.save();
  return doc;
}

export async function markBusinessCoachPinRedeemed(
  registerCode: string,
  userId: string,
): Promise<void> {
  await BusinessCoachPinModel.updateOne(
    { registerCode: normalizeRegisterCode(registerCode) },
    {
      $set: {
        status:     BusinessCoachPinStatus.REDEEMED,
        redeemedBy: userId,
        redeemedAt: new Date(),
        lockedBy:   null,
        lockedAt:   null,
      },
    },
  );
}
