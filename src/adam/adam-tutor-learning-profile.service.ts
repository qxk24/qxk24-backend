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
  detectLearnerEmotionalSignal,
  inferConceptTagsFromMessage,
} from './tutor-law/tutor-law.adaptive-assessment';
import {
  isCheckpointDue,
  userRequestedCheckpoint,
} from './tutor-law/tutor-law.checkpoint-bank';
import {
  applyCheckpointAnswer,
  startCheckpointSession,
} from './tutor-law/tutor-law.learning-profile-checkpoint';
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
  profile:           AdamTutorLearningProfile;
  placementPrompt:   string | null;
  checkpointPrompt:  string | null;
  placementItem:     PlacementItem | null;
}

function normalizeLearningProfile(raw: unknown): AdamTutorLearningProfile {
  if (!raw || typeof raw !== 'object') {
    return defaultTutorLearningProfile();
  }
  const base = defaultTutorLearningProfile();
  const src = raw as Partial<AdamTutorLearningProfile>;

  const conceptMastery: AdamTutorLearningProfile['conceptMastery'] = {
    ...base.conceptMastery,
  };
  for (const [tag, rec] of Object.entries(src.conceptMastery ?? {})) {
    if (!rec || typeof rec !== 'object') continue;
    const attempts = rec.attempts ?? 0;
    const correctCount = rec.correctCount
      ?? Math.round((rec.pMastery ?? 0) * attempts);
    conceptMastery[tag] = {
      pMastery:     rec.pMastery ?? 0,
      attempts,
      correctCount,
      lastUpdated:  rec.lastUpdated ?? base.updatedAt,
    };
  }

  const placementComplete = src.placementComplete ?? base.placementComplete;
  const placementCompletedAt = src.placementCompletedAt
    ?? (placementComplete ? (src.updatedAt ?? base.updatedAt) : undefined);

  return {
    ...base,
    ...src,
    version:              1,
    conceptMastery,
    placementComplete,
    placementCompletedAt,
    subjectLevels:        { ...base.subjectLevels, ...(src.subjectLevels ?? {}) },
    strengths:            src.strengths ?? base.strengths,
    focusAreas:           src.focusAreas ?? base.focusAreas,
    stealth:              { ...base.stealth, ...(src.stealth ?? {}) },
    gamification:         { ...base.gamification, ...(src.gamification ?? {}) },
    voice:                src.voice
      ? { ...base.voice, ...src.voice, recent: src.voice.recent ?? base.voice.recent }
      : base.voice,
    placement:            src.placement
      ? {
        ...base.placement!,
        ...src.placement,
        subjectScores: src.placement.subjectScores ?? base.placement?.subjectScores ?? {},
      }
      : base.placement,
    checkpoint:           src.checkpoint
      ? { ...src.checkpoint }
      : base.checkpoint,
    checkpointHistory:    src.checkpointHistory ?? base.checkpointHistory,
    lastCheckpointAt:     src.lastCheckpointAt,
    updatedAt:            typeof src.updatedAt === 'string' ? src.updatedAt : base.updatedAt,
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

function shouldRunPlacement(profile: AdamTutorLearningProfile): boolean {
  return !profile.placementComplete;
}

function shouldOfferCheckpoint(
  profile: AdamTutorLearningProfile,
  userMessage: string,
  recentUserMessages: string[],
): boolean {
  if (!profile.placementComplete) return false;
  if (profile.checkpoint?.active) return true;
  return isCheckpointDue(profile) || userRequestedCheckpoint(userMessage, recentUserMessages);
}

export async function prepareTutorLearningTurn(
  userId: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): Promise<TutorLearningTurnPrep> {
  let profile = await getTutorLearningProfile(userId);

  let placementItem: PlacementItem | null = null;
  let placementPrompt: string | null = null;
  let checkpointPrompt: string | null = null;

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

  const needsPlacement = shouldRunPlacement(profile);
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

  if (
    profile.placementComplete
    && profile.checkpoint?.active
    && profile.checkpoint.awaitingAnswer
    && profile.checkpoint.currentItemId
    && userMessage.trim().length > 0
  ) {
    const active = getPlacementItemById(profile.checkpoint.currentItemId);
    if (active) {
      profile = await saveTutorLearningProfile(
        userId,
        applyCheckpointAnswer(profile, active, userMessage),
      );
    }
  }

  const offerCheckpoint = shouldOfferCheckpoint(profile, userMessage, recentUserMessages);
  if (
    offerCheckpoint
    && !profile.checkpoint?.awaitingAnswer
    && !(profile.checkpoint?.active === false && (profile.checkpoint?.questionsAnswered ?? 0) > 0)
  ) {
    let item = profile.checkpoint?.active && profile.checkpoint.currentItemId
      ? getPlacementItemById(profile.checkpoint.currentItemId)
      : null;

    if (!item) {
      const started = startCheckpointSession(profile);
      profile = started.profile;
      item = started.item;
    }

    if (item && profile.checkpoint) {
      checkpointPrompt = item.prompt;
      profile.checkpoint.awaitingAnswer = true;
      profile = await saveTutorLearningProfile(userId, profile);
    }
  }

  return { profile, placementPrompt, checkpointPrompt, placementItem };
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
