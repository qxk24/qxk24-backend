/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Profile Service (ERA_2)
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

import { ADAMStudentAccountModel } from './adam-student.schema';
import {
  analyzeStealthAssessment,
  detectAdaptiveAssessmentPhase,
  detectLearnerEmotionalSignal,
  inferConceptTagsFromMessage,
  AdaptiveAssessmentPhase,
} from './tutor-law/tutor-law.adaptive-assessment';
import {
  applyPlacementAnswer,
  applyStealthTurnUpdate,
  applyVoiceTurnUpdate,
  startPlacementSession,
} from './tutor-law/tutor-law.learning-profile-bkt';
import {
  assessVoiceTurn,
} from './tutor-law/tutor-law.voice-assessment';
import {
  defaultTutorLearningProfile,
  type AdamTutorLearningProfile,
} from './tutor-law/tutor-law.learning-profile.types';
import {
  getPlacementItemById,
  type PlacementItem,
} from './tutor-law/tutor-law.placement-bank';

export interface TutorLearningTurnPrep {
  profile:          AdamTutorLearningProfile;
  placementPrompt:  string | null;
  placementItem:    PlacementItem | null;
}

function normalizeLearningProfile(raw: unknown): AdamTutorLearningProfile {
  if (!raw || typeof raw !== 'object') {
    return defaultTutorLearningProfile();
  }
  const base = defaultTutorLearningProfile();
  const src = raw as Partial<AdamTutorLearningProfile>;
  return {
    ...base,
    ...src,
    version:           1,
    conceptMastery:    { ...base.conceptMastery, ...(src.conceptMastery ?? {}) },
    strengths:         src.strengths ?? base.strengths,
    focusAreas:        src.focusAreas ?? base.focusAreas,
    stealth:           { ...base.stealth, ...(src.stealth ?? {}) },
    gamification:      { ...base.gamification, ...(src.gamification ?? {}) },
    voice:             src.voice
      ? { ...base.voice, ...src.voice, recent: src.voice.recent ?? base.voice.recent }
      : base.voice,
    placement:         src.placement
      ? { ...base.placement!, ...src.placement }
      : base.placement,
    updatedAt:         typeof src.updatedAt === 'string' ? src.updatedAt : base.updatedAt,
  };
}

export async function getTutorLearningProfile(
  userId: string,
): Promise<AdamTutorLearningProfile> {
  const doc = await ADAMStudentAccountModel.findOne({ userId, active: true })
    .select({ tutorLearningProfile: 1 })
    .lean();

  if (doc?.tutorLearningProfile) {
    return normalizeLearningProfile(doc.tutorLearningProfile);
  }
  return defaultTutorLearningProfile();
}

export async function saveTutorLearningProfile(
  userId: string,
  profile: AdamTutorLearningProfile,
): Promise<AdamTutorLearningProfile> {
  const normalized = normalizeLearningProfile(profile);
  normalized.updatedAt = new Date().toISOString();

  await ADAMStudentAccountModel.updateOne(
    { userId, active: true },
    { $set: { tutorLearningProfile: normalized, tutorLearningProfileUpdatedAt: new Date() } },
  );

  return normalized;
}

function shouldRunPlacement(profile: AdamTutorLearningProfile, phase: AdaptiveAssessmentPhase): boolean {
  if (profile.placementComplete) return false;
  return (
    phase === AdaptiveAssessmentPhase.PLACEMENT
    || phase === AdaptiveAssessmentPhase.ONBOARDING
    || !profile.placement?.questionsAnswered
  );
}

export async function prepareTutorLearningTurn(
  userId: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): Promise<TutorLearningTurnPrep> {
  let profile = await getTutorLearningProfile(userId);
  const phase = detectAdaptiveAssessmentPhase(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );

  let placementItem: PlacementItem | null = null;
  let placementPrompt: string | null = null;

  if (
    profile.placement?.awaitingAnswer
    && profile.placement.currentItemId
    && !profile.placementComplete
    && userMessage.trim().length > 0
  ) {
    const active = getPlacementItemById(profile.placement.currentItemId);
    if (active) {
      profile = await saveTutorLearningProfile(
        userId,
        applyPlacementAnswer(profile, active, userMessage),
      );
    }
  }

  const needsPlacement = shouldRunPlacement(profile, phase);
  if (needsPlacement && !profile.placementComplete && !profile.placement?.awaitingAnswer) {
    let item = profile.placement?.currentItemId
      ? getPlacementItemById(profile.placement.currentItemId)
      : null;
    if (!item) {
      const started = startPlacementSession(profile);
      profile = started.profile;
      item = started.item;
    }
    if (item && profile.placement) {
      placementItem = item;
      placementPrompt = item.prompt;
      profile.placement.awaitingAnswer = true;
      profile = await saveTutorLearningProfile(userId, profile);
    }
  }

  return { profile, placementPrompt, placementItem };
}

export async function recordTutorLearningTurn(input: {
  userId:                   string;
  userMessage:              string;
  viaVoice?:                boolean;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
}): Promise<AdamTutorLearningProfile | null> {
  if (!input.userId?.trim() || !input.userMessage?.trim()) return null;

  const profile = await getTutorLearningProfile(input.userId);
  const stealth = analyzeStealthAssessment({
    userMessage:             input.userMessage,
    recentUserMessages:      input.recentUserMessages,
    recentAssistantMessages: input.recentAssistantMessages,
  });
  const emotion = detectLearnerEmotionalSignal(
    input.userMessage,
    input.recentUserMessages ?? [],
  );
  const concepts = inferConceptTagsFromMessage(input.userMessage);

  let updated = applyStealthTurnUpdate(profile, stealth, emotion, concepts);

  if (input.viaVoice) {
    const assessment = assessVoiceTurn({
      transcript:              input.userMessage,
      viaVoice:                true,
      recentAssistantMessages: input.recentAssistantMessages,
    });
    if (assessment) {
      updated = applyVoiceTurnUpdate(updated, assessment);
    }
  }

  return saveTutorLearningProfile(input.userId, updated);
}
