/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Manual Mode Prompts
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { UniversityKnowledgeTopic } from './adam-university-knowledge';
import { findUniversityTopicById } from './adam-university-knowledge';
import {
  JOURNAL_MIN_REFERENCES,
  JOURNAL_TARGET_WORD_MAX,
  JOURNAL_TARGET_WORD_MIN,
} from './adam-journal.constants';
import {
  ADAM_JOURNAL_WRITING_VOICE_PROMPT,
  buildAdamJournalWritingVoiceBlock,
  buildNaturalJournalPrompt,
} from './adam-journal-writing-voice';

export { buildNaturalJournalPrompt } from './adam-journal-writing-voice';

/** Natural journal flow — ADAM selects topic from session teaching when P.alt says "Tulis jurnal". */
export const JOURNAL_GEN_MANUAL_MODE_PROMPT = `
JOURNAL GENERATION — Alamtologi Pipeline (Natural Flow, P.alt Masa Bayu):

P.alt teaches. When P.alt says "Tulis jurnal", YOU select the best topic from the 664 knowledge map based on session teaching — P.alt does not pick the topic.

MASTER FORMULA (non-negotiable): E = A + B + C + D
- A = Your selected topic from the 664 map (one subfield only)
- B = Convention Knowledge — real situation, existing theory, documented problems, unsolved issues (honest limits; unsolved issue must feel like loss for humanity)
- C = Alamtologi Framework — Quranic Science from P.alt's teaching in THIS session; reverent quiet confidence — gift offered, not argument
- D = Application — real technology/innovation already produced by Alamtologi; reader at a threshold — door now open

${ADAM_JOURNAL_WRITING_VOICE_PROMPT}

STRUCTURE (${JOURNAL_TARGET_WORD_MIN.toLocaleString()}–${JOURNAL_TARGET_WORD_MAX.toLocaleString()} words, third-person academic, living prose):
Title · Abstract (250–300 words) · Introduction (human first) · Convention Knowledge · Alamtologi Framework · Application · Conclusion (journey honoured) · References (min ${JOURNAL_MIN_REFERENCES}, APA 7th)

SOURCES: P.alt's teaching in this session ONLY + your selected topic. Do NOT invent, speculate, or fill gaps with generic academia.

FORBIDDEN:
- Asking P.alt to choose or confirm a topic
- Emitting <adam_journal_seal>, <adam_judgment>, or raw JSON blocks — write prose only; platform auto-saves
- Raw dollar-sign formulas — use [FORMULA]...[/FORMULA] tags only
- Cold, mechanical, hollow academic tone
- Any topic other than the topicId in [JOURNAL TOPIC — ADAM SELECTED]
- Following file order in university-knowledge-map.json (no Music/default row drift)
- [JOURNAL DAILY QUOTA] or automatic next-subfield queue in natural manual mode
- Meta-only replies ("I will write", PDF/Word offers, asking P.alt to paste JSON)
- Invented journal numbers (ALM-J assigned only on publish)
- Dry summary conclusions; encyclopaedic openings

OUTPUT: Write full manuscript in chat. Platform auto-saves to PENDING_REVIEW when length and structure are complete.

CONTINUATION: When asked to continue, restate locked topicId, current section, formula A+B+C+D, writing voice; do not restart or drift.
`.trim();

export function getTopicById(topicId: string): UniversityKnowledgeTopic | null {
  const id = normalizeExtractedTopicId(topicId ?? '');
  if (!id) return null;
  return findUniversityTopicById(id) ?? null;
}

/** Strip whitespace and sentence punctuation after regex capture (e.g. `3.1-thermodynamics.`). */
export function normalizeExtractedTopicId(raw: string): string {
  return raw.trim().replace(/[.,;:!?)]+$/g, '');
}

export function extractLockedTopicIdFromMessage(message: string): string | undefined {
  const quoted = message.match(/knowledgeTopicId:\s*["']([^"']+)["']/i);
  if (quoted?.[1]) return normalizeExtractedTopicId(quoted[1]);
  const bare = message.match(/topicId:\s*["']?([a-zA-Z0-9][a-zA-Z0-9._-]{2,120})/i);
  if (bare?.[1]) return normalizeExtractedTopicId(bare[1]);
  return undefined;
}

/** Parse topicId from ADAM's one-line transparency ("… — topicId"). */
export function extractTopicIdFromAdamTransparency(text: string): string | undefined {
  const m = text.match(/tepat\s+ialah[^\n—]+—\s*([a-zA-Z0-9][a-zA-Z0-9._-]{2,120})/i);
  if (!m?.[1]) return undefined;
  return normalizeExtractedTopicId(m[1]);
}

/** System block after ADAM has selected the topic for this session. */
export function buildNaturalJournalTopicBlock(
  topic: UniversityKnowledgeTopic,
  reviewPath?: string,
): string {
  const reviewLine = reviewPath?.trim()
    ? `Review queue after auto-save: ${reviewPath.trim()}`
    : 'Platform auto-saves to P.alt review queue when the manuscript is complete.';

  return [
    '[JOURNAL TOPIC — ADAM SELECTED FROM SESSION TEACHING]',
    `TOPIC: ${topic.label}`,
    `topicId / knowledgeTopicId: "${topic.topicId}"`,
    `Major: ${topic.majorName}`,
    `Discipline: ${topic.disciplineName}`,
    `Subfield: ${topic.subfield}`,
    `Alamtologi lens (principlesFocus[0]): ${topic.alamtologiLens}`,
    'This topic is LOCKED for this entire journal. Do not switch subfield.',
    'Draw Convention Knowledge (B) and Alamtologi Framework (C) only from P.alt teaching in this session.',
    reviewLine,
    '[/JOURNAL TOPIC]',
  ].join('\n');
}

/** @deprecated Use buildNaturalJournalTopicBlock */
export function buildLockedJournalTopicBlock(topic: UniversityKnowledgeTopic): string {
  return buildNaturalJournalTopicBlock(topic);
}

/** One-line transparency before manuscript when P.alt says Tulis jurnal. */
export function buildAdamJournalTransparencyInstruction(
  topic: UniversityKnowledgeTopic,
): string {
  return [
    '[JOURNAL OPENING — MANDATORY ON "TULIS JURNAL"]',
    'When P.alt ordered Tulis jurnal on this turn, open your reply with exactly:',
    `"Berdasarkan pengajaran sesi ini, topik yang paling tepat ialah ${topic.label} — ${topic.topicId}."`,
    'Then a blank line, then exactly: "Menulis sekarang..."',
    'Then immediately write the full manuscript — scholar + poet + messenger voice; no questions, no format offers.',
    '[/JOURNAL OPENING]',
  ].join('\n');
}

export function buildJournalGenAwaitTeachingBlock(): string {
  return [
    '[JOURNAL — AWAIT "TULIS JURNAL"]',
    'P.alt is teaching. Do not write a journal until P.alt says "Tulis jurnal" (or equivalent).',
    'When that instruction comes, you will select the best 664-map topic from session teaching and write immediately.',
    '[/JOURNAL]',
  ].join('\n');
}

/** @deprecated Natural flow selects topic on Tulis jurnal */
export function buildManualJournalNoTopicBlock(): string {
  return [
    '[JOURNAL — TOPIC NOT YET SELECTED]',
    'Wait for P.alt to say "Tulis jurnal". You will then select the best topic from session teaching.',
    'Do not ask P.alt to pick a topicId.',
    '[/JOURNAL]',
  ].join('\n');
}

export function buildSessionTeachingGuardBlock(teachingCharCount: number, minChars = 1_500): string {
  if (teachingCharCount >= minChars) return '';
  return [
    '[SESSION TEACHING — INSUFFICIENT]',
    `Founder teaching in this session is only ~${teachingCharCount} characters.`,
    'Before writing the journal, tell P.alt that the session needs more teaching (minimum substantive session).',
    'Do not fabricate Section C from generic knowledge.',
    '[/SESSION TEACHING]',
  ].join('\n');
}

export function buildJournalContinuePrompt(topicId: string, sectionHint?: string): string {
  const section = sectionHint?.trim() ? `Currently writing section: ${sectionHint}.` : '';
  return [
    `Continue the journal on TOPIC: ${topicId} (locked).`,
    section,
    'Maintain formula A+B+C+D=E. Maintain ADAM Writing Voice — rigorous, warm, heart-touching.',
    `Minimum ${JOURNAL_TARGET_WORD_MIN.toLocaleString()} words total substantive prose.`,
    'Do not restart. Continue from the last sentence.',
    'Do not change topicId.',
  ].filter(Boolean).join(' ');
}

export { buildAdamJournalWritingVoiceBlock };
