/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Intent Classifier (Rule 61 core)
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
 * Computer Engineering master classifier — SENSE subdomain + abstraction layer
 * before routing to ce-{hardware,theory,system,network}-classifier.
 */

import {
  COMPILER_SIGNALS,
  DB_SIGNALS,
  DISCRETE_SIGNALS,
  HW_SIGNALS,
  LAYER_SIGNALS,
  NETWORK_SIGNALS,
  SE_SIGNALS,
  SECURITY_DEFENSIVE,
  SECURITY_EXPLOIT,
  SYSTEM_SIGNALS,
  THEORY_SIGNALS,
  countCEHits,
} from './tutor-law.ce-intent.signals';
import {
  LAYER_PROBE_EN,
  LAYER_PROBE_MS,
  SECURITY_GUARD_EN,
  SECURITY_GUARD_MS,
} from './tutor-law.ce-intent.probes';
import {
  CEAbstractionLayer,
  CESecurityFlag,
  CESubdomain,
  type CEClassifierInput,
  type CEClassifierOutput,
} from './tutor-law.ce-intent.types';

function isMalayCETurn(norm: string): boolean {
  return /nak|tak|boleh|macam|kenapa|saya|kamu|gerbang|litar|proses|rangkaian/.test(norm);
}

function detectLayer(norm: string, prior: CEAbstractionLayer | null): CEAbstractionLayer {
  let best = CEAbstractionLayer.UNKNOWN;
  let bestScore = 0;
  for (const [layer, signals] of Object.entries(LAYER_SIGNALS)) {
    if (layer === CEAbstractionLayer.UNKNOWN) continue;
    const score = countCEHits(norm, signals);
    if (score > bestScore) {
      bestScore = score;
      best = layer as CEAbstractionLayer;
    }
  }
  return bestScore > 0 ? best : (prior ?? CEAbstractionLayer.UNKNOWN);
}

function detectSecurityFlag(norm: string): CESecurityFlag {
  if (countCEHits(norm, SECURITY_EXPLOIT) >= 1) return CESecurityFlag.EXPLOIT;
  if (countCEHits(norm, SECURITY_DEFENSIVE) >= 1) return CESecurityFlag.DEFENSIVE;
  if (/security|keselamatan|attack|serangan|hacking|penggodaman/.test(norm)) {
    return CESecurityFlag.CONCEPTUAL;
  }
  return CESecurityFlag.NONE;
}

function detectSubdomain(norm: string, prior: CESubdomain | null): CESubdomain {
  const scores: Record<CESubdomain, number> = {
    [CESubdomain.HARDWARE]:      countCEHits(norm, HW_SIGNALS),
    [CESubdomain.THEORY]:        countCEHits(norm, THEORY_SIGNALS),
    [CESubdomain.SYSTEM]:        countCEHits(norm, SYSTEM_SIGNALS),
    [CESubdomain.NETWORK]:       countCEHits(norm, NETWORK_SIGNALS),
    [CESubdomain.SOFTWARE_ENG]:  countCEHits(norm, SE_SIGNALS),
    [CESubdomain.DATABASE]:      countCEHits(norm, DB_SIGNALS),
    [CESubdomain.COMPILER]:      countCEHits(norm, COMPILER_SIGNALS),
    [CESubdomain.DISCRETE_MATH]: countCEHits(norm, DISCRETE_SIGNALS),
    [CESubdomain.UNKNOWN]:       0,
  };
  if (prior) scores[prior] += 2;

  let best: CESubdomain = CESubdomain.UNKNOWN;
  let bestScore = 0;
  for (const [sub, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = sub as CESubdomain;
    }
  }
  return best;
}

export function resolveCERouteTo(subdomain: CESubdomain): string {
  switch (subdomain) {
    case CESubdomain.HARDWARE:
      return 'ce-hardware-classifier';
    case CESubdomain.THEORY:
      return 'ce-theory-classifier';
    case CESubdomain.SYSTEM:
      return 'ce-system-classifier';
    case CESubdomain.NETWORK:
      return 'ce-network-classifier';
    case CESubdomain.SOFTWARE_ENG:
      return 'code-intent-classifier';
    case CESubdomain.DATABASE:
      return 'code-intent-classifier:db';
    case CESubdomain.COMPILER:
      return 'code-intent-classifier:compiler';
    case CESubdomain.DISCRETE_MATH:
      return 'ce-theory-classifier:discrete';
    default:
      return 'code-intent-classifier';
  }
}

/** Rule 61 CE master classifier. */
export function classifyCEIntent(input: CEClassifierInput): CEClassifierOutput {
  const { normText, stuckCount, priorSubdomain, priorLayer } = input;
  const trace: string[] = [];
  const isMs = isMalayCETurn(normText);

  const secFlag = detectSecurityFlag(normText);
  if (secFlag === CESecurityFlag.EXPLOIT) {
    trace.push('SECURITY_EXPLOIT: blocked');
    return {
      subdomain:        CESubdomain.UNKNOWN,
      abstractionLayer: CEAbstractionLayer.UNKNOWN,
      securityFlag:     CESecurityFlag.EXPLOIT,
      confidence:       'HIGH',
      layerProbe:       null,
      securityGuard:    isMs ? SECURITY_GUARD_MS : SECURITY_GUARD_EN,
      routeTo:          'BLOCKED',
      _trace:           trace,
    };
  }

  const subdomain = detectSubdomain(normText, priorSubdomain);
  trace.push(`subdomain: ${subdomain}`);

  const layer = detectLayer(normText, priorLayer);
  trace.push(`layer: ${layer}`);

  const layerAmbiguous =
    layer === CEAbstractionLayer.UNKNOWN
    && (subdomain === CESubdomain.HARDWARE || subdomain === CESubdomain.SYSTEM)
    && stuckCount === 0;

  const layerProbe = layerAmbiguous
    ? (isMs ? LAYER_PROBE_MS : LAYER_PROBE_EN)
    : null;

  const routeTo = resolveCERouteTo(subdomain);
  trace.push(`routeTo: ${routeTo}`);

  return {
    subdomain,
    abstractionLayer: layer,
    securityFlag:     secFlag,
    confidence:       subdomain !== CESubdomain.UNKNOWN ? 'HIGH' : 'LOW',
    layerProbe,
    securityGuard:    null,
    routeTo,
    _trace:           trace,
  };
}
