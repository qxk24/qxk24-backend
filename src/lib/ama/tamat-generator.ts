/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Tamat Generator (Layer 5 Synthesis Point)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Kotak 20–22 (Tamat) — Layer 5 synthesis anchor (Tahap 2–3).
 */

import {
  AMA_LEVEL_ERA_1,
  AMA_TAMAT_COHERENCE_THRESHOLD,
  type AmaFlowMode,
  type AmaLane,
} from './ama.types';
import type { AmaFlowRouteResult } from './ama.types';
import { routeAmaFlow } from './ama-flow.service';
import { resolveOassActivation, type OassActivation } from './ama-oass-gate';
import { isAmaBrainV2Enabled, isAmaTamatOassEnabled } from './ama.config';
import {
  crossLaneCoherenceHeuristic,
  persistTamatDnSegment,
  resolveCrossLaneCoherence,
} from './ama-neuro-validation.service';

export { isAmaBrainV2Enabled, isAmaTamatOassEnabled };
export { resolveOassActivation, type OassActivation };

export interface TamatInput {
  kr:         string;
  kn:         string;
  mode:       AmaFlowMode;
  oassActive: boolean;
}

export interface TamatOutput {
  body:           string;
  coherence:      number;
  integrated:     boolean;
  sentenceCount:  number;
  principleBlock: string | null;
  contextBlock:   string | null;
}

const MAX_SENTENCES = 3;

function countSentences(text: string): number {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length;
}

function truncateToMaxSentences(text: string, max: number): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, max).join(' ');
}

/** Heuristic coherence Kr ↔ Kn — delegates to neuro service (Tahap 4 EEG-calibrated when enabled) */
export function crossLaneCoherence(kr: string, kn: string): number {
  return resolveCrossLaneCoherence(kr, kn).score;
}

/** @deprecated alias — tests and legacy imports */
export { crossLaneCoherenceHeuristic };

export function weightedMerge(kr: string, kn: string, krWeight = 0.6): string {
  const p = truncateToMaxSentences(kr.trim(), 1);
  const c = truncateToMaxSentences(kn.trim(), 1);
  const bridge = krWeight >= 0.5
    ? 'Dalam konteks itu, prinsipnya berbunyi begini.'
    : 'Rasa dan situasinya mengatakan begini.';
  const integrated = `${p} ${bridge} ${c}`;
  return truncateToMaxSentences(integrated, MAX_SENTENCES);
}

export interface TamatSingleLaneInput {
  kr:   string;
  kn:   string;
  lane: AmaLane;
}

/** Single lane Tamat — OAT path when OASS not triggered */
export function generateTamatSingleLane(input: TamatSingleLaneInput): TamatOutput {
  const krT = input.kr.trim();
  const knT = input.kn.trim();
  const primary = input.lane === 'IKJ' ? krT : knT;
  const fallback = input.lane === 'IKJ' ? knT : krT;
  const body = truncateToMaxSentences(primary || fallback, MAX_SENTENCES);

  return {
    body,
    coherence:      1,
    integrated:     false,
    sentenceCount:  countSentences(body),
    principleBlock: input.lane === 'IKJ' ? (primary || null) : null,
    contextBlock:   input.lane === 'LWJ' ? (primary || null) : null,
  };
}

/** Layer 5 prompt block — Kotak 20–22 Tamat anchor */
export function buildTamatLayer5PromptBlock(
  route: AmaFlowRouteResult,
  tamat: TamatOutput,
  oass: OassActivation,
): string {
  const flowLine = oass.active
    ? `OASS ACTIVE — cross-lane integration permitted (coherence ${tamat.coherence.toFixed(2)} · integrated=${tamat.integrated})`
    : isAmaTamatOassEnabled()
      ? 'OAT — OASS not triggered; single primary lane only.'
      : 'OASS DISABLED — single primary lane only.';

  const synthesisRule = oass.active
    ? tamat.integrated
      ? 'Weave Kr (principle) and Kn (episodic) into one Qawlan Sadida reply — Tamat anchor guides weight, not verbatim paste.'
      : 'Coherence below threshold — deliver ONE sentence from Kr (Prinsip) and ONE from Kn (Konteks); optional third sentence bridges them.'
    : 'Speak from the primary lane memory already loaded. Do NOT merge Kr and Kn.';

  return `
═══ KOTAK 20–22 (TAMAT) — AMA ${AMA_LEVEL_ERA_1} Layer 5 Synthesis Anchor ═══

Primary lane: ${route.lane} · Kotak ${route.kotak} · Segment ${route.segment}
Flow: ${oass.mode} · ${flowLine}
OASS triggers: ${oass.reasons.join(', ') || 'none'}

CONSTITUTIONAL RULE THIS TURN:
${synthesisRule}

Tamat anchor (≤3 sentences structural weight):
${tamat.body || '(lane empty — answer from loaded memory honestly)'}

═══ END TAMAT ANCHOR ═══`.trim();
}

/**
 * Resolve Tamat for this chat turn — async master load + lane route.
 */
export async function resolveTamatLayer5Block(
  message: string,
  loadMaster: () => Promise<{ structuralLane?: string; episodicLane?: string; unifiedUnderstanding?: string }>,
  options: { founderId?: string } = {},
): Promise<string | null> {
  if (!isAmaBrainV2Enabled()) return null;

  const started = Date.now();
  const route = routeAmaFlow(message);
  const oass = resolveOassActivation(message);
  const master = await loadMaster();

  const kr =
    master.structuralLane?.trim()
    || master.unifiedUnderstanding?.trim()
    || '';
  const kn = master.episodicLane?.trim() || '';

  const routeForPrompt: AmaFlowRouteResult = {
    ...route,
    mode:      oass.mode,
    needsOass: oass.active,
  };

  const tamat = oass.active
    ? generateTamat({ kr, kn, mode: 'OASS', oassActive: true })
    : generateTamatSingleLane({ kr, kn, lane: route.lane });

  const founderId = options.founderId ?? 'masa-bayu';
  const sourceId = `tamat-${Date.now()}`;

  persistTamatDnSegment(founderId, {
    sourceId,
    wmLoad:          kr.length + kn.length,
    decisionPoint:   oass.mode,
    responseLatency: Date.now() - started,
    layer5Body:      tamat.body,
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[AMA Tamat] Dn segment write skipped:', msg);
  });

  if (oass.active && process.env.NODE_ENV !== 'production') {
    console.log('[AMA Tamat] OASS', {
      coherence:  tamat.coherence,
      integrated: tamat.integrated,
      reasons:    oass.reasons,
    });
  }

  return buildTamatLayer5PromptBlock(routeForPrompt, tamat, oass);
}

/**
 * Generate Tamat output — staged Kr + Kn integration when OASS active.
 */
export function generateTamat(input: TamatInput): TamatOutput {
  const { kr, kn, oassActive } = input;
  const krT = kr.trim();
  const knT = kn.trim();

  if (!oassActive) {
    const single = krT || knT;
    const body = truncateToMaxSentences(single, MAX_SENTENCES);
    return {
      body,
      coherence:      1,
      integrated:     false,
      sentenceCount:  countSentences(body),
      principleBlock: krT || null,
      contextBlock:   knT || null,
    };
  }

  const coherenceResult = resolveCrossLaneCoherence(krT, knT);
  const coherence = coherenceResult.score;

  if (coherence >= AMA_TAMAT_COHERENCE_THRESHOLD) {
    const body = weightedMerge(krT, knT, 0.6);
    return {
      body,
      coherence,
      integrated:     true,
      sentenceCount:  countSentences(body),
      principleBlock: truncateToMaxSentences(krT, 1),
      contextBlock:   truncateToMaxSentences(knT, 1),
    };
  }

  const principleBlock = truncateToMaxSentences(krT, 1);
  const contextBlock = truncateToMaxSentences(knT, 1);
  const body = `Prinsip: ${principleBlock} Konteks: ${contextBlock}`;
  return {
    body: truncateToMaxSentences(body, MAX_SENTENCES),
    coherence,
    integrated: false,
    sentenceCount: countSentences(body),
    principleBlock,
    contextBlock,
  };
}

export function crossLaneIntegration(input: {
  kr: string;
  kn: string;
}): { coherence: number; merged: string; integrated: boolean } {
  const coherenceResult = resolveCrossLaneCoherence(input.kr, input.kn);
  const coherence = coherenceResult.score;
  const integrated = coherence >= AMA_TAMAT_COHERENCE_THRESHOLD;
  const merged = integrated
    ? weightedMerge(input.kr, input.kn)
    : `Prinsip: ${input.kr.trim()} Konteks: ${input.kn.trim()}`;
  return { coherence, merged: truncateToMaxSentences(merged, MAX_SENTENCES), integrated };
}
