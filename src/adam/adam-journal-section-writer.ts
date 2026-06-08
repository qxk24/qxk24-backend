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
import { sanitizeMalayJournalDashBridges } from './adam-journal-prose-sanitize';
import { formatTitleAbstractSectionForDisplay } from './adam-journal-section-display';
import {
  countJournalWords,
  JOURNAL_MIN_REFERENCES,
  JOURNAL_TARGET_WORD_MIN,
  meetsJournalLengthMinimum,
} from './adam-journal.constants';
import {
  countSectionParagraphs,
  formatSectionParagraphs,
  inferParagraphIndexFromText,
  mergeParagraphIntoSection,
  nextParagraphIndex,
  normalizeSectionParagraphBody,
  parseSectionParagraphs,
  sectionParagraphBlockComplete,
  sectionUsesParagraphStructure,
  stripParagraphMarkerFromProse,
} from './adam-journal-section-paragraphs';
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
  /** Default: all remaining sections. Set 1 for chapter-by-chapter founder review. */
  maxSectionsPerTurn?: number;
  /** When set, rewrite this section even if it already exists (expand/edit). */
  forceSectionId?:    JournalSectionId;
  /** P.alt's expand/edit instruction — appended to the section rewrite prompt. */
  expandInstruction?: string;
  /** Write a single ¶N inside the section (paragraph-by-paragraph flow). */
  forceParagraphIndex?: number;
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

const PARAGRAPH_STRUCTURE_LAW = `
PARAGRAPH STRUCTURE (mandatory for this movement):
- Write exactly ONE paragraph this turn.
- Open with heading line: ### ¶N  (N = paragraph number for this turn)
- Blank line, then one substantive paragraph (Malay prose).
- Do NOT write ¶N+1 or later paragraphs — P.alt will say **teruskan perenggan** for the next.
- Do NOT repeat earlier ¶ already in the draft.`.trim();

function buildSectionPrompt(
  section: JournalSectionId,
  topic: UniversityKnowledgeTopic,
  completedSections: Partial<Record<JournalSectionId, string>>,
  reviewPath: string,
  rewriteNote?: string,
  paragraphIndex?: number,
): string {
  const heading = JOURNAL_SECTION_HEADINGS[section];
  const prior = priorManuscriptText(completedSections);
  const summary = buildCompletedSectionsSummary(completedSections);
  const priorBlock = prior
    ? `\n\nCOMPLETED SECTIONS (continuity — do not repeat):\n${summary}\n\nFULL MANUSCRIPT SO FAR (voice and topic reference):\n${prior.slice(-12_000)}`
    : '';

  const existingSection = completedSections[section]?.trim() ?? '';
  const paraBlock = sectionUsesParagraphStructure(section) && !rewriteNote
    ? `\n\n${PARAGRAPH_STRUCTURE_LAW}\n\nExisting ¶ in this section (do not rewrite):\n${
      existingSection
        ? normalizeSectionParagraphBody(section, existingSection).slice(0, 8_000)
        : '(none yet — start ### ¶1)'
    }\n\nThis turn: write ### ¶${paragraphIndex ?? nextParagraphIndex(existingSection)} only.`
    : '';

  const shared = `
Write ONLY this journal section: **${heading}**
Topic (locked): ${topic.label} — topicId "${topic.topicId}"
Third-person academic voice — scholar + poet + messenger. **Bahasa Melayu Malaysia only** — draf semakan P.alt.
${ADAM_JOURNAL_THREE_LAYER_SOURCES}
${ADAM_JOURNAL_FORMULA_LAW}
Output substantive prose only — no JSON, no <adam_journal_seal>, no meta promises.
${priorBlock}${paraBlock}`.trim();

  let prompt: string;
  switch (section) {
    case 'title_and_abstract':
      prompt = `${shared}

Open with exactly one transparency line (Malay only):
"Berdasarkan pengajaran sesi ini, topik yang paling tepat ialah ${topic.label} — ${topic.topicId}."
Then blank line, then "Menulis sekarang..."
Then output in this exact order (Malay only):
1. Journal Title as a single markdown # heading line (Malay)
2. Blank line
3. ## Abstrak heading (markdown)
4. Abstrak body (250–300 words, four movements, Malay prose)
ABSOLUTE: no em dash (—) anywhere in Abstrak — not before "khususnya", "bahawa", "agar", or between pertama/kedua/ketiga/keempat. Use commas and full Malay clauses only.
When listing the four movements (pertama, kedua, ketiga, keempat): use commas and full clauses only — never em dash (—), en dash (–), or hyphen (-) between list items or before "bahawa"/"iaitu".
No [FORMULA] tags in Title or Abstrak — formulas belong in Movement 5 only.`;
      break;

    case 'movement_1_human_opening':
      prompt = `${shared}

Introduction — open with lived human experience before academic framing. Warm, recognising the reader.`;
      break;

    case 'movement_2_achievement':
      prompt = `${shared}

Convention Knowledge (Part B1) — respectful, thorough account of what the field has achieved.`;
      break;

    case 'movement_3_honest_wall':
      prompt = `${shared}

Convention Knowledge (Part B2) — unsolved issue as real loss for humanity; honest limits of convention.`;
      break;

    case 'movement_4_quran':
      prompt = `${shared}

Quran Section (Q) — dedicated ayat for this topic only. Arabic rasm + translation + thematic link to the locked subfield.
${ADAM_JOURNAL_QURAN_SECTION_LAW}`;
      break;

    case 'movement_5_alamtologi':
      prompt = `${shared}

Alamtologi Framework (C) — full discipline syllabus and constitutional lens for this topic. No Quran ayat here.
${ADAM_JOURNAL_ALAMTOLOGI_SCIENTIFIC_FORMULA_LAW}`;
      break;

    case 'movement_6_application':
      prompt = `${shared}

Application (D) — reader at a threshold; technology real; door now open.`;
      break;

    case 'movement_7_invitation':
      prompt = `${shared}

Conclusion — honour the journey; end with a line that stays after the page closes. No dry summary.`;
      break;

    case 'references':
      prompt = `${shared}

References — minimum ${JOURNAL_MIN_REFERENCES} entries, APA 7th edition. Numbered list only for this section.
When complete, state briefly that the full manuscript is ready for review at ${reviewPath}.`;
      break;

    default:
      prompt = shared;
  }

  return rewriteNote ? `${prompt}\n\n${rewriteNote}` : prompt;
}

function buildSectionRewriteNote(
  sectionId: JournalSectionId,
  previousDraft: string,
  expandInstruction?: string,
): string {
  const heading = JOURNAL_SECTION_HEADINGS[sectionId];
  const prior = previousDraft.trim();
  const priorBlock = prior
    ? `\nPREVIOUS DRAFT (replace entirely — expand and deepen, do not copy verbatim):\n${prior.slice(0, 12_000)}`
    : '';
  const instruction = expandInstruction?.trim()
    ? `\nP.alt's instruction: ${expandInstruction.trim()}`
    : '';
  return (
    `P.alt requested EXPANSION / REWRITE of **${heading}** only.${instruction}` +
    `${priorBlock}\n` +
    `Output substantive Malay prose only. Start with ## ${heading}.`
  );
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

export function nextSectionToWrite(
  draft: JournalSectionDraft | null,
): JournalSectionId | null {
  if (!draft?.sections) return JOURNAL_SECTION_ORDER[0] ?? null;
  for (const id of JOURNAL_SECTION_ORDER) {
    const text = draft.sections[id]?.trim() ?? '';
    if (!text) return id;
    if (sectionUsesParagraphStructure(id) && !sectionParagraphBlockComplete(text)) return id;
    if (text.length < 80) return id;
  }
  return null;
}

export interface SectionJournalResult {
  manuscript:          string;
  totalWords:          number;
  allSectionsComplete: boolean;
  sections:            Partial<Record<JournalSectionId, string>>;
  lastSectionWritten?: JournalSectionId;
  sectionsWrittenThisTurn: number;
}

export function formatSingleSectionDisplay(
  sectionId: JournalSectionId,
  body: string,
): string {
  const cleanedBody = sanitizeMalayJournalDashBridges(body);
  if (sectionId === 'title_and_abstract') {
    const { journalTitle, sectionBody } = formatTitleAbstractSectionForDisplay(cleanedBody);
    const titleBlock = journalTitle ? `# ${journalTitle}\n\n` : '';
    return `${titleBlock}## Title & Abstract\n\n${sectionBody}`;
  }
  return `## ${JOURNAL_SECTION_HEADINGS[sectionId]}\n\n${cleanedBody.trim()}`;
}

export function buildJournalSectionReviewFooter(input: {
  lastSection: JournalSectionId;
  index:       number;
  total:       number;
  complete:    boolean;
}): string {
  if (input.complete) {
    return (
      `\n\n---\n**All ${input.total} sections complete.** ` +
      'Review each chapter above, then say **seal journal** or **meterai jurnal** for founder review.'
    );
  }
  const paraHint = sectionUsesParagraphStructure(input.lastSection)
    ? '**teruskan perenggan** — ¶ seterusnya dalam bahagian ini · '
    : '';
  return (
    `\n\n---\n**${JOURNAL_SECTION_HEADINGS[input.lastSection]}** (${input.index}/${input.total}) — ` +
    'semak bahagian ini dalam accordion.\n' +
    `${paraHint}**continue** — bahagian seterusnya (X/9)\n` +
    (sectionUsesParagraphStructure(input.lastSection)
      ? 'Edit satu ¶: **Simpan perenggan 2 ke … (X/9)** · '
      : 'Edit: **Simpan ke … (X/9)** · ') +
    'Akhir: **seal journal** bila 9/9 lengkap.'
  );
}

/** Full draft for chat accordion — all completed movements with review footer. */
export function assembleManuscriptForChatReview(
  sections: Partial<Record<JournalSectionId, string>>,
  footer?: {
    lastSection: JournalSectionId;
    index:       number;
    total:       number;
    complete:    boolean;
  },
): string {
  const parts = JOURNAL_SECTION_ORDER
    .filter((id) => (sections[id]?.trim().length ?? 0) > 0)
    .map((id) => formatSingleSectionDisplay(id, sections[id]!));
  if (parts.length === 0) return '';
  let out = parts.join('\n\n');
  if (footer) out += buildJournalSectionReviewFooter(footer);
  return out;
}

/** Generate (or resume) founder journal one section at a time; saves after each. */
export async function generateFounderJournalBySections(
  params: GenerateJournalBySectionsParams,
): Promise<SectionJournalResult> {
  const reviewPath = params.reviewPath?.trim() || '/adam/journals/review';
  let draft = await loadJournalSectionDraft(params.sessionId, params.topic.topicId);
  let sections: Partial<Record<JournalSectionId, string>> = {
    ...(draft?.sections ?? {}),
  };

  const startIdx = draft
    ? JOURNAL_SECTION_ORDER.findIndex((id) => id === nextSectionToWrite(draft))
    : 0;
  const forcedId = params.forceSectionId;
  const forcedPara = params.forceParagraphIndex;
  const fromIndex = forcedId
    ? Math.max(0, JOURNAL_SECTION_ORDER.indexOf(forcedId))
    : (startIdx >= 0 ? startIdx : 0);

  const maxPerTurn = Math.max(
    1,
    Math.min(
      params.maxSectionsPerTurn ?? JOURNAL_SECTION_ORDER.length,
      JOURNAL_SECTION_ORDER.length,
    ),
  );
  let sectionsWrittenThisTurn = 0;
  let lastSectionWritten: JournalSectionId | undefined;

  for (let i = fromIndex; i < JOURNAL_SECTION_ORDER.length; i++) {
    const sectionId = JOURNAL_SECTION_ORDER[i]!;
    const existing = sections[sectionId]?.trim() ?? '';
    const isForcedRewrite = forcedId === sectionId && !forcedPara;
    const usesParas = sectionUsesParagraphStructure(sectionId);

    if (forcedId && sectionId !== forcedId) break;

    if (!isForcedRewrite && !forcedPara) {
      if (usesParas) {
        if (sectionParagraphBlockComplete(existing)) continue;
      } else if (existing.length >= 80) {
        continue;
      }
    }

    params.onSectionStart?.(sectionId, i + 1, JOURNAL_SECTION_ORDER.length);

    const rewriteNote = isForcedRewrite
      ? buildSectionRewriteNote(sectionId, existing, params.expandInstruction)
      : undefined;

    const paraIdx = forcedPara
      ?? (usesParas && !isForcedRewrite ? nextParagraphIndex(existing) : undefined);

    const sectionUserPrompt = buildSectionPrompt(
      sectionId,
      params.topic,
      sections,
      reviewPath,
      rewriteNote,
      paraIdx,
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

    let mergedContent = sectionContent.trim();
    if (usesParas && !isForcedRewrite && paraIdx) {
      const prose = stripParagraphMarkerFromProse(mergedContent);
      mergedContent = existing
        ? mergeParagraphIntoSection(existing, paraIdx, prose, 'replace')
        : formatSectionParagraphs(new Map([[paraIdx, prose]]));
      mergedContent = normalizeSectionParagraphBody(sectionId, mergedContent);
    } else if (usesParas) {
      mergedContent = normalizeSectionParagraphBody(sectionId, mergedContent);
    }

    mergedContent = sanitizeMalayJournalDashBridges(mergedContent);
    sections[sectionId] = mergedContent;
    lastSectionWritten = sectionId;
    sectionsWrittenThisTurn += 1;
    const sectionWords = countJournalWords(sectionContent);
    const accumulatedWords = countJournalWords(assembleManuscriptFromSections(sections));
    draft = await saveJournalSectionProgress({
      sessionId:       params.sessionId,
      topic:           params.topic,
      sections,
      lastSection:     sectionId,
      journalDraftId:  draft?.journalId,
    });
    sections = { ...(draft?.sections ?? sections) };

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
        sectionsWrittenThisTurn,
        maxPerTurn,
      }),
    );

    if (sectionsWrittenThisTurn >= maxPerTurn) break;
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

  return {
    manuscript,
    totalWords,
    allSectionsComplete: complete,
    sections,
    lastSectionWritten,
    sectionsWrittenThisTurn,
  };
}
