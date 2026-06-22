/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor — CE Networking Classifier
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Depends on : tutor-law.ce-intent-classifier.ts
 * Consumed by: tutor-law.code-intent-classifier.ts (ce-network route)
 *
 * KEY PEDAGOGY: trace packet/layer first; no complete router configs for exams.
 */

export type {
  NetworkClassifierInput,
  NetworkClassifierOutput,
} from './tutor-law.ce-network.types';

export {
  NetworkIntent,
  NetworkTopic,
} from './tutor-law.ce-network.types';

export { classifyNetworkIntent } from './tutor-law.ce-network-classifier.core';

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { classifyNetworkIntent } from './tutor-law.ce-network-classifier.core';
import {
  NET_ADDRESS_MARKERS,
  NET_PACKET_MARKERS,
  NET_TOPOLOGY_MARKERS,
  countNetworkHits,
} from './tutor-law.ce-network.signals';
import type { CEClassifierOutput } from './tutor-law.ce-intent.types';
import { CEAbstractionLayer } from './tutor-law.ce-intent.types';
import type {
  NetworkClassifierInput,
  NetworkClassifierOutput,
  NetworkTopic,
} from './tutor-law.ce-network.types';

export const CE_NETWORK_ROUTE = 'ce-network-classifier';

export function shouldRouteToCENetwork(
  ceRouting: CEClassifierOutput | null | undefined,
): boolean {
  return ceRouting?.routeTo === CE_NETWORK_ROUTE;
}

export function buildNetworkClassifierInput(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    networkPriorTopic?: NetworkTopic | null;
    stuckCount?:        number;
  };
}): NetworkClassifierInput {
  const rawText = input.userMessage ?? '';
  const normText = normalizeMathClassifierText(rawText);

  return {
    rawText,
    normText,
    hasPacketDesc:   countNetworkHits(normText, NET_PACKET_MARKERS) >= 1,
    hasAddressing:   countNetworkHits(normText, NET_ADDRESS_MARKERS) >= 1,
    hasTopologyDesc: countNetworkHits(normText, NET_TOPOLOGY_MARKERS) >= 1,
    stuckCount:      input.sessionState?.stuckCount ?? 0,
    priorTopic:      input.sessionState?.networkPriorTopic ?? null,
    abstractionLayer: input.ceRouting?.abstractionLayer ?? CEAbstractionLayer.NETWORK,
  };
}

export function classifyTutorCENetworkIntent(input: {
  userMessage:         string;
  recentUserMessages?: string[];
  ceRouting?:          CEClassifierOutput | null;
  sessionState?: {
    networkPriorTopic?: NetworkTopic | null;
    stuckCount?:        number;
  };
}): NetworkClassifierOutput | null {
  if (!shouldRouteToCENetwork(input.ceRouting)) return null;
  return classifyNetworkIntent(buildNetworkClassifierInput(input));
}
