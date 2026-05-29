/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Student Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

export const STUDENT_ACCOUNTS = [
  { userId: 'izwahanie',  name: 'Izwahanie' },
  { userId: 'suhaila',    name: 'Suhaila' },
  { userId: 'aziz-tamhid', name: 'Aziz Tamhid' },
] as const;

export type StudentUserId = typeof STUDENT_ACCOUNTS[number]['userId'];

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
