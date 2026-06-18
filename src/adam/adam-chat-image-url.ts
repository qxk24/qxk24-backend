/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Image URL
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

const NON_DISPLAYABLE_IMAGE_EXT_RE = /\.(?:pdf|epub|docx?|pptx?|zip|mp4|webm|mov)(?:\?|$)/i;
const NON_DISPLAYABLE_IMAGE_HOST_RE =
  /(?:^|\.)youtube\.com$|youtu\.be$|(?:^|\.)vimeo\.com$|i\.ytimg\.com$/i;

/** Chat <img> must be a raster/SVG resource — not PDF, video, or YouTube pages. */
export function isDisplayableChatImageUrl(url: string): boolean {
  const u = url.trim();
  if (!u || !u.startsWith('https://')) return false;
  if (NON_DISPLAYABLE_IMAGE_EXT_RE.test(u)) return false;
  try {
    const host = new URL(u).hostname;
    if (NON_DISPLAYABLE_IMAGE_HOST_RE.test(host)) return false;
  } catch {
    return false;
  }
  return true;
}

/** Wikimedia /thumb/…/800px-… URLs often 400 — use direct commons file. */
export function wikimediaThumbToDirectUrl(url: string): string | null {
  const m = url.trim().match(
    /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/thumb\/([a-f0-9]\/[a-f0-9]{2}\/[^/]+)\/\d+px-[^/]+$/i,
  );
  if (!m) return null;
  return `${m[1]}/${m[2]}`;
}

export function normalizeAdamChatImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return wikimediaThumbToDirectUrl(trimmed) ?? trimmed;
}

/** Model-hallucinated Wikimedia thumb paths — normalize or replace from search hits. */
export function imageUrlLooksBroken(url: string): boolean {
  const u = url.trim();
  if (!u) return true;
  if (!isDisplayableChatImageUrl(u)) return true;
  if (/images\.pexels\.com|images\.unsplash\.com|cdn\.pixabay\.com/i.test(u)) return false;
  if (/\/thumb\//i.test(u)) return true;
  if (/\/\d+px-/i.test(u)) return true;
  return false;
}
