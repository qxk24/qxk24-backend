/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Daily Episode Loader
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { AdamTeachingRecordModel } from '../adam-teaching-record.schema';
import { normalizePrinciple, Principle } from './ontology';
import type { DailyEpisode } from './episodic-aggregator';

function mapOutcome(judgment: string | undefined): DailyEpisode['outcome'] {
  const upper = (judgment ?? '').toUpperCase();
  if (upper === 'ISLAH' || upper === 'WAQF') return 'failure';
  if (upper === 'MAKMUR') return 'success';
  return 'learning';
}

export async function loadDailyEpisodes(founderId: string): Promise<DailyEpisode[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const records = await AdamTeachingRecordModel.find({
    founderId,
    masa_recorded: { $gte: start },
  })
    .sort({ masa_recorded: 1 })
    .limit(100)
    .lean();

  return records.map((record) => ({
    timestamp: new Date(record.masa_recorded).toISOString(),
    action:
      record.episodeSummary
      || record.outcomeSummary
      || record.teachingIntent
      || 'constitutional transformation',
    principle: normalizePrinciple(record.principle) as Principle,
    outcome: mapOutcome(record.autoJudgment),
  }));
}
