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

import { ENV } from '../../config/environments';
import { getDeepModel } from '../../config/llm-models';
import { llmComplete } from '../../llm/llm-client';
import type { LlmMessage } from '../../llm/llm-types';
import { isAmaBrainV2Enabled } from '../../lib/ama/ama.config';
import { resolveTamatLayer5Block } from '../../lib/ama/tamat-generator';
import { getOrCreateMaster } from '../../qxk24brain/qxk24brain.engine';
import { buildSmartContext } from '../../qxk24brain/adam-context-builder';
import { FOUNDER_STUDENTS_AWARENESS, buildAdamChatSystemPrompt } from '../adam-prompt-builder';
import {
  buildAdamJournalWritingVoiceBlock,
  buildNaturalJournalTopicBlock,
} from '../adam-journal-manual-prompt';
import { countJournalWords } from '../adam-journal.constants';
import { findUniversityTopicById } from '../adam-university-knowledge';
import { buildQwenLanguageLock } from '../adam-language-guard';
import { FOUNDER_USER_ID } from '../adam-student.types';
import {
  JournalV2Model,
  JOURNAL_SECTION_KEYS,
  type JournalSectionKey,
} from './adam-journal-v2.schema';
import { buildV2SectionPrompt } from './adam-journal-v2-section-prompts';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

async function buildJournalGenerateSystemPrompt(): Promise<string> {
  let amaTamatBlock: string | undefined;
  if (isAmaBrainV2Enabled()) {
    const tamat = await resolveTamatLayer5Block(
      'Generate Alamtologi academic journal section',
      () => getOrCreateMaster(FOUNDER_USER_ID),
    );
    if (tamat) amaTamatBlock = tamat;
  }

  const base = buildAdamChatSystemPrompt({
    mode:                 'JOURNAL_GEN',
    isFounder:            true,
    participantName:      'Masa Bayu',
    founderStudentsBlock: FOUNDER_STUDENTS_AWARENESS,
    amaTamatBlock,
  });

  return [
    buildQwenLanguageLock({ journalPhase: 'draft' }),
    base,
    buildAdamJournalWritingVoiceBlock(),
  ].join('\n\n');
}

async function buildJournalGenerateMessages(
  journalNumber: string,
  sectionKey: JournalSectionKey,
  userPrompt: string,
): Promise<{ system: string; messages: LlmMessage[] }> {
  const journal = await JournalV2Model.findOne({ journalNumber }).lean();
  if (!journal) throw new Error(`Journal not found: ${journalNumber}`);

  const topic = findUniversityTopicById(journal.topicId);
  if (!topic) throw new Error(`Topic not found for topicId: ${journal.topicId}`);

  const sections = (journal.sections ?? {}) as Partial<Record<JournalSectionKey, string>>;
  const system = await buildJournalGenerateSystemPrompt();
  const topicBlock = buildNaturalJournalTopicBlock(topic);
  const systemWithTopic = `${system}\n\n${topicBlock}`;

  const sessionId = journal.writingSessionId?.trim() || `journal-write-${journalNumber}`;
  const contextMessages = await buildSmartContext(
    sessionId,
    userPrompt,
    {
      userId:      FOUNDER_USER_ID,
      userName:    'Masa Bayu',
      role:        'founder',
      sessionType: 'founder',
    },
    null,
    'JOURNAL_GEN',
  );

  return { system: systemWithTopic, messages: contextMessages };
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

  const sections = (journal.sections ?? {}) as Partial<Record<JournalSectionKey, string>>;
  const userPrompt = buildV2SectionPrompt(
    sectionKey,
    topic,
    sections,
    journal.title ?? '',
  );

  const { system, messages } = await buildJournalGenerateMessages(
    journalNumber,
    sectionKey,
    userPrompt,
  );

  const content = (await llmComplete({
    system,
    messages: [
      ...messages,
      { role: 'user', content: userPrompt },
    ],
    model:     getDeepModel(),
    maxTokens: ENV.ADAM_JOURNAL_MAX_TOKENS,
  })).trim();

  if (!content) throw new Error(`ADAM returned empty content for section "${sectionKey}".`);

  console.log(
    '[journal:generate]',
    JSON.stringify({
      journalNumber,
      sectionKey,
      wordCount: countWords(content),
      chars:     content.length,
    }),
  );

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
