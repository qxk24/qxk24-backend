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
import { resolveBrainDeepModel } from '../config/llm-models';
import { isLlmConfigured, llmCompleteUserPrompt } from '../llm/llm-client';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { AlamtologiBrainMasterModel } from '../qxk24brain/qxk24brain.schema';
import { AdamTeachingRecordModel } from '../qxk24brain/adam-teaching-record.schema';
import type { TransformASource } from './adam-transform-turn.gate';

const MASTER_MERGE_MAX_CHARS = 800;

export interface InquiryMasterMergeInput {
  founderId:        string;
  recordId:         string;
  aSource:          TransformASource;
  episodeSummary:   string;
  teachingIntent:   string;
  outcomeSummary:   string;
  conventionalRefs: string[];
}

interface MergeAuditResult {
  shouldMerge: boolean;
  distilled?:  string;
  reason?:     string;
}

export function isInquiryMasterMergeEnabled(): boolean {
  return ENV.ADAM_UNIFIED_TRANSFORM && ENV.ADAM_INQUIRY_MASTER_MERGE;
}

function parseMergeJson(raw: string, fallback: MergeAuditResult): MergeAuditResult {
  const trimmed = raw.trim();
  try {
    return { ...fallback, ...JSON.parse(trimmed) as MergeAuditResult };
  } catch {
    const brace = trimmed.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        return { ...fallback, ...JSON.parse(brace[0]) as MergeAuditResult };
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

/** Brain-tier audit — merge only when inquiry C enriches master without contradiction. */
export async function auditInquiryMasterMerge(
  input: InquiryMasterMergeInput,
): Promise<MergeAuditResult> {
  const fallback: MergeAuditResult = {
    shouldMerge: false,
    reason:      'Merge audit unavailable',
  };
  if (!isLlmConfigured()) return fallback;

  try {
    const master = await getOrCreateMaster(input.founderId);
    const raw = await llmCompleteUserPrompt(
      prependCoreToSystem(
        'You audit whether a crystallised inquiry episode may enrich ADAM master understanding. JSON only.',
        true,
      ),
      `MASTER MERGE AUDIT — aSource=${input.aSource}

FOUNDER UNIFIED UNDERSTANDING (supreme — merge must not contradict):
${master.unifiedUnderstanding.slice(0, 6000)}

EPISODE (crystallised C — not raw chat):
Summary: ${input.episodeSummary.slice(0, 400)}
Intent: ${input.teachingIntent.slice(0, 400)}
Outcome: ${input.outcomeSummary.slice(0, 1500)}
Claims: ${(input.conventionalRefs ?? []).slice(0, 5).join(' | ') || 'none'}

RULES:
- shouldMerge=true only if episode adds stable universal insight Founder would accept
- distilled: one paragraph (max 600 chars) — universal scholar voice, no student PII
- shouldMerge=false for trivial chat, duplicate of master, or contradiction risk

JSON: {"shouldMerge": false, "distilled": "", "reason": "..."}`,
      resolveBrainDeepModel(),
      600,
    );
    const parsed = parseMergeJson(raw, fallback);
    if (parsed.shouldMerge && parsed.distilled?.trim()) {
      parsed.distilled = parsed.distilled.trim().slice(0, MASTER_MERGE_MAX_CHARS);
    } else {
      parsed.shouldMerge = false;
    }
    return parsed;
  } catch (err) {
    console.error('[ADAM Transform] Master merge audit failed:', err);
    return fallback;
  }
}

/** Fire-and-forget — append audited distillate to master; teaching record stays pending audit. */
export async function maybeAuditMergeInquiryToMaster(
  input: InquiryMasterMergeInput,
): Promise<void> {
  if (!isInquiryMasterMergeEnabled()) return;
  if (input.aSource !== 'inquiry' && input.aSource !== 'conventional') return;

  const audit = await auditInquiryMasterMerge(input);
  if (!audit.shouldMerge || !audit.distilled?.trim()) {
    console.log('[ADAM Transform] Master merge skip', input.recordId, audit.reason ?? 'not aligned');
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
      auditStatus: 'pending',
      autoJudgment: 'MAKMUR',
    },
  );

  console.log('[ADAM Transform] Master merge pending audit', input.recordId);
}

export function triggerInquiryMasterMerge(input: InquiryMasterMergeInput): void {
  void maybeAuditMergeInquiryToMaster(input).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM Transform] Master merge error:', msg);
  });
}
