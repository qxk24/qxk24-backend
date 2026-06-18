/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Composer
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Single sections[] contract after AnswerPlan — consumed by
 * prompt, repair, and guard. No generic teaching templates.
 */

import { stripLeadingAdamSalutation } from './adam-response-generation';
import type { AdamAnswerPlan } from './adam-answer-plan';
import { isUsersTechnicalPlan } from './adam-answer-plan';
import {
  extractComparePair,
  resolveAdamAnswerShape,
  type AdamAnswerShape,
} from './adam-answer-shape';
import {
  extractPrimaryTopicTitle,
  parseCompoundSecondaryClause,
} from './adam-answer-compound';

export type AdamAnswerSectionId =
  | 'primary'
  | 'secondary'
  | 'compare-open'
  | 'compare-diff'
  | 'examples'
  | 'synthesis';

export interface AdamAnswerSection {
  id: AdamAnswerSectionId;
  /** Header text without ### prefix. */
  title: string;
}

export interface AdamAnswerComposer {
  shape: AdamAnswerShape;
  sections: AdamAnswerSection[];
  primaryHeader: string;
  secondaryHeader?: string;
  topicTitle: string;
}

export function buildDefinitionalPrimaryHeader(topicTitle: string): string {
  return `Apa itu ${topicTitle}?`;
}

function compareOpenTitle(message: string, shape: AdamAnswerShape): string {
  const pair = shape.comparePair ?? extractComparePair(message);
  if (pair) return `Perbandingan ${pair.left} dan ${pair.right}`;
  return 'Perbandingan';
}

function buildCompareSections(message: string, shape: AdamAnswerShape): AdamAnswerSection[] {
  return [
    { id: 'compare-open', title: compareOpenTitle(message, shape) },
    { id: 'compare-diff', title: 'Perbezaan utama' },
    { id: 'examples', title: 'Contoh' },
  ];
}

function buildDefinitionalSections(
  topicTitle: string,
  secondaryHeader?: string | null,
): AdamAnswerSection[] {
  const sections: AdamAnswerSection[] = [
    { id: 'primary', title: buildDefinitionalPrimaryHeader(topicTitle) },
  ];
  if (secondaryHeader) {
    sections.push({ id: 'secondary', title: secondaryHeader });
  }
  return sections;
}

/** Authoritative section list for one turn — derived from plan + question parse. */
export function resolveAdamAnswerComposer(
  message: string,
  plan: Pick<AdamAnswerPlan, 'answerShape'> & Partial<AdamAnswerPlan>,
): AdamAnswerComposer {
  const body = stripLeadingAdamSalutation(message).trim();
  const shape = plan.answerShape ?? resolveAdamAnswerShape(message, {
    structured: isUsersTechnicalPlan(plan as AdamAnswerPlan),
  });

  const compound = parseCompoundSecondaryClause(body);
  const topicTitle = extractPrimaryTopicTitle(body, compound);
  const primaryHeader = buildDefinitionalPrimaryHeader(topicTitle);
  const secondaryHeader = compound.header ?? shape.secondaryTitle ?? undefined;

  let sections: AdamAnswerSection[];
  if (shape.intent === 'comparative') {
    sections = buildCompareSections(body, shape);
  } else {
    sections = buildDefinitionalSections(topicTitle, secondaryHeader);
  }

  return {
    shape,
    sections,
    primaryHeader,
    secondaryHeader: secondaryHeader || undefined,
    topicTitle,
  };
}

export function formatAdamAnswerComposerLog(composer: AdamAnswerComposer): string {
  const parts = [
    `intent=${composer.shape.intent}`,
    `sections=${composer.sections.length}`,
    `topic=${composer.topicTitle}`,
  ];
  if (composer.secondaryHeader) parts.push(`secondary=${composer.secondaryHeader}`);
  return `[adam:answer-composer] ${parts.join(' ')}`;
}
