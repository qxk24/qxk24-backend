/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Fuse
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import {
  type AdamAnswerPlan,
} from '../adam-answer-plan';
import { usersDomainRequiresGroundingSearch } from '../adam-users-domain-router';
import type {
  AdamTurnEQ,
  AdamTurnGateDecision,
  AdamTurnGateFlags,
  AdamTurnGateInput,
  AdamTurnIQ,
} from './adam-turn-gate.types';
import { syncFormalDataLayoutFromChannel } from './adam-turn-gate.display';
import { formatAdamTurnGateLog } from './adam-turn-gate.log';
import { resolveGateKnowledgeMode } from './adam-turn-gate.knowledge';
import { fitraRecompose } from './sensing-engine/fitra-reader';
import type { AdamSensingBundle } from './sensing-engine/adam-sensing.types';

function buildGateFlags(
  iq: AdamTurnIQ,
  eq: AdamTurnEQ,
  sensing: AdamSensingBundle,
  input: AdamTurnGateInput,
): AdamTurnGateFlags {
  const usersLane = eq.lane === 'users';
  const formalDisplayLaw = iq.displayChannel !== 'none';
  const faithPermitted = sensing.faithDoorOpen && iq.domainFacet === 'faith';
  const konvensionalSurface = usersLane && !faithPermitted;
  const relationalVoice = eq.affectiveTone === 'relational' || eq.affectiveTone === 'stressed';
  const knowledgeMode = resolveGateKnowledgeMode(input, iq, eq, sensing, faithPermitted);
  const groundingSearch = usersDomainRequiresGroundingSearch(iq.groundingFacet);

  return {
    domainTeachingPack: usersLane && iq.usersMode === 'technical'
      && groundingSearch
      && eq.affectiveTone !== 'prose-craft'
      && eq.affectiveTone !== 'light',
    formalDisplayLaw,
    usersTechnicalFinalize: usersLane && iq.usersMode === 'technical',
    searchEnabled: usersLane && eq.affectiveTone !== 'light',
    displayAlign: usersLane && formalDisplayLaw,
    integrityGuard: true,
    faithPermitted,
    konvensionalSurface,
    relationalVoice,
    knowledgeMode,
  };
}

export function buildAnswerPlanFromGate(iq: AdamTurnIQ, eq: AdamTurnEQ): AdamAnswerPlan {
  const answerShape = syncFormalDataLayoutFromChannel(iq.answerShape, iq.displayChannel);
  return {
    lane:            eq.lane,
    usersMode:       iq.usersMode,
    usersIntent:     iq.contentIntent,
    answerPolicy:    eq.answerPolicy,
    legacyChannelId: eq.legacyChannelId,
    answerShape,
    answerComposer:  iq.composer,
    usersDomain:     eq.lane === 'users' ? iq.domainFacet : undefined,
    displayChannel:  iq.displayChannel,
  };
}

/** Fuse IQ + EQ via FitraReader — flags + answer plan. */
export function fuseAdamTurnGate(
  rawIq: AdamTurnIQ,
  eq: AdamTurnEQ,
  input: AdamTurnGateInput,
  sensing: AdamSensingBundle,
): AdamTurnGateDecision {
  const { iq, eq: fusedEq, fuseNotes } = fitraRecompose(rawIq, eq, sensing);

  const flags = buildGateFlags(iq, fusedEq, sensing, input);
  const answerPlan = buildAnswerPlanFromGate(iq, fusedEq);
  const decision: AdamTurnGateDecision = {
    schemaVersion: 2,
    sensing,
    iq,
    eq: fusedEq,
    flags,
    answerPlan,
    fuseNotes,
    logLine: '',
  };
  decision.logLine = formatAdamTurnGateLog(decision);
  return decision;
}
