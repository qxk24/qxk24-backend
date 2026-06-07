/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Smart Truncate
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Preserve synthesis (start) + recency (end); trim middle only */
export function smartTruncate(
  text: string,
  maxChars: number,
  label: string,
): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  if (maxChars < 800) {
    return `${trimmed.slice(0, maxChars)}\n\n[… ${label} shortened …]`;
  }

  const keepStart = Math.floor(maxChars * 0.7);
  const keepEnd = Math.floor(maxChars * 0.25);
  const start = trimmed.slice(0, keepStart);
  const end = trimmed.slice(-keepEnd);
  const dropped = trimmed.length - keepStart - keepEnd;

  return `${start}

[… ${dropped.toLocaleString()} characters of ${label} omitted this turn — core synthesis and recent context preserved …]

${end}`;
}
