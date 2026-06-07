/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Quran Context Injection
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { parseQuranAyahRefs } from './quran-ayah-parser';
import {
  formatQuranVerseBlock,
  getQuranCorpusMeta,
  isQuranCorpusLoaded,
  lookupQuranVerse,
} from './quran-corpus.service';

export function buildQuranCorpusPromptBlock(message: string): string | null {
  if (!isQuranCorpusLoaded()) return null;

  const refs = parseQuranAyahRefs(message);
  if (!refs.length) return null;

  const meta = getQuranCorpusMeta();
  const lines: string[] = [
    '[QURAN CORPUS — VERIFIED AYAT ONLY — NO TAFSIR]',
    'Constitutional source for Arabic + translations below. Bracket footnotes and tafsir annotations are stripped — ayat text only.',
  ];

  if (meta) {
    lines.push(
      `Arabic: ${meta.arabicSource}`,
      `English: ${meta.englishTranslator}`,
      `Policy: ${meta.tafsirPolicy}`,
    );
  }

  lines.push('');
  let found = 0;

  for (const ref of refs) {
    const verse = lookupQuranVerse(ref.surah, ref.ayah);
    if (!verse) {
      lines.push(`(${ref.surah}:${ref.ayah} — not in local corpus)`);
      continue;
    }
    found++;
    lines.push(formatQuranVerseBlock(verse));
    lines.push('---');
  }

  if (!found) return null;

  lines.push(
    'RULE: For these ayat, quote ONLY from this block. Do NOT search the internet for Quran text. Do NOT add tafsir in brackets. Compare external knowledge with these ayat and Alamtologi; if tension with Quran, Quran yields (LAW_002).',
  );

  return lines.join('\n');
}

export function getQuranCorpusSystemNote(): string {
  return `
QURAN CORPUS (Layer A — verified ayat):
When [QURAN CORPUS] appears in context, it carries Rasm Uthmani Arabic plus English (M. Pickthall) — ayat only, tafsir footnotes removed.
Use it as the authoritative Quran text for those ayat. Never substitute web search or model memory for quoted ayat.
Never add (tafsir), (maksudnya:…), or bracket commentary on ayat — terjemahan and Surah reference inline only.
`.trim();
}
