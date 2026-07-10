/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Episode Extractor
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

import { Principle } from './ontology';

export interface ExtractedEpisode {
  summary:           string;
  intent:            string;
  outcome:           string;
  principlesTouched: Principle[];
}

function classifyIntent(question: string): string {
  const q = question.toLowerCase();
  if (/\b(fix|error|bug|broken|fail)\b/.test(q)) return 'PROBLEM_RESOLUTION';
  if (/\bwhat is\b|\bdefine\b|\bmeaning of\b/.test(q)) return 'DEFINITION_REQUEST';
  if (/\bhow\b|\bexplain\b|\bwhy\b|\bteach\b/.test(q)) return 'EXPLANATION_REQUEST';
  return 'GENERAL_INQUIRY';
}

function classifyOutcome(answer: string): string {
  const a = answer.toLowerCase();
  if (/\b(cannot|can't|not allowed|violates|blocked)\b/.test(a)) {
    return 'BLOCKED_BY_CONSTRAINT';
  }
  if (/\b(fixed|resolved|solved|completed)\b/.test(a)) return 'RESOLVED';
  return 'PROVIDED_INFORMATION';
}

function mapPrinciples(combinedText: string): Principle[] {
  const text = combinedText.toLowerCase();
  const touched: Principle[] = [];

  if (/\b(database|data|storage|mongo|sql)\b/.test(text)) touched.push(Principle.BUMI);
  if (/\b(state|flow|stream|transition)\b/.test(text)) touched.push(Principle.AIR);
  if (/\b(function|run|execute|energy|tenaga)\b/.test(text)) touched.push(Principle.TENAGA);
  if (/\b(api|route|endpoint|handler)\b/.test(text)) touched.push(Principle.API);
  if (/\b(type|interface|schema|light|cahaya)\b/.test(text)) touched.push(Principle.CAHAYA);
  if (/\b(architect|boundary|ruang|limit)\b/.test(text)) touched.push(Principle.RUANG);
  if (/\b(time|schedule|masa|journal|episode)\b/.test(text)) touched.push(Principle.MASA);

  if (touched.length === 0) touched.push(Principle.TENAGA);
  return touched;
}

export function extractEpisodeDeterministically(
  question: string,
  answer: string,
): ExtractedEpisode {
  const intent = classifyIntent(question);
  const outcome = classifyOutcome(answer);
  const principlesTouched = mapPrinciples(`${question} ${answer}`);
  const principleLabel = principlesTouched.join(', ');
  const summary = `Addressed ${intent.toLowerCase().replace(/_/g, ' ')} regarding ${principleLabel} layers. Outcome: ${outcome}.`;

  return { summary, intent, outcome, principlesTouched };
}
