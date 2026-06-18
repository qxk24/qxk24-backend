/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Brain Load Gate
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Leaf module — no adam-teaching-record import (breaks barrel circular dep).
 * AMA brain integration imports here directly, not via barrel re-export timing.
 */

import { isAlamtologiCurriculumOverviewQuery } from './curriculum-overview';
import { mentionsAidilEngine } from './types';
import { resolveBookChapter } from './resolve';

/** Founder AMA dual-lane: load Kr + Kn when question maps to book/chapter context. */
export function chapterNeedsFullBrainLoad(message: string): boolean {
  if (isAlamtologiCurriculumOverviewQuery(message)) return true;
  if (mentionsAidilEngine(message)) return true;
  return resolveBookChapter(message) !== null;
}
