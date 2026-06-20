/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stable Curriculum Search Gate
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Skip web search for stable syllabus concepts and bare topic tokens
 * (Algebra, Laut Mati, Fibonacci, straight) — prevents NHS/Norway misroute.
 */

import {
  isAdamGeographyTurn,
  isAdamMathematicsTurn,
  isAdamPedagogyKonvensionalTurn,
} from './adam-domain-detectors';
import {
  isAdamLightChatTurn,
  isAdamTeachingDepthTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import {
  isAdamCurrentAffairsTurn,
  isExplicitFreshnessRequest,
  isVerifiedDataStatAsk,
} from './adam-web-search';

/** Bare curriculum token — one word or fixed phrase, no question mark. */
const SINGLE_TOKEN_STABLE =
  /^(?:algebra|aljabar|fibonacci|geometri|geometry|trigonometri|trigonometry|kalkulus|calculus|fotosintesis|photosynthesis|kbat|straight|left|right|because|although|however|laut\s+mati|dead\s+sea|antartika|antarctica|canberra|orion|insulin|diabetes|ai)$/i;

const SHORT_STABLE_PHRASE =
  /^(?:laut\s+mati|dead\s+sea|terjemah(?:kan)?\s+straight|straight\s+terjemah)$/i;

const LIVE_DATA_ASK =
  /\b(?:terbaru|latest|verify|sahkan|202[4-9]|siapa\s+(?:presiden|menteri)|current|sekarang|kini|jumlah|bilangan|statistik|enrollment|berapa\s+ramai)\b/i;

function body(message: string): string {
  return stripLeadingAdamSalutation(message).trim();
}

/** Single-token or bare phrase topic — no live web grounding needed. */
export function isAdamSingleTokenConceptTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isExplicitFreshnessRequest(t)) return false;
  if (isVerifiedDataStatAsk(t)) return false;
  if (isAdamCurrentAffairsTurn(t)) return false;
  if (LIVE_DATA_ASK.test(t)) return false;
  if (/[?!]/.test(t)) return false;
  if (SHORT_STABLE_PHRASE.test(t)) return true;

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 3) return false;

  if (words.length === 1) {
    if (SINGLE_TOKEN_STABLE.test(words[0]!)) return true;
    if (isAdamPedagogyKonvensionalTurn(t)) return true;
    if (isAdamMathematicsTurn(t)) return true;
    if (isAdamGeographyTurn(t)) return true;
  }

  if (words.length <= 2 && /^(?:laut\s+mati|dead\s+sea)$/i.test(t)) return true;

  return false;
}

/** Stable curriculum / pedagogy — brain-first, no DashScope prefetch. */
export function isAdamStableCurriculumSearchSkipTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isExplicitFreshnessRequest(t)) return false;
  if (isVerifiedDataStatAsk(t)) return false;
  if (isAdamCurrentAffairsTurn(t)) return false;
  if (LIVE_DATA_ASK.test(t)) return false;
  if (isAdamSingleTokenConceptTurn(t)) return true;
  if (isAdamPedagogyKonvensionalTurn(t)) return true;
  if (isAdamTeachingDepthTurn(t)) return true;
  return false;
}
