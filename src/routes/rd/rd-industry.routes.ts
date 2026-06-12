/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
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
import { z } from 'zod';
import { getTokenUser, requireAdamUser } from '../../middleware/auth.middleware';
import { ENV } from '../../config/environments';
import { assertRdIndustryAccess } from '../../rd-industry/rd-industry-access.service';
import {
  bindResearchSession,
  exportIndustryDeliverable,
  getOrCreateIndustryProject,
  getIndustryProjectForUser,
  saveIndustrySection,
  sealIndustryDeliverable,
  serializeProject,
} from '../../rd-industry/rd-industry-project.service';
import { listSectionTemplates } from '../../rd-industry/rd-industry-template';
import { streamADAMChat } from '../../adam/adam-chat.service';
import type { RdIndustryDeliverableType } from '../../rd-industry/rd-industry.types';
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';

const router = new Hono();

const DeliverableTypeSchema = z.enum([
  'TECHNICAL_WHITEPAPER',
  'IMPLEMENTATION_WHITEPAPER',
]);

const SaveSectionSchema = z.object({
  sectionKey: z.string().min(1),
  content:    z.string().max(500_000),
});

const ResearchChatSchema = z.object({
  sessionId:       z.string().optional(),
  message:         z.string().max(100_000).optional(),
  deliverable:     DeliverableTypeSchema.default('TECHNICAL_WHITEPAPER'),
  uploadIds:       z.array(z.string()).max(5).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or uploadIds.' },
);

router.get('/template', (c) => {
  const type = c.req.query('type') as RdIndustryDeliverableType | undefined;
  const deliverable = type === 'IMPLEMENTATION_WHITEPAPER'
    ? 'IMPLEMENTATION_WHITEPAPER'
    : 'TECHNICAL_WHITEPAPER';

  return c.json({
    success: true,
    deliverable,
    sections: listSectionTemplates(deliverable),
    charter: '/rd/charter/rd',
  });
});

router.get('/project', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  try {
    const access = await assertRdIndustryAccess(userId);
    const project = await getOrCreateIndustryProject(userId, access);
    return c.json({
      success: true,
      access: {
        sku:          access.subscription.sku,
        rdCategory:   access.subscription.rdCategory,
        periodEnd:    access.subscription.currentPeriodEnd,
      },
      project: serializeProject(project),
    });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.post('/project/initiate', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  try {
    const access = await assertRdIndustryAccess(userId);
    const project = await getOrCreateIndustryProject(userId, access);
    return c.json({ success: true, project: serializeProject(project) }, 201);
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 403);
  }
});

router.get('/project/:projectId', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  const projectId = c.req.param('projectId') ?? '';
  const project = await getIndustryProjectForUser(userId, projectId);
  if (!project) {
    return c.json({ success: false, error: 'Project not found.' }, 404);
  }
  return c.json({ success: true, project: serializeProject(project) });
});

router.get('/project/:projectId/section/:type/:sectionKey', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  const projectId = c.req.param('projectId') ?? '';
  const type = c.req.param('type') as RdIndustryDeliverableType;
  const sectionKey = c.req.param('sectionKey') ?? '';
  const project = await getIndustryProjectForUser(userId, projectId);
  if (!project) {
    return c.json({ success: false, error: 'Project not found.' }, 404);
  }

  const field = type === 'TECHNICAL_WHITEPAPER' ? 'technical' : 'implementation';
  const draft = project[field].sections?.[sectionKey];
  const content = typeof draft === 'object' && draft && 'content' in draft
    ? String((draft as { content: string }).content)
    : '';

  return c.json({
    success: true,
    sectionKey,
    content,
    status: project[field].status,
  });
});

router.post(
  '/project/:projectId/section/:type',
  requireAdamUser,
  zValidator('json', SaveSectionSchema),
  async (c) => {
    const userId = getTokenUser(c)!.userId;
    const type = c.req.param('type') as RdIndustryDeliverableType;
    const body = c.req.valid('json');

    try {
      await assertRdIndustryAccess(userId);
      const project = await saveIndustrySection({
        userId,
        projectId: c.req.param('projectId') ?? '',
        type,
        sectionKey: body.sectionKey,
        content:    body.content,
      });
      return c.json({ success: true, project: serializeProject(project) });
    } catch (err) {
      return c.json({ success: false, error: (err as Error).message }, 400);
    }
  },
);

router.post('/project/:projectId/seal/:type', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  const type = c.req.param('type') as RdIndustryDeliverableType;

  try {
    await assertRdIndustryAccess(userId);
    const result = await sealIndustryDeliverable({
      userId,
      projectId: c.req.param('projectId') ?? '',
      type,
    });
    return c.json({
      success: true,
      project: serializeProject(result.project),
      packId:  result.packId,
      message: result.packId
        ? `Technical Pack sealed. Pack ID: ${result.packId}`
        : 'Technical Whitepaper sealed. Continue with Implementation Whitepaper.',
    });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 400);
  }
});

router.get('/project/:projectId/export/:type', requireAdamUser, async (c) => {
  const userId = getTokenUser(c)!.userId;
  const type = c.req.param('type') as RdIndustryDeliverableType;
  const format = c.req.query('format') === 'docx' ? 'docx' : 'pdf';

  try {
    await assertRdIndustryAccess(userId);
    const compiled = await exportIndustryDeliverable({
      userId,
      projectId: c.req.param('projectId') ?? '',
      type,
      format,
    });
    return new Response(new Uint8Array(compiled.buffer), {
      headers: {
        'Content-Type':        compiled.mimeType,
        'Content-Disposition': `attachment; filename="${compiled.filename}"`,
      },
    });
  } catch (err) {
    return c.json({ success: false, error: (err as Error).message }, 400);
  }
});

router.post(
  '/research/chat',
  requireAdamUser,
  zValidator('json', ResearchChatSchema),
  async (c) => {
    const user = getTokenUser(c)!;
    const body = c.req.valid('json');

    let access;
    let project;
    try {
      access = await assertRdIndustryAccess(user.userId);
      project = await getOrCreateIndustryProject(user.userId, access);
    } catch (err) {
      return c.json({ success: false, error: (err as Error).message }, 403);
    }

    const sessionId = body.sessionId?.trim()
      || project.researchSessionId
      || `rd-industry-${project._id.toString()}`;

    if (!project.researchSessionId) {
      await bindResearchSession(user.userId, project._id.toString(), sessionId);
    }

    const message = body.message?.trim() ?? '';

    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');

    return stream(c, async (s) => {
      try {
        await withSseKeepalive(s, () =>
          streamADAMChat(
            sessionId,
            message,
            'RESEARCH',
            async (event, data) => { await s.write(`event: ${event}\ndata: ${data}\n\n`); },
            body.uploadIds ?? [],
            {
              userId:      user.userId,
              userName:    user.name ?? user.userId,
              role:        'student',
              sessionType: 'student',
            },
            {
              rdIndustryContext: {
                projectId:       project!._id.toString(),
                projectFocus:    project!.projectFocus,
                deliverable:     body.deliverable,
                packId:          project!.packId,
                technicalDocId:  project!.technical.documentId,
              },
            },
          ),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Research stream failed';
        await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
      }
      await s.write('event: adam_done\ndata: {}\n\n');
    });
  },
);

router.get('/health', (c) => c.json({
  success: true,
  module:  'rd-industry',
  kernel:  ENV.QXK24_KERNEL_VERSION,
}));

export default router;
