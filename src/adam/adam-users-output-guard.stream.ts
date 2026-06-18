/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard — stream surface
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * Updated     : 2026-06-09 — constitutional/faith/performance leak strip
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Light post-stream sync — format hygiene only. No LLM rewrite.
 * Voice and form come from Layer 5 prompts at generation time.
 */
import { sanitizeUsersOutputSync } from './adam-users-output-guard.sanitize';
import { stripUsersBismillahOpener, outputHasScannableListStructure } from './adam-users-output-law';
import { isArithmeticAlphaCollapsedRepair } from './adam-arithmetic-alpha-guard';
import { isVisualDrawCollapsedRepair } from './adam-visual-draw-guard';
import { isUsersGreetingOnlyRepair } from './adam-users-constitution';
import { outputHasAdamProductRedirectLeak } from './adam-response-generation';
/** Post-stream hook — sync sanitize only. Layer 5 governs voice at generation. */
export async function repairUsersOutputLeak(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  participantName?: string,
  enforceUsersGreeting = false,
): Promise<string> {
  return sanitizeUsersOutputSync(
    text,
    studentMessage,
    recentUserMessages,
    recentAssistantMessages,
    participantName,
    { enforceUsersGreeting },
  );
}

export { repairFounderKonvensionalSurface } from './adam-founder-konvensional-surface';

/** Founder-style student default — surface leak strip only, no LLM rewrite. */
export function applyUsersSurfaceOutputRepair(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  participantName?: string,
  enforceUsersGreeting = false,
  options?: {
    usersTechnicalDirect?: boolean;
    gateFaithPermitted?: boolean;
    gateKonvensionalSurface?: boolean;
  },
): string {
  return sanitizeUsersOutputSync(
    text,
    studentMessage,
    recentUserMessages,
    recentAssistantMessages,
    participantName,
    {
      enforceUsersGreeting,
      usersTechnicalDirect: options?.usersTechnicalDirect,
      gateFaithPermitted: options?.gateFaithPermitted,
      gateKonvensionalSurface: options?.gateKonvensionalSurface,
    },
  );
}

/** Min fraction of streamed chars guards must keep before replacing the live stream. */
export const USERS_SURFACE_MIN_RETAIN_RATIO = 0.35;

/** Stat/fakta turns — keep live stream unless surface keeps most body text. */
export const USERS_STAT_STREAM_MIN_RETAIN_RATIO = 0.85;

function countOutputParagraphs(text: string): number {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
}

/** True when post-stream repair dropped substantive paragraphs from the live stream. */
export function usersStreamBodyWasGutted(
  rawModelStream: string,
  surface: string,
  userMessage = '',
): boolean {
  const raw = stripUsersBismillahOpener(rawModelStream.trim());
  const surf = stripUsersBismillahOpener(surface.trim());
  if (!raw || !surf || surf === raw) return false;
  if (userMessage && isArithmeticAlphaCollapsedRepair(raw, surf, userMessage)) {
    return false;
  }
  if (userMessage && isVisualDrawCollapsedRepair(raw, surf, userMessage)) {
    return false;
  }
  const rawLen = raw.length;
  const retainRatio = rawLen > 0 ? surf.length / rawLen : 1;
  const rawParas = countOutputParagraphs(raw);
  const surfParas = countOutputParagraphs(surf);
  if (rawParas >= 2 && surfParas < rawParas) return true;
  if (rawLen > 280 && retainRatio < USERS_STAT_STREAM_MIN_RETAIN_RATIO) return true;
  return false;
}

/** Min fraction retained for tier-1 essay repairs (role ask stripped to brief + door). */
export const USERS_BRIEF_TIER1_MIN_RETAIN_RATIO = 0.06;

export interface ResolveUsersStreamSurfaceOptions {
  /**
   * Current-affairs repair may shorten stale model output dramatically — always persist
   * and stream-replace with the sanitized surface.
   */
  preferSanitized?: boolean;
  /** Tier-1 role/skills ask — accept brief guard repair over long streamed essay. */
  allowBriefTier1Repair?: boolean;
  /** Stat/fakta — never swap stream for a gutted guard surface. */
  preserveStreamBody?: boolean;
  /** Technical turn — raw stream has framework leak or media refusal; always use repaired surface. */
  forceSanitized?: boolean;
  userMessage?: string;
}

/** @deprecated Tier-1 role answers keep streamed structure — only strip poetic leaks, never force brief replace. */
export function shouldBriefTier1StreamReplace(
  _rawModelStream: string,
  _surface: string,
  _userMessage: string,
): boolean {
  return false;
}

/**
 * When sync guards strip too aggressively, keep the streamed prose — do not
 * emit adam_stream_done replace or persist a gutted stub.
 */
export function resolveUsersStreamSurface(
  rawModelStream: string,
  surface: string,
  options?: ResolveUsersStreamSurfaceOptions,
): { fullResponse: string; streamReplace: string | null } {
  const raw = stripUsersBismillahOpener(rawModelStream.trim());
  const surf = stripUsersBismillahOpener(surface.trim());
  if (outputHasAdamProductRedirectLeak(raw) && !outputHasAdamProductRedirectLeak(surf)) {
    return { fullResponse: surf, streamReplace: surf };
  }
  if (!surf || surf === raw) {
    return { fullResponse: raw, streamReplace: null };
  }
  if (options?.forceSanitized) {
    return { fullResponse: surf, streamReplace: surf };
  }
  if (options?.userMessage && isArithmeticAlphaCollapsedRepair(raw, surf, options.userMessage)) {
    return { fullResponse: surf, streamReplace: surf };
  }
  if (options?.userMessage && isVisualDrawCollapsedRepair(raw, surf, options.userMessage)) {
    return { fullResponse: surf, streamReplace: surf };
  }
  if (isUsersGreetingOnlyRepair(raw, surf)) {
    return { fullResponse: surf, streamReplace: surf };
  }
  const rawLen = raw.length;
  const retainRatio = rawLen > 0 ? surf.length / rawLen : 1;

  if (options?.preserveStreamBody && usersStreamBodyWasGutted(raw, surf)) {
    return { fullResponse: raw, streamReplace: null };
  }

  if (options?.preferSanitized) {
    // Current-affairs repair may shorten stale essays — but never swap for a near-empty stub.
    if (rawLen > 280 && retainRatio < 0.15) {
      return { fullResponse: raw, streamReplace: null };
    }
    return { fullResponse: surf, streamReplace: surf };
  }
  if (options?.allowBriefTier1Repair) {
    if (rawLen > 280 && surf.length >= 100 && retainRatio >= USERS_BRIEF_TIER1_MIN_RETAIN_RATIO) {
      return { fullResponse: surf, streamReplace: surf };
    }
  }
  if (rawLen > 280 && retainRatio < USERS_SURFACE_MIN_RETAIN_RATIO) {
    return { fullResponse: raw, streamReplace: null };
  }
  // Never swap a structured stream for a flattened prose repair.
  if (outputHasScannableListStructure(raw) && !outputHasScannableListStructure(surf)) {
    return { fullResponse: raw, streamReplace: null };
  }
  return { fullResponse: surf, streamReplace: surf };
}
