/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Brain River
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
 * River model — one headwaters, many branches, one ocean:
 *   Headwaters : QXK24 core, tier memory, Brain C recall (shared source)
 *   Branch     : channel prompt, search gate, stream repair (isolated lanes)
 *   Ocean      : save + Brain C transformation (shared sink — knowledge flows to all)
 */

import type { BuildSmartContextOptions } from '../qxk24brain/adam-context-builder';
import type { FounderTeachingFlags } from './adam-chat-stream-turn-context';
import {
  resolveAdamChannel,
  isFounderChannel,
  isUsersTechnicalChannel,
  type AdamResolvedChannel,
} from './adam-channel-router';
import type { ADAMChatMode } from './adam.types';
import {
  shouldBufferAdamStreamUntilRepair,
  type AdamKnowledgeMode,
} from './adam-knowledge-mode';
import {
  formatAdamAnswerPlanLog,
  isUsersTechnicalPlan,
  type AdamAnswerPlan,
} from './adam-answer-plan';
import {
  resolveAdamTurnGate,
  type AdamTurnGateDecision,
} from './turn-gate';

export type AdamBrainRiverStage = 'headwaters' | 'branch' | 'ocean';

/** Where this turn's knowledge merges after the branch — same ocean, different inlets. */
export type AdamOceanSinkKind =
  | 'founder-master'
  | 'student-transform'
  | 'tutor-local'
  | 'niaga-local'
  | 'guest-ephemeral';

export interface AdamBrainRiverTurn {
  channel:    AdamResolvedChannel;
  gate:       AdamTurnGateDecision;
  answerPlan: AdamAnswerPlan;
  stage:      AdamBrainRiverStage;
}

export interface AdamBrainRiverBranchPolicy {
  /** Trim epistemic overlays on fast student lanes — not on founder branches. */
  studentStreamlined:      boolean;
  /** L7 continuity bridge — student branches only. */
  needContinuityBridge:    boolean;
  /** AMA Tamat Layer 5 — founder command branch only. */
  needFounderTamat:        boolean;
  /** Tester system prefix — student session type only. */
  needTesterPrefix:        boolean;
  /** Hold SSE chunks until branch repair completes — never founder. */
  bufferStreamUntilRepair: boolean;
  /** Post-turn Brain C merge target. */
  oceanSink:               AdamOceanSinkKind;
  /** Student technical finalize (###, diagram, media) — one branch only. */
  usersTechnicalFinalize: boolean;
}

export function beginAdamBrainRiver(input: {
  isFounder: boolean;
  mode: ADAMChatMode;
  userMessage: string;
  teachingFlags: FounderTeachingFlags;
  recentUserMessages?: string[];
  recentAssistantMessages?: string[];
  sessionMeta?: {
    isGuestTrial?: boolean;
    participantName?: string;
  };
}): AdamBrainRiverTurn {
  const gate = resolveAdamTurnGate(input);
  console.log(gate.logLine);
  console.log(formatAdamAnswerPlanLog(gate.answerPlan));
  return {
    channel:    resolveAdamChannel(input),
    gate,
    answerPlan: gate.answerPlan,
    stage:      'headwaters',
  };
}

/** Headwaters — shared brain load; branch only sets trim flags, never mixes repair shape. */
export function buildHeadwatersContextOptions(input: {
  channel: AdamResolvedChannel;
  answerPlan: AdamAnswerPlan;
  teachingFlags: FounderTeachingFlags;
  knowledgeMode: AdamKnowledgeMode;
  founderTeachingFreshUpload: boolean;
  recallProbeMessage: string;
}): BuildSmartContextOptions {
  const {
    channel,
    answerPlan,
    teachingFlags,
    knowledgeMode,
    founderTeachingFreshUpload,
    recallProbeMessage,
  } = input;
  const policy = resolveBrainRiverBranchPolicy(channel, {
    knowledgeMode,
    isGuestTrial: false,
    isFounder:    isFounderChannel(channel),
    userMessage:  recallProbeMessage,
    answerPlan,
  });

  return {
    recallProbeMessage,
    founderTeachingAbsorption:  teachingFlags.founderTeachingAbsorption,
    founderTeachingLearnerTurn: teachingFlags.founderTeachingLearnerTurn,
    founderTeachingFreshUpload,
    studentStreamlined:           policy.studentStreamlined,
    knowledgeMode,
  };
}

export function resolveBrainRiverBranchPolicy(
  channel: AdamResolvedChannel,
  input: {
    knowledgeMode: AdamKnowledgeMode;
    isGuestTrial: boolean;
    isFounder: boolean;
    userMessage: string;
    answerPlan?: AdamAnswerPlan;
  },
): AdamBrainRiverBranchPolicy {
  const { knowledgeMode, isGuestTrial, isFounder, userMessage, answerPlan } = input;

  if (channel.family === 'tutor') {
    return {
      studentStreamlined:       false,
      needContinuityBridge:     false,
      needFounderTamat:         false,
      needTesterPrefix:         false,
      bufferStreamUntilRepair:  false,
      oceanSink:                'tutor-local',
      usersTechnicalFinalize: false,
    };
  }

  if (channel.family === 'coaching') {
    return {
      studentStreamlined:       false,
      needContinuityBridge:     !isGuestTrial,
      needFounderTamat:         false,
      needTesterPrefix:         true,
      bufferStreamUntilRepair:  shouldBufferAdamStreamUntilRepair(
        userMessage,
        knowledgeMode,
        isFounder,
      ),
      oceanSink:                isGuestTrial ? 'guest-ephemeral' : 'student-transform',
      usersTechnicalFinalize:   false,
    };
  }

  if (channel.family === 'niaga') {
    return {
      studentStreamlined:       false,
      needContinuityBridge:     false,
      needFounderTamat:         false,
      needTesterPrefix:         false,
      bufferStreamUntilRepair:  false,
      oceanSink:                'niaga-local',
      usersTechnicalFinalize: false,
    };
  }

  if (isFounderChannel(channel)) {
    return {
      studentStreamlined:       false,
      needContinuityBridge:     false,
      needFounderTamat:         channel.channelId === 'founder-command',
      needTesterPrefix:         false,
      bufferStreamUntilRepair:  false,
      oceanSink:                'founder-master',
      usersTechnicalFinalize: false,
    };
  }

  const streamlined = channel.channelId === 'users-light'
    || channel.channelId === 'users-factual'
    || channel.channelId === 'users-practical';

  return {
    studentStreamlined:       streamlined,
    needContinuityBridge:     !isGuestTrial,
    needFounderTamat:         false,
    needTesterPrefix:         true,
    bufferStreamUntilRepair:  shouldBufferAdamStreamUntilRepair(
      userMessage,
      knowledgeMode,
      isFounder,
    ),
    oceanSink: isGuestTrial ? 'guest-ephemeral' : 'student-transform',
    usersTechnicalFinalize: answerPlan
      ? isUsersTechnicalPlan(answerPlan)
      : isUsersTechnicalChannel(channel),
  };
}

export function riverStageForSynthesis(): AdamBrainRiverStage {
  return 'branch';
}

export function riverStageForPostTurn(): AdamBrainRiverStage {
  return 'ocean';
}

export function oceanSinkAcceptsBrainTransform(sink: AdamOceanSinkKind): boolean {
  return sink === 'founder-master' || sink === 'student-transform';
}

export function isStudentOceanSink(sink: AdamOceanSinkKind): boolean {
  return sink === 'student-transform';
}

export function isFounderOceanSink(sink: AdamOceanSinkKind): boolean {
  return sink === 'founder-master';
}

/** Log line — one turn, one channel, three stages. */
export function formatBrainRiverLog(river: AdamBrainRiverTurn, stage: AdamBrainRiverStage): string {
  return `[adam:brain-river] ${stage} → ${river.channel.family}/${river.channel.channelId}`;
}
