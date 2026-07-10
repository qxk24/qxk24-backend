/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Keyframe Extractor
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export interface KeyframeMessage {
  role:    'user' | 'assistant';
  content: string;
}

const HIGH_VALUE_KEYWORDS = [
  'how', 'why', 'error', 'fix', 'architect', 'database', 'state',
  'principle', 'tenaga', 'ruang', 'cahaya', 'bumi', 'masa',
];

function scoreMessage(msg: KeyframeMessage): number {
  let score = 0;
  const content = msg.content.trim();
  const lower = content.toLowerCase();

  if (content.length > 100) score += 2;
  if (msg.role === 'user') score += 1;

  for (const kw of HIGH_VALUE_KEYWORDS) {
    if (lower.includes(kw)) score += 2;
  }

  return score;
}

export function extractSessionKeyframes(
  messages: KeyframeMessage[],
  maxKeyframes = 3,
): string[] {
  if (messages.length === 0) return [];

  const scored = messages.map((msg, index) => ({
    index,
    score:   scoreMessage(msg),
    content: msg.content.trim(),
  }));

  const limit = Math.min(maxKeyframes, scored.length);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.content)
    .filter((content) => content.length > 0);
}

export function formatKeyframesAsDigest(keyframes: string[]): string {
  return keyframes
    .map((content) => `- ${content.slice(0, 200)}`)
    .join('\n');
}
