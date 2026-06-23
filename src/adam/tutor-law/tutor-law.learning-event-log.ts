/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Event Log (ERA_2h)
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
 */

import { TutorLearningEventModel } from '../tutor/adam-tutor-learning-event.schema';
import type {
  AdamTutorLearningProfile,
  LearningInteractionEvent,
} from './tutor-law.learning-profile.types';
import { appendInteractionEvent } from './tutor-law.learning-profile.types';

export function pushLearningEvent(
  profile: AdamTutorLearningProfile,
  event: LearningInteractionEvent,
): LearningInteractionEvent {
  appendInteractionEvent(profile, event);
  return event;
}

export function buildLearningEvent(
  partial: Omit<LearningInteractionEvent, 'at'>,
  now = new Date(),
): LearningInteractionEvent {
  return { ...partial, at: now.toISOString() };
}

export async function exportLearningEventToMongo(
  userId: string,
  event: LearningInteractionEvent,
): Promise<void> {
  if (!userId?.trim()) return;
  await TutorLearningEventModel.create({
    userId,
    at:         event.at,
    kind:       event.kind,
    contentId:  event.contentId,
    conceptTag: event.conceptTag,
    subject:    event.subject,
    correct:    event.correct,
    responseMs: event.responseMs,
    thetaAfter: event.thetaAfter,
  });
}

export function countInteractionLog(profile: AdamTutorLearningProfile): number {
  return profile.interactionLog?.length ?? 0;
}

export async function saveProfileAndExportNewEvents(
  userId: string,
  profile: AdamTutorLearningProfile,
  priorLogLen: number,
  save: (userId: string, profile: AdamTutorLearningProfile) => Promise<AdamTutorLearningProfile>,
): Promise<AdamTutorLearningProfile> {
  const saved = await save(userId, profile);
  const events = saved.interactionLog ?? [];
  if (events.length <= priorLogLen) return saved;

  const fresh = events.slice(0, events.length - priorLogLen);
  for (const event of fresh) {
    void exportLearningEventToMongo(userId, event).catch((err) => {
      console.error('[ADAM Tutor] learning event export:', err);
    });
  }
  return saved;
}
