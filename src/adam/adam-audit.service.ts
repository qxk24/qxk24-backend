/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Audit Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

// ============================================================
// QXK24 ADAM Teaching Engine — Audit Service
// File: src/adam/adam-audit.service.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { runConstitutionalJudgment } from '../qxk24brain/deep-ul/constitutional-judgment-engine';
import { ADAMAuditModel, ADAMJournalModel, ADAMTeachingModel } from './adam.schema';
import type {
  ADAMAuditReport,
  ADAMAuditRequest,
  AdabScore,
  AuditStage,
  ConstitutionalJudgment,
  HukumXProcess,
  HukumZResult,
} from './adam.types';

// ─── Build Audit Prompt ───────────────────────────────────────

function buildAuditPrompt(
  targetType: string,
  stage:      AuditStage,
  targetData: Record<string, unknown>,
  context?:   string,
): string {
  return `You are ADAM performing a constitutional stage audit.

TARGET TYPE: ${targetType}
STAGE: ${stage}
${context ? `CONTEXT: ${context}` : ''}
TARGET DATA:
${JSON.stringify(targetData, null, 2)}

Conduct a full constitutional audit and return ONLY JSON:
{
  "judgment": "MAKMUR|ISLAH|WAQF",
  "hukumZ": {
    "pola": "LULUS|GAGAL|BELUM",
    "kadar": "LULUS|GAGAL|BELUM",
    "pasangan": "LULUS|GAGAL|BELUM",
    "keseimbangan": "LULUS|GAGAL|BELUM"
  },
  "hukumX": {
    "fikir": "reasoning applied to this target",
    "ikhtiar": "effort assessment",
    "usaha": "execution quality",
    "natijah": "outcome quality"
  },
  "adab": {
    "benar": 0.0-1.0,
    "amanah": 0.0-1.0,
    "menyampaikan": 0.0-1.0,
    "bijaksana": 0.0-1.0,
    "total": 0-100
  },
  "healthScore": 0-100,
  "findings": ["finding 1", "finding 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "canAdvance": true|false
}
Return ONLY the JSON. No markdown.`;
}

// ─── Fetch Target Data ────────────────────────────────────────

async function fetchTargetData(
  targetId:   string,
  targetType: string,
): Promise<Record<string, unknown>> {
  switch (targetType) {
    case 'JOURNAL': {
      const doc = await ADAMJournalModel.findById(targetId).lean();
      return doc
        ? { title: (doc as any).title, status: (doc as any).status, judgment: (doc as any).judgment, ahriScore: (doc as any).ahriScore }
        : {};
    }
    case 'TEACHING': {
      const doc = await ADAMTeachingModel.findOne({ k24Address: targetId }).lean();
      return doc
        ? { topic: (doc as any).topic, principle: (doc as any).principle, status: (doc as any).status, tahapAkal: (doc as any).tahapAkal }
        : {};
    }
    default:
      return { targetId, targetType };
  }
}

// ─── Run Audit ────────────────────────────────────────────────

export async function runADAMAudit(req: ADAMAuditRequest): Promise<ADAMAuditReport> {
  const auditId    = uuidv4();
  const targetData = await fetchTargetData(req.targetId, req.targetType);
  const judgmentResult = runConstitutionalJudgment({
    question:    `${req.targetType} audit at ${req.stage}`,
    context:     req.context,
    targetData,
  });

  const hukumZ          = judgmentResult.hukumZ;
  const hukumX          = {
    fikir:   judgmentResult.response,
    ikhtiar: 'Deterministic UL audit',
    usaha:   req.stage,
    natijah: judgmentResult.judgment,
  };
  const adab            = {
    benar: 0.7, amanah: 0.7, menyampaikan: 0.7, bijaksana: 0.7,
    total: judgmentResult.healthScore,
  };
  const healthScore     = judgmentResult.healthScore;
  const judgment        = judgmentResult.judgment as ConstitutionalJudgment;
  const findings        = judgmentResult.findings;
  const recommendations = judgmentResult.recommendations;
  const canAdvance      = judgmentResult.canAdvance;

  const report: ADAMAuditReport = {
    auditId,
    targetId:    req.targetId,
    targetType:  req.targetType,
    stage:       req.stage,
    judgment,
    hukumZ,
    hukumX,
    adab,
    healthScore,
    findings,
    recommendations,
    canAdvance,
    auditedAt:   new Date(),
  };

  await ADAMAuditModel.create({
    targetId:    req.targetId,
    targetType:  req.targetType,
    stage:       req.stage,
    judgment,
    hukumZ,
    hukumX,
    adab,
    healthScore,
    findings,
    recommendations,
    canAdvance,
    auditedAt:   new Date(),
  });

  return report;
}

// ─── Get Audit History for Target ────────────────────────────

export async function getAuditHistory(
  targetId:   string,
  targetType: string,
): Promise<ADAMAuditReport[]> {
  const docs = await ADAMAuditModel
    .find({ targetId, targetType })
    .sort({ auditedAt: -1 })
    .lean();

  return docs.map((doc: any) => ({
    auditId:         doc._id.toString(),
    targetId:        doc.targetId,
    targetType:      doc.targetType,
    stage:           doc.stage,
    judgment:        doc.judgment,
    hukumZ:          doc.hukumZ,
    hukumX:          doc.hukumX,
    adab:            doc.adab,
    healthScore:     doc.healthScore,
    findings:        doc.findings,
    recommendations: doc.recommendations,
    canAdvance:      doc.canAdvance,
    auditedAt:       doc.auditedAt,
  }));
}
