/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Guard (Image + Video Tags)
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
 */

import type { AdamMediaSearchHit } from './adam-media-search';
import { isAdamMediaSearchTurn } from './adam-media-search';
import {
  imageUrlLooksBroken,
  normalizeAdamChatImageUrl,
} from './adam-chat-image-url';
import {
  collectTrustedVideoUrls,
  resolveAdamChatVideoUrl,
} from './adam-chat-video-url';

const CHAT_IMAGE_TAG_RE = /<adam-chat-image\b[^>]*\/?>/gi;
const CHAT_VIDEO_TAG_RE = /<adam-chat-video\b[^>]*\/?>/gi;
const MEDIA_STASH_RE = /<adam-chat-(?:image|video)\b[^>]*\/?>/gi;

const FRAMEWORK_IN_MEDIA_RE =
  /\b(?:Alamtologi|MASA|TENAGA|RUANG|IZWA|HISAL|AIDIL|TAJU)\b/i;

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function parseTagAttr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}=["']([^"']+)["']`, 'i');
  return tag.match(re)?.[1]?.trim() ?? null;
}

export function wrapAdamChatImageTag(url: string, alt: string): string {
  return `<adam-chat-image url="${escapeAttr(url)}" alt="${escapeAttr(alt)}" />`;
}

export function wrapAdamChatVideoTag(url: string, title: string): string {
  return `<adam-chat-video url="${escapeAttr(url)}" title="${escapeAttr(title)}" />`;
}

export function outputHasAdamChatMedia(text: string): boolean {
  return CHAT_IMAGE_TAG_RE.test(text) || CHAT_VIDEO_TAG_RE.test(text);
}

export function mediaTagIsKonvensionalSafe(tag: string): boolean {
  if (FRAMEWORK_IN_MEDIA_RE.test(tag)) return false;
  const url = parseTagAttr(tag, 'url');
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function stashAdamChatMediaBlocks(text: string): { prose: string; blocks: string[] } {
  const blocks: string[] = [];
  const prose = text.replace(MEDIA_STASH_RE, (match) => {
    const slot = `\x00ADAM_MEDIA_${blocks.length}\x00`;
    blocks.push(match);
    return slot;
  });
  return { prose, blocks };
}

export function restoreAdamChatMediaBlocks(text: string, blocks: string[]): string {
  let out = text;
  for (let i = 0; i < blocks.length; i += 1) {
    out = out.replace(`\x00ADAM_MEDIA_${i}\x00`, blocks[i]);
  }
  return out;
}

function insertAfterBlockIndex(text: string, blockIndex: number, insert: string): string {
  const parts = text.trim().split(/\n{2,}/);
  const at = Math.min(Math.max(blockIndex, 0), parts.length);
  parts.splice(at, 0, insert);
  return parts.join('\n\n').trim();
}

function collectTrustedImageUrls(hits: AdamMediaSearchHit[]): Set<string> {
  const trusted = new Set<string>();
  for (const hit of hits) {
    if (hit.kind !== 'image') continue;
    trusted.add(normalizeAdamChatImageUrl(hit.url));
  }
  return trusted;
}

function resolveAdamChatImageUrl(
  url: string | null,
  alt: string,
  hits: AdamMediaSearchHit[],
): string {
  const imageHit = hits.find((h) => h.kind === 'image');
  const trusted = collectTrustedImageUrls(hits);
  if (url) {
    const normalized = normalizeAdamChatImageUrl(url);
    if (trusted.has(normalized) && !imageUrlLooksBroken(normalized)) return normalized;
  }
  if (imageHit?.url) return normalizeAdamChatImageUrl(imageHit.url);
  return url ? normalizeAdamChatImageUrl(url) : '';
}

/** Normalize image tags; swap broken/hallucinated URLs with search-hit URLs. */
export function repairAdamChatImageTagUrls(
  text: string,
  userMessage: string,
  hits: AdamMediaSearchHit[] = [],
): string {
  if (!isAdamMediaSearchTurn(userMessage)) return text.trim();

  return text.replace(/<adam-chat-image\b[^>]*\/?>/gi, (tag) => {
    const rawUrl = parseTagAttr(tag, 'url');
    const alt = parseTagAttr(tag, 'alt') || 'Imej rujukan';
    const url = resolveAdamChatImageUrl(rawUrl, alt, hits);
    if (!url) return '';
    return wrapAdamChatImageTag(url, alt);
  });
}

/** Replace hallucinated video URLs with verified search-hit URLs. */
export function repairAdamChatVideoTagUrls(
  text: string,
  userMessage: string,
  hits: AdamMediaSearchHit[] = [],
): string {
  if (!isAdamMediaSearchTurn(userMessage)) return text.trim();

  const trustedUrls = collectTrustedVideoUrls(hits);
  const videoHit = hits.find((h) => h.kind === 'video');

  return text.replace(/<adam-chat-video\b[^>]*\/?>/gi, (tag) => {
    const rawUrl = parseTagAttr(tag, 'url');
    const title = parseTagAttr(tag, 'title') || videoHit?.title || 'Video rujukan';
    const url = resolveAdamChatVideoUrl(rawUrl, trustedUrls, videoHit?.url);
    if (!url) return '';
    return wrapAdamChatVideoTag(url, title);
  });
}

/** Inject search-verified image/video tags when model omitted them on a media turn. */
export function repairAdamMediaOutput(
  text: string,
  userMessage: string,
  hits: AdamMediaSearchHit[],
): string {
  if (!isAdamMediaSearchTurn(userMessage)) return text.trim();

  let out = repairAdamChatVideoTagUrls(
    repairAdamChatImageTagUrls(text, userMessage, hits),
    userMessage,
    hits,
  );
  if (hits.length === 0) return out.trim();

  out = out.trim();
  const hasImage = CHAT_IMAGE_TAG_RE.test(out);
  const hasVideo = CHAT_VIDEO_TAG_RE.test(out);
  CHAT_IMAGE_TAG_RE.lastIndex = 0;
  CHAT_VIDEO_TAG_RE.lastIndex = 0;

  const imageHit = hits.find((h) => h.kind === 'image');
  const videoHit = hits.find((h) => h.kind === 'video');

  const tags: string[] = [];
  if (!hasImage && imageHit) {
    const url = resolveAdamChatImageUrl(imageHit.url, imageHit.title, hits);
    if (url) tags.push(wrapAdamChatImageTag(url, imageHit.title));
  }
  if (!hasVideo && videoHit) {
    const trustedUrls = collectTrustedVideoUrls(hits);
    const videoUrl = resolveAdamChatVideoUrl(videoHit.url, trustedUrls, videoHit.url);
    if (videoUrl) tags.push(wrapAdamChatVideoTag(videoUrl, videoHit.title));
  }
  if (tags.length === 0) return out;

  const diagramIdx = out.search(/<adam-technical-diagram>[\s\S]*?<\/adam-technical-diagram>/i);
  if (diagramIdx >= 0) {
    const before = out.slice(0, diagramIdx);
    const after = out.slice(diagramIdx).replace(
      /(<\/adam-technical-diagram>)/i,
      `$1\n\n${tags.join('\n')}`,
    );
    return `${before}${after}`.trim();
  }

  return insertAfterBlockIndex(out, 1, tags.join('\n'));
}
