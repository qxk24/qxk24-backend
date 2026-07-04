/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tools — Docs Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { withSseKeepalive } from '../../../adam/adam-sse-keepalive';
import { getTokenUser, requireStudent } from '../../../middleware/auth.middleware';
import {
  requireCoachingSubscription,
  rejectNiagaLaneOnly,
  getSubscriptionAccess,
  getCoachingSubscriptionAccess,
} from '../../../middleware/subscription-guard.middleware';
import { resolveCoachingSubscriptionAccess } from '../../../adam/adam-coaching-subscription.service';
import {
  buildFreemiumStatusPayloadForUser,
  isFreemiumEnabled,
  runStudentFreemiumPreCheck,
  streamFreemiumBlockedTurn,
} from '../../../freemium/adam-freemium-gate.service';
import {
  runLayerGatePreCheck,
  streamLayerGateBlockedTurn,
} from '../../../adam-servers/adam-layer-gate.service';
import {
  streamADAMChat,
  resolveToolsChatSession,
} from '../../../adam/adam-chat.service';
import {
  buildAdamDocsUserMessage,
  listAdamDocsTasksPublic,
  validateAdamDocsInput,
  type AdamDocsTaskId,
} from '../../../adam/adam-tools-docs-law';
import { DocsGenerateSchema } from './adam-student.schemas';

const router = new Hono();

router.use('/tools/*', requireStudent, rejectNiagaLaneOnly);

/** Reuse coaching freemium gate for Tools MVP (same consumer Basic/Pro pool). */
router.get('/tools/docs/tasks', requireStudent, async (c) => {
  return c.json({
    success: true,
    app:     'docs',
    mode:    'TOOLS',
    tasks:   listAdamDocsTasksPublic(),
    kernel:  'ALAMTOLOGI',
  });
});

router.get('/tools/docs/subscription', requireStudent, async (c) => {
  const user = getTokenUser(c)!;
  const access = await resolveCoachingSubscriptionAccess(user.userId);
  return c.json({
    success:         true,
    billingEnforced: false,
    ...access,
    kernel:          'ALAMTOLOGI',
  });
});

router.post(
  '/tools/docs/generate',
  requireStudent,
  requireCoachingSubscription,
  zValidator('json', DocsGenerateSchema),
  async (c) => {
    const user = getTokenUser(c)!;
    const body = c.req.valid('json');
    const access = getSubscriptionAccess(c);
    const coachingAccess = getCoachingSubscriptionAccess(c);

    const taskId = body.taskId as AdamDocsTaskId;
    const validationError = validateAdamDocsInput({
      taskId,
      brief:      body.brief,
      sourceText: body.sourceText,
    });
    if (validationError) {
      return c.json({ success: false, error: validationError, kernel: 'ALAMTOLOGI' }, 400);
    }

    const message = buildAdamDocsUserMessage({
      taskId,
      brief:      body.brief,
      sourceText: body.sourceText,
    });

    let sessionId = body.sessionId?.trim();
    if (!sessionId) {
      sessionId = await resolveToolsChatSession(user.userId);
    }

    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');

    return stream(c, async (s) => {
      try {
        const runFreemium = isFreemiumEnabled() && Boolean(coachingAccess?.freemium);

        const [freemium, layerGate] = await Promise.all([
          runFreemium
            ? runStudentFreemiumPreCheck(user.userId, access)
            : Promise.resolve(null),
          runLayerGatePreCheck({
            userId:    user.userId,
            message,
            mode:      'TOOLS',
            isFounder: false,
            userName:  user.name ?? user.userId,
          }),
        ]);

        if (freemium) {
          if (!freemium.canContinue) {
            await streamFreemiumBlockedTurn(s, sessionId!, freemium);
            return;
          }

          await s.write(
            `event: freemium_status\ndata: ${JSON.stringify(
              await buildFreemiumStatusPayloadForUser(user.userId, freemium),
            )}\n\n`,
          );
        }

        if (layerGate && !layerGate.allowed) {
          await streamLayerGateBlockedTurn(s, sessionId!, layerGate);
          return;
        }

        await s.write(
          `event: docs_meta\ndata: ${JSON.stringify({
            sessionId,
            taskId,
            app: 'docs',
          })}\n\n`,
        );

        await withSseKeepalive(s, () =>
          streamADAMChat(
            sessionId!,
            message,
            'TOOLS',
            async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
            [],
            {
              userId:      user.userId,
              userName:    user.name ?? user.userId,
              role:        'student',
              sessionType: 'tools',
            },
            { docsTaskId: taskId },
          ),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ADAM Docs generate failed';
        await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
      }
      await s.write('event: adam_done\ndata: {}\n\n');
    });
  },
);

export default router;
