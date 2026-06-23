/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor IRT Engine (ERA_2f)
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
 * 1PL Rasch IRT for adaptive placement (CAT).
 */

import type { PlacementSessionState } from './tutor-law.learning-profile.types';
import {
  PLACEMENT_TARGET_QUESTIONS,
  getPlacementItemById,
  type PlacementItem,
  type PlacementSubject,
} from './tutor-law.placement-bank';

export const IRT_ABILITY_STEP = 0.6;
export const IRT_ABILITY_MIN = -3;
export const IRT_ABILITY_MAX = 3;
export const PLACEMENT_MIN_QUESTIONS = 12;
export const PLACEMENT_SE_THRESHOLD = 0.35;
export const PLACEMENT_SUBJECT_MIN = 3;

const PLACEMENT_SUBJECTS: readonly PlacementSubject[] = ['english', 'math', 'bm'];

/** P(correct | θ, b) — 1PL Rasch. */
export function raschProbability(theta: number, difficulty: number): number {
  const z = theta - difficulty;
  if (z > 20) return 1;
  if (z < -20) return 0;
  return 1 / (1 + Math.exp(-z));
}

/** EAP-style ability step after one response. */
export function updateAbilityEap(
  theta: number,
  difficulty: number,
  correct: boolean,
): number {
  const p = raschProbability(theta, difficulty);
  const u = correct ? 1 : 0;
  const next = theta + IRT_ABILITY_STEP * (u - p);
  return Math.max(IRT_ABILITY_MIN, Math.min(IRT_ABILITY_MAX, next));
}

/** Item information I(θ, b) = P(1 − P). */
export function itemInformation(theta: number, difficulty: number): number {
  const p = raschProbability(theta, difficulty);
  return p * (1 - p);
}

export function abilityStandardError(
  theta: number,
  items: readonly PlacementItem[],
): number {
  if (items.length === 0) return 1;
  let infoSum = 0;
  for (const item of items) {
    infoSum += itemInformation(theta, item.difficulty);
  }
  if (infoSum <= 0) return 1;
  return 1 / Math.sqrt(infoSum);
}

export function subjectCountsFromPlacement(
  placement: PlacementSessionState,
): Partial<Record<PlacementSubject, number>> {
  const scores = placement.subjectScores ?? {};
  return {
    english: scores.english?.total ?? 0,
    math:    scores.math?.total ?? 0,
    bm:      scores.bm?.total ?? 0,
  };
}

export function getPlacementItemsByIds(ids: readonly string[]): PlacementItem[] {
  return ids
    .map((id) => getPlacementItemById(id))
    .filter((item): item is PlacementItem => item !== null);
}

export function shouldStopPlacement(
  questionsAnswered: number,
  abilitySe: number,
  subjectCounts: Partial<Record<PlacementSubject, number>>,
): boolean {
  if (questionsAnswered >= PLACEMENT_TARGET_QUESTIONS) return true;
  if (questionsAnswered < PLACEMENT_MIN_QUESTIONS) return false;

  const quotasMet = PLACEMENT_SUBJECTS.every(
    (s) => (subjectCounts[s] ?? 0) >= PLACEMENT_SUBJECT_MIN,
  );
  if (!quotasMet) return false;

  return abilitySe < PLACEMENT_SE_THRESHOLD;
}

export function selectNextIrtItem(input: {
  theta:          number;
  pool:           readonly PlacementItem[];
  excludeIds:     ReadonlySet<string> | readonly string[];
  subjectCounts?: Partial<Record<PlacementSubject, number>>;
  subjectMin?:    number;
}): PlacementItem | null {
  const exclude = input.excludeIds instanceof Set
    ? input.excludeIds
    : new Set(input.excludeIds);

  const available = input.pool.filter((item) => !exclude.has(item.id));
  if (available.length === 0) return null;

  const subjectMin = input.subjectMin ?? PLACEMENT_SUBJECT_MIN;
  const counts = input.subjectCounts ?? {};
  const underQuota = PLACEMENT_SUBJECTS.filter((s) => (counts[s] ?? 0) < subjectMin);

  let candidates = available;
  if (underQuota.length > 0) {
    const quotaPool = available.filter((item) => underQuota.includes(item.subject));
    if (quotaPool.length > 0) candidates = quotaPool;
  }

  let best = candidates[0]!;
  let bestInfo = itemInformation(input.theta, best.difficulty);

  for (const item of candidates.slice(1)) {
    const info = itemInformation(input.theta, item.difficulty);
    if (info > bestInfo) {
      best = item;
      bestInfo = info;
    }
  }

  return best;
}
