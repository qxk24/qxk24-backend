/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing — Fitra Reader (fuse / recompose)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 *
 * FitraReader.recompose — IQ/EQ conflict resolution (Article 8).
 * IQ menang domain; EQ menang nada; integrity sentiasa ocean.
 */

import type { AdamDisplayChannel } from '../adam-turn-gate.types';
import type { AdamTurnEQ, AdamTurnIQ } from '../adam-turn-gate.types';
import { syncFormalDataLayoutFromChannel } from '../adam-turn-gate.display';
import type { AdamSensingBundle } from './adam-sensing.types';

export interface FitraRecomposeResult {
  iq: AdamTurnIQ;
  eq: AdamTurnEQ;
  fuseNotes: string[];
}

function downgradeDisplay(channel: AdamDisplayChannel, eq: AdamTurnEQ): AdamDisplayChannel {
  if (eq.affectiveTone === 'light' || eq.affectiveTone === 'prose-craft') {
    return 'none';
  }
  return channel;
}

/** Fitra fuse — apply constitutional conflict rules before flags/plan. */
export function fitraRecompose(
  rawIq: AdamTurnIQ,
  eq: AdamTurnEQ,
  sensing: AdamSensingBundle,
): FitraRecomposeResult {
  const fuseNotes: string[] = [];
  let iq: AdamTurnIQ = { ...rawIq };

  if (iq.domainFacet === 'faith' && !sensing.faithDoorOpen) {
    iq = {
      ...iq,
      domainFacet: 'general',
      groundingFacet: 'general',
      displayChannel: 'none',
      searchProfile: null,
    };
    fuseNotes.push('faith→general');
  }

  if (eq.affectiveTone === 'prose-craft') {
    iq = {
      ...iq,
      domainFacet: 'general',
      groundingFacet: 'general',
      displayChannel: 'none',
      searchProfile: null,
    };
    fuseNotes.push('prose-craft→general');
  }

  const displayChannel = downgradeDisplay(iq.displayChannel, eq);
  if (displayChannel !== iq.displayChannel) {
    fuseNotes.push('eq→display-none');
  }

  iq = {
    ...iq,
    displayChannel,
    answerShape: syncFormalDataLayoutFromChannel(iq.answerShape, displayChannel),
  };

  return { iq, eq, fuseNotes };
}
