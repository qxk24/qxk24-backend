/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Brain Recall Surface Filter
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Phase 2 — Brain C recall export surface filter.
 * Tags recall blocks konvensional | alamtologi | sintesis | konstitusi
 * so Mode 1 prompts never receive raw HISAL / Formula XYZ episodes.
 */

import type { LlmMessage } from '../llm/llm-types';
import type { AdamKnowledgeMode } from './adam-knowledge-mode';
import { knowledgeModeAllowsAlamtologiStack } from './adam-knowledge-mode';

export type BrainRecallExportSurface = AdamKnowledgeMode;

const ALAMTOLOGI_RECALL_USER_MARKERS: RegExp[] = [
  /\[UNIVERSAL TEACHING RECALL/i,
  /\[P\.ALT TEACHING RECORDS/i,
  /\[ADAM TEACHING RECORDS/i,
  /\[CONSTITUTIONAL BACKBONE/i,
  /\[TEACHING RECALL MISS/i,
  /\[INQUIRY RECALL MISS/i,
  /\[AIDIL STAGE DASHBOARD/i,
  /\[CONSTITUTIONAL KNOWLEDGE GRAPH\]/i,
  /\[CONSTITUTIONAL VAULT/i,
  /constitutional checkpoints/i,
  /transformation audit trail/i,
  /Formula XYZ/i,
  /SEALED ANCHOR/i,
  /CONSTITUTIONAL BACKBONE/i,
  /CURRICULUM OVERVIEW/i,
  /ALAMTOLOGI BOOK CANON/i,
  /bab HISAL/i,
  /meterai Formula XYZ/i,
];

const ALAMTOLOGI_RECALL_ASSISTANT_MARKERS: RegExp[] = [
  /episod pengajaran relevan/i,
  /sintesis A\+B=C, bukan salin meterai/i,
  /CONSTITUTIONAL BACKBONE/i,
  /pegang meterai P\.alt/i,
  /Constitutional Vault/i,
  /AIDIL Stage Dashboard/i,
  /knowledge graph, P\.alt/i,
  /transformation audit trail/i,
  /belum jumpa episod pengajaran indeks/i,
  /no indexed Brain C episode/i,
];

const QURAN_CORPUS_MARKER = /\[QURAN CORPUS|QURAN CORPUS — verified ayat/i;

const FRAMEWORK_JARGON_RE =
  /\b(?:HISAL|AIDIL|TAJU|waqf|SuNom|Formula XYZ|PL\/PG|Proses Lerai|Proses Gabung|baris penyelesaian|tahap fungsi|kiub|tajalli|MASA\/TENAGA|RUANG\/MASA|ilmu HISAL|prinsip tujuh)\b/i;

export function contextBlockIsAlamtologiBrainRecall(content: string): boolean {
  const t = content.trim();
  if (!t) return false;
  return ALAMTOLOGI_RECALL_USER_MARKERS.some((re) => re.test(t));
}

export function contextBlockIsQuranCorpusRecall(content: string): boolean {
  return QURAN_CORPUS_MARKER.test(content.trim());
}

function contextBlockIsAlamtologiRecallAssistantAck(content: string): boolean {
  const t = content.trim();
  if (!t) return false;
  return ALAMTOLOGI_RECALL_ASSISTANT_MARKERS.some((re) => re.test(t));
}

/** Strip framework jargon from an outcome line for Mode 1 surface export. */
export function sanitizeOutcomeLineForKonvensional(line: string): string | null {
  const t = line.trim();
  if (!t || FRAMEWORK_JARGON_RE.test(t)) return null;
  if (/^P\.alt taught:/i.test(t)) return null;
  if (/^C uid:/i.test(t)) return null;
  if (/^Stage \d/i.test(t)) return null;
  if (/^Episode:/i.test(t)) return null;
  return t;
}

/** Build Mode 1 recall block from raw teaching-recall text (outcome lines only). */
export function buildKonvensionalRecallFromRawBlock(rawBlock: string): string | null {
  const lines = rawBlock.split('\n');
  const universalLines: string[] = [];

  for (const line of lines) {
    const became = line.match(/^\s*ADAM became:\s*(.+)$/i);
    if (became) {
      const clean = sanitizeOutcomeLineForKonvensional(became[1] ?? '');
      if (clean) universalLines.push(`- ${clean}`);
      continue;
    }
    const episode = line.match(/^\s*Episode:\s*(.+)$/i);
    if (episode) {
      const clean = sanitizeOutcomeLineForKonvensional(episode[1] ?? '');
      if (clean) universalLines.push(`- ${clean}`);
    }
  }

  if (!universalLines.length) return null;

  return [
    '[KONVENSIONAL BRAIN RECALL — universal synthesis only]',
    'Brain C episod — gunakan hanya baris di bawah untuk L2/L3 konvensional.',
    'FORBIDDEN outward: HISAL, AIDIL, TAJU, Formula XYZ, waqf, PL/PG, label Alamtologi.',
  ].concat(universalLines).join('\n');
}

const KONVENSIONAL_RECALL_ACK =
  'Saya pegang sintesis universal dari episod Brain C — tanpa label kerangka atau transkrip P.alt.';

/**
 * Post-build safety net — drop or universalize recall pairs not allowed on this mode.
 */
export function filterContextMessagesForKnowledgeMode(
  messages: ReadonlyArray<LlmMessage>,
  mode: AdamKnowledgeMode,
): LlmMessage[] {
  if (mode === 'sintesis') return [...messages];

  const allowAlamtologi = knowledgeModeAllowsAlamtologiStack(mode);
  const allowQuran = mode === 'konstitusi';
  const collectedRaw: string[] = [];
  const out: LlmMessage[] = [];
  let skipNextAssistant = false;

  for (const message of messages) {
    const content = message.content ?? '';

    if (!allowQuran && contextBlockIsQuranCorpusRecall(content)) {
      skipNextAssistant = true;
      continue;
    }

    if (!allowAlamtologi && contextBlockIsAlamtologiBrainRecall(content)) {
      collectedRaw.push(content);
      skipNextAssistant = true;
      continue;
    }

    if (skipNextAssistant && message.role === 'assistant') {
      skipNextAssistant = false;
      if (contextBlockIsAlamtologiRecallAssistantAck(content)) continue;
    }
    skipNextAssistant = false;

    out.push(message);
  }

  if (mode === 'konvensional' && collectedRaw.length) {
    const konvensionalBlock = collectedRaw
      .map(buildKonvensionalRecallFromRawBlock)
      .filter((b): b is string => Boolean(b))
      .join('\n\n');

    if (konvensionalBlock.trim()) {
      const insertAt = Math.min(2, out.length);
      out.splice(
        insertAt,
        0,
        { role: 'user', content: konvensionalBlock },
        { role: 'assistant', content: KONVENSIONAL_RECALL_ACK },
      );
    }
  }

  return out;
}

export function knowledgeModeToRecallExportSurface(mode: AdamKnowledgeMode): BrainRecallExportSurface {
  return mode;
}
