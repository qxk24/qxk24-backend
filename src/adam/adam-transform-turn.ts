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

import { resolveBrainDeepModel } from '../config/llm-models';
import { isLlmConfigured, llmCompleteUserPrompt } from '../llm/llm-client';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import {
  findRecentTransformByQuestionHash,
  recordTransformEpisode,
} from '../qxk24brain/adam-teaching-record.service';
import { FOUNDER_USER_ID } from './adam-student.types';
import type { UsersKnowledgeTier } from './adam-universal-scholar';
import type { AdamUsersDomainFacet } from './adam-users-domain-router';
import { ADAM_TRANSFORM_CRYSTALLISATION_LAW } from './adam-transform-crystallisation-law';
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

function parseEpisodeJson(raw: string, fallback: CrystallisedEpisode): CrystallisedEpisode {
  const trimmed = raw.trim();
  try {
    const parsed = { ...fallback, ...JSON.parse(trimmed) as CrystallisedEpisode };
    if (!Array.isArray(parsed.conventionalClaims)) parsed.conventionalClaims = [];
    return parsed;
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
      try {
        const parsed = { ...fallback, ...JSON.parse(fence[1].trim()) as CrystallisedEpisode };
        if (!Array.isArray(parsed.conventionalClaims)) parsed.conventionalClaims = [];
        return parsed;
      } catch {
        // fall through
      }
    }
    const brace = trimmed.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        const parsed = { ...fallback, ...JSON.parse(brace[0]) as CrystallisedEpisode };
        if (!Array.isArray(parsed.conventionalClaims)) parsed.conventionalClaims = [];
        return parsed;
      } catch {
        // fall through
      }
    }
    return fallback;
  }
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
    reason:               'Heuristic crystallisation — LLM unavailable',
  };
}

/** Brain-tier LLM — A understood into C episode index (never raw chat/HTML). */
export async function buildEpisodeFromTurn(input: {
  userMessage:   string;
  finalResponse: string;
  webSearchUsed: boolean;
  recallLoaded:  boolean;
  aSource:       TransformASource;
  founderId:     string;
}): Promise<CrystallisedEpisode> {
  const fallback = heuristicEpisode(input.userMessage, input.finalResponse);
  if (!isLlmConfigured()) return fallback;

  try {
    const master = await getOrCreateMaster(input.founderId);
    const raw = await llmCompleteUserPrompt(
      prependCoreToSystem(
        `You are ADAM — crystallise A into C episode metadata. JSON only.\n\n${ADAM_TRANSFORM_CRYSTALLISATION_LAW}`,
        true,
      ),
      `TRANSFORM — aSource=${input.aSource}. All A → C. No raw data retention.

FOUNDER UNIFIED UNDERSTANDING (supreme — episode must not contradict):
${master.unifiedUnderstanding.slice(0, 5000)}

QUESTION / A_inquiry:
${input.userMessage.trim().slice(0, 2000)}

ADAM SANITISED REPLY (synthesise — do NOT paste verbatim):
${input.finalResponse.trim().slice(0, 4000)}

CONTEXT: recallHit=${input.recallLoaded} webSearchUsed=${input.webSearchUsed}

RULES:
- teachingIntent: one line — what was asked (not full transcript)
- outcomeSummary: ADAM understood synthesis — universal scholar voice
- conventionalClaims: 0–5 short verified fact lines IF webSearchUsed (no URLs, no HTML)
- relationalTags: 3–8 topic tokens
- aligned: false if contradicts Founder or ungrounded
- NEVER store chat log text in outcomeSummary

JSON:
{
  "episodeSummary": "...",
  "teachingIntent": "...",
  "outcomeSummary": "...",
  "relationalTags": ["earth", "geoid"],
  "conventionalClaims": ["Earth is an oblate spheroid"],
  "aligned": true,
  "shouldConsult": false,
  "reason": ""
}`,
      resolveBrainDeepModel(),
      1200,
    );
    const parsed = parseEpisodeJson(raw, fallback);
    if (!parsed.episodeSummary?.trim()) parsed.episodeSummary = fallback.episodeSummary;
    if (!parsed.teachingIntent?.trim()) parsed.teachingIntent = fallback.teachingIntent;
    if (!parsed.outcomeSummary?.trim()) parsed.outcomeSummary = fallback.outcomeSummary;
    if (!Array.isArray(parsed.relationalTags)) parsed.relationalTags = fallback.relationalTags;
    if (!Array.isArray(parsed.conventionalClaims)) parsed.conventionalClaims = [];
    return parsed;
  } catch (err) {
    console.error('[ADAM Transform] Episode crystallisation failed:', err);
    return fallback;
  }
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
  console.log('[ADAM Transform] Founder C indexed via transformAIDIL', founderId);
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
    console.log('[ADAM Transform] Skip dedupe — recent episode', duplicate?.recordId);
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
    console.log('[ADAM Transform] Skip persist — alignment', episode.reason ?? 'not aligned');
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

  console.log('[ADAM Transform] C indexed', doc.recordId, aSource);

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
