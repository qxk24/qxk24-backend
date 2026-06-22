/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Session State Management
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Manages per-student session state across turns.
 * Stateless classifier calls read from this; router updates it.
 */

import { ConceptReadiness } from './tutor-law.math-intent.types';
import { SubjectDomain, type SessionState } from './tutor-law.router';

// ------------------------------------------------------------
// SECTION 1 — PEDAGOGY LAYER TRACKER
// ------------------------------------------------------------

export enum PedagogyLayer {
  L1_DIAGNOSE = 1,
  L2_HINT     = 2,
  L3_SCAFFOLD = 3,
  L4_FULL     = 4,
}

export interface LayerState {
  currentLayer:      PedagogyLayer;
  attemptCount:      number;
  lastProbeAnswered: boolean;
}

function defaultLayerState(): LayerState {
  return {
    currentLayer:      PedagogyLayer.L1_DIAGNOSE,
    attemptCount:      0,
    lastProbeAnswered: false,
  };
}

// ------------------------------------------------------------
// SECTION 2 — FULL SESSION STATE
// ------------------------------------------------------------

export interface FullSessionState extends SessionState {
  layerState: Record<SubjectDomain, LayerState>;

  lastConfirmedConcept: string | null;
  turnCount:            number;
  recentResponses:      string[];
  studentLevel:         'PRIMARY' | 'SECONDARY' | 'UNIVERSITY' | 'UNKNOWN';
  preferredLang:        'BM' | 'EN' | 'MIXED';
}

// ------------------------------------------------------------
// SECTION 3 — FACTORY
// ------------------------------------------------------------

export function createFullSession(
  studentId: string,
  sessionId: string,
  studentLevel: FullSessionState['studentLevel'] = 'UNKNOWN',
): FullSessionState {
  return {
    studentId,
    sessionId,
    priorDomain:              null,
    stuckCount:               0,

    mathConceptReadiness:     ConceptReadiness.UNVERIFIED,
    mathPriorTopic:           null,

    sciencePriorSubject:      null,

    languagePriorWritingType: null,
    languageHasDraft:         false,
    languageDraftWordCount:   0,

    codeHasCodeBlock:         false,
    codeHasErrorMessage:      false,
    codeCodeLineCount:        0,
    codePriorLanguage:        null,

    islamicStudentLevel:      studentLevel,

    genericPriorDomain:       null,

    layerState: {
      [SubjectDomain.MATH]:     defaultLayerState(),
      [SubjectDomain.SCIENCE]:  defaultLayerState(),
      [SubjectDomain.LANGUAGE]: defaultLayerState(),
      [SubjectDomain.CODE]:     defaultLayerState(),
      [SubjectDomain.ISLAMIC]:  defaultLayerState(),
      [SubjectDomain.GENERIC]:  defaultLayerState(),
    },

    lastConfirmedConcept: null,
    turnCount:            0,
    recentResponses:      [],
    studentLevel,
    preferredLang:        'BM',
  };
}

// ------------------------------------------------------------
// SECTION 4 — LAYER ADVANCEMENT LOGIC
// ------------------------------------------------------------

/**
 * Returns the next pedagogy layer when the student still needs help.
 * Caller decides when to commit the transition.
 */
export function advanceLayer(
  current: LayerState,
  stuckCount: number,
  canBypassL1: boolean = false,
): PedagogyLayer {
  const { currentLayer, attemptCount } = current;

  if (canBypassL1 && currentLayer === PedagogyLayer.L1_DIAGNOSE) {
    return PedagogyLayer.L2_HINT;
  }

  switch (currentLayer) {
    case PedagogyLayer.L1_DIAGNOSE:
      return PedagogyLayer.L2_HINT;

    case PedagogyLayer.L2_HINT:
      return attemptCount >= 1
        ? PedagogyLayer.L3_SCAFFOLD
        : PedagogyLayer.L2_HINT;

    case PedagogyLayer.L3_SCAFFOLD:
      return (attemptCount >= 2 || stuckCount >= 3)
        ? PedagogyLayer.L4_FULL
        : PedagogyLayer.L3_SCAFFOLD;

    case PedagogyLayer.L4_FULL:
      return PedagogyLayer.L4_FULL;
  }
}

export function resetLayerForNewTopic(
  session: FullSessionState,
  domain: SubjectDomain,
): FullSessionState {
  return {
    ...session,
    stuckCount: 0,
    layerState: {
      ...session.layerState,
      [domain]: defaultLayerState(),
    },
  };
}

export function recordConceptConfirmed(
  session: FullSessionState,
  conceptLabel: string,
): FullSessionState {
  return {
    ...session,
    mathConceptReadiness: ConceptReadiness.PASSED,
    lastConfirmedConcept: conceptLabel,
    stuckCount:           0,
    layerState: {
      ...session.layerState,
      [SubjectDomain.MATH]: defaultLayerState(),
    },
  };
}

// ------------------------------------------------------------
// SECTION 5 — LANGUAGE PREFERENCE INFERENCE
// ------------------------------------------------------------

export function inferPreferredLang(raw: string): FullSessionState['preferredLang'] {
  const malayScore = (raw.match(
    /\b(saya|kamu|nak|tak|boleh|dengan|yang|ini|itu|macam|kenapa)\b/gi,
  ) ?? []).length;
  const englishScore = (raw.match(
    /\b(i|you|the|is|are|was|were|have|has|this|that|what|how|why)\b/gi,
  ) ?? []).length;
  if (malayScore > englishScore * 1.5) return 'BM';
  if (englishScore > malayScore * 1.5) return 'EN';
  return 'MIXED';
}

// ------------------------------------------------------------
// SECTION 6 — RESPONSE DEDUPLICATION
// ------------------------------------------------------------

export function isDuplicateResponse(
  candidate: string,
  recentResponses: string[],
): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const normCandidate = normalize(candidate);
  return recentResponses.some((r) => {
    const normR = normalize(r);
    const wordsC = new Set(normCandidate.split(' '));
    const wordsR = normR.split(' ');
    const overlap = wordsR.filter((w) => wordsC.has(w)).length;
    return overlap / Math.max(wordsR.length, 1) > 0.7;
  });
}

export function addToResponseHistory(
  session: FullSessionState,
  response: string,
): FullSessionState {
  const updated = [response, ...session.recentResponses].slice(0, 3);
  return { ...session, recentResponses: updated, turnCount: session.turnCount + 1 };
}

// ------------------------------------------------------------
// SECTION 7 — STUCK STATE HELPERS
// ------------------------------------------------------------

export function isStudentStuck(session: FullSessionState): boolean {
  return session.stuckCount >= 3;
}

export function isEscalationDue(
  session: FullSessionState,
  domain: SubjectDomain,
): boolean {
  return (
    session.stuckCount >= 3
    && session.layerState[domain].currentLayer >= PedagogyLayer.L3_SCAFFOLD
  );
}

// ------------------------------------------------------------
// SECTION 8 — SERIALISATION
// ------------------------------------------------------------

export type PersistedSession = Pick<
  FullSessionState,
  | 'studentId'
  | 'sessionId'
  | 'priorDomain'
  | 'stuckCount'
  | 'mathConceptReadiness'
  | 'mathPriorTopic'
  | 'sciencePriorSubject'
  | 'languagePriorWritingType'
  | 'codePriorLanguage'
  | 'genericPriorDomain'
  | 'lastConfirmedConcept'
  | 'turnCount'
  | 'studentLevel'
  | 'preferredLang'
  | 'layerState'
>;

export function serialiseSession(s: FullSessionState): PersistedSession {
  return {
    studentId:                s.studentId,
    sessionId:                s.sessionId,
    priorDomain:              s.priorDomain,
    stuckCount:               s.stuckCount,
    mathConceptReadiness:     s.mathConceptReadiness,
    mathPriorTopic:           s.mathPriorTopic,
    sciencePriorSubject:      s.sciencePriorSubject,
    languagePriorWritingType: s.languagePriorWritingType,
    codePriorLanguage:        s.codePriorLanguage,
    genericPriorDomain:       s.genericPriorDomain,
    lastConfirmedConcept:     s.lastConfirmedConcept,
    turnCount:                s.turnCount,
    studentLevel:             s.studentLevel,
    preferredLang:            s.preferredLang,
    layerState:               s.layerState,
  };
}

export function deserialiseSession(p: PersistedSession): FullSessionState {
  const base = createFullSession(p.studentId, p.sessionId, p.studentLevel);
  return {
    ...base,
    ...p,
    languageHasDraft:       false,
    languageDraftWordCount: 0,
    codeHasCodeBlock:       false,
    codeHasErrorMessage:    false,
    codeCodeLineCount:      0,
    islamicStudentLevel:    p.studentLevel,
    recentResponses:        [],
  };
}
