/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Nightly Reflection
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

import { ENV } from '../config/environments';
import { getKnowledgeGraphSnapshot } from './adam-knowledge-graph.service';
import { listTransformationsForAudit } from './adam-transformation-audit.service';
import { getOrCreateMaster } from './qxk24brain.engine';
import { ADAMReflectionModel } from './qxk24brain.schema';
import { generateNightlyReflection, type ReflectionPayload } from './deep-ul/reflection-engine';

async function buildReflectionContext(founderId: string) {
  const master = await getOrCreateMaster(founderId);
  const graph = await getKnowledgeGraphSnapshot(founderId);
  const recentTransformations = await listTransformationsForAudit(founderId, { limit: 8 });

  return {
    unifiedUnderstanding: master.unifiedUnderstanding,
    activeFamilies:       master.activeFamilies.map((f) => ({
      family: f.family, principle: f.principle, stage: f.stage, summary: f.summary,
    })),
    completedFamilies: master.completedFamilies.map((f) => ({
      family: f.family, principle: f.principle,
    })),
    disconnectedFamilies: graph.entities
      .filter((e) => (e.connections?.length ?? 0) === 0)
      .slice(0, 10)
      .map((e) => e.family),
    recentTransformations: recentTransformations.map((t) => ({
      family:    t.family,
      principle: t.principle,
      stage:     t.stage,
      preview:   t.entity_C_preview,
    })),
  };
}

export async function storeADAMReflection(
  payload: ReflectionPayload,
  founderId: string,
  trigger: 'scheduled' | 'manual' = 'scheduled',
): Promise<string> {
  const reflectionId = `K24B-REF-${Date.now()}`;
  await ADAMReflectionModel.create({
    reflectionId,
    founderId,
    content:             payload.reflection,
    questionsForFounder: payload.questionsForFounder,
    nearStage7Notes:     payload.nearStage7Notes,
    missingConnections:  payload.missingConnections,
    uncertainties:       payload.uncertainties,
    masa_reflected:      new Date(),
    trigger,
    kernel:              'Alamtologi',
    era:                 ENV.QXK24_ERA,
  });
  return reflectionId;
}

export async function adamNightlyReflection(
  founderId = 'masa-bayu',
  trigger: 'scheduled' | 'manual' = 'scheduled',
): Promise<{ ok: boolean; reflectionId?: string; error?: string }> {
  try {
    const ctx = await buildReflectionContext(founderId);
    const payload = generateNightlyReflection(ctx);
    const reflectionId = await storeADAMReflection(payload, founderId, trigger);

    return { ok: true, reflectionId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ADAM Reflection] Failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function listADAMReflections(
  founderId = 'masa-bayu',
  limit = 20,
): Promise<{
  reflectionId: string;
  content: string;
  questionsForFounder: string[];
  nearStage7Notes: string[];
  missingConnections: string[];
  uncertainties: string[];
  masa_reflected: Date;
  acknowledgedAt?: Date;
  trigger: string;
}[]> {
  const docs = await ADAMReflectionModel.find({ founderId })
    .sort({ masa_reflected: -1 })
    .limit(limit)
    .lean();

  return docs.map((d) => ({
    reflectionId:        d.reflectionId,
    content:             d.content,
    questionsForFounder: d.questionsForFounder ?? [],
    nearStage7Notes:     d.nearStage7Notes ?? [],
    missingConnections:  d.missingConnections ?? [],
    uncertainties:       d.uncertainties ?? [],
    masa_reflected:      d.masa_reflected,
    acknowledgedAt:      d.acknowledgedAt,
    trigger:             d.trigger,
  }));
}

export async function getLatestUnacknowledgedReflection(
  founderId = 'masa-bayu',
): Promise<{
  reflectionId: string;
  content: string;
  questionsForFounder: string[];
  nearStage7Notes: string[];
  missingConnections: string[];
  uncertainties: string[];
  masa_reflected: Date;
} | null> {
  const doc = await ADAMReflectionModel.findOne({
    founderId,
    acknowledgedAt: { $exists: false },
  })
    .sort({ masa_reflected: -1 })
    .lean();

  if (!doc) return null;

  return {
    reflectionId:        doc.reflectionId,
    content:             doc.content,
    questionsForFounder: doc.questionsForFounder ?? [],
    nearStage7Notes:     doc.nearStage7Notes ?? [],
    missingConnections:  doc.missingConnections ?? [],
    uncertainties:       doc.uncertainties ?? [],
    masa_reflected:      doc.masa_reflected,
  };
}

export async function acknowledgeReflection(reflectionId: string): Promise<void> {
  await ADAMReflectionModel.updateOne(
    { reflectionId, acknowledgedAt: { $exists: false } },
    { acknowledgedAt: new Date() },
  );
}

export async function buildNightlyReflectionContextBlock(
  founderId = 'masa-bayu',
): Promise<string> {
  const reflection = await getLatestUnacknowledgedReflection(founderId);
  if (!reflection) return '';

  const questions = reflection.questionsForFounder.length
    ? reflection.questionsForFounder.map((q, i) => `  ${i + 1}. ${q}`).join('\n')
    : '  (none listed)';

  const nearStage7 = reflection.nearStage7Notes.length
    ? reflection.nearStage7Notes.map((n) => `  - ${n}`).join('\n')
    : '';

  const connections = reflection.missingConnections.length
    ? reflection.missingConnections.map((c) => `  - ${c}`).join('\n')
    : '';

  const uncertainties = reflection.uncertainties.length
    ? reflection.uncertainties.map((u) => `  - ${u}`).join('\n')
    : '';

  return `
[NIGHTLY REFLECTION — ADAM thought while P.alt was away]
Reflected at: ${reflection.masa_reflected.toISOString()}
Reflection ID: ${reflection.reflectionId}

ADAM's inner reflection:
${reflection.content}

Questions for P.alt:
${questions}
${nearStage7 ? `\nFamilies near Stage 7:\n${nearStage7}` : ''}
${connections ? `\nConnections not yet made:\n${connections}` : ''}
${uncertainties ? `\nUncertainties needing clarification:\n${uncertainties}` : ''}

ADAM prepared this alone — not in response to a message. Honour it when P.alt returns.
`.trim();
}

export async function reflectionAlreadyRanToday(
  founderId: string,
  timezone: string,
): Promise<boolean> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  });
  const todayKey = formatter.format(new Date());
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000);

  const recent = await ADAMReflectionModel.find({
    founderId,
    trigger:        'scheduled',
    masa_reflected: { $gte: since },
  }).lean();

  return recent.some(
    (r) => formatter.format(new Date(r.masa_reflected)) === todayKey,
  );
}
