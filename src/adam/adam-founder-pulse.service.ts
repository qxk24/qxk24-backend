/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Pulse Service
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

import { ADAMMessageModel } from '../adam/adam.schema';
import { listPendingConsults } from '../adam/adam-consult.service';
import { listJournals } from '../adam/adam-journal.service';
import { listStudentsForFounder } from '../adam/adam-student-registry.service';
import { getLedgerStats } from '../qxk24brain/adam-atomic.service';
import {
  checkMemoryHealthCached,
  resolvePrimaryFounderSessionId,
  type MemoryHealthReport,
} from '../qxk24brain/adam-health.service';
import { getAidilStageDashboard } from '../qxk24brain/adam-stage-dashboard.service';
import { AlamtologiBrainLogModel } from '../qxk24brain/qxk24brain.schema';
import { ENV } from '../config/environments';
import { buildFounderRevenueInsights, type FounderRevenueInsights } from '../subscriptions/subscription-revenue-insights.service';
import { getStudentRegistrationSettings } from './adam-platform-settings.service';
import { getDatasetStats, type LlmPipelineStats } from '../llm-pipeline/training-example-generator';
import { getTesterMonitorStats } from '../tester/alm-tester.service';

const FOUNDER_ID = 'masa-bayu';

export interface FounderActivityItem {
  id:        string;
  type:      'message' | 'consult' | 'journal' | 'transform' | 'system';
  actor:     string;
  summary:   string;
  severity:  'info' | 'action' | 'warn' | 'success';
  timestamp: string;
}

export interface FounderPulsePayload {
  generatedAt:   string;
  stack:         string;
  llmProvider:   string;
  kernel:        string;
  era:           string;
  health:        MemoryHealthReport | null;
  ledger:        Awaited<ReturnType<typeof getLedgerStats>>;
  stages:        {
    totalFamilies:      number;
    activeFamilies:     number;
    completedFamilies:  number;
    totalTransformations: number;
    topFamilies:        Array<{ family: string; stage: number; principle: string }>;
  };
  consults: {
    pending: number;
    items:   Awaited<ReturnType<typeof listPendingConsults>>;
  };
  journals: {
    pendingReview: number;
    approved:      number;
    published:     number;
  };
  students: {
    total:    number;
    active:   number;
  };
  testers: {
    total:         number;
    active:        number;
    limitReached:  number;
    revoked:       number;
    questionsUsed: number;
  };
  registration: {
    open: boolean;
  };
  llmPipeline: LlmPipelineStats;
  messages24h: number;
  activity:    FounderActivityItem[];
  revenue:     FounderRevenueInsights;
}

function snippet(text: string, max = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function buildFounderPulse(): Promise<FounderPulsePayload> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sessionId = await resolvePrimaryFounderSessionId(FOUNDER_ID);

  const [
    health,
    ledger,
    dashboard,
    pendingConsults,
    pendingJournals,
    approvedJournals,
    publishedJournals,
    students,
    messages24h,
    recentMessages,
    recentLogs,
    revenue,
    llmPipeline,
    testerStats,
  ] = await Promise.all([
    sessionId
      ? checkMemoryHealthCached(FOUNDER_ID, sessionId).catch(() => null)
      : Promise.resolve(null),
    getLedgerStats(FOUNDER_ID),
    getAidilStageDashboard(FOUNDER_ID),
    listPendingConsults(12),
    listJournals({ status: 'PENDING_REVIEW', limit: 8 }),
    listJournals({ status: 'APPROVED', limit: 1 }),
    listJournals({ status: 'PUBLISHED', limit: 1 }),
    listStudentsForFounder(),
    ADAMMessageModel.countDocuments({ createdAt: { $gte: since24h } }),
    ADAMMessageModel.find({ createdAt: { $gte: since24h } })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean(),
    AlamtologiBrainLogModel.find({ founderId: FOUNDER_ID })
      .sort({ masa_transformation: -1 })
      .limit(8)
      .lean(),
    buildFounderRevenueInsights(),
    getDatasetStats().catch(() => null),
    getTesterMonitorStats(),
  ]);

  const activity: FounderActivityItem[] = [];

  for (const c of pendingConsults.slice(0, 6)) {
    activity.push({
      id:        `consult-${c.id}`,
      type:      'consult',
      actor:     c.studentName,
      summary:   snippet(c.studentMessage || c.adamSummary || 'Consult flagged'),
      severity:  'action',
      timestamp: new Date(c.createdAt).toISOString(),
    });
  }

  for (const j of pendingJournals.journals.slice(0, 4)) {
    activity.push({
      id:        `journal-${j.id}`,
      type:      'journal',
      actor:     j.authorName,
      summary:   snippet(j.title),
      severity:  'warn',
      timestamp: j.submittedAt?.toISOString?.() ?? new Date().toISOString(),
    });
  }

  for (const m of recentMessages) {
    const role = String(m.role ?? 'system');
    activity.push({
      id:        `msg-${String(m._id)}`,
      type:      'message',
      actor:     role === 'adam' ? 'ADAM' : role === 'founder' ? 'P.alt' : String(m.speakerName ?? 'Student'),
      summary:   snippet(String(m.content ?? '')),
      severity:  role === 'adam' ? 'success' : 'info',
      timestamp: new Date(m.createdAt ?? Date.now()).toISOString(),
    });
  }

  for (const log of recentLogs) {
    const raw = log as { entity_A_summary?: string; entity_B_summary?: string };
    activity.push({
      id:        `tx-${String(log._id)}`,
      type:      'transform',
      actor:     'Alamtologi Brain',
      summary:   snippet(String(raw.entity_A_summary ?? raw.entity_B_summary ?? 'Transformation recorded')),
      severity:  'success',
      timestamp: new Date(log.masa_transformation ?? Date.now()).toISOString(),
    });
  }

  if (health && health.status !== 'HEALTHY') {
    activity.unshift({
      id:        `health-${Date.now()}`,
      type:      'system',
      actor:     'Memory Monitor',
      summary:   `${health.status} ${health.score}/100 — ${health.issues[0] ?? 'Check health'}`,
      severity:  health.status === 'CRITICAL' ? 'warn' : 'action',
      timestamp: health.checkedAt,
    });
  }

  activity.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const topFamilies = dashboard.families
    .slice()
    .sort((a, b) => b.stage - a.stage)
    .slice(0, 7)
    .map((f) => ({
      family:    f.family,
      stage:     f.stage,
      principle: f.principle,
    }));

  return {
    generatedAt: new Date().toISOString(),
    stack:       ENV.QXK24_STACK,
    llmProvider: ENV.LLM_PROVIDER,
    kernel:      ENV.QXK24_KERNEL_VERSION,
    era:         ENV.QXK24_ERA,
    health,
    ledger,
    stages: {
      totalFamilies:        dashboard.families.length,
      activeFamilies:       dashboard.activeCount,
      completedFamilies:    dashboard.completedCount,
      totalTransformations: dashboard.totalTransformations,
      topFamilies,
    },
    consults: {
      pending: pendingConsults.length,
      items:   pendingConsults,
    },
    journals: {
      pendingReview: pendingJournals.total,
      approved:      approvedJournals.total,
      published:     publishedJournals.total,
    },
    students: {
      total:  students.length,
      active: students.filter((s) => s.active !== false).length,
    },
    testers: testerStats,
    registration: getStudentRegistrationSettings(),
    llmPipeline: llmPipeline ?? {
      total: 0,
      usedInTraining: 0,
      remaining: 0,
      syllabusCompleteness: 0,
      syllabus: {
        bookId: 'formula-xyz',
        chaptersTotal: 8,
        chaptersTaught: 0,
        chaptersReady: 0,
        chapters: [],
      },
      bySource: {},
      byFamily: {},
      finetuneReady: false,
      message: 'LLM pipeline initializing',
    },
    messages24h,
    activity: activity.slice(0, 40),
    revenue,
  };
}
