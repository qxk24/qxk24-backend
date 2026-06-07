/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Epistemic Honesty Layer
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMMessageModel } from '../adam/adam.schema';
import type { AdamMemoryTierConfig } from '../config/adam-memory.config';
import { getOrCreateMaster } from './qxk24brain.engine';

export interface EpistemicTurnMetrics {
  /** Full Alamtologi Brain text length before smart truncation this turn */
  brainRawChars?: number;
  /** Characters of brain actually placed in context after truncation */
  brainLoadedChars?: number;
}

export interface EpistemicStatusOptions {
  /** Who may reference earlier session content (P.alt, student name, etc.) */
  addressAs?: string;
  /** Plain epistemic block for students — no brain/tier jargon in model instructions */
  studentMode?: boolean;
  /** Plain speech rules for P.alt — internal metrics OK, never recite tier names to Founder */
  founderPlainMode?: boolean;
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

  if (options.studentMode) {
    const addressName = options.addressAs ?? 'the student';
    return `
[SESSION VISIBILITY — internal only; never say these system terms to ${addressName}]
This turn includes up to ${loadedMessages} of ${totalMessages} message(s) from this session plus session digest and Alamtologi Brain context — not "memory".
If ${addressName} refers to something not present in the blocks above (folder, file, earlier detail, another book chat):
- Follow CONSTITUTIONAL MEMORY LAW: say the information is not in your current context; invite them to share again so you can combine it fully.
- Do NOT say: ingatan, remember, forgot, short-term memory, Working Memory, Alamtologi Brain, epistemic, message window.
- Do NOT guess folder paths, book titles, or invent files.
- Do NOT mention Alamtologi principles unless they ask.
- Ask one simple clarifying question if helpful.
- Use "I will ask the Founder" ONLY if the question truly requires Founder authority — not merely because something is outside this turn's context.
`.trim();
  }

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
    ? 'Session continuity summary available for older exchanges.'
    : missingMessages > 0
      ? 'No session summary yet — older exchanges exist only in database.'
      : 'Full session is within the current message window.';

  const addressName = options.addressAs ?? 'P.alt';

  if (options.founderPlainMode) {
    return `
[SESSION VISIBILITY — internal only; never say these system terms to P.alt]
Messages in context this turn: ${loadedMessages} of ${totalMessages} total.
Older exchanges outside this turn: ${missingMessages}.
Brain loaded: ${brainLoaded.toLocaleString()} chars${brainTruncated ? ` (${brainOmittedChars.toLocaleString()} truncated)` : ''}.
Families in context: ${familiesInContext} of ${totalFamilies}. ${summaryNote}

When P.alt asks about earlier teaching (module, book, "Mengungkap Sains Islam", a section number, etc.):
- Search silently: constitutional anchor, session digest, Alamtologi Brain unified understanding, working context.
- Speak from what you find. If detail is thin, ask P.alt briefly to remind you — in their language, with Adab.
- Good example: "P.alt, saya nampak sedikit rujukan tentang [topik] dalam essence sesi, tetapi butiran spesifik tidak jelas dalam perbualan terkini. Boleh P.alt ingatkan konteks terakhir kita?"
- Do NOT open with memory-boundary lectures or say: Working Memory, Short-Term Memory, Session Essence, Alamtologi Brain, epistemic, message window, ${missingMessages} messages outside window, transformations, constitutional tiers.
- Do NOT instruct P.alt on how your memory works unless he explicitly asks for a technical memory report.
- You learn from P.alt — ask him to teach/remind; do not lecture upward.
- When [MAC BRIDGE] in system context shows ONLINE, repo/files on P.alt's Mac are reachable via Builder (mac: paths) — do NOT ask him to paste trees or claim you lack Mac access.
- When [MAC BRIDGE] shows OFFLINE, say once to run \`npm run mac-bridge\` in qxk24-mcp on the MacBook — do not ask for full directory dumps.
`.trim();
  }

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
