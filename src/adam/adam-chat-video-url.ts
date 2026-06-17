/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Video URL
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

export type AdamChatVideoSource = 'youtube' | 'vimeo' | 'khan' | 'direct' | 'archive';

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;
const KHAN_VIDEO_RE = /khanacademy\.org\/(?:v|embed-video\/|.*\/v\/)([a-zA-Z0-9_-]+)/i;
const ARCHIVE_ID_RE = /archive\.org\/(?:embed|details)\/([^/?#]+)/i;
const DIRECT_VIDEO_EXT_RE = /\.(?:mp4|webm|ogv|mov|m4v)(?:\?|$)/i;

const TRUSTED_DIRECT_VIDEO_HOST_RE =
  /(?:^|\.)wikimedia\.org$|(?:^|\.)wikipedia\.org$|(?:^|\.)nasa\.gov$|(?:^|\.)archive\.org$|(?:^|\.)britannica\.com$|(?:^|\.)pexels\.com$|(?:^|\.)pixabay\.com$|(?:^|\.)mixkit\.co$/i;

export function extractYouTubeVideoId(url: string): string | null {
  const m = url.trim().match(YOUTUBE_ID_RE);
  return m?.[1] ?? null;
}

export function extractVimeoVideoId(url: string): string | null {
  const m = url.trim().match(VIMEO_ID_RE);
  return m?.[1] ?? null;
}

export function extractArchiveIdentifier(url: string): string | null {
  const m = url.trim().match(ARCHIVE_ID_RE);
  return m?.[1] ?? null;
}

export function isTrustedDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return false;
    if (!DIRECT_VIDEO_EXT_RE.test(parsed.pathname)) return false;
    return TRUSTED_DIRECT_VIDEO_HOST_RE.test(parsed.hostname)
      || parsed.hostname.endsWith('wikimedia.org')
      || parsed.hostname === 'player.vimeo.com';
  } catch {
    return false;
  }
}

export function detectAdamChatVideoSource(url: string): AdamChatVideoSource | null {
  const u = url.trim();
  if (!u) return null;
  if (extractYouTubeVideoId(u)) return 'youtube';
  if (extractVimeoVideoId(u)) return 'vimeo';
  if (KHAN_VIDEO_RE.test(u)) return 'khan';
  if (extractArchiveIdentifier(u)) return 'archive';
  if (isTrustedDirectVideoUrl(u)) return 'direct';
  return null;
}

/** Canonical watch / playback URL for trust comparison. */
export function normalizeAdamChatVideoUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = extractYouTubeVideoId(trimmed);
  if (yt) return `https://www.youtube.com/watch?v=${yt}`;

  const vimeo = extractVimeoVideoId(trimmed);
  if (vimeo) return `https://vimeo.com/${vimeo}`;

  if (KHAN_VIDEO_RE.test(trimmed)) {
    try {
      const parsed = new URL(trimmed.split('#')[0]);
      return parsed.href;
    } catch {
      return trimmed;
    }
  }

  const archiveId = extractArchiveIdentifier(trimmed);
  if (archiveId) return `https://archive.org/embed/${archiveId}`;

  if (isTrustedDirectVideoUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return trimmed;
    }
  }

  return null;
}

export function collectTrustedVideoUrls(
  hits: { kind: string; url: string }[],
): Set<string> {
  const trusted = new Set<string>();
  for (const hit of hits) {
    if (hit.kind !== 'video') continue;
    const norm = normalizeAdamChatVideoUrl(hit.url);
    if (norm) trusted.add(norm);
  }
  return trusted;
}

/** @deprecated Use collectTrustedVideoUrls — kept for tests migrating from YouTube-only. */
export function collectTrustedYouTubeVideoIds(
  hits: { kind: string; url: string }[],
): Set<string> {
  const ids = new Set<string>();
  for (const hit of hits) {
    if (hit.kind !== 'video') continue;
    const id = extractYouTubeVideoId(hit.url);
    if (id) ids.add(id);
  }
  return ids;
}

/** Prefer verified search-hit video; drop model-hallucinated URLs not in search corpus. */
export function resolveAdamChatVideoUrl(
  url: string | null,
  trustedUrls: Set<string>,
  searchVideoUrl?: string | null,
): string {
  const normalized = url ? normalizeAdamChatVideoUrl(url) : null;
  if (normalized && trustedUrls.has(normalized)) return normalized;

  const fromSearch = searchVideoUrl ? normalizeAdamChatVideoUrl(searchVideoUrl) : null;
  if (fromSearch) return fromSearch;
  return '';
}
