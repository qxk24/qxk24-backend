/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Knowledge Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * POST /api/adam/knowledge/upload  — Absorb teaching into QXK24Brain (no R2)
 * GET  /api/adam/knowledge           — List constitutional absorptions
 * POST /api/adam/knowledge/purge-legacy — Force legacy R2 erasure
 */

import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { requireFounder } from '../../middleware/auth.middleware';
import { assertFileWithinLimit } from '../../middleware/upload-limit.middleware';
import { adamKnowledgeService } from '../../adam/adam-knowledge.service';
import {
  getMultipartUploadFile,
  isSupportedFounderFile,
  normalizeFounderFile,
  supportedFormatsLabel,
} from '../../adam/adam-file-extract.service';
import { ENV } from '../../config/environments';

const router = new Hono();

router.use('*', bodyLimit({
  maxSize: ENV.UPLOAD_MAX_FILE_BYTES,
  onError: (c) => c.json({
    success: false,
    error:   `File too large. Maximum ${ENV.UPLOAD_MAX_FILE_MB} MB.`,
    kernel:  'QXK24',
  }, 413),
}));

// POST /api/adam/knowledge/upload — AIDIL absorption (no permanent storage)
router.post('/upload', requireFounder, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = getMultipartUploadFile(body as Record<string, unknown>, 'file');
    const category = typeof body['category'] === 'string' ? body['category'] : 'GENERAL';
    const description = typeof body['description'] === 'string' ? body['description'] : '';

    if (!file) {
      return c.json({
        success: false,
        error:   'No file provided. Use field name "file".',
        kernel:  'QXK24',
      }, 400);
    }

    const sizeCheck = assertFileWithinLimit(file, 'file');
    if (!sizeCheck.ok) {
      return c.json({
        success: false,
        error:   sizeCheck.error,
        kernel:  'QXK24',
      }, 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isSupportedFounderFile(file.type, file.name, buffer)) {
      return c.json({
        success: false,
        error:   `File type not supported. Use ${supportedFormatsLabel()} (max ${ENV.UPLOAD_MAX_FILE_MB} MB).`,
        kernel:  'QXK24',
      }, 400);
    }

    const normalized = normalizeFounderFile(buffer, file.type, file.name);
    const absorption = await adamKnowledgeService.absorbTeaching(
      file,
      category,
      description,
      buffer,
      normalized,
    );

    return c.json({
      success:   true,
      absorption,
      message:   'Teaching absorbed into QXK24Brain. Raw file erased per AIDIL — energy lives in C.',
      kernel:    'QXK24',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (err: unknown) {
    console.error('[QXK24] Knowledge absorption error:', err);
    const message = err instanceof Error ? err.message : 'Absorption failed.';
    return c.json({
      success: false,
      error:   message,
      kernel:  'QXK24',
    }, 500);
  }
});

// GET /api/adam/knowledge — constitutional absorption log (not stored files)
router.get('/', requireFounder, async (c) => {
  try {
    const absorptions = await adamKnowledgeService.listAbsorptions();
    return c.json({
      success:     true,
      absorptions,
      total:       absorptions.length,
      storageMode: 'AIDIL — no raw files retained',
      kernel:      'QXK24',
      version:     ENV.QXK24_KERNEL_VERSION,
      era:         ENV.QXK24_ERA,
      timestamp:   new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[QXK24] Knowledge list error:', err);
    return c.json({
      success: false,
      error:   'Failed to load absorptions.',
      kernel:  'QXK24',
    }, 500);
  }
});

// POST /api/adam/knowledge/purge-legacy — force legacy R2 + DB erasure
router.post('/purge-legacy', requireFounder, async (c) => {
  try {
    const result = await adamKnowledgeService.purgeLegacyStorage();
    return c.json({
      success:   true,
      ...result,
      message:   'Legacy raw storage purged. Energy absorbed into QXK24Brain where possible.',
      kernel:    'QXK24',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Purge failed.';
    return c.json({
      success: false,
      error:   message,
      kernel:  'QXK24',
    }, 500);
  }
});

export default router;
