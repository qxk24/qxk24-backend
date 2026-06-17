/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Search (Image + Video)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Konvensional image/video discovery for technical chat turns.
 * Sources: prefetched web hits + licensed APIs (Pexels, Pixabay, Unsplash,
 * Openverse, Internet Archive) + Wikimedia Commons. Timeboxed (~6s).
 */

import type { LlmSearchResult } from '../llm/llm-types';
import { fetchLicensedMediaFromApis } from './adam-media-api-search';
import { wikimediaThumbToDirectUrl } from './adam-chat-image-url';
import {
  extractYouTubeVideoId,
  isTrustedDirectVideoUrl,
  normalizeAdamChatVideoUrl,
} from './adam-chat-video-url';
import {
  isAdamTechnicalKonvensionalDisplayTurn,
} from './adam-response-generation';

export type AdamMediaKind = 'image' | 'video';

export interface AdamMediaSearchHit {
  kind:   AdamMediaKind;
  url:    string;
  title:  string;
  source: string;
}

const MEDIA_FETCH_TIMEOUT_MS = 4_500;
/** Hard cap — never block prompt/repair longer than this for media discovery. */
const MEDIA_SEARCH_TOTAL_MS = 6_000;

const IMAGE_EXT_RE = /\.(?:jpe?g|png|webp|gif|svg)(?:\?|$)/i;
const YOUTUBE_ID_CAPTURE_RE =
  /(?:youtube\.com\/watch\?(?:[^#\s]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;
const VIMEO_ID_CAPTURE_RE = /vimeo\.com\/(?:video\/)?(\d+)/gi;
const KHAN_URL_CAPTURE_RE =
  /https?:\/\/(?:www\.)?khanacademy\.org\/(?:v|embed-video\/|[^\s"'<>]*\/v\/)[^\s"'<>]+/gi;
const DIRECT_VIDEO_URL_CAPTURE_RE =
  /(https:\/\/[^\s"'<>]+\.(?:mp4|webm|ogv|mov|m4v)(?:\?[^\s"'<>]*)?)/gi;
const ARCHIVE_URL_CAPTURE_RE =
  /https?:\/\/archive\.org\/(?:embed|details)\/([^/?#\s"'<>]+)/gi;
const STOCK_IMAGE_CAPTURE_RE =
  /(https:\/\/(?:images\.pexels\.com|images\.unsplash\.com|cdn\.pixabay\.com)[^\s"'<>]+)/gi;
const WIKIMEDIA_IMAGE_RE =
  /(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^\s"'<>]+)/gi;

const TRUSTED_IMAGE_HOST_RE =
  /(?:^|\.)wikimedia\.org$|(?:^|\.)wikipedia\.org$|(?:^|\.)britannica\.com$|(?:^|\.)nasa\.gov$|(?:^|\.)pexels\.com$|(?:^|\.)pixabay\.com$|(?:^|\.)unsplash\.com$/i;

const IMAGE_SOURCE_PRIORITY: Record<string, number> = {
  wikimedia_commons: 0,
  web_search:        1,
  openverse:         2,
  unsplash:          8,
  pexels:            9,
  pixabay:           10,
};

const VIDEO_SOURCE_PRIORITY: Record<string, number> = {
  youtube:           0,
  web_search:        1,
  wikimedia_commons: 2,
  internet_archive:  3,
  pexels:            9,
  pixabay:           10,
};

export function isAdamMediaSearchTurn(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (isAdamTechnicalKonvensionalDisplayTurn(t)) return true;
  return /\b(?:gambar|imej|image|video|tonton|illustration|diagram|animasi|youtube)\b/i.test(t);
}

export function userWantsVideoMedia(message: string): boolean {
  const t = message.trim();
  if (isAdamTechnicalKonvensionalDisplayTurn(t)) return true;
  return /\b(?:video|tonton|youtube|animasi)\b/i.test(t);
}

export function buildAdamMediaSearchQuery(message: string): string {
  return message
    .replace(/^\[[^\]]+\]:\s*/, '')
    .replace(/\b(?:apa|itu|adakah|jelaskan|terangkan|huraikan|bagaimana|what|is|explain|show|tunjuk)\b/gi, ' ')
    .replace(/\b(?:gambar|imej|image|video|tonton|diagram)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 96);
}

function isTrustedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname.endsWith('wikimedia.org')) return true;
    if (/(?:^|\.)pexels\.com$|(?:^|\.)pixabay\.com$|(?:^|\.)unsplash\.com$/i.test(parsed.hostname)) {
      return true;
    }
    if (IMAGE_EXT_RE.test(parsed.pathname) && TRUSTED_IMAGE_HOST_RE.test(parsed.hostname)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function normalizeImageUrl(url: string): string {
  return wikimediaThumbToDirectUrl(url) ?? url.trim();
}

function pushUnique(
  out: AdamMediaSearchHit[],
  seen: Set<string>,
  hit: AdamMediaSearchHit,
): void {
  const key = `${hit.kind}:${hit.url}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push(hit);
}

function pushVideoHit(
  hits: AdamMediaSearchHit[],
  seen: Set<string>,
  rawUrl: string,
  title: string,
  source = 'web_search',
): void {
  const url = normalizeAdamChatVideoUrl(rawUrl);
  if (!url || seen.has(url)) return;
  seen.add(url);
  const resolvedSource = extractYouTubeVideoId(url) ? 'youtube' : source;
  hits.push({
    kind:   'video',
    url,
    title:  title.trim() || 'Video rujukan',
    source: resolvedSource,
  });
}

function isWikimediaImageHit(hit: AdamMediaSearchHit): boolean {
  return hit.kind === 'image' && hit.url.includes('wikimedia.org');
}

function isYouTubeVideoHit(hit: AdamMediaSearchHit): boolean {
  return hit.kind === 'video' && (hit.source === 'youtube' || Boolean(extractYouTubeVideoId(hit.url)));
}

function pickBestImage(hits: AdamMediaSearchHit[]): AdamMediaSearchHit | undefined {
  if (hits.length === 0) return undefined;
  const wiki = hits.find(isWikimediaImageHit);
  if (wiki) return wiki;
  const sorted = [...hits].sort(
    (a, b) => (IMAGE_SOURCE_PRIORITY[a.source] ?? 99) - (IMAGE_SOURCE_PRIORITY[b.source] ?? 99),
  );
  return sorted[0];
}

function pickBestVideo(hits: AdamMediaSearchHit[]): AdamMediaSearchHit | undefined {
  if (hits.length === 0) return undefined;
  const youtube = hits.find(isYouTubeVideoHit);
  if (youtube) return youtube;
  const sorted = [...hits].sort(
    (a, b) => (VIDEO_SOURCE_PRIORITY[a.source] ?? 99) - (VIDEO_SOURCE_PRIORITY[b.source] ?? 99),
  );
  return sorted[0];
}

function extractYouTubeHitsFromText(text: string, title: string): AdamMediaSearchHit[] {
  const hits: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();
  YOUTUBE_ID_CAPTURE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = YOUTUBE_ID_CAPTURE_RE.exec(text)) !== null) {
    const id = match[1];
    if (!id) continue;
    pushVideoHit(hits, seen, `https://www.youtube.com/watch?v=${id}`, title);
  }
  return hits;
}

function extractOtherVideoHitsFromText(text: string, title: string): AdamMediaSearchHit[] {
  const hits: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();

  VIMEO_ID_CAPTURE_RE.lastIndex = 0;
  let vimeo: RegExpExecArray | null;
  while ((vimeo = VIMEO_ID_CAPTURE_RE.exec(text)) !== null) {
    const id = vimeo[1];
    if (!id) continue;
    pushVideoHit(hits, seen, `https://vimeo.com/${id}`, title);
  }

  KHAN_URL_CAPTURE_RE.lastIndex = 0;
  let khan: RegExpExecArray | null;
  while ((khan = KHAN_URL_CAPTURE_RE.exec(text)) !== null) {
    pushVideoHit(hits, seen, khan[0], title);
  }

  DIRECT_VIDEO_URL_CAPTURE_RE.lastIndex = 0;
  let direct: RegExpExecArray | null;
  while ((direct = DIRECT_VIDEO_URL_CAPTURE_RE.exec(text)) !== null) {
    const raw = direct[1]?.trim();
    if (!raw || !isTrustedDirectVideoUrl(raw)) continue;
    pushVideoHit(hits, seen, raw, title);
  }

  ARCHIVE_URL_CAPTURE_RE.lastIndex = 0;
  let archive: RegExpExecArray | null;
  while ((archive = ARCHIVE_URL_CAPTURE_RE.exec(text)) !== null) {
    const id = archive[1]?.trim();
    if (!id) continue;
    pushVideoHit(hits, seen, `https://archive.org/embed/${id}`, title);
  }

  return hits;
}

function extractImageHitsFromText(text: string, title: string): AdamMediaSearchHit[] {
  const hits: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();
  WIKIMEDIA_IMAGE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKIMEDIA_IMAGE_RE.exec(text)) !== null) {
    const raw = match[1]?.trim();
    if (!raw || !isTrustedImageUrl(raw)) continue;
    const url = normalizeImageUrl(raw);
    if (seen.has(url)) continue;
    seen.add(url);
    hits.push({
      kind:   'image',
      url,
      title:  title.trim() || 'Imej rujukan',
      source: 'web_search',
    });
  }

  STOCK_IMAGE_CAPTURE_RE.lastIndex = 0;
  let stock: RegExpExecArray | null;
  while ((stock = STOCK_IMAGE_CAPTURE_RE.exec(text)) !== null) {
    const raw = stock[1]?.trim();
    if (!raw || !isTrustedImageUrl(raw)) continue;
    const url = normalizeImageUrl(raw);
    if (seen.has(url)) continue;
    seen.add(url);
    hits.push({
      kind:   'image',
      url,
      title:  title.trim() || 'Imej rujukan',
      source: 'web_search',
    });
  }

  return hits;
}

/** Pull image/video URLs from search hit url, title, and snippet — universal corpus scan. */
export function extractMediaFromSearchHits(hits: LlmSearchResult[]): AdamMediaSearchHit[] {
  const out: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    const title = hit.title?.trim() || 'Media rujukan';
    const url = (hit.url ?? '').trim();
    const corpus = [url, hit.title ?? '', hit.snippet ?? ''].filter(Boolean).join('\n');

    const videoFromUrl = normalizeAdamChatVideoUrl(url);
    if (videoFromUrl) {
      pushUnique(out, seen, {
        kind:   'video',
        url:    videoFromUrl,
        title,
        source: 'web_search',
      });
    } else if (isTrustedImageUrl(url)) {
      pushUnique(out, seen, {
        kind:   'image',
        url:    normalizeImageUrl(url),
        title,
        source: 'web_search',
      });
    }

    for (const v of extractYouTubeHitsFromText(corpus, title)) {
      pushUnique(out, seen, v);
    }
    for (const v of extractOtherVideoHitsFromText(corpus, title)) {
      pushUnique(out, seen, v);
    }
    for (const img of extractImageHitsFromText(corpus, title)) {
      pushUnique(out, seen, img);
    }
  }

  return out;
}

interface WikimediaPage {
  title?: string;
  imageinfo?: { url?: string; mime?: string }[];
}

async function fetchWikimediaMedia(query: string, wantVideo: boolean): Promise<AdamMediaSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    action:        'query',
    format:        'json',
    origin:        '*',
    generator:     'search',
    gsrsearch:     q,
    gsrnamespace:  '6',
    gsrlimit:      wantVideo ? '6' : '5',
    prop:          'imageinfo',
    iiprop:        'url|mime',
    iiurlwidth:    '960',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MEDIA_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
      { signal: controller.signal },
    );
    if (!res.ok) return [];
    const json = await res.json() as { query?: { pages?: Record<string, WikimediaPage> } };
    const pages = Object.values(json.query?.pages ?? {});
    const hits: AdamMediaSearchHit[] = [];

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const url = info?.url?.trim();
      const mime = info?.mime ?? '';
      if (!url) continue;

      const isVideo = mime.startsWith('video/');
      const isImage = mime.startsWith('image/');
      if (wantVideo && !isVideo) continue;
      if (!wantVideo && !isImage) continue;

      hits.push({
        kind:   isVideo ? 'video' : 'image',
        url:    isImage ? normalizeImageUrl(url) : url,
        title:  (page.title ?? 'Media Wikimedia').replace(/^File:/i, '').replace(/_/g, ' '),
        source: 'wikimedia_commons',
      });
      if (hits.length >= (wantVideo ? 2 : 2)) break;
    }

    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function capImageAndVideo(merged: AdamMediaSearchHit[], wantVideo: boolean): AdamMediaSearchHit[] {
  const images = merged.filter((h) => h.kind === 'image');
  const videos = merged.filter((h) => h.kind === 'video');
  const capped: AdamMediaSearchHit[] = [];
  const image = pickBestImage(images);
  const video = wantVideo ? pickBestVideo(videos) : undefined;
  if (image) capped.push(image);
  if (video) capped.push(video);
  if (capped.length === 0) {
    return merged.slice(0, wantVideo ? 2 : 1);
  }
  return capped;
}

/** Exported for tests — pick best image + video hits for a turn. */
export function capAdamMediaHits(
  merged: AdamMediaSearchHit[],
  wantVideo: boolean,
): AdamMediaSearchHit[] {
  return capImageAndVideo(merged, wantVideo);
}

async function runAdamMediaSearchCore(input: {
  userMessage:  string;
  searchHits?:  LlmSearchResult[];
  wikimedia?:   boolean;
}): Promise<AdamMediaSearchHit[]> {
  const query = buildAdamMediaSearchQuery(input.userMessage);
  if (!query) return [];

  const wantVideo = userWantsVideoMedia(input.userMessage);
  const educational = isAdamTechnicalKonvensionalDisplayTurn(input.userMessage);
  const fromWeb = extractMediaFromSearchHits(input.searchHits ?? []);

  const merged: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();
  const push = (hit: AdamMediaSearchHit) => pushUnique(merged, seen, hit);
  for (const hit of fromWeb) push(hit);

  let capped = capImageAndVideo(merged, wantVideo);
  const hasImage = capped.some((h) => h.kind === 'image');
  const hasVideo = capped.some((h) => h.kind === 'video');
  if (hasImage && (!wantVideo || hasVideo)) {
    return capped;
  }

  if (input.wikimedia === false) {
    return capped;
  }

  const fetches: Promise<AdamMediaSearchHit[]>[] = [];
  if (!hasImage) fetches.push(fetchWikimediaMedia(query, false));
  if (wantVideo && !hasVideo) {
    fetches.push(fetchWikimediaMedia(query, true));
    fetches.push(fetchWikimediaMedia(`${query} animation`, true));
  }
  fetches.push(fetchLicensedMediaFromApis({
    query,
    wantImage: !hasImage,
    wantVideo: wantVideo && !hasVideo,
    educational,
  }));

  if (fetches.length > 0) {
    const batches = await Promise.allSettled(fetches);
    for (const batch of batches) {
      if (batch.status !== 'fulfilled') continue;
      for (const hit of batch.value) push(hit);
    }
    capped = capImageAndVideo(merged, wantVideo);
  }

  return capped;
}

function webHitsOnly(input: {
  userMessage: string;
  searchHits?: LlmSearchResult[];
}): AdamMediaSearchHit[] {
  const wantVideo = userWantsVideoMedia(input.userMessage);
  return capImageAndVideo(extractMediaFromSearchHits(input.searchHits ?? []), wantVideo);
}

/** Discover konvensional image/video — prefetched search corpus + optional Wikimedia (timeboxed). */
export async function runAdamMediaSearch(input: {
  userMessage:   string;
  searchHits?:   LlmSearchResult[];
  /** Skip Wikimedia round-trip when prefetch already ran this turn. */
  webHitsOnly?:  boolean;
}): Promise<AdamMediaSearchHit[]> {
  if (!isAdamMediaSearchTurn(input.userMessage)) return [];

  if (input.webHitsOnly) {
    return webHitsOnly(input);
  }

  const core = runAdamMediaSearchCore({ ...input, wikimedia: true });
  const timer = new Promise<AdamMediaSearchHit[]>((resolve) => {
    setTimeout(() => resolve(webHitsOnly(input)), MEDIA_SEARCH_TOTAL_MS);
  });

  return Promise.race([core, timer]);
}

export function buildPrefetchedMediaContextBlock(hits: AdamMediaSearchHit[]): string {
  if (hits.length === 0) return '';

  const lines = hits.map((hit, i) => {
    const label = hit.kind === 'video' ? 'Video' : 'Imej';
    return `${i + 1}. [${label}] ${hit.title}\n   URL: ${hit.url}\n   Sumber: ${hit.source}`;
  });

  return `
MEDIA RUJUKAN (konvensional — WAJIB pada setiap jawapan teknikal):
- Selepas definisi / gambarajah Mermaid, masukkan SATU imej + SATU video (tag protokol, bukan markdown image):
  <adam-chat-image url="URL" alt="keterangan ringkas" />
  <adam-chat-video url="URL" title="tajuk video" />
- Wajib walaupun pengguna tidak minta "gambar" atau "video" secara eksplisit.
- Guna URL daripada hasil carian di bawah sahaja. Video: utamakan YouTube (embed rasmi). Imej: utamakan diagram Wikimedia / pendidikan — bukan stok literal.
${lines.join('\n')}
`.trim();
}
