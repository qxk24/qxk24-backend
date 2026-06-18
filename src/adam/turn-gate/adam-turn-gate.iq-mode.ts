/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate IQ Mode (analytic delivery)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * IQ-only — usersMode + contentIntent. EQ must never set these.
 */

import type { AdamAnswerLane, AdamUsersAnswerMode, AdamUsersIntent } from '../adam-answer-plan';
import { usersDomainUsesTeachingPack } from '../adam-users-domain-router';
import type { AdamUsersDomainFacet } from '../adam-users-domain-router';
import type { AdamAffectiveTone } from './adam-turn-gate.types';
import type { AdamSurfaceKind } from './sensing-engine/adam-sensing.types';

const LIGHT_EQ_TONES: ReadonlySet<AdamAffectiveTone> = new Set(['light', 'prose-craft']);
const LIGHT_SURFACES: ReadonlySet<AdamSurfaceKind> = new Set([
  'greeting',
  'factual',
  'arithmetic',
  'relational',
  'practical',
  'prose-craft',
]);

/** IQ — substantive content intent (not relational tone). */
export function resolveIqContentIntent(
  surfaceKind: AdamSurfaceKind,
  affectiveTone: AdamAffectiveTone,
): AdamUsersIntent {
  if (affectiveTone === 'light' || surfaceKind === 'greeting') return 'light';
  if (surfaceKind === 'factual') return 'factual';
  if (surfaceKind === 'relational' || affectiveTone === 'relational') return 'relational';
  if (surfaceKind === 'practical' || affectiveTone === 'practical') return 'practical';
  if (surfaceKind === 'procedure-howto') return 'practical';
  return 'substantive';
}

/** IQ — technical display + teaching pack eligibility. Independent of EQ lane stubs. */
export function resolveIqUsersMode(
  lane: AdamAnswerLane,
  surfaceKind: AdamSurfaceKind,
  domainFacet: AdamUsersDomainFacet,
  affectiveTone: AdamAffectiveTone,
): AdamUsersAnswerMode {
  if (lane !== 'users') return 'general';
  if (domainFacet === 'prose-craft' || domainFacet === 'faith' || domainFacet === 'practical-career') {
    return 'general';
  }
  // Teaching-pack domains stay technical even on factual/arithmetic surfaces (school maths, stats).
  if (usersDomainUsesTeachingPack(domainFacet)) return 'technical';
  if (LIGHT_EQ_TONES.has(affectiveTone)) return 'general';
  if (LIGHT_SURFACES.has(surfaceKind)) return 'general';
  return 'general';
}

export function resolveIqStructured(
  lane: AdamAnswerLane,
  usersMode: AdamUsersAnswerMode,
): boolean {
  return lane === 'users' && usersMode === 'technical';
}
