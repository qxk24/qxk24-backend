/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Builder Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { stream } from 'hono/streaming';
import { ENV } from '../config/environments';
import { getTokenUser, requireFounder } from '../middleware/auth.middleware';
import { withSseKeepalive } from '../adam/adam-sse-keepalive';
import { adamBuilderAgent } from './adam-builder-agent.service';
import type { AgentEvent } from './adam-builder.types';
import {
  abortBuilderSession,
  createBuilderAbortController,
  releaseBuilderAbort,
} from './adam-builder-abort.store';
import { getHawaHold, isHawaHeld } from '../hawa/hawa-hold.store';
import { isHawaEnabled } from '../hawa/hawa-audit.service';

const router = new Hono();

async function requireBuilderEnabled(c: Context, next: Next): Promise<Response | void> {
  if (!ENV.ADAM_BUILDER_ENABLED) {
    return c.json({ error: 'ADAM Builder is not enabled on this server.' }, 403);
  }
  await next();
}

function founderToken(c: Context): string {
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return '';
}

async function streamAgentEvents(
  s: { write: (chunk: string) => Promise<unknown> },
  generator: AsyncGenerator<AgentEvent>,
): Promise<void> {
  for await (const event of generator) {
    if (event.type === 'heartbeat') continue;

    await s.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    if (
      event.type === 'approval_needed'
      || event.type === 'hawa_veto'
      || event.type === 'complete'
      || event.type === 'error'
    ) {
      break;
    }
  }
}

router.use('*', requireFounder, requireBuilderEnabled);

router.post('/build', async (c) => {
  const body = await c.req.json<{ instruction?: string; sessionId?: string }>();
  const instruction = body.instruction?.trim();
  const sessionId = body.sessionId?.trim() || `session_${Date.now()}`;

  if (!instruction) {
    return c.json({ error: 'instruction is required.' }, 400);
  }

  const token = founderToken(c);
  const user = getTokenUser(c)!;
  const abortController = createBuilderAbortController(sessionId);

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await withSseKeepalive(s, async () => {
        const generator = adamBuilderAgent.runBuildSession(
          instruction,
          sessionId,
          token,
          user.userId,
          true,
          abortController.signal,
        );
        await streamAgentEvents(s, generator);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Build session failed.';
      await s.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      releaseBuilderAbort(sessionId);
    }
  });
});

router.post('/resume-hawa', async (c) => {
  const body = await c.req.json<{ sessionId?: string; note?: string }>();
  const sessionId = body.sessionId?.trim();
  if (!sessionId) return c.json({ error: 'sessionId is required.' }, 400);

  if (!isHawaEnabled()) {
    return c.json({ error: 'HAWA is not enabled on this stack.' }, 403);
  }

  if (!isHawaHeld(sessionId)) {
    return c.json({ error: 'No HAWA hold on this session.' }, 400);
  }

  const token = founderToken(c);
  const user = getTokenUser(c)!;
  const note = body.note?.trim()
    ?? 'Founder overrides HAWA hold. ADAM may continue with corrections applied.';

  const abortController = createBuilderAbortController(sessionId);

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await withSseKeepalive(s, async () => {
        const generator = adamBuilderAgent.resumeBuildSession(
          sessionId,
          token,
          note,
          user.userId,
          true,
          abortController.signal,
          true,
        );
        await streamAgentEvents(s, generator);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'HAWA resume failed.';
      await s.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      releaseBuilderAbort(sessionId);
    }
  });
});

router.post('/continue', async (c) => {
  const body = await c.req.json<{ sessionId?: string; note?: string }>();
  const sessionId = body.sessionId?.trim();
  if (!sessionId) return c.json({ error: 'sessionId is required.' }, 400);

  const token = founderToken(c);
  const user = getTokenUser(c)!;
  const note = body.note?.trim()
    ?? 'Founder approved the write. Continue with check_typescript and remaining build steps.';

  const abortController = createBuilderAbortController(sessionId);

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      await withSseKeepalive(s, async () => {
        const generator = adamBuilderAgent.resumeBuildSession(
          sessionId,
          token,
          note,
          user.userId,
          true,
          abortController.signal,
        );
        await streamAgentEvents(s, generator);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Resume failed.';
      await s.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      releaseBuilderAbort(sessionId);
    }
  });
});

router.post('/stop', async (c) => {
  const body = await c.req.json<{ sessionId?: string }>();
  const sessionId = body.sessionId?.trim();
  if (!sessionId) return c.json({ error: 'sessionId is required.' }, 400);

  const stopped = abortBuilderSession(sessionId);
  return c.json({
    stopped,
    sessionId,
    reason: stopped ? undefined : 'Session not found or already complete',
  });
});

router.post('/approve', async (c) => {
  const body = await c.req.json<{ proposalId?: string }>();
  const proposalId = body.proposalId?.trim();
  if (!proposalId) return c.json({ error: 'proposalId is required.' }, 400);

  const token = founderToken(c);
  const result = await adamBuilderAgent.callTool('approve_write', { id: proposalId }, token);
  return c.json({ success: true, result });
});

router.post('/reject', async (c) => {
  const body = await c.req.json<{ proposalId?: string; feedback?: string }>();
  const proposalId = body.proposalId?.trim();
  if (!proposalId) return c.json({ error: 'proposalId is required.' }, 400);

  const token = founderToken(c);
  await adamBuilderAgent.callTool(
    'reject_write',
    { id: proposalId, feedback: body.feedback ?? 'Rejected by founder' },
    token,
  );
  return c.json({ success: true });
});

router.get('/queue', async (c) => {
  const token = founderToken(c);
  const result = await adamBuilderAgent.callTool(
    'list_features',
    { status: 'all', priority: 'all', limit: 50 },
    token,
  );
  return c.json({ queue: result });
});

router.get('/next', async (c) => {
  const token = founderToken(c);
  const result = await adamBuilderAgent.callTool('get_next_feature', {}, token);
  return c.json({ next: result });
});

router.get('/status', (c) => {
  const user = getTokenUser(c);
  return c.json({
    enabled:   ENV.ADAM_BUILDER_ENABLED,
    hawa:      isHawaEnabled(),
    stack:     ENV.QXK24_STACK,
    model:     ENV.QWEN_MODEL_DEEP,
    mcpPath:   ENV.ADAM_BUILDER_MCP_PATH || '(from QXK24_ROOT)',
    founderId: user?.userId ?? null,
  });
});

router.get('/hawa-hold/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId')?.trim();
  if (!sessionId) return c.json({ error: 'sessionId is required.' }, 400);
  const hold = getHawaHold(sessionId);
  return c.json({ held: Boolean(hold), hold: hold ?? null });
});

export default router;
