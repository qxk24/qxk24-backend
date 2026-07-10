/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor UI Guide Tools (F3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { AdamTutorLearningProfile } from './tutor-law/tutor-law.learning-profile.types';

export function resolveScaffoldReleaseLayer(input: { userMessage: string }): number {
  const lower = input.userMessage.toLowerCase();
  if (/\b(tak faham|tak paham|confused|lost)\b/i.test(lower)) return 2;
  return 1;
}

export function observeTagSyllabus(userMessage: string): {
  topicLabel:  string;
  conceptTags: string[];
} {
  const lower = userMessage.toLowerCase();
  const conceptTags: string[] = [];
  if (lower.includes('fotosintesis') || lower.includes('photosynthesis')) {
    conceptTags.push('fotosintesis');
  }
  return {
    topicLabel:  conceptTags[0] ?? '',
    conceptTags,
  };
}

export function observeGuideMode(
  profile: AdamTutorLearningProfile,
  _userMessage: string,
): { mode: string } {
  if (profile.checkpoint?.active && profile.checkpoint?.awaitingAnswer) {
    return { mode: 'checkpoint-answer' };
  }
  if (profile.placement?.awaitingAnswer) {
    return { mode: 'placement-answer' };
  }
  return { mode: 'guide' };
}
