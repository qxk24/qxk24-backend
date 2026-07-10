/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Charity Agent Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { ENV } from '../../config/environments';
import { getMultipartUploadFile } from '../adam-file-extract.service';
import {
  normalizeMalaysiaPhone,
  validateMalaysiaPhone,
} from './adam-tutor-agent-identity';
import {
  TutorAgentModel,
  TutorAgentStatus,
  type ITutorAgent,
} from './adam-tutor-agent.schema';
import { TutorAgentPackageStatus } from './adam-tutor-agent-package.config';
import {
  newTutorAgentId,
  newTutorAgentPortalToken,
} from './adam-tutor-agent.service';
import { allocateTutorAgentCode } from './adam-tutor-agent-code';
import { sendTutorAgentPortalCredentialsEmail } from './adam-tutor-agent-credentials-email.service';
import { ensureAgentMarketingStudent } from './adam-tutor-agent-marketing.service';
import {
  charityPoolBand,
  isCharityTutorAgent,
  TUTOR_CHARITY_AGENT_PROGRAM,
} from './adam-tutor-charity-agent.config';
import {
  TutorCharityAgentApplicationModel,
  TutorCharityApplicationStatus,
  type ITutorCharityAgentApplication,
} from './adam-tutor-charity-agent-application.schema';
import { generateTutorRegisterCodes } from './adam-tutor-register-code.service';
import {
  TutorRegisterCodeModel,
  TutorRegisterCodeStatus,
} from './adam-tutor-register-code.schema';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

const ALLOWED_STUDENT_ID_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_STUDENT_ID_BYTES = 5 * 1024 * 1024;

export function newCharityApplicationId(): string {
  return `TUTOR-CHARITY-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function charityApplicationRoot(): string {
  return path.resolve(process.cwd(), ENV.ADAM_UPLOAD_DIR, 'charity-agent-applications');
}

async function ensureCharityApplicationDir(applicationId: string): Promise<string> {
  const dir = path.join(charityApplicationRoot(), applicationId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeStudentIdFile(
  applicationId: string,
  file: File,
): Promise<{ storedPath: string; fileName: string; mime: string }> {
  if (!ALLOWED_STUDENT_ID_MIME.has(file.type)) {
    throw new Error('Student ID must be a photo (JPEG/PNG/WebP) or PDF.');
  }
  if (file.size > MAX_STUDENT_ID_BYTES) {
    throw new Error('Student ID file must be 5 MB or smaller.');
  }

  const ext = file.type === 'application/pdf'
    ? '.pdf'
    : file.type === 'image/png'
      ? '.png'
      : file.type === 'image/webp'
        ? '.webp'
        : file.type === 'image/gif'
          ? '.gif'
          : '.jpg';

  const dir = await ensureCharityApplicationDir(applicationId);
  const storedPath = path.join(dir, `student-id${ext}`);

  if (typeof file.stream === 'function') {
    const nodeStream = Readable.fromWeb(
      file.stream() as Parameters<typeof Readable.fromWeb>[0],
    );
    await pipeline(nodeStream, createWriteStream(storedPath));
  } else {
    await fs.writeFile(storedPath, Buffer.from(await file.arrayBuffer()));
  }

  return {
    storedPath,
    fileName: file.name || `student-id${ext}`,
    mime:     file.type,
  };
}

function validateApplyFields(body: Record<string, unknown>): {
  contactName:       string;
  email:             string;
  phone:             string;
  universityName:    string;
  matricNumber:      string;
  bankName:          string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  termsAccepted:     boolean;
} {
  const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phoneRaw = typeof body.phone === 'string' ? body.phone : '';
  const universityName = typeof body.universityName === 'string' ? body.universityName.trim() : '';
  const matricNumber = typeof body.matricNumber === 'string' ? body.matricNumber.trim() : '';
  const bankName = typeof body.bankName === 'string' ? body.bankName.trim() : '';
  const bankAccountNumber = typeof body.bankAccountNumber === 'string'
    ? body.bankAccountNumber.replace(/\D/g, '')
    : '';
  const bankAccountHolder = typeof body.bankAccountHolder === 'string'
    ? body.bankAccountHolder.trim()
    : '';
  const termsAccepted = body.termsAccepted === true
    || body.termsAccepted === 'true'
    || body.termsAccepted === '1'
    || body.termsAccepted === 'on';

  if (!contactName) throw new Error('Enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
  const phoneErr = validateMalaysiaPhone(phoneRaw);
  if (phoneErr && phoneRaw.trim()) throw new Error(phoneErr);
  if (!universityName) throw new Error('Enter your university or college.');
  if (!matricNumber) throw new Error('Enter your matric / student ID number.');
  if (!bankName) throw new Error('Bank name is required.');
  if (bankAccountNumber.length < 8) throw new Error('Bank account must be at least 8 digits.');
  if (bankAccountHolder.length < 3) throw new Error('Account holder name is required.');
  if (!termsAccepted) throw new Error('Accept the program terms to continue.');

  return {
    contactName,
    email,
    phone: normalizeMalaysiaPhone(phoneRaw) || phoneRaw.trim(),
    universityName,
    matricNumber,
    bankName,
    bankAccountNumber,
    bankAccountHolder,
    termsAccepted,
  };
}

export async function submitCharityAgentApplication(
  body: Record<string, unknown>,
): Promise<{ applicationId: string; status: string }> {
  const fields = validateApplyFields(body);
  const file = getMultipartUploadFile(body, 'studentIdFile');
  if (!file) throw new Error('Attach a photo or scan of your student ID.');

  const pending = await TutorCharityAgentApplicationModel.findOne({
    email:  fields.email,
    status: TutorCharityApplicationStatus.PENDING,
  });
  if (pending) {
    throw new Error('An application with this email is already pending review.');
  }

  const existingAgent = await TutorAgentModel.findOne({ email: fields.email });
  if (existingAgent) {
    throw new Error('This email is already registered as an agent.');
  }

  const applicationId = newCharityApplicationId();
  const stored = await writeStudentIdFile(applicationId, file);

  await TutorCharityAgentApplicationModel.create({
    applicationId,
    status:              TutorCharityApplicationStatus.PENDING,
    contactName:         fields.contactName,
    email:               fields.email,
    phone:               fields.phone || null,
    universityName:      fields.universityName,
    matricNumber:        fields.matricNumber,
    studentIdFileName:   stored.fileName,
    studentIdMime:       stored.mime,
    studentIdStoredPath: stored.storedPath,
    bankName:            fields.bankName,
    bankAccountNumber:   fields.bankAccountNumber,
    bankAccountHolder:   fields.bankAccountHolder,
    termsAcceptedAt:     new Date(),
    agentId:             null,
    reviewedBy:          null,
    reviewedAt:          null,
    rejectReason:        null,
  });

  return { applicationId, status: TutorCharityApplicationStatus.PENDING };
}

export async function listCharityAgentApplications(
  status?: TutorCharityApplicationStatus,
  limit = 100,
) {
  try {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const rows = await TutorCharityAgentApplicationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .lean();

    return rows.map((row) => ({
      applicationId:  row.applicationId,
      status:         row.status,
      contactName:    row.contactName,
      email:          row.email,
      phone:          row.phone ?? null,
      universityName: row.universityName,
      matricNumber:   row.matricNumber,
      bankName:       row.bankName,
      bankAccountNumber: row.bankAccountNumber,
      bankAccountHolder: row.bankAccountHolder,
      agentId:        row.agentId ?? null,
      reviewedBy:     row.reviewedBy ?? null,
      reviewedAt:     row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
      rejectReason:   row.rejectReason ?? null,
      createdAt:      new Date(row.createdAt).toISOString(),
    }));

  } catch (err) {
    console.error(err);
    throw err;
  }}

function serializeCharityApplicationDoc(row: ITutorCharityAgentApplication) {
  return {
    applicationId:  row.applicationId,
    status:         row.status,
    contactName:    row.contactName,
    email:          row.email,
    phone:          row.phone,
    universityName: row.universityName,
    matricNumber:   row.matricNumber,
    bankName:       row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountHolder: row.bankAccountHolder,
    agentId:        row.agentId,
    reviewedBy:     row.reviewedBy,
    reviewedAt:     row.reviewedAt?.toISOString() ?? null,
    rejectReason:   row.rejectReason,
    createdAt:      row.createdAt.toISOString(),
  };
}

export async function grantCharityAgentPinPools(agent: ITutorAgent): Promise<ITutorAgent> {
  if (!isCharityTutorAgent(agent)) return agent;

  agent.pinBalanceSchool = (agent.pinBalanceSchool ?? 0) + TUTOR_CHARITY_AGENT_PROGRAM.GRANT_SCHOOL_PINS;
  agent.pinBalanceUniversity = (agent.pinBalanceUniversity ?? 0) + TUTOR_CHARITY_AGENT_PROGRAM.GRANT_UNIVERSITY_PINS;
  agent.pinPurchasedTotal = (agent.pinPurchasedTotal ?? 0)
    + TUTOR_CHARITY_AGENT_PROGRAM.GRANT_SCHOOL_PINS
    + TUTOR_CHARITY_AGENT_PROGRAM.GRANT_UNIVERSITY_PINS;
  await agent.save();
  return agent;
}

export async function mintCharityAgentRegisterPins(
  agentId: string,
  createdBy: string,
): Promise<{ school: number; university: number }> {
  const agent = await TutorAgentModel.findOne({ agentId });
  if (!agent || !isCharityTutorAgent(agent)) {
    return { school: 0, university: 0 };
  }
  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
    return { school: 0, university: 0 };
  }

  let school = 0;
  let university = 0;

  if (agent.pinBalanceSchool > 0) {
    const count = agent.pinBalanceSchool;
    const codes = await generateTutorRegisterCodes({
      band:      TUTOR_CHARITY_AGENT_PROGRAM.SCHOOL_MINT_BAND,
      count,
      agentId:   agent.agentId,
      createdBy,
      notes:     'Charity agent · School pool',
    });
    school = codes.length;
  }

  const refreshed = await TutorAgentModel.findOne({ agentId });
  if (!refreshed) return { school, university: 0 };

  if (refreshed.pinBalanceUniversity > 0) {
    const count = refreshed.pinBalanceUniversity;
    const codes = await generateTutorRegisterCodes({
      band:      TUTOR_CHARITY_AGENT_PROGRAM.UNIVERSITY_MINT_BAND,
      count,
      agentId:   refreshed.agentId,
      createdBy,
      notes:     'Charity agent · University pool',
    });
    university = codes.length;
  }

  return { school, university };
}

/** R2 — refill one pool when empty while student still verified. */
export async function refillCharityAgentPoolIfEmpty(
  agent: ITutorAgent,
  pool: 'school' | 'university',
  createdBy: string,
): Promise<ITutorAgent> {
  if (!isCharityTutorAgent(agent)) return agent;
  if (!agent.studentVerifiedAt) return agent;

  const availableForBand = await countAvailableCharityPins(agent.agentId, pool);
  if (availableForBand > 0) return agent;

  const balanceField = pool === 'school' ? 'pinBalanceSchool' : 'pinBalanceUniversity';
  const current = agent[balanceField] ?? 0;
  if (current > 0) {
    await mintCharityAgentRegisterPins(agent.agentId, createdBy);
    const refreshed = await TutorAgentModel.findOne({ agentId: agent.agentId });
    return refreshed ?? agent;
  }

  const grant = pool === 'school'
    ? TUTOR_CHARITY_AGENT_PROGRAM.GRANT_SCHOOL_PINS
    : TUTOR_CHARITY_AGENT_PROGRAM.GRANT_UNIVERSITY_PINS;

  agent[balanceField] = grant;
  agent.pinPurchasedTotal = (agent.pinPurchasedTotal ?? 0) + grant;
  const note = `Charity refill · ${pool} +${grant} PIN`;
  agent.notes = agent.notes ? `${agent.notes}\n${note}` : note;
  await agent.save();

  await mintCharityAgentRegisterPins(agent.agentId, createdBy);
  const refreshed = await TutorAgentModel.findOne({ agentId: agent.agentId });
  return refreshed ?? agent;
}

async function countAvailableCharityPins(
  agentId: string,
  pool: 'school' | 'university',
): Promise<number> {
  const bandFilter: TutorSubscriptionLevel[] = pool === 'school'
    ? ['primary', 'secondary']
    : ['university'];

  return TutorRegisterCodeModel.countDocuments({
    agentId,
    status: TutorRegisterCodeStatus.AVAILABLE,
    band:   { $in: bandFilter },
  });
}

export async function ensureCharityAgentPinsReady(
  agent: ITutorAgent,
  createdBy = 'charity:auto-mint',
): Promise<ITutorAgent> {
  if (!isCharityTutorAgent(agent)) return agent;
  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) return agent;

  let ready = agent;
  if ((ready.pinBalanceSchool ?? 0) > 0 || (ready.pinBalanceUniversity ?? 0) > 0) {
    await mintCharityAgentRegisterPins(ready.agentId, createdBy);
    const refreshed = await TutorAgentModel.findOne({ agentId: ready.agentId });
    if (refreshed) ready = refreshed;
  }

  ready = await refillCharityAgentPoolIfEmpty(ready, 'school', createdBy);
  ready = await refillCharityAgentPoolIfEmpty(ready, 'university', createdBy);
  return ready;
}

export async function consumeCharityAgentPins(
  agent: ITutorAgent,
  band: TutorSubscriptionLevel,
  count: number,
): Promise<ITutorAgent> {
  const pool = charityPoolBand(band);
  const field = pool === 'school' ? 'pinBalanceSchool' : 'pinBalanceUniversity';
  const balance = agent[field] ?? 0;

  if (balance < count) {
    throw new Error(
      `Insufficient ${pool} PIN balance (${balance} left, ${count} required).`,
    );
  }

  agent[field] = balance - count;
  await agent.save();
  return agent;
}

export async function approveCharityAgentApplication(
  applicationId: string,
  reviewedBy: string,
): Promise<{
  application: ReturnType<typeof serializeCharityApplicationDoc>;
  agentCode:   string;
  portalToken: string;
  credentialsEmailSent: boolean;
}> {
  const application = await TutorCharityAgentApplicationModel.findOne({ applicationId });
  if (!application) throw new Error('Application not found.');
  if (application.status !== TutorCharityApplicationStatus.PENDING) {
    throw new Error('Application is not pending.');
  }

  const existingAgent = await TutorAgentModel.findOne({ email: application.email });
  if (existingAgent) throw new Error('An agent with this email already exists.');

  const agentCode = await allocateTutorAgentCode();
  const agentId = newTutorAgentId();
  const portalToken = newTutorAgentPortalToken();
  const paidAt = new Date();

  const agent = await TutorAgentModel.create({
    agentId,
    agentCode,
    portalToken,
    orgName:           `${application.contactName} · ${application.universityName}`,
    contactName:       application.contactName,
    email:             application.email,
    phone:             application.phone,
    icNumber:          null,
    taxId:             null,
    bankName:          application.bankName,
    bankAccountNumber: application.bankAccountNumber,
    bankAccountHolder: application.bankAccountHolder,
    addressLine1:      application.universityName,
    addressLine2:      null,
    postcode:          '00000',
    city:              application.universityName,
    state:             'Wilayah Persekutuan Kuala Lumpur',
    band:              null,
    packageTier:       null,
    packageStatus:     TutorAgentPackageStatus.ACTIVE,
    pinBalance:        0,
    pinPurchasedTotal: 0,
    packagePaidAt:     paidAt,
    packageExpiresAt:  null,
    commissionPercent: 0,
    walletBalanceMyr:  0,
    status:            TutorAgentStatus.ACTIVE,
    agentProgram:      'student_charity',
    pinBalanceSchool:     0,
    pinBalanceUniversity: 0,
    studentVerifiedAt:    paidAt,
    universityName:       application.universityName,
    matricNumber:         application.matricNumber,
    charityApplicationId: application.applicationId,
    createdBy:            `charity-approve:${reviewedBy}`,
    notes:                `Charity student agent · ${application.universityName} · matric ${application.matricNumber}`,
  });

  await ensureAgentMarketingStudent(agent);

  const granted = await grantCharityAgentPinPools(agent);
  await mintCharityAgentRegisterPins(granted.agentId, reviewedBy);

  application.status = TutorCharityApplicationStatus.APPROVED;
  application.agentId = agent.agentId;
  application.reviewedBy = reviewedBy;
  application.reviewedAt = new Date();
  application.rejectReason = null;
  await application.save();

  const mail = await sendTutorAgentPortalCredentialsEmail(
    (await TutorAgentModel.findOne({ agentId: agent.agentId })) ?? agent,
  );

  return {
    application: serializeCharityApplicationDoc(application),
    agentCode:   agent.agentCode,
    portalToken: agent.portalToken,
    credentialsEmailSent: mail.sent,
  };
}

export async function rejectCharityAgentApplication(
  applicationId: string,
  reviewedBy: string,
  reason?: string,
): Promise<ReturnType<typeof serializeCharityApplicationDoc>> {
  const application = await TutorCharityAgentApplicationModel.findOne({ applicationId });
  if (!application) throw new Error('Application not found.');
  if (application.status !== TutorCharityApplicationStatus.PENDING) {
    throw new Error('Application is not pending.');
  }

  application.status = TutorCharityApplicationStatus.REJECTED;
  application.reviewedBy = reviewedBy;
  application.reviewedAt = new Date();
  application.rejectReason = reason?.trim() || 'Application declined.';
  await application.save();

  return serializeCharityApplicationDoc(application);
}

export async function getCharityApplicationStudentIdPath(
  applicationId: string,
): Promise<string | null> {
  const application = await TutorCharityAgentApplicationModel.findOne({ applicationId }).lean();
  if (!application?.studentIdStoredPath) return null;
  return application.studentIdStoredPath;
}
