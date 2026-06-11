/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Profile Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMStudentAccountModel } from './adam-student.schema';
import {
  formatTutorProfileOneLiner,
  type AdamTutorProfile,
} from './adam-tutor-law';

/** QA / demo pelajar-lane accounts — skip registration gate on every device. */
const QA_TUTOR_DEFAULT_PROFILES: Readonly<Record<string, AdamTutorProfile>> = {
  'pelajar-test': {
    level:       'secondary',
    curriculum:  'national',
    language:    'english',
    countryCode: 'MY',
    yearLabel:   'Year 10',
    localeNote:  'KSSM',
  },
  sabrina: {
    level:       'secondary',
    curriculum:  'national',
    language:    'english',
    countryCode: 'MY',
    yearLabel:   'Year 10',
    localeNote:  'KSSM',
  },
};

export function qaTutorDefaultProfile(userId: string): AdamTutorProfile | null {
  return QA_TUTOR_DEFAULT_PROFILES[userId.trim().toLowerCase()] ?? null;
}

function normalizeProfile(profile: AdamTutorProfile): AdamTutorProfile {
  return {
    level:       profile.level,
    curriculum:  profile.curriculum,
    language:    profile.language,
    yearLabel:   profile.yearLabel?.trim() || undefined,
    countryCode: profile.countryCode?.trim().toUpperCase() || undefined,
    localeNote:  profile.localeNote?.trim() || undefined,
  };
}

export async function saveTutorProfile(
  userId: string,
  profile: AdamTutorProfile,
): Promise<AdamTutorProfile> {
  const normalized = normalizeProfile(profile);
  await ADAMStudentAccountModel.updateOne(
    { userId, active: true },
    { $set: { tutorProfile: normalized, tutorProfileUpdatedAt: new Date() } },
  );
  return normalized;
}

export async function getTutorProfile(userId: string): Promise<AdamTutorProfile | null> {
  const doc = await ADAMStudentAccountModel.findOne({ userId, active: true })
    .select({ tutorProfile: 1 })
    .lean();
  if (doc?.tutorProfile?.level) {
    return doc.tutorProfile as AdamTutorProfile;
  }
  return qaTutorDefaultProfile(userId);
}

/** Persist QA tutor profiles so Founder + devices see the same defaults. */
export async function ensureQaTutorProfiles(): Promise<number> {
  let updated = 0;
  for (const [userId, profile] of Object.entries(QA_TUTOR_DEFAULT_PROFILES)) {
    const result = await ADAMStudentAccountModel.updateOne(
      {
        userId,
        active: true,
        $or: [
          { tutorProfile: { $exists: false } },
          { 'tutorProfile.level': { $exists: false } },
          { 'tutorProfile.level': null },
        ],
      },
      { $set: { tutorProfile: normalizeProfile(profile), tutorProfileUpdatedAt: new Date() } },
    );
    if ((result.modifiedCount ?? 0) > 0) updated++;
  }
  return updated;
}

export async function getTutorProfilesByUserIds(
  userIds: readonly string[],
): Promise<Map<string, AdamTutorProfile>> {
  if (userIds.length === 0) return new Map();

  const docs = await ADAMStudentAccountModel.find({
    userId: { $in: [...userIds] },
    active: true,
    'tutorProfile.level': { $exists: true },
  })
    .select({ userId: 1, tutorProfile: 1 })
    .lean();

  const map = new Map<string, AdamTutorProfile>();
  for (const doc of docs) {
    if (doc.tutorProfile?.level) {
      map.set(doc.userId, doc.tutorProfile as AdamTutorProfile);
    }
  }
  return map;
}

export function tutorProfileFounderLine(profile: AdamTutorProfile | null | undefined): string {
  const summary = formatTutorProfileOneLiner(profile);
  return summary ? `Tutor profile: ${summary}` : 'Tutor profile: not saved yet';
}
