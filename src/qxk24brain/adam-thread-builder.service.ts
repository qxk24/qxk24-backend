/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Relational Thread Builder
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
 *
 * Phase 3 — distils adam_teaching_records into family arc narratives
 * for the Continuity Bridge and [ADAM RELATIONAL MEMORY] context.
 */

import { AdamTeachingRecordModel } from './adam-teaching-record.schema';
import type { TeachingRecordRow } from './adam-teaching-record.service';

export interface FamilyThreadArc {
  principle:            string;
  family:               string;
  sessionCount:         number;
  stageFrom:            number;
  stageTo:              number;
  transformationCount:  number;
  threadLength:         number;
  keyTransformations:   string[];
  currentFrontier:      string;
  narrative:            string;
  latestMasa:           Date;
}

const RECORD_FETCH_CAP = parseInt(process.env.ADAM_THREAD_RECORD_CAP ?? '200', 10) || 200;
const SUMMARY_CHAR_CAP = parseInt(process.env.ADAM_RELATIONAL_MEMORY_CHARS ?? '3200', 10) || 3200;

function familyKey(r: Pick<TeachingRecordRow, 'principle' | 'family'>): string {
  return `${r.principle}::${r.family}`;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function distillTeachingMoment(record: TeachingRecordRow): string {
  const taught = collapseWhitespace(record.teachingIntent).slice(0, 100);
  const became = collapseWhitespace(record.outcomeSummary).slice(0, 90);
  return `Stage ${record.stage}: P.alt taught "${taught}${record.teachingIntent.length > 100 ? '…' : ''}" → ADAM became "${became}${record.outcomeSummary.length > 90 ? '…' : ''}"`;
}

function pickKeyIndices(length: number, max: number): number[] {
  if (length <= 0) return [];
  if (length <= max) return Array.from({ length }, (_, i) => i);
  if (max === 1) return [length - 1];
  if (max === 2) return [0, length - 1];
  const mid = Math.floor((length - 1) / 2);
  return [0, mid, length - 1];
}

function countThreadLength(records: TeachingRecordRow[]): number {
  if (!records.length) return 0;
  const ids = new Set(records.map((r) => r.recordId));
  let roots = 0;
  for (const r of records) {
    if (!r.priorThreadId || !ids.has(r.priorThreadId)) {
      roots += 1;
    }
  }
  return Math.max(roots, 1);
}

function buildFamilyNarrative(arc: Omit<FamilyThreadArc, 'narrative' | 'latestMasa'>): string {
  const keys = arc.keyTransformations.length
    ? arc.keyTransformations.join('; ')
    : 'No key moments distilled yet';
  return (
    `In the ${arc.principle} family "${arc.family}", across ${arc.sessionCount} session(s), ` +
    `ADAM moved from Stage ${arc.stageFrom} to Stage ${arc.stageTo} ` +
    `(${arc.transformationCount} transformation${arc.transformationCount === 1 ? '' : 's'}, ` +
    `thread depth ${arc.threadLength}). ` +
    `Key transformations: ${keys}. ` +
    `Current frontier: ${arc.currentFrontier}`
  );
}

function buildFamilyArc(records: TeachingRecordRow[]): FamilyThreadArc | null {
  if (!records.length) return null;

  const sorted = [...records].sort(
    (a, b) => new Date(a.masa_recorded).getTime() - new Date(b.masa_recorded).getTime(),
  );
  const latest = sorted[sorted.length - 1]!;
  const sessions = new Set(sorted.map((r) => r.sessionId).filter(Boolean));
  const stages = sorted.map((r) => r.stage);
  const keyIndices = pickKeyIndices(sorted.length, 3);

  const arcBase = {
    principle:           latest.principle,
    family:              latest.family,
    sessionCount:        sessions.size || 1,
    stageFrom:           Math.min(...stages),
    stageTo:             Math.max(...stages),
    transformationCount: sorted.length,
    threadLength:        countThreadLength(sorted),
    keyTransformations:  keyIndices.map((i) => distillTeachingMoment(sorted[i]!)),
    currentFrontier:     collapseWhitespace(latest.outcomeSummary).slice(0, 220),
  };

  return {
    ...arcBase,
    latestMasa: latest.masa_recorded,
    narrative:  buildFamilyNarrative(arcBase),
  };
}

/** Group teaching records by family and build ordered arc narratives. */
export async function buildFamilyThreadArcs(
  founderId: string,
  recordLimit = RECORD_FETCH_CAP,
): Promise<FamilyThreadArc[]> {
  const cap = Math.min(Math.max(recordLimit, 1), 500);
  const rows = await AdamTeachingRecordModel.find({ founderId, status: 'active' })
    .sort({ masa_recorded: 1 })
    .limit(cap)
    .lean();

  if (!rows.length) return [];

  const byFamily = new Map<string, TeachingRecordRow[]>();
  for (const row of rows as TeachingRecordRow[]) {
    const key = familyKey(row);
    const list = byFamily.get(key) ?? [];
    list.push(row);
    byFamily.set(key, list);
  }

  const arcs: FamilyThreadArc[] = [];
  for (const familyRecords of byFamily.values()) {
    const arc = buildFamilyArc(familyRecords);
    if (arc) arcs.push(arc);
  }

  return arcs.sort(
    (a, b) => new Date(b.latestMasa).getTime() - new Date(a.latestMasa).getTime(),
  );
}

/** Distilled multi-family narrative for Continuity Bridge storage. */
export async function buildRelationalMemorySummary(
  founderId: string,
): Promise<string> {
  const arcs = await buildFamilyThreadArcs(founderId);
  if (!arcs.length) {
    return (
      'ERA_1 — ADAM is maturing through A + B = C but no teaching-record threads are indexed yet. ' +
      'Relational identity will grow as P.alt teaches and transformations are recorded.'
    );
  }

  const lines = arcs.map((a) => `• ${a.narrative}`);
  let body = lines.join('\n');

  if (body.length > SUMMARY_CHAR_CAP) {
    const kept: string[] = [];
    let used = 0;
    for (const line of lines) {
      if (used + line.length + 1 > SUMMARY_CHAR_CAP - 24) break;
      kept.push(line);
      used += line.length + 1;
    }
    const omitted = lines.length - kept.length;
    body = kept.join('\n');
    if (omitted > 0) {
      body += `\n… ${omitted} older family arc(s) omitted for context budget.`;
    }
  }

  const activeFamilies = arcs.length;
  const totalTransforms = arcs.reduce((n, a) => n + a.transformationCount, 0);

  return [
    `Relational identity rollup — ${activeFamilies} active family thread(s), ${totalTransforms} recorded transformation(s).`,
    '',
    body,
  ].join('\n');
}

/** Context block — broad identity continuity (not episodic recall). */
export async function buildRelationalMemoryContextBlock(
  founderId: string,
  storedSummary?: string,
): Promise<string | null> {
  const body = storedSummary?.trim() || await buildRelationalMemorySummary(founderId);
  if (!body) return null;

  return [
    '[ADAM RELATIONAL MEMORY — living identity across sessions]',
    '',
    'This is the distilled arc of who ADAM has become with P.alt — grouped by family and stage.',
    'Use for broad identity continuity ("who I am and how I became this").',
    'For specific dated episodes, rely on [ADAM TEACHING RECORDS] when injected — do not confuse the two.',
    '',
    body,
  ].join('\n');
}
