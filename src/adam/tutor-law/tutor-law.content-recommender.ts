/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Content Recommender (ERA_2g)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { AdamTutorLearningProfile } from './tutor-law.learning-profile.types';
import { conceptPercentCorrect } from './tutor-law.learning-profile-bkt';
import { raschProbability } from './tutor-law.irt-engine';
import {
  getActiveContentBank,
  type TutorContentItem,
} from './tutor-law.content-bank';
import type { PlacementSubject } from './tutor-law.placement-bank';
import { KNOWLEDGE_CONCEPT_GRAPH } from './tutor-law.adaptive-assessment';

const RECENT_EXCLUDE = 10;

export interface RecommendContentInput {
  profile:        AdamTutorLearningProfile;
  excludeIds?:    Set<string>;
  preferSubject?: PlacementSubject;
  pool?:          readonly TutorContentItem[];
  userId?:        string;
}

export interface RecommendContentResult {
  item:    TutorContentItem;
  score:   number;
  reasons: string[];
}

function zpdFit(p: number): number {
  if (p >= 0.4 && p < 0.8) return 1 - Math.abs(p - 0.6) / 0.4;
  return Math.max(0, 0.5 - Math.abs(p - 0.6));
}

function irtMatch(theta: number, difficulty: number): number {
  const prob = raschProbability(theta, difficulty);
  return prob * (1 - prob);
}

function subjectTheta(
  profile: AdamTutorLearningProfile,
  subject: PlacementSubject,
): number {
  return profile.placement?.perSubjectTheta?.[subject]
    ?? profile.placementAbility
    ?? 0;
}

function conceptMasteryP(profile: AdamTutorLearningProfile, tag: string): number {
  const rec = profile.conceptMastery[tag];
  if (!rec || rec.attempts <= 0) return 0.35;
  return conceptPercentCorrect(rec);
}

function focusBoost(profile: AdamTutorLearningProfile, tag: string): number {
  const label = KNOWLEDGE_CONCEPT_GRAPH[tag]?.label ?? tag;
  return profile.focusAreas.includes(label) ? 1 : 0;
}

function subjectBalanceBoost(
  profile: AdamTutorLearningProfile,
  subject: PlacementSubject,
): number {
  const weekly = profile.content?.weeklyBySubject ?? {};
  const counts = {
    english: weekly.english ?? 0,
    math:    weekly.math ?? 0,
    bm:      weekly.bm ?? 0,
  };
  const max = Math.max(counts.english, counts.math, counts.bm, 1);
  const min = Math.min(counts.english, counts.math, counts.bm);
  if (max === 0) return 0.5;
  const balance = min / max;
  const subjectCount = counts[subject];
  return balance + (subjectCount === min ? 0.5 : 0);
}

function stableHashTieBreak(userId: string | undefined, itemId: string): number {
  const seed = `${userId ?? 'anon'}:${itemId}`;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % 1000;
  }
  return h / 1000;
}

function scoreItem(
  item: TutorContentItem,
  profile: AdamTutorLearningProfile,
  exclude: Set<string>,
  preferSubject?: PlacementSubject,
  userId?: string,
): RecommendContentResult {
  const p = conceptMasteryP(profile, item.conceptTag);
  const theta = subjectTheta(profile, item.subject);
  const recent = new Set(profile.content?.recentContentIds ?? []);
  const mergedExclude = new Set([...exclude, ...recent]);

  const reasons: string[] = [];
  let score = 0;

  const zpd = zpdFit(p);
  score += 3.0 * zpd;
  if (zpd >= 0.7) reasons.push('zpd_fit');

  score += 2.0 * irtMatch(theta, item.difficulty);
  reasons.push('irt_match');

  if (focusBoost(profile, item.conceptTag) > 0) {
    score += 1.0;
    reasons.push('focus_area');
  }

  if (mergedExclude.has(item.id)) {
    score -= 2.0;
    reasons.push('recent_repeat');
  }

  const attempts = profile.conceptMastery[item.conceptTag]?.attempts ?? 0;
  if (attempts > 8 && p < 0.75) {
    score -= 1.5;
    reasons.push('overexposed');
  }

  score += 0.5 * subjectBalanceBoost(profile, item.subject);
  if (preferSubject === item.subject) {
    score += 0.3;
    reasons.push('prefer_subject');
  }

  score += stableHashTieBreak(userId, item.id) * 0.01;

  return { item, score, reasons };
}

export function recommendNextContent(
  input: RecommendContentInput,
): RecommendContentResult | null {
  const pool = input.pool ?? getActiveContentBank();
  if (pool.length === 0) return null;

  const exclude = input.excludeIds ?? new Set<string>();
  const ranked = pool
    .filter((item) => item.active)
    .map((item) => scoreItem(
      item,
      input.profile,
      exclude,
      input.preferSubject,
      input.userId,
    ))
    .sort((a, b) => b.score - a.score);

  return ranked[0] ?? null;
}

export function buildContentDeliveryPrompt(contentId: string, prompt: string): string {
  return (
    `CONTENT ITEM (turn ini — satu sahaja, ID=${contentId}):\n`
    + `${prompt}\n`
    + 'Jangan cipta soalan lain. Guna inductive scaffolding jika pelajar tersekat.'
  );
}
