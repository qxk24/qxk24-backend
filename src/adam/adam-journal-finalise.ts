/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Journal Finalise (Legal Seal)
 * Platform : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Converts a section DRAFT (or existing manuscript) into a sealed
 * PENDING_REVIEW legal document with assigned journalNumber + copyright.
 */

import { ADAMJournalModel } from './adam.schema';
import type { AlamtologiAcademicJournal, JournalContent } from './adam.types';
import { normalizeJournalContent } from './adam-principle-normalize';
import {
  countJournalWords,
  JOURNAL_TARGET_WORD_MIN,
  meetsJournalLengthMinimum,
} from './adam-journal.constants';
import { assembleManuscriptFromSections } from './adam-journal-section-writer';
import {
  draftSectionsToJournalContent,
  sectionsFromJournalMongoDoc,
} from './adam-journal-section-map';
import { allJournalSectionsComplete } from './adam-journal-section.types';
import { findUniversityTopicById } from './adam-university-knowledge';
import { inferJournalSourceLanguage } from './journal-locale';
import { runADAMAudit } from './adam-audit.service';
import { getJournal } from './adam-journal.service';

export interface FinaliseJournalInput {
  journalNumber: string;
  topicId:       string;
  source:        'public_submit' | 'founder_adam' | 'founder_teaching';
  status:        'PENDING_REVIEW';
  copyright:     string;
  /** Optional — target a specific draft by Mongo id */
  journalId?:    string;
  sessionId?:    string;
}

export interface FinaliseJournalResult {
  journal:    AlamtologiAcademicJournal;
  totalWords: number;
  idempotent: boolean;
}

function manuscriptFromDoc(doc: {
  draftSections?: unknown;
  content?: JournalContent;
}): string {
  const sections = sectionsFromJournalMongoDoc(doc);
  if (Object.keys(sections).length > 0) {
    return assembleManuscriptFromSections(sections);
  }
  const c = doc.content;
  if (!c) return '';
  return [
    c.introduction,
    c.background,
    c.methodology,
    c.findings,
    c.discussion,
    c.conclusion,
    ...(c.references ?? []),
  ].filter(Boolean).join('\n\n');
}

/**
 * Seal a section draft as a legal PENDING_REVIEW document.
 * Assigns journalNumber at seal time (preserved through publish).
 */
export async function finaliseJournal(
  input: FinaliseJournalInput,
): Promise<FinaliseJournalResult> {
  const topicId = input.topicId.trim();
  const journalNumber = input.journalNumber.trim();

  const numberTaken = await ADAMJournalModel.findOne({
    journalNumber,
    knowledgeTopicId: { $ne: topicId },
  }).lean();
  if (numberTaken) {
    throw new Error(
      `journalNumber ${journalNumber} is already assigned to topic ${numberTaken.knowledgeTopicId}.`,
    );
  }

  const existingSealed = await ADAMJournalModel.findOne({
    journalNumber,
    knowledgeTopicId: topicId,
    status:           input.status,
  }).lean();

  if (existingSealed) {
    const journal = await getJournal(String(existingSealed._id));
    if (!journal) throw new Error('Sealed journal exists but could not be loaded.');
    return {
      journal,
      totalWords: existingSealed.totalWords ?? countJournalWords(manuscriptFromDoc(existingSealed)),
      idempotent: true,
    };
  }

  let doc = input.journalId
    ? await ADAMJournalModel.findById(input.journalId)
    : null;

  if (!doc) {
    doc = await ADAMJournalModel.findOne({
      knowledgeTopicId: topicId,
      status:           { $in: ['DRAFT', 'PENDING_REVIEW'] },
    }).sort({ updatedAt: -1 });
  }

  if (!doc) {
    throw new Error(
      `No DRAFT or PENDING_REVIEW journal found for topicId "${topicId}". ` +
      'Complete section writing first, or pass journalId.',
    );
  }

  const sections = sectionsFromJournalMongoDoc(doc);
  const hasSections = Object.keys(sections).length > 0;
  const manuscript = manuscriptFromDoc(doc);
  const totalWords = countJournalWords(manuscript);

  if (hasSections && !allJournalSectionsComplete(sections)) {
    throw new Error(
      'Section draft incomplete — all eight sections must be written before final seal.',
    );
  }

  if (!meetsJournalLengthMinimum(manuscript)) {
    throw new Error(
      `Manuscript too short (${totalWords.toLocaleString()} words). ` +
      `Minimum ${JOURNAL_TARGET_WORD_MIN.toLocaleString()} words required.`,
    );
  }

  const topic = findUniversityTopicById(topicId);
  if (!topic) {
    throw new Error(`Unknown topicId "${topicId}" — not on the 664 knowledge map.`);
  }

  const content = hasSections
    ? draftSectionsToJournalContent(sections)
    : normalizeJournalContent(doc.content ?? {});

  const sessionId = input.sessionId?.trim() || doc.sourceSessionId || doc.sessionId;

  doc.title = doc.title?.trim() || `Alamtologi — ${topic.label}`;
  doc.abstract = doc.abstract?.trim() || manuscript.slice(0, 500).trim();
  doc.content = content;
  doc.status = input.status;
  doc.source = input.source;
  doc.journalNumber = journalNumber;
  doc.copyright = input.copyright;
  doc.totalWords = totalWords;
  doc.knowledgeTopicId = topicId;
  doc.topicId = topicId;
  doc.knowledgeMajor = doc.knowledgeMajor ?? topic.majorName;
  doc.knowledgeDiscipline = doc.knowledgeDiscipline ?? topic.disciplineName;
  doc.knowledgeSubfield = doc.knowledgeSubfield ?? topic.subfield;
  doc.sourceSessionId = sessionId;
  doc.sessionId = sessionId;
  doc.sourceLanguage = inferJournalSourceLanguage(manuscript);
  doc.submittedAt = doc.submittedAt ?? new Date();
  doc.reviewNotes =
    doc.reviewNotes?.trim()
    || `Constitutional seal — ${journalNumber}. Awaiting P.alt approval (Lulus).`;
  doc.draftSections = undefined;
  doc.lastCompletedSection = undefined;

  await doc.save();

  const journal = await getJournal(String(doc._id));
  if (!journal) throw new Error('Journal sealed but could not be loaded.');

  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'SUBMISSION',
      context:     `Legal seal ${journalNumber}. Topic: ${topic.label}. Words: ${totalWords}. Source: ${input.source}.`,
    });
  } catch (err: unknown) {
    console.error('[Journal] Finalise audit failed:', err);
  }

  return { journal, totalWords, idempotent: false };
}
