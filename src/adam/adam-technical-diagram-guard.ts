/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Technical Diagram Guard
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
 * Technical konvensional answers — Mermaid flowchart inside protocol tags.
 * Rendered as SVG on web (not markdown fences — SSE-safe).
 */

import {
  isAdamScienceNatureSynthesisTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
} from './adam-response-generation';

export const ADAM_TECHNICAL_DIAGRAM_TAG_OPEN = '<adam-technical-diagram>';
export const ADAM_TECHNICAL_DIAGRAM_TAG_CLOSE = '</adam-technical-diagram>';

const DIAGRAM_TAG_RE = /<adam-technical-diagram>([\s\S]*?)<\/adam-technical-diagram>/i;
const DIAGRAM_STASH_RE = /<adam-technical-diagram>[\s\S]*?<\/adam-technical-diagram>/gi;

const FRAMEWORK_IN_DIAGRAM_RE =
  /\b(?:Alamtologi|MASA|TENAGA|RUANG|IZWA|HISAL|AIDIL|TAJU)\b/i;

/** Konvensional photosynthesis flow — fallback when model omits diagram on science process turn. */
export const PHOTOSYNTHESIS_MERMAID_DIAGRAM = [
  'flowchart LR',
  '  subgraph Input',
  '    A[Cahaya matahari]',
  '    B[Air H₂O]',
  '    C[CO₂]',
  '  end',
  '  D[Klorofil dalam daun]',
  '  E[Glukosa]',
  '  F[Oksigen O₂]',
  '  A --> D',
  '  B --> D',
  '  C --> D',
  '  D --> E',
  '  D --> F',
].join('\n');

/** Acid–base / pH — neutralization flow. */
export const ACID_BASE_MERMAID_DIAGRAM = [
  'flowchart LR',
  '  A[Asid H⁺ dalam air] --> C[Peneutralan]',
  '  B[Bes OH⁻ dalam air] --> C',
  '  C --> D[Garam]',
  '  C --> E[Air H₂O]',
  '  F[pH < 7] -.-> A',
  '  G[pH > 7] -.-> B',
  '  H[pH = 7 neutral] -.-> E',
].join('\n');

/** Phase change — pepejal → cecair → gas. */
export const PHASE_CHANGE_MERMAID_DIAGRAM = [
  'flowchart LR',
  '  A[Pepejal] -->|tenaga haba| B[Cecair]',
  '  B -->|tenaga haba| C[Gas / Wap]',
].join('\n');

export function outputHasTechnicalDiagram(text: string): boolean {
  return DIAGRAM_TAG_RE.test(text.trim());
}

export function extractAdamTechnicalDiagramInner(text: string): string | null {
  const m = text.match(DIAGRAM_TAG_RE);
  return m?.[1]?.trim() ?? null;
}

export function diagramSourceIsKonvensionalSafe(source: string): boolean {
  const t = source.trim();
  if (!t) return false;
  if (FRAMEWORK_IN_DIAGRAM_RE.test(t)) return false;
  return /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram)/i.test(t);
}

export function wrapTechnicalDiagram(mermaidSource: string): string {
  const body = mermaidSource.trim();
  return `${ADAM_TECHNICAL_DIAGRAM_TAG_OPEN}\n${body}\n${ADAM_TECHNICAL_DIAGRAM_TAG_CLOSE}`;
}

export function stashAdamTechnicalDiagramBlocks(text: string): { prose: string; blocks: string[] } {
  const blocks: string[] = [];
  const prose = text.replace(DIAGRAM_STASH_RE, (match) => {
    const slot = `\x00ADAM_DIAGRAM_${blocks.length}\x00`;
    blocks.push(match);
    return slot;
  });
  return { prose, blocks };
}

export function restoreAdamTechnicalDiagramBlocks(text: string, blocks: string[]): string {
  let out = text;
  for (let i = 0; i < blocks.length; i += 1) {
    out = out.replace(`\x00ADAM_DIAGRAM_${i}\x00`, blocks[i]);
  }
  return out;
}

function pickFallbackDiagram(userMessage: string): string | null {
  const msg = userMessage.trim();
  if (!msg) return null;
  if (/\bfotosintesis\b/i.test(msg)) return PHOTOSYNTHESIS_MERMAID_DIAGRAM;
  if (/\b(?:ais|peleburan|fasa|pepejal|cecair|wap|mencair)\b/i.test(msg)) {
    return PHASE_CHANGE_MERMAID_DIAGRAM;
  }
  if (/\b(?:asid|bes|alkali|acid|base|peneutralan|neutralis|skala\s+ph)\b/i.test(msg)
    || (/\bph\b/i.test(msg) && /\b(?:larutan|kimia|chemistry)\b/i.test(msg))) {
    return ACID_BASE_MERMAID_DIAGRAM;
  }
  return null;
}

/** Ensure science / process technical answers include a konvensional diagram block. */
export function repairTechnicalDiagramOutput(text: string, userMessage: string): string {
  if (!isAdamTechnicalKonvensionalDisplayTurn(userMessage)) return text.trim();
  if (!isAdamScienceNatureSynthesisTurn(userMessage)) return text.trim();
  if (outputHasTechnicalDiagram(text)) return text.trim();

  const fallback = pickFallbackDiagram(userMessage);
  if (!fallback) return text.trim();

  const trimmed = text.trim();
  const lines = trimmed.split(/\n{2,}/);
  const insertAt = lines.length >= 1 ? 1 : 0;
  const block = wrapTechnicalDiagram(fallback);
  lines.splice(insertAt, 0, block);
  return lines.join('\n\n').trim();
}
