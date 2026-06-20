/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Voice Pipeline
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  finalizeVerificationGatedOutput,
  prependSearchUnavailableNotice,
  resolveTechnicalPrecisionTurn,
  resolveUserEntityCorrectionTurn,
} from '../../src/adam/adam-factual-grounding';
import { enrichSunomVerificationInput } from '../../src/adam/adam-sunom-pipeline';
import { sanitizeSunomVerifiedOutput } from '../../src/adam/adam-sunom-verification';
import {
  buildStudentGreetingFallback,
  buildStudentGuidedPerspectiveFallback,
  buildLifeWellbeingVoiceFallback,
  isAdamLightChatTurn,
  isAdamLifeWellbeingTurn,
  isAdamSubstantiveTurn,
  STUDENT_ENTITY_CORRECTION_FALLBACK,
} from '../../src/adam/adam-response-generation';
import { sanitizeAdamProseDashBridges } from '../../src/adam/adam-prose-sanitize';
import { repairUsersOutputLeak } from '../../src/adam/adam-users-output-guard';
import { buildStudentForbiddenPronounRegex } from '../../src/adam/adam-users-output-law';
import type { LlmSearchResult } from '../../src/llm/llm-types';

export interface StudentVoicePipelineInput {
  userMessage:         string;
  recentUserMessages?: string[];
  recentAssistantMessages?: string[];
  rawModelOutput:      string;
  searchResults?:      LlmSearchResult[];
  searchUsed?:         boolean;
  searchDropped?:      boolean;
  userName?:           string;
}

export const VOICE_MACHINE_ERROR =
  /tidak tersedia pada giliran|Maaf — jawapan tidak tersedia/i;

export const VOICE_PASSIVE_MENU =
  /\bAdakah\s+anda\s+ingin\s+bandingkan\b|\bsaya\s+boleh\s+carikan\b|\bmempertimbangkan\s+pembelian\b/i;

/** Hygiene invariants — unified ADAM allows Bismillah, em dashes, and warm depth. */
export const STUDENT_VOICE_INVARIANT_PATTERNS = {
  forbiddenPronoun: buildStudentForbiddenPronounRegex('i'),
  catatan:          /^Catatan:/m,
  frameworkLabel:   /Dalam lensa Alamtologi|Dari perspektif Alamtologi/i,
  sunomNotation:    /:=\s*[01]\s*(?:VERIFIED|CONDITIONAL|SUSPENDED)/i,
  founderTeachingRoom: /\bP\.?\s*alt\b|AMA\s+124|lerai\s*\(PL\)/i,
  unsolicitedQuran: /Allah berfirman/i,
} as const;

/** Full student post-stream path through fallbacks and prose sanitize. */
export async function runStudentVoicePipeline(
  input: StudentVoicePipelineInput,
): Promise<string> {
  const recent = input.recentUserMessages ?? [];
  const recentAssistant = input.recentAssistantMessages ?? [];
  const precision = resolveTechnicalPrecisionTurn(input.userMessage, recent);
  const entityCorrection = resolveUserEntityCorrectionTurn(input.userMessage, recent);
  const raw = input.rawModelOutput;

  let out = await repairUsersOutputLeak(raw, input.userMessage, recent, recentAssistant);

  if (precision.isActive) {
    out = prependSearchUnavailableNotice(out, {
      technicalTurn:    precision.isActive,
      searchWasDropped: input.searchDropped === true,
    });
    const sunomInput = await enrichSunomVerificationInput({
      userMessage:        input.userMessage,
      recentUserMessages: recent,
      searchResults:      input.searchResults ?? [],
      searchUsed:         input.searchUsed ?? false,
      searchDropped:      input.searchDropped ?? false,
      skipFingerFetch:    true,
    });
    out = sanitizeSunomVerifiedOutput(out, {
      ...sunomInput,
      rawOutputText: raw,
    });
    out = finalizeVerificationGatedOutput(out, input.userMessage, recent);
  } else {
    const repairedBeforeFinalize = out;
    const finalized = finalizeVerificationGatedOutput(out, input.userMessage, recent);
    const searchBackedTurn = input.searchUsed === true && input.searchDropped !== true;
    if (finalized.trim()) {
      out = finalized;
    } else if (!entityCorrection.isActive && !searchBackedTurn) {
      out = repairedBeforeFinalize;
    } else {
      out = '';
    }
  }

  if (!out?.trim() && raw.trim()) {
    const recovered = await repairUsersOutputLeak(raw, input.userMessage, recent, recentAssistant);
    const recoveredFinal = finalizeVerificationGatedOutput(
      recovered,
      input.userMessage,
      recent,
    );
    out = recoveredFinal.trim() ? recoveredFinal : '';
  }

  if (!out?.trim() && !precision.isActive) {
    if (isAdamLightChatTurn(input.userMessage)) {
      out = buildStudentGreetingFallback(input.userMessage, input.userName);
    } else if (entityCorrection.isActive) {
      out = STUDENT_ENTITY_CORRECTION_FALLBACK;
    } else if (isAdamSubstantiveTurn(input.userMessage)) {
      if (isAdamLifeWellbeingTurn(input.userMessage)) {
        out = buildLifeWellbeingVoiceFallback(input.userMessage);
      } else {
        out = buildStudentGuidedPerspectiveFallback(input.userMessage);
      }
    }
  }

  if (out?.trim()) {
    out = sanitizeAdamProseDashBridges(out);
  }

  return out;
}
