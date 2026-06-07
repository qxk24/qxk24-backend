/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Upload Routes
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * POST /api/adam/upload        — Founder or student upload (UPLOAD_MAX_FILE_MB)
 * GET  /api/adam/upload/:id    — Upload metadata (no raw file download)
 */

import { Hono } from 'hono';
import {
  getTokenUser,
  requireAdamUser,
} from '../../middleware/auth.middleware';
import {
  assertFileWithinLimit,
  UPLOAD_MAX_MB,
} from '../../middleware/upload-limit.middleware';
import { uploadRateLimit } from '../../middleware/upload-rate-limit.middleware';
import { getMultipartUploadFile } from '../../adam/adam-file-extract.service';
import {
  canAccessTeachingUpload,
  getTeachingUpload,
  resolveFounderUploaderId,
  saveTeachingUpload,
} from '../../adam/adam-upload.service';
import { ENV } from '../../config/environments';
import type { ADAMApiResponse, ADAMTeachingUpload } from '../../adam/adam.types';

const router = new Hono();

// POST /api/adam/upload
router.post('/', requireAdamUser, uploadRateLimit, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const isFounder = user.role === 'founder' || user.isFounder;
    const uploaderRole: 'founder' | 'student' = isFounder ? 'founder' : 'student';

    const body = await c.req.parseBody();
    const rawFile = getMultipartUploadFile(body as Record<string, unknown>, 'file');

    if (!rawFile) {
      return c.json({
        success: false,
        error:   'No file provided. Use field name "file".',
        kernel:  'ALAMTOLOGI',
      }, 400);
    }

    const sizeCheck = assertFileWithinLimit(rawFile, 'file');
    if (!sizeCheck.ok) {
      return c.json({
        success: false,
        error:   sizeCheck.error,
        kernel:  'ALAMTOLOGI',
        limit:   { maxMb: UPLOAD_MAX_MB },
      }, 413);
    }

    const sessionId =
      typeof body['sessionId'] === 'string' && body['sessionId'].trim()
        ? body['sessionId'].trim()
        : undefined;

    const uploadedBy = isFounder
      ? resolveFounderUploaderId(user.userId)
      : user.userId;

    console.log(
      `[adam:upload] start name=${rawFile.name} bytes=${rawFile.size} role=${uploaderRole}`,
    );

    const upload = await saveTeachingUpload(rawFile, {
      sessionId,
      uploadedBy,
      uploaderRole,
      uploaderName: user.name ?? user.userId,
    });

    console.log(
      `[adam:upload] ok id=${upload.id} name=${upload.fileName} bytes=${upload.sizeBytes}`,
    );

    const response: ADAMApiResponse<{
      upload: Pick<
        ADAMTeachingUpload,
        'id' | 'fileName' | 'mimeType' | 'sizeBytes' | 'textTruncated' | 'uploadedAt'
      > & { preview: string; sessionId?: string };
    }> = {
      success:   true,
      kernel:    'ALAMTOLOGI',
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
    console.warn(
      `[adam:upload] fail ${message}`,
    );
    return c.json({
      success: false,
      error:   message,
      kernel:  'ALAMTOLOGI',
      timestamp: new Date().toISOString(),
    }, 400);
  }
});

// GET /api/adam/upload/:id
router.get('/:id', requireAdamUser, async (c) => {
  const user = getTokenUser(c)!;
  const id = c.req.param('id')!;
  const upload = await getTeachingUpload(id);

  if (!upload) {
    return c.json({
      success: false,
      error:   'Upload not found.',
      kernel:  'ALAMTOLOGI',
    }, 404);
  }

  const requesterRole: 'founder' | 'student' =
    user.role === 'founder' || user.isFounder ? 'founder' : 'student';

  if (!canAccessTeachingUpload(upload, { userId: user.userId, role: requesterRole })) {
    return c.json({
      success: false,
      error:   'Access denied.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  return c.json({
    success:   true,
    kernel:    'ALAMTOLOGI',
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
