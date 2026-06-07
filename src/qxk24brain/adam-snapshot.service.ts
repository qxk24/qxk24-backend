/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Quantum State Snapshot (Layer 6)
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
 *
 * Like a database transaction — if transformation fails, rollback to snapshot.
 * Prevents corrupted half-transformations.
 */

import { ENV } from '../config/environments';
import { ADAMSnapshotModel, type SnapshotStatus } from './adam-snapshot.schema';
import {
  AlamtologiBrainEntityModel,
  AlamtologiBrainMasterModel,
} from './qxk24brain.schema';
import { getOrCreateMaster, transformAIDIL } from './qxk24brain.engine';
import type { TeachingTransformContext } from './adam-teaching-record.service';

const SNAPSHOT_RETENTION = parseInt(process.env.ADAM_SNAPSHOT_RETENTION ?? '10', 10) || 10;

function stripMongoInternals<T extends Record<string, unknown>>(doc: T): Omit<T, '_id' | '__v'> {
  const { _id, __v, ...rest } = doc;
  void _id;
  void __v;
  return rest;
}

export async function createSnapshot(
  founderId: string,
  reason: string,
): Promise<string> {
  const snapshotId = `K24SNAP-${Date.now()}`;
  const master = await getOrCreateMaster(founderId);
  const activeFamilies = await AlamtologiBrainEntityModel
    .find({ founderId, isComplete: false })
    .lean();

  const entityUids = activeFamilies.map((e) => e.uid);

  await ADAMSnapshotModel.create({
    snapshotId,
    founderId,
    reason,
    masterState:  JSON.stringify(stripMongoInternals(master.toObject())),
    entityStates: JSON.stringify(activeFamilies.map((e) => stripMongoInternals(e as Record<string, unknown>))),
    entityUids,
    masa_snapshot: new Date(),
    status:        'ACTIVE',
    kernel:        ENV.QXK24_KERNEL_VERSION,
    era:           ENV.QXK24_ERA,
  });

  return snapshotId;
}

export async function rollbackToSnapshot(
  snapshotId: string,
  founderId: string,
): Promise<void> {
  const snapshot = await ADAMSnapshotModel.findOne({
    snapshotId,
    founderId,
    status: 'ACTIVE',
  });

  if (!snapshot) {
    throw new Error(`Snapshot not found or not active: ${snapshotId}`);
  }

  const masterState = JSON.parse(snapshot.masterState) as Record<string, unknown>;
  const entityStates = JSON.parse(snapshot.entityStates) as Record<string, unknown>[];

  await AlamtologiBrainMasterModel.findOneAndUpdate(
    { founderId },
    { $set: stripMongoInternals(masterState) },
    { upsert: true },
  );

  const restoredUids = new Set<string>();

  for (const entity of entityStates) {
    const clean = stripMongoInternals(entity);
    const uid = clean.uid as string;
    if (!uid) continue;
    restoredUids.add(uid);
    await AlamtologiBrainEntityModel.findOneAndUpdate(
      { uid },
      { $set: clean },
      { upsert: true },
    );
  }

  // Remove incomplete entities born during the failed transformation
  await AlamtologiBrainEntityModel.deleteMany({
    founderId,
    isComplete: false,
    uid:        { $nin: [...restoredUids] },
    masa_born:  { $gte: snapshot.masa_snapshot },
  });

  await ADAMSnapshotModel.findOneAndUpdate(
    { snapshotId },
    { status: 'RESTORED', masa_restored: new Date() },
  );
}

export async function pruneSnapshots(founderId: string): Promise<number> {
  const superseded = await ADAMSnapshotModel.deleteMany({
    founderId,
    status: 'SUPERSEDED',
  });

  const snapshots = await ADAMSnapshotModel
    .find({ founderId, status: 'ACTIVE' })
    .sort({ masa_snapshot: -1 });

  if (snapshots.length <= SNAPSHOT_RETENTION) {
    return superseded.deletedCount;
  }

  const toDelete = snapshots.slice(SNAPSHOT_RETENTION);
  const ids = toDelete.map((s) => s.snapshotId);

  const active = await ADAMSnapshotModel.deleteMany({ snapshotId: { $in: ids } });
  return superseded.deletedCount + active.deletedCount;
}

export async function listSnapshots(
  founderId: string,
  limit = 20,
): Promise<Array<{
  snapshotId: string;
  reason: string;
  status: SnapshotStatus;
  masa_snapshot: Date;
  entityCount: number;
}>> {
  const rows = await ADAMSnapshotModel.find({ founderId })
    .sort({ masa_snapshot: -1 })
    .limit(Math.min(limit, 50))
    .lean();

  return rows.map((s) => ({
    snapshotId:    s.snapshotId,
    reason:        s.reason,
    status:        s.status,
    masa_snapshot: s.masa_snapshot,
    entityCount:   s.entityUids?.length ?? 0,
  }));
}

export async function transformWithSnapshot(
  founderMessage: string,
  founderId = 'masa-bayu',
  context: TeachingTransformContext = {},
): Promise<Awaited<ReturnType<typeof transformAIDIL>>> {
  const snapshotId = await createSnapshot(
    founderId,
    `Before transformation: ${founderMessage.slice(0, 50)}`,
  );

  try {
    const result = await transformAIDIL(founderMessage, founderId, context);

    await ADAMSnapshotModel.findOneAndUpdate(
      { snapshotId },
      { status: 'SUPERSEDED', masa_superseded: new Date() },
    );

    await pruneSnapshots(founderId);
    return result;
  } catch (err) {
    console.error('[Alamtologi Brain] Transformation failed — rolling back to snapshot:', snapshotId);
    try {
      await rollbackToSnapshot(snapshotId, founderId);
    } catch (rollbackErr) {
      console.error('[Alamtologi Brain] Snapshot rollback failed:', rollbackErr);
    }
    throw err;
  }
}
