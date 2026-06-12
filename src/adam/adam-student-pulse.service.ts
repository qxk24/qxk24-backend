/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Pulse Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMMessageModel } from './adam.schema';
import { listConsultsForStudent } from './adam-consult.service';
import { listJournalsForStudent, listPublishedJournals } from './adam-journal.service';
import { getUserWorkspaces, type WorkspaceRecord } from './adam-workspace.service';
import { ENV } from '../config/environments';
import { getMacBridgeDashboardSettings } from './adam-mac-bridge-settings.service';

export interface StudentActivityItem {
  id:        string;
  type:      'message' | 'consult' | 'journal' | 'stage' | 'system';
  actor:     string;
  summary:   string;
  severity:  'info' | 'action' | 'warn' | 'success';
  timestamp: string;
}

export interface StudentLibraryBook {
  workspaceId:  string;
  title:          string;
  description:    string;
  category:       string;
  principle:      string;
  stage:          number;
  messageCount:   number;
  sessionId:      string;
  lastActive:     string;
  createdAt:      string;
}

export interface StudentLibraryManuscript {
  id:            string;
  title:         string;
  status:        string;
  judgment:      string;
  ahriScore:     number;
  submittedAt:   string;
  publishedAt:   string | null;
  journalNumber: string | null;
}

export interface StudentLibraryReading {
  id:            string;
  title:         string;
  authorName:    string;
  judgment:      string;
  ahriScore:     number;
  publishedAt:   string | null;
  journalNumber: string | null;
}

export interface StudentPulsePayload {
  generatedAt:      string;
  stack:            string;
  llmProvider:      string;
  kernel:           string;
  era:              string;
  userName:         string;
  activeStage:      number;
  bookCount:        number;
  manuscriptCount:  number;
  messagesWeek:     number;
  consultCount:     number;
  pendingConsults:  number;
  library: {
    books:        StudentLibraryBook[];
    manuscripts:  StudentLibraryManuscript[];
    reading:      StudentLibraryReading[];
  };
  consults: Array<{
    id:             string;
    status:         string;
    studentMessage: string;
    adamSummary:    string;
    createdAt:      string;
  }>;
  activity: StudentActivityItem[];
  macBridge: {
    serverEnabled: boolean;
    eligible:      boolean;
    open:          boolean;
    connected:     boolean;
    machineName?:  string;
    toolCount:     number;
  };
}

function snippet(text: string, max = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function mapBook(ws: WorkspaceRecord): StudentLibraryBook {
  return {
    workspaceId:  ws.workspaceId,
    title:        ws.title,
    description:  ws.description,
    category:     ws.category,
    principle:    ws.principle,
    stage:        ws.stage,
    messageCount: ws.messageCount,
    sessionId:    ws.sessionId,
    lastActive:   new Date(ws.masa_last_active).toISOString(),
    createdAt:    new Date(ws.masa_created).toISOString(),
  };
}

export async function buildStudentPulse(
  userId: string,
  userName: string,
): Promise<StudentPulsePayload> {
  const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [books, manuscripts, published, consults, messagesWeek] = await Promise.all([
    getUserWorkspaces(userId),
    listJournalsForStudent(userId, userName),
    listPublishedJournals(6, 0),
    listConsultsForStudent(userId, 12),
    ADAMMessageModel.countDocuments({
      speakerId: userId,
      role:      'student',
      createdAt: { $gte: sinceWeek },
    }),
  ]);

  const activeStage = books.length > 0 ? books[0].stage : 1;
  const pendingConsults = consults.filter((c) => c.status === 'pending').length;

  const activity: StudentActivityItem[] = [];

  for (const c of consults.slice(0, 6)) {
    activity.push({
      id:        `consult-${c.id}`,
      type:      'consult',
      actor:     'Consult',
      summary:   snippet(c.studentMessage || c.adamSummary || 'Sent to P.alt'),
      severity:  c.status === 'pending' ? 'action' : 'success',
      timestamp: new Date(c.createdAt).toISOString(),
    });
  }

  for (const m of manuscripts.slice(0, 4)) {
    activity.push({
      id:        `journal-${m.id}`,
      type:      'journal',
      actor:     'Manuscript',
      summary:   `${m.title} · ${m.status}`,
      severity:  m.status === 'PUBLISHED' ? 'success' : 'warn',
      timestamp: m.submittedAt?.toISOString?.() ?? new Date().toISOString(),
    });
  }

  for (const b of books.slice(0, 4)) {
    activity.push({
      id:        `book-${b.workspaceId}`,
      type:      'stage',
      actor:     b.title,
      summary:   `Stage ${b.stage}/7 · ${b.messageCount} messages`,
      severity:  'info',
      timestamp: new Date(b.masa_last_active).toISOString(),
    });
  }

  activity.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    generatedAt:     new Date().toISOString(),
    stack:             ENV.QXK24_STACK,
    llmProvider:       ENV.LLM_PROVIDER,
    kernel:            ENV.QXK24_KERNEL_VERSION,
    era:               ENV.QXK24_ERA,
    userName,
    activeStage,
    bookCount:         books.length,
    manuscriptCount:   manuscripts.length,
    messagesWeek,
    consultCount:      consults.length,
    pendingConsults,
    library: {
      books:       books.map(mapBook),
      manuscripts: manuscripts.map((m) => ({
        id:            m.id,
        title:         m.title,
        status:        m.status,
        judgment:      m.judgment,
        ahriScore:     m.ahriScore,
        submittedAt:   m.submittedAt?.toISOString?.() ?? new Date().toISOString(),
        publishedAt:   m.publishedAt?.toISOString?.() ?? null,
        journalNumber: m.journalNumber ?? null,
      })),
      reading: published.journals.map((j) => ({
        id:            j.id,
        title:         j.title,
        authorName:    j.authorName,
        judgment:      j.judgment,
        ahriScore:     j.ahriScore,
        publishedAt:   j.publishedAt?.toISOString?.() ?? null,
        journalNumber: j.journalNumber ?? null,
      })),
    },
    consults: consults.map((c) => ({
      id:             c.id,
      status:         c.status,
      studentMessage: c.studentMessage,
      adamSummary:    c.adamSummary,
      createdAt:      new Date(c.createdAt).toISOString(),
    })),
    activity: activity.slice(0, 30),
    macBridge: await getMacBridgeDashboardSettings(userId, false),
  };
}
