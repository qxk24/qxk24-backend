/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Student Routes
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
import { ENV } from '../../../config/environments';
import { requireStudent } from '../../../middleware/auth.middleware';
import {
  getParentGuardian,
  requireParentGuardian,
} from '../../../middleware/adam-tutor-parent.middleware';
import { validateTutorRegisterCode } from '../../../adam/tutor/adam-tutor-register-code.service';
import {
  completeTutorEnrollmentProfile,
  getTutorEnrollmentCheckoutQuote,
  getTutorEnrollmentForUser,
  lockTutorEnrollmentCode,
  resolveTutorEnrollmentAccess,
} from '../../../adam/tutor/adam-tutor-enrollment.service';
import {
  getTutorLearningProfile,
  getTutorLearningProgress,
} from '../../../adam/adam-tutor-learning-profile.service';
import {
  buildParentDashboard,
  buildParentReportForStudent,
  resolveParentGuardianByToken,
} from '../../../adam/tutor/adam-tutor-parent.service';
import { listSubjectsForBand } from '../../../adam/tutor-law/tutor-law.curriculum-catalog';
import {
  createTutorRegisterCheckoutSession,
  resolveStudentEmail,
  simulateTutorRegisterPayment,
  syncTutorPaymentFromSession,
} from '../../../adam/tutor/adam-tutor-register-stripe.service';
import { getStripeGatewayStatus } from '../../../subscriptions/stripe-gateway.service';
import {
  CodeLockSchema,
  CodeValidateSchema,
  ParentSessionSchema,
  ProfileCompleteSchema,
  userId,
} from './adam-tutor-register.schemas';

const router = new Hono();
// POST /api/adam/tutor/register/code/validate — public; no fee disclosed
router.post('/register/code/validate', zValidator('json', CodeValidateSchema), async (c) => {
  const { registerCode } = c.req.valid('json');
  const result = await validateTutorRegisterCode(registerCode);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    result,
    phase:   'MY',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/register/access — auth; enrollment gate for /adam/tutor
router.get('/register/access', requireStudent, async (c) => {
  const uid = userId(c);
  const access = await resolveTutorEnrollmentAccess(uid);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    access,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/register/me — auth
router.get('/register/me', requireStudent, async (c) => {
  const uid = userId(c);
  const [enrollment, learningProfile] = await Promise.all([
    getTutorEnrollmentForUser(uid),
    getTutorLearningProfile(uid),
  ]);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { enrollment, learningProfile },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/learning-profile — auth; ERA_2 adaptive state
router.get('/learning-profile', requireStudent, async (c) => {
  const learningProfile = await getTutorLearningProfile(userId(c));
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { learningProfile },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/curriculum/subjects — public; subjects by school band
router.get('/curriculum/subjects', async (c) => {
  const band = c.req.query('band')?.trim() as 'primary' | 'secondary' | 'university' | undefined;
  const valid = band === 'primary' || band === 'secondary' || band === 'university'
    ? band
    : 'secondary';
  const subjects = listSubjectsForBand(valid);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { band: valid, subjects },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/parent/session — validate parent access token
router.post('/parent/session', zValidator('json', ParentSessionSchema), async (c) => {
  const { accessToken } = c.req.valid('json');
  const guardian = await resolveParentGuardianByToken(accessToken);
  if (!guardian) {
    return c.json({ success: false, error: 'Token tidak sah.', kernel: 'ALAMTOLOGI' }, 401);
  }
  const dashboard = await buildParentDashboard(guardian, '/adam/tutor/parent');
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { dashboard, accessTokenHint: guardian.accessTokenHint },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/parent/dashboard — parent portal (X-Parent-Access-Token)
router.get('/parent/dashboard', requireParentGuardian, async (c) => {
  const guardian = getParentGuardian(c);
  const dashboard = await buildParentDashboard(guardian, '/adam/tutor/parent');
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { dashboard },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/parent/report — weekly | monthly
router.get('/parent/report', requireParentGuardian, async (c) => {
  const guardian = getParentGuardian(c);
  const kind = c.req.query('kind') === 'monthly' ? 'monthly' : 'weekly';
  const report = await buildParentReportForStudent(guardian.studentUserId, kind);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { report },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/learning-progress — auth; ERA_2h metrics from event log
router.get('/learning-progress', requireStudent, async (c) => {
  const progress = await getTutorLearningProgress(userId(c));
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { progress },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/register/code/lock — auth; lock kod to student
router.post('/register/code/lock', requireStudent, zValidator('json', CodeLockSchema), async (c) => {
  try {
    const { registerCode } = c.req.valid('json');
    const enrollment = await lockTutorEnrollmentCode(userId(c), registerCode);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { enrollment },
      message: 'PIN disahkan. Teruskan ke bayaran.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PIN gagal.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/tutor/register/checkout-quote — auth; fee only after kod locked
router.get('/register/checkout-quote', requireStudent, async (c) => {
  try {
    const quote = await getTutorEnrollmentCheckoutQuote(userId(c));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    quote,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quote unavailable.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/register/checkout — auth
router.post('/register/checkout', requireStudent, async (c) => {
  try {
    const uid = userId(c);
    const email = await resolveStudentEmail(uid);
    const stripe = getStripeGatewayStatus();

    if (!stripe.configured && ENV.NODE_ENV !== 'production') {
      await simulateTutorRegisterPayment(uid);
      const enrollment = await getTutorEnrollmentForUser(uid);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { simulated: true, enrollment },
        message: 'Bayaran simulasi (dev). Sila isi borang pendaftaran.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await createTutorRegisterCheckoutSession({
      userId:        uid,
      customerEmail: email,
    });

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/register/sync-payment — auth; after Stripe return
router.post('/register/sync-payment', requireStudent, async (c) => {
  const body = await c.req.json().catch(() => ({})) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  const ok = await syncTutorPaymentFromSession(userId(c), sessionId);
  const enrollment = await getTutorEnrollmentForUser(userId(c));

  return c.json({
    success: ok,
    kernel:  'ALAMTOLOGI',
    data:    { paid: ok, enrollment },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/register/complete — auth; profile form after PIN (before pay)
router.post('/register/complete', requireStudent, zValidator('json', ProfileCompleteSchema), async (c) => {
  try {
    const result = await completeTutorEnrollmentProfile(userId(c), c.req.valid('json'));
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        enrollment:         result.enrollment,
        parentAccessToken:  result.parentAccessToken,
        parentGuardianHint: result.parentGuardianHint,
      },
      message: 'Profil disimpan. Teruskan ke bayaran.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Borang pendaftaran gagal.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

export default router;
