/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import type { LoadParameters } from 'pdf-parse';
import * as CFB from 'cfb';
import JSZip from 'jszip';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PPT = require('ppt') as {
  parse_pptcfb: (cfb: CFB.CFB$Container, opts?: Record<string, unknown>) => {
    slides: unknown[];
    docs: unknown[];
  };
  utils: { to_text: (pres: { slides: unknown[]; docs: unknown[] }) => string[] };
};
import { ENV } from '../config/environments';
import { describeImageWithVision } from './adam-image-vision.service';

export const FOUNDER_UPLOAD_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.csv', '.json',
  '.xml', '.log', '.yaml', '.yml', '.html', '.htm',
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
] as const;

export type FounderFileKind =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'ppt'
  | 'pptx'
  | 'image'
  | 'text'
  | 'unknown';

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
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
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
    if (sample.includes('ppt/')) {
      return {
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ext: '.pptx',
        kind: 'pptx',
      };
    }
    if (sample.includes('word/')) {
      return {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: '.docx',
        kind: 'docx',
      };
    }
  }
  if (
    buffer.length >= 8
    && buffer[0] === 0xd0
    && buffer[1] === 0xcf
    && buffer[2] === 0x11
    && buffer[3] === 0xe0
  ) {
    return { mimeType: 'application/vnd.ms-powerpoint', ext: '.ppt', kind: 'ppt' };
  }
  return {};
}

function kindFromExtAndMime(ext: string, mimeType: string): FounderFileKind {
  if (ext === '.pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }
  if (ext === '.doc' || mimeType === 'application/msword') return 'doc';
  if (ext === '.pptx' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return 'pptx';
  }
  if (ext === '.ppt' || mimeType === 'application/vnd.ms-powerpoint') return 'ppt';
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
  if (resolved === 'application/vnd.ms-powerpoint') return true;
  if (resolved === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return true;
  }

  return false;
}

export function supportedFormatsLabel(): string {
  return 'PDF, DOCX, DOC, PPT, PPTX, TXT, MD, JPG, PNG, GIF, WEBP';
}

/** PDFs at or above this size use pdf.js range/stream loading from disk (no full-file Buffer). */
const PDF_STREAM_FROM_DISK_BYTES = 20 * 1024 * 1024;

/** Fewer pages for larger files — pdf.js RAM scales with page complexity, not file MB. */
function pdfParsePageCap(fileSizeBytes: number): number {
  const cap = ENV.UPLOAD_PDF_MAX_PAGES;
  const mb = fileSizeBytes / (1024 * 1024);
  if (mb > 20) return Math.min(cap, 2);
  if (mb <= 0.5) return Math.min(cap, 10);
  if (mb <= 2) return Math.min(cap, 5);
  if (mb <= 5) return Math.min(cap, 4);
  return Math.min(cap, 3);
}

function pdfLoadParamsForPath(filePath: string, fileSizeBytes: number): LoadParameters {
  const base: LoadParameters = {
    url:    pathToFileURL(filePath).href,
    length: fileSizeBytes,
  };
  if (fileSizeBytes < PDF_STREAM_FROM_DISK_BYTES) {
    return base;
  }
  return {
    ...base,
    rangeChunkSize:   65_536,
    disableRange:     false,
    disableStream:    false,
    disableAutoFetch: false,
  };
}

async function extractPdfTextWithLoad(
  loadParams: LoadParameters,
  fileSizeBytes: number,
): Promise<string> {
  const firstPages = pdfParsePageCap(fileSizeBytes);
  const maxChars = ENV.UPLOAD_MAX_EXTRACT_CHARS;
  const parser = new PDFParse(loadParams);
  try {
    const result = await parser.getText({
      first:       firstPages,
      parsePageInfo: false,
      parseHyperlinks: false,
    });

    const parts: string[] = [];
    let used = 0;
    for (const page of result.pages) {
      const chunk = (page.text ?? '').trim();
      if (!chunk) continue;
      const remaining = maxChars - used;
      if (remaining <= 0) break;
      if (chunk.length > remaining) {
        parts.push(chunk.slice(0, remaining));
        parts.push('\n\n[… content truncated for constitutional processing …]');
        used = maxChars;
        break;
      }
      parts.push(chunk);
      used += chunk.length + 2;
    }

    let text = parts.join('\n\n').trim();
    if (result.total > firstPages) {
      text += `\n\n[… PDF has ${result.total} pages; first ${firstPages} pages used for teaching. Export a shorter excerpt if ADAM needs more …]`;
    }
    return text;
  } finally {
    await parser.destroy();
  }
}

async function extractPdfTextFromPath(filePath: string, fileSizeBytes: number): Promise<string> {
  return extractPdfTextWithLoad(pdfLoadParamsForPath(filePath, fileSizeBytes), fileSizeBytes);
}

async function extractPdfText(buffer: Buffer, fileSizeBytes: number): Promise<string> {
  return extractPdfTextWithLoad({ data: buffer }, fileSizeBytes);
}

/** Mammoth OOMs when word/document.xml is huge (common in 1–2 MB zip DOCX). */
const DOCX_LITE_DOCUMENT_XML_BYTES = 5 * 1024 * 1024;

type ZipEntryMeta = JSZip.JSZipObject & { _data?: { uncompressedSize?: number } };

async function docxDocumentXmlUncompressedBytes(buffer: Buffer): Promise<number> {
  const zip = await JSZip.loadAsync(buffer);
  const entry = zip.file('word/document.xml') as ZipEntryMeta | null;
  return entry?._data?.uncompressedSize ?? 0;
}

function extractTextFromWordDocumentXml(xml: string): string {
  const parts = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map((m) => m[1]?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean);
  return parts.join(' ');
}

/** Low-memory path: read word/document.xml only (no mammoth DOM). */
async function extractDocxTextLite(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml?.trim()) {
    throw new Error('DOCX appears empty or unreadable.');
  }
  const text = extractTextFromWordDocumentXml(xml);
  if (!text.trim()) {
    throw new Error('DOCX has no extractable text in the document body.');
  }
  return text;
}

async function extractDocxFromBuffer(buffer: Buffer): Promise<string> {
  const xmlBytes = await docxDocumentXmlUncompressedBytes(buffer);
  if (xmlBytes > DOCX_LITE_DOCUMENT_XML_BYTES) {
    return truncateExtractedText(await extractDocxTextLite(buffer));
  }
  const result = await mammoth.extractRawText({ buffer });
  return truncateExtractedText(result.value ?? '');
}

async function extractDocxFromPath(filePath: string): Promise<string> {
  const probe = await fs.readFile(filePath);
  const xmlBytes = await docxDocumentXmlUncompressedBytes(probe);
  if (xmlBytes > DOCX_LITE_DOCUMENT_XML_BYTES) {
    return truncateExtractedText(await extractDocxTextLite(probe));
  }
  const result = await mammoth.extractRawText({ path: filePath });
  return truncateExtractedText(result.value ?? '');
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? '';
}

function slideNumberFromPath(filePath: string): number {
  const match = filePath.match(/slide(\d+)\.xml$/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractTextNodesFromSlideXml(xml: string): string[] {
  return [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)]
    .map((m) => m[1]?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean);
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => slideNumberFromPath(a) - slideNumberFromPath(b));

  const parts: string[] = [];
  for (const slidePath of slidePaths) {
    const xml = await zip.file(slidePath)?.async('string');
    if (!xml) continue;
    const lines = extractTextNodesFromSlideXml(xml);
    if (!lines.length) continue;
    parts.push(`--- Slide ${slideNumberFromPath(slidePath)} ---\n${lines.join('\n')}`);
  }

  return parts.join('\n\n');
}

function extractLegacyPptText(buffer: Buffer): string {
  const cfb = CFB.read(buffer, { type: 'buffer' });
  const pres = PPT.parse_pptcfb(cfb, {});
  const lines = PPT.utils.to_text(pres);
  return lines.join('\n');
}

export interface ExtractTextOptions {
  uploaderRole?: 'founder' | 'student';
}

/**
 * Extract readable text from upload bytes for ADAM teaching context.
 */
function assertOfficeParseSize(buffer: Buffer, label: string): void {
  assertOfficeParseSizeBytes(buffer.length, label);
}

function assertPdfParseSizeBytes(sizeBytes: number): void {
  if (sizeBytes <= ENV.UPLOAD_PDF_PARSE_MAX_BYTES) return;
  throw new Error(
    `PDF is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB — `
    + `parsing limit is ${ENV.UPLOAD_PDF_PARSE_MAX_MB} MB. `
    + 'Export only the relevant pages and re-upload, or paste key sections as text.',
  );
}

function assertOfficeParseSizeBytes(sizeBytes: number, label: string): void {
  if (sizeBytes <= ENV.UPLOAD_OFFICE_PARSE_MAX_BYTES) return;
  throw new Error(
    `${label} is ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB — parsing limit is `
    + `${ENV.UPLOAD_OFFICE_PARSE_MAX_MB} MB. Save a shorter export and re-upload, or paste key sections as text.`,
  );
}

export async function normalizeFromDisk(
  filePath: string,
  mimeType: string,
  fileName: string,
): Promise<NormalizedFounderFile> {
  const { size } = await fs.stat(filePath);
  const probeLen = Math.min(size, 8192);
  const probe = Buffer.alloc(probeLen);
  if (probeLen > 0) {
    const fh = await fs.open(filePath, 'r');
    try {
      await fh.read(probe, 0, probeLen, 0);
    } finally {
      await fh.close();
    }
  }
  return normalizeFounderFile(probe, mimeType, fileName);
}

async function readFileBufferScoped(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

function truncateExtractedText(text: string): string {
  const max = ENV.UPLOAD_MAX_EXTRACT_CHARS;
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return (
    trimmed.slice(0, max)
    + '\n\n[… content truncated for constitutional processing …]'
  );
}

/**
 * Extract text from a file on disk — one buffer allocation at a time (teaching uploads).
 */
export async function extractTextFromPath(
  filePath: string,
  mimeType: string,
  fileName: string,
  options: ExtractTextOptions = {},
): Promise<string> {
  const normalized = await normalizeFromDisk(filePath, mimeType, fileName);
  const uploaderRole = options.uploaderRole ?? 'founder';
  const { size } = await fs.stat(filePath);

  if (normalized.kind === 'unknown') {
    throw new Error(
      `File type not supported. Use ${supportedFormatsLabel()} (max ${ENV.UPLOAD_MAX_FILE_MB} MB).`,
    );
  }

  if (normalized.kind === 'image') {
    const buffer = await readFileBufferScoped(filePath);
    try {
      return await describeImageWithVision(
        buffer,
        normalized.mimeType,
        normalized.fileName,
        uploaderRole,
      );
    } finally {
      // buffer eligible for GC after return
    }
  }

  if (normalized.kind === 'text') {
    const text = await fs.readFile(filePath, 'utf-8');
    if (!text.trim()) {
      throw new Error('File appears empty. ADAM needs readable teaching content.');
    }
    return truncateExtractedText(text);
  }

  if (normalized.kind === 'pdf') {
    assertPdfParseSizeBytes(size);
    try {
      const text = truncateExtractedText(await extractPdfTextFromPath(filePath, size));
      if (!text) {
        throw new Error(
          'PDF has no extractable text. Try a text-based PDF or describe the file in your message.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable text') || msg.includes('parsing limit is')) throw err;
      throw new Error(
        `Could not read this PDF (${msg}). Try exporting again as PDF or paste the content in chat.`,
      );
    }
  }

  if (normalized.kind === 'docx') {
    assertOfficeParseSizeBytes(size, 'DOCX');
    const text = await extractDocxFromPath(filePath);
    if (!text) {
      throw new Error('DOCX appears empty or unreadable.');
    }
    return text;
  }

  if (normalized.kind === 'doc') {
    assertOfficeParseSizeBytes(size, 'Word document');
    const buffer = await readFileBufferScoped(filePath);
    try {
      const text = truncateExtractedText(await extractDocxText(buffer));
      if (text) return text;
    } catch {
      // fall through
    }
    throw new Error(
      'Legacy .doc format is not fully supported. Please save as .docx or .pdf and upload again.',
    );
  }

  if (normalized.kind === 'pptx') {
    assertOfficeParseSizeBytes(size, 'PowerPoint');
    const buffer = await readFileBufferScoped(filePath);
    try {
      const text = truncateExtractedText(await extractPptxText(buffer));
      if (!text) {
        throw new Error(
          'PowerPoint (.pptx) has no extractable slide text. Add speaker notes or save as PDF.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable')) throw err;
      throw new Error(
        `Could not read this PowerPoint (.pptx) (${msg}). Try saving as PDF or paste content in chat.`,
      );
    }
  }

  if (normalized.kind === 'ppt') {
    assertOfficeParseSizeBytes(size, 'PowerPoint');
    const buffer = await readFileBufferScoped(filePath);
    try {
      const text = truncateExtractedText(extractLegacyPptText(buffer));
      if (!text) {
        throw new Error(
          'Legacy .ppt has no extractable text. Save as .pptx or PDF and upload again.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable')) throw err;
      throw new Error(
        `Could not read this PowerPoint (.ppt) (${msg}). Save as .pptx or PDF and upload again.`,
      );
    }
  }

  throw new Error(
    `Could not read this file. Use ${supportedFormatsLabel()}.`,
  );
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  options: ExtractTextOptions = {},
): Promise<string> {
  const normalized = normalizeFounderFile(buffer, mimeType, fileName);
  const uploaderRole = options.uploaderRole ?? 'founder';

  if (normalized.kind === 'unknown') {
    throw new Error(
      `File type not supported. Use ${supportedFormatsLabel()} (max ${ENV.UPLOAD_MAX_FILE_MB} MB).`,
    );
  }

  if (normalized.kind === 'image') {
    return describeImageWithVision(
      buffer,
      normalized.mimeType,
      normalized.fileName,
      uploaderRole,
    );
  }

  if (normalized.kind === 'pdf') {
    assertPdfParseSizeBytes(buffer.length);
    try {
      const text = truncateExtractedText(await extractPdfText(buffer, buffer.length));
      if (!text) {
        throw new Error(
          'PDF has no extractable text. Try a text-based PDF or describe the file in your message.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable text') || msg.includes('parsing limit is')) throw err;
      throw new Error(
        `Could not read this PDF (${msg}). Try exporting again as PDF or paste the content in chat.`,
      );
    }
  }

  if (normalized.kind === 'docx') {
    assertOfficeParseSize(buffer, 'DOCX');
    const text = await extractDocxFromBuffer(buffer);
    if (!text) {
      throw new Error('DOCX appears empty or unreadable.');
    }
    return text;
  }

  if (normalized.kind === 'doc') {
    assertOfficeParseSize(buffer, 'Word document');
    try {
      const text = truncateExtractedText(await extractDocxText(buffer));
      if (text) return text;
    } catch {
      // fall through
    }
    throw new Error(
      'Legacy .doc format is not fully supported. Please save as .docx or .pdf and upload again.',
    );
  }

  if (normalized.kind === 'pptx') {
    assertOfficeParseSize(buffer, 'PowerPoint');
    try {
      const text = truncateExtractedText(await extractPptxText(buffer));
      if (!text) {
        throw new Error(
          'PowerPoint (.pptx) has no extractable slide text. Add speaker notes or save as PDF.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable')) throw err;
      throw new Error(
        `Could not read this PowerPoint (.pptx) (${msg}). Try saving as PDF or paste content in chat.`,
      );
    }
  }

  if (normalized.kind === 'ppt') {
    assertOfficeParseSize(buffer, 'PowerPoint');
    try {
      const text = truncateExtractedText(extractLegacyPptText(buffer));
      if (!text) {
        throw new Error(
          'Legacy .ppt has no extractable text. Save as .pptx or PDF and upload again.',
        );
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no extractable')) throw err;
      throw new Error(
        `Could not read this PowerPoint (.ppt) (${msg}). Save as .pptx or PDF and upload again.`,
      );
    }
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
