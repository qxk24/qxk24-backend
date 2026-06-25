/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Register Agent Public Routes
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
import { ADAM_MAIL_INBOX_HINT } from '../../../adam/adam-mail.service';
import { TutorAgentModel } from '../../../adam/tutor/adam-tutor-agent.schema';
import { TutorAgentPackageStatus } from '../../../adam/tutor/adam-tutor-agent-package.config';
import { createTutorAgent } from '../../../adam/tutor/adam-tutor-agent.service';
import { sendTutorAgentPortalCredentialsEmail } from '../../../adam/tutor/adam-tutor-agent-credentials-email.service';
import { getStripeGatewayStatus } from '../../../subscriptions/stripe-gateway.service';
import {
  createTutorAgentPackageCheckoutSession,
  simulateTutorAgentPackagePayment,
  syncTutorAgentPackageFromSession,
} from '../../../adam/tutor/adam-tutor-agent-package-stripe.service';
import { AgentRegisterCompleteSchema, AgentSelfRegisterSchema } from './adam-tutor-register.schemas';

const router = new Hono();
// POST /api/adam/tutor/agent/register — public self-registration → Stripe checkout
router.post('/agent/register', zValidator('json', AgentSelfRegisterSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const existing = await TutorAgentModel.findOne({ email: body.email.trim().toLowerCase() });
    if (existing) {
      return c.json({
        success: false,
        error:   'Email already registered. Sign in at the agen portal if you already have credentials.',
        kernel:  'ALAMTOLOGI',
      }, 409);
    }

    const agent = await createTutorAgent({
      ...body,
      createdBy: 'agent-self-register',
    });

    const stripe = getStripeGatewayStatus();
    const registerCheckoutPaths = {
      successPath: '/adam/tutor/agen/daftar/complete?session_id={CHECKOUT_SESSION_ID}',
      cancelPath:  '/adam/tutor/agen/daftar?cancelled=1',
    };

    if (!stripe.configured && ENV.NODE_ENV !== 'production') {
      const updated = await simulateTutorAgentPackagePayment(agent, {
        band: body.band,
        tier: body.packageTier,
      });
      const mail = await sendTutorAgentPortalCredentialsEmail(updated);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    {
          simulated:   true,
          orgName:       updated.orgName,
          agentCode:     updated.agentCode,
          portalToken:   updated.portalToken,
          pinBalance:    updated.pinBalance,
          packageStatus: updated.packageStatus,
          credentialsEmailSent: mail.sent,
          message:       mail.sent
            ? 'Package activated (dev simulation). Credentials emailed and shown below.'
            : 'Package activated (dev simulation). Save your agen code and portal token below.',
        },
        timestamp: new Date().toISOString(),
      }, 201);
    }

    const checkout = await createTutorAgentPackageCheckoutSession(agent, registerCheckoutPaths);

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        orgName:     agent.orgName,
        checkoutUrl: checkout.checkoutUrl,
        totalMyr:    checkout.totalMyr,
        pinCount:    checkout.pinCount,
        message:     'Continue to payment. Your agen code and portal token are issued after successful payment.',
      },
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Agen registration failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/agent/register/complete — public; reveal credentials after Stripe payment
router.post('/agent/register/complete', zValidator('json', AgentRegisterCompleteSchema), async (c) => {
  try {
    const { sessionId } = c.req.valid('json');
    if (!ENV.STRIPE_SECRET_KEY) {
      return c.json({
        success: false,
        error:   'Payment verification is not configured.',
        kernel:  'ALAMTOLOGI',
      }, 503);
    }

    const session = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}` },
    }).then((r) => r.json() as Promise<Record<string, unknown>>);

    const meta = session.metadata as Record<string, string> | undefined;
    if (meta?.checkoutType !== 'tutor_agent_package' || !meta.agentId) {
      return c.json({ success: false, error: 'Invalid checkout session.', kernel: 'ALAMTOLOGI' }, 400);
    }

    if (session.payment_status !== 'paid') {
      return c.json({ success: false, error: 'Payment not completed yet.', kernel: 'ALAMTOLOGI' }, 402);
    }

    await syncTutorAgentPackageFromSession(meta.agentId, sessionId);

    const agent = await TutorAgentModel.findOne({ agentId: meta.agentId });
    if (!agent || agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) {
      return c.json({ success: false, error: 'Package activation failed.', kernel: 'ALAMTOLOGI' }, 400);
    }

    const mail = await sendTutorAgentPortalCredentialsEmail(agent);

    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    {
        orgName:       agent.orgName,
        agentCode:     agent.agentCode,
        portalToken:   agent.portalToken,
        pinBalance:    agent.pinBalance,
        packageStatus: agent.packageStatus,
        credentialsEmailSent: mail.sent,
        message:       mail.sent
          ? `Payment successful. Credentials emailed to ${mail.email}. ${ADAM_MAIL_INBOX_HINT} Copy them below as backup.`
          : 'Payment successful. Save your agen code and portal token — they are shown once.',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to complete registration.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

export default router;
