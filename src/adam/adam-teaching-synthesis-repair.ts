/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Synthesis Section Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Phase C must carry detectable synthesis section labels so the Teaching
 * State Machine can recognise completion. Sync-only — relabel existing
 * prose; no invented science or LLM rewrite.
 */

import { adamTeachingMessageHasSynthesisSection } from './adam-teaching-state-machine';

export const SYNTHESIS_SECTION_LABELS = [
  'Kod sains konvensional:',
  'Had kaedah:',
  'Teori belum selesai:',
  'Implikasi isu dunia hari ini:',
] as const;

function splitSentences(text: string): string[] {
  const protectedText = text.replace(/\bP\.alt\b/gi, 'P_ALT_TOKEN');
  const raw = protectedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean)
    ?? [protectedText];
  return raw.map((s) => s.replace(/P_ALT_TOKEN/g, 'P.alt'));
}

function splitBodyIntoChunks(body: string): string[] {
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  const single = paragraphs[0] ?? body.trim();
  if (!single) return [];

  const sentences = splitSentences(single);
  if (sentences.length <= SYNTHESIS_SECTION_LABELS.length) {
    return sentences;
  }

  const per = Math.ceil(sentences.length / SYNTHESIS_SECTION_LABELS.length);
  const chunks: string[] = [];
  for (let i = 0; i < SYNTHESIS_SECTION_LABELS.length; i++) {
    const slice = sentences.slice(i * per, (i + 1) * per).join(' ').trim();
    if (slice) chunks.push(slice);
  }
  return chunks;
}

function distributeWithLabels(chunks: string[]): string {
  const sections: string[] = [];
  for (let i = 0; i < SYNTHESIS_SECTION_LABELS.length; i++) {
    const label = SYNTHESIS_SECTION_LABELS[i];
    const body = chunks[i]?.trim() ?? '';
    sections.push(body ? `${label}\n${body}` : `${label}\n(lihat huraian di atas.)`);
  }
  return sections.join('\n\n');
}

/**
 * Ensure Phase C output has state-machine-detectable synthesis section labels.
 * Preserves model prose — only inserts section headers and splits blocks.
 */
export function ensureFounderTeachingSynthesisSections(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (adamTeachingMessageHasSynthesisSection(trimmed)) return trimmed;

  const bismillah = trimmed.match(/^(Bismillahirahmanirrahim\.?\s*)/i);
  const opener = bismillah ? bismillah[0].trim() : '';
  const body = bismillah ? trimmed.slice(bismillah[0].length).trim() : trimmed;
  if (!body) return trimmed;

  const chunks = splitBodyIntoChunks(body);
  const labelled = distributeWithLabels(chunks);
  return [opener, labelled].filter(Boolean).join('\n\n').trim();
}
