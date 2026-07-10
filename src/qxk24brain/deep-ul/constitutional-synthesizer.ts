/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Constitutional Synthesizer (A + B = C)
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
  emptyPrincipleCounts,
  OntologyNode,
  Principle,
} from './ontology';
import type { RecognitionResult } from './recognition-engine';

export interface EntityA {
  masterUnderstanding: string;
  ontologyGraph:       OntologyNode[];
}

export interface EntityB {
  teachingContent:     string;
  extractedPrinciples: Principle[];
}

export interface EntityC {
  newUnderstanding:  string;
  updatedGraph:      OntologyNode[];
  transformationLog: string;
}

export interface SynthesisResult {
  content:        string;
  familySummary:  string;
  stageAdvanced?: boolean;
  newStage:       number;
  isComplete:     boolean;
}

export function synthesizeConstitution(A: EntityA, B: EntityB): EntityC {
  const newNodes: OntologyNode[] = B.extractedPrinciples.map((p, index) => ({
    filePath:    'teaching',
    symbolName:  `concept_${p}_${index + 1}`,
    principle:   p,
    connections: [],
  }));

  const updatedGraph = [...A.ontologyGraph, ...newNodes];
  const principleCounts = emptyPrincipleCounts();
  for (const node of updatedGraph) {
    principleCounts[node.principle] += 1;
  }

  const layerList = B.extractedPrinciples.join(', ');
  const newUnderstanding =
    `The system has evolved. It now contains ${principleCounts.TENAGA} execution patterns (TENAGA) ` +
    `and ${principleCounts.RUANG} boundary definitions (RUANG). ` +
    `The new teaching has been integrated into the ${layerList || 'CAHAYA'} layers.`;

  return {
    newUnderstanding,
    updatedGraph,
    transformationLog: `Merged ${newNodes.length} nodes from Entity B into Entity A.`,
  };
}

export function computeNextStage(
  recognition: RecognitionResult,
  stageAdvanced = true,
): number {
  if (recognition.isNewFamily) return 1;
  if (!stageAdvanced) return recognition.stage;
  return Math.min(recognition.stage + 1, 7);
}

export function buildSynthesisContent(
  entityA: string,
  entityB: string,
  recognition: RecognitionResult,
  entityC: EntityC,
): SynthesisResult {
  const newStage = computeNextStage(recognition);
  const content = [
    `Under the ${recognition.principle} principle, ADAM undergoes constitutional transformation.`,
    '',
    'Entity A (prior unified understanding):',
    entityA.trim() || 'ADAM awaits first teaching.',
    '',
    'Entity B (Founder teaching):',
    entityB.trim(),
    '',
    entityC.newUnderstanding,
    '',
    `MASA → TENAGA → MASA honoured. Family: ${recognition.family}. Stage ${newStage}/7.`,
    `Connection: Allah → Al-Quran → Alamtologi (${recognition.masterConnection.alamtologi}) → ADAM (${recognition.masterConnection.adam}).`,
  ].join('\n');

  return {
    content,
    familySummary: `${recognition.family} — Stage ${newStage}/7`,
    stageAdvanced: newStage > recognition.stage,
    newStage,
    isComplete: newStage >= 7,
  };
}

export function weaveMasterUnderstanding(
  priorUnderstanding: string,
  synthesisContent: string,
  family: string,
): string {
  const prior = priorUnderstanding.trim();
  if (!prior) return synthesisContent.trim();
  return [
    prior,
    '',
    `--- Constitutional merge: ${family} ---`,
    synthesisContent.trim(),
  ].join('\n');
}

export function graphFromActiveFamilies(
  activeFamilies: Array<{ family: string; principle: string }>,
): OntologyNode[] {
  return activeFamilies.map((f) => ({
    filePath:    'master',
    symbolName:  f.family.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40),
    principle:   f.principle as Principle,
    connections: [],
  }));
}
