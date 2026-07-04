/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Routes (aggregator)
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
import authRoutes from './adam-student.auth.routes';
import billingRoutes from './adam-student.billing.routes';
import chatRoutes from './adam-student.chat.routes';
import coachingRoutes from './adam-student.coaching.routes';
import toolsDocsRoutes from './adam-student.tools-docs.routes';
import tutorRoutes from './adam-student.tutor.routes';

const router = new Hono();

router.route('/', authRoutes);
router.route('/', billingRoutes);
router.route('/', chatRoutes);
router.route('/', tutorRoutes);
router.route('/', coachingRoutes);
router.route('/', toolsDocsRoutes);

export default router;
