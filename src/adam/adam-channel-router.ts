/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Channel Router
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
 * ADAM channel taxonomy (product):
 *   Founder — isFounder
 *   Users   — universal chat (`adam-users-*` modules)
 *   Student — Tutor lane only (mode TUTOR)
 *   Niaga   — separate lane (mode NIAGA), not Student
 *
 * Single routing choke — Users and founder pipelines must not share repair logic.
 */

import type { ADAMChatMode } from './adam.types';
import type { FounderTeachingFlags } from './adam-chat-stream-turn-context';
import { isAdamNiagaMode } from './adam-niaga-law';
import { isAdamTutorMode } from './adam-tutor-law';
import {
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
  isAdamSimpleFactualTurn,
  isAdamSimpleArithmeticTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
} from './adam-response-generation';
import { isAdamUsersChannelTurn } from './adam-users-channel';

export type AdamChannelFamily = 'founder' | 'users' | 'tutor' | 'niaga';

export type FounderChannelId =
  | 'founder-journal'
  | 'founder-teaching-learner'
  | 'founder-command';

export type UsersChannelId =
  | 'users-light'
  | 'users-factual'
  | 'users-technical'
  | 'users-relational'
  | 'users-practical'
  | 'users-general';

export type AdamChannelId = FounderChannelId | UsersChannelId | 'tutor' | 'niaga';

export interface AdamResolvedChannel {
  family: AdamChannelFamily;
  channelId: AdamChannelId;
}

export function isFounderChannel(channel: AdamResolvedChannel): boolean {
  return channel.family === 'founder';
}

export function isUsersChannel(channel: AdamResolvedChannel): boolean {
  return channel.family === 'users';
}

export function isUsersTechnicalChannel(channel: AdamResolvedChannel): boolean {
  return channel.channelId === 'users-technical';
}

/** Route one turn to exactly one output channel — no shared Users/founder repair. */
export function resolveAdamChannel(input: {
  isFounder: boolean;
  mode: ADAMChatMode;
  userMessage: string;
  teachingFlags: FounderTeachingFlags;
}): AdamResolvedChannel {
  const { isFounder, mode, userMessage, teachingFlags } = input;

  if (isAdamTutorMode(mode)) {
    return { family: 'tutor', channelId: 'tutor' };
  }
  if (isAdamNiagaMode(mode)) {
    return { family: 'niaga', channelId: 'niaga' };
  }

  if (isFounder) {
    if (mode === 'JOURNAL_GEN') {
      return { family: 'founder', channelId: 'founder-journal' };
    }
    if (teachingFlags.founderTeachingLearnerTurn) {
      return { family: 'founder', channelId: 'founder-teaching-learner' };
    }
    return { family: 'founder', channelId: 'founder-command' };
  }

  if (isAdamLightChatTurn(userMessage)) {
    return { family: 'users', channelId: 'users-light' };
  }
  if (isAdamPracticalAdvisoryTurn(userMessage)) {
    return { family: 'users', channelId: 'users-practical' };
  }
  if (isAdamRelationalPersonalTurn(userMessage)) {
    return { family: 'users', channelId: 'users-relational' };
  }
  if (isAdamSimpleFactualTurn(userMessage) || isAdamSimpleArithmeticTurn(userMessage)) {
    return { family: 'users', channelId: 'users-factual' };
  }
  if (
    isAdamTechnicalKonvensionalDisplayTurn(userMessage)
    || isAdamUsersChannelTurn(userMessage)
  ) {
    return { family: 'users', channelId: 'users-technical' };
  }
  return { family: 'users', channelId: 'users-general' };
}
