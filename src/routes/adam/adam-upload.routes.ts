/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Teaching Upload Routes
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
 * POST /api/adam/upload        — Founder uploads teaching file (max 30MB)
 * GET  /api/adam/upload/:id    — Upload metadata (no raw file download)
 */

import { Hono } from 'hono';
import { requireFounder } from '../../middleware/auth.middleware';
import {
  assertFileWithinLimit,
  UPLOAD_MAX_MB,
} from '../../middleware/upload-limit.middleware';
import { getMultipartUploadFile } from '../../adam/adam-file-extract.service';
import {
  getTeachingUpload,
  saveTeachingUpload,
} from '../../adam/adam-upload.service';
import { ENV } from '../../config/environments';
import type { ADAMApiResponse, ADAMTeachingUpload } from '../../adam/adam.types';

const router = new Hono();

// POST /api/adam/upload
router.post('/', requireFounder, async (c) => {
  try {
    const body = await c.req.parseBody();
    const rawFile = getMultipartUploadFile(body as Record<string, unknown>, 'file');

    if (!rawFile) {
      return c.json({
        success: false,
        error:   'No file provided. Use field name "file".',
        kernel:  'QXK24',
      }, 400);
    }

    const sizeCheck = assertFileWithinLimit(rawFile, 'file');
    if (!sizeCheck.ok) {
      return c.json({
        success: false,
        error:   sizeCheck.error,
        kernel:  'QXK24',
        limit:   { maxMb: UPLOAD_MAX_MB },
      }, 413);
    }

    const sessionId =
      typeof body['sessionId'] === 'string' && body['sessionId'].trim()
        ? body['sessionId'].trim()
        : undefined;

    const upload = await saveTeachingUpload(rawFile, sessionId);

    const response: ADAMApiResponse<{
      upload: Pick<
        ADAMTeachingUpload,
        'id' | 'fileName' | 'mimeType' | 'sizeBytes' | 'textTruncated' | 'uploadedAt'
      > & { preview: string; sessionId?: string };
    }> = {
      success:   true,
      kernel:    'QXK24',
      version:   ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
      data: {
        upload: {
          id:            upload.id,
          sessionId:     upload.sessionId,
          fileName:      upload.fileName,
          mimeType:      upload.mimeType,
          sizeBytes:     upload.sizeBytes,
          textTruncated: upload.textTruncated,
          uploadedAt:    upload.uploadedAt,
          preview:       upload.preview,
        },
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return c.json({
      success: false,
      error:   message,
      kernel:  'QXK24',
      timestamp: new Date().toISOString(),
    }, 400);
  }
});

// GET /api/adam/upload/:id
router.get('/:id', requireFounder, async (c) => {
  const id = c.req.param('id')!;
  const upload = await getTeachingUpload(id);

  if (!upload) {
    return c.json({
      success: false,
      error:   'Upload not found.',
      kernel:  'QXK24',
    }, 404);
  }

  return c.json({
    success:   true,
    kernel:    'QXK24',
    version:   ENV.QXK24_KERNEL_VERSION,
    era:       ENV.QXK24_ERA,
    data: {
      upload: {
        id:            upload.id,
        sessionId:     upload.sessionId,
        fileName:      upload.fileName,
        mimeType:      upload.mimeType,
        sizeBytes:     upload.sizeBytes,
        textTruncated: upload.textTruncated,
        uploadedAt:    upload.uploadedAt,
        preview:       upload.extractedText.slice(0, 280),
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
