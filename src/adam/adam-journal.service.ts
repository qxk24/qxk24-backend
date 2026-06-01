// ============================================================
// QXK24 ADAM Teaching Engine — Journal Generation Service
// File: src/adam/adam-journal.service.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { getDeepModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { ADAMJournalModel } from './adam.schema';
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
import type { AdamJournalSeal } from './adam-chat-response-parser';
import {
  adamClaimsJournalSaved,
  adamDeclinesJournalSeal,
  founderWantsJournalSeal,
  hasSubstantiveManuscriptProse,
  isPlaceholderJournalTitle,
  parseJournalSealBlocks,
  shouldAttemptFounderJournalSeal,
  validateAdamJournalSeal,
} from './adam-chat-response-parser';
import { loadMessageHistory } from './adam-chat-session.service';
import { normalizeJournalContent, normalizePrinciplesFocus } from './adam-principle-normalize';

// ─── Generate Journal Number ──────────────────────────────────

async function generateJournalNumber(): Promise<string> {
  const count = await ADAMJournalModel.countDocuments({ status: 'PUBLISHED' });
  const seq   = String(count + 1).padStart(3, '0');
  const year  = new Date().getFullYear();
  return `QXK24-J${year}-${seq}`;
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
  source?:         'public_submit' | 'founder_adam';
  sourceSessionId?: string;
}): Promise<AlamtologiAcademicJournal> {
  let analysedContent: JournalContent;
  let hukumZ: HukumZResult;
  let tahapAkal: TahapAkal;
  let cVLevel: ContributionValue;
  let judgment: ConstitutionalJudgment;
  let reviewNotes: string;

  try {
    const raw = await llmCompleteUserPrompt(
      'Alamtologi academic journal constitutional analysis.',
      buildJournalPrompt(input),
      getDeepModel(),
      8192,
    );
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    analysedContent = normalizeJournalContent(parsed.content);
    hukumZ          = parsed.hukumZAnalysis;
    tahapAkal       = parsed.tahapAkalAchieved;
    cVLevel         = parsed.cVLevel;
    judgment        = parsed.judgment;
    reviewNotes     = parsed.reviewNotes ?? '';
  } catch {
    analysedContent = {
      introduction:      input.abstract,
      background:        '',
      methodology:       '',
      alamtologiAnalysis:[],
      findings:          '',
      discussion:        '',
      conclusion:        '',
      references:        [],
    };
    hukumZ    = { pola: 'BELUM', kadar: 'BELUM', pasangan: 'BELUM', keseimbangan: 'BELUM' };
    tahapAkal = 1;
    cVLevel   = 1;
    judgment  = 'ISLAH';
    reviewNotes = 'ADAM analysis pending — manual review required.';
  }

  const ahriScore = calculateAHRI(analysedContent.alamtologiAnalysis ?? []);

  const doc = await ADAMJournalModel.create({
    title:              input.title,
    abstract:           input.abstract,
    category:           input.category,
    principlesFocus:    input.principlesFocus,
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
}): Promise<AlamtologiAcademicJournal> {
  const raw = input.adamText.trim();
  if (raw.length < 500) {
    throw new Error('ADAM response too short to seal as journal');
  }
  if (adamDeclinesJournalSeal(raw)) {
    throw new Error('ADAM declined to seal — no manuscript in this reply');
  }
  if (!hasSubstantiveManuscriptProse(raw)) {
    throw new Error('Reply has no IMRaD manuscript — meta-discussion only');
  }

  const title = extractTitleFromAdamText(raw, input.userMessage);
  if (isPlaceholderJournalTitle(title)) {
    throw new Error('Could not extract a valid journal title from ADAM reply');
  }
  const abstract = padAbstract(extractAbstractFromAdamText(raw));

  return submitJournal({
    title:           title.length >= 10 ? title : `${title} — ADAM`,
    abstract,
    rawContent:      raw,
    category:        'RESEARCH',
    principlesFocus: ['CAHAYA', 'MASA'],
    authorName:      'Masa Bayu',
    authorEmail:     FOUNDER_JOURNAL_EMAIL,
    authorOrg:       'QXK24 · Alamtologi',
    source:          'founder_adam',
    sourceSessionId: input.sourceSessionId,
  });
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

/** Seal from JSON tag and/or session manuscript when ADAM omits the tag in the latest reply. */
export async function processFounderJournalSeal(input: {
  sessionId:       string;
  userMessage:     string;
  fullResponse:    string;
  finalResponse:   string;
  sealsFromReply:  AdamJournalSeal[];
}): Promise<FounderJournalSealResult> {
  const sealedJournals: { id: string; title: string }[] = [];
  const sealErrors: string[] = [];

  const trySealList = async (seals: AdamJournalSeal[]) => {
    for (const seal of seals) {
      try {
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

  const attempt =
    shouldAttemptFounderJournalSeal(input.userMessage, input.finalResponse)
    || shouldAttemptFounderJournalSeal(input.userMessage, input.fullResponse);

  if (!attempt) {
    return { sealedJournals, sealErrors };
  }

  const corpus = await gatherFounderJournalCorpus(input.sessionId, input.fullResponse);
  const proseSource = hasSubstantiveManuscriptProse(corpus)
    ? corpus
    : hasSubstantiveManuscriptProse(input.fullResponse)
      ? input.fullResponse
      : null;

  if (
    adamDeclinesJournalSeal(input.finalResponse) &&
    !proseSource
  ) {
    sealErrors.push(
      'Tiada draf IMRaD dalam sesi ini. Tap ✍️ Tulis draf penuh, atau minta ADAM tulis topik tertentu, kemudian 📚 Simpan untuk semak.',
    );
    return { sealedJournals, sealErrors };
  }

  const fromCorpus = parseJournalSealBlocks(corpus);
  if (fromCorpus.seals.length > 0) {
    await trySealList([fromCorpus.seals[fromCorpus.seals.length - 1]!]);
    if (sealedJournals.length > 0) return { sealedJournals, sealErrors };
  }

  const claimsSaved =
    adamClaimsJournalSaved(input.finalResponse)
    || adamClaimsJournalSaved(input.fullResponse)
    || adamClaimsJournalSaved(corpus);

  if (
    proseSource
    && !adamDeclinesJournalSeal(proseSource)
    && (claimsSaved || founderWantsJournalSeal(input.userMessage))
  ) {
    try {
      const j = await sealFounderJournalFromChatFallback({
        adamText:        proseSource,
        userMessage:     input.userMessage,
        sourceSessionId: input.sessionId,
      });
      sealedJournals.push({ id: j.id, title: j.title });
      return { sealedJournals, sealErrors };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Journal] Founder seal fallback failed:', err);
      sealErrors.push(msg);
    }
  }

  if (founderWantsJournalSeal(input.userMessage)) {
    if (!proseSource) {
      sealErrors.push(
        'Tiada draf IMRaD dalam sesi. Tap ✍️ Tulis draf penuh di JOURNAL GEN, tunggu siap, kemudian 📚 Simpan untuk semak.',
      );
    } else if (claimsSaved) {
      sealErrors.push(
        'ADAM claimed the journal was saved but no valid seal was written. Ask ADAM: "Emit <adam_journal_seal> JSON now with complete IMRaD from this session."',
      );
    } else {
      sealErrors.push(
        'No valid <adam_journal_seal> JSON in this reply. Ask ADAM to emit the seal block with full IMRaD content.',
      );
    }
  } else if (claimsSaved) {
    sealErrors.push(
      'ADAM claimed the journal was saved but no valid seal was written. Ask ADAM to seal again with <adam_journal_seal> JSON.',
    );
  }

  return { sealedJournals, sealErrors };
}

const FOUNDER_JOURNAL_EMAIL = `${FOUNDER_USER_ID}@qxk24.com`;

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

  const doc = await ADAMJournalModel.create({
    title:              seal.title,
    abstract:           seal.abstract,
    category:           seal.category ?? 'RESEARCH',
    principlesFocus:    normalizePrinciplesFocus(seal.principlesFocus),
    authorName:         seal.authorName ?? 'Masa Bayu',
    authorEmail:        FOUNDER_JOURNAL_EMAIL,
    authorOrg:          'QXK24 · Alamtologi',
    content,
    ahriScore,
    hukumZAnalysis:     hukumZ,
    tahapAkalAchieved:  tahapAkal,
    cVLevel,
    judgment,
    status:             'PENDING_REVIEW',
    submittedAt:        new Date(),
    reviewNotes:        seal.reviewNotes ?? 'Sealed by ADAM from Founder teaching — awaiting P.alt review.',
    source:             'founder_adam',
    sourceSessionId:    sourceSessionId ?? undefined,
  });

  const journal = mapToJournal(doc);

  try {
    await runADAMAudit({
      targetId:    journal.id,
      targetType:  'JOURNAL',
      stage:       'SUBMISSION',
      context:     `Founder ADAM seal. Judgment: ${judgment}. AHRI: ${ahriScore}. Session: ${sourceSessionId ?? 'n/a'}.`,
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

export async function listJournals(filter: {
  status?:   string;
  judgment?: string;
  limit?:    number;
  skip?:     number;
}): Promise<{ journals: AlamtologiAcademicJournal[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filter.status)   query.status   = filter.status;
  if (filter.judgment) query.judgment = filter.judgment;

  const [docs, total] = await Promise.all([
    ADAMJournalModel.find(query)
      .sort({ submittedAt: -1 })
      .skip(filter.skip  ?? 0)
      .limit(filter.limit ?? 20)
      .lean(),
    ADAMJournalModel.countDocuments(query),
  ]);

  return { journals: docs.map(mapToJournal), total };
}

/** Public catalogue — published journals only */
export async function listPublishedJournals(limit = 24, skip = 0) {
  return listJournals({ status: 'PUBLISHED', limit, skip });
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
  const canonicalEmail = `${userId}@student.qxk24.com`;
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

  return docs.map(mapToJournal);
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

  doc.status        = 'PUBLISHED';
  doc.publishedAt   = new Date();
  doc.journalNumber = await generateJournalNumber();
  await doc.save();

  const journal = mapToJournal(doc);
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

function mapToJournal(doc: any): AlamtologiAcademicJournal {
  return {
    id:                doc._id.toString(),
    title:             doc.title,
    abstract:          doc.abstract,
    category:          doc.category,
    principlesFocus:   doc.principlesFocus,
    authorName:        doc.authorName,
    authorEmail:       doc.authorEmail,
    authorOrg:         doc.authorOrg,
    content:           doc.content,
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
  };
}
