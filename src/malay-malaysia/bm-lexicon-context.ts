/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : BM Malaysia Lexicon Context Injection
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  getBmLexiconMeta,
  isBmLexiconLoaded,
  matchBmLexiconEntries,
} from './bm-lexicon.service';
import type { BmLexiconCategory } from './bm-lexicon.types';

const CATEGORY_LABEL: Record<BmLexiconCategory, string> = {
  id_drift: 'Indonesian drift — use BM Malaysia',
  spelling: 'BM Malaysia spelling',
  register: 'BM Malaysia voice',
};

function formatEntryLine(wrong: string, correct: string, category: BmLexiconCategory): string {
  return `- ${wrong} → ${correct} (${CATEGORY_LABEL[category]})`;
}

/**
 * On-demand BM lexicon block — injected when Malay turn text matches curated entries.
 * Pattern mirrors Quran corpus: small verified reference, not full kamus.
 */
export function buildBmLexiconPromptBlock(
  message: string,
  recentUserText = '',
): string | null {
  if (!isBmLexiconLoaded()) return null;

  const probe = `${recentUserText}\n${message}`.trim();
  const meta = getBmLexiconMeta();
  const limit = meta?.maxInjectPerTurn ?? 12;
  const matches = matchBmLexiconEntries(probe, limit);
  if (!matches.length) return null;

  const lines: string[] = [
    '[BM MALAYSIA LEXICON — ON-DEMAND]',
    'Matched tokens in this turn. In your reply use CORRECT (BM Malaysia) only — never WRONG (Indonesia / slip).',
  ];

  if (meta?.source) {
    lines.push(`Source: ${meta.source}`);
  }

  lines.push('');
  for (const entry of matches) {
    lines.push(formatEntryLine(entry.wrong, entry.correct, entry.category));
  }

  lines.push(
    '',
    'RULE: Reply in Bahasa Melayu Malaysia — indah, lembut, bijaksana, penuh adab. Do not substitute Indonesian forms or wrong spelling above.',
    'This block is a lexical guard — not a register cage. Voice flows freely within Malaysian Malay.',
  );

  return lines.join('\n');
}

export function getBmLexiconSystemNote(): string {
  return `
BM MALAYSIA LEXICON (Tier 2.5 — curated BM/ID divergence):
When [BM MALAYSIA LEXICON] appears, it lists wrong→correct pairs for tokens detected this turn.
Use CORRECT forms only. Never default to Indonesian because the base model trained on more Indonesian text.
`.trim();
}
