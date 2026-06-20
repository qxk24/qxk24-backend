/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Pedagogy Voice Guard
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
 */

import { isAdamPedagogyKonvensionalTurn } from './adam-domain-detectors';
import { isAdamLightChatTurn, stripLeadingAdamSalutation } from './adam-response-generation';

const KBAT_WRONG_ACRONYM =
  /\bKepimpinan\s+Berfikir\s+Aras\s+Tinggi\b/gi;

const KBAT_CORRECT =
  'Kemahiran Berfikir Aras Tinggi';

/** KBAT expansion must be Kemahiran — not Kepimpinan (V-A01). */
export function repairKbatAcronymExpansion(text: string, userMessage: string): string {
  const t = stripLeadingAdamSalutation(userMessage).trim();
  if (!t || isAdamLightChatTurn(t)) return text;
  if (!isAdamPedagogyKonvensionalTurn(t) && !/\bKBAT\b/i.test(t)) return text;
  if (!KBAT_WRONG_ACRONYM.test(text) && !/\bKepimpinan\s+Berfikir\b/i.test(text)) return text;
  return text.replace(KBAT_WRONG_ACRONYM, KBAT_CORRECT);
}
