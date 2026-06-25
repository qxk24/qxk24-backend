/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor UI Guide Tools (F3 — read-only)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-24
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * F3 mini-loop tools — observe only, no write/deploy. See ADAM_TUTOR_C_UID_SPEC.md §XI
 */

import { classifyAcademicTurnIntents } from './tutor-law/tutor-law.academic-intent-prompt';
import {
  analyzeStealthAssessment,
  inferConceptTagsFromMessage,
} from './tutor-law/tutor-law.adaptive-assessment';
import {
  isCheckpointDue,
  userRequestedCheckpoint,
} from './tutor-law/tutor-law.checkpoint-bank';
import { resolveStemToolLink } from './tutor-law/tutor-law.stem-tool-links';
import type { AdamTutorLearningProfile } from './tutor-law/tutor-law.learning-profile.types';
import type { AdamTutorProfile } from './tutor-law/tutor-law.types';

export type TutorScaffoldLayer = 1 | 2 | 3 | 4;

export interface TutorRecallUidObserve {
  loaded: boolean;
  stable: boolean;
}

export interface TutorTagSyllabusObserve {
  conceptTags: string[];
  topicLabel: string | null;
}

export interface TutorGuideModeObserve {
  mode:           'checkpoint-answer' | 'checkpoint-due' | 'scaffold';
  scaffoldLayer?: TutorScaffoldLayer;
  label:          string;
}

export interface TutorStemLinkObserve {
  matched: boolean;
  label:   string | null;
  url:     string | null;
}

export function observeRecallUid(
  brainRecallLoaded: boolean,
  brainRecallStable: boolean,
): TutorRecallUidObserve {
  return { loaded: brainRecallLoaded, stable: brainRecallStable };
}

export function observeTagSyllabus(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  profile?: AdamTutorProfile,
): TutorTagSyllabusObserve {
  const conceptTags = inferConceptTagsFromMessage(userMessage);
  const bundle = classifyAcademicTurnIntents({
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
    profile,
  });

  const topicLabel = bundle.mathIntent?.topic
    ?? bundle.scienceIntent?.subject
    ?? (conceptTags[0] ?? null);

  return {
    conceptTags: conceptTags.slice(0, 4),
    topicLabel:  topicLabel?.trim() || null,
  };
}

export function resolveScaffoldReleaseLayer(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
}): TutorScaffoldLayer {
  const snap = analyzeStealthAssessment({
    userMessage:             input.userMessage,
    recentUserMessages:      input.recentUserMessages,
    recentAssistantMessages: input.recentAssistantMessages,
  });
  const priorUserTurns = (input.recentUserMessages ?? []).filter((t) => t.trim().length > 0).length;

  if (snap.frustrationHit || snap.hintRequest || snap.giveUp) return 2;
  if (snap.longEngaged || snap.deepQuestion) return 4;
  if (priorUserTurns >= 1 || snap.selfCorrection) return 3;
  return 1;
}

export function observeGuideMode(
  profile: AdamTutorLearningProfile,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): TutorGuideModeObserve {
  if (profile.checkpoint?.active && profile.checkpoint.awaitingAnswer) {
    return {
      mode:  'checkpoint-answer',
      label: 'Checkpoint answer — score only, no finished work',
    };
  }

  const checkpointDue = profile.placementComplete
    && (isCheckpointDue(profile) || userRequestedCheckpoint(userMessage, recentUserMessages));

  if (checkpointDue && !profile.checkpoint?.awaitingAnswer) {
    return {
      mode:  'checkpoint-due',
      label: 'Bi-weekly checkpoint due — ZPD-weighted mini-quiz',
    };
  }

  const layer = resolveScaffoldReleaseLayer({
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  });

  const layerLabels: Record<TutorScaffoldLayer, string> = {
    1: 'Layer 1 — probe first (one question)',
    2: 'Layer 2 — hint and analogy',
    3: 'Layer 3 — scaffold structure, student does next step',
    4: 'Layer 4 — full explanation + one check question',
  };

  return {
    mode:           'scaffold',
    scaffoldLayer:  layer,
    label:          layerLabels[layer],
  };
}

export function observeStemLink(
  userMessage: string,
  recentUserMessages: string[] = [],
  profile?: AdamTutorProfile,
): TutorStemLinkObserve {
  const bundle = classifyAcademicTurnIntents({
    userMessage,
    recentUserMessages,
    profile,
  });
  const tool = resolveStemToolLink({
    userMessage,
    recentUserMessages,
    mathIntent:    bundle.mathIntent,
    scienceIntent: bundle.scienceIntent,
    profile,
  });

  if (!tool) {
    return { matched: false, label: null, url: null };
  }

  return {
    matched: true,
    label:   tool.label,
    url:     tool.url,
  };
}
