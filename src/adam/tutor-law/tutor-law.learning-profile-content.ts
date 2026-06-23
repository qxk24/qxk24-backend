/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile Content (ERA_2g)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type {
  AdamTutorLearningProfile,
  ContentSessionState,
  LearningInteractionKind,
} from './tutor-law.learning-profile.types';
import { appendInteractionEvent, defaultContentSession } from './tutor-law.learning-profile.types';
import {
  conceptPercentCorrect,
  recordConceptAttempt,
  recomputeProfileAggregates,
} from './tutor-law.learning-profile-bkt';
import type { TutorContentItem } from './tutor-law.content-bank';
import type { PlacementSubject } from './tutor-law.placement-bank';

const MAX_RECENT_CONTENT = 10;

function ensureContentState(profile: AdamTutorLearningProfile): ContentSessionState {
  return {
    ...defaultContentSession(),
    ...profile.content,
    recentContentIds: profile.content?.recentContentIds ?? [],
    weeklyBySubject:  profile.content?.weeklyBySubject ?? {},
  };
}

function startOfIsoWeek(d: Date): string {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

function ensureWeeklyBucket(
  content: ContentSessionState,
  now: Date,
): ContentSessionState {
  const weekKey = startOfIsoWeek(now);
  if (content.weeklyWeekStart !== weekKey) {
    return {
      ...content,
      weeklyWeekStart: weekKey,
      weeklyBySubject: {},
    };
  }
  return content;
}

function bumpWeeklySubject(
  content: ContentSessionState,
  subject: PlacementSubject,
  now: Date,
): ContentSessionState {
  const bucket = ensureWeeklyBucket(content, now);
  const weekly = bucket.weeklyBySubject ?? {};
  return {
    ...bucket,
    weeklyBySubject: {
      ...weekly,
      [subject]: (weekly[subject] ?? 0) + 1,
    },
  };
}

function interactionKindFor(item: TutorContentItem): LearningInteractionKind {
  if (item.kind === 'reading') return 'reading';
  if (item.kind === 'probe') return 'probe';
  if (item.kind === 'speaking_prompt') return 'voice';
  return 'drill';
}

export function scoreContentAnswer(item: TutorContentItem, answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;

  if (item.kind === 'drill' && item.acceptPatterns?.length) {
    return item.acceptPatterns.some((re) => re.test(trimmed));
  }

  const lower = trimmed.toLowerCase();
  if (/\b(faham|understand|got it|yes|betul|correct|boleh)\b/i.test(lower)) return true;
  if (/\b(belum|don't understand|tak faham|no|salah|confused)\b/i.test(lower)) return false;

  if (item.acceptPatterns?.length) {
    return item.acceptPatterns.some((re) => re.test(trimmed));
  }

  return trimmed.split(/\s+/).filter(Boolean).length >= 4;
}

export function assignRecommendedContent(
  profile: AdamTutorLearningProfile,
  item: TutorContentItem,
  now = new Date(),
): AdamTutorLearningProfile {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  const content = ensureContentState(next);

  content.currentContentId = item.id;
  content.awaitingAnswer = false;
  content.lastContentId = item.id;
  content.lastContentAt = now.toISOString();

  if (!content.recentContentIds.includes(item.id)) {
    content.recentContentIds = [item.id, ...content.recentContentIds].slice(0, MAX_RECENT_CONTENT);
  }

  next.content = content;
  next.updatedAt = now.toISOString();
  return next;
}

export function applyContentAnswer(
  profile: AdamTutorLearningProfile,
  item: TutorContentItem,
  answer: string,
  responseMs?: number,
  now = new Date(),
): AdamTutorLearningProfile {
  const next: AdamTutorLearningProfile = JSON.parse(JSON.stringify(profile));
  const content = ensureContentState(next);
  const correct = scoreContentAnswer(item, answer);

  recordConceptAttempt(next, item.conceptTag, correct, now);

  appendInteractionEvent(next, {
    at:          now.toISOString(),
    kind:        interactionKindFor(item),
    contentId:   item.id,
    conceptTag:  item.conceptTag,
    subject:     item.subject,
    correct,
    responseMs,
  });

  content.awaitingAnswer = false;
  content.currentContentId = null;
  content.lastContentId = item.id;
  content.lastContentAt = now.toISOString();
  const withWeekly = bumpWeeklySubject(content, item.subject, now);
  content.weeklyBySubject = withWeekly.weeklyBySubject;
  content.weeklyWeekStart = withWeekly.weeklyWeekStart;

  if (!content.recentContentIds.includes(item.id)) {
    content.recentContentIds = [item.id, ...content.recentContentIds].slice(0, MAX_RECENT_CONTENT);
  }

  if (correct) {
    next.gamification.xp += item.kind === 'drill' ? 8 : 5;
  }

  next.content = content;
  recomputeProfileAggregates(next);
  next.updatedAt = now.toISOString();
  return next;
}

export function lastPracticedConceptLabel(profile: AdamTutorLearningProfile): string | null {
  const id = profile.content?.lastContentId;
  if (!id) return null;
  const tag = profile.interactionLog?.find((e) => e.contentId === id)?.conceptTag;
  if (!tag) return null;
  const rec = profile.conceptMastery[tag];
  if (!rec) return tag;
  const pct = Math.round(conceptPercentCorrect(rec) * 100);
  return `${tag} (${pct}%)`;
}
