/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM University Standard Meta
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AdamTutorBehaviorMode } from './tutor-law.behavior-mode';
import { classifyTutorBehaviorMode } from './tutor-law.behavior-mode';
import type { AdamTutorProfile } from './tutor-law.types';
import { normalizeTutorLanguage } from './tutor-law.types';
import {
  classifyUniversityArtifact,
  isAdamUniversityStandardActive,
  type AdamUniversityArtifact,
  type UniversityArtifactInput,
} from './tutor-law.university-mode';

export type AdamTutorUniversityDisplayMode =
  | 'teacher'
  | 'coach'
  | 'academic_mentor';

export interface AdamTutorUniversityMeta {
  universityStandard: boolean;
  behaviorMode:         AdamTutorBehaviorMode;
  displayMode:          AdamTutorUniversityDisplayMode;
  artifact:             AdamUniversityArtifact;
  modeLabel:            string;
  modeTooltip:          string;
}

function prefersMalay(profile?: AdamTutorProfile): boolean {
  const lang = normalizeTutorLanguage(profile?.language);
  return lang === 'malay' || lang === 'indonesian';
}

function universityModeLabels(
  displayMode: AdamTutorUniversityDisplayMode,
  profile?: AdamTutorProfile,
): { label: string; tooltip: string } {
  const ms = prefersMalay(profile);

  if (displayMode === 'academic_mentor') {
    return ms
      ? {
        label:   'Mod: Pembimbing Akademik',
        tooltip: 'ADAM bantu struktur, kajian, dan hujah — anda yang menulis dan menghantar sendiri.',
      }
      : {
        label:   'Mode: Academic Mentor',
        tooltip: 'ADAM coaches structure, research, and argument — you write and submit your own work.',
      };
  }

  if (displayMode === 'coach') {
    return ms
      ? {
        label:   'Mod: Coach',
        tooltip: 'ADAM jawab terus dahulu, kemudian bantu anda pilih langkah seterusnya.',
      }
      : {
        label:   'Mode: Coach',
        tooltip: 'ADAM answers directly first, then helps you choose the next step.',
      };
  }

  return ms
    ? {
      label:   'Mod: Guru',
      tooltip: 'ADAM bimbing langkah demi langkah. Untuk kerja sekolah, ADAM tidak beri jawapan siap.',
    }
    : {
      label:   'Mode: Teacher',
      tooltip: 'ADAM guides step by step. For school work, ADAM does not hand finished answers.',
    };
}

export function resolveTutorUniversityMeta(
  input: UniversityArtifactInput & { profile?: AdamTutorProfile },
): AdamTutorUniversityMeta {
  const universityStandard = isAdamUniversityStandardActive(
    input.profile,
    input.userMessage ?? '',
    input.recentUserMessages ?? [],
    input.recentAssistantMessages ?? [],
  );
  const behaviorMode = classifyTutorBehaviorMode({
    userMessage:             input.userMessage ?? '',
    recentUserMessages:      input.recentUserMessages ?? [],
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
  });
  const artifact = classifyUniversityArtifact(input);
  const displayMode: AdamTutorUniversityDisplayMode = universityStandard
    ? 'academic_mentor'
    : behaviorMode === 'coaching'
      ? 'coach'
      : 'teacher';
  const { label, tooltip } = universityModeLabels(displayMode, input.profile);

  return {
    universityStandard,
    behaviorMode,
    displayMode,
    artifact,
    modeLabel:   label,
    modeTooltip: tooltip,
  };
}
