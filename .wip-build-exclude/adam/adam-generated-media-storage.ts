/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Generated Media Storage
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

import { randomUUID } from 'crypto';
import { ENV } from '../config/environments';
import { r2StorageService } from '../services/r2-storage.service';

export function buildAdamGeneratedMediaPublicUrl(storageKey: string): string {
  const publicBase = (ENV.R2_PUBLIC_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (publicBase) {
    return `${publicBase}/${storageKey}`;
  }
  const appBase = ENV.APP_BASE_URL.replace(/\/$/, '');
  return `${appBase}/api/adam/media/generated?key=${encodeURIComponent(storageKey)}`;
}

export async function storeAdamGeneratedImage(input: {
  buffer:    Buffer;
  sessionId: string;
  mimeType?: string;
}): Promise<string | null> {
  const mime = input.mimeType ?? 'image/png';
  const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
  const key = `adam/generated/${input.sessionId}/${randomUUID()}.${ext}`;

  try {
    await r2StorageService.uploadFile(key, input.buffer, mime, {
      generatedBy: 'adam',
      sessionId:   input.sessionId,
    });
    return buildAdamGeneratedMediaPublicUrl(key);
  } catch (err) {
    console.warn('[adam:media-storage] R2 upload failed — serving unavailable', err);
    return null;
  }
}

export async function storeAdamGeneratedVideo(input: {
  buffer:    Buffer;
  sessionId: string;
  mimeType?: string;
}): Promise<string | null> {
  const mime = input.mimeType ?? 'video/mp4';
  const ext = mime.includes('webm') ? 'webm' : 'mp4';
  const key = `adam/generated/${input.sessionId}/${randomUUID()}.${ext}`;

  try {
    await r2StorageService.uploadFile(key, input.buffer, mime, {
      generatedBy: 'adam',
      sessionId:   input.sessionId,
      mediaKind:   'video',
    });
    return buildAdamGeneratedMediaPublicUrl(key);
  } catch (err) {
    console.warn('[adam:media-storage] R2 video upload failed', err);
    return null;
  }
}

function contentTypeFromGeneratedKey(key: string): string {
  if (key.endsWith('.mp4')) return 'video/mp4';
  if (key.endsWith('.webm')) return 'video/webm';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  if (key.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

export async function readAdamGeneratedMedia(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const buffer = await r2StorageService.getFile(key);
    return { buffer, contentType: contentTypeFromGeneratedKey(key) };
  } catch {
    return null;
  }
}
