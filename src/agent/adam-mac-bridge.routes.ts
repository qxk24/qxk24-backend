/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mac Bridge Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { ENV } from '../config/environments';
import { requireFounder } from '../middleware/auth.middleware';
import {
  completeMacBridgeJob,
  getMacBridgeStatus,
  heartbeatMacBridge,
  registerMacBridge,
  waitForMacBridgeJob,
} from './mac-bridge.store';

const router = new Hono();

async function requireMacBridgeEnabled(c: Context, next: Next): Promise<Response | void> {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) {
    return c.json({ error: 'ADAM Mac bridge is not enabled on this server.' }, 403);
  }
  await next();
}

router.use('*', requireFounder, requireMacBridgeEnabled);

router.get('/status', (c) => c.json(getMacBridgeStatus()));

router.post('/heartbeat', (c) => {
  heartbeatMacBridge();
  return c.json({ ok: true });
});

router.post('/register', async (c) => {
  const body = await c.req.json<{
    machineName?: string;
    macRoot?:     string;
    qxk24Root?:   string;
    tools?:       Array<{
      name:         string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }>;
  }>();

  const reg = registerMacBridge({
    machineName: body.machineName?.trim() || 'MacBook',
    macRoot:     body.macRoot?.trim() || '',
    qxk24Root:   body.qxk24Root?.trim() || '',
    tools:       Array.isArray(body.tools) ? body.tools : [],
  });

  return c.json({ ok: true, registration: reg });
});

router.get('/poll', async (c) => {
  const job = await waitForMacBridgeJob();
  if (!job) {
    return c.json({ job: null });
  }
  return c.json({ job });
});

router.post('/result', async (c) => {
  const body = await c.req.json<{
    callId?:     string;
    resultText?: string;
    isError?:    boolean;
  }>();

  const callId = body.callId?.trim();
  if (!callId) {
    return c.json({ error: 'callId is required.' }, 400);
  }

  const ok = completeMacBridgeJob(
    callId,
    body.resultText ?? '',
    body.isError === true,
  );

  if (!ok) {
    return c.json({ error: 'Unknown or expired callId.' }, 404);
  }

  return c.json({ ok: true });
});

export default router;
