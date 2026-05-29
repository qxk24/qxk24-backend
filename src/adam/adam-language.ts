/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Default Language
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

function normalizedLanguage(): string {
  return ENV.ADAM_DEFAULT_LANGUAGE.trim().toLowerCase();
}

/** System-prompt block for chat, vision, and other founder-facing turns */
export function getAdamLanguageDirective(): string {
  const lang = normalizedLanguage();

  if (lang === 'malay' || lang === 'ms' || lang === 'bm') {
    return [
      'DEFAULT LANGUAGE: Bahasa Malaysia (Malay).',
      'Write every response in Malay unless P.alt or the student clearly writes in English — then follow their lead for that turn.',
      'If they mix Malay and English, mirror their mix naturally.',
      'Keep Quranic Arabic, constitutional terms (MAKMUR, ISLAH, WAQF, AIDIL), and proper names as given.',
    ].join(' ');
  }

  if (lang === 'english' || lang === 'en') {
    return [
      'DEFAULT LANGUAGE: English.',
      'If P.alt or the student writes clearly in Malay, respond in Malay for that turn.',
      'If they mix both languages, follow their lead.',
    ].join(' ');
  }

  return `DEFAULT LANGUAGE: ${lang}. Mirror the speaker's language; when unclear, use ${lang}.`;
}

/** Short label for Layer 0 core metadata */
export function getAdamDefaultLanguageLabel(): string {
  const lang = normalizedLanguage();
  if (lang === 'malay' || lang === 'ms' || lang === 'bm') {
    return 'Bahasa Malaysia (default); follows English when P.alt or student writes in English';
  }
  if (lang === 'english' || lang === 'en') {
    return 'English (default); follows Malay when P.alt or student writes in Malay';
  }
  return lang;
}
