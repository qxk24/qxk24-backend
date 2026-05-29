/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM File Text Extraction
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export const FOUNDER_UPLOAD_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.csv', '.json',
  '.xml', '.log', '.yaml', '.yml', '.html', '.htm',
  '.pdf', '.doc', '.docx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
] as const;

export type FounderFileKind = 'pdf' | 'docx' | 'doc' | 'image' | 'text' | 'unknown';

export interface NormalizedFounderFile {
  fileName: string;
  mimeType: string;
  ext: string;
  kind: FounderFileKind;
}

const EXT_TO_MIME: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt':  'text/plain',
  '.md':   'text/markdown',
  '.markdown': 'text/markdown',
  '.csv':  'text/csv',
  '.json': 'application/json',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/x-pdf': '.pdf',
  'application/msword': '.doc',
  'application/x-msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const MIME_ALIASES: Record<string, string> = {
  'application/x-pdf': 'application/pdf',
  'application/x-msword': 'application/msword',
};

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
]);

const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
]);

const TEXT_MIME_PREFIXES = ['text/'];
const TEXT_MIMES = new Set([
  'application/json',
  'application/xml',
  'text/xml',
  'application/csv',
  'text/csv',
]);

const UNTRUSTED_MIMES = new Set([
  '',
  'application/octet-stream',
  'binary/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  'application/download',
]);

export function extensionOf(fileName: string): string {
  return path.extname(fileName).toLowerCase() || '';
}

function aliasMime(mimeType: string): string {
  return MIME_ALIASES[mimeType] ?? mimeType;
}

/** Detect file type from magic bytes when the browser sends a generic name/MIME. */
export function sniffBufferKind(buffer: Buffer): Partial<NormalizedFounderFile> {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return { mimeType: 'application/pdf', ext: '.pdf', kind: 'pdf' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', ext: '.jpg', kind: 'image' };
  }
  if (
    buffer.length >= 8
    && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  ) {
    return { mimeType: 'image/png', ext: '.png', kind: 'image' };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mimeType: 'image/webp', ext: '.webp', kind: 'image' };
  }
  if (buffer.length >= 6 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 8192)).toString('latin1');
    if (sample.includes('word/')) {
      return {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: '.docx',
        kind: 'docx',
      };
    }
  }
  return {};
}

function kindFromExtAndMime(ext: string, mimeType: string): FounderFileKind {
  if (ext === '.pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }
  if (ext === '.doc' || mimeType === 'application/msword') return 'doc';
  if (IMAGE_EXTENSIONS.has(ext) || IMAGE_MIMES.has(mimeType) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (
    TEXT_MIME_PREFIXES.some((p) => mimeType.startsWith(p))
    || TEXT_MIMES.has(mimeType)
    || ['.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.log', '.yaml', '.yml', '.html', '.htm'].includes(ext)
  ) {
    return 'text';
  }
  return 'unknown';
}

/**
 * Normalize browser-provided metadata using extension, MIME aliases, and file content.
 */
export function normalizeFounderFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): NormalizedFounderFile {
  const sniffed = sniffBufferKind(buffer);
  let ext = extensionOf(fileName);
  let mime = aliasMime((mimeType || '').trim());
  let kind: FounderFileKind = 'unknown';

  if (sniffed.ext && (UNTRUSTED_MIMES.has(mime) || !ext)) {
    ext = sniffed.ext;
    mime = sniffed.mimeType ?? EXT_TO_MIME[ext] ?? mime;
    kind = sniffed.kind ?? kindFromExtAndMime(ext, mime);
  }

  if (!ext && mime && MIME_TO_EXT[mime]) {
    ext = MIME_TO_EXT[mime];
  }

  if (UNTRUSTED_MIMES.has(mime) && ext && EXT_TO_MIME[ext]) {
    mime = EXT_TO_MIME[ext];
  }

  if (!mime || UNTRUSTED_MIMES.has(mime)) {
    mime = EXT_TO_MIME[ext] ?? sniffed.mimeType ?? (mime || 'application/octet-stream');
  }

  if (kind === 'unknown') {
    kind = kindFromExtAndMime(ext, mime);
  }

  let normalizedName = fileName || 'upload';
  if (ext && !extensionOf(normalizedName)) {
    normalizedName = `${normalizedName}${ext}`;
  }

  return { fileName: normalizedName, mimeType: mime, ext, kind };
}

export function resolveMimeType(mimeType: string, fileName: string, buffer?: Buffer): string {
  if (buffer?.length) {
    return normalizeFounderFile(buffer, mimeType, fileName).mimeType;
  }
  const ext = extensionOf(fileName);
  const mime = aliasMime(mimeType);
  if (UNTRUSTED_MIMES.has(mime) && ext && EXT_TO_MIME[ext]) {
    return EXT_TO_MIME[ext];
  }
  if (mime && !UNTRUSTED_MIMES.has(mime)) return mime;
  return EXT_TO_MIME[ext] ?? (mime || 'application/octet-stream');
}

export function isSupportedFounderFile(
  mimeType: string,
  fileName: string,
  buffer?: Buffer,
): boolean {
  if (buffer?.length) {
    return normalizeFounderFile(buffer, mimeType, fileName).kind !== 'unknown';
  }

  const resolved = resolveMimeType(mimeType, fileName);
  const ext = extensionOf(fileName);

  if ((FOUNDER_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    return true;
  }
  if (IMAGE_MIMES.has(resolved) || resolved.startsWith('image/')) return true;
  if (TEXT_MIME_PREFIXES.some((p) => resolved.startsWith(p))) return true;
  if (TEXT_MIMES.has(resolved)) return true;
  if (resolved === 'application/pdf') return true;
  if (resolved === 'application/msword') return true;
  if (resolved === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return true;
  }

  return false;
}

export function supportedFormatsLabel(): string {
  return 'PDF, DOCX, DOC, TXT, MD, JPG, PNG, GIF, WEBP';
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? '';
}

function imagePlaceholder(fileName: string): string {
  return [
    `[Image file stored: ${fileName}]`,
    '',
    'This is a visual teaching asset. The pixels are preserved in storage.',
    'In your response, ask the Founder to describe what this image teaches if they have not already,',
    'and reason from their description together with any text they provide.',
  ].join('\n');
}

/**
 * Extract readable text from founder upload bytes for ADAM teaching context.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const normalized = normalizeFounderFile(buffer, mimeType, fileName);

  if (normalized.kind === 'unknown') {
    throw new Error(
      `File type not supported. Use ${supportedFormatsLabel()} (max 30 MB).`,
    );
  }

  if (normalized.kind === 'image') {
    return imagePlaceholder(normalized.fileName);
  }

  if (normalized.kind === 'pdf') {
    try {
      const text = (await extractPdfText(buffer)).trim();
      if (!text) {
        throw new Error(
          'PDF has no extractable text. Try a text-based PDF or describe the file in your message.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable text')) throw err;
      throw new Error(
        `Could not read this PDF (${msg}). Try exporting again as PDF or paste the content in chat.`,
      );
    }
  }

  if (normalized.kind === 'docx') {
    const text = (await extractDocxText(buffer)).trim();
    if (!text) {
      throw new Error('DOCX appears empty or unreadable.');
    }
    return text;
  }

  if (normalized.kind === 'doc') {
    try {
      const text = (await extractDocxText(buffer)).trim();
      if (text) return text;
    } catch {
      // fall through
    }
    throw new Error(
      'Legacy .doc format is not fully supported. Please save as .docx or .pdf and upload again.',
    );
  }

  if (normalized.kind === 'text') {
    const raw = buffer.toString('utf-8').trim();
    if (!raw) {
      throw new Error('File appears empty. ADAM needs readable teaching content.');
    }
    return raw;
  }

  throw new Error(
    `Could not read this file. Use ${supportedFormatsLabel()}.`,
  );
}

/** Accept File or Blob-with-name from multipart parsers. */
export function getMultipartUploadFile(
  body: Record<string, unknown>,
  field = 'file',
): File | null {
  const raw = body[field];
  if (raw instanceof File) return raw;
  if (
    typeof raw === 'object'
    && raw !== null
    && typeof (raw as File).arrayBuffer === 'function'
    && typeof (raw as File).name === 'string'
  ) {
    return raw as File;
  }
  return null;
}
