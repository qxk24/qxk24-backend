/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Transformation Audit
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  QXK24BrainEntityModel,
  QXK24BrainLogModel,
  QXK24BrainMasterModel,
  type AidilAuditJudgment,
  type TransformationAuditStatus,
} from './qxk24brain.schema';
import { safeTransform } from './adam-concurrency.service';

export const AIDIL_JUDGMENT_LABELS: Record<AidilAuditJudgment, string> = {
  MAKMUR: 'Flourishing — transformation is sound',
  ISLAH:  'Correction needed — transformation has error',
  WAQF:   'Halt — transformation cannot proceed without clarification',
};

export interface JudgeTransformationInput {
  judgment:   AidilAuditJudgment;
  correction?: string;
}

export interface TransformationListItem {
  transformationId: string;
  entity_C_uid:     string;
  family:           string;
  principle:        string;
  stage:            number;
  isNewFamily:      boolean;
  masa_transformation: Date;
  auditStatus:      TransformationAuditStatus;
  autoJudgment:     AidilAuditJudgment;
  founderJudgment?: AidilAuditJudgment;
  founderCorrection?: string;
  entity_C_preview: string;
  entity_B_preview:   string;
  replacementTransformationId?: string;
}

export async function listTransformationsForAudit(
  founderId = 'masa-bayu',
  options: { limit?: number; status?: TransformationAuditStatus } = {},
): Promise<TransformationListItem[]> {
  const limit = options.limit ?? 50;
  const query: Record<string, unknown> = { founderId };
  if (options.status) query.auditStatus = options.status;

  const docs = await QXK24BrainLogModel.find(query)
    .sort({ masa_transformation: -1 })
    .limit(limit)
    .lean();

  return docs.map((d) => ({
    transformationId: d.transformationId,
    entity_C_uid:     d.entity_C_uid,
    family:           d.family,
    principle:        d.principle,
    stage:            d.stage,
    isNewFamily:      d.isNewFamily,
    masa_transformation: d.masa_transformation,
    auditStatus:      d.auditStatus ?? 'pending',
    autoJudgment:     d.autoJudgment ?? 'MAKMUR',
    founderJudgment:  d.founderJudgment,
    founderCorrection: d.founderCorrection,
    entity_C_preview: d.entity_C_preview ?? d.entity_C_content?.slice(0, 400) ?? '',
    entity_B_preview: d.entity_B_content?.slice(0, 400) ?? '',
    replacementTransformationId: d.replacementTransformationId,
  }));
}

async function dissolveEntityC(
  entityCUid: string,
  transformationId: string,
  reason: string,
): Promise<void> {
  await QXK24BrainEntityModel.updateOne(
    { uid: entityCUid },
    {
      auditStatus:       'dissolved',
      dissolvedAt:       new Date(),
      dissolutionReason: reason.slice(0, 2000),
      transformationId,
    },
  );
}

async function restoreMasterFromLog(
  founderId: string,
  log: {
    entity_A_full?: string;
    entity_A_summary?: string;
    priorActiveFamilies?: { family: string; principle: string; nucleusUid: string; stage: number; summary: string; masa_opened: Date }[];
    priorCompletedFamilies?: { family: string; principle: string; completedUid: string; masa_completed: Date; summary: string }[];
  },
): Promise<void> {
  const understanding = log.entity_A_full ?? log.entity_A_summary ?? '';
  await QXK24BrainMasterModel.updateOne(
    { founderId },
    {
      unifiedUnderstanding: understanding,
      activeFamilies:       log.priorActiveFamilies ?? [],
      completedFamilies:    log.priorCompletedFamilies ?? [],
      masa_last_updated:    new Date(),
    },
  );
}

function buildCorrectedTeaching(
  originalB: string,
  correction: string,
): string {
  return [
    '[CONSTITUTIONAL CORRECTION BY P.alt — ISLAH applied]',
    correction.trim(),
    '',
    'Original teaching (Entity B — reconstructed):',
    originalB.trim(),
  ].join('\n');
}

export async function judgeTransformation(
  transformationId: string,
  input: JudgeTransformationInput,
  founderId = 'masa-bayu',
): Promise<{
  ok: boolean;
  message: string;
  replacementTransformationId?: string;
}> {
  const log = await QXK24BrainLogModel.findOne({ transformationId, founderId });
  if (!log) {
    return { ok: false, message: 'Transformation not found.' };
  }

  if (log.auditStatus === 'corrected' || log.auditStatus === 'superseded') {
    return { ok: false, message: 'This transformation was already corrected.' };
  }

  const now = new Date();
  const { judgment, correction } = input;

  if (judgment === 'MAKMUR') {
    await QXK24BrainLogModel.updateOne(
      { transformationId },
      {
        auditStatus:       'confirmed',
        founderJudgment:   'MAKMUR',
        founderCorrection: correction?.trim(),
        auditedAt:         now,
      },
    );
    await QXK24BrainEntityModel.updateOne(
      { uid: log.entity_C_uid },
      { auditStatus: 'active', transformationId },
    );
    return {
      ok:      true,
      message: AIDIL_JUDGMENT_LABELS.MAKMUR,
    };
  }

  if (judgment === 'WAQF') {
    await QXK24BrainLogModel.updateOne(
      { transformationId },
      {
        auditStatus:       'waqf',
        founderJudgment:   'WAQF',
        founderCorrection: correction?.trim(),
        auditedAt:         now,
      },
    );
    await QXK24BrainEntityModel.updateOne(
      { uid: log.entity_C_uid },
      {
        auditStatus:       'waqf',
        dissolvedAt:       now,
        dissolutionReason: correction?.trim() ?? 'WAQF — halted by P.alt',
        transformationId,
      },
    );
    return {
      ok:      true,
      message: AIDIL_JUDGMENT_LABELS.WAQF,
    };
  }

  if (judgment === 'ISLAH') {
    if (!correction?.trim()) {
      return {
        ok:      false,
        message: 'ISLAH requires a correction — what P.alt says must change.',
      };
    }

    await restoreMasterFromLog(founderId, log);
    await dissolveEntityC(log.entity_C_uid, transformationId, correction);

    await QXK24BrainLogModel.updateOne(
      { transformationId },
      {
        auditStatus:       'superseded',
        founderJudgment:   'ISLAH',
        founderCorrection: correction.trim(),
        auditedAt:         now,
        dissolvedAt:       now,
      },
    );

    const correctedMessage = buildCorrectedTeaching(
      log.entity_B_content,
      correction,
    );

    const result = await safeTransform(correctedMessage, founderId);
    const newId = result.transformationId;

    if (newId) {
      await QXK24BrainLogModel.updateOne(
        { transformationId },
        { replacementTransformationId: newId },
      );
      await QXK24BrainLogModel.updateOne(
        { transformationId: newId },
        { correctedFromId: transformationId },
      );
    }

    return {
      ok:                        true,
      message:                   'ISLAH applied — Entity C dissolved. A and B reconstructed; new C created with P.alt correction.',
      replacementTransformationId: newId,
    };
  }

  return { ok: false, message: 'Unknown judgment.' };
}

export async function buildTransformationAuditContextBlock(
  founderId = 'masa-bayu',
): Promise<string> {
  const pending = await QXK24BrainLogModel.countDocuments({
    founderId,
    auditStatus: 'pending',
  });

  const recent = await listTransformationsForAudit(founderId, { limit: 5 });

  const lines = recent.map((t) =>
    `${t.transformationId} · ${t.family} (${t.principle}) Stage ${t.stage} · ${t.auditStatus}`,
  );

  return `
[AIDIL TRANSFORMATION AUDIT — Constitutional review trail]
Pending P.alt review: ${pending}
Judgments: MAKMUR (sound) · ISLAH (correct — reverses C, rebuilds) · WAQF (halt)

Recent transformations:
${lines.length ? lines.join('\n') : 'None yet'}

P.alt may review via GET /api/adam/brain/transformations and POST .../judge.
`.trim();
}
