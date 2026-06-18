/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Compound Parser
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
 * Universal compound clause parser — not a finite whitelist of
 * bagaimana|kenapa only. Used by answer-shape + answer-composer.
 */

import {
  isAdamCompareTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';

const TOPIC_TITLE_MAX = 72;

const COMPOUND_SECONDARY_LEAD =
  /^(?:bagaimana|kenapa|mengapa|apakah|berapa|why|how|what|when|where)\b/i;

const COMPOUND_SECONDARY_NOUN =
  /^(?:kepentingan(?:nya)?|faedah(?:nya)?|manfaat(?:nya)?|fungsi(?:nya)?|peranan(?:nya)?|role|importance|benefits?|advantages?|uses?|applications?)\b/i;

const DEFINITIONAL_ASK =
  /\b(?:apa\s+itu|apa\s+ialah|apa\s+yang\s+dimaksudkan\s+dengan|apakah\s+itu|terangkan|jelaskan|huraikan|what\s+is|what\s+are|explain|describe|tell\s+me\s+about|ceritakan\s+tentang)\b/i;

/** Generic teaching fallback — must never be injected when composer has no secondary. */
export const ADAM_GENERIC_SECONDARY_FALLBACK = 'Bagaimana ia berfungsi?';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatCompoundSectionTitle(raw: string): string {
  const label = raw.trim().replace(/\?+$/, '');
  if (!label) return '';
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isValidCompoundSecondary(raw: string, fullQuestion: string): boolean {
  if (COMPOUND_SECONDARY_LEAD.test(raw)) return true;
  if (COMPOUND_SECONDARY_NOUN.test(raw)) return true;
  if (/(?:nya|ness)$/i.test(raw) && raw.length <= 48) return true;
  if (DEFINITIONAL_ASK.test(fullQuestion) && raw.split(/\s+/).length >= 3) return true;
  return false;
}

/** Trailing `dan {clause}` on compound definitional / explanatory asks. */
export function parseCompoundSecondaryClause(message: string): {
  raw: string | null;
  header: string | null;
} {
  const body = stripLeadingAdamSalutation(message).trim();
  if (!body || isAdamCompareTurn(body)) {
    return { raw: null, header: null };
  }

  const m = body.match(/\bdan\s+(.+?)\s*\??\s*$/i);
  if (!m?.[1]) return { raw: null, header: null };

  const raw = m[1].trim().replace(/\?+$/, '');
  if (raw.length < 3) return { raw: null, header: null };
  if (!isValidCompoundSecondary(raw, body)) {
    return { raw: null, header: null };
  }

  return { raw, header: formatCompoundSectionTitle(raw) };
}

function stripKonsepPrefix(topic: string): string {
  return topic
    .replace(/^konsep\s+/i, '')
    .replace(/^the\s+concept\s+of\s+/i, '')
    .trim();
}

function stripWrappingQuotes(value: string): string {
  let out = value.trim();
  for (let i = 0; i < 3; i += 1) {
    const next = out
      .replace(/^['"“”‘’]+/, '')
      .replace(/['"“”‘’]+$/, '')
      .trim();
    if (next === out) break;
    out = next;
  }
  return out;
}

function normalizeTopicLabel(raw: string, secondaryRaw?: string | null): string {
  let t = raw.trim()
    .replace(/^yang\s+dimaksudkan\s+dengan\s+/i, '')
    .trim();
  t = stripKonsepPrefix(t);
  if (secondaryRaw) {
    const re = new RegExp(`\\s+dan\\s+${escapeRegExp(secondaryRaw)}\\s*\\??$`, 'i');
    t = t.replace(re, '').trim();
  }
  t = stripWrappingQuotes(t);
  if (t.length > TOPIC_TITLE_MAX) {
    t = t.slice(0, TOPIC_TITLE_MAX).replace(/\s+\S*$/, '').trim();
  }
  return t || 'topik ini';
}

/** Primary topic label — strips compound tail when present. */
export function extractPrimaryTopicTitle(
  message: string,
  compound?: { raw: string | null },
): string {
  const body = stripLeadingAdamSalutation(message).trim();
  const secondaryRaw = compound?.raw ?? parseCompoundSecondaryClause(body).raw;

  const patterns: RegExp[] = [
    /\bapakah\s+keberkesanan\s+(.+?)\??$/i,
    /\bapakah\s+kesan(?:nya)?\s+(?:terhadap\s+)?(.+?)\??$/i,
    /\bapa\s+kesan(?:nya)?\s+(?:terhadap\s+)?(.+?)\??$/i,
    /\bkeberkesanan\s+(.+?)\??$/i,
    /^\s*bagaimana\s+(.+?)\s+(?:mempengaruhi|memberi\s+kesan)\b/i,
    /\bapa\s+yang\s+dimaksudkan\s+dengan\s+(.+?)\??$/i,
    /\b(?:apa\s+itu|apakah\s+peranan|terangkan|jelaskan|huraikan|bincangkan)\s+(.+?)(?:\s+dalam\s+|\?|$)/i,
    /\b(?:apa\s+itu|apakah)\s+(.+?)\??$/i,
  ];
  for (const re of patterns) {
    const m = body.match(re);
    if (m?.[1]) {
      return normalizeTopicLabel(m[1], secondaryRaw);
    }
  }
  if (/\bcampur\s+tangan\s+kerajaan\b/i.test(body)) {
    if (/\bkawalan\s+harga\b/i.test(body)) {
      return 'campur tangan kerajaan dalam kawalan harga';
    }
    return 'campur tangan kerajaan';
  }
  return 'topik ini';
}
