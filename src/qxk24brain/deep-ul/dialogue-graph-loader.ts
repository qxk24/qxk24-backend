/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Dialogue Graph Loader
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

import { getOrCreateMaster } from '../qxk24brain.engine';
import { graphFromActiveFamilies } from './constitutional-synthesizer';
import { normalizePrinciple, OntologyNode, Principle } from './ontology';

export async function loadDialogueOntologyGraph(founderId: string): Promise<OntologyNode[]> {
  const master = await getOrCreateMaster(founderId);
  const fromFamilies = graphFromActiveFamilies(master.activeFamilies);

  const fromPrinciples: OntologyNode[] = master.principles
    .filter((p) => p.name && p.name !== 'MULTI')
    .map((p) => ({
      filePath:    'master',
      symbolName:  `principle_${p.name}`,
      principle:   normalizePrinciple(p.name) as Principle,
      connections: [],
    }));

  const unified: OntologyNode[] = [{
    filePath:    'master',
    symbolName:  'unified_understanding',
    principle:   Principle.CAHAYA,
    connections: master.activeFamilies.map((f) => f.family),
  }];

  const deduped = new Map<string, OntologyNode>();
  for (const node of [...fromFamilies, ...fromPrinciples, ...unified]) {
    deduped.set(`${node.filePath}:${node.symbolName}`, node);
  }

  return [...deduped.values()];
}

export async function getOntologyGraph(sessionId: string, founderId: string): Promise<OntologyNode[]> {
  void sessionId;
  return loadDialogueOntologyGraph(founderId);
}
