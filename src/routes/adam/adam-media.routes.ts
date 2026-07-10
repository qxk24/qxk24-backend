/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { readAdamGeneratedMedia } from '../../adam/adam-generated-media-storage';

const router = new Hono();

// GET /api/adam/media/generated?key=adam/generated/...
router.get('/generated', async (c) => {
  try {
    const raw = c.req.query('key') ?? '';
    const key = decodeURIComponent(raw);
    if (!key.startsWith('adam/generated/') || key.includes('..')) {
      return c.json({ success: false, error: 'Invalid media key.' }, 400);
    }

    const asset = await readAdamGeneratedMedia(key);
    if (!asset) {
      return c.notFound();
    }

    return new Response(asset.buffer, {
      headers: {
        'Content-Type':                asset.contentType,
        'Cache-Control':               'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
