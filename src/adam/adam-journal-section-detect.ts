/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Section Detect (Interactive)
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
  founderWantsJournalParagraphEdit,
  inferParagraphIndexFromText,
  mergeParagraphIntoSection,
  nextParagraphIndex,
  normalizeSectionParagraphBody,
  sectionUsesParagraphStructure,
  stripParagraphMarkerFromProse,
} from './adam-journal-section-paragraphs';
import { sanitizeAdamProseDashBridges } from './adam-prose-sanitize';
import {
  loadJournalSectionDraft,
  loadLatestJournalSectionDraftForSession,
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

}

/** UI movement index (1/9 … 9/9) → section id (Title & Abstract = 1). */
export function inferJournalSectionFromDisplayIndex(text: string): JournalSectionId | null {
  const match = text.match(/\(\s*(\d+)\s*\/\s*9\s*\)/);
  if (!match?.[1]) return null;
  const idx = Number.parseInt(match[1], 10);
  if (idx < 1 || idx > JOURNAL_SECTION_ORDER.length) return null;
  return JOURNAL_SECTION_ORDER[idx - 1] ?? null;
}

function inferJournalSectionFromHeading(text: string): JournalSectionId | null {
  for (const [pattern, sectionId] of SECTION_HEADING_ALIASES) {
    if (pattern.test(text)) return sectionId;
  }
  for (const sectionId of JOURNAL_SECTION_ORDER) {
    const heading = JOURNAL_SECTION_HEADINGS[sectionId];
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(escaped, 'i').test(text)) return sectionId;
  }
  return null;
}

const JOURNAL_SECTION_EDIT_VERBS =
  /\b(expand|luaskan|kembangkan|edit|revise|rewrite|tulis\s+semula|perbaiki|tambah|add\s+to|masukkan|sertakan|integrasikan|lengthen|panjangkan|update|kemas\s+kini|perluas|detailkan|perdalam|perkaya)\b/i;

const JOURNAL_SECTION_APPEND_VERBS =
  /\b(tambah|add\s+to|masukkan|sertakan|integrasikan|dimasukkan|dimasukkan ke dalam|masukkan ke dalam|gabungkan|append)\b/i;

/** Malay / English heading aliases ADAM uses in organic addendum replies. */
const SECTION_HEADING_ALIASES: ReadonlyArray<[RegExp, JournalSectionId]> = [
  [/Pengetahuan\s+Konvensional\s*[—–-]\s*Pencapaian/i, 'movement_2_achievement'],
  [/Pengetahuan\s+Konvensional\s*[—–-]\s*Dinding\s+Jujur/i, 'movement_3_honest_wall'],
  [/Convention\s+Knowledge\s*[—–-]\s*Achievement/i, 'movement_2_achievement'],
  [/Convention\s+Knowledge\s*[—–-]\s*The\s+Honest\s+Wall/i, 'movement_3_honest_wall'],
];

/** P.alt asked to append prose to an existing movement (not full rewrite). */
export function founderWantsJournalSectionAppend(message: string): boolean {
  const text = message.trim();
  if (!text || !JOURNAL_SECTION_APPEND_VERBS.test(text)) return false;
  return resolveJournalSectionEditTarget(text) !== null;
}

/** ADAM replied with an organic journal-section addendum (Teaching-style, not pipeline ## output). */
export function adamReplyIsJournalSectionAddendum(adamText: string): boolean {
  const text = stripAdamProtocolBlocks(adamText).trim();
  if (text.length < MIN_SECTION_CHARS) return false;
  const addendumCue =
    /\b(tambahan yang dimasukkan|dimasukkan secara organik|berikut adalah tambahan|berikut adalah bahagian|bahagian ini dikembangkan|dikembangkan secara penuh)\b/i.test(text)
    || /\*\*Pengetahuan Konvensional/i.test(text)
    || /\*\*Convention Knowledge\s*[—–-]\s*Achievement\*\*/i.test(text);
  if (!addendumCue) return false;
  return inferJournalSectionFromAdamResponse(text) !== null;
}

/** P.alt asks to save a prior ADAM addendum (or pasted prose) into a movement. */
export function founderWantsJournalSaveAddendum(message: string): boolean {
  const text = message.trim();
  if (!text || !resolveJournalSectionEditTarget(text)) return false;
  if (text.length > 600 && /\b(simpan|masukkan|gabungkan|save)\b/i.test(text)) return true;
  if (
    /\b(simpan|save|masukkan|gabungkan)\b/i.test(text)
    && resolveJournalSectionEditTarget(text)
  ) {
    return true;
  }
  return (
    /\b(simpan|save|masukkan|gabungkan)\b/i.test(text)
    && /\b(tadi|balasan|addendum|tambahan|ke dalam|previous|last reply)\b/i.test(text)
  );
}

/** Resolve ADAM text to persist — current reply, pasted founder prose, or last addendum. */
export function resolveAdamTextForJournalPersist(input: {
  userMessage:  string;
  adamResponse: string;
  recentAdam:   ReadonlyArray<{ role: string; content: string }>;
}): string {
  const current = input.adamResponse?.trim() ?? '';
  if (current && adamReplyIsJournalSectionAddendum(current)) return current;

  const user = input.userMessage.trim();
  if (founderWantsJournalSaveAddendum(user) || founderWantsJournalSectionAppend(user)) {
    for (let i = input.recentAdam.length - 1; i >= 0; i--) {
      const msg = input.recentAdam[i]!;
      if (msg.role !== 'adam') continue;
      const content = msg.content?.trim() ?? '';
      if (adamReplyIsJournalSectionAddendum(content)) return content;
    }
    if (founderWantsJournalSaveAddendum(user) && user.length > 600) return user;
    return '';
  }

  if (current && !isJournalManuscriptDisplay(current) && !adamReplyIsJournalSaveConfirmation(current)) {
    return current;
  }

  return '';
}

/** ADAM confirmed a section was saved — meta reply, not the manuscript body. */
export function adamReplyIsJournalSaveConfirmation(adamText: string): boolean {
  const text = stripAdamProtocolBlocks(adamText).trim();
  if (text.length < 40 || text.length > 2_500) return false;
  const saveCue =
    /\b(telah disimpan|disimpan ke dalam|disimpan ke draf|saved to|dimasukkan ke dalam)\b/i.test(text)
    || /\bsedia untuk \*(?:continue|edit|seal journal)\*\b/i.test(text);
  if (!saveCue) return false;
  return (
    inferJournalSectionFromDisplayIndex(text) !== null
    || inferJournalSectionFromHeading(text) !== null
  );
}

/** Chat accordion manuscript — multiple ## movement headings. */
export function isJournalManuscriptDisplay(text: string): boolean {
  const cleaned = text.trim();
  if (!cleaned) return false;
  const sectionHeadings = (cleaned.match(/^##\s+/gm) ?? []).length;
  return sectionHeadings >= 2 || /^#\s+.+\n\n##\s/m.test(cleaned);
}

/** Turn should refresh the full journal draft accordion in chat. */
export function founderJournalDisplayTurn(input: {
  userMessage:  string;
  adamResponse: string;
}): boolean {
  return (
    founderWantsJournalSectionEdit(input.userMessage)
    || founderWantsJournalSectionAppend(input.userMessage)
    || founderWantsJournalSaveAddendum(input.userMessage)
    || adamReplyIsJournalSectionAddendum(input.adamResponse)
    || adamReplyIsJournalSaveConfirmation(input.adamResponse)
  );
}

/** P.alt asked to expand or rewrite a specific journal movement (not continue to next). */
export function founderWantsJournalSectionEdit(message: string): boolean {
  const text = message.trim();
  if (!text || founderWantsJournalSectionAppend(text) || founderWantsJournalSaveAddendum(text)) {
    return false;
  }
  if (!JOURNAL_SECTION_EDIT_VERBS.test(text)) return false;
  if (inferJournalSectionFromDisplayIndex(text)) return true;
  if (inferJournalSectionFromHeading(text)) return true;
  return inferJournalSectionIntentFromPatterns(text) !== null;
}

/** Resolve which movement P.alt wants edited — for forced section rewrite. */
export function resolveJournalSectionEditTarget(message: string): JournalSectionId | null {
  const text = message.trim();
  if (!text) return null;
  return (
    inferJournalSectionFromDisplayIndex(text)
    ?? inferJournalSectionFromHeading(text)
    ?? inferJournalSectionIntentFromPatterns(text)
  );
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

function inferJournalSectionIntentFromPatterns(text: string): JournalSectionId | null {
  for (const [pattern, sectionId] of USER_SECTION_PATTERNS) {
    if (pattern.test(text)) return sectionId;
  }
  return null;
}

/** Infer section from P.alt's turn (e.g. "Tulis M1 sahaja", "(3/9)"). */
export function inferJournalSectionIntent(userMessage: string): JournalSectionId | null {
  const text = userMessage.trim();
  if (!text) return null;
  return (
    inferJournalSectionFromDisplayIndex(text)
    ?? inferJournalSectionFromHeading(text)
    ?? inferJournalSectionIntentFromPatterns(text)
  );
}

/** Infer section from ADAM's reply structure (headings, title, abstract block). */
export function inferJournalSectionFromAdamResponse(adamText: string): JournalSectionId | null {
  const text = stripAdamProtocolBlocks(adamText).trim();
  if (text.length < MIN_SECTION_CHARS) return null;

  const fromDisplay = inferJournalSectionFromDisplayIndex(text);
  if (fromDisplay) return fromDisplay;

  const fromAlias = inferJournalSectionFromHeading(text);
  if (fromAlias) return fromAlias;

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

/** Resolve topicId from journal context, user message, ADAM transparency line, or session draft. */
export async function resolveJournalTopicIdForDraftAsync(input: {
  topicId?:      string;
  userMessage?:  string;
  adamResponse?: string;
  sessionId?:    string;
}): Promise<string | undefined> {
  const fromUser = input.userMessage
    ? extractLockedTopicIdFromMessage(input.userMessage)
    : undefined;
  if (fromUser) return fromUser;

  if (input.sessionId) {
    const sessionDraft = await loadLatestJournalSectionDraftForSession(input.sessionId);
    if (sessionDraft?.topicId) return sessionDraft.topicId;
  }

  return resolveJournalTopicIdForDraft(input);
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

/** Remove chat framing ADAM uses when delivering organic section addenda. */
export function stripJournalSectionEditChatWrappers(text: string): string {
  let out = text.trim();
  out = out
    .replace(/^P\.?\s*alt,?\s+berikut[^\n]*\n+/im, '')
    .replace(/^P\.?\s*alt,?\s+ini[^\n]*tambahan[^\n]*\n+/im, '')
    .trim();

  const divider = out.search(/\n---+\s*\n/);
  if (divider >= 0 && divider < 600) {
    out = out.slice(divider).replace(/^---+\s*\n+/, '').trim();
  }

  out = out
    .replace(/^\*\*Pengetahuan Konvensional\s*[—–-]\s*Pencapaian\*\*[^\n]*\n+/im, '')
    .replace(/^\*\*Convention Knowledge\s*[—–-]\s*Achievement\*\*[^\n]*\n+/im, '')
    .replace(/^\*\*[^*]+?\*\*\s*\n+\*?\([^)]*\)\*?\s*\n+/m, '')
    .trim();

  out = out.replace(
    /\n---+\s*\n+P\.?\s*alt,?\s+saya sedia memperbaiki[\s\S]*$/i,
    '',
  ).trim();
  out = out.replace(
    /\nP\.?\s*alt,?\s+saya sedia memperbaiki[\s\S]*$/i,
    '',
  ).trim();

  return out;
}

function stripStoredSectionHeading(body: string, sectionId: JournalSectionId): string {
  let text = body.trim();
  const heading = JOURNAL_SECTION_HEADINGS[sectionId];
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  text = text.replace(new RegExp(`^#{1,3}\\s*${escaped}\\s*\\n+`, 'im'), '').trim();
  text = text.replace(new RegExp(`^\\*\\*${escaped}\\*\\*\\s*\\n+`, 'im'), '').trim();
  return text;
}

/** Strip transparency preamble; keep substantive section body for storage. */
export function extractSectionBodyForSave(
  adamText: string,
  sectionId: JournalSectionId,
): string {
  let text = stripAdamProtocolBlocks(adamText).trim();
  text = text
    .replace(/^Berdasarkan pengajaran sesi ini[^\n]*\n+/im, '')
    .replace(/^From this session's teaching[^\n]*\n+/im, '')
    .replace(/^Menulis sekarang\.{0,3}\s*\n+/im, '')
    .replace(/^Writing now\.{0,3}\s*\n+/im, '')
    .replace(/^Bismillahirahmanirrahim\.?\s*\n+/im, '')
    .trim();

  const afterDivider = text.match(/\n---+\s*\n+([\s\S]+)/);
  if (
    afterDivider?.[1]
    && /tambahan|Pengetahuan Konvensional|Convention Knowledge/i.test(afterDivider[1])
  ) {
    text = afterDivider[1].trim();
  }

  if (sectionId === 'title_and_abstract') {
    const titleMatch = text.match(/^#\s+(.+)$/m);
    if (titleMatch?.index != null && titleMatch.index > 0) {
      text = text.slice(titleMatch.index).trim();
    }
    const nextMovement = text.search(
      /\n##\s+(?:Introduction|Title\s*&|Convention|Al-Quran|Alamtologi|Application|Conclusion|References)\b/im,
    );
    if (nextMovement > 0) {
      text = text.slice(0, nextMovement).trim();
    }
    return sanitizeAdamProseDashBridges(text.trim());
  }

  const heading = JOURNAL_SECTION_HEADINGS[sectionId];
  const headingRx = headingPattern(heading);
  const match = text.match(headingRx);
  if (match?.index != null) {
    text = text.slice(match.index).trim();
  }

  const sectionIdx = JOURNAL_SECTION_ORDER.indexOf(sectionId);
  for (let i = sectionIdx + 1; i < JOURNAL_SECTION_ORDER.length; i++) {
    const nextId = JOURNAL_SECTION_ORDER[i]!;
    const nextHeading = JOURNAL_SECTION_HEADINGS[nextId];
    const nextRx = new RegExp(
      `(?:^|\\n)(?:#{1,3}\\s*)?${nextHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'im',
    );
    const nextMatch = text.match(nextRx);
    if (nextMatch?.index != null && nextMatch.index > 0) {
      text = text.slice(0, nextMatch.index).trim();
      break;
    }
  }

  text = stripJournalSectionEditChatWrappers(text);
  return sanitizeAdamProseDashBridges(text.trim());
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
  const topicId = await resolveJournalTopicIdForDraftAsync({
    topicId:      input.topicId?.trim() || input.topic?.topicId,
    userMessage:  input.userMessage,
    adamResponse: adamText,
    sessionId:    input.sessionId,
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
  let priorSections = existing?.sections ?? {};
  if (Object.keys(priorSections).length === 0) {
    const sessionDraft = await loadLatestJournalSectionDraftForSession(input.sessionId);
    if (sessionDraft?.topicId === topic.topicId) {
      priorSections = sessionDraft.sections;
    }
  }
  const priorSection = priorSections[sectionId]?.trim() ?? '';
  const appendMode =
    founderWantsJournalSectionAppend(input.userMessage)
    || founderWantsJournalSaveAddendum(input.userMessage)
    || adamReplyIsJournalSectionAddendum(adamText);

  const paragraphIndex =
    inferParagraphIndexFromText(input.userMessage)
    ?? inferParagraphIndexFromText(adamText);

  let mergedBody = body;
  const priorCore = stripStoredSectionHeading(priorSection, sectionId);

  if (
    sectionUsesParagraphStructure(sectionId)
    && paragraphIndex
    && priorCore.length >= 40
  ) {
    const paraProse = stripParagraphMarkerFromProse(
      stripStoredSectionHeading(body, sectionId),
    );
    mergedBody = mergeParagraphIntoSection(
      priorCore,
      paragraphIndex,
      paraProse,
      appendMode && !founderWantsJournalParagraphEdit(input.userMessage) ? 'append' : 'replace',
    );
    mergedBody = normalizeSectionParagraphBody(sectionId, mergedBody);
  } else if (appendMode && priorCore.length >= MIN_SECTION_CHARS) {
    if (sectionUsesParagraphStructure(sectionId)) {
      const nextIdx = nextParagraphIndex(priorCore);
      mergedBody = mergeParagraphIntoSection(
        priorCore,
        nextIdx,
        stripParagraphMarkerFromProse(stripStoredSectionHeading(body, sectionId)),
        'replace',
      );
      mergedBody = normalizeSectionParagraphBody(sectionId, mergedBody);
    } else {
      mergedBody = `${priorCore}\n\n${body}`.trim();
    }
  } else if (sectionUsesParagraphStructure(sectionId)) {
    mergedBody = normalizeSectionParagraphBody(sectionId, body);
  }

  const sections = {
    ...priorSections,
    [sectionId]: mergedBody,
  };

  return saveJournalSectionProgress({
    sessionId:      input.sessionId,
    topic,
    sections,
    lastSection:    sectionId,
    journalDraftId: existing?.journalId
      ?? (await loadLatestJournalSectionDraftForSession(input.sessionId))?.journalId,
  });
}
