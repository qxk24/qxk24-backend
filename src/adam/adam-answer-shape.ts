/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Shape
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Universal Scholar answer shape — intent drives structure (not domain).
 * v1: definitional + comparative + compound; procedural/causal reserved.
 */

import {
  isAdamCompareTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamSimpleArithmeticTurn,
  isAdamSimpleFactualTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import type { AdamUsersDomainFacet } from './adam-users-domain-router';
import { usersDomainRequiresFormalLayout } from './adam-users-domain-router';
import {
  extractPrimaryTopicTitle,
  parseCompoundSecondaryClause,
} from './adam-answer-compound';
import { isAdamProseCraftTurn } from './adam-prose-craft';
import { isAdamFormalDataShapeTurn } from './adam-compare-formal-display';

export { isAdamFormalDataShapeTurn } from './adam-compare-formal-display';

/** Short display label for ### headers — compound BM/EN questions normalized. */
export function extractTeachingTopicTitle(message: string): string {
  return extractPrimaryTopicTitle(message);
}

/** Second ### section title when user asked a compound question. */
export function extractSecondarySectionTitle(message: string): string | null {
  return parseCompoundSecondaryClause(message).header;
}

export type AdamAnswerShapeIntent =
  | 'definitional'
  | 'comparative'
  | 'compound'
  | 'prose-craft'
  | 'procedural'
  | 'causal'
  | 'general';

export interface AdamComparePair {
  left:  string;
  right: string;
}

export interface AdamAnswerShape {
  intent: AdamAnswerShapeIntent;
  /** Short topic label for ### Apa itu {topic}? */
  topicTitle?: string;
  /** Compound second section — e.g. "Bagaimana ia mempengaruhi tingkah laku" */
  secondaryTitle?: string | null;
  /** Compare pair when intent is comparative */
  comparePair?: AdamComparePair | null;
  /** Whether prompt + repair should enforce structured ### display */
  structured: boolean;
  /** Tables + numeric data — formal scientific layout (not essay-only). */
  formalDataLayout?: boolean;
}

const DEFINITIONAL_ASK =
  /\b(?:apa\s+itu|apa\s+ialah|apa\s+yang\s+dimaksudkan\s+dengan|apakah\s+itu|terangkan|jelaskan|huraikan|what\s+is|what\s+are|explain|describe|tell\s+me\s+about|ceritakan\s+tentang)\b/i;

const PROCEDURAL_ASK =
  /\b(?:langkah|langkah-langkah|cara\s+(?:untuk|membuat|menggunakan)|how\s+to|step\s+by\s+step|tutorial)\b/i;

const CAUSAL_ASK =
  /\b(?:kenapa|mengapa|why\s+(?:do|does|is)|apa\s+punca|apakah\s+punca|what\s+causes?|bagaimana\s+(?:berlaku|terjadi))\b/i;

const EVALUATIVE_ASK =
  /\b(?:apakah|adakah)\s+keberkesanan\b|\bapakah\s+kesan(?:nya)?\b|\bapa\s+kesan(?:nya)?\b|\bkesan(?:nya)?\s+terhadap\b/i;

const COMPARE_LABEL_MAX = 56;

/** Compare pair label — first clause only; drop "dalam sistem…" and follow-up asks. */
function normalizeCompareLabel(raw: string): string {
  let t = raw
    .trim()
    .replace(/^['"“”‘’]|['"“”‘’]$/g, '')
    .replace(/^yang\s+dimaksudkan\s+dengan\s+/i, '')
    .replace(/\?+$/, '')
    .trim();
  const periodIdx = t.search(/[.?!]/);
  if (periodIdx > 0) {
    t = t.slice(0, periodIdx).trim();
  }
  t = t
    .replace(/^(?:terangkan|jelaskan|huraikan|explain|describe|berikan\s+penjelasan\s+(?:mengenai|tentang)|penjelasan\s+(?:mengenai|tentang))\s+/i, '')
    .replace(/\s+dalam\s+(?:sistem|konteks)\b[\s\S]*$/i, '')
    .replace(/\s+pada\s+malaysia\b[\s\S]*$/i, '')
    .replace(/\s+lebih\s+perinci\b[\s\S]*$/i, '')
    .trim();
  if (t.length > COMPARE_LABEL_MAX) {
    t = t.slice(0, COMPARE_LABEL_MAX).replace(/\s+\S*$/, '').trim();
  }
  return t || 'topik ini';
}

/** Extract A vs B labels from compare questions — universal, not law-specific. */
export function extractComparePair(message: string): AdamComparePair | null {
  const body = stripLeadingAdamSalutation(message).trim();
  const patterns: RegExp[] = [
    /\b(?:terangkan|jelaskan|huraikan)\s+perbezaan(?:\s+antara)?\s+(.+?)\s+dan\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\bperbezaan(?:\s+antara)?\s+(.+?)\s+dan\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\bbeza(?:\s+antara)?\s+(.+?)\s+dan\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\bbezakan\s+(.+?)\s+dan\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\bbanding(?:kan)?\s+(.+?)\s+(?:dengan|dan|vs\.?|versus)\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\bcompare\s+(.+?)\s+(?:with|and|vs\.?|versus)\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\bdifference\s+between\s+(.+?)\s+and\s+(.+?)(?=\s+dalam\s+|\s+pada\s+|\s+lebih\s+|[.,?]|$)/i,
    /\b(?:terangkan|jelaskan|huraikan|explain|describe)\s+(.+?)\s+vs\.?\s+(.+?)(?=[.,?]|$)/i,
    /^(.+?)\s+vs\.?\s+(.+?)(?=[.,?]|$)/i,
  ];
  for (const re of patterns) {
    const m = body.match(re);
    if (m?.[1] && m?.[2]) {
      const left = normalizeCompareLabel(m[1]);
      const right = normalizeCompareLabel(m[2]);
      if (left.length >= 2 && right.length >= 2) {
        return { left, right };
      }
    }
  }
  return null;
}

export function isAdamDefinitionalTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isAdamCompareTurn(t)) return false;
  if (isAdamPracticalAdvisoryTurn(t)) return false;
  if (isAdamSimpleFactualTurn(t) || isAdamSimpleArithmeticTurn(t)) return false;
  return DEFINITIONAL_ASK.test(t);
}

export function isAdamCompoundTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isAdamCompareTurn(t)) return false;
  return Boolean(parseCompoundSecondaryClause(t).header);
}

function resolveShapeIntent(message: string): AdamAnswerShapeIntent {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t) return 'general';
  if (isAdamCompareTurn(t)) return 'comparative';
  if (isAdamProseCraftTurn(t)) return 'prose-craft';
  if (isAdamCompoundTurn(t)) return 'compound';
  if (isAdamDefinitionalTurn(t)) return 'definitional';
  if (PROCEDURAL_ASK.test(t)) return 'procedural';
  if (EVALUATIVE_ASK.test(t) && !DEFINITIONAL_ASK.test(t)) return 'causal';
  if (CAUSAL_ASK.test(t) && !DEFINITIONAL_ASK.test(t)) return 'causal';
  return 'general';
}

/** Universal answer shape — one contract for prompt + repair. */
export function resolveAdamAnswerShape(
  message: string,
  options?: { structured?: boolean; usersDomain?: AdamUsersDomainFacet },
): AdamAnswerShape {
  const body = stripLeadingAdamSalutation(message).trim();
  const intent = resolveShapeIntent(body);
  const structured = options?.structured
    ?? (intent !== 'general' && intent !== 'prose-craft');

  const domainFormal = Boolean(
    options?.usersDomain
    && usersDomainRequiresFormalLayout(options.usersDomain)
    && structured,
  );

  const shape: AdamAnswerShape = {
    intent,
    structured,
    formalDataLayout: domainFormal,
  };

  if (intent === 'comparative') {
    shape.comparePair = extractComparePair(body);
    // Jadual 2 (formal data) only when user asks for figures — not every civics/economics compare.
    shape.formalDataLayout = structured && isAdamFormalDataShapeTurn(body);
    return shape;
  }

  if (intent === 'prose-craft') {
    return shape;
  }

  if (intent === 'definitional' || intent === 'compound' || intent === 'general' || intent === 'causal') {
    shape.formalDataLayout = structured && (
      domainFormal || isAdamFormalDataShapeTurn(body)
    );
  }

  if (intent === 'definitional' || intent === 'compound' || intent === 'general') {
    shape.topicTitle = extractTeachingTopicTitle(body);
  }

  if (intent === 'compound') {
    shape.secondaryTitle = extractSecondarySectionTitle(body);
  }

  return shape;
}

export function isComparativeShape(shape?: AdamAnswerShape): boolean {
  return shape?.intent === 'comparative';
}

export function isDefinitionalShape(shape?: AdamAnswerShape): boolean {
  return shape?.intent === 'definitional' || shape?.intent === 'compound';
}

export function formatAdamAnswerShapeLog(shape: AdamAnswerShape): string {
  const parts = [`intent=${shape.intent}`, `structured=${shape.structured}`];
  if (shape.topicTitle) parts.push(`topic=${shape.topicTitle}`);
  if (shape.comparePair) {
    parts.push(`pair=${shape.comparePair.left}|${shape.comparePair.right}`);
  }
  return `[adam:answer-shape] ${parts.join(' ')}`;
}
