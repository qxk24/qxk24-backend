/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing Engine (Article 8 bridge)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { stripLeadingAdamSalutation } from '../../adam-response-generation';
import { userOpenedFaithDoor } from '../../adam-universal-voice';
import { classifyAdamDomain } from './domain-classifier';
import { readEmotionalSignal } from './emotional-signal';
import { fitraRecompose } from './fitra-reader';
import { readQuestionSignal } from './question-signal';
import { readSituationSignal } from './situation-signal';
import { readTrajectorySignal } from './trajectory-signal';
import type { AdamSensingBundle, AdamSensingInput } from './adam-sensing.types';

/** Entry Article 8 — satu bacaan sebelum IQ/EQ/fuse. */
export function runAdamSensingEngine(input: AdamSensingInput): AdamSensingBundle {
  const message = stripLeadingAdamSalutation(input.userMessage).trim();
  const domainRoute = classifyAdamDomain(message, input);
  return {
    message,
    surfaceKind:       readQuestionSignal(message),
    domainFacet:         domainRoute.voiceFacet,
    groundingFacet:      domainRoute.groundingFacet,
    faithDoorOpen:       userOpenedFaithDoor(input.userMessage),
    affectiveTone:       readEmotionalSignal(message),
    situationPosture:    readSituationSignal({
      message,
      recentUserMessages: input.recentUserMessages,
      recentAssistantMessages: input.recentAssistantMessages,
    }),
    threadPosture:       readTrajectorySignal(message),
  };
}

export { fitraRecompose } from './fitra-reader';
export { readQuestionSignal } from './question-signal';
export { readSituationSignal } from './situation-signal';
export type { AdamSensingBundle, AdamSensingInput, AdamSituationPosture, AdamSurfaceKind } from './adam-sensing.types';
export type { FitraRecomposeResult } from './fitra-reader';
