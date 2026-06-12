/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : BM Malaysia Lexicon Service
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

import fs from 'fs';
import path from 'path';
import { ENV } from '../config/environments';
import type { BmLexiconEntry, BmLexiconFile } from './bm-lexicon.types';

let lexiconCache: BmLexiconFile | null = null;
let lexiconLoadAttempted = false;
let wrongTokenIndex: Map<string, BmLexiconEntry[]> | null = null;

function resolveLexiconPath(): string {
  const cwd = process.cwd();
  const monorepoSibling = path.resolve(cwd, '..', 'alm-backend', 'data/malay-malaysia/lexicon.json');
  const monorepoSiblingRoot = path.resolve(cwd, '..', 'alm-backend');

  const candidates = [
    ENV.BM_LEXICON_PATH,
    fs.existsSync(monorepoSiblingRoot) ? monorepoSibling : '',
    path.resolve(cwd, 'data/malay-malaysia/lexicon.json'),
    path.resolve(__dirname, '../../data/malay-malaysia/lexicon.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0] ?? path.resolve(cwd, 'data/malay-malaysia/lexicon.json');
}

function buildWrongTokenIndex(entries: BmLexiconEntry[]): Map<string, BmLexiconEntry[]> {
  const index = new Map<string, BmLexiconEntry[]>();
  for (const entry of entries) {
    const key = entry.wrong.toLowerCase();
    const list = index.get(key) ?? [];
    list.push(entry);
    index.set(key, list);
  }
  return index;
}

function loadLexicon(): BmLexiconFile | null {
  if (lexiconLoadAttempted) return lexiconCache;
  lexiconLoadAttempted = true;

  if (!ENV.BM_LEXICON_ENABLED) return null;

  const lexiconPath = resolveLexiconPath();
  if (!fs.existsSync(lexiconPath)) {
    console.warn(`[BM Lexicon] Missing ${lexiconPath}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(lexiconPath, 'utf8');
    lexiconCache = JSON.parse(raw) as BmLexiconFile;
    wrongTokenIndex = buildWrongTokenIndex(lexiconCache.entries ?? []);
    return lexiconCache;
  } catch (err) {
    console.error('[BM Lexicon] Failed to load lexicon:', err);
    return null;
  }
}

export function isBmLexiconLoaded(): boolean {
  return Boolean(loadLexicon()?.entries?.length);
}

export function getBmLexiconMeta(): Pick<BmLexiconFile, 'version' | 'source' | 'maxInjectPerTurn'> | null {
  const lexicon = loadLexicon();
  if (!lexicon) return null;
  return {
    version:          lexicon.version,
    source:           lexicon.source,
    maxInjectPerTurn: lexicon.maxInjectPerTurn ?? 12,
  };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordPatternFor(wrong: string): RegExp {
  if (wrong.includes('-')) {
    return new RegExp(`\\b${escapeRegex(wrong)}\\b`, 'gi');
  }
  return new RegExp(`\\b${escapeRegex(wrong)}\\b`, 'gi');
}

/** Match lexicon entries present in text (case-insensitive, word boundary). */
export function matchBmLexiconEntries(
  text: string,
  limit = 12,
): BmLexiconEntry[] {
  const lexicon = loadLexicon();
  if (!lexicon?.entries?.length || !text.trim()) return [];

  const cap = limit || lexicon.maxInjectPerTurn || 12;
  const lower = text.toLowerCase();
  const matched: BmLexiconEntry[] = [];
  const seen = new Set<string>();

  for (const entry of lexicon.entries) {
    if (matched.length >= cap) break;
    if (seen.has(entry.id)) continue;
    const pattern = wordPatternFor(entry.wrong);
    pattern.lastIndex = 0;
    if (pattern.test(lower) || pattern.test(text)) {
      matched.push(entry);
      seen.add(entry.id);
    }
  }

  return matched;
}

function isActionableReplacement(entry: BmLexiconEntry): boolean {
  if (!entry.wrong.trim()) return false;
  return entry.wrong.toLowerCase() !== entry.correct.toLowerCase();
}

/** Replacement rules for post-stream guard — longest wrong tokens first. */
export function getBmLexiconReplacementRules(): ReadonlyArray<[RegExp, string]> {
  const lexicon = loadLexicon();
  if (!lexicon?.entries?.length) return [];

  const sorted = [...lexicon.entries]
    .filter(isActionableReplacement)
    .sort((a, b) => b.wrong.length - a.wrong.length);

  return sorted.map((entry) => [wordPatternFor(entry.wrong), entry.correct]);
}

/** id_drift markers for drift detection — single-token wrong forms only. */
export function getBmLexiconDriftMarkerPattern(): RegExp | null {
  const lexicon = loadLexicon();
  if (!lexicon?.entries?.length) return null;

  const tokens = lexicon.entries
    .filter((e) => e.category === 'id_drift' && isActionableReplacement(e))
    .map((e) => e.wrong.trim())
    .filter((w) => w.length > 0 && !w.includes(' '));

  if (!tokens.length) return null;

  const escaped = [...new Set(tokens)]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);

  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'i');
}

export function applyBmLexiconReplacements(text: string): string {
  if (!text?.trim()) return text;
  let out = text;
  for (const [pattern, replacement] of getBmLexiconReplacementRules()) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
