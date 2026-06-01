// ============================================================
// QXK24 ADAM Teaching Engine — Audit Service
// File: src/adam/adam-audit.service.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { getDeepModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
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

  let hukumZ:      HukumZResult;
  let hukumX:      HukumXProcess;
  let adab:        AdabScore;
  let healthScore: number;
  let judgment:    ConstitutionalJudgment;
  let findings:    string[];
  let recommendations: string[];
  let canAdvance:  boolean;

  try {
    const raw = await llmCompleteUserPrompt(
      'ADAM constitutional audit engine.',
      buildAuditPrompt(req.targetType, req.stage, targetData, req.context),
      getDeepModel(),
      2048,
    );
    const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    hukumZ          = parsed.hukumZ;
    hukumX          = parsed.hukumX;
    adab            = parsed.adab;
    healthScore     = parsed.healthScore;
    judgment        = parsed.judgment;
    findings        = parsed.findings        ?? [];
    recommendations = parsed.recommendations ?? [];
    canAdvance      = parsed.canAdvance      ?? false;
  } catch {
    hukumZ          = { pola: 'BELUM', kadar: 'BELUM', pasangan: 'BELUM', keseimbangan: 'BELUM' };
    hukumX          = { fikir: 'Audit engine unavailable', ikhtiar: 'N/A', usaha: 'N/A', natijah: 'WAQF' };
    adab            = { benar: 0, amanah: 0, menyampaikan: 0, bijaksana: 0, total: 0 };
    healthScore     = 0;
    judgment        = 'WAQF';
    findings        = ['Audit engine connection failed'];
    recommendations = ['Restore constitutional engine and resubmit'];
    canAdvance      = false;
  }

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
