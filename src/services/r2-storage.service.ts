/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Cloudflare R2 Storage Service
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

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ENV } from '../config/environments';

function assertR2Configured(): void {
  if (!ENV.CLOUDFLARE_ACCOUNT_ID || !ENV.R2_ACCESS_KEY_ID || !ENV.R2_SECRET_ACCESS_KEY) {
    throw new Error(
      'R2 storage is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.',
    );
  }
}

function createR2Client(): S3Client {
  assertR2Configured();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${ENV.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     ENV.R2_ACCESS_KEY_ID,
      secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
    },
  });
}

let r2Client: S3Client | null = null;

function getClient(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  return r2Client;
}

export const r2StorageService = {

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    await getClient().send(new PutObjectCommand({
      Bucket:      ENV.R2_BUCKET_NAME,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
      Metadata:    metadata,
    }));
    return key;
  },

  async deleteFile(key: string): Promise<void> {
    await getClient().send(new DeleteObjectCommand({
      Bucket: ENV.R2_BUCKET_NAME,
      Key:    key,
    }));
  },

  async getFile(key: string): Promise<Buffer> {
    const response = await getClient().send(new GetObjectCommand({
      Bucket: ENV.R2_BUCKET_NAME,
      Key:    key,
    }));

    if (!response.Body) {
      throw new Error(`R2 object empty or missing: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  },

  getObjectKey(filename: string, category: string): string {
    const date = new Date().toISOString().split('T')[0];
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `knowledge/${category.toLowerCase()}/${date}/${Date.now()}_${safe}`;
  },
};
