/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Workspace Service (AIDIL family per book)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/environments';
import { ADAMFounderSessionModel } from './adam.schema';
import { ADAMWorkspaceModel, type WorkspacePrinciple } from './adam-workspace.schema';

export interface WorkspaceRecord {
  workspaceId:          string;
  userId:               string;
  userName:             string;
  role:                 string;
  title:                string;
  description:          string;
  category:             string;
  principle:            WorkspacePrinciple;
  stage:                number;
  cycle:                number;
  messageCount:         number;
  sessionId:            string;
  unifiedUnderstanding: string;
  masa_last_active:     Date;
  masa_created:         Date;
}

function mapWorkspace(doc: {
  workspaceId: string;
  userId: string;
  userName?: string;
  role?: string;
  title: string;
  description?: string;
  category?: string;
  principle?: WorkspacePrinciple;
  stage?: number;
  cycle?: number;
  messageCount?: number;
  sessionId: string;
  unifiedUnderstanding?: string;
  masa_last_active?: Date;
  masa_created?: Date;
}): WorkspaceRecord {
  return {
    workspaceId:          doc.workspaceId,
    userId:               doc.userId,
    userName:             doc.userName ?? '',
    role:                 doc.role ?? 'student',
    title:                doc.title,
    description:          doc.description ?? '',
    category:             doc.category ?? 'General',
    principle:            doc.principle ?? 'MULTI',
    stage:                doc.stage ?? 1,
    cycle:                doc.cycle ?? 1,
    messageCount:         doc.messageCount ?? 0,
    sessionId:            doc.sessionId,
    unifiedUnderstanding: doc.unifiedUnderstanding ?? '',
    masa_last_active:     doc.masa_last_active ?? new Date(),
    masa_created:         doc.masa_created ?? new Date(),
  };
}

export async function createWorkspace(params: {
  userId:      string;
  userName:    string;
  role:        'founder' | 'student' | 'member';
  title:       string;
  description?: string;
  category?:   string;
  principle?:  WorkspacePrinciple;
}): Promise<WorkspaceRecord> {
  const workspaceId = `K24W-${params.userId.slice(0, 8)}-${Date.now()}`;
  const sessionId   = `K24S-WS-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const principle = params.principle ?? 'MULTI';
  const description = params.description?.trim() ?? '';
  const title = params.title.trim();

  const unifiedUnderstanding = [
    `[AIDIL family nucleus — workspace: ${title}]`,
    description ? `Scope: ${description}` : '',
    `Primary principle lens: ${principle}.`,
    'This family is separate from other books/projects. Do not merge with other workspaces unless the Founder directs.',
  ].filter(Boolean).join('\n');

  await ADAMFounderSessionModel.create({
    sessionId,
    founderId:    params.userId,
    sessionType:  'student',
    kernel:       ENV.QXK24_KERNEL_VERSION,
    era:          ENV.QXK24_ERA,
    active:       true,
    lastActiveAt: new Date(),
  });

  const doc = await ADAMWorkspaceModel.create({
    workspaceId,
    userId:               params.userId,
    userName:             params.userName,
    role:                 params.role,
    title,
    description,
    category:             params.category ?? 'General',
    principle,
    sessionId,
    unifiedUnderstanding,
    stage:                1,
    cycle:                1,
    masa_created:         new Date(),
    masa_last_active:     new Date(),
  });

  return mapWorkspace(doc);
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceRecord[]> {
  const docs = await ADAMWorkspaceModel.find({
    userId,
    active:   true,
    archived: false,
  })
    .sort({ masa_last_active: -1 })
    .lean();

  return docs.map(mapWorkspace);
}

export async function getWorkspace(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRecord | null> {
  const doc = await ADAMWorkspaceModel.findOne({ workspaceId, userId }).lean();
  return doc ? mapWorkspace(doc) : null;
}

export async function getWorkspaceBySession(
  sessionId: string,
): Promise<WorkspaceRecord | null> {
  const doc = await ADAMWorkspaceModel.findOne({ sessionId, archived: false }).lean();
  return doc ? mapWorkspace(doc) : null;
}

export async function touchWorkspace(workspaceId: string): Promise<void> {
  const doc = await ADAMWorkspaceModel.findOneAndUpdate(
    { workspaceId },
    {
      $inc: { messageCount: 1 },
      masa_last_active: new Date(),
    },
    { new: true },
  ).lean();

  if (!doc) return;

  const stage = Math.min(7, 1 + Math.floor((doc.messageCount ?? 0) / 8));
  if (stage !== doc.stage) {
    await ADAMWorkspaceModel.updateOne({ workspaceId }, { stage });
  }
}

export async function archiveWorkspace(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const result = await ADAMWorkspaceModel.updateOne(
    { workspaceId, userId },
    { archived: true, active: false },
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function appendWorkspaceUnderstanding(
  workspaceId: string,
  studentName: string,
  userSnippet: string,
  adamSnippet: string,
): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const line = [
    `[${stamp}] ${studentName}:`,
    userSnippet.slice(0, 400),
    `ADAM: ${adamSnippet.slice(0, 400)}`,
  ].join(' ');

  const doc = await ADAMWorkspaceModel.findOne({ workspaceId }).lean();
  if (!doc) return;

  const merged = `${doc.unifiedUnderstanding}\n${line}`.trim();
  const capped =
    merged.length > 12_000
      ? `${merged.slice(0, 12_000)}\n[… workspace memory truncated …]`
      : merged;

  await ADAMWorkspaceModel.updateOne(
    { workspaceId },
    {
      unifiedUnderstanding: capped,
      masa_last_active:       new Date(),
    },
  );
}

/** Student may only read history for their general session or their workspaces */
export async function assertStudentOwnsSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const ws = await ADAMWorkspaceModel.findOne({ sessionId, userId }).lean();
  if (ws) return true;

  const sess = await ADAMFounderSessionModel.findOne({
    sessionId,
    founderId:   userId,
    sessionType: 'student',
  }).lean();

  return Boolean(sess);
}

export function workspaceContextBlock(ws: WorkspaceRecord): string {
  return [
    '[AIDIL WORKSPACE — SEPARATE FAMILY — DO NOT MIX WITH OTHER BOOKS]',
    `Title: ${ws.title}`,
    ws.description ? `Description: ${ws.description}` : '',
    `Principle: ${ws.principle} · Stage ${ws.stage}/7 · Cycle ${ws.cycle}`,
    '',
    'Unified understanding of THIS workspace only:',
    ws.unifiedUnderstanding || '(Nucleus forming with first messages.)',
  ].join('\n');
}
