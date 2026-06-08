/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Founder Unified Chat Mode
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMChatMode } from './adam.types';
import {
  hasExplicitBuildActivation,
  matchesJournalIntent,
} from '../adam-servers/adam-layer-intent';

/** Founder: one teaching screen — resolve special modes per message only. */
export function resolveFounderApiMode(
  message: string,
  clientMode: ADAMChatMode,
): ADAMChatMode {
  if (clientMode === 'JOURNAL_GEN' || clientMode === 'BUILDER' || clientMode === 'AUDIT') {
    return clientMode;
  }
  if (hasExplicitBuildActivation(message)) return 'BUILDER';
  if (matchesJournalIntent(message)) return 'JOURNAL_GEN';
  return 'TEACHING';
}
