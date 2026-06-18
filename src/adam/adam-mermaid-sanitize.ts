/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mermaid Sanitize
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
 * Mermaid 11 rejects unquoted node labels with commas, slashes, parentheses, etc.
 */

const UNQUOTED_NODE_LABEL_RE = /([A-Za-z][\w-]*)\[([^\]"\n]+)\]/g;

const MERMAID_LABEL_SPECIAL_RE = /[/,()&<>]|(?:\s\/\s)/;

function quoteMermaidLabel(label: string): string {
  return `"${label.trim().replace(/"/g, '#quot;')}"`;
}

/** Quote flowchart node labels that would break Mermaid 11 strict parse. */
export function sanitizeAdamMermaidSource(source: string): string {
  return source.replace(
    UNQUOTED_NODE_LABEL_RE,
    (full, nodeId: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed || !MERMAID_LABEL_SPECIAL_RE.test(trimmed)) return full;
      return `${nodeId}[${quoteMermaidLabel(trimmed)}]`;
    },
  );
}
