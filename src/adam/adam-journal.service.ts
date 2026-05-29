// ============================================================
// QXK24 ADAM Teaching Engine — Journal Generation Service
// File: src/adam/adam-journal.service.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/environments';
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
}): Promise<AlamtologiAcademicJournal> {
  const client = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

  let analysedContent: JournalContent;
  let hukumZ: HukumZResult;
  let tahapAkal: TahapAkal;
  let cVLevel: ContributionValue;
  let judgment: ConstitutionalJudgment;
  let reviewNotes: string;

  try {
    const response = await client.messages.create({
      model:      ENV.ANTHROPIC_MODEL_DEEP,
      max_tokens: 8192,
      messages:   [{ role: 'user', content: buildJournalPrompt(input) }],
    });

    const raw     = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    analysedContent = parsed.content;
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
  });

  return mapToJournal(doc);
}

// ─── Get Journal ──────────────────────────────────────────────

export async function getJournal(id: string): Promise<AlamtologiAcademicJournal | null> {
  const doc = await ADAMJournalModel.findById(id).lean();
  if (!doc) return null;
  return mapToJournal(doc);
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

// ─── Approve and Publish Journal ─────────────────────────────

export async function approveJournal(
  id: string,
  reviewNotes: string,
): Promise<AlamtologiAcademicJournal | null> {
  const doc = await ADAMJournalModel.findById(id);
  if (!doc) return null;

  doc.status      = 'APPROVED';
  doc.reviewedAt  = new Date();
  doc.reviewNotes = reviewNotes;
  await doc.save();
  return mapToJournal(doc);
}

export async function publishJournal(id: string): Promise<AlamtologiAcademicJournal | null> {
  const doc = await ADAMJournalModel.findById(id);
  if (!doc || doc.status !== 'APPROVED') return null;

  doc.status        = 'PUBLISHED';
  doc.publishedAt   = new Date();
  doc.journalNumber = await generateJournalNumber();
  await doc.save();
  return mapToJournal(doc);
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
  };
}
