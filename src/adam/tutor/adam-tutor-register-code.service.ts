/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Code Service
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
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import {
  TUTOR_REGISTER_BAND_LABELS_BM,
  TUTOR_REGISTER_BAND_PREFIX,
} from './adam-tutor-register.constants';
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
  type ITutorRegisterCode,
} from './adam-tutor-register-code.schema';
import { getTutorAgentById } from './adam-tutor-agent.service';

export function newTutorRegisterCodeId(): string {
  return `TUTOR-CODE-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function normalizeRegisterCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function randomCodeSuffix(): string {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

export async function allocateTutorRegisterCode(
  band: TutorSubscriptionLevel,
  preferred?: string | null,
): Promise<string> {
  const trimmed = preferred ? normalizeRegisterCode(preferred) : '';
  if (trimmed) {
    const taken = await TutorRegisterCodeModel.exists({ registerCode: trimmed });
    if (taken) throw new Error(`Kod daftar ${trimmed} sudah digunakan.`);
    return trimmed;
  }

  const prefix = `TUTOR-${TUTOR_REGISTER_BAND_PREFIX[band]}`;
  for (let i = 0; i < 200; i += 1) {
    const code = `${prefix}-${randomCodeSuffix()}`;
    const taken = await TutorRegisterCodeModel.exists({ registerCode: code });
    if (!taken) return code;
  }

  throw new Error('Tidak dapat menjana kod daftar unik.');
}

export interface TutorCodeValidation {
  valid:       boolean;
  band?:       TutorSubscriptionLevel;
  bandLabel?:  string;
  agentLabel?: string | null;
  error?:      string;
}

export async function validateTutorRegisterCode(raw: string): Promise<TutorCodeValidation> {
  const registerCode = normalizeRegisterCode(raw);
  if (registerCode.length < 8) {
    return { valid: false, error: 'Kod daftar tidak sah.' };
  }

  const doc = await TutorRegisterCodeModel.findOne({ registerCode }).lean();
  if (!doc) {
    return { valid: false, error: 'Kod daftar tidak dijumpai.' };
  }

  if (doc.status === TutorRegisterCodeStatus.REVOKED) {
    return { valid: false, error: 'Kod daftar ini telah dibatalkan.' };
  }

  if (doc.status === TutorRegisterCodeStatus.REDEEMED) {
    return { valid: false, error: 'Kod daftar ini sudah digunakan.' };
  }

  return {
    valid:      true,
    band:       doc.band,
    bandLabel:  TUTOR_REGISTER_BAND_LABELS_BM[doc.band],
    agentLabel: doc.agentLabel,
  };
}

export async function getTutorRegisterCode(
  registerCode: string,
): Promise<ITutorRegisterCode | null> {
  return TutorRegisterCodeModel.findOne({
    registerCode: normalizeRegisterCode(registerCode),
  });
}

export async function generateTutorRegisterCodes(input: {
  band:        TutorSubscriptionLevel;
  count:       number;
  agentId?:    string;
  agentLabel?: string;
  notes?:      string;
  createdBy:   string;
  preferred?:  string;
}): Promise<ITutorRegisterCode[]> {
  const count = Math.min(Math.max(input.count, 1), 50);
  const created: ITutorRegisterCode[] = [];

  let agentId: string | null = input.agentId?.trim() || null;
  let agentLabel = input.agentLabel?.trim() || null;

  if (agentId) {
    const agent = await getTutorAgentById(agentId);
    if (!agent) throw new Error('Ejen tidak dijumpai.');
    agentLabel = agent.orgName;
  }

  for (let i = 0; i < count; i += 1) {
    const registerCode = await allocateTutorRegisterCode(
      input.band,
      i === 0 ? input.preferred : null,
    );
    const doc = await TutorRegisterCodeModel.create({
      codeId:       newTutorRegisterCodeId(),
      registerCode,
      band:         input.band,
      agentId,
      agentLabel,
      status:       TutorRegisterCodeStatus.AVAILABLE,
      createdBy:    input.createdBy,
      notes:        input.notes?.trim() || null,
    });
    created.push(doc);
  }

  return created;
}

export async function listTutorRegisterCodes(filters?: {
  band?:   TutorSubscriptionLevel;
  status?: TutorRegisterCodeStatus;
  limit?:  number;
}) {
  const query: Record<string, unknown> = {};
  if (filters?.band) query.band = filters.band;
  if (filters?.status) query.status = filters.status;

  return TutorRegisterCodeModel.find(query)
    .sort({ createdAt: -1 })
    .limit(filters?.limit ?? 200)
    .lean();
}

export async function revokeTutorRegisterCode(
  registerCode: string,
): Promise<boolean> {
  const result = await TutorRegisterCodeModel.updateOne(
    {
      registerCode: normalizeRegisterCode(registerCode),
      status: { $in: [TutorRegisterCodeStatus.AVAILABLE, TutorRegisterCodeStatus.LOCKED] },
    },
    {
      $set: {
        status:   TutorRegisterCodeStatus.REVOKED,
        lockedBy: null,
        lockedAt: null,
      },
    },
  );
  return result.modifiedCount > 0;
}

export async function lockTutorRegisterCode(
  registerCode: string,
  userId: string,
): Promise<ITutorRegisterCode> {
  const code = normalizeRegisterCode(registerCode);
  const validation = await validateTutorRegisterCode(code);
  if (!validation.valid || !validation.band) {
    throw new Error(validation.error ?? 'Kod daftar tidak sah.');
  }

  const doc = await TutorRegisterCodeModel.findOne({ registerCode: code });
  if (!doc) throw new Error('Kod daftar tidak dijumpai.');

  if (doc.status === TutorRegisterCodeStatus.LOCKED) {
    if (doc.lockedBy === userId) return doc;
    throw new Error('Kod daftar ini sedang dikunci oleh pelajar lain.');
  }

  if (doc.status !== TutorRegisterCodeStatus.AVAILABLE) {
    throw new Error('Kod daftar tidak tersedia.');
  }

  doc.status = TutorRegisterCodeStatus.LOCKED;
  doc.lockedBy = userId;
  doc.lockedAt = new Date();
  await doc.save();
  return doc;
}

export async function markTutorCodeRedeemed(
  registerCode: string,
  userId: string,
): Promise<void> {
  await TutorRegisterCodeModel.updateOne(
    { registerCode: normalizeRegisterCode(registerCode) },
    {
      $set: {
        status:     TutorRegisterCodeStatus.REDEEMED,
        redeemedBy: userId,
        redeemedAt: new Date(),
      },
    },
  );
}

export async function releaseTutorCodeLock(registerCode: string, userId: string): Promise<void> {
  await TutorRegisterCodeModel.updateOne(
    {
      registerCode: normalizeRegisterCode(registerCode),
      lockedBy:     userId,
      status:       TutorRegisterCodeStatus.LOCKED,
    },
    {
      $set: {
        status:   TutorRegisterCodeStatus.AVAILABLE,
        lockedBy: null,
        lockedAt: null,
      },
    },
  );
}
