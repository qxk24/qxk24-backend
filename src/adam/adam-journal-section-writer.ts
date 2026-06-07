/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Section Writer
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
 * Section-by-section journal generation — avoids single-stream token cutoff.
 */

import type { LlmMessage } from '../llm/llm-types';
import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import { ADAM_JOURNAL_FORMULA_LAW, ADAM_JOURNAL_ALAMTOLOGI_SCIENTIFIC_FORMULA_LAW, ADAM_JOURNAL_QURAN_SECTION_LAW } from './adam-journal-formula';
import { ADAM_JOURNAL_THREE_LAYER_SOURCES } from './adam-journal-manual-prompt';
import {
  countJournalWords,
  JOURNAL_MIN_REFERENCES,
  JOURNAL_TARGET_WORD_MIN,
  meetsJournalLengthMinimum,
} from './adam-journal.constants';
import {
  loadJournalSectionDraft,
  saveJournalSectionProgress,
} from './adam-journal-section-draft';
import {
  allJournalSectionsComplete,
  JOURNAL_SECTION_HEADINGS,
  JOURNAL_SECTION_ORDER,
  type JournalSectionDraft,
  type JournalSectionId,
} from './adam-journal-section.types';

export { JOURNAL_SECTION_ORDER, type JournalSectionId } from './adam-journal-section.types';

export type SectionStreamFn = (
  messages: LlmMessage[],
  withSearch: boolean,
) => Promise<string>;

export interface GenerateJournalBySectionsParams {
  topic:           UniversityKnowledgeTopic;
  sessionId:       string;
  systemPrompt:    string;
  baseMessages:    LlmMessage[];
  streamSection:   SectionStreamFn;
  onSectionStart?: (section: JournalSectionId, index: number, total: number) => void;
  onSectionDone?:  (section: JournalSectionId, stats: {
    sectionWords:     number;
    accumulatedWords: number;
    chars:            number;
  }) => void;
  reviewPath?:     string;
}

function priorManuscriptText(sections: Partial<Record<JournalSectionId, string>>): string {
  return JOURNAL_SECTION_ORDER
    .map((id) => sections[id]?.trim())
    .filter(Boolean)
    .join('\n\n');
}

/** Per-section preview block for continuity without repeating full text. */
export function buildCompletedSectionsSummary(
  sections: Partial<Record<JournalSectionId, string>>,
): string {
  return JOURNAL_SECTION_ORDER
    .filter((id) => (sections[id]?.trim().length ?? 0) > 0)
    .map((id) => {
      const content = sections[id]!.trim();
      const words = countJournalWords(content);
      const preview = content.length > 200 ? `${content.slice(0, 200)}...` : content;
      return `[${id.toUpperCase()} — ${words} words]: ${preview}`;
    })
    .join('\n\n');
}

function buildSectionPrompt(
  section: JournalSectionId,
  topic: UniversityKnowledgeTopic,
  completedSections: Partial<Record<JournalSectionId, string>>,
  reviewPath: string,
): string {
  const heading = JOURNAL_SECTION_HEADINGS[section];
  const prior = priorManuscriptText(completedSections);
  const summary = buildCompletedSectionsSummary(completedSections);
  const priorBlock = prior
    ? `\n\nCOMPLETED SECTIONS (continuity — do not repeat):\n${summary}\n\nFULL MANUSCRIPT SO FAR (voice and topic reference):\n${prior.slice(-12_000)}`
    : '';

  const shared = `
Write ONLY this journal section: **${heading}**
Topic (locked): ${topic.label} — topicId "${topic.topicId}"
Third-person academic voice — scholar + poet + messenger.
${ADAM_JOURNAL_THREE_LAYER_SOURCES}
${ADAM_JOURNAL_FORMULA_LAW}
Output substantive prose only — no JSON, no <adam_journal_seal>, no meta promises.
${priorBlock}`.trim();

  switch (section) {
    case 'title_and_abstract':
      return `${shared}

Open with exactly one transparency line:
"Berdasarkan pengajaran sesi ini, topik yang paling tepat ialah ${topic.label} — ${topic.topicId}."
Then blank line, then "Menulis sekarang..."
Then: full journal **Title** (markdown # heading) and **Abstract** (250–300 words, four movements).`;

    case 'movement_1_human_opening':
      return `${shared}

Introduction — open with lived human experience before academic framing. Warm, recognising the reader.`;

    case 'movement_2_achievement':
      return `${shared}

Convention Knowledge (Part B1) — respectful, thorough account of what the field has achieved.`;

    case 'movement_3_honest_wall':
      return `${shared}

Convention Knowledge (Part B2) — unsolved issue as real loss for humanity; honest limits of convention.`;

    case 'movement_4_quran':
      return `${shared}

Quran Section (Q) — dedicated ayat for this topic only. Arabic rasm + translation + thematic link to the locked subfield.
${ADAM_JOURNAL_QURAN_SECTION_LAW}`;

    case 'movement_5_alamtologi':
      return `${shared}

Alamtologi Framework (C) — full discipline syllabus and constitutional lens for this topic. No Quran ayat here.
${ADAM_JOURNAL_ALAMTOLOGI_SCIENTIFIC_FORMULA_LAW}`;

    case 'movement_6_application':
      return `${shared}

Application (D) — reader at a threshold; technology real; door now open.`;

    case 'movement_7_invitation':
      return `${shared}

Conclusion — honour the journey; end with a line that stays after the page closes. No dry summary.`;

    case 'references':
      return `${shared}

References — minimum ${JOURNAL_MIN_REFERENCES} entries, APA 7th edition. Numbered list only for this section.
When complete, state briefly that the full manuscript is ready for review at ${reviewPath}.`;

    default:
      return shared;
  }
}

export function assembleManuscriptFromSections(
  sections: Partial<Record<JournalSectionId, string>>,
): string {
  return JOURNAL_SECTION_ORDER
    .map((id) => {
      const body = sections[id]?.trim();
      if (!body) return '';
      return `## ${JOURNAL_SECTION_HEADINGS[id]}\n\n${body}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function nextSectionToWrite(
  draft: JournalSectionDraft | null,
): JournalSectionId | null {
  if (!draft?.sections) return JOURNAL_SECTION_ORDER[0] ?? null;
  for (const id of JOURNAL_SECTION_ORDER) {
    const text = draft.sections[id]?.trim() ?? '';
    if (text.length < 80) return id;
  }
  return null;
}

export interface SectionJournalResult {
  manuscript:          string;
  totalWords:          number;
  allSectionsComplete: boolean;
  sections:            Partial<Record<JournalSectionId, string>>;
}

/** Generate (or resume) founder journal one section at a time; saves after each. */
export async function generateFounderJournalBySections(
  params: GenerateJournalBySectionsParams,
): Promise<SectionJournalResult> {
  const reviewPath = params.reviewPath?.trim() || '/adam/journals/review';
  let draft = await loadJournalSectionDraft(params.sessionId, params.topic.topicId);
  const sections: Partial<Record<JournalSectionId, string>> = {
    ...(draft?.sections ?? {}),
  };

  const startIdx = draft
    ? JOURNAL_SECTION_ORDER.findIndex((id) => id === nextSectionToWrite(draft))
    : 0;
  const fromIndex = startIdx >= 0 ? startIdx : 0;

  for (let i = fromIndex; i < JOURNAL_SECTION_ORDER.length; i++) {
    const sectionId = JOURNAL_SECTION_ORDER[i]!;
    const existing = sections[sectionId]?.trim() ?? '';
    if (existing.length >= 80) continue;

    params.onSectionStart?.(sectionId, i + 1, JOURNAL_SECTION_ORDER.length);

    const sectionUserPrompt = buildSectionPrompt(
      sectionId,
      params.topic,
      sections,
      reviewPath,
    );

    const sectionContent = await params.streamSection(
      [
        ...params.baseMessages,
        {
          role:    'user',
          content: sectionUserPrompt,
        },
      ],
      false,
    );

    sections[sectionId] = sectionContent.trim();
    const sectionWords = countJournalWords(sectionContent);
    const accumulatedWords = countJournalWords(assembleManuscriptFromSections(sections));
    draft = await saveJournalSectionProgress({
      sessionId:       params.sessionId,
      topic:           params.topic,
      sections,
      lastSection:     sectionId,
      journalDraftId:  draft?.journalId,
    });

    params.onSectionDone?.(sectionId, {
      sectionWords,
      accumulatedWords,
      chars: sectionContent.length,
    });

    console.log(
      '[adam:journal-section]',
      JSON.stringify({
        sessionId:        params.sessionId,
        section:            sectionId,
        sectionWords,
        chars:              sectionContent.length,
        accumulatedWords,
        totalChars:         assembleManuscriptFromSections(sections).length,
        draftId:            draft?.journalId,
      }),
    );
  }

  const manuscript = assembleManuscriptFromSections(sections);
  const totalWords = countJournalWords(manuscript);
  const complete = allJournalSectionsComplete(sections);

  if (complete && !meetsJournalLengthMinimum(manuscript)) {
    console.warn(
      '[adam:journal-section] all sections done but below word minimum',
      JSON.stringify({ totalWords, target: JOURNAL_TARGET_WORD_MIN }),
    );
  }

  return { manuscript, totalWords, allSectionsComplete: complete, sections };
}
