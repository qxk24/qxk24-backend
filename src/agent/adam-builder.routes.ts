/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Builder Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { stream } from 'hono/streaming';
import { ENV } from '../config/environments';
import { getTokenUser, requireFounder } from '../middleware/auth.middleware';
import { adamBuilderAgent } from './adam-builder-agent.service';
import type { AgentEvent } from './adam-builder.types';

const router = new Hono();

async function requireLabStack(c: Context, next: Next): Promise<Response | void> {
  if (ENV.QXK24_STACK !== 'lab') {
    return c.json({ error: 'ADAM Builder runs on the lab stack only.' }, 403);
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
    await s.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    if (
      event.type === 'approval_needed'
      || event.type === 'complete'
      || event.type === 'error'
    ) {
      break;
    }
  }
}

router.use('*', requireFounder, requireLabStack);

router.post('/build', async (c) => {
  const body = await c.req.json<{ instruction?: string; sessionId?: string }>();
  const instruction = body.instruction?.trim();
  const sessionId = body.sessionId?.trim() || `session_${Date.now()}`;

  if (!instruction) {
    return c.json({ error: 'instruction is required.' }, 400);
  }

  const token = founderToken(c);

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      const generator = adamBuilderAgent.runBuildSession(instruction, sessionId, token);
      await streamAgentEvents(s, generator);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Build session failed.';
      await s.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message })}\n\n`);
    }
  });
});

router.post('/continue', async (c) => {
  const body = await c.req.json<{ sessionId?: string; note?: string }>();
  const sessionId = body.sessionId?.trim();
  if (!sessionId) return c.json({ error: 'sessionId is required.' }, 400);

  const token = founderToken(c);
  const note = body.note?.trim()
    ?? 'Founder approved the write. Continue with check_typescript and remaining build steps.';

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return stream(c, async (s) => {
    try {
      const generator = adamBuilderAgent.resumeBuildSession(sessionId, token, note);
      await streamAgentEvents(s, generator);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Resume failed.';
      await s.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message })}\n\n`);
    }
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
    stack:     ENV.QXK24_STACK,
    model:     ENV.QWEN_MODEL_DEEP,
    mcpPath:   ENV.ADAM_BUILDER_MCP_PATH || '(from QXK24_ROOT)',
    founderId: user?.userId ?? null,
  });
});

export default router;
