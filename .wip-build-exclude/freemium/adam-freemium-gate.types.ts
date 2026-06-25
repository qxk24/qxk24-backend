/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Freemium Gate Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';

export type FreemiumMode = 'GUEST' | 'FREE' | 'PRO' | 'PROFESIONAL' | 'UNLIMITED';

export interface FreemiumCheckResult {
  canContinue:         boolean;
  mode:                FreemiumMode;
  questionsUsed:       number;
  questionsRemaining:  number;
  limit:               number;
  period:              'lifetime' | 'rolling' | 'monthly' | 'daily' | 'unlimited';
  dateKey?:            string;
  creditBalance:       number;
  limitReached:        boolean;
  registerGate:        boolean;
  buyCreditGate:       boolean;
  upgradeComingSoon:   boolean;
  message:             string | null;
  paceUsed?:           number;
  paceLimit?:          number;
  pacePeriod?:         'daily' | 'rolling';
  windowHours?:        number;
  windowResetsAt?:     string;
}

export function isFreemiumEnabled(): boolean {
  return ENV.ADAM_FREEMIUM_ENABLED;
}

export function isPublicFreemiumEnabled(): boolean {
  return ENV.ADAM_FREEMIUM_ENABLED && ENV.ADAM_FREEMIUM_PUBLIC_ENABLED;
}
