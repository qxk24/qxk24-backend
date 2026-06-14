/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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

import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/environments';
import { ADAMTeachingUploadModel } from './adam.schema';
import type { ADAMTeachingUpload } from './adam.types';
import { FOUNDER_USER_ID } from './adam-student.types';
import {
  FOUNDER_TEACHING_DATA_FOOTER,
  FOUNDER_TEACHING_DATA_HEADER,
  FOUNDER_TEACHING_UPLOAD_DEFAULT_PROMPT,
} from './adam-founder-teaching-prompts';
import { extractTeachingTextInChild } from './adam-upload-extract-child';
import {
  extensionOf,
  normalizeFromDisk,
} from './adam-file-extract.service';

export interface SaveTeachingUploadOptions {
  sessionId?:     string;
  uploadedBy?:    string;
  uploaderRole?:  'founder' | 'student';
  uploaderName?:  string;
}

export interface BuildTeachingContextOptions {
  scope?:        'founder' | 'student';
  studentName?:  string;
  /** Students may only attach their own uploads */
  ownerUserId?:  string;
}

function uploadRoot(): string {
  return path.resolve(process.cwd(), ENV.ADAM_UPLOAD_DIR);
}

export async function ensureUploadDirectory(): Promise<void> {
  await fs.mkdir(uploadRoot(), { recursive: true });
}

/** Stream Web File to disk — avoids a second full-file Buffer in the main process. */
async function writeUploadToTemp(file: File, destPath: string): Promise<void> {
  if (typeof file.stream === 'function') {
    const nodeStream = Readable.fromWeb(
      file.stream() as Parameters<typeof Readable.fromWeb>[0],
    );
    await pipeline(nodeStream, createWriteStream(destPath));
    return;
  }
  await fs.writeFile(destPath, Buffer.from(await file.arrayBuffer()));
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
  options: SaveTeachingUploadOptions = {},
): Promise<ADAMTeachingUpload & { textTruncated: boolean; preview: string }> {
  await ensureUploadDirectory();

  const uploaderRole = options.uploaderRole ?? 'founder';
  const id = uuidv4();
  const tempPath = path.join(os.tmpdir(), `alm-upload-${uuidv4()}`);

  let rawText = '';
  let fileName = file.name || 'upload';
  let mimeType = file.type || '';
  let storagePath = '';

  try {
    await writeUploadToTemp(file, tempPath);
    const normalized = await normalizeFromDisk(
      tempPath,
      file.type || '',
      file.name || 'upload',
    );
    fileName = normalized.fileName;
    mimeType = normalized.mimeType;
    storagePath = path.join(uploadRoot(), `${id}${extensionOf(fileName)}`);

    rawText = await extractTeachingTextInChild(tempPath, mimeType, fileName, uploaderRole);
    await fs.copyFile(tempPath, storagePath);
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }

  const { text: extractedText, truncated: textTruncated } = truncateText(rawText);

  const doc = await ADAMTeachingUploadModel.create({
    uploadId:      id,
    sessionId:     options.sessionId,
    uploadedBy:    options.uploadedBy,
    uploaderRole,
    uploaderName:  options.uploaderName ?? '',
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
    uploadedBy:    doc.uploadedBy,
    uploaderRole:  doc.uploaderRole,
    uploaderName:  doc.uploaderName,
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

function mapUploadDoc(doc: {
  uploadId: string;
  sessionId?: string;
  uploadedBy?: string;
  uploaderRole?: 'founder' | 'student';
  uploaderName?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  textTruncated: boolean;
  storagePath: string;
  uploadedAt: Date;
}): ADAMTeachingUpload {
  return {
    id:            doc.uploadId,
    sessionId:     doc.sessionId,
    uploadedBy:    doc.uploadedBy,
    uploaderRole:  doc.uploaderRole,
    uploaderName:  doc.uploaderName,
    fileName:      doc.fileName,
    mimeType:      doc.mimeType,
    sizeBytes:     doc.sizeBytes,
    extractedText: doc.extractedText,
    textTruncated: doc.textTruncated,
    storagePath:   doc.storagePath,
    uploadedAt:    doc.uploadedAt,
  };
}

export function canAccessTeachingUpload(
  upload: ADAMTeachingUpload,
  requester: { userId: string; role: 'founder' | 'student' },
): boolean {
  if (requester.role === 'founder') return true;
  if (!upload.uploadedBy) return false;
  return upload.uploadedBy === requester.userId;
}

export async function getTeachingUpload(
  uploadId: string,
): Promise<ADAMTeachingUpload | null> {
  const doc = await ADAMTeachingUploadModel.findOne({ uploadId }).lean();
  if (!doc) return null;
  return mapUploadDoc(doc);
}

export interface TeachingContextResult {
  context:   string;
  fileNames: string[];
  uploadIds: string[];
}

/** Build context block injected into the chat message for Claude */
export async function buildTeachingContext(
  uploadIds: string[],
  options: BuildTeachingContextOptions & { maxContextChars?: number } = {},
): Promise<TeachingContextResult> {
  if (!uploadIds.length) {
    return { context: '', fileNames: [], uploadIds: [] };
  }

  const scope = options.scope ?? 'founder';
  const uniqueIds = [...new Set(uploadIds)].slice(0, 5);
  const docs = await ADAMTeachingUploadModel.find({
    uploadId: { $in: uniqueIds },
  }).lean();

  if (!docs.length) {
    throw new Error('Attached file not found. Upload again before sending.');
  }

  if (options.ownerUserId) {
    const forbidden = docs.some(
      (doc) => doc.uploadedBy && doc.uploadedBy !== options.ownerUserId,
    );
    if (forbidden) {
      throw new Error('You can only send files you uploaded in this session.');
    }
  }

  const studentLabel = options.studentName?.trim() || 'Student';
  const blockTitle =
    scope === 'founder'
      ? 'FOUNDER TEACHING DATA'
      : `STUDENT MATERIAL — ${studentLabel}`;

  const blocks = docs.map((doc, index) => {
    const truncatedNote = doc.textTruncated
      ? '\n(Note: file was truncated to fit processing limits.)'
      : '';
    return [
      `[${blockTitle} ${index + 1} — ${doc.fileName}]`,
      `Type: ${doc.mimeType} · Size: ${(doc.sizeBytes / 1024).toFixed(1)} KB`,
      truncatedNote,
      '',
      doc.extractedText,
    ].filter(Boolean).join('\n');
  });

  const header =
    scope === 'founder'
      ? FOUNDER_TEACHING_DATA_HEADER
      : `═══ STUDENT SHARED MATERIAL — ${studentLabel} (images read by ADAM vision; study with Adab) ═══`;
  const footer =
    scope === 'founder'
      ? FOUNDER_TEACHING_DATA_FOOTER
      : '═══ END STUDENT SHARED MATERIAL ═══';

  const maxChars = options.maxContextChars ?? ENV.UPLOAD_MAX_EXTRACT_CHARS;
  let context = [
    header,
    '',
    blocks.join('\n\n---\n\n'),
    '',
    footer,
  ].join('\n');

  if (context.length > maxChars) {
    const note =
      '\n\n[… teaching data truncated for this chat turn — full extract was stored for processing …]';
    context = context.slice(0, Math.max(1000, maxChars - note.length)) + note;
  }

  return {
    context,
    fileNames: docs.map((doc) => doc.fileName),
    uploadIds: docs.map((doc) => doc.uploadId),
  };
}

/**
 * AIDIL erasure — once ADAM has read teaching uploads, raw B is removed.
 * Deletes disk files and MongoDB records; energy lives only in Alamtologi Brain (C).
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

  const defaultPrompt = FOUNDER_TEACHING_UPLOAD_DEFAULT_PROMPT;

  const founderWords = trimmed || defaultPrompt;

  return `${teachingContext}\n\n---\n\n${founderWords}`;
}

export function composeStudentMessage(
  userMessage: string,
  attachmentContext: string,
  studentName: string,
): string {
  const trimmed = userMessage.trim();
  if (!attachmentContext) return trimmed;

  const defaultPrompt =
    `${studentName} shared material above (including any image read by ADAM). Respond with full Adab. If they need the Founder, use the consult flow.`;

  const words = trimmed || defaultPrompt;

  return `${attachmentContext}\n\n---\n\n${words}`;
}

/** Resolve uploader id for founder JWT or static founder access */
export function resolveFounderUploaderId(userId?: string): string {
  return userId?.trim() || FOUNDER_USER_ID;
}
