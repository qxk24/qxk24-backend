/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Constitutional Judgment Engine
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

import { parseTeachingPrinciples } from './parse-teaching-principles';
import { Principle } from './ontology';

export type JudgmentLabel = 'MAKMUR' | 'ISLAH' | 'WAQF';
export type HukumZLabel = 'LULUS' | 'GAGAL' | 'BELUM';

export interface HukumZResult {
  pola:           HukumZLabel;
  kadar:          HukumZLabel;
  pasangan:       HukumZLabel;
  keseimbangan:   HukumZLabel;
}

export interface ConstitutionalJudgmentResult {
  judgment:        JudgmentLabel;
  hukumZ:          HukumZResult;
  healthScore:     number;
  canProceed:      boolean;
  canAdvance:      boolean;
  findings:        string[];
  recommendations: string[];
  response:        string;
  tahapAkal:       number;
}

function scoreText(text: string): number {
  const principles = parseTeachingPrinciples(text);
  const lengthScore = Math.min(text.trim().length / 200, 5);
  return principles.length * 15 + lengthScore * 10;
}

function dominantPrinciple(text: string): Principle {
  const principles = parseTeachingPrinciples(text);
  return principles[0] ?? Principle.BUMI;
}

export function runConstitutionalJudgment(input: {
  question: string;
  context?: string;
  targetData?: Record<string, unknown>;
}): ConstitutionalJudgmentResult {
  const corpus = `${input.question} ${input.context ?? ''} ${JSON.stringify(input.targetData ?? {})}`;
  const score = scoreText(corpus);
  const principle = dominantPrinciple(corpus);

  const hukumZ: HukumZResult = score >= 60
    ? { pola: 'LULUS', kadar: 'LULUS', pasangan: 'LULUS', keseimbangan: 'LULUS' }
    : score >= 30
      ? { pola: 'LULUS', kadar: 'BELUM', pasangan: 'LULUS', keseimbangan: 'BELUM' }
      : { pola: 'BELUM', kadar: 'BELUM', pasangan: 'BELUM', keseimbangan: 'BELUM' };

  const lulusCount = Object.values(hukumZ).filter((v) => v === 'LULUS').length;
  const healthScore = Math.min(100, Math.round(score + lulusCount * 10));
  const judgment: JudgmentLabel = healthScore >= 80
    ? 'MAKMUR'
    : healthScore >= 45
      ? 'ISLAH'
      : 'WAQF';

  return {
    judgment,
    hukumZ,
    healthScore,
    canProceed:      judgment !== 'WAQF',
    canAdvance:      judgment === 'MAKMUR',
    findings:        [`Dominant principle: ${principle}`, `Constitutional score: ${healthScore}`],
    recommendations: judgment === 'ISLAH' ? ['Provide additional constitutional grounding'] : [],
    response:        `Deterministic constitutional judgment under ${principle}: ${judgment}.`,
    tahapAkal:         Math.min(7, Math.max(1, Math.ceil(healthScore / 15))),
  };
}
