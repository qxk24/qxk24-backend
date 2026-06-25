/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM University Standard Mode
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AdamTutorProfile } from './tutor-law.types';
import { detectQuestionEducationBand } from './tutor-law.level-scope';

export type AdamUniversityArtifact =
  | 'essay'
  | 'report'
  | 'case_study'
  | 'literature_review'
  | 'research_proposal'
  | 'fyp'
  | 'internship_report'
  | 'portfolio'
  | 'presentation'
  | 'critique_review'
  | 'methodology_question'
  | 'general_academic';

export interface UniversityArtifactInput {
  userMessage?:             string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
}

const FYP_MARKERS =
  /\b(?:fyp|final\s+year\s+project|projek\s+tahun\s+akhir|capstone|thesis|tesis|dissertation|disertasi)\b/i;

const LITERATURE_REVIEW_MARKERS =
  /\b(?:literature\s+review|lit\s+review|kajian\s+literatur|sorotan\s+(?:literatur|kajian)|thematic\s+review|research\s+gap|gap\s+kajian)\b/i;

const RESEARCH_PROPOSAL_MARKERS =
  /\b(?:research\s+proposal|proposal\s+(?:research|kajian|penyelidikan)|cadangan\s+(?:kajian|penyelidikan)|problem\s+statement|research\s+question|research\s+objective|objektif\s+kajian|persoalan\s+kajian)\b/i;

const CASE_STUDY_MARKERS =
  /\b(?:case\s+study|kajian\s+kes|analisis\s+kes|business\s+case|legal\s+case|clinical\s+case)\b/i;

const INTERNSHIP_MARKERS =
  /\b(?:internship\s+report|industrial\s+training\s+report|laporan\s+latihan\s+industri|practical\s+training\s+report|logbook|buku\s+log)\b/i;

const PRESENTATION_MARKERS =
  /\b(?:presentation|oral\s+presentation|pembentangan|viva|defen[cs]e|defend|poster\s+presentation|seminar\s+presentation|slide\s+deck)\b/i;

const METHODOLOGY_MARKERS =
  /\b(?:methodology|methodologi|kaedah\s+kajian|research\s+method|sampling|sample\s+size|validity|reliability|instrument|questionnaire|interview\s+protocol|data\s+analysis)\b/i;

const CRITIQUE_MARKERS =
  /\b(?:critique|critical\s+review|article\s+review|journal\s+review|book\s+review|ulasan\s+kritis|kritik\s+artikel|review\s+paper)\b/i;

const PORTFOLIO_MARKERS =
  /\b(?:portfolio|e-portfolio|reflective\s+portfolio|learning\s+portfolio|professional\s+portfolio)\b/i;

const REPORT_MARKERS =
  /\b(?:lab\s+report|technical\s+report|business\s+report|project\s+report|laporan\s+(?:makmal|projek|teknikal|akademik))\b/i;

const ESSAY_MARKERS =
  /\b(?:essay|academic\s+essay|reflective\s+essay|argumentative\s+essay|esei\s+akademik|karangan\s+akademik)\b/i;

const UNIVERSITY_CONTEXT_MARKERS =
  /\b(?:university|universiti|college|kolej|degree|ijazah|bachelor|undergraduate|postgraduate|master|phd|doctoral|faculty|fakulti|semester|lecturer|pensyarah|rubric|assignment\s+brief|coursework)\b/i;

const UNIVERSITY_NATIVE_ARTIFACTS = new Set<AdamUniversityArtifact>([
  'fyp',
  'literature_review',
  'research_proposal',
  'internship_report',
  'methodology_question',
]);

function combinedArtifactText(input: UniversityArtifactInput): string {
  return [
    ...(input.recentUserMessages ?? []).slice(-3),
    ...(input.recentAssistantMessages ?? []).slice(-2),
    input.userMessage ?? '',
  ].join('\n').slice(-5000);
}

export function classifyUniversityArtifact(input: UniversityArtifactInput): AdamUniversityArtifact {
  const text = combinedArtifactText(input);

  if (FYP_MARKERS.test(text)) return 'fyp';
  if (LITERATURE_REVIEW_MARKERS.test(text)) return 'literature_review';
  if (RESEARCH_PROPOSAL_MARKERS.test(text)) return 'research_proposal';
  if (CASE_STUDY_MARKERS.test(text)) return 'case_study';
  if (INTERNSHIP_MARKERS.test(text)) return 'internship_report';
  if (PRESENTATION_MARKERS.test(text)) return 'presentation';
  if (METHODOLOGY_MARKERS.test(text)) return 'methodology_question';
  if (CRITIQUE_MARKERS.test(text)) return 'critique_review';
  if (PORTFOLIO_MARKERS.test(text)) return 'portfolio';
  if (REPORT_MARKERS.test(text)) return 'report';
  if (ESSAY_MARKERS.test(text)) return 'essay';

  return 'general_academic';
}

export function isAdamUniversityStandardActive(
  profile?: AdamTutorProfile,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  if (profile?.level === 'university') return true;
  if (detectQuestionEducationBand(userMessage) === 'university') return true;

  const text = [
    ...recentUserMessages.slice(-3),
    ...recentAssistantMessages.slice(-2),
    userMessage,
  ].join('\n').slice(-5000);

  const artifact = classifyUniversityArtifact({ userMessage, recentUserMessages, recentAssistantMessages });
  return UNIVERSITY_CONTEXT_MARKERS.test(text) || UNIVERSITY_NATIVE_ARTIFACTS.has(artifact);
}
