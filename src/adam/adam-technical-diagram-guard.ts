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
  isAdamTechnicalKonvensionalDisplayTurn,
} from './adam-response-generation';
import { sanitizeAdamMermaidSource } from './adam-mermaid-sanitize';

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

/** Newton first law / inertia — object at rest or uniform motion until unbalanced force. */
export const NEWTON_INERTIA_MERMAID_DIAGRAM = [
  'flowchart LR',
  '  A[Objek pegun atau bergerak seragam]',
  '  B[Daya luar tidak seimbang]',
  '  C[Perubahan halaju atau arah]',
  '  A -->|tanpa daya luar| A',
  '  A -->|daya luar| B',
  '  B --> C',
].join('\n');

/** Generic concept flow — superseded by shape-based universal fallbacks. */
export const GENERIC_KONSEP_MERMAID_DIAGRAM = [
  'flowchart TD',
  '  A[Definisi konsep]',
  '  B[Prinsip atau hukum]',
  '  C[Contoh kehidupan seharian]',
  '  A --> B --> C',
].join('\n');

/** Universal — effects thread (kesan / impak / dampak). */
export const UNIVERSAL_EFFECTS_MERMAID_DIAGRAM = [
  'flowchart TD',
  '  A[Punca atau sumber]',
  '  B[Kesan langsung]',
  '  C[Kesan jangka panjang]',
  '  A --> B --> C',
].join('\n');

/** Universal — health + environment effects (dual branch). */
export const UNIVERSAL_HEALTH_ENV_EFFECTS_MERMAID_DIAGRAM = [
  'flowchart TD',
  '  A[Punca atau pencemar]',
  '  B[Kesihatan manusia]',
  '  C[Alam sekitar]',
  '  A --> B',
  '  A --> C',
].join('\n');

/** Universal — process thread (bagaimana / proses). */
export const UNIVERSAL_PROCESS_MERMAID_DIAGRAM = [
  'flowchart LR',
  '  A[Input atau punca]',
  '  B[Proses]',
  '  C[Hasil]',
  '  A --> B --> C',
].join('\n');

/** Universal — definition thread (apa itu / apakah). */
export const UNIVERSAL_DEFINE_MERMAID_DIAGRAM = [
  'flowchart TD',
  '  A[Definisi]',
  '  B[Ciri atau komponen]',
  '  C[Contoh kehidupan seharian]',
  '  A --> B --> C',
].join('\n');

/** Universal — compare thread. */
export const UNIVERSAL_COMPARE_MERMAID_DIAGRAM = [
  'flowchart LR',
  '  A[Konsep pertama]',
  '  B[Konsep kedua]',
  '  C[Perbezaan utama]',
  '  A --> C',
  '  B --> C',
].join('\n');

const EFFECTS_SHAPE_ASK =
  /\b(?:kesan|impak|dampak|akibat|effects?|consequences?|impacts?)\b/i;
const PROCESS_SHAPE_ASK =
  /\b(?:bagaimana|proses|how\s+does|how\s+do|berlaku|terjadi|works?)\b/i;
const COMPARE_SHAPE_ASK =
  /\b(?:bezakan|banding|bandingkan|compare|perbezaan|versus|vs\.?)\b/i;
const DEFINE_SHAPE_ASK =
  /\b(?:apa\s+itu|apakah|what\s+is|define|definisi|terangkan|jelaskan|huraikan|explain)\b/i;

/** Civics — separation of powers (structural template, not a media URL). */
export const CIVICS_CONSTITUTION_MERMAID_DIAGRAM = [
  'flowchart TD',
  '  A[Undang-undang tertinggi]',
  '  B[Legislatif — Parlimen]',
  '  C[Eksekutif — Kabinet dan PM]',
  '  D[Kehakiman — Mahkamah]',
  '  A --> B',
  '  A --> C',
  '  A --> D',
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
  const body = sanitizeAdamMermaidSource(mermaidSource.trim());
  return `${ADAM_TECHNICAL_DIAGRAM_TAG_OPEN}\n${body}\n${ADAM_TECHNICAL_DIAGRAM_TAG_CLOSE}`;
}

/** Fix commas/slashes in existing diagram blocks (model output). */
export function repairTechnicalDiagramMermaidSyntax(text: string): string {
  return text.replace(DIAGRAM_TAG_RE, (match, inner: string) => {
    const fixed = sanitizeAdamMermaidSource(String(inner).trim());
    if (fixed === String(inner).trim()) return match;
    return `${ADAM_TECHNICAL_DIAGRAM_TAG_OPEN}\n${fixed}\n${ADAM_TECHNICAL_DIAGRAM_TAG_CLOSE}`;
  });
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

function pickTopicRichFallbackDiagram(userMessage: string): string | null {
  const msg = userMessage.trim();
  if (!msg) return null;
  if (/\b(?:perlembagaan|cabang\s+kuasa|sistem\s+kerajaan)\b/i.test(msg)) {
    return CIVICS_CONSTITUTION_MERMAID_DIAGRAM;
  }
  if (/\bfotosintesis\b/i.test(msg)) return PHOTOSYNTHESIS_MERMAID_DIAGRAM;
  if (/\b(?:ais|peleburan|fasa|pepejal|cecair|wap|mencair)\b/i.test(msg)) {
    return PHASE_CHANGE_MERMAID_DIAGRAM;
  }
  if (/\b(?:asid|bes|alkali|acid|base|peneutralan|neutralis|skala\s+ph)\b/i.test(msg)
    || (/\bph\b/i.test(msg) && /\b(?:larutan|kimia|chemistry)\b/i.test(msg))) {
    return ACID_BASE_MERMAID_DIAGRAM;
  }
  if (/\b(?:newton|inersia|inertia|hukum\s+(?:newton|gerak)|daya|momentum|halaju|kelajuan\s+seragam)\b/i.test(msg)) {
    return NEWTON_INERTIA_MERMAID_DIAGRAM;
  }
  return null;
}

/** Shape-based fallback — one path for all universal channel turns (no topic catalog). */
export function buildUniversalFallbackDiagram(userMessage: string): string {
  const rich = pickTopicRichFallbackDiagram(userMessage);
  if (rich) return rich;

  const msg = userMessage.trim();
  if (
    EFFECTS_SHAPE_ASK.test(msg)
    && /\b(?:kesihatan|manusia|health)\b/i.test(msg)
    && /\b(?:alam\s+sekitar|ekosistem|environment)\b/i.test(msg)
  ) {
    return UNIVERSAL_HEALTH_ENV_EFFECTS_MERMAID_DIAGRAM;
  }
  if (EFFECTS_SHAPE_ASK.test(msg)) return UNIVERSAL_EFFECTS_MERMAID_DIAGRAM;
  if (COMPARE_SHAPE_ASK.test(msg)) return UNIVERSAL_COMPARE_MERMAID_DIAGRAM;
  if (PROCESS_SHAPE_ASK.test(msg)) return UNIVERSAL_PROCESS_MERMAID_DIAGRAM;
  if (DEFINE_SHAPE_ASK.test(msg)) return UNIVERSAL_DEFINE_MERMAID_DIAGRAM;
  return UNIVERSAL_DEFINE_MERMAID_DIAGRAM;
}

function pickFallbackDiagram(userMessage: string): string {
  return buildUniversalFallbackDiagram(userMessage);
}

/** Exported for structure repair — swap generic diagram blocks. */
export function pickFallbackDiagramForMessage(userMessage: string): string {
  return pickFallbackDiagram(userMessage);
}

export function replaceTechnicalDiagramInner(text: string, mermaidSource: string): string {
  return text.replace(
    DIAGRAM_TAG_RE,
    wrapTechnicalDiagram(mermaidSource),
  );
}

const GENERIC_DIAGRAM_MARKERS = [
  'Input atau punca',
  'Definisi konsep',
  'Konsep pertama',
  'Konsep kedua',
];

export function diagramInnerIsGenericPlaceholder(inner: string): boolean {
  const t = inner.trim();
  if (!t) return true;
  return GENERIC_DIAGRAM_MARKERS.some((mark) => t.includes(mark));
}

/** Remove placeholder diagrams the model invented — universal channel default. */
export function stripGenericTechnicalDiagrams(text: string): string {
  return text
    .replace(DIAGRAM_STASH_RE, (match) => {
      const inner = extractAdamTechnicalDiagramInner(match);
      if (inner && diagramInnerIsGenericPlaceholder(inner)) return '';
      return match;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function technicalDisplayDiagramInsertIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i += 1) {
    const block = lines[i]!.trim();
    if (!block) continue;
    if (/^<adam-(?:technical-diagram|chat-image|chat-video)\b/i.test(block)) continue;
    return i + 1;
  }
  return lines.length;
}

/** Ensure universal technical channel answers keep valid diagram syntax only — no fallback injection. */
export function repairTechnicalDiagramOutput(
  text: string,
  userMessage: string,
  options?: { isFounder?: boolean },
): string {
  if (options?.isFounder) return text.trim();
  if (!isAdamTechnicalKonvensionalDisplayTurn(userMessage)) return text.trim();
  return repairTechnicalDiagramMermaidSyntax(text.trim());
}
