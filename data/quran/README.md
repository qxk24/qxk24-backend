# Quran Corpus — Verified Ayat Only

ADAM uses a **local verified corpus** for Quran text — not web search, not model memory.

## Contents

| Field | Source |
|-------|--------|
| Arabic | Rasm Uthmani (Medina mushaf script) |
| Malay | Abdullah Muhammad Basmeih |
| English | Saheeh International |

**Tafsir policy:** Footnotes in `<sup>…</sup>`, HTML, and `[brackets]` are **stripped at ingest**. Only ayat text is stored.

## Build corpus (required once per server)

```bash
cd qxk24-backend
npm run quran:fetch
```

Writes `data/quran/corpus.json` (~6236 ayat).

## Usage in chat

When P.alt cites `2:255`, `Surah Al-Baqarah ayat 255`, etc., ADAM injects `[QURAN CORPUS]` with verified text before the LLM turn.

## Env

```env
QURAN_CORPUS_ENABLED=true
# QURAN_CORPUS_PATH=/var/www/qxk24/backend/data/quran/corpus.json
```

## Deploy

Include `data/quran/corpus.json` on VPS (run `npm run quran:fetch` after deploy) or rsync the file from your Mac.
