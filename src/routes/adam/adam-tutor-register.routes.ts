/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */
import { Hono } from 'hono';
import agentPublicRoutes from './tutor-register/adam-tutor-register-agent-public.routes';
import studentRoutes from './tutor-register/adam-tutor-register-student.routes';
import adminRoutes from './tutor-register/adam-tutor-register-admin.routes';
import agentPortalRoutes from './tutor-register/adam-tutor-register-agent-portal.routes';

const router = new Hono();

router.route('/', agentPublicRoutes);
router.route('/', studentRoutes);
router.route('/', adminRoutes);
router.route('/', agentPortalRoutes);

export default router;
