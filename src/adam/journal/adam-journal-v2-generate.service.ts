/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal V2 Generate Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { findUniversityTopicById } from '../adam-university-knowledge';
import { FOUNDER_USER_ID } from '../adam-student.types';
import { countJournalWords } from '../adam-journal.constants';
import {
  generateJournalSection,
  loadDailyEpisodes,
} from '../../qxk24brain/deep-ul';
import {
  JournalV2Model,
  JOURNAL_SECTION_KEYS,
  type JournalSectionKey,
} from './adam-journal-v2.schema';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export interface GenerateSectionResult {
  sectionKey: JournalSectionKey;
  content:    string;
  wordCount:  number;
}

export async function generateJournalV2Section(
  journalNumber: string,
  sectionKey: JournalSectionKey,
): Promise<GenerateSectionResult> {
  const journal = await JournalV2Model.findOne({ journalNumber }).lean();
  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  if (journal.status === 'PENDING_REVIEW' || journal.status === 'PUBLISHED') {
    throw new Error(`Cannot generate — journal is sealed (status: ${journal.status}).`);
  }

  const topic = findUniversityTopicById(journal.topicId);
  if (!topic) throw new Error(`Topic not found for topicId: ${journal.topicId}`);

  const episodes = await loadDailyEpisodes(FOUNDER_USER_ID);
  const content = generateJournalSection(
    sectionKey,
    episodes,
    topic.label,
    journal.title ?? '',
  ).trim();

  if (!content) throw new Error(`ADAM returned empty content for section "${sectionKey}".`);

  return {
    sectionKey,
    content,
    wordCount: countJournalWords(content),
  };
}

export async function generateAllJournalV2Sections(
  journalNumber: string,
  options?: { skipApproved?: boolean },
): Promise<{ sections: GenerateSectionResult[]; totalWords: number }> {
  const journal = await JournalV2Model.findOne({ journalNumber }).lean();
  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  const skipApproved = options?.skipApproved !== false;
  const approved = new Set(journal.approvedSections ?? []);
  const results: GenerateSectionResult[] = [];

  for (const sectionKey of JOURNAL_SECTION_KEYS) {
    if (skipApproved && approved.has(sectionKey)) continue;
    const existing = (journal.sections as Partial<Record<JournalSectionKey, string>>)?.[sectionKey]?.trim() ?? '';
    if (skipApproved && existing.length >= 80) continue;

    const result = await generateJournalV2Section(journalNumber, sectionKey);
    results.push(result);

    await JournalV2Model.updateOne(
      { journalNumber },
      {
        $set: {
          [`sections.${sectionKey}`]: result.content,
          status:                   'IN_PROGRESS',
          updatedAt:                new Date(),
        },
      },
    );
  }

  const updated = await JournalV2Model.findOne({ journalNumber }, { sections: 1 }).lean();
  const merged = (updated?.sections ?? {}) as Partial<Record<JournalSectionKey, string>>;
  const totalWords = JOURNAL_SECTION_KEYS.reduce(
    (sum, k) => sum + countWords(merged[k] ?? ''),
    0,
  );

  await JournalV2Model.updateOne({ journalNumber }, { $set: { totalWords } });

  return { sections: results, totalWords };
}
