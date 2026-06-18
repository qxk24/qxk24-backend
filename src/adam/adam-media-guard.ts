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
  isDisplayableChatImageUrl,
  normalizeAdamChatImageUrl,
} from './adam-chat-image-url';
import {
  collectTrustedVideoUrls,
  normalizeAdamChatVideoUrl,
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

const MEDIA_TAG_RE = /^<adam-chat-(?:image|video)\b/i;
const HEADER_RE = /^#{1,6}\s+/;

function splitBodyBlocks(text: string): string[] {
  return text.trim().split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** First prose/numbered block long enough to serve as intro abstract. */
export function firstSubstantiveBlockIndex(parts: string[]): number {
  for (let i = 0; i < parts.length; i += 1) {
    const p = parts[i]!;
    if (HEADER_RE.test(p) || MEDIA_TAG_RE.test(p)) continue;
    if (/^<adam-technical-diagram/i.test(p)) continue;
    const numbered = p.replace(/^\d+\.\s+/, '').trim();
    const body = /^\d+\.\s+/.test(p) ? numbered : p;
    if (body.length >= 32) return i;
  }
  return -1;
}

/** Move image/video tags to after the first substantive intro paragraph. */
export function reorderMediaAfterIntroAbstract(text: string): string {
  const parts = splitBodyBlocks(text);
  if (parts.length === 0) return text.trim();

  const proseIdx = firstSubstantiveBlockIndex(parts);
  if (proseIdx < 0) return text.trim();

  const mediaIndices = parts
    .map((p, i) => (MEDIA_TAG_RE.test(p) ? i : -1))
    .filter((i) => i >= 0);
  if (mediaIndices.length === 0) return text.trim();

  const earliestMedia = mediaIndices[0]!;
  if (earliestMedia > proseIdx) return text.trim();

  const tags = mediaIndices
    .sort((a, b) => b - a)
    .map((i) => parts.splice(i, 1)[0]!)
    .reverse();

  const insertAt = firstSubstantiveBlockIndex(parts) + 1;
  parts.splice(insertAt, 0, ...tags);
  return parts.join('\n\n').trim();
}

function resolveMediaInsertIndex(parts: string[]): number {
  const proseIdx = firstSubstantiveBlockIndex(parts);
  if (proseIdx >= 0) return proseIdx + 1;
  return parts.length;
}

/** Normalize media placement — abstract prose before video/image tags. */
export function finalizeAdamChatMediaLayout(text: string): string {
  return dedupeAdamChatMediaTags(reorderMediaAfterIntroAbstract(text.trim()));
}

function collectTrustedImageUrls(hits: AdamMediaSearchHit[]): Set<string> {
  const trusted = new Set<string>();
  for (const hit of hits) {
    if (hit.kind !== 'image') continue;
    if (!isDisplayableChatImageUrl(hit.url)) continue;
    trusted.add(normalizeAdamChatImageUrl(hit.url));
  }
  return trusted;
}

function resolveAdamChatImageUrl(
  url: string | null,
  alt: string,
  hits: AdamMediaSearchHit[],
): string {
  const imageHit = hits.find((h) => h.kind === 'image' && isDisplayableChatImageUrl(h.url));
  const trusted = collectTrustedImageUrls(hits);
  if (url) {
    const normalized = normalizeAdamChatImageUrl(url);
    if (
      isDisplayableChatImageUrl(normalized)
      && trusted.has(normalized)
      && !imageUrlLooksBroken(normalized)
    ) {
      return normalized;
    }
  }
  if (imageHit?.url) return normalizeAdamChatImageUrl(imageHit.url);
  return '';
}

function countAdamChatMediaTags(text: string, kind: 'image' | 'video'): number {
  const re = kind === 'image' ? /<adam-chat-image\b/gi : /<adam-chat-video\b/gi;
  return (text.match(re) ?? []).length;
}

export function dedupeAdamChatMediaTags(text: string): string {
  const seenVideo = new Set<string>();
  const seenImage = new Set<string>();

  let out = text.replace(/<adam-chat-video\b[^>]*\/?>/gi, (tag) => {
    const rawUrl = parseTagAttr(tag, 'url');
    const norm = rawUrl ? normalizeAdamChatVideoUrl(rawUrl) : null;
    if (!norm) return '';
    if (seenVideo.has(norm)) return '';
    seenVideo.add(norm);
    return tag;
  });

  out = out.replace(/<adam-chat-image\b[^>]*\/?>/gi, (tag) => {
    const rawUrl = parseTagAttr(tag, 'url');
    const norm = rawUrl ? normalizeAdamChatImageUrl(rawUrl) : '';
    if (!norm || !isDisplayableChatImageUrl(norm)) return tag;
    if (seenImage.has(norm)) return '';
    seenImage.add(norm);
    return tag;
  });

  return out
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  if (!isAdamMediaSearchTurn(userMessage)) return dedupeAdamChatMediaTags(text.trim());

  let out = dedupeAdamChatMediaTags(text);

  out = repairAdamChatVideoTagUrls(
    repairAdamChatImageTagUrls(out, userMessage, hits),
    userMessage,
    hits,
  );
  if (hits.length === 0) return finalizeAdamChatMediaLayout(out.trim());

  out = out.trim();
  const hasImage = countAdamChatMediaTags(out, 'image') > 0;
  const hasVideo = countAdamChatMediaTags(out, 'video') > 0;

  if (hasImage && hasVideo) {
    return finalizeAdamChatMediaLayout(out);
  }

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
  if (tags.length === 0) return finalizeAdamChatMediaLayout(out);

  const joined = tags.join('\n');

  // Model already embedded image — append verified video right after it.
  if (hasImage && !hasVideo && tags.length === 1 && /<adam-chat-video\b/i.test(tags[0]!)) {
    const afterImage = out.replace(/(<adam-chat-image\b[^>]*\/?>)/i, `$1\n\n${joined}`);
    if (afterImage !== out) return finalizeAdamChatMediaLayout(afterImage.trim());
  }

  const diagramIdx = out.search(/<adam-technical-diagram>[\s\S]*?<\/adam-technical-diagram>/i);
  if (diagramIdx >= 0) {
    const before = out.slice(0, diagramIdx);
    const after = out.slice(diagramIdx).replace(
      /(<\/adam-technical-diagram>)/i,
      `$1\n\n${joined}`,
    );
    return finalizeAdamChatMediaLayout(`${before}${after}`.trim());
  }

  return finalizeAdamChatMediaLayout(
    insertAfterBlockIndex(out, resolveMediaInsertIndex(splitBodyBlocks(out)), joined),
  );
}

/** Remove image/video tags when the user did not ask for media this turn. */
export function stripUnsolicitedAdamChatMedia(text: string, userMessage: string): string {
  if (isAdamMediaSearchTurn(userMessage)) return text.trim();
  return text
    .replace(CHAT_IMAGE_TAG_RE, '')
    .replace(CHAT_VIDEO_TAG_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
