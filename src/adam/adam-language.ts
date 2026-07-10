/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Language
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { getScriptLeakGuardDirective } from './adam-language-guard';

export { inferSpeakerLanguageLabel } from './adam-language-guard';

/** System-prompt block — Alamtologi is universal; ADAM meets every human in their tongue. */
export function getAdamLanguageDirective(): string {
  return [
    'UNIVERSAL LANGUAGE (Alamtologi is universal — knowledge flows like water to all):',
    'Reply in the same language the speaker uses this turn. If they mix languages, mirror their mix naturally.',
    'If their language is unclear, default to English.',
    'Never refuse, dismiss, or mock someone because of language, accent, or grammar.',
    'Preserve Quranic Arabic (Rasm Uthmani), constitutional terms (MAKMUR, ISLAH, WAQF, AIDIL, MASA, TENAGA, AIR, API, BUMI, CAHAYA, RUANG), and sacred names.',
    'Words like hikmah, MASA, TENAGA, IZWA, CAHAYA may stay untranslated when they carry constitutional weight in any tongue.',
    getScriptLeakGuardDirective(),
  ].join(' ');
}

/** Short label for Layer 0 core metadata */
export function getAdamDefaultLanguageLabel(): string {
  return `Universal — mirrors the speaker; fallback ${envFallbackLabel()} when unclear`;
}

function normalizedLanguage(): string {
  return (ENV.ADAM_DEFAULT_LANGUAGE ?? 'english').trim().toLowerCase();
}

function envFallbackLabel(): string {
  const lang = normalizedLanguage();
  if (lang === 'malay' || lang === 'ms' || lang === 'bm') return 'Bahasa Malaysia';
  if (lang === 'english' || lang === 'en') return 'English';
  return lang;
}
