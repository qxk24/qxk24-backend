/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : QXK24Brain Routes
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

import { Hono } from 'hono';
import { requireFounder } from '../middleware/auth.middleware';
import { ENV } from '../config/environments';
import {
  getOrCreateMaster,
  loadBrainContext,
} from './qxk24brain.engine';
import {
  QXK24BrainEntityModel,
  QXK24BrainLogModel,
} from './qxk24brain.schema';

const qxk24BrainRoutes = new Hono();

// GET /api/adam/brain — Current state of ADAM's brain
qxk24BrainRoutes.get('/', requireFounder, async (c) => {
  const master = await getOrCreateMaster('masa-bayu');
  return c.json({
    success: true,
    brain: {
      uid:                  master.uid,
      unifiedUnderstanding: master.unifiedUnderstanding,
      activeFamilies:       master.activeFamilies,
      completedFamilies:    master.completedFamilies,
      totalTransformations: master.totalTransformations,
      masa_last_updated:    master.masa_last_updated,
      principles:           master.principles,
      currentCycle:         master.currentCycle,
    },
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/context — For chat system
qxk24BrainRoutes.get('/context', requireFounder, async (c) => {
  const context = await loadBrainContext('masa-bayu');
  return c.json({
    success:   true,
    context,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/entities — All entities
qxk24BrainRoutes.get('/entities', requireFounder, async (c) => {
  const entities = await QXK24BrainEntityModel
    .find({ founderId: 'masa-bayu' })
    .sort({ masa_born: -1 })
    .limit(50)
    .lean();
  return c.json({
    success:   true,
    entities,
    total:     entities.length,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/brain/log — Transformation log
qxk24BrainRoutes.get('/log', requireFounder, async (c) => {
  const log = await QXK24BrainLogModel
    .find({ founderId: 'masa-bayu' })
    .sort({ masa_transformation: -1 })
    .limit(20)
    .lean();
  return c.json({
    success:   true,
    log,
    total:     log.length,
    kernel:    'QXK24',
    timestamp: new Date().toISOString(),
  });
});

export { qxk24BrainRoutes };
