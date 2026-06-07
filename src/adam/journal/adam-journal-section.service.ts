/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Section Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Save and approve for each of the 9 V2 movement sections.
 */

import {
  JournalV2Model,
  JournalSectionKey,
  SECTION_MIN_WORDS,
  JOURNAL_SECTION_KEYS,
  JOURNAL_V2_SECTION_COUNT,
} from './adam-journal-v2.schema';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function recalculateTotalWords(
  existing: Partial<Record<JournalSectionKey, string>>,
  updatedKey: JournalSectionKey,
  updatedContent: string,
): number {
  const merged = { ...existing, [updatedKey]: updatedContent };
  return JOURNAL_SECTION_KEYS.reduce(
    (sum, k) => sum + countWords(merged[k] ?? ''),
    0,
  );
}

export async function saveJournalSection(
  journalNumber: string,
  sectionKey:    JournalSectionKey,
  content:       string,
): Promise<{ totalWords: number }> {
  const words = countWords(content);
  const min   = SECTION_MIN_WORDS[sectionKey];

  if (words < min) {
    throw new Error(
      `Section "${sectionKey}" has ${words} words — minimum is ${min}.`,
    );
  }

  const journal = await JournalV2Model.findOne({ journalNumber }).lean();
  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  const totalWords = recalculateTotalWords(
    journal.sections ?? {},
    sectionKey,
    content,
  );

  await JournalV2Model.updateOne(
    { journalNumber },
    {
      $set: {
        [`sections.${sectionKey}`]: content,
        totalWords,
        status:    'IN_PROGRESS',
        updatedAt: new Date(),
      },
    },
  );

  console.log(
    `[journal:section] Saved "${sectionKey}" on ${journalNumber} — ` +
    `sectionWords: ${words}, totalWords: ${totalWords}`,
  );
  return { totalWords };
}

export async function approveJournalSection(
  journalNumber: string,
  sectionKey:    JournalSectionKey,
): Promise<{ approvedSections: string[] }> {
  const journal = await JournalV2Model.findOne(
    { journalNumber },
    { sections: 1, approvedSections: 1 },
  ).lean();

  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  const content = (journal.sections as Partial<Record<JournalSectionKey, string>>)?.[sectionKey] ?? '';
  if (!content.trim()) {
    throw new Error(
      `Cannot approve "${sectionKey}" — section has no saved content.`,
    );
  }

  const updated = await JournalV2Model.findOneAndUpdate(
    { journalNumber },
    {
      $addToSet: { approvedSections: sectionKey },
      $set:      { updatedAt: new Date() },
    },
    { new: true, select: 'approvedSections' },
  ).lean() as { approvedSections: string[] } | null;

  if (!updated) throw new Error(`Journal not found: ${journalNumber}`);

  console.log(
    `[journal:section] Approved "${sectionKey}" on ${journalNumber} — ` +
    `${updated.approvedSections.length}/${JOURNAL_V2_SECTION_COUNT} sections approved`,
  );
  return { approvedSections: updated.approvedSections };
}
