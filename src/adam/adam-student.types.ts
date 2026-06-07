/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Types
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

/** Initial accounts migrated into MongoDB on first boot (passwords from env). */
export const SEED_STUDENT_ACCOUNTS = [
  { userId: 'izwahanie',   name: 'Izwahanie' },
  { userId: 'suhaila',     name: 'Suhaila' },
  { userId: 'aziz-tamhid', name: 'Aziz Tamhid' },
  { userId: 'amer',        name: 'Amer' },
  { userId: 'iskandar',    name: 'Iskandar' },
  { userId: 'haqimi',      name: 'Haqimi' },
] as const;

export type StudentUserId = string;

export interface StudentAccountRecord {
  userId: string;
  name:   string;
}

export const GROUP_SESSION_ID = 'K24s-group-alamtologi-era1';
export const FOUNDER_USER_ID = 'masa-bayu';

export type SessionType = 'founder' | 'student' | 'group';
export type SpeakerRole = 'founder' | 'student' | 'adam';
export type AdamUserRole = 'founder' | 'student';

export interface AdamAuthUser {
  userId:   string;
  role:     AdamUserRole;
  name:     string;
  isFounder: boolean;
}

/** Who is in an ADAM chat turn (founder, student, or group) */
export interface ChatParticipant {
  userId:      string;
  userName:    string;
  role:        AdamUserRole;
  sessionType: SessionType;
}
