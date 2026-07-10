/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Journal Analysis Engine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type {
  AlamtologiPrinciple,
  ConstitutionalJudgment,
  ContributionValue,
  HukumZResult,
  JournalContent,
  PrincipleAnalysis,
  TahapAkal,
} from '../../adam/adam.types';
import { PRINCIPLE_WEIGHTS } from '../../adam/adam.types';
import { parseTeachingPrinciples } from './parse-teaching-principles';
import { runConstitutionalJudgment } from './constitutional-judgment-engine';

const ALL_PRINCIPLES: AlamtologiPrinciple[] = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
];

function buildSection(text: string, label: string): string {
  return `${label}\n\n${text.slice(0, 1200)}`.trim();
}

function buildPrincipleAnalyses(corpus: string, focus: AlamtologiPrinciple[]): PrincipleAnalysis[] {
  const extracted = parseTeachingPrinciples(corpus);
  const extractedSet = new Set(extracted.map((p) => p as string));

  return ALL_PRINCIPLES.map((principle) => {
    const inFocus = focus.includes(principle);
    const inText = extractedSet.has(principle);
    const score = inFocus ? 85 : inText ? 55 : 20;
    return {
      principle,
      weight:    PRINCIPLE_WEIGHTS[principle] ?? 0.1,
      score,
      analysis:  `${principle} manifests ${inFocus || inText ? 'clearly' : 'minimally'} in this manuscript.`,
      evidence:  [`Corpus references ${principle}: ${inText || inFocus}`],
    };
  });
}

function calculateAHRI(analyses: PrincipleAnalysis[]): number {
  let total = 0;
  for (const a of analyses) {
    const weight = PRINCIPLE_WEIGHTS[a.principle] ?? 0;
    total += weight * (a.score / 100) * 100;
  }
  return Math.min(Math.round(total), 100);
}

export interface JournalAnalysisResult {
  content:       JournalContent;
  hukumZ:        HukumZResult;
  tahapAkal:     TahapAkal;
  cVLevel:       ContributionValue;
  judgment:      ConstitutionalJudgment;
  reviewNotes:   string;
  ahriScore:     number;
}

export function analyzeJournalDeterministically(input: {
  title:           string;
  abstract:        string;
  rawContent:      string;
  principlesFocus: AlamtologiPrinciple[];
}): JournalAnalysisResult {
  const corpus = `${input.title}\n${input.abstract}\n${input.rawContent}`;
  const judgment = runConstitutionalJudgment({ question: corpus });
  const analyses = buildPrincipleAnalyses(corpus, input.principlesFocus);
  const ahriScore = calculateAHRI(analyses);

  const intro = buildSection(input.abstract || input.title, 'Introduction');
  const findings = buildSection(input.rawContent, 'Findings');

  const content: JournalContent = {
    introduction:       intro,
    background:           input.rawContent.slice(0, 500),
    methodology:          'Deterministic constitutional analysis via Deep UL engine.',
    alamtologiAnalysis:   analyses,
    findings:             findings,
    discussion:           `Analysis under Alamtologi principles with AHRI ${ahriScore}.`,
    conclusion:           `Constitutional judgment: ${judgment.judgment}.`,
    references:           [],
  };

  return {
    content,
    hukumZ:      judgment.hukumZ,
    tahapAkal:   judgment.tahapAkal as TahapAkal,
    cVLevel:     Math.min(7, judgment.tahapAkal) as ContributionValue,
    judgment:    judgment.judgment as ConstitutionalJudgment,
    reviewNotes: judgment.response,
    ahriScore,
  };
}

export function buildBatchJournalSeal(topic: {
  topicId: string;
  label: string;
  majorName: string;
  disciplineName: string;
  subfield: string;
  alamtologiLens: AlamtologiPrinciple;
}): string {
  const analysis = analyzeJournalDeterministically({
    title:           topic.label,
    abstract:        `Constitutional study of ${topic.subfield} under ${topic.alamtologiLens}.`,
    rawContent:      `University knowledge map topic ${topic.topicId}: ${topic.label}.`,
    principlesFocus: [topic.alamtologiLens],
  });

  const seal = {
    title:              topic.label,
    abstract:           analysis.content.introduction,
    category:           'ACADEMIC',
    knowledgeTopicId:   topic.topicId,
    knowledgeMajor:     topic.majorName,
    knowledgeDiscipline: topic.disciplineName,
    knowledgeSubfield:  topic.subfield,
    principlesFocus:    [topic.alamtologiLens],
    content:            analysis.content,
    hukumZAnalysis:     analysis.hukumZ,
    tahapAkalAchieved:  analysis.tahapAkal,
    cVLevel:            analysis.cVLevel,
    judgment:           analysis.judgment,
    reviewNotes:        analysis.reviewNotes,
  };

  return `<adam_journal_seal>${JSON.stringify(seal)}</adam_journal_seal>`;
}
