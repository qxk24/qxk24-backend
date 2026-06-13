/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Channel Code Generator
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import crypto from 'crypto';
import { NiagaPartnerLicenseModel } from './niaga-partner-license.schema';
import { slugOrgForChannelCode } from './niaga-tier.service';

export function newNiagaApplicationId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `NIAGA-APP-${ts}-${rand}`;
}

export function newNiagaLicenseId(): string {
  return `NIAGA-LIC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newNiagaPortalToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export async function allocateChannelCode(
  orgName: string,
  preferred?: string | null,
): Promise<string> {
  const trimmed = preferred?.trim().toUpperCase();
  if (trimmed) {
    const taken = await NiagaPartnerLicenseModel.exists({ channelCode: trimmed });
    if (taken) throw new Error(`Channel code ${trimmed} is already in use.`);
    return trimmed;
  }

  const slug = slugOrgForChannelCode(orgName);
  for (let seq = 1; seq <= 999; seq += 1) {
    const code = `NIAGA-${slug}-${String(seq).padStart(3, '0')}`;
    const taken = await NiagaPartnerLicenseModel.exists({ channelCode: code });
    if (!taken) return code;
  }

  throw new Error('Unable to allocate a unique channel code.');
}

function addOneYear(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export { addOneYear as niagaRenewalDueFromNow };
