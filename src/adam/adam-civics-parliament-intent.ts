/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Civics Parliament Intent
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
 * Perkara 44 — komponen Parlimen (YDPA + Dewan Negara + Dewan Rakyat),
 * not cabang kuasa (Eksekutif / Kehakiman).
 */

import {
  isAdamLightChatTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';

const PARLIAMENT_COMPONENTS_ASK =
  /\b(?:komponen|components?|terdiri\s+daripada|består\s+of)\b/i;

const PARLIAMENT_SUBJECT =
  /\b(?:sistem\s+)?parlimen(?:\s+malaysia)?|parliament(?:\s+of\s+malaysia)?|perkara\s+44\b/i;

const THREE_COMPONENTS_ASK =
  /\b(?:tiga|three|3)\s+(?:komponen|components?|bahagian|parts?)\b/i;

const WRONG_FRAME_MARKERS =
  /\b(?:cabang\s+kuasa|separation\s+of\s+powers|badan\s+perundangan\s*,?\s*eksekutif\s*,?\s*kehakiman|legislatif\s*,?\s*eksekutif\s*,?\s*kehakiman|executive\s*,?\s*legislative\s*,?\s*judiciary)\b/i;

const CORRECT_COMPONENT_MARKERS =
  /\b(?:yang\s+di-pertuan\s+agong|ydpa|dewan\s+rakyat|dewan\s+negara)\b/i;

/** User asks for Parlimen components under Art. 44 — not branches of government. */
export function isAdamParliamentComponentsTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (!PARLIAMENT_SUBJECT.test(t)) return false;
  if (THREE_COMPONENTS_ASK.test(t)) return true;
  if (PARLIAMENT_COMPONENTS_ASK.test(t)) return true;
  if (/\b(?:nyatakan|senaraikan|list|name)\b/i.test(t) && PARLIAMENT_SUBJECT.test(t)) return true;
  return false;
}

/** Model answered cabang kuasa instead of Parlimen components. */
export function outputHasWrongParliamentComponentsFrame(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (!WRONG_FRAME_MARKERS.test(t)) return false;
  const correctHits = (t.match(new RegExp(CORRECT_COMPONENT_MARKERS.source, 'gi')) ?? []).length;
  return correctHits < 2;
}

const PARLIAMENT_COMPONENTS_REPAIR = [
  '### Komponen Sistem Parlimen Malaysia (Perkara 44)',
  '',
  'Menurut Perlembagaan Persekutuan, **Parlimen Malaysia** terdiri daripada tiga komponen:',
  '',
  '- **Yang di-Pertuan Agong** — ketua negara berperlembagaan; membuka, meluluskan, dan menggulung sesi Parlimen.',
  '- **Dewan Negara** — 70 ahli (26 dari negeri-negeri + 44 pelantikan YDPA).',
  '- **Dewan Rakyat** — 222 ahli yang dipilih oleh rakyat.',
  '',
  '**Nota:** Cabang kuasa (Eksekutif, Kehakiman) berbeza daripada komponen Parlimen di bawah Perkara 44.',
].join('\n');

/** Replace wrong cabang-kuasa frame with Perkara 44 structure when salvage fails. */
export function repairParliamentComponentsOutput(
  userMessage: string,
  polished: string,
  rawBeforeStrip = '',
): string {
  if (!isAdamParliamentComponentsTurn(userMessage)) return polished;

  const t = polished.trim();
  if (t && !outputHasWrongParliamentComponentsFrame(t)) {
    const hasAllThree = /\byd?pa\b/i.test(t)
      && /\bdewan\s+rakyat\b/i.test(t)
      && /\bdewan\s+negara\b/i.test(t);
    if (hasAllThree) return polished;
  }

  if (outputHasWrongParliamentComponentsFrame(t) || outputHasWrongParliamentComponentsFrame(rawBeforeStrip)) {
    return PARLIAMENT_COMPONENTS_REPAIR;
  }

  if (!t) return PARLIAMENT_COMPONENTS_REPAIR;

  return polished;
}
