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
import { canUseMacBridge } from '../adam/adam-mac-bridge-access.service';
import { getTokenUser, requireAuth } from '../middleware/auth.middleware';
import {
  completeMacBridgeJob,
  getMacBridgeStatus,
  heartbeatMacBridge,
  registerMacBridge,
  waitForMacBridgeJob,
} from './mac-bridge.store';

const router = new Hono();

async function requireMacBridgeServerEnabled(c: Context, next: Next): Promise<Response | void> {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) {
    return c.json({ error: 'ADAM Mac bridge is not enabled on this server.' }, 403);
  }
  await next();
}

async function requireMacBridgeParticipant(c: Context, next: Next): Promise<Response | void> {
  const user = getTokenUser(c);
  if (!user) {
    return c.json({ error: 'Authorization required.' }, 401);
  }
  if (!(await canUseMacBridge(user))) {
    return c.json({ error: 'Mac bridge requires Founder or Profesional access.' }, 403);
  }
  await next();
}

router.use('*', requireAuth, requireMacBridgeServerEnabled, requireMacBridgeParticipant);

router.get('/status', (c) => {
  const user = getTokenUser(c)!;
  return c.json(getMacBridgeStatus(user.userId));
});

router.post('/heartbeat', (c) => {
  const user = getTokenUser(c)!;
  heartbeatMacBridge(user.userId);
  return c.json({ ok: true });
});

router.post('/register', async (c) => {
  const user = getTokenUser(c)!;
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

  const reg = registerMacBridge(user.userId, {
    machineName: body.machineName?.trim() || 'local-computer',
    macRoot:     body.macRoot?.trim() || '',
    qxk24Root:   body.qxk24Root?.trim() || '',
    tools:       Array.isArray(body.tools) ? body.tools : [],
  });

  return c.json({ ok: true, registration: reg });
});

router.get('/poll', async (c) => {
  const user = getTokenUser(c)!;
  const job = await waitForMacBridgeJob(user.userId);
  if (!job) {
    return c.json({ job: null });
  }
  return c.json({ job });
});

router.post('/result', async (c) => {
  const user = getTokenUser(c)!;
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
    user.userId,
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
