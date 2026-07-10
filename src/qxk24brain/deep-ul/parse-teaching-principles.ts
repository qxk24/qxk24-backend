/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Teaching Principle Parser
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

import { ALL_PRINCIPLES, Principle, normalizePrinciple } from './ontology';

const KEYWORD_MAP: Array<{ principle: Principle; patterns: RegExp[] }> = [
  {
    principle: Principle.MASA,
    patterns: [
      /\bmasa\b/i,
      /\btime\b/i,
      /\bhistory\b/i,
      /\bevolution\b/i,
      /\bepisod/i,
      /\bjournal\b/i,
    ],
  },
  {
    principle: Principle.TENAGA,
    patterns: [
      /\btenaga\b/i,
      /\benergy\b/i,
      /\baction\b/i,
      /\bexecut/i,
      /\boperat/i,
      /\btransform/i,
    ],
  },
  {
    principle: Principle.RUANG,
    patterns: [
      /\bruang\b/i,
      /\bspace\b/i,
      /\bboundar/i,
      /\barchitect/i,
      /\bstructur/i,
      /\blayer\b/i,
    ],
  },
  {
    principle: Principle.BUMI,
    patterns: [
      /\bbumi\b/i,
      /\bearth\b/i,
      /\bfoundat/i,
      /\bdata\b/i,
      /\bstorage\b/i,
      /\bdatabase\b/i,
    ],
  },
  {
    principle: Principle.AIR,
    patterns: [
      /\bair\b/i,
      /\bwater\b/i,
      /\bflow\b/i,
      /\bstream\b/i,
      /\bchannel\b/i,
    ],
  },
  {
    principle: Principle.API,
    patterns: [
      /\bapi\b/i,
      /\bfire\b/i,
      /\binterface\b/i,
      /\broute\b/i,
      /\bendpoint\b/i,
    ],
  },
  {
    principle: Principle.CAHAYA,
    patterns: [
      /\bcahaya\b/i,
      /\blight\b/i,
      /\billumin/i,
      /\btruth\b/i,
      /\bwisdom\b/i,
      /\bquran\b/i,
    ],
  },
];

export function inferPrincipleFromKeywords(text: string): Principle {
  const scores = new Map<Principle, number>();
  for (const entry of KEYWORD_MAP) {
    let score = 0;
    for (const pattern of entry.patterns) {
      if (pattern.test(text)) score += 1;
    }
    if (score > 0) scores.set(entry.principle, score);
  }

  let best: Principle = Principle.CAHAYA;
  let bestScore = 0;
  for (const [principle, score] of scores) {
    if (score > bestScore) {
      best = principle;
      bestScore = score;
    }
  }
  return best;
}

export function parseTeachingPrinciples(teachingContent: string): Principle[] {
  const found = new Set<Principle>();
  const explicit = teachingContent.match(
    /\b(BUMI|AIR|TENAGA|API|CAHAYA|RUANG|MASA)\b/gi,
  );
  if (explicit) {
    for (const match of explicit) {
      found.add(normalizePrinciple(match));
    }
  }

  for (const entry of KEYWORD_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(teachingContent)) {
        found.add(entry.principle);
        break;
      }
    }
  }

  if (found.size === 0) {
    found.add(inferPrincipleFromKeywords(teachingContent));
  }

  return ALL_PRINCIPLES.filter((p) => found.has(p));
}
