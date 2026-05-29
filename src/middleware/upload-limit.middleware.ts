/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Upload / Body Size Limit Middleware
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
 */

import { bodyLimit } from 'hono/body-limit';
import type { Context } from 'hono';
import { ENV } from '../config/environments';

export const UPLOAD_MAX_BYTES = ENV.UPLOAD_MAX_FILE_BYTES;
export const UPLOAD_MAX_MB    = ENV.UPLOAD_MAX_FILE_MB;

function onBodyTooLarge(c: Context) {
  return c.json({
    success: false,
    error:   `Request body exceeds the maximum upload size of ${UPLOAD_MAX_MB}MB.`,
    kernel:  'QXK24',
    limit: {
      maxBytes: UPLOAD_MAX_BYTES,
      maxMb:    UPLOAD_MAX_MB,
    },
    timestamp: new Date().toISOString(),
  }, 413);
}

/** Global request body cap (JSON, multipart file uploads, etc.) */
export const uploadBodyLimit = bodyLimit({
  maxSize: UPLOAD_MAX_BYTES,
  onError: onBodyTooLarge,
});

/**
 * Validate a single uploaded File against the constitutional size limit.
 * Use after c.req.parseBody() on upload routes.
 */
export function assertFileWithinLimit(
  file: File,
  fieldName = 'file',
): { ok: true } | { ok: false; error: string; sizeBytes: number } {
  if (file.size > UPLOAD_MAX_BYTES) {
    return {
      ok:        false,
      error:     `File "${fieldName}" exceeds the maximum upload size of ${UPLOAD_MAX_MB}MB.`,
      sizeBytes: file.size,
    };
  }
  return { ok: true };
}
