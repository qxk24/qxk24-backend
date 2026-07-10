/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Export Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
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
import { compileAdamDocument } from '../../adam/adam-document-export.service';
import { getTokenUser, requireAuth } from '../../middleware/auth.middleware';

const router = new Hono();

const ExportSchema = z.object({
  content: z.string().min(1).max(100_000),
  format:  z.enum(['pdf', 'docx']),
  title:   z.string().max(120).optional(),
});

router.post('/document', requireAuth, zValidator('json', ExportSchema), async (c) => {
  try {
    const user = getTokenUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized.' }, 401);
    }

    const body = c.req.valid('json');
    const compiled = await compileAdamDocument({
      content: body.content,
      format:  body.format,
      title:   body.title,
      author:  user.name ?? user.userId,
    });

    return new Response(compiled.buffer, {
      status: 200,
      headers: {
        'Content-Type':        compiled.mimeType,
        'Content-Disposition': `attachment; filename="${compiled.filename}"`,
        'Cache-Control':       'no-store',
      },
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
