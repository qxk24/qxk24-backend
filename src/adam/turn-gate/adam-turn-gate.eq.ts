/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate EQ (relational hemisphere)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 *
 * EQ — lane, tone, thread, address only. No domain, mode, or display.
 */

import { resolveAdamChannel } from '../adam-channel-router';
import { isAdamNiagaMode } from '../adam-niaga-law';
import { isAdamTutorMode } from '../adam-tutor-law';
import {
  type AdamAnswerLane,
  type AdamAnswerPolicy,
} from '../adam-answer-plan';
import {
  userAddressedAdamByName,
  usersDisplayFirstName,
} from '../adam-users-greeting';
import type {
  AdamAddressPolicy,
  AdamTurnEQ,
  AdamTurnGateInput,
} from './adam-turn-gate.types';
import type { AdamSensingBundle } from './sensing-engine';
import { resolveAdamEQVirtues } from '../adam-eq-virtues';

function resolveLane(input: AdamTurnGateInput): AdamAnswerLane {
  if (isAdamTutorMode(input.mode)) return 'student';
  if (isAdamNiagaMode(input.mode)) return 'niaga';
  if (input.isFounder) return 'founder';
  return 'users';
}

function resolveAnswerPolicy(input: AdamTurnGateInput, lane: AdamAnswerLane): AdamAnswerPolicy {
  if (lane === 'student') return 'withhold';
  return 'direct';
}

/** EQ — relational hemisphere only. No usersMode / domain / display. */
export function resolveAdamTurnEQ(
  input: AdamTurnGateInput,
  sensing: AdamSensingBundle,
): AdamTurnEQ {
  const channel = resolveAdamChannel(input);
  const participantName = input.sessionMeta?.participantName?.trim() ?? '';
  const first = participantName ? usersDisplayFirstName(participantName) : undefined;
  const lane = resolveLane(input);

  const addressPolicy: AdamAddressPolicy = {
    allowHaiGreeting: userAddressedAdamByName(input.userMessage),
    participantFirstName: first,
  };

  return {
    lane,
    legacyChannelId:  channel.channelId,
    virtues:          resolveAdamEQVirtues(),
    affectiveTone:    sensing.affectiveTone,
    situationPosture: sensing.situationPosture,
    threadPosture:    sensing.threadPosture,
    addressPolicy,
    answerPolicy:     resolveAnswerPolicy(input, lane),
  };
}
