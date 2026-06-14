/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Continuation Config
 * Platform : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMChatMode } from './adam.types';
import type { SectionJournalResult } from './adam-journal-section-writer';

export interface JournalContinuationConfig {
  maxContinuations: number;
  allowRetry:       boolean;
}

/** Continuation policy for founder journal turns. Section mode never retries. */
export function getJournalContinuationConfig(input: {
  isFounder:              boolean;
  mode:                   ADAMChatMode;
  journalWriteBySections: boolean;
}): JournalContinuationConfig {
  const sectionMode = input.isFounder && input.mode === 'JOURNAL_GEN' && input.journalWriteBySections;
  if (sectionMode) {
    return { maxContinuations: 0, allowRetry: false };
  }
  if (input.isFounder && input.mode === 'JOURNAL_GEN') {
    return { maxContinuations: 4, allowRetry: true };
  }
  return { maxContinuations: 0, allowRetry: false };
}

/** Section pipeline must never trigger legacy continuation passes. */
export function shouldTriggerSectionContinuation(
  _sectionResult: Pick<SectionJournalResult, 'allSectionsComplete' | 'totalWords'>,
  config: JournalContinuationConfig,
): boolean {
  if (!config.allowRetry || config.maxContinuations <= 0) return false;
  return false;
}
