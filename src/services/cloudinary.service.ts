/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Cloudinary Upload Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';

export interface CloudinaryUploadResult {
  url:                string;
  secureUrl:          string;
  publicId:           string;
  bytes:              number;
  mimeType:           string;
  resourceType:       'image' | 'video' | 'raw';
}

function assertCloudinaryConfigured(): void {
  if (!ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  }
}

function signUploadParams(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHash('sha1')
    .update(sorted + ENV.CLOUDINARY_API_SECRET)
    .digest('hex');
}

export async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'video',
): Promise<CloudinaryUploadResult> {
  assertCloudinaryConfigured();

  const timestamp = String(Math.round(Date.now() / 1000));
  const folder = ENV.CLOUDINARY_BLOG_FOLDER;
  const params: Record<string, string> = {
    folder,
    timestamp,
  };

  const signature = signUploadParams(params);
  const buffer = Buffer.from(await file.arrayBuffer());

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: file.type || 'application/octet-stream' }), file.name);
  form.append('api_key', ENV.CLOUDINARY_API_KEY);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
  const response = await fetch(endpoint, { method: 'POST', body: form });

  const data = await response.json() as {
    error?: { message?: string };
    secure_url?: string;
    url?: string;
    public_id?: string;
    bytes?: number;
    resource_type?: string;
  };

  if (!response.ok || !data.secure_url) {
    const msg = data.error?.message ?? `Cloudinary upload failed (${response.status})`;
    throw new Error(msg);
  }

  return {
    url:          data.url ?? data.secure_url,
    secureUrl:    data.secure_url,
    publicId:     data.public_id ?? '',
    bytes:        data.bytes ?? file.size,
    mimeType:     file.type || 'application/octet-stream',
    resourceType: (data.resource_type === 'video' ? 'video' : 'image') as 'image' | 'video',
  };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    ENV.CLOUDINARY_CLOUD_NAME &&
    ENV.CLOUDINARY_API_KEY &&
    ENV.CLOUDINARY_API_SECRET,
  );
}
