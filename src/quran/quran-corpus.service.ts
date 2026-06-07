/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Quran Corpus Service
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
 *
 * Verified ayat only — Rasm Uthmani + Pickthall (EN).
 * Tafsir footnotes in brackets/HTML are stripped at ingest.
 */

import fs from 'fs';
import path from 'path';
import { ENV } from '../config/environments';
import type { QuranCorpusFile, QuranVerseRecord } from './quran-types';
import { SURAH_NUMBER_TO_NAME } from './quran-surah-names';

let corpusCache: QuranCorpusFile | null = null;
let corpusLoadAttempted = false;

function resolveCorpusPath(): string {
  const cwd = process.cwd();
  const monorepoSibling = path.resolve(cwd, '..', 'alm-backend', 'data/quran/corpus.json');
  const monorepoSiblingRoot = path.resolve(cwd, '..', 'alm-backend');

  const candidates = [
    ENV.QURAN_CORPUS_PATH,
    fs.existsSync(monorepoSiblingRoot) ? monorepoSibling : '',
    path.resolve(cwd, 'data/quran/corpus.json'),
    path.resolve(__dirname, '../../data/quran/corpus.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0] ?? path.resolve(cwd, 'data/quran/corpus.json');
}

function loadCorpus(): QuranCorpusFile | null {
  if (corpusLoadAttempted) return corpusCache;
  corpusLoadAttempted = true;

  if (!ENV.QURAN_CORPUS_ENABLED) return null;

  const corpusPath = resolveCorpusPath();
  if (!fs.existsSync(corpusPath)) {
    console.warn(
      `[Quran Corpus] Missing ${corpusPath} — run: npm run quran:fetch`,
    );
    return null;
  }

  try {
    const raw = fs.readFileSync(corpusPath, 'utf8');
    corpusCache = JSON.parse(raw) as QuranCorpusFile;
    return corpusCache;
  } catch (err) {
    console.error('[Quran Corpus] Failed to load corpus:', err);
    return null;
  }
}

export function isQuranCorpusLoaded(): boolean {
  return Boolean(loadCorpus()?.verses);
}

export function lookupQuranVerse(surah: number, ayah: number): QuranVerseRecord | null {
  const corpus = loadCorpus();
  if (!corpus) return null;
  return corpus.verses[`${surah}:${ayah}`] ?? null;
}

export function getQuranCorpusMeta(): QuranCorpusFile['meta'] | null {
  return loadCorpus()?.meta ?? null;
}

export function formatQuranVerseBlock(verse: QuranVerseRecord): string {
  const name = SURAH_NUMBER_TO_NAME[verse.surah] ?? `Surah ${verse.surah}`;
  const enLabel = getQuranCorpusMeta()?.englishTranslator ?? 'M. Pickthall';
  return [
    `Surah ${verse.surah} (${name}) — Ayah ${verse.ayah} [${verse.key}]`,
    `Arabic (Rasm Uthmani): ${verse.uthmani}`,
    `English (${enLabel}): ${verse.english}`,
  ].join('\n');
}

/** Reset cache — for tests */
export function resetQuranCorpusCache(): void {
  corpusCache = null;
  corpusLoadAttempted = false;
}
