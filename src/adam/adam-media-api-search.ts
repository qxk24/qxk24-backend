/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media API Search (Licensed Stock + Archive)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Licensed media discovery via public APIs (no topic hardcoding).
 * Image: Unsplash, Pexels, Pixabay, Openverse (+ Wikimedia elsewhere).
 * Video: Pexels, Pixabay, Internet Archive (+ corpus / Wikimedia elsewhere).
 */

import type { AdamMediaSearchHit } from './adam-media-search';

const API_FETCH_TIMEOUT_MS = 3_500;

const OPENVERSE_LICENSE_ALLOW =
  /^(cc0|pdm|by|by-sa|by-nc|by-nc-sa|cc-by|cc-by-sa)$/i;

/** Hosts that often 403 when hotlinked in <img> — skip for chat embed. */
const OPENVERSE_BLOCKED_IMAGE_HOST_RE =
  /(?:^|\.)flickr\.com$|(?:^|\.)staticflickr\.com$|(?:^|\.)pinimg\.com$/i;

function isEmbeddableOpenverseImageUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname;
    if (OPENVERSE_BLOCKED_IMAGE_HOST_RE.test(host)) return false;
    if (host.endsWith('wikimedia.org')) return true;
    if (/\.(?:jpe?g|png|webp|gif|svg)(?:\?|$)/i.test(url)) return true;
    return false;
  } catch {
    return false;
  }
}

function pickOpenverseImageUrl(item: {
  url?: string;
  thumbnail?: string | null;
}): string | null {
  const url = item.url?.trim();
  const thumb = item.thumbnail?.trim();
  if (url && url.includes('wikimedia.org') && isEmbeddableOpenverseImageUrl(url)) {
    return url;
  }
  if (thumb && isEmbeddableOpenverseImageUrl(thumb)) return thumb;
  if (url && isEmbeddableOpenverseImageUrl(url)) return url;
  return null;
}

export interface AdamMediaApiKeys {
  pexels:    string;
  pixabay:   string;
  unsplash:  string;
}

export function getAdamMediaApiKeys(): AdamMediaApiKeys {
  return {
    pexels:   (process.env.ADAM_PEXELS_API_KEY ?? process.env.PEXELS_API_KEY ?? '').trim(),
    pixabay:  (process.env.ADAM_PIXABAY_API_KEY ?? process.env.PIXABAY_API_KEY ?? '').trim(),
    unsplash: (process.env.ADAM_UNSPLASH_ACCESS_KEY ?? process.env.UNSPLASH_ACCESS_KEY ?? '').trim(),
  };
}

async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = API_FETCH_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickBestMp4Url(candidates: { url?: string; quality?: string }[]): string | null {
  const files = candidates
    .map((f) => ({ url: f.url?.trim() ?? '', quality: (f.quality ?? '').toLowerCase() }))
    .filter((f) => f.url && /\.mp4(?:\?|$)/i.test(f.url));
  if (files.length === 0) return null;
  const rank = (q: string) => {
    if (q.includes('hd') || q.includes('1080')) return 3;
    if (q.includes('sd') || q.includes('720')) return 2;
    return 1;
  };
  files.sort((a, b) => rank(b.quality) - rank(a.quality));
  return files[0]?.url ?? null;
}

async function fetchPexelsImages(query: string, apiKey: string): Promise<AdamMediaSearchHit[]> {
  const params = new URLSearchParams({ query, per_page: '3', orientation: 'landscape' });
  const json = await fetchJson<{
    photos?: { alt?: string; src?: { large?: string; medium?: string } }[];
  }>(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  });
  const hits: AdamMediaSearchHit[] = [];
  for (const photo of json?.photos ?? []) {
    const url = photo.src?.large?.trim() || photo.src?.medium?.trim();
    if (!url) continue;
    hits.push({
      kind:   'image',
      url,
      title:  photo.alt?.trim() || query,
      source: 'pexels',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

async function fetchPexelsVideos(query: string, apiKey: string): Promise<AdamMediaSearchHit[]> {
  const params = new URLSearchParams({ query, per_page: '3' });
  const json = await fetchJson<{
    videos?: {
      url?: string;
      image?: string;
      video_files?: { link?: string; quality?: string; file_type?: string }[];
    }[];
  }>(`https://api.pexels.com/videos/search?${params}`, {
    headers: { Authorization: apiKey },
  });
  const hits: AdamMediaSearchHit[] = [];
  for (const video of json?.videos ?? []) {
    const mp4 = pickBestMp4Url(
      (video.video_files ?? []).map((f) => ({ url: f.link, quality: f.quality })),
    );
    const url = mp4 || video.url?.trim();
    if (!url) continue;
    hits.push({
      kind:   'video',
      url,
      title:  query,
      source: 'pexels',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

async function fetchPixabayImages(query: string, apiKey: string): Promise<AdamMediaSearchHit[]> {
  const params = new URLSearchParams({
    key:        apiKey,
    q:          query,
    image_type: 'photo',
    per_page:   '3',
    safesearch: 'true',
  });
  const json = await fetchJson<{
    hits?: { largeImageURL?: string; webformatURL?: string; tags?: string }[];
  }>(`https://pixabay.com/api/?${params}`);
  const hits: AdamMediaSearchHit[] = [];
  for (const hit of json?.hits ?? []) {
    const url = hit.largeImageURL?.trim() || hit.webformatURL?.trim();
    if (!url) continue;
    hits.push({
      kind:   'image',
      url,
      title:  hit.tags?.split(',')[0]?.trim() || query,
      source: 'pixabay',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

async function fetchPixabayVideos(query: string, apiKey: string): Promise<AdamMediaSearchHit[]> {
  const params = new URLSearchParams({
    key:        apiKey,
    q:          query,
    per_page:   '3',
    safesearch: 'true',
  });
  const json = await fetchJson<{
    hits?: {
      tags?: string;
      videos?: {
        large?: { url?: string };
        medium?: { url?: string };
        small?: { url?: string };
      };
    }[];
  }>(`https://pixabay.com/api/videos/?${params}`);
  const hits: AdamMediaSearchHit[] = [];
  for (const hit of json?.hits ?? []) {
    const url =
      hit.videos?.large?.url?.trim()
      || hit.videos?.medium?.url?.trim()
      || hit.videos?.small?.url?.trim();
    if (!url) continue;
    hits.push({
      kind:   'video',
      url,
      title:  hit.tags?.split(',')[0]?.trim() || query,
      source: 'pixabay',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

interface UnsplashSearchPhoto {
  id?:               string;
  alt_description?:    string | null;
  description?:      string | null;
  urls?:             { regular?: string; small?: string };
  links?:            { download_location?: string; html?: string };
  user?:             { name?: string };
}

function unsplashAuthHeaders(accessKey: string): Record<string, string> {
  return { Authorization: `Client-ID ${accessKey}` };
}

/** Unsplash API requires triggering download_location when a photo is used. */
export function triggerUnsplashDownload(
  downloadLocation: string | undefined,
  accessKey: string,
): void {
  const loc = downloadLocation?.trim();
  if (!loc || !accessKey) return;
  void fetchJson<{ url?: string }>(loc, { headers: unsplashAuthHeaders(accessKey) }, 2_000);
}

export function formatUnsplashImageAttribution(
  photo: Pick<UnsplashSearchPhoto, 'alt_description' | 'description' | 'user'>,
  query: string,
): string {
  const base = photo.alt_description?.trim()
    || photo.description?.trim()
    || query;
  const photographer = photo.user?.name?.trim();
  if (photographer) return `${base} (Foto: ${photographer} / Unsplash)`;
  return `${base} (Unsplash)`;
}

async function fetchUnsplashImages(query: string, accessKey: string): Promise<AdamMediaSearchHit[]> {
  const params = new URLSearchParams({
    query,
    per_page:       '3',
    orientation:    'landscape',
    order_by:       'relevant',
    content_filter: 'low',
  });
  const json = await fetchJson<{ results?: UnsplashSearchPhoto[] }>(
    `https://api.unsplash.com/search/photos?${params}`,
    { headers: unsplashAuthHeaders(accessKey) },
  );
  const hits: AdamMediaSearchHit[] = [];
  for (const photo of json?.results ?? []) {
    const url = photo.urls?.regular?.trim();
    if (!url) continue;
    triggerUnsplashDownload(photo.links?.download_location, accessKey);
    hits.push({
      kind:   'image',
      url,
      title:  formatUnsplashImageAttribution(photo, query),
      source: 'unsplash',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

async function fetchOpenverseImages(query: string): Promise<AdamMediaSearchHit[]> {
  const params = new URLSearchParams({
    q:         query,
    page_size: '5',
    license:   'cc0,pdm,by,by-sa',
  });
  const json = await fetchJson<{
    results?: { title?: string; url?: string; thumbnail?: string | null; license?: string }[];
  }>(`https://api.openverse.org/v1/images/?${params}`);
  const hits: AdamMediaSearchHit[] = [];
  for (const item of json?.results ?? []) {
    const license = (item.license ?? '').trim();
    if (license && !OPENVERSE_LICENSE_ALLOW.test(license)) continue;
    const url = pickOpenverseImageUrl(item);
    if (!url) continue;
    hits.push({
      kind:   'image',
      url,
      title:  item.title?.trim() || query,
      source: 'openverse',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

async function fetchInternetArchiveVideos(query: string): Promise<AdamMediaSearchHit[]> {
  const q = encodeURIComponent(`${query}`);
  const url =
    `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title&rows=4&page=1&output=json`
    + '&fq=mediatype:(movies OR educational_films OR animation)';
  const json = await fetchJson<{
    response?: { docs?: { identifier?: string; title?: string | string[] }[] };
  }>(url);
  const hits: AdamMediaSearchHit[] = [];
  for (const doc of json?.response?.docs ?? []) {
    const id = doc.identifier?.trim();
    if (!id) continue;
    const rawTitle = doc.title;
    const title = Array.isArray(rawTitle) ? rawTitle[0] : rawTitle;
    hits.push({
      kind:   'video',
      url:    `https://archive.org/embed/${id}`,
      title:  (title ?? query).toString().trim(),
      source: 'internet_archive',
    });
    if (hits.length >= 2) break;
  }
  return hits;
}

/** Parallel licensed API search — skips providers without API keys. */
export async function fetchLicensedMediaFromApis(input: {
  query:        string;
  wantImage:    boolean;
  wantVideo:    boolean;
  /** Technical/educational turn — Wikimedia/Openverse only; no stock photo/video APIs. */
  educational?: boolean;
}): Promise<AdamMediaSearchHit[]> {
  const query = input.query.trim();
  if (!query) return [];

  const keys = getAdamMediaApiKeys();
  const tasks: Promise<AdamMediaSearchHit[]>[] = [];
  const educational = input.educational === true;

  if (input.wantImage) {
    if (!educational) {
      if (keys.unsplash) tasks.push(fetchUnsplashImages(query, keys.unsplash));
      if (keys.pexels) tasks.push(fetchPexelsImages(query, keys.pexels));
      if (keys.pixabay) tasks.push(fetchPixabayImages(query, keys.pixabay));
    }
    tasks.push(fetchOpenverseImages(query));
  }

  if (input.wantVideo && !educational) {
    if (keys.pexels) tasks.push(fetchPexelsVideos(query, keys.pexels));
    if (keys.pixabay) tasks.push(fetchPixabayVideos(query, keys.pixabay));
    tasks.push(fetchInternetArchiveVideos(query));
  }

  if (tasks.length === 0) return [];

  const batches = await Promise.allSettled(tasks);
  const merged: AdamMediaSearchHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    if (batch.status !== 'fulfilled') continue;
    for (const hit of batch.value) {
      const key = `${hit.kind}:${hit.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
    }
  }
  return merged;
}
