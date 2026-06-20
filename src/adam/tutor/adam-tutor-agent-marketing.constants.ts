/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Marketing Constants
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AdamTutorProfile } from '../adam-tutor-law';

/** Stored in tutorProfile.localeNote — unlocks all school bands in prompts. */
export const AGENT_MARKETING_LOCALE_NOTE = 'ALL_BANDS';

export function agentMarketingTutorProfile(): AdamTutorProfile {
  return {
    level:       'secondary',
    curriculum:  'national',
    language:    'malay',
    countryCode: 'MY',
    yearLabel:   'Semua kategori',
    localeNote:  AGENT_MARKETING_LOCALE_NOTE,
  };
}

export function isAgentMarketingTutorProfile(profile?: AdamTutorProfile | null): boolean {
  return profile?.localeNote === AGENT_MARKETING_LOCALE_NOTE;
}

export function isAgentMarketingStudentUserId(userId: string): boolean {
  return /^tutor-agt-/i.test(userId.trim());
}
