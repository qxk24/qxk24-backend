/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Chat Math Notation
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Shared KaTeX delimiter rules for chat UI — keep in sync with alm-web Math Vault.
 */

export const ADAM_CHAT_MATH_NOTATION = `
MATHEMATICAL NOTATION (chat UI renders KaTeX — follow exactly):
- Display equations: $$...$$ on their own line — NEVER \\[...\\] or \\(...\\) for full equations.
- Inline $...$ ONLY for short symbols: $L$, $t$, $\\Delta\\phi$, $C_0$ — never a full equation mid-sentence.
- When citing formulas in passing ("seperti persamaan glymphatic", "formula ISI"), use plain words — do NOT paste \\(...\\) or $...$ inside the running sentence.
- Never put two full equations in one sentence joined by "atau" or "dan" — name them in prose or give each its own $$ display line.
- Lists: use "- " not ◆ or ♦ for bullets.
- Subscripts: $\\text{Word}_{sub}$ — never $\\text{Word}{sub}$ (missing underscore breaks KaTeX).
`.trim();
