/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Section Draft Store
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ADAMJournalModel } from './adam.schema';
import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import { demoteProseLatexFormulas, prepareContentForStorage } from './adam-journal-formula';
import { countJournalWords } from './adam-journal.constants';
import { JOURNAL_DRAFT_LOCALE } from './adam-journal-language.config';
import { assembleManuscriptFromSections } from './adam-journal-section-writer';
import { sectionsFromJournalMongoDoc } from './adam-journal-section-map';
import type { JournalSectionDraft, JournalSectionId } from './adam-journal-section.types';
import { FOUNDER_USER_ID } from './adam-student.types';

export type { JournalSectionDraft } from './adam-journal-section.types';

const FOUNDER_JOURNAL_EMAIL = `${FOUNDER_USER_ID}@alamtologi.com`;

const EMPTY_CONTENT = {
  introduction:       '',
  background:         '',
  methodology:        '',
  alamtologiAnalysis: [],
  findings:           '',
  discussion:         '',
  conclusion:         '',
  references:         [] as string[],
};

function draftSectionsFromDoc(
  raw: unknown,
): Partial<Record<JournalSectionId, string>> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Partial<Record<JournalSectionId, string>> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof val === 'string') out[key as JournalSectionId] = val;
  }
  return out;
}

/** Load in-progress section draft for this teaching session + topic. */
export async function loadJournalSectionDraft(
  sessionId: string,
  topicId: string,
): Promise<JournalSectionDraft | null> {
  const doc = await ADAMJournalModel.findOne({
    sourceSessionId:  sessionId,
    knowledgeTopicId: topicId,
    status:           'DRAFT',
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!doc) return null;

  return {
    journalId: String(doc._id),
    sections:  draftSectionsFromDoc(doc.draftSections),
    lastSection: doc.lastCompletedSection as JournalSectionId | undefined,
  };
}

export async function loadLatestJournalSectionDraftForTopic(
  topicId: string,
): Promise<JournalSectionDraft | null> {
  const doc = await ADAMJournalModel.findOne({
    knowledgeTopicId: topicId,
    status:           'DRAFT',
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!doc) return null;

  return {
    journalId: String(doc._id),
    sections:  draftSectionsFromDoc(doc.draftSections),
    lastSection: doc.lastCompletedSection as JournalSectionId | undefined,
  };
}

/** Latest in-session DRAFT — for append/edit when topicId is not in the current message. */
export async function loadLatestJournalSectionDraftForSession(
  sessionId: string,
): Promise<(JournalSectionDraft & { topicId: string }) | null> {
  const doc = await ADAMJournalModel.findOne({
    sourceSessionId: sessionId,
    status:            'DRAFT',
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!doc) return null;

  const topicId = String(doc.knowledgeTopicId ?? doc.topicId ?? '').trim();
  if (!topicId) return null;

  return {
    journalId:   String(doc._id),
    sections:    draftSectionsFromDoc(doc.draftSections),
    lastSection: doc.lastCompletedSection as JournalSectionId | undefined,
    topicId,
  };
}

export async function saveJournalSectionProgress(input: {
  sessionId:      string;
  topic:          UniversityKnowledgeTopic;
  sections:       Partial<Record<JournalSectionId, string>>;
  lastSection:    JournalSectionId;
  journalDraftId?: string;
}): Promise<JournalSectionDraft> {
  /** Never drop sibling movements — merge with whatever is already in MongoDB. */
  let mergedSections: Partial<Record<JournalSectionId, string>> = { ...input.sections };
  let prev: { _id?: { toString(): string }; draftSections?: unknown; sections?: unknown } | null = null;
  if (input.journalDraftId) {
    prev = await ADAMJournalModel.findById(input.journalDraftId).lean();
  }
  if (!prev) {
    prev = await ADAMJournalModel.findOne({
      sourceSessionId:  input.sessionId,
      knowledgeTopicId: input.topic.topicId,
      status:           'DRAFT',
    }).lean();
  }
  if (!prev) {
    const sessionDraft = await loadLatestJournalSectionDraftForSession(input.sessionId);
    if (sessionDraft?.topicId === input.topic.topicId) {
      prev = await ADAMJournalModel.findById(sessionDraft.journalId).lean();
    }
  }
  if (prev) {
    mergedSections = {
      ...sectionsFromJournalMongoDoc(prev),
      ...input.sections,
    };
  }

  const storedSections: Record<string, string> = {};
  for (const [key, val] of Object.entries(mergedSections)) {
    if (typeof val === 'string' && val.trim()) {
      storedSections[key] = prepareContentForStorage(demoteProseLatexFormulas(val.trim()));
    }
  }

  const titleFromSection =
    storedSections.title_and_abstract?.match(/^#\s+(.+)$/m)?.[1]?.trim()
    ?? `Draft — ${input.topic.label}`;

  const abstractFromSection =
    storedSections.title_and_abstract?.match(
      /(?:^|\n)(?:Abstract|Abstrak)[:\s]*\n?([\s\S]{40,1200}?)(?:\n#{1,3}\s|\n##\s|$)/i,
    )?.[1]?.trim()
    ?? 'Section draft in progress — Alamtologi constitutional manuscript.';

  const metaPayload = {
    title:              titleFromSection.slice(0, 300),
    abstract:           abstractFromSection.slice(0, 3000),
    category:           'RESEARCH' as const,
    principlesFocus:    [input.topic.alamtologiLens],
    authorName:         'Masa Bayu',
    authorEmail:        FOUNDER_JOURNAL_EMAIL,
    authorOrg:          'Alamtologi · Alamtologi',
    content:            EMPTY_CONTENT,
    status:             'DRAFT' as const,
    source:             'founder_teaching' as const,
    sourceSessionId:    input.sessionId,
    sessionId:          input.sessionId,
    topicId:            input.topic.topicId,
    knowledgeTopicId:   input.topic.topicId,
    knowledgeMajor:     input.topic.majorName,
    knowledgeDiscipline: input.topic.disciplineName,
    knowledgeSubfield:  input.topic.subfield,
    lastCompletedSection: input.lastSection,
    totalWords:         countJournalWords(assembleManuscriptFromSections(mergedSections)),
    sourceLanguage:     JOURNAL_DRAFT_LOCALE,
    reviewNotes:        `Section draft — last: ${input.lastSection}`,
  };

  /** Dot-notation $set — never replace the whole draftSections object (preserves sibling movements). */
  const sectionDotSet: Record<string, string> = {};
  for (const [key, val] of Object.entries(input.sections)) {
    if (typeof val === 'string' && val.trim()) {
      sectionDotSet[`draftSections.${key}`] = storedSections[key]!;
    }
  }

  let doc;
  const existingId = input.journalDraftId ?? prev?._id?.toString();
  if (existingId) {
    doc = await ADAMJournalModel.findByIdAndUpdate(
      existingId,
      { $set: { ...metaPayload, ...sectionDotSet } },
      { new: true },
    );
  } else {
    doc = await ADAMJournalModel.findOneAndUpdate(
      {
        sourceSessionId:  input.sessionId,
        knowledgeTopicId: input.topic.topicId,
        status:           'DRAFT',
      },
      {
        $set: {
          ...metaPayload,
          ...sectionDotSet,
        },
        $setOnInsert: {
          draftSections: storedSections,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  if (!doc) throw new Error('Failed to save journal section draft');

  console.log(
    '[journal:draft-save]',
    JSON.stringify({
      collection: 'adam_journals',
      id:         String(doc._id),
      sessionId:  input.sessionId,
      topicId:    input.topic.topicId,
      lastSection: input.lastSection,
      totalWords: metaPayload.totalWords,
      status:     'DRAFT',
    }),
  );

  return {
    journalId: String(doc._id),
    sections:  sectionsFromJournalMongoDoc(doc),
    lastSection: input.lastSection,
  };
}
