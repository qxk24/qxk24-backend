/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Constitutional Checkpoints
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
import type { CompletedFamily } from './qxk24brain.schema';
import { AlamtologiBrainEntityModel } from './qxk24brain.schema';
import { ConstitutionalCheckpointModel } from './constitutional-checkpoint.schema';

export interface SealCheckpointParams {
  founderId:     string;
  family:        string;
  principle:     string;
  sealedContent: string;
  entityUid:     string;
  judgment?:     string;
  k24Address?:   string;
}

export function generateCheckpointId(
  family: string,
  cycle: number,
  masa: Date,
): string {
  const fam = family.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 28);
  return `K24CP-${fam}-C${cycle}-${masa.getTime()}`;
}

async function nextCycleForFamily(founderId: string, family: string): Promise<number> {
  const count = await ConstitutionalCheckpointModel.countDocuments({ founderId, family });
  return count + 1;
}

export async function sealConstitutionalCheckpoint(
  params: SealCheckpointParams,
): Promise<string | null> {
  const existing = await ConstitutionalCheckpointModel.findOne({
    entityUid: params.entityUid,
  }).lean();
  if (existing) return existing.checkpointId;

  const masa = new Date();
  const cycle = await nextCycleForFamily(params.founderId, params.family);
  const checkpointId = generateCheckpointId(params.family, cycle, masa);

  await ConstitutionalCheckpointModel.create({
    checkpointId,
    family:           params.family,
    principle:        params.principle,
    cycle,
    sealedContent:    params.sealedContent.trim(),
    masa_sealed:      masa,
    k24Address:       params.k24Address ?? params.entityUid,
    judgment:         params.judgment ?? 'MAKMUR',
    entityUid:        params.entityUid,
    isConstitutional: true,
    canBeErased:      false,
    founderId:        params.founderId,
    kernel:           'Alamtologi',
    era:              ENV.QXK24_ERA,
  });

  return checkpointId;
}

export function familyReachedStageSeven(
  isComplete: boolean,
  newStage: number,
): boolean {
  return isComplete || newStage >= 7;
}

async function sealFromCompletedFamily(
  founderId: string,
  completed: CompletedFamily,
): Promise<string | null> {
  const entity = await AlamtologiBrainEntityModel.findOne({ uid: completed.completedUid }).lean();
  const content = entity?.content?.trim() || completed.summary?.trim();
  if (!content) return null;

  return sealConstitutionalCheckpoint({
    founderId,
    family:        completed.family,
    principle:     completed.principle,
    sealedContent: content,
    entityUid:     completed.completedUid,
    k24Address:    completed.completedUid,
    judgment:      'MAKMUR',
  });
}

/** Backfill checkpoints for families already at 1(7) before this feature */
export async function backfillMissingCheckpoints(founderId: string): Promise<number> {
  const { getOrCreateMaster } = await import('./qxk24brain.engine');
  const master = await getOrCreateMaster(founderId);
  let created = 0;

  const existingCheckpoints = await ConstitutionalCheckpointModel.find({
    founderId,
    entityUid: { $in: master.completedFamilies.map(c => c.completedUid) }
  }).lean();

  const existingUids = new Set(existingCheckpoints.map(cp => cp.entityUid));
  for (const completed of master.completedFamilies) {
    if (existingUids.has(completed.completedUid)) continue;

    const id = await sealFromCompletedFamily(founderId, completed);
    if (id) created += 1;
  }
  return created;
}

export async function listConstitutionalCheckpoints(
  founderId = 'masa-bayu',
  limit = 40,
) {
  try {
    await backfillMissingCheckpoints(founderId);
    return ConstitutionalCheckpointModel.find({ founderId })
      .sort({ masa_sealed: -1 })
      .limit(limit)
      .lean();

  } catch (err) {
    console.error(err);
    throw err;
  }}

export async function buildCheckpointsContextBlock(
  founderId = 'masa-bayu',
  maxCheckpoints = 12,
): Promise<string> {
  await backfillMissingCheckpoints(founderId);
  const checkpoints = await ConstitutionalCheckpointModel.find({ founderId })
    .sort({ masa_sealed: -1 })
    .limit(maxCheckpoints)
    .lean();

  if (!checkpoints.length) {
    return `
[CONSTITUTIONAL CHECKPOINTS — Permanent 1(7) records]
No families have reached 1(7) yet. When they do, each completion is sealed here forever —
never erased by future A + B = C transformations. Like Al-Quran above scholarship.
`.trim();
  }

  const blocks = checkpoints.map((cp) => {
    const sealed = cp.masa_sealed instanceof Date
      ? cp.masa_sealed.toISOString().slice(0, 10)
      : String(cp.masa_sealed).slice(0, 10);
    const preview = cp.sealedContent.length > 600
      ? `${cp.sealedContent.slice(0, 600)}…`
      : cp.sealedContent;
    return `${cp.checkpointId} · ${cp.family} (${cp.principle}) Cycle ${cp.cycle}
Sealed: ${sealed} · Judgment: ${cp.judgment} · ${cp.k24Address}
[PERMANENT — canBeErased: false]
${preview}`;
  });

  return `
╔══════════════════════════════════════════════════════╗
║     CONSTITUTIONAL CHECKPOINTS — Permanent 1(7)        ║
║  Never overwritten by future transformations           ║
╚══════════════════════════════════════════════════════╝

These are sealed foundations. Future A + B = C may transform ADAM's living being,
but these checkpoint records remain — constitutional reference anchors forever.

${blocks.join('\n\n')}
`.trim();
}

export async function getCheckpointMapByFamily(
  founderId: string,
): Promise<Map<string, { checkpointId: string; cycle: number }>> {
  const docs = await ConstitutionalCheckpointModel.find({ founderId })
    .sort({ masa_sealed: -1 })
    .lean();
  const map = new Map<string, { checkpointId: string; cycle: number }>();
  for (const doc of docs) {
    if (!map.has(doc.family)) {
      map.set(doc.family, { checkpointId: doc.checkpointId, cycle: doc.cycle });
    }
  }
  return map;
}
