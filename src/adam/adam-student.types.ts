/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

/** umum = ADAM Learn (public); pelajar = ADAM Tutor (school/uni). */
export type AdamAccountLane = 'umum' | 'pelajar';

export interface SeedStudentAccount {
  userId:       string;
  name:         string;
  accountLane?: AdamAccountLane;
}

/** Initial accounts migrated into MongoDB on first boot (passwords from env). */
export const SEED_STUDENT_ACCOUNTS: readonly SeedStudentAccount[] = [
  { userId: 'izwahanie',   name: 'Izwahanie' },
  { userId: 'suhaila',     name: 'Suhaila' },
  { userId: 'aziz-tamhid', name: 'Aziz Tamhid' },
  { userId: 'amer',        name: 'Amer' },
  { userId: 'iskandar',    name: 'Iskandar' },
  { userId: 'haqimi',      name: 'Haqimi' },
  /** QA / demo — ADAM Tutor lane (pelajar). Password: STUDENT_PASSWORD_PELAJAR_TEST in env. */
  { userId: 'pelajar-test', name: 'Pelajar Test', accountLane: 'pelajar' },
  /** QA / demo — ADAM Tutor lane. Password: STUDENT_PASSWORD_SABRINA in env. */
  { userId: 'sabrina', name: 'Sabrina', accountLane: 'pelajar' },
  /** QA tutor tester — Password: STUDENT_PASSWORD_ALI or Ali1234 in env. */
  { userId: 'ali', name: 'Ali', accountLane: 'pelajar' },
];

export type StudentUserId = string;

export interface StudentAccountRecord {
  userId:       string;
  name:         string;
  accountLane?: AdamAccountLane;
}

export const GROUP_SESSION_ID = 'K24s-group-alamtologi-era1';
export const FOUNDER_USER_ID = 'masa-bayu';

export type SessionType = 'founder' | 'student' | 'group' | 'guru' | 'tutor' | 'niaga';
export type SpeakerRole = 'founder' | 'student' | 'guru' | 'adam';
export type AdamUserRole = 'founder' | 'student' | 'guru';
export type AdamAccountRole = 'student' | 'guru';

export interface AdamAuthUser {
  userId:       string;
  role:         AdamUserRole;
  name:         string;
  isFounder:    boolean;
  accountLane?: AdamAccountLane;
}

/** Who is in an ADAM chat turn (founder, student, or group) */
export interface ChatParticipant {
  userId:      string;
  userName:    string;
  role:        AdamUserRole;
  sessionType: SessionType;
}
