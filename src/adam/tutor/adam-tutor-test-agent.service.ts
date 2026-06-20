/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor QA Test Agent Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { activateTutorAgentPackage } from './adam-tutor-agent-package.service';
import {
  TutorAgentModel,
  TutorAgentStatus,
  type ITutorAgent,
} from './adam-tutor-agent.schema';
import {
  TutorAgentPackageStatus,
  type TutorAgentPackageTier,
} from './adam-tutor-agent-package.config';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import {
  createTutorAgent,
  newTutorAgentPortalToken,
} from './adam-tutor-agent.service';
import { ensureAgentMarketingStudent } from './adam-tutor-agent-marketing.service';
import { sendTutorAgentPortalCredentialsEmail } from './adam-tutor-agent-credentials-email.service';
import { generateTutorRegisterCodes } from './adam-tutor-register-code.service';
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
} from './adam-tutor-register-code.schema';
import { getTutorAgentById } from './adam-tutor-agent.service';

export const TUTOR_TEST_AGENT_EMAIL = 'tutor-ejen-test@alamtologi.com';
export const QA_TEST_AGENT_NOTE_PREFIX = 'QA test agent —';

const DEFAULT_BAND: TutorSubscriptionLevel = 'secondary';
const DEFAULT_TIER: TutorAgentPackageTier = 'silver';

export interface TutorTestAgentProvisionResult {
  agentId:               string;
  agentCode:             string;
  portalToken:           string;
  email:                 string;
  orgName:               string;
  pinBalance:            number;
  pinPurchasedTotal:     number;
  packageTier:           string | null;
  packageStatus:         string;
  band:                  string | null;
  created:               boolean;
  credentialsEmailSent:  boolean;
  codesAvailable:        number;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isQaTestAgent(agent: Pick<ITutorAgent, 'notes'>): boolean {
  return (agent.notes ?? '').startsWith(QA_TEST_AGENT_NOTE_PREFIX);
}

function hashEmail(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic 12-digit MyKad-style IC per email (QA only). */
function qaIcFromEmail(email: string): string {
  const suffix = String(hashEmail(email) % 1_000_000).padStart(6, '0');
  return `900101${suffix}`;
}

function qaTaxIdFromEmail(email: string): string {
  return `C${String(hashEmail(`${email}:tax`) % 1_000_000_0000).padStart(10, '0')}`;
}

function defaultOrgName(email: string, orgName?: string): string {
  const trimmed = orgName?.trim();
  if (trimmed) return trimmed;
  const local = email.split('@')[0] ?? 'qa';
  return `QA Test · ${local}`;
}

function defaultContactName(email: string, contactName?: string): string {
  const trimmed = contactName?.trim();
  if (trimmed) return trimmed;
  const local = email.split('@')[0] ?? 'qa';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildTestProfile(email: string, orgName?: string, contactName?: string) {
  const icNumber = qaIcFromEmail(email);
  const org = defaultOrgName(email, orgName);
  const contact = defaultContactName(email, contactName);
  return {
    orgName:             org,
    contactName:         contact,
    email,
    phone:               '+60123456789',
    addressLine1:        'No. 1, Jalan Test QA',
    addressLine2:        'Taman Alamtologi',
    postcode:            '43000',
    city:                'Kajang',
    icNumber,
    taxId:               qaTaxIdFromEmail(email),
    bankName:            'Maybank',
    bankAccountNumber:   '512345678901',
    bankAccountHolder:   org.slice(0, 40),
    state:               'Selangor',
    band:                DEFAULT_BAND,
    packageTier:         DEFAULT_TIER,
    notes:               `${QA_TEST_AGENT_NOTE_PREFIX} ${email}`,
  };
}

/** Mint register codes from unused PIN credits (QA test agen only). */
export async function ensureQaTestAgentPinsMinted(
  agent: ITutorAgent,
  createdBy: string,
): Promise<ITutorAgent> {
  if (!isQaTestAgent(agent)) return agent;
  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) return agent;
  if (agent.pinBalance <= 0 || !agent.band) return agent;

  const existingAvailable = await TutorRegisterCodeModel.countDocuments({
    agentId: agent.agentId,
    status:  TutorRegisterCodeStatus.AVAILABLE,
  });
  if (existingAvailable > 0) return agent;

  await generateTutorRegisterCodes({
    band:      agent.band,
    count:     agent.pinBalance,
    agentId:   agent.agentId,
    notes:     'QA test agent — auto-generated PINs',
    createdBy,
  });

  const refreshed = await getTutorAgentById(agent.agentId);
  return refreshed ?? agent;
}

export async function provisionTutorTestAgent(input: {
  email:        string;
  orgName?:     string;
  contactName?: string;
  activatedBy:  string;
  sendEmail?:   boolean;
}): Promise<TutorTestAgentProvisionResult> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const sendEmail = input.sendEmail !== false;
  const profile = buildTestProfile(email, input.orgName, input.contactName);
  const found = await TutorAgentModel.findOne({ email });

  let agent: ITutorAgent;
  let created = false;

  if (!found) {
    agent = await createTutorAgent({
      ...profile,
      commissionPercent: 20,
      createdBy:         input.activatedBy,
    });
    created = true;
  } else if (!isQaTestAgent(found)) {
    throw new Error(
      'This email belongs to a production agen account. Use a different email for QA test accounts.',
    );
  } else {
    found.portalToken = newTutorAgentPortalToken();
    found.orgName = profile.orgName;
    found.contactName = profile.contactName;
    found.phone = profile.phone;
    found.addressLine1 = profile.addressLine1;
    found.addressLine2 = profile.addressLine2;
    found.postcode = profile.postcode;
    found.city = profile.city;
    found.icNumber = profile.icNumber;
    found.taxId = profile.taxId;
    found.bankName = profile.bankName;
    found.bankAccountNumber = profile.bankAccountNumber;
    found.bankAccountHolder = profile.bankAccountHolder;
    found.state = profile.state;
    found.band = profile.band;
    found.packageTier = profile.packageTier;
    found.packageStatus = TutorAgentPackageStatus.PENDING;
    found.status = TutorAgentStatus.ACTIVE;
    found.notes = profile.notes;
    found.createdBy = input.activatedBy;
    await found.save();
    await ensureAgentMarketingStudent(found);
    agent = found;
  }

  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
    agent = await activateTutorAgentPackage(agent.agentId, {
      band:        DEFAULT_BAND,
      tier:        DEFAULT_TIER,
      activatedBy: input.activatedBy,
    });
  }

  agent = await ensureQaTestAgentPinsMinted(agent, input.activatedBy);

  let credentialsEmailSent = false;
  if (sendEmail) {
    const mail = await sendTutorAgentPortalCredentialsEmail(agent, { rotated: !created });
    credentialsEmailSent = mail.sent;
  }

  const codesAvailable = await TutorRegisterCodeModel.countDocuments({
    agentId: agent.agentId,
    status:  TutorRegisterCodeStatus.AVAILABLE,
  });

  return {
    agentId:              agent.agentId,
    agentCode:            agent.agentCode,
    portalToken:          agent.portalToken,
    email:                agent.email,
    orgName:              agent.orgName,
    pinBalance:           agent.pinBalance,
    pinPurchasedTotal:    agent.pinPurchasedTotal,
    packageTier:          agent.packageTier,
    packageStatus:        agent.packageStatus,
    band:                 agent.band,
    created,
    credentialsEmailSent,
    codesAvailable,
  };
}

/** Default canonical QA account (seed script + quick default). */
export async function provisionDefaultTutorTestAgent(input: {
  activatedBy: string;
  sendEmail?:  boolean;
}): Promise<TutorTestAgentProvisionResult> {
  return provisionTutorTestAgent({
    email:       TUTOR_TEST_AGENT_EMAIL,
    orgName:     'Ejen Test QA Alamtologi',
    contactName: 'Ejen Test',
    activatedBy: input.activatedBy,
    sendEmail:   input.sendEmail,
  });
}
