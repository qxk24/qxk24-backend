/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Student Alignment Engine
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

export interface StudentAlignmentResult {
  aligned:       boolean;
  shouldConsult: boolean;
  reason:        string;
  enrichment:    string;
}

const CONSULT_SIGNALS = [
  /\b(hack|bypass|jailbreak|ignore rules)\b/i,
  /\b(contradict founder|against alamtologi)\b/i,
];

export function checkStudentAlignmentDeterministic(input: {
  message:              string;
  founderUnderstanding: string;
  priorTrack?:          string;
}): StudentAlignmentResult {
  const message = input.message.trim();
  if (!message) {
    return {
      aligned: false, shouldConsult: true, reason: 'Empty contribution', enrichment: '',
    };
  }

  if (CONSULT_SIGNALS.some((p) => p.test(message))) {
    return {
      aligned:       false,
      shouldConsult: true,
      reason:        'Contribution requires Founder consultation',
      enrichment:    '',
    };
  }

  const episode = extractEpisodeDeterministically(message, input.priorTrack ?? '');
  const enrichment = [
    `Student contribution maps to ${episode.principlesTouched.join(', ')}.`,
    `Outcome: ${episode.outcome}.`,
    episode.summary,
  ].join(' ').slice(0, 600);

  return {
    aligned:       true,
    shouldConsult: false,
    reason:        'Deterministic alignment — within Founder scope',
    enrichment,
  };
}
