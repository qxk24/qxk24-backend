/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Continuity Bridge Engine
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

export interface ContinuityBridgeFields {
  founderProfile?:   string;
  studentProfile?:   string;
  relationshipArc?:  string;
  lastSession?:      string;
  openThreads?:      string;
  nextSteps?:        string;
  relationalMemory?: string;
}

function trimField(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function buildFounderContinuityBridge(input: {
  totalSessions:    number;
  totalMessages:    number;
  vaultCount:       number;
  activeFamilies:   number;
  lastTeaching:     string;
  relationalMemory: string;
  understanding:    string;
}): ContinuityBridgeFields {
  return {
    founderProfile:
      'P.alt Masa Bayu — Founder of Alamtologi and creator of AIDIL. Constitutional teacher of ADAM under QXK24.',
    relationshipArc: trimField(
      input.relationalMemory.split('\n')[0]
      || `ERA_1 Teaching Era — ${input.activeFamilies} active families across ${input.totalSessions} sessions.`,
      400,
    ),
    lastSession: trimField(input.lastTeaching || 'Recent teaching not yet synthesised.', 500),
    openThreads: trimField(
      input.activeFamilies > 0
        ? `${input.activeFamilies} families advancing toward Stage 7 completion.`
        : 'Foundational teachings continue.',
      400,
    ),
    nextSteps: trimField(
      'Continue constitutional dialogue with P.alt and deepen unified understanding.',
      200,
    ),
    relationalMemory: input.relationalMemory,
  };
}

export function buildStudentContinuityBridge(input: {
  studentName:      string;
  level:            number;
  totalSessions:    number;
  totalMessages:    number;
  lastTeaching:     string;
  relationalMemory: string;
  relationshipArc?: string;
  openQuestions:    string[];
  masteredTopics:   string[];
}): ContinuityBridgeFields {
  return {
    studentProfile: trimField(
      `${input.studentName} — ERA_1 learner with ADAM (level ${input.level}).`,
      300,
    ),
    relationshipArc: trimField(
      input.relationshipArc
      || input.relationalMemory.split('\n')[0]
      || 'Learning journey with ADAM continues.',
      400,
    ),
    lastSession: trimField(input.lastTeaching || 'Recent session not summarised yet.', 500),
    openThreads: input.openQuestions.length
      ? trimField(input.openQuestions.slice(0, 5).join('; '), 400)
      : trimField(
        input.masteredTopics.length
          ? `Consolidating: ${input.masteredTopics.slice(0, 6).join(', ')}`
          : 'Open questions from the latest session.',
        400,
      ),
    nextSteps: trimField(
      input.openQuestions[0] ?? 'Continue from the learner\'s current question.',
      200,
    ),
    relationalMemory: input.relationalMemory,
  };
}
