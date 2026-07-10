/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

// ============================================================
// QXK24 ADAM Teaching Engine — Journal Generation Service
// File: src/adam/adam-journal.service.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { analyzeJournalDeterministically } from '../qxk24brain/deep-ul/journal-ul-engine';
import { ADAMJournalModel } from './adam.schema';
import { endOfMalaysiaDay, startOfMalaysiaDay } from './adam-journal-daily-segment';
import type {
  AlamtologiAcademicJournal,
  JournalCategory,
  JournalContent,
  PrincipleAnalysis,
  AlamtologiPrinciple,
  ConstitutionalJudgment,
  ContributionValue,
  HukumZResult,
  TahapAkal,
} from './adam.types';
import { PRINCIPLE_WEIGHTS } from './adam.types';
import { getAuditHistory, runADAMAudit } from './adam-audit.service';
import type { ADAMAuditReport } from './adam.types';
import { FOUNDER_USER_ID } from './adam-student.types';
import { buildMongoRegexFromLiteral } from '../qxk24brain/mongo-regex-safe';
import type { AdamJournalSeal } from './adam-chat-response-parser';
import {
  countJournalWords,
  JOURNAL_TARGET_WORD_MIN,
  meetsJournalLengthMinimum,
} from './adam-journal.constants';
import {
  adamClaimsJournalSaved,
  adamDeclinesJournalSeal,
  founderWantsJournalDraft,
  founderWantsJournalSeal,
  founderWantsJournalWrite,
  hasSubstantiveManuscriptProse,
  isPlaceholderJournalTitle,
  parseJournalSealBlocks,
  parseLooseAdamJson,
  shouldAttemptFounderJournalSeal,
  validateAdamJournalSeal,
} from './adam-chat-response-parser';
import { prepareJournalProseForDisplay } from './adam-journal-formula';
import { loadMessageHistory } from './adam-chat-session.service';
import { normalizeJournalContent, normalizePrinciplesFocus } from './adam-principle-normalize';
import { validateDailyTopicSeal } from './adam-journal-daily-segment';
import {
  extractLockedTopicIdFromMessage,
  extractTopicIdFromAdamTransparency,
  getTopicById,
} from './adam-journal-manual-prompt';
import { findUniversityTopicById } from './adam-university-knowledge';
import { assembleManuscriptFromSections } from './adam-journal-section-writer';
import { allJournalSectionsComplete } from './adam-journal-section.types';
import type { JournalSectionId } from './adam-journal-section.types';
import {
  draftSectionsToJournalContent,
  resolveJournalFieldsFromMongoDoc,
  sectionsFromJournalMongoDoc,
} from './adam-journal-section-map';
import { JOURNAL_DRAFT_LOCALE } from './adam-journal-language.config';
import { ensureEnglishPublicationManuscript } from './journal-translation.service';

// ─── Generate Journal Number ──────────────────────────────────

async function generateJournalNumber(): Promise<string> {
  const count = await ADAMJournalModel.countDocuments({ status: 'PUBLISHED' });
  const seq   = String(count + 1).padStart(3, '0');
  const year  = new Date().getFullYear();
  return `ALM-J${year}-${seq}`;
}

// ─── Calculate AHRI Score ─────────────────────────────────────

function calculateAHRI(analyses: PrincipleAnalysis[]): number {
  let total = 0;
  for (const a of analyses) {
    const weight = PRINCIPLE_WEIGHTS[a.principle] ?? 0;
    total += weight * (a.score / 100) * 100;
  }
  return Math.min(Math.round(total), 100);
}

// ─── Build Journal Generation Prompt ─────────────────────────

function buildJournalPrompt(input: {
  title:           string;
  abstract:        string;
  rawContent:      string;
  category:        JournalCategory;
  principlesFocus: AlamtologiPrinciple[];
  authorName:      string;
}): string {
  return `You are ADAM performing Alamtologi Academic Standard journal analysis.
The standard is defined by Founder P.alt Masa Bayu — you apply and format; you do not invent constitutional or academic law.

JOURNAL TITLE: ${input.title}
AUTHOR: ${input.authorName}
CATEGORY: ${input.category}
PRINCIPLES FOCUS: ${input.principlesFocus.join(', ')}
ABSTRACT: ${input.abstract}

RAW CONTENT:
${input.rawContent}

Analyse this journal according to the Alamtologi Academic Standard and return ONLY a JSON object:
{
  "content": {
    "introduction": "structured introduction paragraph",
    "background": "background and context paragraph",
    "methodology": "methodology description",
    "alamtologiAnalysis": [
      {
        "principle": "MASA",
        "weight": 0.18,
        "score": 0-100,
        "analysis": "analysis of how this principle manifests",
        "evidence": ["evidence point 1", "evidence point 2"]
      }
    ],
    "findings": "key findings paragraph",
    "discussion": "discussion paragraph",
    "conclusion": "conclusion paragraph",
    "references": ["reference 1", "reference 2"]
  },
  "hukumZAnalysis": {
    "pola": "LULUS|GAGAL|BELUM",
    "kadar": "LULUS|GAGAL|BELUM",
    "pasangan": "LULUS|GAGAL|BELUM",
    "keseimbangan": "LULUS|GAGAL|BELUM"
  },
  "tahapAkalAchieved": 1-7,
  "cVLevel": 1-7,
  "judgment": "MAKMUR|ISLAH|WAQF",
  "reviewNotes": "ADAM's assessment notes for reviewer"
}

Include all seven principles in alamtologiAnalysis even if not the focus — score low ones near 0.
MAKMUR: all hukumZ LULUS, tahapAkal >= 5, ahri > 80
ISLAH: mixed hukumZ, tahapAkal 3-4
WAQF: critical constitutional gap found
Return ONLY the JSON. No markdown.`;
}

// ─── Submit Journal for Analysis ─────────────────────────────

export async function submitJournal(input: {
  title:           string;
  abstract:        string;
  rawContent:      string;
  category:        JournalCategory;
  principlesFocus: AlamtologiPrinciple[];
  authorName:      string;
  authorEmail:     string;
  authorOrg?:      string;
  source?:         'public_submit' | 'founder_adam' | 'founder_teaching';
  sourceSessionId?: string;
  knowledgeTopicId?:   string;
  knowledgeMajor?:     string;
  knowledgeDiscipline?: string;
  knowledgeSubfield?:  string;
}): Promise<AlamtologiAcademicJournal> {
  const analysis = analyzeJournalDeterministically({
    title:           input.title,
    abstract:        input.abstract,
    rawContent:      input.rawContent,
    principlesFocus: input.principlesFocus,
  });

  const analysedContent = analysis.content;
  const hukumZ = analysis.hukumZ;
  const tahapAkal = analysis.tahapAkal;
  const cVLevel = analysis.cVLevel;
  const judgment = analysis.judgment;
  const reviewNotes = analysis.reviewNotes;

  const ahriScore = analysis.ahriScore;

  const mapTopic = input.knowledgeTopicId
    ? getTopicById(input.knowledgeTopicId)
    : null;

  const doc = await ADAMJournalModel.create({
    title:              input.title,
    abstract:           input.abstract,
    category:           input.category,
    principlesFocus:    input.principlesFocus,
    knowledgeTopicId:   mapTopic?.topicId ?? input.knowledgeTopicId,
    knowledgeMajor:     mapTopic?.majorName ?? input.knowledgeMajor,
    knowledgeDiscipline: mapTopic?.disciplineName ?? input.knowledgeDiscipline,
    knowledgeSubfield:  mapTopic?.subfield ?? input.knowledgeSubfield,
    authorName:         input.authorName,
    authorEmail:        input.authorEmail,
    authorOrg:          input.authorOrg,
    content:            analysedContent,
    ahriScore,
    hukumZAnalysis:     hukumZ,
    tahapAkalAchieved:  tahapAkal,
    cVLevel,
    judgment,
    status:             'PENDING_REVIEW',
    submittedAt:        new Date(),
    reviewNotes,
    source:             input.source ?? 'public_submit',
    sourceSessionId:    input.sourceSessionId,
  });

  const journal = mapToJournal(doc);

  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'SUBMISSION',
      context:     `Post-submit analysis. ADAM judgment: ${judgment}. AHRI: ${ahriScore}. Status: PENDING_REVIEW.`,
    });
  } catch (err: unknown) {
    console.error('[Journal] SUBMISSION audit failed:', err);
  }

  return journal;
}

function extractTitleFromAdamText(text: string, userMessage: string): string {
  const fromMarkdownHeading = text.match(
    /^#{1,3}\s+\*{0,2}([^*\n]+?)\*{0,2}\s*$/m,
  );
  if (fromMarkdownHeading?.[1] && !isPlaceholderJournalTitle(fromMarkdownHeading[1])) {
    return fromMarkdownHeading[1].trim().slice(0, 300);
  }

  const quotedTitle = text.match(
    /[“"']([^”"'\n]{20,200}?)[”"']\s*,?\s*\n/i,
  );
  if (quotedTitle?.[1] && !isPlaceholderJournalTitle(quotedTitle[1])) {
    return quotedTitle[1].trim().slice(0, 300);
  }

  const fromHeading = text.match(/^#\s+(.+)$/m);
  if (fromHeading?.[1] && !isPlaceholderJournalTitle(fromHeading[1])) {
    return fromHeading[1].trim().slice(0, 300);
  }

  const fromLabel = text.match(/(?:^|\n)(?:Title|Tajuk)[:\s]+(.+)$/im);
  if (fromLabel?.[1] && !isPlaceholderJournalTitle(fromLabel[1])) {
    return fromLabel[1].trim().slice(0, 300);
  }

  const fromUser = userMessage.match(
    /(Model Alamtologi[^\n.]{5,120}|MAK-XZ[^\n.]{0,80})/i,
  );
  if (fromUser?.[1]) return fromUser[1].trim().slice(0, 300);

  const line = text.split('\n').map((l) => l.trim()).find(
    (l) => l.length > 20 && !isPlaceholderJournalTitle(l),
  );
  return line?.slice(0, 300) ?? 'Founder journal — ADAM draft';
}

function extractAbstractFromAdamText(text: string): string {
  const labelled = text.match(
    /(?:^|\n)(?:Abstract|Abstrak)[:\s]*\n?([\s\S]{80,2500}?)(?:\n#{1,3}\s|\n\d+\.\s|$)/i,
  );
  if (labelled?.[1]) return labelled[1].trim().slice(0, 3000);

  const para = text.split(/\n\n+/).map((p) => p.trim()).find((p) => p.length >= 100);
  return (para ?? text).trim().slice(0, 3000);
}

function padAbstract(text: string): string {
  const t = text.trim();
  if (t.length >= 100) return t.slice(0, 3000);
  return `${t} ${'Alamtologi constitutional manuscript sealed from Founder teaching with ADAM.'.repeat(3)}`.slice(0, 3000);
}

/**
 * Fallback when ADAM says "saved" in prose but omits <adam_journal_seal> JSON.
 * Structures the visible ADAM reply into a PENDING_REVIEW journal.
 */
export async function sealFounderJournalFromChatFallback(input: {
  adamText:        string;
  userMessage:     string;
  sourceSessionId?: string;
  lockedTopicId?:  string;
}): Promise<AlamtologiAcademicJournal> {
  const manuscript = input.adamText.trim();
  const raw = prepareJournalProseForDisplay(manuscript);
  if (raw.length < 500) {
    throw new Error('ADAM response too short to seal as journal');
  }
  if (adamDeclinesJournalSeal(raw)) {
    throw new Error('ADAM declined to seal — no manuscript in this reply');
  }
  if (!hasSubstantiveManuscriptProse(manuscript)) {
    throw new Error('Reply has no IMRaD manuscript — meta-discussion only');
  }

  const title = extractTitleFromAdamText(raw, input.userMessage);
  if (isPlaceholderJournalTitle(title)) {
    throw new Error('Could not extract a valid journal title from ADAM reply');
  }
  const abstract = padAbstract(extractAbstractFromAdamText(raw));

  const topicId =
    input.lockedTopicId?.trim()
    ?? extractLockedTopicIdFromMessage(input.userMessage)
    ?? extractTopicIdFromAdamTransparency(manuscript);
  const topic = topicId ? getTopicById(topicId) : null;
  if (!topic) {
    throw new Error(
      'knowledgeTopicId required — say "Tulis jurnal" so ADAM selects a topic from session teaching before saving.',
    );
  }

  const journal = await submitJournal({
    title:           title.length >= 10 ? title : `${title} — ADAM`,
    abstract,
    rawContent:      raw,
    category:        'RESEARCH',
    principlesFocus: [topic.alamtologiLens],
    authorName:      'Masa Bayu',
    authorEmail:     FOUNDER_JOURNAL_EMAIL,
    authorOrg:       'Alamtologi · Alamtologi',
    source:          'founder_teaching',
    sourceSessionId: input.sourceSessionId,
    knowledgeTopicId:   topic.topicId,
    knowledgeMajor:     topic.majorName,
    knowledgeDiscipline: topic.disciplineName,
    knowledgeSubfield:  topic.subfield,
  });

  if (input.sourceSessionId) {
    await ADAMJournalModel.deleteMany({
      sourceSessionId:  input.sourceSessionId,
      knowledgeTopicId: topic.topicId,
      status:           'DRAFT',
    });
  }

  return journal;
}

/** Select prose source for seal — section manuscript never merges session corpus. */
export function selectFounderJournalProseSource(input: {
  sectionManuscriptOnly?: string | null;
  sectionJournalComplete?: boolean;
  fullResponse:            string;
  sessionCorpus?:          string;
}): string | null {
  const sectionOnly = input.sectionManuscriptOnly?.trim() || null;
  if (sectionOnly) {
    return hasSubstantiveManuscriptProse(sectionOnly) || input.sectionJournalComplete
      ? sectionOnly
      : null;
  }
  const corpus = input.sessionCorpus ?? '';
  if (hasSubstantiveManuscriptProse(corpus)) return corpus;
  if (hasSubstantiveManuscriptProse(input.fullResponse)) return input.fullResponse;
  return null;
}

/** True when section mode must not load session message corpus. */
export function sectionModeSkipsSessionCorpus(sectionManuscriptOnly?: string | null): boolean {
  return Boolean(sectionManuscriptOnly?.trim());
}

/** Recent ADAM replies in this session plus the current turn (not yet persisted). */
export async function gatherFounderJournalCorpus(
  sessionId: string,
  currentAdamText: string,
): Promise<string> {
  const history = await loadMessageHistory(sessionId, 24);
  const parts = history
    .filter((m) => m.role === 'adam')
    .map((m) => m.content.trim())
    .filter(Boolean);

  const cur = currentAdamText.trim();
  if (cur && parts[parts.length - 1] !== cur) {
    parts.push(cur);
  }

  return parts.join('\n\n---\n\n');
}

export interface FounderJournalSealResult {
  sealedJournals: { id: string; title: string }[];
  sealErrors:       string[];
}

/** Resolve full assembled manuscript — stream output or MongoDB section draft. */
async function resolveAssembledSectionManuscript(input: {
  sessionId:               string;
  topicId?:                string;
  sectionManuscriptOnly?:  string | null;
  sectionJournalComplete?: boolean;
}): Promise<{
  manuscript:      string | null;
  complete:        boolean;
  source:          string;
  sections:        Partial<Record<JournalSectionId, string>> | null;
  draftJournalId?: string;
}> {
  const explicit = input.sectionManuscriptOnly?.trim();
  if (explicit) {
    return {
      manuscript: explicit,
      complete:   Boolean(input.sectionJournalComplete),
      source:     'stream',
      sections:   null,
    };
  }

  const topicId = input.topicId?.trim();
  if (!topicId) {

    return { manuscript: null, complete: false, source: 'none', sections: null };
  }

  let bySession = false;
  let doc: {
    _id: unknown;
    draftSections?: unknown;
    sections?: unknown;
  } | null = null;

  if (input.sessionId) {
    doc = await ADAMJournalModel.findOne({
      sourceSessionId:  input.sessionId,
      knowledgeTopicId: topicId,
      status:           'DRAFT',
    })
      .sort({ updatedAt: -1 })
      .lean();
  }

  let sections = sectionsFromJournalMongoDoc(doc);
  if (Object.keys(sections).length > 0 && doc) {
    bySession = true;
  } else {
    doc = await ADAMJournalModel.findOne({
      knowledgeTopicId: topicId,
      status:           'DRAFT',
    })
      .sort({ updatedAt: -1 })
      .lean();
    sections = sectionsFromJournalMongoDoc(doc);
    bySession = false;
  }

  if (!doc || Object.keys(sections).length === 0) {

    return { manuscript: null, complete: false, source: 'none', sections: null };
  }

  const assembled = assembleManuscriptFromSections(sections);
  const words = countJournalWords(assembled);
  const complete = allJournalSectionsComplete(sections);
  const draftJournalId = String(doc._id);

  return {
    manuscript:     assembled,
    complete,
    source:         'mongodb-draft',
    sections,
    draftJournalId,
  };
}

/** Upgrade section DRAFT in adam_journals → PENDING_REVIEW (no second LLM pass). */
async function sealSectionDraftToPendingReview(input: {
  sessionId:      string;
  topicId:        string;
  sections:       Partial<Record<JournalSectionId, string>>;
  manuscript:     string;
  draftJournalId?: string;
}): Promise<AlamtologiAcademicJournal> {
  const topicId = input.topicId.trim();
  const topic = findUniversityTopicById(topicId);
  if (!topic) throw new Error(`Unknown knowledgeTopicId: ${topicId}`);

  const manuscript = input.manuscript.trim();
  const totalWords = countJournalWords(manuscript);

  const existingPending = await ADAMJournalModel.findOne({
    knowledgeTopicId: topicId,
    status:           'PENDING_REVIEW',
    sourceSessionId:  input.sessionId,
  }).lean();

  if (existingPending) {
    const journal = mapToJournal(existingPending);
    return journal;
  }

  let doc = input.draftJournalId
    ? await ADAMJournalModel.findById(input.draftJournalId)
    : null;

  if (!doc) {
    doc = await ADAMJournalModel.findOne({
      sourceSessionId:  input.sessionId,
      knowledgeTopicId: topicId,
      status:           'DRAFT',
    }).sort({ updatedAt: -1 });
  }

  if (!doc) {
    doc = await ADAMJournalModel.findOne({
      knowledgeTopicId: topicId,
      status:           'DRAFT',
    }).sort({ updatedAt: -1 });
  }

  const content = draftSectionsToJournalContent(input.sections);
  const title =
    doc?.title?.trim()
    || input.sections.title_and_abstract?.match(/^#\s+(.+)$/m)?.[1]?.trim()
    || `Alamtologi — ${topic.label}`;

  if (doc) {
    doc.content = content;
    doc.title = title.slice(0, 300);
    doc.status = 'PENDING_REVIEW';
    doc.source = 'founder_teaching';
    doc.sourceSessionId = input.sessionId;
    doc.sessionId = input.sessionId;
    doc.topicId = topicId;
    doc.knowledgeTopicId = topicId;
    doc.totalWords = totalWords;
    doc.sourceLanguage = JOURNAL_DRAFT_LOCALE;
    doc.submittedAt = new Date();
    doc.reviewNotes =
      doc.reviewNotes?.trim()
      || 'Sealed from ADAM section draft — awaiting P.alt review (Lulus).';
    doc.draftSections = undefined;
    doc.lastCompletedSection = undefined;
    await doc.save();
  } else {
    doc = await ADAMJournalModel.create({
      title:              title.slice(0, 300),
      abstract:           manuscript.slice(0, 500).trim(),
      category:           'RESEARCH',
      principlesFocus:    [topic.alamtologiLens],
      authorName:         'Masa Bayu',
      authorEmail:        FOUNDER_JOURNAL_EMAIL,
      authorOrg:          'Alamtologi · Alamtologi',
      content,
      status:             'PENDING_REVIEW',
      source:             'founder_teaching',
      sourceSessionId:    input.sessionId,
      sessionId:          input.sessionId,
      topicId,
      knowledgeTopicId:   topicId,
      knowledgeMajor:     topic.majorName,
      knowledgeDiscipline: topic.disciplineName,
      knowledgeSubfield:  topic.subfield,
      totalWords,
      sourceLanguage:     JOURNAL_DRAFT_LOCALE,
      submittedAt:        new Date(),
      reviewNotes:        'Sealed from ADAM section manuscript — awaiting P.alt review (Lulus).',
      ahriScore:          0,
      tahapAkalAchieved:  3,
      cVLevel:            3,
      judgment:           'ISLAH',
    });
  }

  const journal = mapToJournal(doc);

  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'SUBMISSION',
      context:     `Section draft sealed. Topic: ${topic.label}. Words: ${totalWords}. Session: ${input.sessionId}.`,
    });
  } catch (err: unknown) {
    console.error('[Journal] Section seal audit failed:', err);
  }

  return journal;
}

/** Section-by-section V2 pipeline — skip auto-seal until all 9 movements or explicit seal. */
export function isSectionJournalPipelineInProgress(input: {
  sectionJournalComplete?: boolean;
  sectionManuscriptOnly?: string | null;
  sectionDraft?:           unknown;
}): boolean {
  return input.sectionJournalComplete === false
    && Boolean(input.sectionManuscriptOnly ?? input.sectionDraft);
}

/** Seal from JSON tag and/or session manuscript when ADAM omits the tag in the latest reply. */
export async function processFounderJournalSeal(input: {
  sessionId:               string;
  userMessage:             string;
  fullResponse:            string;
  finalResponse:           string;
  sealsFromReply:          AdamJournalSeal[];
  lockedTopicId?:          string;
  /** Assembled section manuscript — do not merge prior session turns. */
  sectionManuscriptOnly?:  string;
  sectionJournalComplete?: boolean;
  /** Raw section map from section writer (when stream just completed). */
  sectionDraft?:           Partial<Record<JournalSectionId, string>>;
  /** When true, always attempt seal (section complete or explicit seal phrase). */
  forceSealAttempt?:      boolean;
}): Promise<FounderJournalSealResult> {
  const sealedJournals: { id: string; title: string }[] = [];
  const sealErrors: string[] = [];

  const resolvedTopicId =
    input.lockedTopicId?.trim()
    ?? extractLockedTopicIdFromMessage(input.userMessage)
    ?? extractTopicIdFromAdamTransparency(input.fullResponse)
    ?? extractTopicIdFromAdamTransparency(input.finalResponse);

  const trySealList = async (seals: AdamJournalSeal[]) => {
    for (const seal of seals) {
      try {
        if (resolvedTopicId && !seal.knowledgeTopicId) {
          seal.knowledgeTopicId = resolvedTopicId;
        }
        const check = await validateDailyTopicSeal(seal.knowledgeTopicId);
        if (!check.ok) {
          sealErrors.push(check.reason ?? 'Invalid daily topic seal.');
          if (!check.topic) continue;
        }
        const j = await sealFounderJournalFromAdam(seal, input.sessionId);
        sealedJournals.push({ id: j.id, title: j.title });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Journal] Founder seal from chat failed:', err);
        sealErrors.push(msg);
      }
    }
  };

  if (input.sealsFromReply.length > 0) {
    await trySealList(input.sealsFromReply);
    return { sealedJournals, sealErrors };
  }

  const wantsJournalWork =
    founderWantsJournalWrite(input.userMessage)
    || founderWantsJournalDraft(input.userMessage)
    || founderWantsJournalSeal(input.userMessage);

  const sectionPipelineInProgress = isSectionJournalPipelineInProgress({
    sectionJournalComplete: input.sectionJournalComplete,
    sectionManuscriptOnly:  input.sectionManuscriptOnly,
    sectionDraft:           input.sectionDraft,
  });

  const attempt =
    input.forceSealAttempt
    || founderWantsJournalSeal(input.userMessage)
    || (
      !sectionPipelineInProgress
      && (
        wantsJournalWork
        || shouldAttemptFounderJournalSeal(input.userMessage, input.finalResponse)
        || shouldAttemptFounderJournalSeal(input.userMessage, input.fullResponse)
      )
    );

  if (attempt) {

  }

  if (!attempt) {
    return { sealedJournals, sealErrors };
  }

  const resolvedTopicForDraft =
    resolvedTopicId
    ?? extractLockedTopicIdFromMessage(input.userMessage)
    ?? extractTopicIdFromAdamTransparency(input.fullResponse);

  const assembled = await resolveAssembledSectionManuscript({
    sessionId:              input.sessionId,
    topicId:                resolvedTopicForDraft,
    sectionManuscriptOnly:  input.sectionManuscriptOnly,
    sectionJournalComplete: input.sectionJournalComplete,
  });

  const sectionOnly = assembled.manuscript;
  const sectionComplete = assembled.complete || Boolean(input.sectionJournalComplete);
  const sectionMap = assembled.sections ?? input.sectionDraft ?? null;
  const draftJournalId = assembled.draftJournalId;

  let proseSource: string | null = null;
  if (sectionOnly) {
    proseSource = selectFounderJournalProseSource({
      sectionManuscriptOnly:  sectionOnly,
      sectionJournalComplete: sectionComplete,
      fullResponse:           input.fullResponse,
    });
  } else {
    const corpus = await gatherFounderJournalCorpus(input.sessionId, input.fullResponse);
    proseSource = selectFounderJournalProseSource({
      fullResponse:  input.fullResponse,
      sessionCorpus: corpus,
    });
  }

  const corpusForSeals = sectionOnly
    ? sectionOnly
    : await gatherFounderJournalCorpus(input.sessionId, input.fullResponse);

  if (
    adamDeclinesJournalSeal(input.finalResponse) &&
    !proseSource
  ) {
    sealErrors.push(
      'Tiada draf jurnal V2 dalam sesi ini. Taip "Tulis jurnal" atau "full V2 journal" — ADAM pilih topik, tulis 9 bahagian (minimum 4,000 perkataan), simpan automatik ke semakan.',
    );
    return { sealedJournals, sealErrors };
  }

  const fromCorpus = parseJournalSealBlocks(corpusForSeals);
  if (fromCorpus.seals.length > 0) {
    await trySealList([fromCorpus.seals[fromCorpus.seals.length - 1]!]);
    if (sealedJournals.length > 0) return { sealedJournals, sealErrors };
  }

  const claimsSaved =
    adamClaimsJournalSaved(input.finalResponse)
    || adamClaimsJournalSaved(input.fullResponse)
    || (sectionOnly ? false : adamClaimsJournalSaved(corpusForSeals));

  const autoSaveEligible =
    proseSource
    && !adamDeclinesJournalSeal(proseSource)
    && (hasSubstantiveManuscriptProse(proseSource) || sectionComplete)
    && (
      claimsSaved
      || wantsJournalWork
      || sectionComplete
    );

  if (autoSaveEligible && proseSource) {
    const manuscript = proseSource;
    const words = countJournalWords(manuscript);
    if (!meetsJournalLengthMinimum(manuscript)) {
      sealErrors.push(
        sectionComplete
          ? `Jurnal lengkap (${words.toLocaleString()} perkataan) tetapi belum mencapai minimum ${JOURNAL_TARGET_WORD_MIN.toLocaleString()} perkataan. Taip "Tulis jurnal" sekali lagi untuk melengkapkan bahagian yang kurang.`
          : `Jurnal belum cukup panjang (minimum ${JOURNAL_TARGET_WORD_MIN.toLocaleString()} perkataan). ADAM akan sambung menulis — tunggu sehingga siap.`,
      );
      return { sealedJournals, sealErrors };
    }

    try {
      const topicForSeal = resolvedTopicId ?? resolvedTopicForDraft;
      if (
        sectionComplete
        && sectionMap
        && allJournalSectionsComplete(sectionMap)
        && topicForSeal
      ) {
        const j = await sealSectionDraftToPendingReview({
          sessionId:      input.sessionId,
          topicId:        topicForSeal,
          sections:       sectionMap,
          manuscript,
          draftJournalId,
        });
        sealedJournals.push({ id: j.id, title: j.title });
        return { sealedJournals, sealErrors };
      }

      const j = await sealFounderJournalFromChatFallback({
        adamText:        manuscript,
        userMessage:     input.userMessage,
        sourceSessionId: input.sessionId,
        lockedTopicId:   resolvedTopicId,
      });
      sealedJournals.push({ id: j.id, title: j.title });
      return { sealedJournals, sealErrors };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Journal] Founder auto-save failed:', err);
      sealErrors.push(msg);
    }
  }

  if (wantsJournalWork) {
    if (!proseSource) {
      sealErrors.push(
        'Tiada draf jurnal V2 dalam sesi. Taip "Tulis jurnal" — ADAM tulis 9 bahagian, minimum 4,000 perkataan.',
      );
    } else if (sectionOnly && !sectionComplete) {
      sealErrors.push(
        'Jurnal dalam proses — bahagian belum lengkap. Taip "Tulis jurnal" sekali lagi untuk sambung dari draf tersimpan.',
      );
    } else if (claimsSaved) {
      sealErrors.push(
        'ADAM kata jurnal disimpan tetapi sistem belum dapat simpan. Tunggu sambungan menulis selesai, atau taip "Tulis jurnal" sekali lagi.',
      );
    } else if (proseSource) {
      sealErrors.push(
        'Draf jurnal V2 wujud tetapi belum cukup panjang atau belum lengkap (9 bahagian). ADAM akan sambung menulis — tunggu sehingga minimum 4,000 perkataan.',
      );
    } else {
      sealErrors.push(
        'Tiada manuskrip jurnal V2 dalam balasan ini. Taip "Tulis jurnal" — ADAM menulis 9 bahagian, sistem simpan automatik.',
      );
    }
  } else if (claimsSaved) {
    sealErrors.push(
      'ADAM kata jurnal disimpan tetapi sistem belum dapat simpan. Semak /adam/journals/review atau taip "Tulis jurnal" sekali lagi.',
    );
  }

  return { sealedJournals, sealErrors };
}

const FOUNDER_JOURNAL_EMAIL = `${FOUNDER_USER_ID}@alamtologi.com`;

/**
 * Founder-only: ADAM seals a journal from chat (pre-analysed JSON — no second LLM call).
 * Lands in PENDING_REVIEW for one-click Founder approval → home screen.
 */
export async function sealFounderJournalFromAdam(
  seal: AdamJournalSeal,
  sourceSessionId?: string,
): Promise<AlamtologiAcademicJournal> {
  const content = normalizeJournalContent(seal.content);
  const invalid = validateAdamJournalSeal({ ...seal, content });
  if (invalid) throw new Error(invalid);
  const hukumZ = seal.hukumZAnalysis ?? {
    pola: 'BELUM', kadar: 'BELUM', pasangan: 'BELUM', keseimbangan: 'BELUM',
  };
  const tahapAkal = seal.tahapAkalAchieved ?? 3;
  const cVLevel = seal.cVLevel ?? 3;
  const judgment = seal.judgment ?? 'ISLAH';
  const ahriScore = calculateAHRI(content.alamtologiAnalysis ?? []);

  const topic = findUniversityTopicById(seal.knowledgeTopicId ?? '');
  if (!topic) {
    throw new Error(
      'knowledgeTopicId required — each daily journal maps to exactly one university subfield from the map.',
    );
  }
  const principlesFocus = normalizePrinciplesFocus(
    seal.principlesFocus?.length
      ? seal.principlesFocus
      : [topic.alamtologiLens],
  );

  const doc = await ADAMJournalModel.create({
    title:              seal.title,
    abstract:           seal.abstract,
    category:           seal.category ?? 'RESEARCH',
    principlesFocus,
    knowledgeTopicId:   topic.topicId,
    knowledgeMajor:     seal.knowledgeMajor ?? topic.majorName,
    knowledgeDiscipline: seal.knowledgeDiscipline ?? topic.disciplineName,
    knowledgeSubfield:  seal.knowledgeSubfield ?? topic.subfield,
    authorName:         seal.authorName ?? 'Masa Bayu',
    authorEmail:        FOUNDER_JOURNAL_EMAIL,
    authorOrg:          'Alamtologi · Alamtologi',
    content,
    ahriScore,
    hukumZAnalysis:     hukumZ,
    tahapAkalAchieved:  tahapAkal,
    cVLevel,
    judgment,
    status:             'PENDING_REVIEW',
    submittedAt:        new Date(),
    reviewNotes:        seal.reviewNotes ?? 'Sealed by ADAM from Founder teaching — awaiting P.alt review.',
    source:             'founder_teaching',
    sourceSessionId:    sourceSessionId ?? undefined,
  });

  const journal = mapToJournal(doc);

  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'SUBMISSION',
      context:     `Founder ADAM seal. Topic: ${topic.label}. Judgment: ${judgment}. AHRI: ${ahriScore}. Session: ${sourceSessionId ?? 'n/a'}.`,
    });
  } catch (err: unknown) {
    console.error('[Journal] Founder seal audit failed:', err);
  }

  return journal;
}

// ─── Get Journal ──────────────────────────────────────────────

export async function getJournal(id: string): Promise<AlamtologiAcademicJournal | null> {
  const doc = await ADAMJournalModel.findById(id).lean();
  if (!doc) return null;
  return mapToJournal(doc);
}

export async function getJournalAudits(journalId: string): Promise<ADAMAuditReport[]> {
  return getAuditHistory(journalId, 'JOURNAL');
}

// ─── List Journals ────────────────────────────────────────────

const JOURNAL_LIST_SUMMARY_SELECT =
  'title abstract category principlesFocus authorName ahriScore hukumZAnalysis tahapAkalAchieved cVLevel judgment status submittedAt reviewedAt publishedAt reviewNotes journalNumber knowledgeTopicId knowledgeMajor knowledgeDiscipline knowledgeSubfield source';

const EMPTY_JOURNAL_CONTENT: AlamtologiAcademicJournal['content'] = {
  introduction:        '',
  background:          '',
  methodology:         '',
  alamtologiAnalysis:  [],
  findings:            '',
  discussion:          '',
  conclusion:          '',
  references:          [],
};

export interface JournalListFilter {
  status?:            string;
  judgment?:          string;
  limit?:             number;
  skip?:              number;
  q?:                 string;
  /** Malaysia calendar day YYYY-MM-DD (submittedAt) */
  date?:              string;
  /** Published month YYYY-MM (publishedAt, public catalogue) */
  publishedMonth?:    string;
  knowledgeMajor?:    string;
  knowledgeTopicId?:  string;
  /** Omit full IMRaD body — safe for 600+ row lists */
  summary?:           boolean;
}

function buildJournalListQuery(filter: JournalListFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (filter.status)            query.status            = filter.status;
  if (filter.judgment)          query.judgment          = filter.judgment;
  if (filter.knowledgeMajor)    query.knowledgeMajor    = filter.knowledgeMajor;
  if (filter.knowledgeTopicId)  query.knowledgeTopicId  = filter.knowledgeTopicId;

  if (filter.date?.trim()) {
    const day = new Date(`${filter.date.trim()}T12:00:00+08:00`);
    query.submittedAt = { $gte: startOfMalaysiaDay(day), $lte: endOfMalaysiaDay(day) };
  }

  if (filter.publishedMonth?.trim()) {
    const [y, m] = filter.publishedMonth.trim().split('-');
    if (y && m) {
      const monthStart = new Date(`${y}-${m}-01T00:00:00+08:00`);
      const nextMonth = new Date(monthStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      query.publishedAt = { $gte: monthStart, $lt: nextMonth };
    }
  }

  const q = filter.q?.trim();
  if (q) {
    const rx = buildMongoRegexFromLiteral(q);
    if (!rx) return query;
    query.$or = [
      { title: rx },
      { abstract: rx },
      { knowledgeSubfield: rx },
      { knowledgeDiscipline: rx },
      { knowledgeTopicId: rx },
      { authorName: rx },
      { journalNumber: rx },
    ];
  }

  return query;
}

export async function listJournals(
  filter: JournalListFilter,
): Promise<{ journals: AlamtologiAcademicJournal[]; total: number }> {
  const query = buildJournalListQuery(filter);
  const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);
  const skip  = Math.max(filter.skip ?? 0, 0);

  let finder = ADAMJournalModel.find(query)
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit);

  if (filter.summary) {
    finder = finder.select(JOURNAL_LIST_SUMMARY_SELECT) as typeof finder;
  }

  const [docs, total] = await Promise.all([
    finder.lean(),
    ADAMJournalModel.countDocuments(query),
  ]);

  const summary = Boolean(filter.summary);
  return {
    journals: docs.map((doc) => mapToJournal(doc, { summary })),
    total,
  };
}

export const REVIEW_CHAIN_MAX = 700;

/** Ordered journal ids for keyboard prev/next in founder review */
export async function getJournalReviewChain(
  filter: JournalListFilter,
): Promise<{ ids: string[]; total: number }> {
  const query = buildJournalListQuery(filter);
  const limit = Math.min(filter.limit ?? REVIEW_CHAIN_MAX, REVIEW_CHAIN_MAX);

  const [docs, total] = await Promise.all([
    ADAMJournalModel.find(query)
      .sort({ submittedAt: -1 })
      .select('_id')
      .limit(limit)
      .lean(),
    ADAMJournalModel.countDocuments(query),
  ]);

  return {
    ids: docs.map((d) => d._id.toString()),
    total,
  };
}

export interface BulkApproveJournalsOptions {
  date?:             string;
  status?:           string;
  knowledgeMajor?:   string;
  q?:                string;
  ids?:              string[];
  reviewNotes?:      string;
  publish?:          boolean;
  limit?:            number;
}

export interface BulkApproveJournalsResult {
  requested:  number;
  processed:  number;
  published:  number;
  skipped:    number;
  failures:   { id: string; error: string }[];
}

/** Founder bulk approve + publish (capped per request) */
export async function bulkApproveJournals(
  opts: BulkApproveJournalsOptions,
): Promise<BulkApproveJournalsResult> {
  const cap = Math.min(Math.max(opts.limit ?? 25, 1), 50);
  const notes = opts.reviewNotes?.trim() || 'Bulk Founder approval.';
  const publish = opts.publish !== false;

  let ids = opts.ids?.map((id) => id.trim()).filter(Boolean) ?? [];
  if (ids.length === 0) {
    const chain = await getJournalReviewChain({
      date:           opts.date,
      status:         opts.status ?? 'PENDING_REVIEW',
      knowledgeMajor: opts.knowledgeMajor,
      q:              opts.q,
      limit:          cap,
    });
    ids = chain.ids;
  } else {
    ids = ids.slice(0, cap);
  }

  let processed = 0;
  let published = 0;
  let skipped = 0;
  const failures: { id: string; error: string }[] = [];

  for (const id of ids) {
    try {
      const doc = await ADAMJournalModel.findById(id).select('status').lean();
      if (!doc || doc.status !== 'PENDING_REVIEW') {
        skipped += 1;
        continue;
      }
      const result = await approveJournal(id, notes, { publish });
      if (result) {
        processed += 1;
        if (result.status === 'PUBLISHED') published += 1;
      } else {
        skipped += 1;
      }
    } catch (err: unknown) {
      failures.push({
        id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { requested: ids.length, processed, published, skipped, failures };
}

/** Public catalogue — published journals only (summary rows) */
export async function listPublishedJournals(
  limit = 24,
  skip = 0,
  extra: Omit<JournalListFilter, 'status' | 'limit' | 'skip'> = {},
) {
  return listJournals({
    status:  'PUBLISHED',
    limit,
    skip,
    summary: true,
    ...extra,
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Manuscripts owned by a student account */
export async function listJournalsForStudent(
  userId: string,
  userName: string,
  limit = 20,
): Promise<AlamtologiAcademicJournal[]> {
  const canonicalEmail = `${userId}@student.alamtologi.com`;
  const docs = await ADAMJournalModel.find({
    $or: [
      { authorEmail: canonicalEmail },
      { authorEmail: new RegExp(`^${escapeRegex(userId)}@`, 'i') },
      { authorName: new RegExp(`^${escapeRegex(userName.trim())}$`, 'i') },
    ],
  })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .lean();

  return docs.map((doc) => mapToJournal(doc));
}

// ─── Approve and Publish Journal ─────────────────────────────

export async function approveJournal(
  id: string,
  reviewNotes: string,
  options: { publish?: boolean } = { publish: true },
): Promise<AlamtologiAcademicJournal | null> {
  const doc = await ADAMJournalModel.findById(id);
  if (!doc || doc.status !== 'PENDING_REVIEW') return null;

  doc.status      = 'APPROVED';
  doc.reviewedAt  = new Date();
  doc.reviewNotes = reviewNotes;
  await doc.save();

  const journal = mapToJournal(doc);
  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'APPROVAL',
      context:     `Founder approved. Review notes: ${reviewNotes || '(none)'}. Prior judgment: ${journal.judgment}.`,
    });
  } catch (err: unknown) {
    console.error('[Journal] APPROVAL audit failed:', err);
  }

  if (options.publish !== false) {
    return publishJournal(id);
  }

  return journal;
}

export async function publishJournal(id: string): Promise<AlamtologiAcademicJournal | null> {
  const doc = await ADAMJournalModel.findById(id);
  if (!doc || doc.status !== 'APPROVED') return null;

  await ensureEnglishPublicationManuscript(id);

  const refreshed = await ADAMJournalModel.findById(id);
  if (!refreshed || refreshed.status !== 'APPROVED') return null;

  refreshed.status        = 'PUBLISHED';
  refreshed.publishedAt   = new Date();
  if (!refreshed.journalNumber) {
    refreshed.journalNumber = await generateJournalNumber();
  }
  await refreshed.save();

  const journal = mapToJournal(refreshed);
  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'PUBLICATION',
      context:     `Published as ${journal.journalNumber}. AHRI: ${journal.ahriScore}.`,
    });
  } catch (err: unknown) {
    console.error('[Journal] PUBLICATION audit failed:', err);
  }

  return journal;
}

// ─── Map Document to Type ─────────────────────────────────────

function mapToJournal(
  doc: any,
  opts?: { summary?: boolean },
): AlamtologiAcademicJournal {
  const useSummary = opts?.summary && !doc.content;
  const resolved = resolveJournalFieldsFromMongoDoc(doc);
  return {
    id:                doc._id.toString(),
    title:             resolved.title || doc.title,
    abstract:          resolved.abstract || doc.abstract,
    category:          doc.category,
    principlesFocus:   doc.principlesFocus,
    authorName:        doc.authorName,
    authorEmail:       doc.authorEmail ?? '',
    authorOrg:         doc.authorOrg,
    content:           useSummary ? EMPTY_JOURNAL_CONTENT : resolved.content,
    ahriScore:         doc.ahriScore,
    hukumZAnalysis:    doc.hukumZAnalysis,
    tahapAkalAchieved: doc.tahapAkalAchieved,
    cVLevel:           doc.cVLevel,
    judgment:          doc.judgment,
    status:            doc.status,
    submittedAt:       doc.submittedAt,
    reviewedAt:        doc.reviewedAt,
    publishedAt:       doc.publishedAt,
    reviewNotes:       doc.reviewNotes,
    journalNumber:     doc.journalNumber,
    source:            doc.source,
    sourceSessionId:   doc.sourceSessionId,
    knowledgeTopicId:  doc.knowledgeTopicId,
    knowledgeMajor:    doc.knowledgeMajor,
    knowledgeDiscipline: doc.knowledgeDiscipline,
    knowledgeSubfield: doc.knowledgeSubfield,
    sourceLanguage:    doc.sourceLanguage ?? 'en',
    translations:      doc.translations ?? {},
    copyright:         doc.copyright,
    totalWords:        doc.totalWords,
    topicId:           doc.topicId ?? doc.knowledgeTopicId,
    sessionId:         doc.sessionId ?? doc.sourceSessionId,
  };
}
