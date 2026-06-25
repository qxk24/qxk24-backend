/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Generation Intent
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

const GENERATION_VERB_RE =
  /\b(?:jana|cipta|buat|generate|create|draw|lukis|hasilkan|produce)\b/i;
const GENERATION_NOUN_RE =
  /\b(?:gambar|imej|image|video|ilustrasi|illustration|animasi|animation|clip)\b/i;
const VIDEO_NOUN_RE =
  /\b(?:video|animasi|animation|clip|tonton)\b/i;

/** Explicit user ask to AI-generate media (not discovery-only). */
export function isAdamMediaGenerationTurn(message: string, isFounder = false): boolean {
  const t = message.trim();
  if (!t) return false;
  if (!GENERATION_NOUN_RE.test(t)) return false;
  if (GENERATION_VERB_RE.test(t)) return true;
  if (isFounder) {
    return /\b(?:ai[- ]?generated|ai generated|dall|midjourney)\b/i.test(t);
  }
  return false;
}

export function userWantsGeneratedVideo(message: string): boolean {
  return VIDEO_NOUN_RE.test(message.trim())
    && /\b(?:video|animasi|animation|clip)\b/i.test(message.trim());
}

export function buildAdamMediaGenerationPrompt(message: string): string {
  return message
    .replace(/^\[[^\]]+\]:\s*/, '')
    .replace(GENERATION_VERB_RE, ' ')
    .replace(/\b(?:sila|please|tolong|can you|could you)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 480);
}

const VIDEO_DURATION_RE =
  /\b(\d{1,2})\s*(?:saat|detik|seconds?|sec|s)\b/i;

/** Parse requested clip length from user message; defaults to 5 seconds. */
export function parseRequestedVideoSeconds(message: string): number {
  const match = message.trim().match(VIDEO_DURATION_RE);
  if (!match?.[1]) return 5;
  const n = Number.parseInt(match[1], 10);
  if (!Number.isFinite(n) || n < 1) return 5;
  return n;
}
