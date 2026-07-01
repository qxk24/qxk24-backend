/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Charity Agent Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-01
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
import fs from 'fs/promises';
import { getTokenUser, requireFounderOrPlatformAdmin } from '../../../middleware/auth.middleware';
import { ADAM_MAIL_INBOX_HINT } from '../../../adam/adam-mail.service';
import { TutorCharityApplicationStatus } from '../../../adam/tutor/adam-tutor-charity-agent-application.schema';
import {
  approveCharityAgentApplication,
  getCharityApplicationStudentIdPath,
  listCharityAgentApplications,
  rejectCharityAgentApplication,
  submitCharityAgentApplication,
} from '../../../adam/tutor/adam-tutor-charity-agent.service';

const router = new Hono();

const CharityRejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

// POST /api/adam/tutor/agent/charity/apply — public multipart application
router.post('/agent/charity/apply', async (c) => {
  try {
    const body = await c.req.parseBody();
    const result = await submitCharityAgentApplication(body as Record<string, unknown>);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      message: 'Application received. Our team will verify your student ID and email you when approved.',
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not submit application.';
    const status = msg.includes('already') ? 409 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

// GET /api/adam/tutor/admin/charity-applications — founder review queue
router.get('/admin/charity-applications', requireFounderOrPlatformAdmin, async (c) => {
  const statusRaw = c.req.query('status');
  const status = statusRaw === 'pending' || statusRaw === 'approved' || statusRaw === 'rejected'
    ? statusRaw as TutorCharityApplicationStatus
    : undefined;
  const applications = await listCharityAgentApplications(status);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { applications },
    count:   applications.length,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/admin/charity-applications/:applicationId/approve
router.post(
  '/admin/charity-applications/:applicationId/approve',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const applicationId = c.req.param('applicationId');
      if (!applicationId) {
        return c.json({ success: false, error: 'Application ID required.', kernel: 'ALAMTOLOGI' }, 400);
      }
      const result = await approveCharityAgentApplication(applicationId, founder.userId);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    result,
        message: result.credentialsEmailSent
          ? `Charity agent approved. Portal credentials emailed. ${ADAM_MAIL_INBOX_HINT}`
          : 'Charity agent approved. Save portal credentials from the response.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve application.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/charity-applications/:applicationId/reject
router.post(
  '/admin/charity-applications/:applicationId/reject',
  requireFounderOrPlatformAdmin,
  zValidator('json', CharityRejectSchema),
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const applicationId = c.req.param('applicationId');
      if (!applicationId) {
        return c.json({ success: false, error: 'Application ID required.', kernel: 'ALAMTOLOGI' }, 400);
      }
      const body = c.req.valid('json');
      const application = await rejectCharityAgentApplication(
        applicationId,
        founder.userId,
        body.reason,
      );
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { application },
        message: 'Application rejected.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject application.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/adam/tutor/admin/charity-applications/:applicationId/student-id — founder only
router.get(
  '/admin/charity-applications/:applicationId/student-id',
  requireFounderOrPlatformAdmin,
  async (c) => {
    const applicationId = c.req.param('applicationId');
    if (!applicationId) {
      return c.json({ success: false, error: 'Application ID required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const storedPath = await getCharityApplicationStudentIdPath(applicationId);
    if (!storedPath) {
      return c.json({ success: false, error: 'Student ID file not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    try {
      const file = await fs.readFile(storedPath);
      const ext = storedPath.toLowerCase();
      const type = ext.endsWith('.pdf')
        ? 'application/pdf'
        : ext.endsWith('.png')
          ? 'image/png'
          : ext.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';
      return new Response(file, {
        headers: {
          'Content-Type':        type,
          'Content-Disposition': `inline; filename="student-id"`,
          'Cache-Control':       'private, no-store',
        },
      });
    } catch {
      return c.json({ success: false, error: 'Could not read student ID file.', kernel: 'ALAMTOLOGI' }, 500);
    }
  },
);

export default router;
