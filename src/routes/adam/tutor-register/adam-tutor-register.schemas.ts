/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Schemas
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
import { z } from 'zod';
import { getTokenUser } from '../../../middleware/auth.middleware';
import { MALAYSIA_STATES } from '../../../adam/tutor/adam-tutor-agent-identity';
import { TUTOR_AGENT_PACKAGE_TIERS } from '../../../adam/tutor/adam-tutor-agent-package.config';
import { isValidTutorAgentLoginCode } from '../../../adam/tutor/adam-tutor-agent-code';
import { ensureQaTestAgentPinsMinted } from '../../../adam/tutor/adam-tutor-test-agent.service';
import { ensureAgentPackagePinsMinted } from '../../../adam/tutor/adam-tutor-agent-pin-mint.service';
import type { ITutorAgent } from '../../../adam/tutor/adam-tutor-agent.schema';

export const CodeValidateSchema = z.object({
  registerCode: z.string().min(6).max(40),
});

export const CodeLockSchema = z.object({
  registerCode: z.string().min(6).max(40),
});

export const ProfileCompleteSchema = z.object({
  studentName: z.string().min(2).max(80),
  schoolName:  z.string().min(2).max(200),
  state:       z.string().min(2).max(80),
  yearLabel:   z.string().max(64).optional(),
  language:    z.enum([
    'malay', 'english', 'arabic', 'mandarin', 'tamil',
    'indonesian', 'spanish', 'french', 'other',
  ]).optional(),
  curriculum: z.enum([
    'national', 'kpm', 'cambridge', 'mixed', 'international', 'us', 'uk', 'other',
  ]).optional(),
  subjectsTaken: z.array(z.string().min(2).max(40)).max(16).optional(),
  guardianName:  z.string().min(2).max(80).optional(),
  guardianEmail: z.string().email().max(120).optional(),
  guardianRelationship: z.enum(['mother', 'father', 'guardian', 'other']).optional(),
  guardianConsent:      z.boolean().optional(),
}).refine(
  (d) => {
    const hasGuardian = Boolean(d.guardianName?.trim() && d.guardianEmail?.trim());
    if (!hasGuardian) return true;
    return d.guardianConsent === true;
  },
  { message: 'Kebenaran penjaga diperlukan untuk portal ibu bapa.' },
);

export const ParentSessionSchema = z.object({
  accessToken: z.string().min(16).max(200),
});

export const AdminGenerateSchema = z.object({
  count:      z.number().int().min(1).max(30_000).optional(),
  agentId:    z.string().min(8).max(64).optional(),
  agentLabel: z.string().min(2).max(120).optional(),
  notes:      z.string().max(500).optional(),
  preferred:  z.string().min(8).max(40).optional(),
});

const MALAYSIA_STATE_ENUM = MALAYSIA_STATES as unknown as [string, ...string[]];

const AdminCreateAgentSchema = z.object({
  orgName:             z.string().min(2).max(200),
  contactName:         z.string().min(2).max(120),
  email:               z.string().email().max(160),
  phone:               z.string().min(9).max(40),
  icNumber:            z.string().min(11).max(20),
  taxId:               z.string().min(10).max(20),
  bankName:            z.string().min(2).max(80),
  bankAccountNumber:   z.string().min(8).max(20),
  bankAccountHolder:   z.string().min(3).max(120),
  addressLine1:        z.string().min(5).max(160),
  addressLine2:        z.string().max(160).optional(),
  postcode:            z.string().regex(/^\d{5}$/),
  city:                z.string().min(2).max(80),
  state:               z.enum(MALAYSIA_STATE_ENUM),
  packageTier:         z.enum(TUTOR_AGENT_PACKAGE_TIERS),
  commissionPercent:   z.number().min(0).max(50).optional(),
  notes:               z.string().max(500).optional(),
});

export const AdminTestAgentSchema = z.object({
  email:       z.string().email().max(200),
  orgName:     z.string().min(2).max(120).optional(),
  contactName: z.string().min(2).max(80).optional(),
  sendEmail:   z.boolean().optional(),
});

export const AgentSelfRegisterSchema = AdminCreateAgentSchema.omit({
  commissionPercent: true,
  notes:             true,
});

export const AgentPackageRequestSchema = z.object({
  tier:     z.enum(TUTOR_AGENT_PACKAGE_TIERS),
  renewal:  z.boolean().optional(),
});

export const AdminActivatePackageSchema = z.object({
  tier:    z.enum(TUTOR_AGENT_PACKAGE_TIERS),
  renewal: z.boolean().optional(),
});

export const AgentLoginSchema = z.object({
  agentCode: z.string().trim().min(7).max(41).refine(
    isValidTutorAgentLoginCode,
    { message: 'Invalid agen code format.' },
  ),
  portalToken: z.string().min(16).max(128),
});

export const AgentPinEmailSchema = z.object({
  registerCode: z.string().min(6).max(40),
  studentEmail: z.string().email().max(200),
  studentName:  z.string().max(80).optional(),
});

export const AgentRegisterCompleteSchema = z.object({
  sessionId: z.string().min(8).max(200),
});

export const AgentDemoChatSchema = z.object({
  sessionId: z.string().optional(),
  message:   z.string().max(100_000).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0,
  { message: 'Provide a message.' },
);

export const AdminListSchema = z.object({
  status: z.enum(['available', 'locked', 'redeemed', 'revoked']).optional(),
  limit:  z.coerce.number().int().min(1).max(500).optional(),
});
export function userId(c: { get: (key: string) => unknown }): string {
  const user = getTokenUser(c as Parameters<typeof getTokenUser>[0]);
  if (!user?.userId) throw new Error('User ID missing from token.');
  return user.userId;
}

export async function prepareAgentPortalSession(agent: ITutorAgent): Promise<ITutorAgent> {
  let ready = await ensureQaTestAgentPinsMinted(agent, 'portal:auto-mint');
  ready = await ensureAgentPackagePinsMinted(ready, 'portal:auto-mint');
  return ready;
}
