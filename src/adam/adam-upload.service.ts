/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Teaching Upload Service
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

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/environments';
import { ADAMTeachingUploadModel } from './adam.schema';
import type { ADAMTeachingUpload } from './adam.types';
import {
  extractTextFromBuffer,
  extensionOf,
  normalizeFounderFile,
} from './adam-file-extract.service';

function uploadRoot(): string {
  return path.resolve(process.cwd(), ENV.ADAM_UPLOAD_DIR);
}

export async function ensureUploadDirectory(): Promise<void> {
  await fs.mkdir(uploadRoot(), { recursive: true });
}

function truncateText(text: string): { text: string; truncated: boolean } {
  const max = ENV.UPLOAD_MAX_EXTRACT_CHARS;
  if (text.length <= max) {
    return { text, truncated: false };
  }
  return {
    text:      text.slice(0, max) + '\n\n[… content truncated for constitutional processing …]',
    truncated: true,
  };
}

export async function saveTeachingUpload(
  file: File,
  sessionId?: string,
): Promise<ADAMTeachingUpload & { textTruncated: boolean; preview: string }> {
  await ensureUploadDirectory();

  const buffer = Buffer.from(await file.arrayBuffer());
  const normalized = normalizeFounderFile(buffer, file.type || '', file.name || 'upload');
  const fileName = normalized.fileName;
  const mimeType = normalized.mimeType;

  const rawText = await extractTextFromBuffer(buffer, mimeType, fileName);
  const { text: extractedText, truncated: textTruncated } = truncateText(rawText);

  const id = uuidv4();
  const ext = extensionOf(fileName);
  const storedName = `${id}${ext}`;
  const storagePath = path.join(uploadRoot(), storedName);

  await fs.writeFile(storagePath, buffer);

  const doc = await ADAMTeachingUploadModel.create({
    uploadId:      id,
    sessionId,
    fileName,
    mimeType,
    sizeBytes:     file.size,
    extractedText,
    textTruncated,
    storagePath,
    uploadedAt:    new Date(),
  });

  const preview = extractedText.slice(0, 280).replace(/\s+/g, ' ').trim();

  return {
    id:            doc.uploadId,
    sessionId:     doc.sessionId,
    fileName:      doc.fileName,
    mimeType:      doc.mimeType,
    sizeBytes:     doc.sizeBytes,
    extractedText: doc.extractedText,
    textTruncated: doc.textTruncated,
    storagePath:   doc.storagePath,
    uploadedAt:    doc.uploadedAt,
    preview:       preview.length < extractedText.length ? `${preview}…` : preview,
  };
}

export async function getTeachingUpload(
  uploadId: string,
): Promise<ADAMTeachingUpload | null> {
  const doc = await ADAMTeachingUploadModel.findOne({ uploadId }).lean();
  if (!doc) return null;
  return {
    id:            doc.uploadId,
    sessionId:     doc.sessionId,
    fileName:      doc.fileName,
    mimeType:      doc.mimeType,
    sizeBytes:     doc.sizeBytes,
    extractedText: doc.extractedText,
    textTruncated: doc.textTruncated,
    storagePath:   doc.storagePath,
    uploadedAt:    doc.uploadedAt,
  };
}

export interface TeachingContextResult {
  context:   string;
  fileNames: string[];
  uploadIds: string[];
}

/** Build context block injected into the founder message for Claude */
export async function buildTeachingContext(
  uploadIds: string[],
): Promise<TeachingContextResult> {
  if (!uploadIds.length) {
    return { context: '', fileNames: [], uploadIds: [] };
  }

  const uniqueIds = [...new Set(uploadIds)].slice(0, 5);
  const docs = await ADAMTeachingUploadModel.find({
    uploadId: { $in: uniqueIds },
  }).lean();

  if (!docs.length) {
    throw new Error('Teaching file not found. Upload again before sending.');
  }

  const blocks = docs.map((doc, index) => {
    const truncatedNote = doc.textTruncated
      ? '\n(Note: file was truncated to fit constitutional processing limits.)'
      : '';
    return [
      `[FOUNDER TEACHING DATA ${index + 1} — ${doc.fileName}]`,
      `Type: ${doc.mimeType} · Size: ${(doc.sizeBytes / 1024).toFixed(1)} KB`,
      truncatedNote,
      '',
      doc.extractedText,
    ].filter(Boolean).join('\n');
  });

  return {
    context: [
      '═══ FOUNDER TEACHING DATA (study with full Akal — this is constitutional material) ═══',
      '',
      blocks.join('\n\n---\n\n'),
      '',
      '═══ END FOUNDER TEACHING DATA ═══',
    ].join('\n'),
    fileNames: docs.map((doc) => doc.fileName),
    uploadIds: docs.map((doc) => doc.uploadId),
  };
}

/**
 * AIDIL erasure — once ADAM has read teaching uploads, raw B is removed.
 * Deletes disk files and MongoDB records; energy lives only in QXK24Brain (C).
 */
export async function deleteTeachingUploads(uploadIds: string[]): Promise<number> {
  if (!uploadIds.length) return 0;

  const uniqueIds = [...new Set(uploadIds)];
  const docs = await ADAMTeachingUploadModel.find({
    uploadId: { $in: uniqueIds },
  }).lean();

  for (const doc of docs) {
    if (doc.storagePath) {
      try {
        await fs.unlink(doc.storagePath);
      } catch {
        // File may already be removed — constitutional erasure still proceeds
      }
    }
  }

  const result = await ADAMTeachingUploadModel.deleteMany({
    uploadId: { $in: uniqueIds },
  });

  return result.deletedCount ?? 0;
}

const STUDENT_RELAY_EXCERPT_MAX = 10_000;

/**
 * Text excerpt from founder uploads for student relay (no raw file download in ERA_1).
 */
export async function buildStudentRelayAttachmentSection(
  uploadIds: string[],
): Promise<string> {
  if (!uploadIds.length) return '';

  const { context, fileNames } = await buildTeachingContext(uploadIds);
  if (!fileNames.length) return '';

  const body = context
    .replace(/^═══ FOUNDER TEACHING DATA[^\n]*\n\n/, '')
    .replace(/\n\n═══ END FOUNDER TEACHING DATA ═══\s*$/, '')
    .trim();

  const excerpt =
    body.length > STUDENT_RELAY_EXCERPT_MAX
      ? `${body.slice(0, STUDENT_RELAY_EXCERPT_MAX)}\n\n[… excerpt truncated for delivery …]`
      : body;

  return [
    '',
    '── Founder teaching data (via ADAM) ──',
    `Files: ${fileNames.join(', ')}`,
    '',
    excerpt,
  ].join('\n');
}

export function composeFounderMessage(
  userMessage: string,
  teachingContext: string,
): string {
  const trimmed = userMessage.trim();
  if (!teachingContext) return trimmed;

  const defaultPrompt =
    'Founder has shared teaching data above. Study it carefully, absorb it constitutionally, and respond with your understanding. Ask clarifying questions if anything is unclear.';

  const founderWords = trimmed || defaultPrompt;

  return `${teachingContext}\n\n---\n\n${founderWords}`;
}
