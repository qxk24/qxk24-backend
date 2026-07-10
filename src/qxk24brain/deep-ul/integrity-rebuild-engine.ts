/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Integrity Rebuild Engine
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

import {
  buildSynthesisContent,
  graphFromActiveFamilies,
  synthesizeConstitution,
} from './constitutional-synthesizer';
import { parseTeachingPrinciples } from './parse-teaching-principles';
import { recognizeTeaching } from './recognition-engine';

export function rebuildEntityContentDeterministic(input: {
  entityA:   string;
  entityB:   string;
  family:    string;
  principle: string;
  stage:     number;
}): string {
  const principles = parseTeachingPrinciples(input.entityB);
  const recognition = recognizeTeaching(input.entityB, []);
  const entityC = synthesizeConstitution(
    {
      masterUnderstanding: input.entityA,
      ontologyGraph:       graphFromActiveFamilies([
        { family: input.family, principle: input.principle },
      ]),
    },
    {
      teachingContent:     input.entityB,
      extractedPrinciples: principles.length ? principles : [recognition.principle],
    },
  );

  const synthesis = buildSynthesisContent(
    input.entityA,
    input.entityB,
    { ...recognition, family: input.family, stage: input.stage },
    entityC,
  );

  return synthesis.content;
}
