/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import crypto from 'crypto';
import {
  TutorAgentModel,
  TutorAgentStatus,
  type ITutorAgent,
} from './adam-tutor-agent.schema';
import { TutorRegisterCodeModel } from './adam-tutor-register-code.schema';
import {
  TutorEnrollmentModel,
  TutorEnrollmentStatus,
} from './adam-tutor-enrollment.schema';
import { TUTOR_REGISTER_BAND_LABELS_BM } from './adam-tutor-register.constants';
import { listAgentWalletLedger, sumAgentCommission } from './adam-tutor-agent-wallet.service';

export function newTutorAgentId(): string {
  return `TUTOR-AGT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newTutorAgentPortalToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

function slugOrgForAgentCode(orgName: string): string {
  const slug = orgName
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12);
  return slug || 'EJEN';
}

export async function allocateTutorAgentCode(orgName: string): Promise<string> {
  const slug = slugOrgForAgentCode(orgName);
  for (let seq = 1; seq <= 999; seq += 1) {
    const code = `TUTOR-EJEN-${slug}-${String(seq).padStart(3, '0')}`;
    const taken = await TutorAgentModel.exists({ agentCode: code });
    if (!taken) return code;
  }
  throw new Error('Tidak dapat menjana kod ejen unik.');
}

export async function createTutorAgent(input: {
  orgName:           string;
  contactName:       string;
  email:             string;
  phone?:            string;
  state:             string;
  commissionPercent?: number;
  notes?:            string;
  createdBy:         string;
}): Promise<ITutorAgent> {
  const agentCode = await allocateTutorAgentCode(input.orgName);
  return TutorAgentModel.create({
    agentId:           newTutorAgentId(),
    agentCode,
    portalToken:       newTutorAgentPortalToken(),
    orgName:           input.orgName.trim(),
    contactName:       input.contactName.trim(),
    email:             input.email.trim().toLowerCase(),
    phone:             input.phone?.trim() || null,
    state:             input.state.trim(),
    commissionPercent: input.commissionPercent ?? 20,
    walletBalanceMyr:  0,
    status:            TutorAgentStatus.ACTIVE,
    createdBy:         input.createdBy,
    notes:             input.notes?.trim() || null,
  });
}

export async function listTutorAgents(limit = 100) {
  return TutorAgentModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getTutorAgentById(agentId: string): Promise<ITutorAgent | null> {
  return TutorAgentModel.findOne({ agentId });
}

export async function resolveTutorAgent(
  agentCode: string,
  portalToken: string,
): Promise<ITutorAgent | null> {
  return TutorAgentModel.findOne({
    agentCode:   agentCode.trim().toUpperCase(),
    portalToken: portalToken.trim(),
  });
}

export interface TutorAgentPortalOverview {
  agentId:            string;
  agentCode:          string;
  orgName:            string;
  contactName:        string;
  state:              string;
  commissionPercent:  number;
  walletBalanceMyr:   number;
  totalCommissionMyr: number;
  codesTotal:         number;
  codesAvailable:     number;
  codesRedeemed:      number;
  studentsTotal:      number;
  studentsPaid:       number;
  studentsComplete:   number;
  studentsPending:    number;
}

export async function getTutorAgentPortalOverview(
  agent: ITutorAgent,
): Promise<TutorAgentPortalOverview> {
  const agentId = agent.agentId;

  const [
    codesTotal,
    codesAvailable,
    codesRedeemed,
    studentsTotal,
    studentsPaid,
    studentsComplete,
    studentsPending,
    totalCommissionMyr,
  ] = await Promise.all([
    TutorRegisterCodeModel.countDocuments({ agentId }),
    TutorRegisterCodeModel.countDocuments({ agentId, status: 'available' }),
    TutorRegisterCodeModel.countDocuments({ agentId, status: 'redeemed' }),
    TutorEnrollmentModel.countDocuments({ agentId }),
    TutorEnrollmentModel.countDocuments({ agentId, status: TutorEnrollmentStatus.PAID }),
    TutorEnrollmentModel.countDocuments({ agentId, status: TutorEnrollmentStatus.COMPLETE }),
    TutorEnrollmentModel.countDocuments({ agentId, status: TutorEnrollmentStatus.CODE_LOCKED }),
    sumAgentCommission(agentId),
  ]);

  return {
    agentId:            agent.agentId,
    agentCode:          agent.agentCode,
    orgName:            agent.orgName,
    contactName:        agent.contactName,
    state:              agent.state,
    commissionPercent:  agent.commissionPercent,
    walletBalanceMyr:   agent.walletBalanceMyr,
    totalCommissionMyr,
    codesTotal,
    codesAvailable,
    codesRedeemed,
    studentsTotal,
    studentsPaid:       studentsPaid + studentsComplete,
    studentsComplete,
    studentsPending,
  };
}

export interface TutorAgentStudentRow {
  enrollmentId:  string;
  userId:        string;
  studentName:   string | null;
  schoolName:    string | null;
  state:         string | null;
  band:          string;
  bandLabel:     string;
  registerCode:  string;
  status:        string;
  paidAt:        string | null;
  completedAt:   string | null;
  createdAt:     string;
}

export async function listTutorAgentStudents(
  agentId: string,
  limit = 100,
): Promise<TutorAgentStudentRow[]> {
  const rows = await TutorEnrollmentModel.find({ agentId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((doc) => ({
    enrollmentId: doc.enrollmentId,
    userId:       doc.userId,
    studentName:  doc.studentName,
    schoolName:   doc.schoolName,
    state:        doc.state,
    band:         doc.band,
    bandLabel:    TUTOR_REGISTER_BAND_LABELS_BM[doc.band],
    registerCode: doc.registerCode,
    status:       doc.status,
    paidAt:       doc.paidAt?.toISOString() ?? null,
    completedAt:  doc.completedAt?.toISOString() ?? null,
    createdAt:    doc.createdAt.toISOString(),
  }));
}

export async function getTutorAgentWallet(agentId: string) {
  const agent = await TutorAgentModel.findOne({ agentId }).lean();
  if (!agent) return null;

  const ledger = await listAgentWalletLedger(agentId, 80);
  return {
    walletBalanceMyr:   agent.walletBalanceMyr,
    totalCommissionMyr: await sumAgentCommission(agentId),
    ledger: ledger.map((row) => ({
      ledgerId:     row.ledgerId,
      type:         row.type,
      amountMyr:    row.amountMyr,
      balanceAfter: row.balanceAfter,
      enrollmentId: row.enrollmentId,
      registerCode: row.registerCode,
      note:         row.note,
      recordedAt:   row.recordedAt.toISOString(),
    })),
  };
}
