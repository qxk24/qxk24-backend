/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Teaching Continuity Protocol (Layer 9)
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
 *
 * Long teachings are never truncated — chunked A + B1 = C1, C1 + B2 = C2 …
 */

import { safeTransform } from './adam-concurrency.service';
import type { transformWithSnapshot } from './adam-snapshot.service';
import type { TeachingTransformContext } from './adam-teaching-record.service';

export type TransformResult = Awaited<ReturnType<typeof transformWithSnapshot>>;

export interface LongTeachingResult {
  layer:           'LAYER_9_TCP';
  usedTcp:         boolean;
  totalChars:      number;
  chunksProcessed: number;
  result:          TransformResult | null;
}

const MAX_CHUNK_CHARS = parseInt(process.env.ADAM_TCP_MAX_CHUNK_CHARS ?? '3000', 10) || 3000;
const CHUNK_DELAY_MS = parseInt(process.env.ADAM_TCP_CHUNK_DELAY_MS ?? '500', 10) || 500;

export function getTcpConfig(): {
  maxChunkChars: number;
  chunkDelayMs:  number;
  layer:         'LAYER_9_TCP';
} {
  return {
    maxChunkChars: MAX_CHUNK_CHARS,
    chunkDelayMs:  CHUNK_DELAY_MS,
    layer:         'LAYER_9_TCP',
  };
}

/** Split text at natural boundaries — never mid-word or mid-sentence when possible */
export function semanticChunk(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  const paragraphs = trimmed.split(/\n\n+/);
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = paragraph;
      } else {
        const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [paragraph];
        for (const sentence of sentences) {
          const next = current ? `${current} ${sentence}` : sentence;
          if (next.length > maxChars) {
            if (current.trim()) chunks.push(current.trim());
            if (sentence.length > maxChars) {
              for (let i = 0; i < sentence.length; i += maxChars) {
                chunks.push(sentence.slice(i, i + maxChars).trim());
              }
              current = '';
            } else {
              current = sentence;
            }
          } else {
            current = next;
          }
        }
      }
    } else {
      current = candidate;
    }

    if (current.length > maxChars) {
      chunks.push(current.slice(0, maxChars).trim());
      current = current.slice(maxChars).trim();
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

export async function processLongTeaching(
  teaching: string,
  sessionId: string,
  founderId: string,
  family = 'Long Teaching',
  principle = 'CAHAYA',
  baseContext: TeachingTransformContext = {},
): Promise<LongTeachingResult> {
  const trimmed = teaching.trim();
  const ctx: TeachingTransformContext = {
    ...baseContext,
    sessionId: sessionId || baseContext.sessionId,
  };
  if (!trimmed) {
    return {
      layer:           'LAYER_9_TCP',
      usedTcp:         false,
      totalChars:      0,
      chunksProcessed: 0,
      result:          null,
    };
  }

  if (trimmed.length <= MAX_CHUNK_CHARS) {
    const result = await safeTransform(trimmed, founderId, ctx);
    return {
      layer:           'LAYER_9_TCP',
      usedTcp:         false,
      totalChars:      trimmed.length,
      chunksProcessed: 1,
      result,
    };
  }

  const chunks = semanticChunk(trimmed, MAX_CHUNK_CHARS);

  console.log(
    `[ADAM TCP] Long teaching detected: ${trimmed.length} chars → ${chunks.length} chunks` +
    (sessionId ? ` (session ${sessionId.slice(-8)})` : ''),
  );

  let lastResult: TransformResult | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLast = i === chunks.length - 1;

    const enrichedChunk = `
[Part ${i + 1} of ${chunks.length} — Long Teaching]
Family: ${family} | Principle: ${principle}
${sessionId ? `Session: …${sessionId.slice(-8)}` : ''}
${isLast ? '[FINAL PART — Teaching complete]' : ''}

${chunk}`.trim();

    lastResult = await safeTransform(enrichedChunk, founderId, {
      ...ctx,
      tcpChunkIndex: i + 1,
      tcpChunkTotal: chunks.length,
    });

    if (!isLast && CHUNK_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
    }
  }

  return {
    layer:           'LAYER_9_TCP',
    usedTcp:         true,
    totalChars:      trimmed.length,
    chunksProcessed: chunks.length,
    result:          lastResult,
  };
}

export function previewTcpChunks(teaching: string): {
  totalChars:  number;
  chunkCount:  number;
  wouldUseTcp: boolean;
  chunks:      Array<{ index: number; chars: number; preview: string }>;
} {
  const trimmed = teaching.trim();
  const chunks = trimmed.length <= MAX_CHUNK_CHARS
    ? [trimmed]
    : semanticChunk(trimmed, MAX_CHUNK_CHARS);

  return {
    totalChars:  trimmed.length,
    chunkCount:  chunks.length,
    wouldUseTcp: trimmed.length > MAX_CHUNK_CHARS,
    chunks:      chunks.map((chunk, index) => ({
      index:   index + 1,
      chars:   chunk.length,
      preview: chunk.slice(0, 120),
    })),
  };
}
