/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Mongo Regex Safety
 * Platform : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Atlas / MongoDB PCRE pattern limit (~16k); stay well below after escaping. */
export const MONGO_MAX_REGEX_PATTERN_CHARS = 2048;

/** $text search — keep queries short for stable ranking and limits. */
export const MONGO_MAX_TEXT_SEARCH_CHARS = 512;

export function clipMongoTextSearchQuery(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MONGO_MAX_TEXT_SEARCH_CHARS) return trimmed;
  return trimmed.slice(0, MONGO_MAX_TEXT_SEARCH_CHARS);
}

export function clipMongoRegexLiteral(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MONGO_MAX_REGEX_PATTERN_CHARS) return trimmed;
  return trimmed.slice(0, MONGO_MAX_REGEX_PATTERN_CHARS);
}

export function escapeMongoRegexLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildMongoRegexFromLiteral(
  text: string,
  flags = 'i',
): RegExp | null {
  const clipped = clipMongoRegexLiteral(text);
  if (clipped.length < 2) return null;
  return new RegExp(escapeMongoRegexLiteral(clipped), flags);
}
