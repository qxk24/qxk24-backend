/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Topic Selector (664 Map)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { getFastModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import type { LlmMessage } from '../llm/llm-types';
import { getDailyJournalSegmentStatus } from './adam-journal-daily-segment';
import { extractLockedTopicIdFromMessage } from './adam-journal-manual-prompt';
import { findUniversityTopicById } from './adam-university-knowledge';
import {
  loadUniversityKnowledgeTopics,
  type UniversityKnowledgeTopic,
} from './adam-university-knowledge';

const TOPIC_SELECTION_SYSTEM = [
  'You are ADAM — constitutional knowledge mapper for QXK24.',
  'Given P.alt teaching in a session, pick the single best-matching topicId from the candidate list.',
  'Reply with ONLY the topicId string. No explanation. No punctuation. No markdown.',
].join(' ');

const MAX_CANDIDATES = 48;

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return new Set(words);
}

function scoreTopicAgainstTeaching(
  topic: UniversityKnowledgeTopic,
  teachingTokens: Set<string>,
): number {
  const hay = `${topic.label} ${topic.majorName} ${topic.disciplineName} ${topic.subfield} ${topic.alamtologiLens}`
    .toLowerCase();
  let score = 0;
  for (const t of teachingTokens) {
    if (hay.includes(t)) score += 1;
  }
  return score;
}

export function getUnsealed664Topics(
  sealedTopicIds: Set<string>,
): UniversityKnowledgeTopic[] {
  return loadUniversityKnowledgeTopics().filter((t) => !sealedTopicIds.has(t.topicId));
}

function getFirstUnsealedTopic(
  sealedTopicIds: Set<string>,
): UniversityKnowledgeTopic | null {
  return getUnsealed664Topics(sealedTopicIds)[0] ?? null;
}

/** When LLM topic pick fails — still lock a topic so section pipeline runs. */
export async function getSyncJournalTopicFallback(
  date = new Date(),
): Promise<UniversityKnowledgeTopic | null> {
  try {
    const { sealedTopicIds } = await getDailyJournalSegmentStatus(date);
    return getFirstUnsealedTopic(new Set(sealedTopicIds));
  } catch (err) {
    console.warn('[adam:journal-topic] sync fallback status failed', err);
    return loadUniversityKnowledgeTopics()[0] ?? null;
  }
}

function rankCandidateTopics(
  teachingText: string,
  sealedTopicIds: Set<string>,
): UniversityKnowledgeTopic[] {
  const unsealed = getUnsealed664Topics(sealedTopicIds);
  if (unsealed.length <= MAX_CANDIDATES) return unsealed;

  const tokens = tokenize(teachingText);
  return [...unsealed]
    .map((topic) => ({
      topic,
      score: scoreTopicAgainstTeaching(topic, tokens),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)
    .map((x) => x.topic);
}

function teachingCorpusFromSession(sessionMessages: LlmMessage[]): string {
  return sessionMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n')
    .slice(-24_000);
}

function parseTopicIdFromLlm(raw: string): string | undefined {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  const line = trimmed.split(/\s+/)[0]?.trim();
  if (!line) return undefined;
  if (/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,120}$/.test(line)) return line;
  const embedded = trimmed.match(/([a-zA-Z0-9][a-zA-Z0-9._-]{2,120})/);
  return embedded?.[1]?.trim();
}

/** Continuation turns — topic already chosen in session. */
export function extractLockedTopicIdFromSession(
  sessionMessages: LlmMessage[],
): string | undefined {
  for (let i = sessionMessages.length - 1; i >= 0; i--) {
    const m = sessionMessages[i]!;
    const fromBlock = extractLockedTopicIdFromMessage(m.content);
    if (fromBlock) return fromBlock;
    const transparency = m.content.match(
      /tepat\s+ialah[^\n—]+—\s*([a-zA-Z0-9][a-zA-Z0-9._-]{2,120})/i,
    );
    if (transparency?.[1]) return transparency[1].trim();
  }
  return undefined;
}

/**
 * ADAM reads session teaching and picks the best 664-map topic (natural "Tulis jurnal" flow).
 */
export async function adamSelectsBestTopic(
  sessionMessages: LlmMessage[],
  date = new Date(),
  seedMessage?: string,
): Promise<UniversityKnowledgeTopic> {
  const { sealedTopicIds } = await getDailyJournalSegmentStatus(date);
  const sealedSet = new Set(sealedTopicIds);
  let teaching = teachingCorpusFromSession(sessionMessages);
  if (!teaching.trim() && seedMessage?.trim()) {
    teaching = seedMessage.trim();
  }
  const candidates = rankCandidateTopics(teaching, sealedSet);

  const fallback = getFirstUnsealedTopic(sealedSet);
  if (candidates.length === 0) {
    if (!fallback) throw new Error('No unsealed topics remain on the 664 knowledge map.');
    return fallback;
  }

  const selectionPrompt = [
    'Berdasarkan perbualan pengajaran ini, kenal pasti topik yang PALING TEPAT dari senarai calon.',
    '',
    'Perbualan pengajaran:',
    teaching || '(tiada pengajaran pengguna dalam konteks)',
    '',
    'Calon topik (topicId: label):',
    candidates.map((t) => `${t.topicId}: ${t.label}`).join('\n'),
    '',
    'Jawab dengan HANYA topicId yang paling tepat. Tiada penjelasan. Tiada teks lain. Hanya topicId.',
  ].join('\n');

  try {
    const raw = await llmCompleteUserPrompt(
      TOPIC_SELECTION_SYSTEM,
      selectionPrompt,
      getFastModel(),
      120,
    );
    const topicId = parseTopicIdFromLlm(raw);
    const topic = topicId ? findUniversityTopicById(topicId) : null;
    if (topic && !sealedSet.has(topic.topicId)) return topic;
  } catch (err) {
    console.warn('[adam:journal-topic] LLM selection failed', err);
  }

  const topScored = candidates[0];
  if (topScored) return topScored;
  if (fallback) return fallback;
  throw new Error('Could not select a journal topic from the 664 knowledge map.');
}
