/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : LLM Pipeline Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
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
  try {
    const stats = await getDatasetStats();
    return c.json({ success: true, stats, kernel: 'ALAMTOLOGI' });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.post('/reconcile-syllabus', requireFounder, async (c) => {
  try {
    await syncSyllabusProgressFromExamples();
    const backfill = await backfillSyllabusFromTeachingRecords();
    const stats = await getDatasetStats();
    return c.json({
      success: true,
      backfill,
      stats: stats.syllabus,
      kernel: 'ALAMTOLOGI',
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.get('/export', requireFounder, async (c) => {
  try {
    const jsonl = await exportDatasetAsJsonl();
    c.header('Content-Type', 'application/x-ndjson; charset=utf-8');
    c.header('Content-Disposition', 'attachment; filename="alamtologi-training.jsonl"');
    return c.body(jsonl);

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
