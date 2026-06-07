/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : LLM Pipeline Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { requireFounder } from '../middleware/auth.middleware';
import { backfillSyllabusFromTeachingRecords } from './syllabus-teaching-progress';
import {
  exportDatasetAsJsonl,
  getDatasetStats,
  syncSyllabusProgressFromExamples,
} from './training-example-generator';

const router = new Hono();

router.get('/stats', requireFounder, async (c) => {
  const stats = await getDatasetStats();
  return c.json({ success: true, stats, kernel: 'ALAMTOLOGI' });
});

router.post('/reconcile-syllabus', requireFounder, async (c) => {
  await syncSyllabusProgressFromExamples();
  const backfill = await backfillSyllabusFromTeachingRecords();
  const stats = await getDatasetStats();
  return c.json({
    success: true,
    backfill,
    stats: stats.syllabus,
    kernel: 'ALAMTOLOGI',
  });
});

router.get('/export', requireFounder, async (c) => {
  const jsonl = await exportDatasetAsJsonl();
  c.header('Content-Type', 'application/x-ndjson; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="alamtologi-training.jsonl"');
  return c.body(jsonl);
});

export default router;
