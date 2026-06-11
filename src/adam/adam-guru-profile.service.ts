/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Teacher Profile Service
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  AdamGuruProfileModel,
  GURU_PROFILE_BIO_MAX,
  GURU_PROFILE_MAX_SUBJECTS,
  type AdamGuruProfileDocument,
} from './adam-guru-profile.schema';

export interface GuruProfileView {
  guruId:          string;
  fullName:        string;
  credentialTitle: string;
  institution:     string;
  email:           string;
  phone:           string;
  country:         string;
  bio:             string;
  subjects:        string[];
  teachingFocus:   string;
  profileComplete: boolean;
  createdAt:       string;
  updatedAt:       string;
}

export interface GuruProfileInput {
  fullName:        string;
  credentialTitle?: string;
  institution:     string;
  email?:          string;
  phone?:          string;
  country?:        string;
  bio?:            string;
  subjects:        string[];
  teachingFocus?:  string;
}

function normalizeSubjects(subjects: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of subjects) {
    const s = raw.trim();
    if (s.length < 2) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= GURU_PROFILE_MAX_SUBJECTS) break;
  }
  return out;
}

export function isGuruProfileComplete(doc: Pick<AdamGuruProfileDocument, 'fullName' | 'institution' | 'subjects'> | null): boolean {
  if (!doc) return false;
  return Boolean(
    doc.fullName.trim().length >= 2
    && doc.institution.trim().length >= 2
    && doc.subjects.length >= 1,
  );
}

function toView(doc: AdamGuruProfileDocument): GuruProfileView {
  return {
    guruId:          doc.guruId,
    fullName:        doc.fullName,
    credentialTitle: doc.credentialTitle ?? '',
    institution:     doc.institution,
    email:           doc.email ?? '',
    phone:           doc.phone ?? '',
    country:         doc.country ?? '',
    bio:             doc.bio ?? '',
    subjects:        doc.subjects ?? [],
    teachingFocus:   doc.teachingFocus ?? '',
    profileComplete: isGuruProfileComplete(doc),
    createdAt:       doc.createdAt.toISOString(),
    updatedAt:       doc.updatedAt.toISOString(),
  };
}

export async function getGuruProfile(guruId: string): Promise<GuruProfileView | null> {
  const doc = await AdamGuruProfileModel.findOne({ guruId });
  return doc ? toView(doc) : null;
}

export async function upsertGuruProfile(
  guruId: string,
  input: GuruProfileInput,
): Promise<GuruProfileView> {
  const fullName = input.fullName.trim();
  const institution = input.institution.trim();
  const subjects = normalizeSubjects(input.subjects);

  if (fullName.length < 2) throw new Error('Full name is required.');
  if (institution.length < 2) throw new Error('Institution is required.');
  if (subjects.length < 1) throw new Error('Add at least one subject you teach.');

  const bio = (input.bio ?? '').trim().slice(0, GURU_PROFILE_BIO_MAX);
  const teachingFocus = (input.teachingFocus ?? '').trim().slice(0, 300);

  const doc = await AdamGuruProfileModel.findOneAndUpdate(
    { guruId },
    {
      $set: {
        guruId,
        fullName,
        credentialTitle: (input.credentialTitle ?? '').trim().slice(0, 40),
        institution,
        email:           (input.email ?? '').trim().slice(0, 120),
        phone:           (input.phone ?? '').trim().slice(0, 40),
        country:         (input.country ?? '').trim().slice(0, 80),
        bio,
        subjects,
        teachingFocus,
      },
    },
    { upsert: true, new: true },
  );

  return toView(doc);
}

/** Add a subject to guru profile if not already listed (e.g. when creating a new kelas). */
export async function ensureGuruProfileSubject(guruId: string, subject: string): Promise<void> {
  const trimmed = subject.trim();
  if (trimmed.length < 2) return;
  const doc = await AdamGuruProfileModel.findOne({ guruId });
  if (!doc) return;
  const key = trimmed.toLowerCase();
  if (doc.subjects.some((s) => s.toLowerCase() === key)) return;
  if (doc.subjects.length >= GURU_PROFILE_MAX_SUBJECTS) return;
  doc.subjects.push(trimmed);
  await doc.save();
}
