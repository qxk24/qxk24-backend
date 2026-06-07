/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Section Detect (Interactive)
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
 *
 * Turn-by-turn journal writes (Abstract, M1–M6, References) persist to
 * MongoDB even when the batch section writer has not started.
 */

import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import {
  extractLockedTopicIdFromMessage,
  extractTopicIdFromAdamTransparency,
  getTopicById,
  normalizeExtractedTopicId,
} from './adam-journal-manual-prompt';
import { stripAdamProtocolBlocks } from './adam-chat-response-parser';
import {
  loadJournalSectionDraft,
  saveJournalSectionProgress,
  type JournalSectionDraft,
} from './adam-journal-section-draft';
import {
  JOURNAL_SECTION_HEADINGS,
  JOURNAL_SECTION_ORDER,
  type JournalSectionId,
} from './adam-journal-section.types';

/** Sections that trigger an immediate MongoDB draft save when detected in a turn. */
export const INTERACTIVE_SAVEABLE_SECTIONS: readonly JournalSectionId[] = JOURNAL_SECTION_ORDER;

const MIN_SECTION_CHARS = 80;

const MOVEMENT_N_TO_SECTION: Record<string, JournalSectionId> = {
  '1': 'movement_1_human_opening',
  '2': 'movement_2_achievement',
  '3': 'movement_3_honest_wall',
  '4': 'movement_4_quran',
  '5': 'movement_5_alamtologi',
  '6': 'movement_6_application',
  '7': 'movement_7_invitation',
};

function logJournalDraftSkip(
  reason: string,
  detail: Record<string, unknown>,
): void {
  console.log('[journal:draft-save] skip', JSON.stringify({ reason, ...detail }));
}

const USER_SECTION_PATTERNS: ReadonlyArray<[RegExp, JournalSectionId]> = [
  [/\b(references|rujukan|bibliografi)\b/i, 'references'],
  [/\b(movement\s*[_\-\s]?7|m\s*7\b|invitation|jemputan|kesimpulan)\b/i, 'movement_7_invitation'],
  [/\b(movement\s*[_\-\s]?6|m\s*6\b|application|aplikasi)\b/i, 'movement_6_application'],
  [/\b(movement\s*[_\-\s]?5|m\s*5\b|alamtologi\s+framework|rangka\s+kerja\s+alamtologi|silibus)\b/i, 'movement_5_alamtologi'],
  [/\b(movement\s*[_\-\s]?4|m\s*4\b|quran|al-quran|alquran|ayat)\b/i, 'movement_4_quran'],
  [/\b(movement\s*[_\-\s]?3|m\s*3\b|honest\s+wall|dinding\s+jujur)\b/i, 'movement_3_honest_wall'],
  [/\b(movement\s*[_\-\s]?2|m\s*2\b|achievement|pencapaian|konvension)\b/i, 'movement_2_achievement'],
  [/\b(movement\s*[_\-\s]?1|m\s*1\b|human\s+opening|pengenalan)\b/i, 'movement_1_human_opening'],
  [
    /\b(title\s*&?\s*abstract|title_and_abstract|tajuk\s+dan\s+abstrak|abstrak|abstract|tajuk)\b/i,
    'title_and_abstract',
  ],
];

function headingPattern(heading: string): RegExp {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\n)#{1,3}\\s*${escaped}\\b|\\b${escaped}\\b`, 'im');
}

/** Infer section from P.alt's turn (e.g. "Tulis M1 sahaja"). */
export function inferJournalSectionIntent(userMessage: string): JournalSectionId | null {
  const text = userMessage.trim();
  if (!text) return null;
  for (const [pattern, sectionId] of USER_SECTION_PATTERNS) {
    if (pattern.test(text)) return sectionId;
  }
  return null;
}

/** Infer section from ADAM's reply structure (headings, title, abstract block). */
export function inferJournalSectionFromAdamResponse(adamText: string): JournalSectionId | null {
  const text = stripAdamProtocolBlocks(adamText).trim();
  if (text.length < MIN_SECTION_CHARS) return null;

  for (const sectionId of [...JOURNAL_SECTION_ORDER].reverse()) {
    if (sectionId === 'title_and_abstract') continue;
    const heading = JOURNAL_SECTION_HEADINGS[sectionId];
    if (headingPattern(heading).test(text)) return sectionId;
  }

  const hasTitle = /^#\s+.+/m.test(text);
  const abstractMatch = text.match(
    /(?:^|\n)(?:Abstract|Abstrak)[:\s]*\n([\s\S]{40,})/im,
  );
  if (hasTitle && abstractMatch && abstractMatch[1]!.trim().length >= 40) {
    return 'title_and_abstract';
  }

  if (
    /(?:^|\n)(?:Abstract|Abstrak)[:\s]*\n([\s\S]{80,})/im.test(text)
    && !/\bmovement\s*[2-7]\b/i.test(text)
  ) {
    return 'title_and_abstract';
  }

  const movementN = text.match(/\bMovement\s*([1-7])\b/i);
  if (movementN?.[1]) {
    return MOVEMENT_N_TO_SECTION[movementN[1]] ?? null;
  }

  if (/\b(M1|M\s*1)\b/i.test(text) && /human\s+opening|pengenalan|pembukaan/i.test(text)) {
    return 'movement_1_human_opening';
  }

  return null;
}

/** Resolve topicId from journal context, user message, or ADAM transparency line. */
export function resolveJournalTopicIdForDraft(input: {
  topicId?:      string;
  userMessage?:  string;
  adamResponse?: string;
}): string | undefined {
  const fromArg = input.topicId ? normalizeExtractedTopicId(input.topicId) : '';
  if (fromArg) return fromArg;

  const fromUser = input.userMessage
    ? extractLockedTopicIdFromMessage(input.userMessage)
    : undefined;
  if (fromUser) return fromUser;

  const fromAdam = input.adamResponse
    ? extractTopicIdFromAdamTransparency(input.adamResponse)
    : undefined;
  if (fromAdam) return fromAdam;

  const thermo = input.userMessage?.match(/\b(3\.\d+-[a-z0-9-]+)\b/i)?.[1]
    ?? input.adamResponse?.match(/\b(3\.\d+-[a-z0-9-]+)\b/i)?.[1];
  return thermo ? normalizeExtractedTopicId(thermo) : undefined;
}

/** Resolve section for this turn — user intent wins over ADAM structure. */
export function resolveJournalSectionForTurn(
  userMessage: string,
  adamText: string,
): JournalSectionId | null {
  return inferJournalSectionIntent(userMessage) ?? inferJournalSectionFromAdamResponse(adamText);
}

/** Strip transparency preamble; keep substantive section body for storage. */
export function extractSectionBodyForSave(
  adamText: string,
  sectionId: JournalSectionId,
): string {
  let text = stripAdamProtocolBlocks(adamText).trim();
  text = text
    .replace(
      /^Berdasarkan pengajaran sesi ini[^\n]*\n+/im,
      '',
    )
    .replace(/^Menulis sekarang\.{0,3}\s*\n+/im, '')
    .trim();

  if (sectionId !== 'title_and_abstract') {
    const heading = JOURNAL_SECTION_HEADINGS[sectionId];
    const headingRx = headingPattern(heading);
    const match = text.match(headingRx);
    if (match?.index != null && match.index > 0) {
      text = text.slice(match.index).trim();
    }
  }

  return text.trim();
}

/**
 * Detect a completed journal section in an interactive turn and persist to adam_journals.
 * Returns null when no saveable section is recognised or content is too short.
 */
export async function tryPersistInteractiveJournalSection(input: {
  sessionId:     string;
  userMessage:   string;
  adamResponse:  string;
  topicId?:      string;
  /** @deprecated use adamResponse */
  adamText?:     string;
  /** @deprecated use topicId */
  topic?:        UniversityKnowledgeTopic;
}): Promise<JournalSectionDraft | null> {
  const adamText = input.adamResponse?.trim() || input.adamText?.trim() || '';
  const topicId = resolveJournalTopicIdForDraft({
    topicId:      input.topicId?.trim() || input.topic?.topicId,
    userMessage:  input.userMessage,
    adamResponse: adamText,
  });
  if (!topicId) {
    logJournalDraftSkip('no_topic_id', {
      sessionId: input.sessionId,
      userPreview: input.userMessage.slice(0, 120),
    });
    return null;
  }

  const topic = input.topic ?? getTopicById(topicId);
  if (!topic) {
    logJournalDraftSkip('unknown_topic', { sessionId: input.sessionId, topicId });
    return null;
  }

  const sectionId = resolveJournalSectionForTurn(input.userMessage, adamText);
  if (!sectionId) {
    logJournalDraftSkip('no_section', {
      sessionId: input.sessionId,
      topicId,
      adamChars: adamText.length,
      userPreview: input.userMessage.slice(0, 120),
    });
    return null;
  }

  const body = extractSectionBodyForSave(adamText, sectionId);
  if (body.length < MIN_SECTION_CHARS) {
    logJournalDraftSkip('body_too_short', {
      sessionId: input.sessionId,
      topicId,
      sectionId,
      bodyChars: body.length,
      minChars:  MIN_SECTION_CHARS,
    });
    return null;
  }

  const existing = await loadJournalSectionDraft(input.sessionId, topic.topicId);
  const sections = {
    ...(existing?.sections ?? {}),
    [sectionId]: body,
  };

  return saveJournalSectionProgress({
    sessionId:      input.sessionId,
    topic,
    sections,
    lastSection:    sectionId,
    journalDraftId: existing?.journalId,
  });
}
