/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Alamtologi Principle Normalize
 * Platform : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AlamtologiPrinciple, JournalContent, PrincipleAnalysis } from './adam.types';

export const CANONICAL_PRINCIPLES: readonly AlamtologiPrinciple[] = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
] as const;

const PRINCIPLE_SET = new Set<string>(CANONICAL_PRINCIPLES);

/** ADAM sometimes invents labels — map to nearest canonical principle for MongoDB. */
const PRINCIPLE_ALIASES: Record<string, AlamtologiPrinciple> = {
  JISIM:  'BUMI',
  BADAN:  'BUMI',
  ARAH:   'RUANG',
  HALATU: 'RUANG',
  ADAB:   'CAHAYA',
  AKHLAK: 'CAHAYA',
  CAHAY:  'CAHAYA',
  LIGHT:  'CAHAYA',
  TIME:   'MASA',
  ENERGY: 'TENAGA',
  WATER:  'AIR',
  FIRE:   'API',
  EARTH:  'BUMI',
  SPACE:  'RUANG',
};

export function normalizeAlamtologiPrinciple(raw: unknown): AlamtologiPrinciple {
  const u = String(raw ?? '').trim().toUpperCase();
  if (PRINCIPLE_SET.has(u)) return u as AlamtologiPrinciple;
  if (PRINCIPLE_ALIASES[u]) return PRINCIPLE_ALIASES[u];
  for (const p of CANONICAL_PRINCIPLES) {
    if (u.includes(p) || p.includes(u)) return p;
  }
  return 'CAHAYA';
}

export function normalizePrinciplesFocus(raw: unknown): AlamtologiPrinciple[] {
  if (!Array.isArray(raw) || raw.length === 0) return ['CAHAYA'];
  return [...new Set(raw.map(normalizeAlamtologiPrinciple))];
}

export function normalizePrincipleAnalysis(
  rows: Partial<PrincipleAnalysis>[] | undefined,
): PrincipleAnalysis[] {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    principle: normalizeAlamtologiPrinciple(row.principle),
    weight:    typeof row.weight === 'number' ? row.weight : 0.1,
    score:     typeof row.score === 'number' ? row.score : 0,
    analysis:  String(row.analysis ?? ''),
    evidence:  Array.isArray(row.evidence) ? row.evidence.map(String) : [],
  }));
}

export function normalizeJournalContent(content: Partial<JournalContent>): JournalContent {
  return {
    introduction:       String(content.introduction ?? ''),
    background:         String(content.background ?? ''),
    methodology:        String(content.methodology ?? ''),
    alamtologiAnalysis: normalizePrincipleAnalysis(content.alamtologiAnalysis),
    findings:           String(content.findings ?? ''),
    discussion:         String(content.discussion ?? ''),
    conclusion:         String(content.conclusion ?? ''),
    references:         Array.isArray(content.references) ? content.references.map(String) : [],
    appendices:           content.appendices,
  };
}
