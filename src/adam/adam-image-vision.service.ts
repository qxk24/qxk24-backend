/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Image Vision
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

import { getVisionModel } from '../config/anthropic-models';
import { getAdamLanguageDirective } from './adam-language';
import { isLlmConfigured, llmDescribeImage } from '../llm/llm-client';
import { normalizeFounderFile } from './adam-file-extract.service';

type VisionMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const VISION_MEDIA: Record<string, VisionMediaType> = {
  'image/jpeg': 'image/jpeg',
  'image/png':  'image/png',
  'image/gif':  'image/gif',
  'image/webp': 'image/webp',
};

function resolveVisionMediaType(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): VisionMediaType | null {
  const normalized = normalizeFounderFile(buffer, mimeType, fileName);
  if (normalized.kind !== 'image') return null;

  const mime = VISION_MEDIA[normalized.mimeType];
  if (mime) return mime;

  if (normalized.ext === '.jpg' || normalized.ext === '.jpeg') return 'image/jpeg';
  if (normalized.ext === '.png') return 'image/png';
  if (normalized.ext === '.gif') return 'image/gif';
  if (normalized.ext === '.webp') return 'image/webp';

  return null;
}

function visionPrompt(uploaderRole: 'founder' | 'student', fileName: string): string {
  if (uploaderRole === 'founder') {
    return [
      `The Founder uploaded "${fileName}" as constitutional teaching material.`,
      'Describe everything relevant for ADAM to study: visible text (OCR), diagrams, tables, handwriting, symbols, and visual meaning.',
      'Use clear sections. Quote transcribed text faithfully. If unclear, say what is uncertain.',
      'Write in the same language as the image when obvious; otherwise use the constitutional default language.',
      getAdamLanguageDirective(),
    ].join(' ');
  }

  return [
    `An Alamtologi student uploaded "${fileName}" for ADAM.`,
    'Describe visible text (OCR), diagrams, and what the student may be asking about.',
    'Be precise and respectful. Quote transcribed text when present.',
  ].join(' ');
}

/** Read an image with the active LLM vision model and return text for ADAM teaching context. */
export async function describeImageWithVision(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  uploaderRole: 'founder' | 'student' = 'founder',
): Promise<string> {
  if (!isLlmConfigured()) {
    throw new Error('Image reading requires an LLM API key on the server.');
  }

  const mediaType = resolveVisionMediaType(buffer, mimeType, fileName);
  if (!mediaType) {
    throw new Error(
      'This image format cannot be read automatically. Save as JPG, PNG, GIF, or WEBP and upload again.',
    );
  }

  const text = await llmDescribeImage({
    buffer,
    mediaType,
    fileName,
    prompt:    visionPrompt(uploaderRole, fileName),
    model:     getVisionModel(),
    maxTokens: 4096,
  });

  return [
    `[Image read by ADAM — ${fileName}]`,
    '',
    text,
  ].join('\n');
}
