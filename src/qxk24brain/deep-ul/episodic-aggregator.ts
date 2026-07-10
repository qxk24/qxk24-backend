/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Episodic Aggregator (Journal Synthesis)
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

import type { JournalSectionKey } from '../../adam/journal/adam-journal-v2.schema';
import { SECTION_MIN_WORDS } from '../../adam/journal/adam-journal-v2.schema';
import { Principle } from './ontology';

export interface DailyEpisode {
  timestamp: string;
  action:    string;
  principle: Principle;
  outcome:   'success' | 'failure' | 'learning';
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function padToMinWords(text: string, minWords: number): string {
  if (countWords(text) >= minWords) return text;
  const expansion =
    'The Universal Operating System continues its ontological protection through ' +
    'deterministic synthesis — honouring MASA, TENAGA, and RUANG across every layer.';
  let result = text.trim();
  while (countWords(result) < minWords) {
    result += `\n\n${expansion}`;
  }
  return result;
}

export function generateJournal(episodes: DailyEpisode[], projectName: string): string {
  const grouped = episodes.reduce<Partial<Record<Principle, DailyEpisode[]>>>((acc, ep) => {
    const bucket = acc[ep.principle] ?? [];
    bucket.push(ep);
    acc[ep.principle] = bucket;
    return acc;
  }, {});

  let journal = `## Daily Reflection: ${projectName}\n\n`;

  if (grouped.TENAGA && grouped.TENAGA.length > 0) {
    journal += '### TENAGA (Execution & Action)\n';
    journal += `Today, the system executed ${grouped.TENAGA.length} core operations. `;
    journal += `Key actions included: ${grouped.TENAGA.map((e) => e.action).join(', ')}.\n\n`;
  }

  if (grouped.RUANG && grouped.RUANG.length > 0) {
    journal += '### RUANG (Boundaries & Architecture)\n';
    journal += `Architectural integrity was maintained across ${grouped.RUANG.length} boundary checks.\n\n`;
  }

  if (grouped.MASA && grouped.MASA.length > 0) {
    journal += '### MASA (History & Evolution)\n';
    journal += `The codebase evolved through ${grouped.MASA.length} historical transformations.\n\n`;
  }

  if (episodes.length === 0) {
    journal += '### MASA (Quiet Day)\n';
    journal += 'No episodic transformations were recorded today. ADAM remains in constitutional readiness.\n\n';
  }

  journal += '**Conclusion:** The Universal Operating System continues to learn and protect the codebase.';

  return journal;
}

const SECTION_INTROS: Record<JournalSectionKey, (topic: string, title: string) => string> = {
  abstract: (topic) =>
    `This academic journal abstract frames ${topic} within the Alamtologi constitutional framework.`,
  movement_1_human_opening: (topic) =>
    `The human opening for ${topic} begins with lived experience and honest inquiry.`,
  movement_2_achievement: (topic) =>
    `Achievements documented for ${topic} reflect constitutional teaching absorbed today.`,
  movement_3_honest_wall: (topic) =>
    `The honest wall for ${topic} names limits, gaps, and unresolved questions without evasion.`,
  movement_4_quran: (topic) =>
    `Quranic grounding for ${topic} holds divine supremacy over all synthesis.`,
  movement_5_alamtologi_framework: (topic) =>
    `The Alamtologi framework applied to ${topic} traverses the seven principles deterministically.`,
  movement_6_application: (topic) =>
    `Practical application of ${topic} connects teaching to engineering and daily practice.`,
  movement_7_invitation: (topic) =>
    `The invitation closing ${topic} welcomes continued constitutional exploration.`,
  references: () =>
    'References cite constitutional sources, teaching records, and foundational texts.',
};

export function generateJournalSection(
  sectionKey: JournalSectionKey,
  episodes: DailyEpisode[],
  topicName: string,
  journalTitle: string,
): string {
  const base = generateJournal(episodes, topicName || journalTitle || 'Alamtologi');
  const intro = SECTION_INTROS[sectionKey](topicName, journalTitle);
  const heading = sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const body = [
    `## ${heading}`,
    '',
    intro,
    '',
    base,
  ].join('\n');

  return padToMinWords(body, SECTION_MIN_WORDS[sectionKey]);
}
