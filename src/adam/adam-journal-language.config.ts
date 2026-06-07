/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Language (Draft vs Publish)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Draft (9 movements in chat): Bahasa Melayu — Founder reviews in Malay.
 * Publish (approve / seal to public): English — international manuscript.
 */

import type { JournalLocale } from './journal-locale';

export type JournalManuscriptPhase = 'draft' | 'publish';

/** Language ADAM writes while composing the 9 movements. */
export const JOURNAL_DRAFT_LOCALE: JournalLocale = 'ms';

/** Language stored for public catalogue after approve/publish. */
export const JOURNAL_PUBLISH_LOCALE: JournalLocale = 'en';

export function buildJournalDraftLanguageLock(): string {
  return `
[JOURNAL DRAFT LANGUAGE — OVERRIDES ALL CHAT LANGUAGE RULES]
P.alt reviews the journal in Bahasa Melayu Malaysia before publication.
Write the ENTIRE draft manuscript in Bahasa Melayu — every section, every paragraph, every sentence.
Third-person academic voice — scholar + poet + messenger — in Malay prose.

Allowed outside Malay prose (only these):
- Arabic Quran ayat (Uthmani rasm) in the dedicated Quran section
- Established constitutional terms (MASA, TENAGA, AIR, API, BUMI, CAHAYA, RUANG, Alamtologi, QXK24, Hukum Z)
- Latin/scientific symbols inside [FORMULA] tags

FORBIDDEN in draft manuscript:
- English sentences or paragraphs (except proper nouns, formula tags, APA Latin titles)
- Mixed Malay-English code-switching

Use Malay transparency when opening a section write:
"Berdasarkan pengajaran sesi ini, topik yang paling tepat ialah … — topicId."
Then blank line, then "Menulis sekarang..."

Publication English is generated automatically at approve/publish — do NOT write English in draft movements.
[/JOURNAL DRAFT LANGUAGE]
  `.trim();
}

export function buildJournalPublishLanguageLock(): string {
  return `
[JOURNAL PUBLICATION LANGUAGE — OVERRIDES ALL CHAT LANGUAGE RULES]
Translate this Alamtologi journal into English for international publication.
Write the ENTIRE manuscript in English only — every section, every paragraph, every sentence.
Preserve constitutional terms (MASA, TENAGA, Alamtologi, QXK24), Arabic Quran rasm, and [FORMULA] tags unchanged.
Academic tone: scholar precision + poet sensitivity + messenger humility.
[/JOURNAL PUBLICATION LANGUAGE]
  `.trim();
}

export function journalLanguageLockForPhase(phase: JournalManuscriptPhase): string {
  return phase === 'draft'
    ? buildJournalDraftLanguageLock()
    : buildJournalPublishLanguageLock();
}
