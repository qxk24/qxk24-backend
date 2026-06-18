/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM YouTube Educational Search
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
 * Educational YouTube discovery — InnerTube primary (live benchmark 100%),
 * Invidious + DuckDuckGo HTML as fallbacks. No topic hardcoding.
 */

import type { AdamMediaSearchHit } from './adam-media-search';
import { extractYouTubeVideoId } from './adam-chat-video-url';

const YOUTUBE_SEARCH_TIMEOUT_MS = 4_200;
const YOUTUBE_INNERTUBE_CLIENT_VERSION = '2.20250331.00.00';
const YOUTUBE_INNERTUBE_SEARCH_URL =
  'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const YOUTUBE_ID_IN_HTML_RE =
  /(?:youtube\.com\/watch\?(?:[^#\s"'<>]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;

/** Public Invidious mirrors — tried in order until one returns hits. */
const INVIDIOUS_SEARCH_BASES = [
  'https://yewtu.be',
  'https://vid.puffyan.us',
  'https://invidious.projectsegfau.lt',
] as const;

interface InvidiousSearchItem {
  type?:     string;
  title?:    string;
  videoId?:  string;
}

function mergeYouTubeHits(batches: AdamMediaSearchHit[], limit = 2): AdamMediaSearchHit[] {
  const merged: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();
  for (const hit of batches) {
    const id = extractYouTubeVideoId(hit.url);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(hit);
    if (merged.length >= limit) break;
  }
  return merged;
}

/** Walk InnerTube JSON for 11-char videoId fields. */
export function extractInnerTubeVideoIds(payload: unknown): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const record = node as Record<string, unknown>;
    const videoId = record.videoId;
    if (typeof videoId === 'string' && videoId.length === 11 && !seen.has(videoId)) {
      seen.add(videoId);
      ids.push(videoId);
    }
    for (const value of Object.values(record)) walk(value);
  };

  walk(payload);
  return ids;
}

function hitsFromVideoIds(query: string, ids: string[]): AdamMediaSearchHit[] {
  return ids.slice(0, 2).map((id) => ({
    kind:   'video' as const,
    url:    `https://www.youtube.com/watch?v=${id}`,
    title:  query,
    source: 'youtube',
  }));
}

/** Primary — YouTube InnerTube search (no API key; query from Users turn). */
async function fetchYouTubeInnerTubeHits(query: string): Promise<AdamMediaSearchHit[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), YOUTUBE_SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(YOUTUBE_INNERTUBE_SEARCH_URL, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':   BROWSER_USER_AGENT,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName:    'WEB',
            clientVersion: YOUTUBE_INNERTUBE_CLIENT_VERSION,
            hl:            'ms',
            gl:            'MY',
          },
        },
        query,
      }),
    });
    if (!res.ok) return [];
    const payload = await res.json() as unknown;
    const ids = extractInnerTubeVideoIds(payload);
    return hitsFromVideoIds(query, ids);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchInvidiousYouTubeHits(
  base: string,
  query: string,
): Promise<AdamMediaSearchHit[]> {
  const url =
    `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), YOUTUBE_SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const items = await res.json() as InvidiousSearchItem[];
    if (!Array.isArray(items)) return [];

    const hits: AdamMediaSearchHit[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item.type !== 'video') continue;
      const id = item.videoId?.trim();
      if (!id || id.length !== 11 || seen.has(id)) continue;
      seen.add(id);
      hits.push({
        kind:   'video',
        url:    `https://www.youtube.com/watch?v=${id}`,
        title:  item.title?.trim() || query,
        source: 'youtube',
      });
      if (hits.length >= 2) break;
    }
    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchInvidiousYouTubeHitsAllBases(query: string): Promise<AdamMediaSearchHit[]> {
  for (const base of INVIDIOUS_SEARCH_BASES) {
    const hits = await fetchInvidiousYouTubeHits(base, query);
    if (hits.length > 0) return hits;
  }
  return [];
}

function extractYouTubeIdsFromHtml(html: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    YOUTUBE_ID_IN_HTML_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = YOUTUBE_ID_IN_HTML_RE.exec(raw)) !== null) {
      const id = match[1];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  };

  push(html);
  for (const uddg of html.matchAll(/uddg=([^&"']+)/gi)) {
    try {
      push(decodeURIComponent(uddg[1]!));
    } catch {
      push(uddg[1]!);
    }
  }
  return ids;
}

/** Last-resort DuckDuckGo HTML — often blocked (HTTP 202) on server IPs. */
async function fetchDuckDuckGoYouTubeHits(query: string): Promise<AdamMediaSearchHit[]> {
  const searchQuery = `${query} site:youtube.com`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), YOUTUBE_SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept:     'text/html',
        'User-Agent': BROWSER_USER_AGENT,
      },
    });
    if (res.status !== 200) return [];
    const html = await res.text();
    const ids = extractYouTubeIdsFromHtml(html);
    return hitsFromVideoIds(query, ids);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Discover embeddable YouTube educational videos for a konvensional topic query. */
export async function fetchYouTubeEducationalVideos(query: string): Promise<AdamMediaSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const innerTube = await fetchYouTubeInnerTubeHits(q);
  if (innerTube.length > 0) return innerTube;

  const settled = await Promise.allSettled([
    fetchInvidiousYouTubeHitsAllBases(q),
    fetchDuckDuckGoYouTubeHits(q),
  ]);

  const batches: AdamMediaSearchHit[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') batches.push(...result.value);
  }
  return mergeYouTubeHits(batches);
}

/** Pull YouTube URLs already present in a web-search corpus (title, url, snippet). */
export function extractYouTubeHitsFromSearchCorpus(
  rows: { title?: string; url?: string; snippet?: string }[],
): AdamMediaSearchHit[] {
  const hits: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const title = row.title?.trim() || 'Video rujukan';
    const corpus = [row.url ?? '', row.title ?? '', row.snippet ?? ''].join('\n');
    for (const id of extractYouTubeIdsFromHtml(corpus)) {
      if (seen.has(id)) continue;
      seen.add(id);
      hits.push({
        kind:   'video',
        url:    `https://www.youtube.com/watch?v=${id}`,
        title,
        source: 'youtube',
      });
    }
  }

  return hits.filter((h) => Boolean(extractYouTubeVideoId(h.url)));
}
