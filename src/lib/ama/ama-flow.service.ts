/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Flow Service (IKJ / LWJ Lane Routing)
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
 * Kotak 2 (IKJ/Kr) — structural lane
 * Kotak 3 (LWJ/Kn) — episodic lane
 * OASS fallback when classification confidence < 85%
 */

import {
  AMA_OASS_CONFIDENCE_THRESHOLD,
  type AmaFlowRouteResult,
  type AmaLane,
  type AmaSegment,
} from './ama.types';
import { evaluateOassTrigger, isFounderRecallMessage } from './ama-oass-gate';

const IKJ_KEYWORDS: Array<{ re: RegExp; weight: number; label: string }> = [
  { re: /\bformula\b/i,           weight: 1.0, label: 'formula' },
  { re: /\balgoritma\b/i,         weight: 1.0, label: 'algoritma' },
  { re: /\busul\b/i,              weight: 0.9, label: 'usul' },
  { re: /\bfaktor\s+masa\b/i,     weight: 1.0, label: 'faktor_masa' },
  { re: /x\s*=\s*m\s*\/\s*t/i,    weight: 1.0, label: 'x_eq_m_over_t' },
  { re: /\bprinsip\b/i,           weight: 0.7, label: 'prinsip' },
  { re: /\bstruktur\b/i,          weight: 0.6, label: 'struktur' },
  { re: /\bdefinisi\b/i,          weight: 0.8, label: 'definisi' },
  { re: /\bbalaghah\b/i,          weight: 0.8, label: 'balaghah' },
  { re: /\basbab\s+al-nuzul\b/i,  weight: 0.8, label: 'asbab_al_nuzul' },
];

const LWJ_KEYWORDS: Array<{ re: RegExp; weight: number; label: string }> = [
  { re: /\bmasa\s+itu\b/i,              weight: 1.0, label: 'masa_itu' },
  { re: /\bwaktu\s+kita\b/i,            weight: 1.0, label: 'waktu_kita' },
  { re: /\bingat\s+tak\b/i,             weight: 1.0, label: 'ingat_tak' },
  { re: /\brasa\s+macam\b/i,            weight: 0.9, label: 'rasa_macam' },
  { re: /\bsejak\s+solat\s+subuh\b/i,   weight: 1.0, label: 'sejak_solat_subuh' },
  { re: /\bketika\s+itu\b/i,            weight: 0.8, label: 'ketika_itu' },
  { re: /\bdi\s+johor\b/i,              weight: 0.7, label: 'location' },
  { re: /\bhujan\b/i,                   weight: 0.6, label: 'weather_context' },
  { re: /\bp\.alt\s+ajar\b/i,           weight: 0.8, label: 'p_alt_teaching_moment' },
  { re: /\bquran\s+weave\b/i,           weight: 0.7, label: 'quran_weave' },
  { re: /\bzikir\b/i,                   weight: 0.7, label: 'zikir' },
];

function scoreKeywords(
  text: string,
  keywords: Array<{ re: RegExp; weight: number; label: string }>,
): { score: number; hits: string[] } {
  let score = 0;
  const hits: string[] = [];
  for (const kw of keywords) {
    if (kw.re.test(text)) {
      score += kw.weight;
      hits.push(kw.label);
    }
  }
  return { score, hits };
}

export interface LaneScoreSnapshot {
  ikjScore: number;
  lwjScore: number;
  ikjHits:  string[];
  lwjHits:  string[];
}

export function scoreLaneIntent(message: string): LaneScoreSnapshot {
  const text = message.trim();
  const ikj = scoreKeywords(text, IKJ_KEYWORDS);
  const lwj = scoreKeywords(text, LWJ_KEYWORDS);
  return {
    ikjScore: ikj.score,
    lwjScore: lwj.score,
    ikjHits:  ikj.hits,
    lwjHits:  lwj.hits,
  };
}

function laneToSegment(lane: AmaLane): AmaSegment {
  return lane === 'IKJ' ? 'Kr' : 'Kn';
}

function computeConfidence(ikjScore: number, lwjScore: number, lane: AmaLane): number {
  const total = ikjScore + lwjScore;
  if (total <= 0) return 0.5;
  const dominant = lane === 'IKJ' ? ikjScore : lwjScore;
  const raw = dominant / total;
  return Math.min(1, Math.max(0.5, raw));
}

/**
 * Route incoming message to Kotak 2 (IKJ) or Kotak 3 (LWJ).
 * Mixed intent → lower confidence → OASS fallback after initial lane write.
 */
export function routeAmaFlow(message: string, options?: { devLog?: boolean }): AmaFlowRouteResult {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const text = message.trim();
  const scores = scoreLaneIntent(text);

  let lane: AmaLane;
  const reasons: string[] = [];

  if (isFounderRecallMessage(text)) {
    lane = 'LWJ';
    reasons.push('founder_recall_default_kn');
  } else if (scores.ikjScore > scores.lwjScore) {
    lane = 'IKJ';
    reasons.push(...scores.ikjHits.map((h) => `ikj:${h}`));
  } else if (scores.lwjScore > scores.ikjScore) {
    lane = 'LWJ';
    reasons.push(...scores.lwjHits.map((h) => `lwj:${h}`));
  } else if (scores.ikjScore > 0) {
    lane = 'IKJ';
    reasons.push('ikj_tie_break');
  } else {
    lane = 'LWJ';
    reasons.push('default_episodic_lane');
  }

  const confidence = computeConfidence(scores.ikjScore, scores.lwjScore, lane);
  const bothActive = scores.ikjScore > 0 && scores.lwjScore > 0;
  const oassEval = evaluateOassTrigger(text);
  const needsOass =
    bothActive && confidence < AMA_OASS_CONFIDENCE_THRESHOLD
    || oassEval.active;

  const mode = needsOass ? 'OASS' : 'OAT';
  if (needsOass) reasons.push('oass_fallback');

  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const latencyMs = end - start;

  const result: AmaFlowRouteResult = {
    lane,
    segment: laneToSegment(lane),
    kotak:   lane === 'IKJ' ? 2 : 3,
    confidence,
    mode,
    reasons,
    needsOass,
    latencyMs,
  };

  if (options?.devLog && process.env.NODE_ENV !== 'production') {
    console.time('[AMA Flow] route');
    console.log('[AMA Flow] classification', JSON.stringify(result));
    console.timeEnd('[AMA Flow] route');
  }

  return result;
}

/** Map dual-lane write to segment store targets */
export function dualLaneWriteTargets(write: {
  structuralC: string;
  episodicB: string;
}): { kr: string; kn: string } {
  return {
    kr: write.structuralC,
    kn: write.episodicB,
  };
}
