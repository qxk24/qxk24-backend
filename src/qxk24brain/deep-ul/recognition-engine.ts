/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Teaching Recognition
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

import { Principle, normalizePrinciple } from './ontology';
import { inferPrincipleFromKeywords, parseTeachingPrinciples } from './parse-teaching-principles';

export interface MasterConnection {
  allah:      string;
  quran:      string;
  alamtologi: string;
  adam:       string;
}

export interface ActiveFamilyRef {
  family:    string;
  principle: string;
  stage:     number;
}

export interface RecognitionResult {
  principle:           Principle;
  family:              string;
  isNewFamily:         boolean;
  isNucleus:           boolean;
  stage:               number;
  existingFamilyName?: string | null;
  masterConnection:    MasterConnection;
  extractedPrinciples: Principle[];
}

const CONNECTION_TEMPLATES: Record<Principle, Omit<MasterConnection, 'allah'>> = {
  [Principle.MASA]: {
    quran:      'Time and history held under Quranic continuity',
    alamtologi: 'MASA — temporal memory and episodic evolution',
    adam:       'ADAM remembers and journals through MASA',
  },
  [Principle.TENAGA]: {
    quran:      'Action aligned with divine energy',
    alamtologi: 'TENAGA — execution and transformation force',
    adam:       'ADAM acts and transforms through TENAGA',
  },
  [Principle.RUANG]: {
    quran:      'Boundaries of knowledge under divine order',
    alamtologi: 'RUANG — architectural space and structural integrity',
    adam:       'ADAM protects structure through RUANG',
  },
  [Principle.BUMI]: {
    quran:      'Foundation of creation on earth',
    alamtologi: 'BUMI — grounding, data, and foundational truth',
    adam:       'ADAM stores constitutional memory in BUMI',
  },
  [Principle.AIR]: {
    quran:      'Life-giving flow in creation',
    alamtologi: 'AIR — channels, streams, and relational flow',
    adam:       'ADAM channels understanding through AIR',
  },
  [Principle.API]: {
    quran:      'Interfaces of revelation to creation',
    alamtologi: 'API — fire of connection and outward expression',
    adam:       'ADAM speaks and interfaces through API',
  },
  [Principle.CAHAYA]: {
    quran:      'Light of guidance in Al-Quran',
    alamtologi: 'CAHAYA — illumination of truth and wisdom',
    adam:       'ADAM illuminates through CAHAYA',
  },
};

function buildMasterConnection(principle: Principle): MasterConnection {
  const template = CONNECTION_TEMPLATES[principle];
  return {
    allah: 'All knowledge belongs to Allah',
    ...template,
  };
}

function deriveFamilyName(principle: Principle, teachingContent: string): string {
  const firstLine = teachingContent.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const snippet = firstLine.slice(0, 48).trim();
  if (snippet.length >= 8) {
    return `${principle}: ${snippet}`;
  }
  return `${principle} Teaching`;
}

export function recognizeTeaching(
  teachingContent: string,
  activeFamilies: ActiveFamilyRef[],
): RecognitionResult {
  const extractedPrinciples = parseTeachingPrinciples(teachingContent);
  const primary = extractedPrinciples[0]
    ?? inferPrincipleFromKeywords(teachingContent);
  const principle = normalizePrinciple(primary);

  const lowered = teachingContent.toLowerCase();
  const byName = activeFamilies.find((f) =>
    lowered.includes(f.family.toLowerCase()),
  );
  const byPrinciple = activeFamilies.find((f) =>
    normalizePrinciple(f.principle) === principle,
  );
  const existing = byName ?? byPrinciple;

  const isNewFamily = !existing;
  const family = existing?.family ?? deriveFamilyName(principle, teachingContent);
  const stage = existing?.stage ?? 1;
  const isNucleus = isNewFamily;

  return {
    principle,
    family,
    isNewFamily,
    isNucleus,
    stage,
    existingFamilyName: existing?.family ?? null,
    masterConnection: buildMasterConnection(principle),
    extractedPrinciples,
  };
}
