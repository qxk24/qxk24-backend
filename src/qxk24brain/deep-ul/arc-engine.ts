/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Student Relationship Arc Engine
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

import { extractEpisodeDeterministically } from './episode-extractor';
import { Principle } from './ontology';

export interface SessionTurn {
  role:    'student' | 'adam' | string;
  content: string;
}

export function buildStudentRelationshipArc(turns: SessionTurn[]): string {
  if (turns.length < 2) return '';

  const firstStudent = turns.find((t) => t.role === 'student');
  const lastStudent = [...turns].reverse().find((t) => t.role === 'student');
  const lastAdam = [...turns].reverse().find((t) => t.role === 'adam');

  if (!firstStudent || !lastStudent) return '';

  const start = firstStudent.content.slice(0, 120);
  const endQ = lastStudent.content.slice(0, 120);
  const endA = lastAdam?.content.slice(0, 120) ?? '';

  const episode = extractEpisodeDeterministically(endQ, endA || endQ);
  const principles = episode.principlesTouched.join(', ') || Principle.TENAGA;

  return [
    `The student began exploring: ${start}.`,
    `Understanding shifted toward ${principles} layers with outcome ${episode.outcome}.`,
    `Open thread: ${endQ}`,
  ].join(' ');
}
