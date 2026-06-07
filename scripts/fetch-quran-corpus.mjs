#!/usr/bin/env node
/**
 * Fetch verified Quran corpus: Rasm Uthmani + Pickthall (EN).
 * Strips HTML footnotes and bracket tafsir from translations at ingest.
 *
 * Usage: node scripts/fetch-quran-corpus.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../data/quran');
const OUT_FILE = path.join(OUT_DIR, 'corpus.json');

const UTHMANI_URL = 'https://api.quran.com/api/v4/quran/verses/uthmani';
/** M. Pickthall — quran.com resource id 19 */
const EN_URL = 'https://api.quran.com/api/v4/quran/translations/19';

function sanitizeTranslation(text) {
  return text
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeArabic(text) {
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'QXK24-QuranCorpus/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log('[Quran Corpus] Fetching Uthmani + EN (Pickthall)…');

  const [uthmani, english] = await Promise.all([
    fetchJson(UTHMANI_URL),
    fetchJson(EN_URL),
  ]);

  const uthmaniVerses = uthmani.verses;
  const enLines = english.translations;

  if (!uthmaniVerses?.length || !enLines?.length) {
    throw new Error('Unexpected API response shape');
  }

  if (uthmaniVerses.length !== enLines.length) {
    throw new Error(
      `Verse count mismatch: uthmani=${uthmaniVerses.length} en=${enLines.length}`,
    );
  }

  const verses = {};

  for (let i = 0; i < uthmaniVerses.length; i++) {
    const u = uthmaniVerses[i];
    const [surahStr, ayahStr] = u.verse_key.split(':');
    const surah = Number(surahStr);
    const ayah = Number(ayahStr);
    const key = u.verse_key;

    verses[key] = {
      surah,
      ayah,
      key,
      uthmani: sanitizeArabic(u.text_uthmani),
      english: sanitizeTranslation(enLines[i].text),
    };
  }

  const corpus = {
    meta: {
      arabicSource:      'Rasm Uthmani (Medina mushaf script via Quran.com API)',
      englishTranslator: 'M. Pickthall (Mohammed Marmaduke William Pickthall)',
      tafsirPolicy:      'Ayat only — HTML footnotes and [bracket] tafsir stripped at ingest',
      fetchedAt:         new Date().toISOString(),
    },
    verses,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(corpus, null, 0), 'utf8');

  console.log(`[Quran Corpus] Wrote ${Object.keys(verses).length} ayat → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('[Quran Corpus] Fetch failed:', err);
  process.exit(1);
});
