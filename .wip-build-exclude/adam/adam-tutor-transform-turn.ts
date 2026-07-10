/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Transform Turn (F3 — UI Guide + UID C)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { FOUNDER_USER_ID } from './adam-student.types';
import { buildEpisodeFromTurn } from './adam-transform-turn';
import {
  INQUIRY_TRANSFORM_COOLDOWN_MS,
  shouldSkipTransformDedupe,
  transformEpisodeFingerprint,
} from './adam-transform-turn.gate';
import { maybeAuditMergeTutorConventionalToMaster } from './adam-transform-master-merge';
import { mergeRelationalCToUserBrain } from './adam-user-brain.service';
import {
  findRecentTutorTransformByQuestionHash,
  recordTutorTransformEpisode,
} from '../qxk24brain/adam-teaching-record.service';
import {
  isTutorTransformEnabled,
  resolveTutorTransformASource,
  shouldTutorTransformTurn,
  type TutorTransformGateContext,
  type TutorTransformASource,
} from './adam-tutor-transform-turn.gate';

export interface TutorTransformTurnInput {
  sessionId:       string;
  userMessageId?:  string;
  studentId:       string;
  studentName?:    string;
  userMessage:     string;
  finalResponse:   string;
  rawModelStream?: string;
  recallLoaded?:   boolean;
  webSearchUsed?:  boolean;
  isGuestTrial?:   boolean;
  gateContext:     TutorTransformGateContext;
}

function mapTutorASourceToRecord(aSource: TutorTransformASource): 'tutor' | 'conventional' {
  return aSource === 'conventional' ? 'conventional' : 'tutor';
}

/** Gate → crystallise → UID episode → relational C → optional universal audit. */
export async function runTutorTransformTurn(input: TutorTransformTurnInput): Promise<void> {
  if (!isTutorTransformEnabled()) return;

  const gateInput = {
    studentId:      input.studentId,
    userMessage:    input.userMessage,
    finalResponse:  input.finalResponse,
    rawModelStream: input.rawModelStream,
    isGuestTrial:   input.isGuestTrial,
    webSearchUsed:  input.webSearchUsed,
    recallLoaded:   input.recallLoaded,
    gateContext:    input.gateContext,
  };
  if (!shouldTutorTransformTurn(gateInput)) return;

  const tutorSource = resolveTutorTransformASource({
    userMessage:   input.userMessage,
    webSearchUsed: input.webSearchUsed,
    recallLoaded:  input.recallLoaded,
  });
  if (!tutorSource) return;

  const aSource = mapTutorASourceToRecord(tutorSource);
  const founderId = FOUNDER_USER_ID;
  const studentId = input.studentId.trim();
  const questionHash = transformEpisodeFingerprint(
    input.userMessage,
    input.webSearchUsed === true,
    input.recallLoaded === true,
  );

  const duplicate = await findRecentTutorTransformByQuestionHash(
    founderId,
    studentId,
    questionHash,
    INQUIRY_TRANSFORM_COOLDOWN_MS,
  );
  if (shouldSkipTransformDedupe(Boolean(duplicate), input.webSearchUsed === true, input.recallLoaded === true)) {

    return;
  }

  const episode = await buildEpisodeFromTurn({
    userMessage:   input.userMessage,
    finalResponse: input.finalResponse,
    webSearchUsed: input.webSearchUsed === true,
    recallLoaded:  input.recallLoaded === true,
    aSource,
    founderId,
  });

  if (episode.shouldConsult || !episode.aligned) {

    return;
  }

  const doc = await recordTutorTransformEpisode({
    founderId,
    aSource,
    sessionId:        input.sessionId,
    userMessageId:    input.userMessageId,
    studentId,
    episodeSummary:   episode.episodeSummary,
    teachingIntent:   episode.teachingIntent,
    outcomeSummary:   episode.outcomeSummary,
    relationalTags:   [
      `uid:${studentId}`,
      'channel:tutor',
      'ui-guide',
      ...episode.relationalTags,
      ...episode.conventionalClaims.map((c) => c.slice(0, 40).toLowerCase()),
    ].slice(0, 14),
    conventionalRefs: episode.conventionalClaims,
    questionHash,
    webSearchUsed:    input.webSearchUsed === true,
    recallHit:        input.recallLoaded === true,
  });

  void mergeRelationalCToUserBrain(
    studentId,
    input.studentName ?? 'Pelajar',
    {
      recordId:       doc.recordId,
      episodeSummary: episode.episodeSummary,
      teachingIntent: episode.teachingIntent,
      outcomeSummary: episode.outcomeSummary,
      relationalTags: episode.relationalTags,
    },
  ).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM Tutor Transform] relational C merge failed:', msg);
  });

  if (aSource === 'conventional' && episode.conventionalClaims.length > 0) {
    void maybeAuditMergeTutorConventionalToMaster({
      founderId,
      recordId:         doc.recordId,
      episodeSummary:   episode.episodeSummary,
      teachingIntent:   episode.teachingIntent,
      outcomeSummary:   episode.outcomeSummary,
      conventionalRefs: episode.conventionalClaims,
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ADAM Tutor Transform] master merge failed:', msg);
    });
  }
}

/** Fire-and-forget — never throws to chat layer. */
export function triggerTutorTransformTurn(input: TutorTransformTurnInput): void {
  void runTutorTransformTurn(input).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM Tutor Transform] Turn error:', msg);
  });
}

/** Build gate context from profile snapshot (call before recordTutorLearningTurn). */
export function buildTutorTransformGateContext(
  profile: import('./tutor-law/tutor-law.learning-profile.types').AdamTutorLearningProfile,
): TutorTransformGateContext {
  return { profile };
}
