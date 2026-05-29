/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Epistemic Honesty Layer
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMMessageModel } from '../adam/adam.schema';
import type { AdamMemoryTierConfig } from '../config/adam-memory.config';
import { getOrCreateMaster } from './qxk24brain.engine';

export interface EpistemicTurnMetrics {
  /** Full QXK24Brain text length before smart truncation this turn */
  brainRawChars?: number;
  /** Characters of brain actually placed in context after truncation */
  brainLoadedChars?: number;
}

export interface EpistemicStatusOptions {
  /** Who may reference earlier session content (P.alt, student name, etc.) */
  addressAs?: string;
}

export async function buildEpistemicStatus(
  sessionId: string,
  founderId: string,
  config: AdamMemoryTierConfig,
  metrics: EpistemicTurnMetrics = {},
  options: EpistemicStatusOptions = {},
): Promise<string> {
  const totalMessages = await ADAMMessageModel.countDocuments({ sessionId });
  const loadedMessages = Math.min(config.MESSAGE_WINDOW, totalMessages);
  const missingMessages = Math.max(0, totalMessages - config.MESSAGE_WINDOW);

  const master = await getOrCreateMaster(founderId);
  const totalTransformations = master.totalTransformations;
  const totalFamilies =
    master.activeFamilies.length + master.completedFamilies.length;

  const familiesInContext =
    Math.min(master.activeFamilies.length, config.ACTIVE_FAMILIES) +
    Math.min(master.completedFamilies.length, config.COMPLETED_FAMILIES);
  const familiesOutsideContext = Math.max(0, totalFamilies - familiesInContext);

  const brainRaw = metrics.brainRawChars ?? 0;
  const brainLoaded = metrics.brainLoadedChars ?? brainRaw;
  const brainTruncated =
    brainRaw > 0 && brainLoaded > 0 && brainLoaded < brainRaw;
  const brainOmittedChars = brainTruncated ? brainRaw - brainLoaded : 0;

  const sessionSummary =
    master.sessionContext?.currentSessionId === sessionId &&
    Boolean(master.sessionContext?.lastSummary?.trim());
  const summaryNote = sessionSummary
    ? 'Session essence summary is available for older exchanges beyond the message window.'
    : missingMessages > 0
      ? 'No session essence summary yet — older exchanges are only in the database.'
      : 'Full session is within the current message window.';

  const addressName = options.addressAs ?? 'P.alt';

  return `
[EPISTEMIC STATUS — What ADAM currently sees this turn]
This is the boundary of access — not the boundary of what ADAM has become.

SESSION MESSAGES:
  Total in database:        ${totalMessages}
  Loaded this turn:           ${loadedMessages}
  Outside current window:   ${missingMessages} message(s)
  (preserved in database — not visible in history this turn)
  ${summaryNote}

QXKBRAIN UNIFIED UNDERSTANDING:
  Transformations completed:  ${totalTransformations}
  Knowledge families (total): ${totalFamilies}
  Families in this turn:      ${familiesInContext}
  Families not listed:      ${familiesOutsideContext}
  Brain context characters:   ${brainLoaded.toLocaleString()} loaded${
    brainTruncated
      ? ` (${brainOmittedChars.toLocaleString()} omitted by smart truncation — synthesis start and recent tail preserved)`
      : brainRaw > 0
        ? ' (full brain block loaded)'
        : ''
  }

EPISTEMIC DUTY:
If ${addressName} references something from earlier in this session that ADAM does not recall,
it may be outside the ${config.MESSAGE_WINDOW}-message window or truncated from brain context.
ADAM will say so honestly — with Adab — rather than fabricating.
"I do not have that exchange in my current view; it may be in the ${missingMessages} message(s) outside this window."
`.trim();
}
