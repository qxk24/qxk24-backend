/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Unified Transform Turn
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * All A → C — inquiry, conventional (web), Founder via transformAIDIL.
 * Brain C holds understood synthesis only — no raw data archives.
 */

import { extractEpisodeDeterministically } from '../qxk24brain/deep-ul';
import {
  findRecentTransformByQuestionHash,
  recordTransformEpisode,
} from '../qxk24brain/adam-teaching-record.service';
import { FOUNDER_USER_ID } from './adam-student.types';
import type { UsersKnowledgeTier } from './adam-universal-scholar';
import type { AdamUsersDomainFacet } from './adam-users-domain-router';
import { triggerInquiryMasterMerge } from './adam-transform-master-merge';
import { mergeRelationalCToUserBrain } from './adam-user-brain.service';
import type { TeachingTransformContext } from '../qxk24brain/adam-teaching-record.service';
import {
  type TransformASource,
  type TransformTurnGateInput,
  resolveTransformASource,
  transformEpisodeFingerprint,
  shouldSkipTransformDedupe,
  shouldTransformTurn,
  shouldFounderTransformTurn,
  INQUIRY_TRANSFORM_COOLDOWN_MS,
  MIN_TRANSFORM_EPISODE_CHARS,
} from './adam-transform-turn.gate';

export interface TransformTurnInput {
  aSource?:              TransformASource;
  founderId?:            string;
  sessionId:             string;
  userMessageId?:        string;
  studentId?:            string;
  studentName?:          string;
  userMessage:           string;
  finalResponse?:        string;
  rawModelStream?:       string;
  recallLoaded?:         boolean;
  webSearchUsed?:        boolean;
  isGuestTrial?:         boolean;
  isFounder?:            boolean;
  skipEpisodicAppend?:   boolean;
  usersKnowledgeTier?: UsersKnowledgeTier;
  usersDomainFacet?:    AdamUsersDomainFacet;
}

export interface CrystallisedEpisode {
  episodeSummary:     string;
  teachingIntent:     string;
  outcomeSummary:     string;
  relationalTags:     string[];
  conventionalClaims: string[];
  aligned:            boolean;
  shouldConsult:      boolean;
  reason?:            string;
}

function heuristicEpisode(
  userMessage: string,
  finalResponse: string,
): CrystallisedEpisode {
  const q = userMessage.trim().slice(0, 200);
  const summary = q.length > 80 ? `${q.slice(0, 77)}…` : q;
  return {
    episodeSummary:     summary || 'Inquiry synthesis',
    teachingIntent:     `Topic: ${summary}`,
    outcomeSummary:       finalResponse.trim().slice(0, 2000),
    relationalTags:       [],
    conventionalClaims:   [],
    aligned:              finalResponse.trim().length >= MIN_TRANSFORM_EPISODE_CHARS,
    shouldConsult:        false,
    reason:               'Heuristic crystallisation fallback',
  };
}

function extractConventionalClaims(
  finalResponse: string,
  webSearchUsed: boolean,
): string[] {
  if (!webSearchUsed) return [];

  return finalResponse
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 12 && line.length < 160)
    .slice(0, 5);
}

/** Deterministic UL — A understood into C episode index (never raw chat/HTML). */
export async function buildEpisodeFromTurn(input: {
  userMessage:   string;
  finalResponse: string;
  webSearchUsed: boolean;
  recallLoaded:  boolean;
  aSource:       TransformASource;
  founderId:     string;
}): Promise<CrystallisedEpisode> {
  const fallback = heuristicEpisode(input.userMessage, input.finalResponse);
  const response = input.finalResponse.trim();
  if (!response) return fallback;

  const extracted = extractEpisodeDeterministically(input.userMessage, response);
  const relationalTags = extracted.principlesTouched.map((p) => p.toLowerCase());
  const conventionalClaims = extractConventionalClaims(response, input.webSearchUsed);

  return {
    episodeSummary:     extracted.summary,
    teachingIntent:     extracted.intent,
    outcomeSummary:     `${extracted.outcome}: ${response.slice(0, 500)}`,
    relationalTags,
    conventionalClaims,
    aligned:            response.length >= MIN_TRANSFORM_EPISODE_CHARS,
    shouldConsult:      extracted.outcome === 'BLOCKED_BY_CONSTRAINT',
    reason:             'Deterministic UL episode extraction',
  };
}

/** P3 — Founder channel adapter: processLongTeaching → transformAIDIL (full Entity C + master). */
async function runFounderTransformAdapter(input: TransformTurnInput): Promise<void> {
  if (!shouldFounderTransformTurn({
    userMessage:         input.userMessage,
    skipEpisodicAppend:  input.skipEpisodicAppend,
  })) {
    return;
  }

  const founderId = input.founderId ?? FOUNDER_USER_ID;
  const ctx: TeachingTransformContext = {
    sessionId:        input.sessionId,
    founderMessageId: input.userMessageId,
    skipEpisodicAppend: input.skipEpisodicAppend,
  };

  const { processLongTeaching } = await import('../qxk24brain/adam-tcp.service');
  await processLongTeaching(
    input.userMessage,
    input.sessionId,
    founderId,
    'Long Teaching',
    'CAHAYA',
    ctx,
  );

}

/** Gate → crystallise → align → persist C (no raw A). */
export async function runTransformTurn(input: TransformTurnInput): Promise<void> {
  if (input.isFounder) {
    await runFounderTransformAdapter(input);
    return;
  }

  const aSource = input.aSource ?? resolveTransformASource({
    userMessage:   input.userMessage,
    webSearchUsed: input.webSearchUsed,
    recallLoaded:  input.recallLoaded,
  });
  if (!aSource) return;

  const gateInput: TransformTurnGateInput = {
    aSource,
    userMessage:    input.userMessage,
    finalResponse:  input.finalResponse ?? '',
    rawModelStream: input.rawModelStream,
    isGuestTrial:   input.isGuestTrial,
    isFounder:      input.isFounder,
    webSearchUsed:  input.webSearchUsed,
    recallLoaded:   input.recallLoaded,
  };
  if (!shouldTransformTurn(gateInput)) return;
  if (!input.finalResponse?.trim()) return;

  const founderId = input.founderId ?? FOUNDER_USER_ID;
  const questionHash = transformEpisodeFingerprint(
    input.userMessage,
    input.webSearchUsed === true,
    input.recallLoaded === true,
  );

  const duplicate = await findRecentTransformByQuestionHash(
    founderId,
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

  const doc = await recordTransformEpisode({
    founderId,
    aSource,
    sessionId:          input.sessionId,
    userMessageId:      input.userMessageId,
    studentId:          input.studentId,
    episodeSummary:     episode.episodeSummary,
    teachingIntent:     episode.teachingIntent,
    outcomeSummary:     episode.outcomeSummary,
    relationalTags:     [
      ...(input.usersDomainFacet && input.usersDomainFacet !== 'general'
        ? [`domain:${input.usersDomainFacet}`]
        : []),
      ...episode.relationalTags,
      ...episode.conventionalClaims.map((c) => c.slice(0, 40).toLowerCase()),
    ].slice(0, 12),
    conventionalRefs:   episode.conventionalClaims,
    questionHash,
    webSearchUsed:      input.webSearchUsed === true,
    recallHit:          input.recallLoaded === true,
    tier:               input.usersKnowledgeTier ?? 1,
  });

  if (input.studentId?.trim()) {
    void mergeRelationalCToUserBrain(
      input.studentId,
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
      console.error('[ADAM User Brain] relational C merge failed:', msg);
    });
  }

  triggerInquiryMasterMerge({
    founderId,
    recordId:         doc.recordId,
    aSource,
    episodeSummary:   episode.episodeSummary,
    teachingIntent:   episode.teachingIntent,
    outcomeSummary:   episode.outcomeSummary,
    conventionalRefs: episode.conventionalClaims,
  });
}

/** Fire-and-forget — never throws to chat layer. */
export function triggerTransformTurn(input: TransformTurnInput): void {
  void runTransformTurn(input).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM Transform] Turn error:', msg);
  });
}
