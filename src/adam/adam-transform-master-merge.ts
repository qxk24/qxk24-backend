/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Transform Master Merge Audit
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * P4 — Gated audit merge: inquiry C may enrich master.unifiedUnderstanding
 * when aligned. Never raw chat — distilled synthesis only.
 */

import { ENV } from '../config/environments';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { AlamtologiBrainMasterModel } from '../qxk24brain/qxk24brain.schema';
import { AdamTeachingRecordModel } from '../qxk24brain/adam-teaching-record.schema';
import {
  auditInquiryMergeDeterministic,
  type MasterMergeInput,
} from '../qxk24brain/deep-ul/master-merge-engine';
import type { TransformASource } from './adam-transform-turn.gate';

export interface InquiryMasterMergeInput {
  founderId:        string;
  recordId:         string;
  aSource:          TransformASource;
  episodeSummary:   string;
  teachingIntent:   string;
  outcomeSummary:   string;
  conventionalRefs: string[];
}

export function isInquiryMasterMergeEnabled(): boolean {
  return ENV.ADAM_UNIFIED_TRANSFORM && ENV.ADAM_INQUIRY_MASTER_MERGE;
}

/** Deterministic UL audit — merge only when inquiry C enriches master without contradiction. */
export async function auditInquiryMasterMerge(
  input: InquiryMasterMergeInput,
): Promise<{ shouldMerge: boolean; distilled?: string; reason?: string }> {
  const mergeInput: MasterMergeInput = {
    founderId:        input.founderId,
    recordId:         input.recordId,
    episodeSummary:   input.episodeSummary,
    teachingIntent:   input.teachingIntent,
    outcomeSummary:   input.outcomeSummary,
    conventionalRefs: input.conventionalRefs,
    question:         input.teachingIntent,
    answer:           input.outcomeSummary,
  };
  return auditInquiryMergeDeterministic(mergeInput);
}

/** Fire-and-forget — append audited distillate to master; teaching record stays pending audit. */
export async function maybeAuditMergeInquiryToMaster(
  input: InquiryMasterMergeInput,
): Promise<void> {
  if (!isInquiryMasterMergeEnabled()) return;
  if (input.aSource !== 'inquiry' && input.aSource !== 'conventional') return;

  const audit = await auditInquiryMasterMerge(input);
  if (!audit.shouldMerge || !audit.distilled?.trim()) {
    return;
  }

  const master = await getOrCreateMaster(input.founderId);
  const line = `[Inquiry C — ${input.recordId}]\n${audit.distilled.trim()}`;
  const merged = `${master.unifiedUnderstanding}\n\n${line}`.trim();
  const capped = merged.slice(-48_000);

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: input.founderId },
    {
      unifiedUnderstanding: capped,
      masa_last_updated:    new Date(),
      totalTransformations: (master.totalTransformations ?? 0) + 1,
    },
  );

  await AdamTeachingRecordModel.updateOne(
    { recordId: input.recordId },
    {
      auditStatus:  'pending',
      autoJudgment: 'MAKMUR',
    },
  );
}

export function triggerInquiryMasterMerge(input: InquiryMasterMergeInput): void {
  void maybeAuditMergeInquiryToMaster(input).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM Transform] Master merge error:', msg);
  });
}
