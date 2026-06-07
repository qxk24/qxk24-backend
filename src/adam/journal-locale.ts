/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Journal Locale
 * Platform : Backend (TypeScript)
 * ALAMTOLOGI : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export const JOURNAL_LOCALES = ['en', 'ms', 'ar', 'id', 'zh'] as const;
export type JournalLocale = (typeof JOURNAL_LOCALES)[number];

export const DEFAULT_JOURNAL_LOCALE: JournalLocale = 'en';

export const JOURNAL_LOCALE_LABELS: Record<JournalLocale, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  ar: 'العربية',
  id: 'Bahasa Indonesia',
  zh: '中文',
};

export function parseJournalLocale(raw: string | undefined | null): JournalLocale | null {
  const code = raw?.trim().toLowerCase();
  if (!code) return null;
  return (JOURNAL_LOCALES as readonly string[]).includes(code)
    ? (code as JournalLocale)
    : null;
}

export function resolveJournalLocale(raw: string | undefined | null): JournalLocale {
  return parseJournalLocale(raw) ?? DEFAULT_JOURNAL_LOCALE;
}

/** Best-effort source language from manuscript text. */
export function inferJournalSourceLanguage(text: string): JournalLocale {
  const sample = text.slice(0, 12_000);
  if (/[\u0600-\u06FF]{12,}/.test(sample)) return 'ar';
  if (/[\u4e00-\u9fff]{6,}/.test(sample)) return 'zh';
  if (/\b(yang|adalah|dalam|dengan|merupakan|kajian|jurnal|perkataan|pengetahuan)\b/i.test(sample)) {
    return 'ms';
  }
  if (/\b(penelitian|adalah|dalam|dengan|merupakan|jurnal)\b/i.test(sample)) return 'id';
  return 'en';
}
