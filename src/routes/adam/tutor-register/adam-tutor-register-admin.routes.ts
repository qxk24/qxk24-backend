/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Admin Routes
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
import { zValidator } from '@hono/zod-validator';
import { getTokenUser, requireFounderOrPlatformAdmin } from '../../../middleware/auth.middleware';
import { ADAM_MAIL_INBOX_HINT } from '../../../adam/adam-mail.service';
import { buildTutorAdminDashboardOverview } from '../../../adam/tutor/adam-tutor-admin-dashboard.service';
import {
  generateTutorRegisterCodes,
  listTutorRegisterCodes,
  revokeTutorRegisterCode,
} from '../../../adam/tutor/adam-tutor-register-code.service';
import { TutorRegisterCodeStatus } from '../../../adam/tutor/adam-tutor-register-code.schema';
import {
  activateTutorAgentPackage,
  serializeAgentPackage,
} from '../../../adam/tutor/adam-tutor-agent-package.service';
import {
  deleteTutorAgentByAdmin,
  getTutorAgentById,
  getTutorAgentWallet,
  listTutorAgentStudents,
  listTutorAgentsForAdmin,
} from '../../../adam/tutor/adam-tutor-agent.service';
import {
  rotateAndEmailTutorAgentPortalCredentials,
} from '../../../adam/tutor/adam-tutor-agent-credentials-email.service';
import { provisionTutorTestAgent } from '../../../adam/tutor/adam-tutor-test-agent.service';
import { sendTutorRegisterPinToStudent } from '../../../adam/tutor/adam-tutor-agent-pin-invite.service';
import { TUTOR_REGISTER_BAND_LABELS_BM } from '../../../adam/tutor/adam-tutor-register.constants';
import {
  AdminActivatePackageSchema,
  AdminGenerateSchema,
  AdminListSchema,
  AdminTestAgentSchema,
  AgentPinEmailSchema,
  CodeValidateSchema,
} from './adam-tutor-register.schemas';

const router = new Hono();
// GET /api/adam/tutor/admin/overview — founder dashboard stats + pricing
router.get('/admin/overview', requireFounderOrPlatformAdmin, async (c) => {
  try {
    const data = await buildTutorAdminDashboardOverview();
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        ...data,
        agentsActive: data.agents.active,
      },
      timestamp: data.generatedAt,
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/tutor/admin/codes — founder
router.get('/admin/codes', requireFounderOrPlatformAdmin, async (c) => {
  try {
    const query = c.req.query();
    const parsed = AdminListSchema.safeParse(query);
    const filters = parsed.success
      ? {
          band:   parsed.data.band,
          status: parsed.data.status as TutorRegisterCodeStatus | undefined,
          limit:  parsed.data.limit,
        }
      : {};
    const codes = await listTutorRegisterCodes(filters);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { codes },
      count:   codes.length,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/tutor/admin/codes/generate — founder
router.post('/admin/codes/generate', requireFounderOrPlatformAdmin, zValidator('json', AdminGenerateSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const founder = getTokenUser(c)!;
    const codes = await generateTutorRegisterCodes({
      band:       body.band,
      count:      body.count ?? 1,
      agentId:    body.agentId,
      agentLabel: body.agentLabel,
      notes:      body.notes,
      preferred:  body.preferred,
      createdBy:  founder.userId,
    });

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        codes: codes.map((doc) => ({
          codeId:       doc.codeId,
          registerCode: doc.registerCode,
          band:         doc.band,
          bandLabel:    doc.band ? TUTOR_REGISTER_BAND_LABELS_BM[doc.band] : null,
          pinLabel:     doc.band ? TUTOR_REGISTER_BAND_LABELS_BM[doc.band] : null,
          agentId:      doc.agentId,
          agentLabel:   doc.agentLabel,
          status:       doc.status,
          createdAt:    doc.createdAt,
        })),
      },
      message: `${codes.length} PIN dijana.`,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menjana kod.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/admin/codes/revoke — founder
router.post('/admin/codes/revoke', requireFounderOrPlatformAdmin, zValidator('json', CodeValidateSchema), async (c) => {
  try {
    const { registerCode } = c.req.valid('json');
    const ok = await revokeTutorRegisterCode(registerCode);
    return c.json({
      success: ok,
      kernel:  'ALAMTOLOGI',
      message: ok ? 'Kod dibatalkan.' : 'Kod tidak dijumpai atau sudah digunakan.',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/tutor/admin/codes/send-student-email — founder emails student PIN
router.post(
  '/admin/codes/send-student-email',
  requireFounderOrPlatformAdmin,
  zValidator('json', AgentPinEmailSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const result = await sendTutorRegisterPinToStudent(body);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    result,
        message: `Student PIN ${result.registerCode} emailed to ${result.studentEmail}. ${ADAM_MAIL_INBOX_HINT}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send student PIN email.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/adam/tutor/admin/agents — founder
router.get('/admin/agents', requireFounderOrPlatformAdmin, async (c) => {
  try {
    const agents = await listTutorAgentsForAdmin();
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { agents },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/tutor/admin/agents — disabled; agen self-register at /adam/tutor/agen/daftar
router.post('/admin/agents', requireFounderOrPlatformAdmin, async (c) => {
  return c.json({
    success: false,
    error:   'Admin cannot create agen accounts. Agen register and pay at /adam/tutor/agen/daftar.',
    kernel:  'ALAMTOLOGI',
  }, 403);
});

// POST /api/adam/tutor/admin/agents/:agentId/activate-package — founder marks package paid
router.post(
  '/admin/agents/:agentId/activate-package',
  requireFounderOrPlatformAdmin,
  zValidator('json', AdminActivatePackageSchema),
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const agentId = c.req.param('agentId');
      const body = c.req.valid('json');
      const agent = await activateTutorAgentPackage(agentId, {
        band:        body.band,
        tier:        body.tier,
        activatedBy: founder.userId,
        isRenewal:   body.renewal === true,
      });
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { agent: { agentId: agent.agentId, ...serializeAgentPackage(agent) } },
        message: `Pakej ${body.tier} diaktifkan — ${agent.pinBalance} PIN tersedia.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengaktifkan pakej.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/agents/test-account — create or refresh QA test agen
router.post(
  '/admin/agents/test-account',
  requireFounderOrPlatformAdmin,
  zValidator('json', AdminTestAgentSchema),
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const body = c.req.valid('json');
      const result = await provisionTutorTestAgent({
        email:       body.email,
        orgName:     body.orgName,
        contactName: body.contactName,
        activatedBy: founder.userId,
        sendEmail:   body.sendEmail,
      });
      const action = result.created ? 'created' : 'refreshed';
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    result,
        message: result.credentialsEmailSent
          ? `QA test agen ${action}. Credentials emailed to ${result.email}. ${ADAM_MAIL_INBOX_HINT}`
          : `QA test agen ${action}. Copy credentials below — email was not sent.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to provision QA test agen.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/agents/:agentId/send-credentials — email portal token (resets token)
router.post(
  '/admin/agents/:agentId/send-credentials',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const agentId = c.req.param('agentId');
      if (!agentId) {
        return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
      }
      const agent = await getTutorAgentById(agentId);
      if (!agent) {
        return c.json({ success: false, error: 'Agen not found.', kernel: 'ALAMTOLOGI' }, 404);
      }

      const result = await rotateAndEmailTutorAgentPortalCredentials(agent);

      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    {
          agentId:   result.agent.agentId,
          agentCode: result.agent.agentCode,
          email:     result.email,
        },
        message: `Portal credentials emailed to ${result.email}. ${ADAM_MAIL_INBOX_HINT} Previous portal token no longer works.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to email portal credentials.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/adam/tutor/admin/agents/:agentId/students — founder
router.get('/admin/agents/:agentId/students', requireFounderOrPlatformAdmin, async (c) => {
  try {
    const agentId = c.req.param('agentId');
    if (!agentId) {
      return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const agent = await getTutorAgentById(agentId);
    if (!agent) {
      return c.json({ success: false, error: 'Agen not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    const students = await listTutorAgentStudents(agentId);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { students, total: students.length },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/tutor/admin/agents/:agentId/wallet — founder
router.get('/admin/agents/:agentId/wallet', requireFounderOrPlatformAdmin, async (c) => {
  try {
    const agentId = c.req.param('agentId');
    if (!agentId) {
      return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const wallet = await getTutorAgentWallet(agentId);
    if (!wallet) {
      return c.json({ success: false, error: 'Agen not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { wallet },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// DELETE /api/adam/tutor/admin/agents/:agentId — founder removes agen (no students / redeemed PINs)
router.delete('/admin/agents/:agentId', requireFounderOrPlatformAdmin, async (c) => {
  const agentId = c.req.param('agentId');
  if (!agentId) {
    return c.json({ success: false, error: 'Agent ID diperlukan.', kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    const result = await deleteTutorAgentByAdmin(agentId);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      message: `Agen ${result.orgName} (${result.agentCode}) telah dipadam.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memadam agen.';
    const status = msg.includes('tidak dijumpai') ? 404 : 400;
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
  }
});

export default router;
