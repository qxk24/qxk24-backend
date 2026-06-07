/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal V2 Section Prompts
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

import type { UniversityKnowledgeTopic } from '../adam-university-knowledge';
import { ADAM_JOURNAL_FORMULA_LAW, ADAM_JOURNAL_ALAMTOLOGI_SCIENTIFIC_FORMULA_LAW, ADAM_JOURNAL_QURAN_SECTION_LAW } from '../adam-journal-formula';
import { ADAM_JOURNAL_THREE_LAYER_SOURCES } from '../adam-journal-manual-prompt';
import {
  countJournalWords,
  JOURNAL_MIN_REFERENCES,
} from '../adam-journal.constants';
import {
  JOURNAL_SECTION_KEYS,
  SECTION_MIN_WORDS,
  type JournalSectionKey,
} from './adam-journal-v2.schema';

export const JOURNAL_V2_SECTION_LABELS: Record<JournalSectionKey, string> = {
  abstract:                         'Abstract',
  movement_1_human_opening:         'Movement 1 — Human Opening',
  movement_2_achievement:           'Movement 2 — Convention Achievement',
  movement_3_honest_wall:           'Movement 3 — The Honest Wall',
  movement_4_quran:                 'Movement 4 — Al-Quran (Topic Ayat)',
  movement_5_alamtologi_framework:  'Movement 5 — Alamtologi Framework',
  movement_6_application:           'Movement 6 — Application',
  movement_7_invitation:            'Movement 7 — Closing Invitation',
  references:                       'References',
};

function priorSectionsSummary(
  sections: Partial<Record<JournalSectionKey, string>>,
): string {
  return JOURNAL_SECTION_KEYS
    .filter((id) => (sections[id]?.trim().length ?? 0) > 0)
    .map((id) => {
      const content = sections[id]!.trim();
      const words = countJournalWords(content);
      const preview = content.length > 200 ? `${content.slice(0, 200)}...` : content;
      return `[${id} — ${words} words]: ${preview}`;
    })
    .join('\n\n');
}

function priorManuscriptTail(
  sections: Partial<Record<JournalSectionKey, string>>,
): string {
  return JOURNAL_SECTION_KEYS
    .map((id) => sections[id]?.trim())
    .filter(Boolean)
    .join('\n\n')
    .slice(-12_000);
}

export function buildV2SectionPrompt(
  sectionKey: JournalSectionKey,
  topic: UniversityKnowledgeTopic,
  sections: Partial<Record<JournalSectionKey, string>>,
  journalTitle: string,
): string {
  const heading = JOURNAL_V2_SECTION_LABELS[sectionKey];
  const minWords = SECTION_MIN_WORDS[sectionKey];
  const summary = priorSectionsSummary(sections);
  const priorTail = priorManuscriptTail(sections);
  const priorBlock = summary
    ? `\n\nCOMPLETED SECTIONS (continuity — do not repeat):\n${summary}\n\nFULL MANUSCRIPT SO FAR (voice and topic reference):\n${priorTail}`
    : '';

  const titleLine = journalTitle.trim()
    ? `Journal title (locked): ${journalTitle.trim()}`
    : 'Title not yet set — do not invent a title in this section unless writing abstract context only.';

  const shared = `
Write ONLY this journal section: **${heading}**
Minimum ${minWords} words for this section.
Topic (locked): ${topic.label} — topicId "${topic.topicId}"
${titleLine}
Third-person academic voice — scholar + poet + messenger. **Bahasa Melayu Malaysia only** — draf semakan P.alt.
${ADAM_JOURNAL_THREE_LAYER_SOURCES}
${ADAM_JOURNAL_FORMULA_LAW}
Output substantive prose only — no JSON, no markdown section headers, no meta promises.
${priorBlock}`.trim();

  switch (sectionKey) {
    case 'abstract':
      return `${shared}

Write the **Abstrak** only (250–300 words, Malay prose). Four movements: human stake, convention gap, Alamtologi gift, application threshold. No title line.`;

    case 'movement_1_human_opening':
      return `${shared}

Human Opening — open with lived human experience before academic framing. Warm, recognising the reader.`;

    case 'movement_2_achievement':
      return `${shared}

Convention Knowledge Part B1 — Achievement — respectful, thorough account of what the field has achieved.`;

    case 'movement_3_honest_wall':
      return `${shared}

Convention Knowledge Part B2 — Honest Wall — unsolved issue as real loss for humanity; honest limits of convention.`;

    case 'movement_4_quran':
      return `${shared}

Quran Section (Q) — dedicated ayat selected for this locked topic. Arabic rasm, translation, thematic exposition.
${ADAM_JOURNAL_QURAN_SECTION_LAW}`;

    case 'movement_5_alamtologi_framework':
      return `${shared}

Alamtologi Framework (C) — full discipline and syllabus for this topic. Constitutional lens and scientific formula only — no Quran ayat.
${ADAM_JOURNAL_ALAMTOLOGI_SCIENTIFIC_FORMULA_LAW}`;

    case 'movement_6_application':
      return `${shared}

Application (D) — reader at a threshold; technology real; door now open.`;

    case 'movement_7_invitation':
      return `${shared}

Closing Invitation — honour the journey; end with a line that stays after the page closes. No dry summary.`;

    case 'references':
      return `${shared}

References — minimum ${JOURNAL_MIN_REFERENCES} entries, APA 7th edition. Numbered list only for this section.`;

    default:
      return shared;
  }
}
