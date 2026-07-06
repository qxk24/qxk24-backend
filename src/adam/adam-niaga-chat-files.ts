/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Chat Files (Fasa B)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Lightweight file refs in chat (no base64 in history).
 * Frontend hydrates on tap via /api/niaga/templates/cashflow.
 */

import type { SSEEventType } from './adam.types';

export type NiagaChatFileType = 'xlsx' | 'pdf' | 'docx';
export type NiagaChatFileTemplate = 'niaga-cashflow';

export interface NiagaChatFileRef {
  filename: string;
  type:     NiagaChatFileType;
  template: NiagaChatFileTemplate;
  mimeType: string;
}

const MIME_BY_TYPE: Record<NiagaChatFileType, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const FILENAME_BY_TYPE: Record<NiagaChatFileType, string> = {
  xlsx: 'adam-niaga-cashflow-bulanan.xlsx',
  pdf:  'adam-niaga-cashflow-bulanan.pdf',
  docx: 'adam-niaga-cashflow-bulanan.docx',
};

const FILE_TAG_RE = /<adam-chat-file\b[^>]*\/?>/gi;

/** Detect cashflow-template deliverable requests in Niaga chat. */
export function detectNiagaCashflowTemplateFormats(
  message: string,
): NiagaChatFileType[] | null {
  const m = message.toLowerCase().normalize('NFKC');
  if (!m.trim()) return null;

  const mentionsTemplate = /\btemplate\b|\btemplat\b|\bspreadsheet\b/.test(m);
  const mentionsCash =
    /cash\s*flow|cashflow|aliran\s*tunai|wang\s*masuk|wang\s*keluar/.test(m);
  const mentionsFormat = /\bexcel\b|\bxlsx\b|\bpdf\b|\bdocx\b|\bword\b/.test(m);
  const asksSend =
    /hantar|bagi|muat\s*turun|download|generate|jana|buatkan|kasih|send\s+me|give\s+me|buat\s+kan|sila\s+(bagi|hantar)/.test(m);

  const isRequest =
    (mentionsTemplate && (mentionsCash || mentionsFormat))
    || (mentionsFormat && mentionsCash && asksSend)
    || (mentionsTemplate && asksSend)
    || (mentionsCash && asksSend && mentionsFormat);

  if (!isRequest) return null;

  const formats: NiagaChatFileType[] = [];
  if (/\bexcel\b|\bxlsx\b|\bspreadsheet\b/.test(m)) formats.push('xlsx');
  if (/\bpdf\b/.test(m)) formats.push('pdf');
  if (/\bdocx\b|\bword\b/.test(m)) formats.push('docx');
  if (formats.length === 0) return ['xlsx', 'pdf', 'docx'];
  return formats;
}

export function buildNiagaChatFileRefs(formats: NiagaChatFileType[]): NiagaChatFileRef[] {
  return formats.map((type) => ({
    type,
    template: 'niaga-cashflow',
    filename: FILENAME_BY_TYPE[type],
    mimeType: MIME_BY_TYPE[type],
  }));
}

export function buildNiagaChatFileTag(ref: NiagaChatFileRef): string {
  return (
    `<adam-chat-file type="${ref.type}" template="${ref.template}" `
    + `filename="${ref.filename}" />`
  );
}

export function buildNiagaChatFileTags(formats: NiagaChatFileType[]): string {
  return buildNiagaChatFileRefs(formats).map(buildNiagaChatFileTag).join('\n');
}

/** Append file cards to the saved/streamed ADAM reply (idempotent). */
export function appendNiagaChatFilesToResponse(
  response: string,
  formats: NiagaChatFileType[],
): string {
  const tags = buildNiagaChatFileTags(formats);
  if (!tags) return response;
  const base = (response ?? '').replace(FILE_TAG_RE, '').trimEnd();
  if (!base) return tags;
  return `${base}\n\n${tags}`;
}

export function buildNiagaCashflowFilesContextBlock(
  formats: NiagaChatFileType[],
): string {
  const labels = formats.map((f) => {
    if (f === 'xlsx') return 'Excel (XLSX)';
    if (f === 'pdf') return 'PDF';
    return 'Word (DOCX)';
  }).join(', ');
  return [
    'NIAGA FILE DELIVERY (system-attached — do not invent URLs):',
    `The platform will attach cashflow template cards (${labels}) below your reply.`,
    'Briefly tell the entrepreneur they can tap each card to preview, then download if needed.',
    'Do not invent download links, base64, or fake file paths.',
    'Do not claim the file was emailed or stored in their drive.',
  ].join('\n');
}

export function emitAdamFilesEvent(
  onEvent: (event: SSEEventType, data: string) => void,
  files: NiagaChatFileRef[],
): void {
  if (files.length === 0) return;
  onEvent('adam_files', JSON.stringify({ files }));
}
