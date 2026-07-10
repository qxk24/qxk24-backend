/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Alamtologi Ontology Types
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

export enum Principle {
  BUMI = 'BUMI',
  AIR = 'AIR',
  TENAGA = 'TENAGA',
  API = 'API',
  CAHAYA = 'CAHAYA',
  RUANG = 'RUANG',
  MASA = 'MASA',
}

export const ALL_PRINCIPLES: Principle[] = [
  Principle.BUMI,
  Principle.AIR,
  Principle.TENAGA,
  Principle.API,
  Principle.CAHAYA,
  Principle.RUANG,
  Principle.MASA,
];

export interface OntologyNode {
  filePath:    string;
  symbolName:  string;
  principle:   Principle;
  connections: string[];
}

export function normalizePrinciple(value: string): Principle {
  const upper = value.toUpperCase();
  if ((ALL_PRINCIPLES as string[]).includes(upper)) {
    return upper as Principle;
  }
  return Principle.CAHAYA;
}

export function emptyPrincipleCounts(): Record<Principle, number> {
  return {
    [Principle.BUMI]:    0,
    [Principle.AIR]:     0,
    [Principle.TENAGA]:  0,
    [Principle.API]:     0,
    [Principle.CAHAYA]:  0,
    [Principle.RUANG]:   0,
    [Principle.MASA]:    0,
  };
}
