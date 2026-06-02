/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge Routes
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

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireFounder, getTokenUser } from '../middleware/auth.middleware';
import { TeachingBridge } from './vendor/index';
import {
  applyConfirmedUnitToAllStudents,
  applyConfirmedUnitToStudent,
} from '../qxk24brain/qxk24brain-student.engine';

const router = new Hono();

function getBridge(): TeachingBridge {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  return new TeachingBridge(db);
}

router.get('/pending', requireFounder, async (c) => {
  const bridge = getBridge();
  const units = await bridge.getPendingUnits();
  return c.json({ success: true, units, count: units.length });
});

const ConfirmSchema = z.object({
  crystallisedUnitId: z.string().min(1),
});

router.post('/confirm', requireFounder, zValidator('json', ConfirmSchema), async (c) => {
  const body = c.req.valid('json');
  const user = getTokenUser(c);
  const confirmedBy = user?.userId ?? 'masa-bayu';

  const bridge = getBridge();
  const result = await bridge.confirmUnit(body.crystallisedUnitId, confirmedBy);

  if (!result.success) {
    return c.json({ success: false, reason: result.reason }, 400);
  }

  const confirmed = await bridge.getConfirmedUnits();
  const record = confirmed.find((r) => r.crystallisedUnitId === body.crystallisedUnitId);

  if (record?.unit) {
    await applyConfirmedUnitToAllStudents({
      id:        record.unit.id,
      level:     record.unit.level,
      family:    record.unit.family,
      subRegion: record.unit.subRegion,
      nodeA:     record.unit.nodeA,
      nodeB:     record.unit.nodeB,
    });
  }

  return c.json({
    success: true,
    aidilUnitId: result.aidilUnitId,
    crystallisedUnitId: body.crystallisedUnitId,
  });
});

router.post('/reject', requireFounder, zValidator('json', ConfirmSchema), async (c) => {
  const body = c.req.valid('json');
  const bridge = getBridge();
  await bridge.rejectUnit(body.crystallisedUnitId);
  return c.json({ success: true, crystallisedUnitId: body.crystallisedUnitId });
});

router.post('/project-student', requireFounder, zValidator('json', z.object({
  studentId: z.string().min(1),
  crystallisedUnitId: z.string().min(1),
})), async (c) => {
  const body = c.req.valid('json');
  const bridge = getBridge();
  const pending = await bridge.getPendingUnits();
  const confirmed = await bridge.getConfirmedUnits();
  const record =
    confirmed.find((r) => r.crystallisedUnitId === body.crystallisedUnitId)
    ?? pending.find((r) => r.crystallisedUnitId === body.crystallisedUnitId);

  if (!record?.unit || record.status !== 'confirmed') {
    return c.json({ success: false, reason: 'Unit not confirmed' }, 400);
  }

  await applyConfirmedUnitToStudent(body.studentId, {
    level:     record.unit.level,
    family:    record.unit.family,
    subRegion: record.unit.subRegion,
    nodeA:     record.unit.nodeA,
    nodeB:     record.unit.nodeB,
  });

  return c.json({ success: true, studentId: body.studentId });
});

export default router;
