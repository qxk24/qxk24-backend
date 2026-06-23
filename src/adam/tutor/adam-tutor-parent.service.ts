/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Service (ERA_2i / ERA_3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import crypto from 'crypto';
import {
  TutorParentGuardianModel,
  type GuardianRelationship,
  type ITutorParentGuardian,
} from './adam-tutor-parent-guardian.schema';
import { getTutorLearningProfile } from '../adam-tutor-learning-profile.service';
import { getTutorEnrollmentForUser } from './adam-tutor-enrollment.service';
import { buildParentReportCard } from '../tutor-law/tutor-law.parent-report-builder';
import type { ParentDashboardPayload, ParentReportCard } from '../tutor-law/tutor-law.parent-report.types';
import {
  isValidSubjectId,
  type TutorSubjectId,
} from '../tutor-law/tutor-law.curriculum-catalog';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function newLinkId(): string {
  return `TUTOR-PARENT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function generateAccessToken(): string {
  return `pt_${crypto.randomBytes(24).toString('base64url')}`;
}

export interface ParentGuardianPublic {
  linkId:          string;
  studentUserId:   string;
  guardianName:    string;
  guardianEmail:   string;
  relationship:    GuardianRelationship;
  consentAt:       string;
  accessTokenHint: string;
}

export interface UpsertParentGuardianResult {
  guardian:          ParentGuardianPublic;
  /** Plain token — show once to family; not stored in clear text */
  parentAccessToken: string;
}

function toPublic(doc: ITutorParentGuardian): ParentGuardianPublic {
  return {
    linkId:          doc.linkId,
    studentUserId:   doc.studentUserId,
    guardianName:    doc.guardianName,
    guardianEmail:   doc.guardianEmail,
    relationship:    doc.relationship,
    consentAt:       doc.consentAt.toISOString(),
    accessTokenHint: doc.accessTokenHint,
  };
}

export async function upsertParentGuardian(input: {
  studentUserId:   string;
  guardianName:  string;
  guardianEmail: string;
  relationship?: GuardianRelationship;
  consent:       boolean;
}): Promise<UpsertParentGuardianResult> {
  if (!input.consent) {
    throw new Error('Kebenaran penjaga diperlukan untuk portal ibu bapa.');
  }

  const guardianName = input.guardianName.trim();
  const guardianEmail = input.guardianEmail.trim().toLowerCase();
  if (!guardianName || guardianName.length < 2) {
    throw new Error('Nama penjaga diperlukan.');
  }
  if (!guardianEmail.includes('@')) {
    throw new Error('E-mel penjaga tidak sah.');
  }

  const plainToken = generateAccessToken();
  const tokenHash = hashToken(plainToken);
  const hint = `${plainToken.slice(0, 8)}…`;

  const existing = await TutorParentGuardianModel.findOne({
    studentUserId: input.studentUserId,
  });

  if (existing) {
    existing.guardianName = guardianName;
    existing.guardianEmail = guardianEmail;
    existing.relationship = input.relationship ?? existing.relationship;
    existing.consentAt = new Date();
    existing.accessTokenHash = tokenHash;
    existing.accessTokenHint = hint;
    existing.active = true;
    await existing.save();
    return { guardian: toPublic(existing), parentAccessToken: plainToken };
  }

  const doc = await TutorParentGuardianModel.create({
    linkId:          newLinkId(),
    studentUserId:   input.studentUserId,
    guardianName,
    guardianEmail,
    relationship:    input.relationship ?? 'guardian',
    consentAt:       new Date(),
    accessTokenHash: tokenHash,
    accessTokenHint: hint,
    active:          true,
  });

  return { guardian: toPublic(doc), parentAccessToken: plainToken };
}

export async function resolveParentGuardianByToken(
  token: string | undefined | null,
): Promise<ITutorParentGuardian | null> {
  if (!token?.trim()) return null;
  const doc = await TutorParentGuardianModel.findOne({
    accessTokenHash: hashToken(token.trim()),
    active:          true,
  });
  if (!doc) return null;
  doc.lastAccessAt = new Date();
  await doc.save();
  return doc;
}

export async function getParentGuardianForStudent(
  studentUserId: string,
): Promise<ParentGuardianPublic | null> {
  const doc = await TutorParentGuardianModel.findOne({
    studentUserId,
    active: true,
  }).lean();
  if (!doc) return null;
  return toPublic(doc as unknown as ITutorParentGuardian);
}

export function normalizeSubjectsTaken(raw: string[] | undefined): TutorSubjectId[] {
  if (!raw?.length) return [];
  const out: TutorSubjectId[] = [];
  for (const id of raw) {
    if (isValidSubjectId(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export async function buildParentReportForStudent(
  studentUserId: string,
  kind: 'weekly' | 'monthly' = 'weekly',
): Promise<ParentReportCard> {
  const [profile, enrollment] = await Promise.all([
    getTutorLearningProfile(studentUserId),
    getTutorEnrollmentForUser(studentUserId),
  ]);

  if (!enrollment) {
    throw new Error('Pendaftaran pelajar tidak dijumpai.');
  }

  const subjectsTaken = enrollment.subjectsTaken ?? [];

  return buildParentReportCard({
    profile,
    studentUserId,
    studentName:   enrollment.studentName ?? 'Pelajar',
    schoolName:    enrollment.schoolName,
    yearLabel:     enrollment.yearLabel,
    band:          enrollment.band,
    subjectsTaken,
    kind,
  });
}

export async function buildParentDashboard(
  guardian: ITutorParentGuardian,
  parentPortalUrl: string,
): Promise<ParentDashboardPayload> {
  const report = await buildParentReportForStudent(guardian.studentUserId, 'weekly');
  const enrollment = await getTutorEnrollmentForUser(guardian.studentUserId);

  return {
    guardianName:    guardian.guardianName,
    studentName:     enrollment?.studentName ?? report.studentName,
    lastReport:      report,
    parentPortalUrl,
  };
}
