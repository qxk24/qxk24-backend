/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Display Merge
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Keeps streamed P.alt-visible prose when post-stream repair would
 * swap it for an unrelated summary. Sync with alm-web/adam-message-merge.ts.
 */

import { isArithmeticAlphaCollapsedRepair } from './adam-arithmetic-alpha-guard';
import { isVisualDrawCollapsedRepair } from './adam-visual-draw-guard';
import { isUsersGreetingOnlyRepair } from './adam-users-constitution';
import { resolveProseCraftDisplayForSave } from './adam-prose-craft';
import { outputHasAdamProductRedirectLeak } from './adam-response-generation';
import { isSimpleFactualFrameworkLeakRepair } from './adam-simple-factual-voice-guard';

const KONVENSIONAL_MEDIA_TAG_RE = /<adam-(?:chat-image|chat-video|technical-diagram)\b/i;

function repairedAddsKonvensionalMedia(streamed: string, repaired: string): boolean {
  const prev = streamed.trim();
  const next = repaired.trim();
  if (!next || prev === next) return false;
  if (!KONVENSIONAL_MEDIA_TAG_RE.test(next)) return false;
  if (!KONVENSIONAL_MEDIA_TAG_RE.test(prev)) return true;
  for (const kind of ['chat-video', 'chat-image', 'technical-diagram'] as const) {
    const tag = new RegExp(`<adam-${kind}\\b`, 'i');
    if (tag.test(next) && !tag.test(prev)) return true;
  }
  return false;
}

const STREAM_REPLACE_MIN_RATIO = 0.52;

function normalizeStreamBody(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripCommonOpener(text: string): string {
  return text.replace(/^bismillahirahmanirahim\.?\s*/i, '').trim();
}

function tokenOverlapRatio(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 4));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 4));
  if (wordsA.size === 0) return 1;
  let hit = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) hit += 1;
  }
  return hit / wordsA.size;
}

function streamBodyMostlyPreserved(streamed: string, replacement: string): boolean {
  const prev = normalizeStreamBody(stripCommonOpener(streamed));
  const next = normalizeStreamBody(stripCommonOpener(replacement));
  if (!prev) return true;
  if (next.includes(prev)) return true;
  if (prev.length >= 120) {
    const head = prev.slice(0, Math.min(400, Math.floor(prev.length * 0.72)));
    if (head.length >= 80 && next.includes(head)) return true;
    if (tokenOverlapRatio(prev, next) >= 0.45) return true;
  }
  if (prev.length >= 60 && prev.length < 120 && tokenOverlapRatio(prev, next) >= 0.55) {
    return true;
  }
  return false;
}

function shouldAcceptStreamReplace(
  streamed: string,
  replacement: string,
  options?: { forceReplace?: boolean },
): boolean {
  const prev = streamed.trim();
  const next = replacement.trim();
  if (options?.forceReplace) {
    if (prev.length > 280 && next.length / prev.length < 0.15) return false;
    return next.length > 0;
  }
  if (!next) return false;
  if (!prev) return true;
  if (prev.length <= 60) return next.length > 0;
  if (next.length / prev.length < STREAM_REPLACE_MIN_RATIO) return false;
  return streamBodyMostlyPreserved(prev, next);
}

export interface AdamTurnDisplayMergeOptions {
  forceReplace?: boolean;
  userMessage?: string;
  arithmeticAlphaRepair?: boolean;
  visualDrawRepair?: boolean;
  usersGreetingRepair?: boolean;
  technicalMediaRepair?: boolean;
  /** Users channel — never persist product-server redirect over repaired surface. */
  adamProductRedirectRepair?: boolean;
  /** Prose-craft — Hai/asterisk/faith strip must win over streamed essay. */
  proseCraftRepair?: boolean;
}

/** Body to persist and emit — never save a repair that gutted the live stream. */
export function resolveAdamTurnDisplayForSave(
  streamed: string,
  repaired: string,
  options?: AdamTurnDisplayMergeOptions,
): string {
  const prev = streamed.trim();
  const next = repaired.trim();

  if (options?.proseCraftRepair) {
    return resolveProseCraftDisplayForSave(prev, next);
  }

  if (
    options?.userMessage
    && isSimpleFactualFrameworkLeakRepair(prev, next, options.userMessage)
  ) {
    return next || prev;
  }

  if (
    options?.arithmeticAlphaRepair
    || options?.visualDrawRepair
    || options?.usersGreetingRepair
    || options?.technicalMediaRepair
    || options?.adamProductRedirectRepair
    || (outputHasAdamProductRedirectLeak(prev) && !outputHasAdamProductRedirectLeak(next))
    || repairedAddsKonvensionalMedia(prev, next)
    || (options?.userMessage && isArithmeticAlphaCollapsedRepair(prev, next, options.userMessage))
    || (options?.userMessage && isVisualDrawCollapsedRepair(prev, next, options.userMessage))
    || isUsersGreetingOnlyRepair(prev, next)
  ) {
    return next || prev;
  }

  if (options?.forceReplace) {
    if (!next) return prev;
    if (prev.length > 280 && next.length / prev.length < 0.15) return prev;
    return next.length >= 40 ? next : prev;
  }

  if (prev.length > 280 && next.length > 0 && next.length / prev.length < STREAM_REPLACE_MIN_RATIO) {
    return prev;
  }
  const prevParas = prev.split(/\n{2,}/).filter((p) => p.trim()).length;
  const nextParas = next.split(/\n{2,}/).filter((p) => p.trim()).length;
  if (prevParas >= 2 && nextParas < prevParas) {
    return prev;
  }
  return shouldAcceptStreamReplace(streamed, repaired, options)
    ? repaired.trim() || streamed.trim()
    : streamed.trim();
}
