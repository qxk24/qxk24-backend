/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Probes (leaf)
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
 * Leaf probes — no adam-teaching-record import (breaks barrel circular dep).
 */

import {
  founderAsksPersonalBiography,
  founderAsksDrAminullahContext,
} from '../adam-knowledge-prompts';
import { isAlamtologiCurriculumOverviewQuery } from './curriculum-overview';
import { mentionsAidilEngine } from './types';
import { resolveBookChapter } from './resolve';

/** P.alt asks to recall prior teaching / session memory. */
export function founderAsksTeachingRecall(message: string): boolean {
  return /\b(remember|recall|ingat|ingatkan|do you remember|what did we discuss|what did i teach|when you first|when i first|bila kita|sesi itu|teaching record|rekod pembelajaran|rekod\s+pengajaran)\b/i.test(
    message,
  );
}

/** Route book/chapter-aware teaching recall for context builder. */
export function needsBookAwareTeachingRecall(message: string): boolean {
  if (founderAsksPersonalBiography(message)) return false;
  if (founderAsksDrAminullahContext(message)) return true;
  if (founderAsksTeachingRecall(message)) return true;
  if (isAlamtologiCurriculumOverviewQuery(message)) return true;
  if (mentionsAidilEngine(message)) return true;
  return resolveBookChapter(message) !== null;
}
