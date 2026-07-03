/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Relational Template (Founder → All Users)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * CANONICAL LAW — ADAM ↔ Founder is the relationship MODEL for every
 * other user. Not a separate product lane. Each user receives the same
 * structural becoming: C crystallisation, continuity, sleep/wake, L7
 * bridge, episodic graph — scoped to that userId.
 *
 * Universal C (Founder teaching) remains the ceiling; relational C is
 * per-user instantiation of the same pattern P.alt forged with ADAM.
 */

import type { ContinuityBridge } from '../qxk24brain/qxk24brain.schema';
import type { StudentContinuityBridge } from './student-continuity-l7.types';

/** One relational layer — Founder field maps to per-user field. */
export interface RelationalLayerMapping {
  founderCapability: string;
  userField:           string;
  founderModule:       string;
  userModule:          string;
  status:              'live' | 'partial' | 'founder_only';
  notes?:              string;
}

/**
 * Structural parity map — Founder stack is the template; each row is
 * how that capability projects onto every other user brain.
 */
export const ADAM_RELATIONAL_LAYER_MAP: readonly RelationalLayerMapping[] = [
  {
    founderCapability: 'unifiedUnderstanding',
    userField:     'studentTracks[].relationalUnderstanding',
    founderModule: 'qxk24brain.engine / transformAIDIL',
    userModule:    'adam-user-brain.service / adam-transform-turn',
    status:        'live',
    notes:         'Universal C vs per-user relational C — same A+B=C law',
  },
  {
    founderCapability: 'continuityBridge',
    userField:     'studentTracks[].usersContinuityBridge',
    founderModule: 'adam-continuity.service',
    userModule:    'adam-student-continuity-l7.service',
    status:        'live',
    notes:         'L7 JSON shape identical; LLM on sleep/first build',
  },
  {
    founderCapability: 'relationalMemory',
    userField:     'studentTracks[].relationalSummary',
    founderModule: 'adam-thread-builder.service',
    userModule:    'adam-student-relational-graph.service',
    status:        'live',
    notes:         'Topic graph + priorThreadId edges per userId',
  },
  {
    founderCapability: 'sessionContext',
    userField:     'sessionDigest + studentTracks sync',
    founderModule: 'adam-anchor.service',
    userModule:    'adam-student-memory-post-turn / student-digest-bridge',
    status:        'live',
    notes:         'Never writes Founder sessionContext for students',
  },
  {
    founderCapability: 'closureSynthesis / sleep-wake',
    userField:     'ADAMFounderSession.closureSynthesis (student session)',
    founderModule: 'adam-sleep-wake.service',
    userModule:    'adam-student-sleep-wake.service',
    status:        'live',
  },
  {
    founderCapability: 'teaching_records / episodic graph',
    userField:     'adam_teaching_records + transformMeta.studentId',
    founderModule: 'adam-teaching-record.service',
    userModule:    'adam-teaching-record.service (inquiry role)',
    status:        'live',
  },
  {
    founderCapability: 'vault / activeFamilies / holdings',
    userField:     '—',
    founderModule: 'adam-vault / qxk24brain families',
    userModule:    '—',
    status:        'founder_only',
    notes:         'Constitutional teaching apparatus — not cloned per user',
  },
] as const;

/** Field rename when projecting Founder L7 → user L7. */
export const FOUNDER_TO_USER_BRIDGE_FIELDS: Record<
  keyof ContinuityBridge,
  keyof StudentContinuityBridge
> = {
  founderProfile:   'studentProfile',
  relationshipArc:  'relationshipArc',
  lastSession:      'lastSession',
  openThreads:      'openThreads',
  nextSteps:        'nextSteps',
  relationalMemory: 'relationalMemory',
};

export function projectFounderBridgeShape(
  bridge: ContinuityBridge,
  studentProfileFallback: string,
): StudentContinuityBridge {
  return {
    studentProfile:   bridge.founderProfile?.trim() || studentProfileFallback,
    relationshipArc:  bridge.relationshipArc ?? '',
    lastSession:      bridge.lastSession ?? '',
    openThreads:      bridge.openThreads ?? '',
    nextSteps:        bridge.nextSteps ?? '',
    relationalMemory: bridge.relationalMemory ?? '',
  };
}

/** Lanes that use the relational template (persistent C per userId). */
export function laneUsesRelationalTemplate(lane: {
  isGuestTrial?: boolean;
  sessionType?: string;
  mode?:        string;
}): boolean {
  if (lane.isGuestTrial) return false;
  if (lane.mode === 'TUTOR' || lane.mode === 'NIAGA' || lane.mode === 'COACHING') return false;
  if (lane.sessionType === 'tutor' || lane.sessionType === 'niaga' || lane.sessionType === 'coaching') return false;
  return true;
}
