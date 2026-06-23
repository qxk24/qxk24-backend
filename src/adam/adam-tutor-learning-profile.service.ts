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
import { getContentItemById } from './tutor-law/tutor-law.content-bank';
import {
  recommendNextContent,
  buildContentDeliveryPrompt,
} from './tutor-law/tutor-law.content-recommender';
import {
  applyContentAnswer,
  assignRecommendedContent,
} from './tutor-law/tutor-law.learning-profile-content';
import { computeLearningProgress } from './tutor-law/tutor-law.learning-progress';
import type { TutorLearningProgressMetrics } from './tutor-law/tutor-law.learning-progress';
import { defaultContentSession } from './tutor-law/tutor-law.learning-profile.types';
import {
  countInteractionLog,
  saveProfileAndExportNewEvents,
} from './tutor-law/tutor-law.learning-event-log';

export type { TutorLearningProgressMetrics } from './tutor-law/tutor-law.learning-progress';

export interface TutorLearningTurnPrep {
  profile:           AdamTutorLearningProfile;
  placementPrompt:   string | null;
  checkpointPrompt:  string | null;
  contentPrompt:     string | null;
  contentId:         string | null;
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

  const rawVersion = src.version ?? 1;
  let placementMode: 'static' | 'irt' = 'irt';
  if (src.placement?.mode) {
    placementMode = src.placement.mode;
  } else if (rawVersion === 1 && placementComplete) {
    placementMode = 'static';
  }

  const placement = src.placement
    ? {
      ...base.placement!,
      ...src.placement,
      mode:              src.placement.mode ?? placementMode,
      abilitySe:         src.placement.abilitySe ?? (placementMode === 'irt' ? 1 : undefined),
      perSubjectTheta:   src.placement.perSubjectTheta ?? {},
      subjectScores:     src.placement.subjectScores ?? base.placement?.subjectScores ?? {},
    }
    : {
      ...base.placement!,
      mode: placementMode,
    };

  return {
    ...base,
    ...src,
    version:              2,
    conceptMastery,
    placementComplete,
    placementCompletedAt,
    interactionLog:       src.interactionLog ?? base.interactionLog ?? [],
    subjectLevels:        { ...base.subjectLevels, ...(src.subjectLevels ?? {}) },
    strengths:            src.strengths ?? base.strengths,
    focusAreas:           src.focusAreas ?? base.focusAreas,
    stealth:              { ...base.stealth, ...(src.stealth ?? {}) },
    gamification:         { ...base.gamification, ...(src.gamification ?? {}) },
    voice:                src.voice
      ? { ...base.voice, ...src.voice, recent: src.voice.recent ?? base.voice.recent }
      : base.voice,
    placement,
    checkpoint:           src.checkpoint
      ? { ...src.checkpoint }
      : base.checkpoint,
    checkpointHistory:    src.checkpointHistory ?? base.checkpointHistory,
    lastCheckpointAt:     src.lastCheckpointAt,
    content:              src.content
      ? { ...defaultContentSession(), ...src.content }
      : defaultContentSession(),
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

async function saveTutorProfileWithEventExport(
  userId: string,
  profile: AdamTutorLearningProfile,
  priorLogLen: number,
): Promise<AdamTutorLearningProfile> {
  return saveProfileAndExportNewEvents(
    userId,
    profile,
    priorLogLen,
    saveTutorLearningProfile,
  );
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

function shouldRunContent(
  profile: AdamTutorLearningProfile,
  checkpointPrompt: string | null,
): boolean {
  if (!profile.placementComplete) return false;
  if (checkpointPrompt) return false;
  if (profile.checkpoint?.active && profile.checkpoint.awaitingAnswer) return false;
  return true;
}

export async function getTutorLearningProgress(
  userId: string,
): Promise<TutorLearningProgressMetrics> {
  const profile = await getTutorLearningProfile(userId);
  return computeLearningProgress(profile);
}

export async function prepareTutorLearningTurn(
  userId: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  responseMs?: number,
): Promise<TutorLearningTurnPrep> {
  let profile = await getTutorLearningProfile(userId);

  let placementItem: PlacementItem | null = null;
  let placementPrompt: string | null = null;
  let checkpointPrompt: string | null = null;
  let contentPrompt: string | null = null;
  let contentId: string | null = null;

  if (
    profile.placement?.awaitingAnswer
    && profile.placement.currentItemId
    && !profile.placementComplete
    && userMessage.trim().length > 0
  ) {
    const active = getPlacementItemById(profile.placement.currentItemId);
    if (active) {
      const priorLogLen = countInteractionLog(profile);
      profile = await saveTutorProfileWithEventExport(
        userId,
        applyPlacementAnswer(profile, active, userMessage, responseMs),
        priorLogLen,
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
      const priorLogLen = countInteractionLog(profile);
      profile = await saveTutorProfileWithEventExport(
        userId,
        applyCheckpointAnswer(profile, active, userMessage, responseMs),
        priorLogLen,
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

  if (shouldRunContent(profile, checkpointPrompt)) {
    if (
      profile.content?.awaitingAnswer
      && profile.content.currentContentId
      && userMessage.trim().length > 0
    ) {
      const active = getContentItemById(profile.content.currentContentId);
      if (active) {
        const priorLogLen = countInteractionLog(profile);
        profile = await saveTutorProfileWithEventExport(
          userId,
          applyContentAnswer(profile, active, userMessage, responseMs),
          priorLogLen,
        );
      }
    }

    if (!profile.content?.awaitingAnswer) {
      let item = profile.content?.currentContentId
        ? getContentItemById(profile.content.currentContentId)
        : null;

      if (!item) {
        const rec = recommendNextContent({ profile, userId });
        if (rec) {
          profile = assignRecommendedContent(profile, rec.item);
          item = rec.item;
        }
      }

      if (item && profile.content) {
        contentId = item.id;
        contentPrompt = buildContentDeliveryPrompt(item.id, item.prompt);
        profile.content.awaitingAnswer = true;
        profile.content.currentContentId = item.id;
        profile = await saveTutorLearningProfile(userId, profile);
      }
    }
  }

  return {
    profile,
    placementPrompt,
    checkpointPrompt,
    contentPrompt,
    contentId,
    placementItem,
  };
}

export async function recordTutorLearningTurn(input: {
  userId:                   string;
  userMessage:              string;
  viaVoice?:                boolean;
  responseMs?:              number;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
}): Promise<AdamTutorLearningProfile | null> {
  if (!input.userId?.trim() || !input.userMessage?.trim()) return null;

  const profile = await getTutorLearningProfile(input.userId);
  const priorLogLen = countInteractionLog(profile);
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

  let updated = applyStealthTurnUpdate(
    profile,
    stealth,
    emotion,
    concepts,
    input.responseMs,
  );

  if (input.viaVoice) {
    const assessment = assessVoiceTurn({
      transcript:              input.userMessage,
      viaVoice:                true,
      recentAssistantMessages: input.recentAssistantMessages,
    });
    if (assessment) {
      updated = applyVoiceTurnUpdate(updated, assessment, input.responseMs);
    }
  }

  return saveTutorProfileWithEventExport(input.userId, updated, priorLogLen);
}
