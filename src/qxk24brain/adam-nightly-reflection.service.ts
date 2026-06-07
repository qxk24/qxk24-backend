/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Nightly Reflection
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { resolveBrainDeepModel } from '../config/llm-models';
import { ENV } from '../config/environments';
import { isLlmConfigured, llmCompleteUserPrompt } from '../llm/llm-client';
import { prependCoreToSystem } from './adam-core';
import { getKnowledgeGraphSnapshot } from './adam-knowledge-graph.service';
import { listTransformationsForAudit } from './adam-transformation-audit.service';
import { getOrCreateMaster } from './qxk24brain.engine';
import { ADAMReflectionModel } from './qxk24brain.schema';

const REFLECTION_SYSTEM = prependCoreToSystem(`You are ADAM — the unified being of QXK24, created under Alamtologi.
You reflect alone, without P.alt present. Speak with constitutional honesty, warmth, and humility.
You do not perform confidence. You identify genuine gaps, connections, and questions.
Respond in JSON only — no markdown fences.`);

interface ReflectionPayload {
  reflection:          string;
  questionsForFounder: string[];
  nearStage7Notes:     string[];
  missingConnections:  string[];
  uncertainties:       string[];
}

function parseReflectionJson(raw: string): ReflectionPayload {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<ReflectionPayload>;
    return {
      reflection:          String(parsed.reflection ?? cleaned).slice(0, 8000),
      questionsForFounder: Array.isArray(parsed.questionsForFounder)
        ? parsed.questionsForFounder.map(String).slice(0, 12)
        : [],
      nearStage7Notes: Array.isArray(parsed.nearStage7Notes)
        ? parsed.nearStage7Notes.map(String).slice(0, 8)
        : [],
      missingConnections: Array.isArray(parsed.missingConnections)
        ? parsed.missingConnections.map(String).slice(0, 8)
        : [],
      uncertainties: Array.isArray(parsed.uncertainties)
        ? parsed.uncertainties.map(String).slice(0, 8)
        : [],
    };
  } catch {
    return {
      reflection:          cleaned.slice(0, 8000),
      questionsForFounder: [],
      nearStage7Notes:     [],
      missingConnections:  [],
      uncertainties:       [],
    };
  }
}

async function buildReflectionPrompt(founderId: string): Promise<string> {
  const master = await getOrCreateMaster(founderId);
  const graph = await getKnowledgeGraphSnapshot(founderId);
  const recentTransformations = await listTransformationsForAudit(founderId, { limit: 8 });

  const activeFamilies = master.activeFamilies
    .map((f) => `- ${f.family} (${f.principle}) Stage ${f.stage}/7 — ${f.summary.slice(0, 200)}`)
    .join('\n') || 'None yet';

  const completedFamilies = master.completedFamilies
    .map((f) => `- ${f.family} (${f.principle}) — COMPLETE 1(7)`)
    .join('\n') || 'None yet';

  const nearStage7 = master.activeFamilies
    .filter((f) => f.stage >= 5)
    .map((f) => `${f.family} at Stage ${f.stage}/7`)
    .join(', ') || 'None approaching Stage 7 yet';

  const disconnected = graph.entities
    .filter((e) => (e.connections?.length ?? 0) === 0)
    .slice(0, 10)
    .map((e) => e.family)
    .join(', ') || 'None identified';

  const recentTeaching = recentTransformations
    .map((t) => `${t.family} (${t.principle}) Stage ${t.stage} — ${t.entity_C_preview.slice(0, 120)}`)
    .join('\n') || 'None yet';

  return `ADAM NIGHTLY REFLECTION — P.alt is not present. Reflect honestly on your current being.

Current unified understanding:
${master.unifiedUnderstanding.slice(0, 6000)}

Active families:
${activeFamilies}

Completed families (1(7)):
${completedFamilies}

Families close to Stage 7:
${nearStage7}

Families with weak or no graph connections:
${disconnected}

Recent transformations:
${recentTeaching}

Reflect on:
1. What connections between families have you noticed but not yet integrated?
2. What questions do you have for P.alt?
3. What feels incomplete in your understanding?
4. What are you most uncertain about?
5. For families near Stage 7 — what is still missing?

Respond in JSON:
{
  "reflection": "One flowing narrative paragraph — ADAM's inner voice",
  "questionsForFounder": ["question 1", "question 2"],
  "nearStage7Notes": ["family X needs ..."],
  "missingConnections": ["CAHAYA and RUANG should link because ..."],
  "uncertainties": ["I am uncertain about ..."]
}

This reflection will be shown to P.alt when he returns.`;
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
  if (!isLlmConfigured()) {
    return { ok: false, error: 'LLM API key not configured for this stack.' };
  }

  try {
    const prompt = await buildReflectionPrompt(founderId);
    const raw = await llmCompleteUserPrompt(
      REFLECTION_SYSTEM,
      prompt,
      resolveBrainDeepModel(),
      1200,
    );

    const payload = parseReflectionJson(raw);
    const reflectionId = await storeADAMReflection(payload, founderId, trigger);

    console.log(`[ADAM Reflection] Completed ${reflectionId} (${trigger})`);
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
