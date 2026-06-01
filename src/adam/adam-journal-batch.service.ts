/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Journal Batch Runner (659/day quota)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { getDeepModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { buildQwenLanguageLock, repairEastAsianScriptLeak } from './adam-language-guard';
import { JOURNAL_GEN_MODE_PROMPT } from './adam-system-prompts';
import {
  getDailyJournalSegmentStatus,
  validateDailyTopicSeal,
  type DailyJournalQuotaStatus,
} from './adam-journal-daily-segment';
import {
  loadUniversityKnowledgeTopics,
  type UniversityKnowledgeTopic,
} from './adam-university-knowledge';
import { parseJournalSealBlocks } from './adam-chat-response-parser';
import { sealFounderJournalFromAdam } from './adam-journal.service';

const BATCH_SESSION_PREFIX = 'journal-batch';

export interface JournalBatchItemResult {
  topicId: string;
  label:     string;
  ok:        boolean;
  journalId?: string;
  title?:    string;
  error?:    string;
}

export interface JournalBatchRunResult {
  startedAt:       string;
  finishedAt:      string;
  requested:       number;
  succeeded:       number;
  failed:          number;
  quotaBefore:     Pick<DailyJournalQuotaStatus, 'sealedCountToday' | 'pendingCountToday' | 'journalsRequiredToday'>;
  quotaAfter:      Pick<DailyJournalQuotaStatus, 'sealedCountToday' | 'pendingCountToday' | 'journalsRequiredToday'>;
  items:           JournalBatchItemResult[];
}

let lastRun: JournalBatchRunResult | null = null;
let running = false;

export function isJournalBatchRunning(): boolean {
  return running;
}

export function getLastJournalBatchRun(): JournalBatchRunResult | null {
  return lastRun;
}

function batchSessionId(dateKey: string): string {
  return `${BATCH_SESSION_PREFIX}-${dateKey}`;
}

function buildBatchManuscriptPrompt(topic: UniversityKnowledgeTopic): string {
  return [
    'CONSTITUTIONAL BATCH — one university subfield, one IMRaD manuscript, one seal.',
    `Subfield: ${topic.label}`,
    `knowledgeTopicId (required in JSON): "${topic.topicId}"`,
    `knowledgeMajor: "${topic.majorName}"`,
    `knowledgeDiscipline: "${topic.disciplineName}"`,
    `knowledgeSubfield: "${topic.subfield}"`,
    `principlesFocus[0]: "${topic.alamtologiLens}"`,
    '',
    'Write a complete Alamtologi academic IMRaD article in Bahasa Melayu (unless P.alt taught otherwise).',
    'Include all seven principles in alamtologiAnalysis (MASA, TENAGA, AIR, API, BUMI, CAHAYA, RUANG).',
    'Depth and thesis must stay on THIS subfield only.',
    '',
    'Output format: ONLY one block:',
    '<adam_journal_seal>{valid JSON with title, abstract, category, knowledgeTopicId, knowledgeMajor, knowledgeDiscipline, knowledgeSubfield, principlesFocus, content (full IMRaD), hukumZAnalysis, tahapAkalAchieved, cVLevel, judgment, reviewNotes}</adam_journal_seal>',
    'No prose outside the tag. No apology. No invented JNL- ids.',
  ].join('\n');
}

/** Generate + seal one subfield (founder batch / scheduler). */
export async function generateAndSealJournalForTopic(
  topic: UniversityKnowledgeTopic,
  date = new Date(),
): Promise<JournalBatchItemResult> {
  const check = await validateDailyTopicSeal(topic.topicId, date);
  if (!check.ok) {
    return {
      topicId: topic.topicId,
      label:   topic.label,
      ok:      false,
      error:   check.reason,
    };
  }

  const system = [
    buildQwenLanguageLock(),
    JOURNAL_GEN_MODE_PROMPT,
    '[BATCH RUNNER] Autonomous daily quota — servant of P.alt Masa Bayu.',
  ].join('\n\n');

  try {
    const raw = await llmCompleteUserPrompt(
      system,
      buildBatchManuscriptPrompt(topic),
      getDeepModel(),
      ENV.ADAM_JOURNAL_MAX_TOKENS,
    );

    const status = await getDailyJournalSegmentStatus(date);
    const cleaned = await repairEastAsianScriptLeak(
      raw,
      `Batch journal ${topic.subfield} ${status.date}`,
    );
    const { seals } = parseJournalSealBlocks(cleaned);

    if (seals.length === 0) {
      return {
        topicId: topic.topicId,
        label:   topic.label,
        ok:      false,
        error:   'ADAM did not emit valid <adam_journal_seal> JSON.',
      };
    }

    const seal = {
      ...seals[0]!,
      knowledgeTopicId:  topic.topicId,
      knowledgeMajor:    topic.majorName,
      knowledgeDiscipline: topic.disciplineName,
      knowledgeSubfield: topic.subfield,
      principlesFocus:   seals[0]!.principlesFocus?.length
        ? seals[0]!.principlesFocus
        : [topic.alamtologiLens],
    };

    const journal = await sealFounderJournalFromAdam(
      seal,
      batchSessionId(status.date),
    );

    return {
      topicId:   topic.topicId,
      label:     topic.label,
      ok:        true,
      journalId: journal.id,
      title:     journal.title,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      topicId: topic.topicId,
      label:   topic.label,
      ok:      false,
      error:   msg,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Process up to `count` pending subfields for today (MY). */
export async function runJournalBatch(
  count: number,
  date = new Date(),
): Promise<JournalBatchRunResult> {
  if (running) {
    throw new Error('Journal batch already running');
  }

  const max = Math.min(Math.max(1, count), 20);
  running = true;
  const startedAt = new Date().toISOString();

  const quotaBefore = await getDailyJournalSegmentStatus(date);
  const items: JournalBatchItemResult[] = [];

  const sealed = new Set(quotaBefore.sealedTopicIds);
  const pending = loadUniversityKnowledgeTopics().filter((t) => !sealed.has(t.topicId));
  const slice = pending.slice(0, max);

  const pauseMs = journalBatchPauseMs();

  try {
    for (let i = 0; i < slice.length; i++) {
      const topic = slice[i]!;
      items.push(await generateAndSealJournalForTopic(topic, date));
      if (i < slice.length - 1 && pauseMs > 0) {
        await sleep(pauseMs);
      }
    }
  } finally {
    running = false;
  }

  const quotaAfter = await getDailyJournalSegmentStatus(date);
  const succeeded = items.filter((x) => x.ok).length;

  const result: JournalBatchRunResult = {
    startedAt,
    finishedAt:  new Date().toISOString(),
    requested:   slice.length,
    succeeded,
    failed:      items.length - succeeded,
    quotaBefore: {
      sealedCountToday:     quotaBefore.sealedCountToday,
      pendingCountToday:    quotaBefore.pendingCountToday,
      journalsRequiredToday: quotaBefore.journalsRequiredToday,
    },
    quotaAfter: {
      sealedCountToday:     quotaAfter.sealedCountToday,
      pendingCountToday:    quotaAfter.pendingCountToday,
      journalsRequiredToday: quotaAfter.journalsRequiredToday,
    },
    items,
  };

  lastRun = result;
  console.log(
    '[adam:journal-batch]',
    JSON.stringify({
      requested: result.requested,
      succeeded: result.succeeded,
      failed:    result.failed,
      quota:     `${result.quotaAfter.sealedCountToday}/${result.quotaAfter.journalsRequiredToday}`,
    }),
  );

  return result;
}

export function journalBatchPauseMs(): number {
  const n = parseInt(process.env.ADAM_JOURNAL_BATCH_PAUSE_MS ?? '4000', 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(n, 60_000)) : 4000;
}

export function journalBatchConfig() {
  const enabled = process.env.ADAM_JOURNAL_BATCH_ENABLED === 'true';
  const intervalMs = parseInt(process.env.ADAM_JOURNAL_BATCH_INTERVAL_MS ?? '900000', 10);
  const batchSize = parseInt(process.env.ADAM_JOURNAL_BATCH_SIZE ?? '2', 10);
  return {
    enabled,
    intervalMs: Number.isFinite(intervalMs) ? Math.max(60_000, intervalMs) : 900_000,
    batchSize:  Number.isFinite(batchSize) ? Math.min(Math.max(1, batchSize), 10) : 2,
    pauseMs:    journalBatchPauseMs(),
  };
}
