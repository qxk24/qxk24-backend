/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Tester Application Service
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import {
  TesterApplicationModel,
  TesterApplicationStatus,
  type ITesterApplication,
} from './tester-application.schema';
import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import {
  countActiveTesters,
  createTesterAccount,
  getTesterCohortMax,
  setTesterLanguage,
} from './alm-tester.service';

export interface TesterApplyInput {
  name:              string;
  email:             string;
  roleTitle?:        string;
  motivation:        string;
  preferredLanguage?: string;
}

export interface TesterCohortStatus {
  max:           number;
  active:        number;
  slotsOpen:     number;
  pendingApps:   number;
  applyEnabled:  boolean;
  cohortFull:    boolean;
}

export function isTesterApplyEnabled(): boolean {
  return ENV.ADAM_TESTER_APPLY_ENABLED;
}

export async function getTesterCohortStatus(): Promise<TesterCohortStatus> {
  const max = getTesterCohortMax();
  const active = await countActiveTesters();
  const pendingApps = await TesterApplicationModel.countDocuments({
    status: TesterApplicationStatus.PENDING,
  });

  return {
    max,
    active,
    slotsOpen:    Math.max(0, max - active),
    pendingApps,
    applyEnabled: isTesterApplyEnabled(),
    cohortFull:   active >= max,
  };
}

function newApplicationId(): string {
  return `TAPP-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

export async function submitTesterApplication(
  input: TesterApplyInput,
): Promise<{ applicationId: string; status: TesterApplicationStatus }> {
  if (!isTesterApplyEnabled()) {
    throw new Error('Tester applications are closed.');
  }

  const cohort = await getTesterCohortStatus();
  if (cohort.cohortFull) {
    throw new Error('The VIP tester cohort (100) is full. Thank you for your interest.');
  }

  const email = input.email.trim().toLowerCase();

  const existingPending = await TesterApplicationModel.findOne({
    email,
    status: TesterApplicationStatus.PENDING,
  });
  if (existingPending) {
    throw new Error('An application with this email is already under review.');
  }

  const existingApproved = await TesterApplicationModel.findOne({
    email,
    status: TesterApplicationStatus.APPROVED,
  });
  if (existingApproved) {
    throw new Error('This email already has an approved tester application.');
  }

  const existingAccount = await ADAMStudentAccountModel.findOne({ email });
  if (existingAccount) {
    throw new Error('This email is already registered on Alamtologi.');
  }

  const doc = await TesterApplicationModel.create({
    applicationId:     newApplicationId(),
    name:              input.name.trim(),
    email,
    roleTitle:         input.roleTitle?.trim() || null,
    motivation:        input.motivation.trim(),
    preferredLanguage: input.preferredLanguage?.trim() || null,
    status:            TesterApplicationStatus.PENDING,
  });

  return { applicationId: doc.applicationId, status: doc.status };
}

export async function listTesterApplications(
  status?: TesterApplicationStatus,
): Promise<ITesterApplication[]> {
  const filter = status ? { status } : {};
  return TesterApplicationModel.find(filter).sort({ createdAt: -1 }).lean() as unknown as ITesterApplication[];
}

export async function approveTesterApplication(
  applicationId: string,
  opts: { password?: string; notes?: string } = {},
): Promise<{
  applicationId: string;
  userId:        string;
  password:      string;
  limit:         number;
}> {
  const app = await TesterApplicationModel.findOne({ applicationId });
  if (!app) throw new Error('Application not found.');
  if (app.status !== TesterApplicationStatus.PENDING) {
    throw new Error(`Application is already ${app.status.toLowerCase()}.`);
  }

  const active = await countActiveTesters();
  if (active >= getTesterCohortMax()) {
    throw new Error(`Tester cohort full (${getTesterCohortMax()} active). Revoke or wait before approving.`);
  }

  const password = opts.password?.trim() || generateTempPassword();
  const notes = [
    opts.notes?.trim(),
    app.roleTitle ? `Role: ${app.roleTitle}` : null,
    `Application: ${applicationId}`,
  ].filter(Boolean).join(' · ');

  const result = await createTesterAccount({
    name:     app.name,
    email:    app.email,
    password,
    isVip:    true,
    notes:    notes || undefined,
  });

  if (app.preferredLanguage) {
    await setTesterLanguage(result.userId, app.preferredLanguage);
  }

  app.status = TesterApplicationStatus.APPROVED;
  app.approvedUserId = result.userId;
  app.reviewedAt = new Date();
  await app.save();

  return {
    applicationId,
    userId:   result.userId,
    password,
    limit:    result.limit,
  };
}

export async function rejectTesterApplication(
  applicationId: string,
  reason?: string,
): Promise<void> {
  const app = await TesterApplicationModel.findOne({ applicationId });
  if (!app) throw new Error('Application not found.');
  if (app.status !== TesterApplicationStatus.PENDING) {
    throw new Error(`Application is already ${app.status.toLowerCase()}.`);
  }

  app.status = TesterApplicationStatus.REJECTED;
  app.rejectReason = reason?.trim() || null;
  app.reviewedAt = new Date();
  await app.save();
}
