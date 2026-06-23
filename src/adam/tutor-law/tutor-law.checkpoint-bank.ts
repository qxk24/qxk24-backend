/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Checkpoint Bank (ERA_2e)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { AdamTutorLearningProfile, ConceptMasteryRecord } from './tutor-law.learning-profile.types';
import {
  getPlacementItemById,
  PLACEMENT_ITEM_BANK,
  type PlacementItem,
  type PlacementSubject,
} from './tutor-law.placement-bank';

export const CHECKPOINT_INTERVAL_DAYS = 14;
export const CHECKPOINT_TARGET_QUESTIONS = 6;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function conceptPercentForRanking(rec: ConceptMasteryRecord | undefined): number {
  if (!rec || rec.attempts <= 0) return 0.35;
  return rec.correctCount / rec.attempts;
}

const CHECKPOINT_REQUEST_MARKERS = [
  'checkpoint', 'progress report', 'semak kemajuan', 'how am i doing',
  'my progress', '2 minggu', 'two weeks', 'kemajuan saya',
] as const;

export function userRequestedCheckpoint(
  message: string,
  recentMessages: string[] = [],
): boolean {
  const blob = [message, ...recentMessages].join('\n').toLowerCase();
  return CHECKPOINT_REQUEST_MARKERS.some((m) => blob.includes(m));
}

export function checkpointAnchorAt(
  profile: AdamTutorLearningProfile,
): string | null {
  return profile.lastCheckpointAt ?? profile.placementCompletedAt ?? null;
}

export function isCheckpointDue(
  profile: AdamTutorLearningProfile,
  now = new Date(),
): boolean {
  if (!profile.placementComplete) return false;
  if (profile.checkpoint?.active) return false;

  const anchor = checkpointAnchorAt(profile);
  if (!anchor) return false;

  const elapsed = now.getTime() - new Date(anchor).getTime();
  return elapsed >= CHECKPOINT_INTERVAL_DAYS * MS_PER_DAY;
}

export function daysUntilNextCheckpoint(
  profile: AdamTutorLearningProfile,
  now = new Date(),
): number | null {
  if (!profile.placementComplete) return null;
  const anchor = checkpointAnchorAt(profile);
  if (!anchor) return null;

  const dueAt = new Date(anchor).getTime() + CHECKPOINT_INTERVAL_DAYS * MS_PER_DAY;
  const remaining = Math.ceil((dueAt - now.getTime()) / MS_PER_DAY);
  return Math.max(0, remaining);
}

function rankByZpdWeakness(
  items: PlacementItem[],
  profile: AdamTutorLearningProfile,
): PlacementItem[] {
  return [...items].sort((a, b) => {
    const recA = profile.conceptMastery[a.conceptTag];
    const recB = profile.conceptMastery[b.conceptTag];
    const pa = recA ? conceptPercentForRanking(recA) : 0.35;
    const pb = recB ? conceptPercentForRanking(recB) : 0.35;

    const zpdScore = (p: number) => {
      if (p >= 0.4 && p < 0.8) return 0;
      if (p < 0.4) return 1 + (0.4 - p);
      return 2 + (p - 0.8);
    };

    return zpdScore(pa) - zpdScore(pb);
  });
}

function pickFromSubject(
  subject: PlacementSubject,
  count: number,
  profile: AdamTutorLearningProfile,
  excludeIds: Set<string>,
): PlacementItem[] {
  const pool = PLACEMENT_ITEM_BANK.filter(
    (item) => item.subject === subject && !excludeIds.has(item.id),
  );
  const ranked = rankByZpdWeakness(pool, profile);
  return ranked.slice(0, count);
}

/** Adaptive-lite: 2 EN + 2 Math + 2 BM from placement bank, ZPD-weighted. */
export function selectCheckpointItemIds(
  profile: AdamTutorLearningProfile,
): string[] {
  const recentIds = new Set(
    (profile.checkpointHistory ?? []).flatMap((h) => h.itemIds),
  );

  const english = pickFromSubject('english', 2, profile, recentIds);
  for (const item of english) recentIds.add(item.id);

  const math = pickFromSubject('math', 2, profile, recentIds);
  for (const item of math) recentIds.add(item.id);

  const bm = pickFromSubject('bm', 2, profile, recentIds);
  for (const item of bm) recentIds.add(item.id);

  const picked = [...english, ...math, ...bm].map((item) => item.id);

  if (picked.length >= CHECKPOINT_TARGET_QUESTIONS) {
    return picked.slice(0, CHECKPOINT_TARGET_QUESTIONS);
  }

  const fallback = PLACEMENT_ITEM_BANK
    .filter((item) => !recentIds.has(item.id) && !picked.includes(item.id))
    .slice(0, CHECKPOINT_TARGET_QUESTIONS - picked.length)
    .map((item) => item.id);

  return [...picked, ...fallback].slice(0, CHECKPOINT_TARGET_QUESTIONS);
}

export function getCheckpointItemByIndex(
  itemIds: readonly string[],
  index: number,
): PlacementItem | null {
  const id = itemIds[index];
  if (!id) return null;
  return getPlacementItemById(id);
}
