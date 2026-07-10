/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Image Descriptor
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { extractImageTags } from './local-vision-engine';

export function describeImageDeterministically(input: {
  fileName:     string;
  mimeType:     string;
  buffer:       Buffer;
  uploaderRole: 'founder' | 'student';
}): string {
  const sizeKb = Math.round(input.buffer.length / 1024);
  const roleLabel = input.uploaderRole === 'founder' ? 'Founder' : 'Student';

  return [
    `[Image registered — ${input.fileName}]`,
    '',
    `${roleLabel} uploaded ${input.fileName} (${input.mimeType}, ${sizeKb} KB).`,
    'Deterministic UL descriptor: visual OCR is not performed probabilistically.',
    'ADAM retains file metadata and constitutional readiness for teaching context.',
  ].join('\n');
}

export async function describeImageWithLocalTags(input: {
  fileName:     string;
  mimeType:     string;
  buffer:       Buffer;
  uploaderRole: 'founder' | 'student';
}): Promise<string> {
  const base = describeImageDeterministically(input);
  const tmp = path.join(os.tmpdir(), `adam-vision-${Date.now()}-${input.fileName}`);
  await fs.writeFile(tmp, input.buffer);

  try {
    const tags = await extractImageTags(tmp);
    return `${base}\n\nImage contains: ${tags.join(', ')}`;
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}
