/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Section Display
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
 */

/** Journal title from markdown `# heading` anywhere in section text. */
export function extractJournalMarkdownTitle(text: string): string | null {
  const match = text.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

/** Remove transparency / meta lines — not part of the reviewable manuscript. */
export function stripJournalTransparencyPreamble(text: string): string {
  return text
    .replace(/^From this session's teaching[^\n]*\n+/im, '')
    .replace(/^Berdasarkan pengajaran sesi ini[^\n]*\n+/im, '')
    .replace(/^Writing now\.{0,3}\s*\n+/im, '')
    .replace(/^Menulis sekarang\.{0,3}\s*\n+/im, '')
    .replace(/^Bismillahirahmanirrahim\.?\s*\n+/im, '')
    .trim();
}

/** Normalize Movement 1 (title + abstract) for Founder review in chat. */
export function formatTitleAbstractSectionForDisplay(raw: string): {
  journalTitle: string | null;
  sectionBody:  string;
} {
  let text = stripJournalTransparencyPreamble(raw);
  const journalTitle = extractJournalMarkdownTitle(text);
  if (journalTitle) {
    text = text.replace(/^#\s+.+\n+/m, '').trim();
  }

  const hasAbstractHeading =
    /^##\s+Abstract\b/im.test(text)
    || /^##\s+Abstrak\b/im.test(text)
    || /^Abstract\s*$/im.test(text.split('\n')[0] ?? '')
    || /^Abstrak\s*$/im.test(text.split('\n')[0] ?? '');

  if (!hasAbstractHeading && text) {
    text = `## Abstrak\n\n${text}`;
  } else if (/^Abstract\s*$/im.test(text.split('\n')[0] ?? '')) {
    text = text.replace(/^Abstract\s*\n+/im, '## Abstract\n\n');
  } else if (/^Abstrak\s*$/im.test(text.split('\n')[0] ?? '')) {
    text = text.replace(/^Abstrak\s*\n+/im, '## Abstrak\n\n');
  }

  return { journalTitle, sectionBody: text.trim() };
}
