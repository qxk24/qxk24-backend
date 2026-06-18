/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate IQ (analytic hemisphere)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import { resolveAdamAnswerShape } from '../adam-answer-shape';
import { resolveAdamAnswerComposer } from '../adam-answer-composer';
import {
  buildUsersDomainSearchHint,
} from '../adam-users-domain-router';
import type { AdamAnswerPlan } from '../adam-answer-plan';
import type { AdamTurnEQ, AdamTurnGateInput, AdamTurnIQ } from './adam-turn-gate.types';
import { resolveDisplayChannel } from './adam-turn-gate.display';
import {
  resolveIqContentIntent,
  resolveIqStructured,
  resolveIqUsersMode,
} from './adam-turn-gate.iq-mode';
import type { AdamSensingBundle } from './sensing-engine';

/** IQ — domain, shape, display, mode. No relational tone or address. */
export function resolveAdamTurnIQ(
  input: AdamTurnGateInput,
  eq: AdamTurnEQ,
  sensing: AdamSensingBundle,
): AdamTurnIQ {
  const message = sensing.message;
  const domainFacet = input.isFounder || eq.lane !== 'users'
    ? 'general' as const
    : sensing.domainFacet;

  const usersMode = resolveIqUsersMode(
    eq.lane,
    sensing.surfaceKind,
    domainFacet,
    eq.affectiveTone,
  );
  const contentIntent = resolveIqContentIntent(sensing.surfaceKind, eq.affectiveTone);
  const structured = resolveIqStructured(eq.lane, usersMode);

  const answerShape = resolveAdamAnswerShape(message, {
    structured,
    usersDomain: eq.lane === 'users' ? domainFacet : undefined,
  });

  const displayChannel = eq.lane === 'users'
    ? resolveDisplayChannel(domainFacet, answerShape.intent, message, structured)
    : 'none' as const;

  const stubPlan: AdamAnswerPlan = {
    lane:            eq.lane,
    usersMode,
    usersIntent:     contentIntent,
    answerPolicy:    eq.answerPolicy,
    legacyChannelId: eq.legacyChannelId,
    answerShape,
    usersDomain:     domainFacet,
    displayChannel,
  };
  const composer = resolveAdamAnswerComposer(message, stubPlan);

  return {
    domainFacet,
    surfaceKind: sensing.surfaceKind,
    usersMode,
    contentIntent,
    shapeIntent: answerShape.intent,
    topicTitle: composer.topicTitle,
    secondaryTitle: composer.secondaryHeader ?? null,
    displayChannel,
    searchProfile: eq.lane === 'users'
      ? buildUsersDomainSearchHint(domainFacet, message)
      : null,
    composer,
    answerShape,
  };
}
