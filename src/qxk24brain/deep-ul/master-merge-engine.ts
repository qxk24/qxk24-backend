/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Master Merge Engine
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

import { getOrCreateMaster } from '../qxk24brain.engine';
import { AlamtologiBrainMasterModel } from '../qxk24brain.schema';
import { graphFromActiveFamilies, synthesizeConstitution } from './constitutional-synthesizer';
import { extractEpisodeDeterministically } from './episode-extractor';

const MASTER_MERGE_MAX_CHARS = 800;

export interface MasterMergeAuditResult {
  shouldMerge: boolean;
  distilled?:  string;
  reason?:     string;
}

export interface MasterMergeInput {
  founderId:        string;
  recordId:         string;
  episodeSummary:   string;
  teachingIntent:   string;
  outcomeSummary:   string;
  conventionalRefs: string[];
  question?:        string;
  answer?:          string;
}

function hasContradictionSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(contradict|violate|ungrounded|false claim)\b/.test(lower);
}

export function auditInquiryMergeDeterministic(input: MasterMergeInput): MasterMergeAuditResult {
  const combined = [
    input.episodeSummary,
    input.teachingIntent,
    input.outcomeSummary,
    ...(input.conventionalRefs ?? []),
  ].join(' ');

  if (!combined.trim() || combined.trim().length < 40) {
    return { shouldMerge: false, reason: 'Episode too thin for master merge' };
  }

  if (hasContradictionSignal(combined)) {
    return { shouldMerge: false, reason: 'Contradiction risk detected' };
  }

  const distilled = [
    input.teachingIntent,
    input.outcomeSummary.slice(0, 400),
    ...(input.conventionalRefs ?? []).slice(0, 2),
  ].filter(Boolean).join(' ').trim().slice(0, MASTER_MERGE_MAX_CHARS);

  if (!distilled) {
    return { shouldMerge: false, reason: 'No distillate produced' };
  }

  return {
    shouldMerge: true,
    distilled,
    reason:      'Deterministic UL merge audit — aligned inquiry C',
  };
}

export async function mergeInquiryIntoMaster(input: MasterMergeInput): Promise<void> {
  const question = input.question ?? input.teachingIntent;
  const answer = input.answer ?? input.outcomeSummary;
  const episode = extractEpisodeDeterministically(question, answer);
  const master = await getOrCreateMaster(input.founderId);

  const entityC = synthesizeConstitution(
    {
      masterUnderstanding: master.unifiedUnderstanding,
      ontologyGraph:       graphFromActiveFamilies(master.activeFamilies ?? []),
    },
    {
      teachingContent:     `${question}\n${answer}`,
      extractedPrinciples: episode.principlesTouched,
    },
  );

  const line = `[Inquiry C — ${input.recordId}]\n${entityC.newUnderstanding}`;
  const merged = `${master.unifiedUnderstanding}\n\n${line}`.trim().slice(-48_000);

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: input.founderId },
    {
      unifiedUnderstanding: merged,
      masa_last_updated:    new Date(),
      totalTransformations: (master.totalTransformations ?? 0) + 1,
    },
  );
}
