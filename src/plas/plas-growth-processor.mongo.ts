/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Plas-B Growth Signal Processor — Mongo adapter
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { Db, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import {
  consumePendingZpdSignals,
  PLAS_COLLECTIONS,
  ZPD_ADVANCEMENT_SIGNAL,
  type GrowthSignalCollection,
  type GrowthSignalRecord,
} from './vendor/growth-signal-processor';

export function createMongoGrowthSignalCollection(db: Db): GrowthSignalCollection {
  const col = db.collection<GrowthSignalRecord>(PLAS_COLLECTIONS.growthSignals);

  return {
    async findUnprocessed(studentId: string, limit: number): Promise<GrowthSignalRecord[]> {
      return col
        .find({
          studentId,
          processed: { $ne: true },
          signalType: ZPD_ADVANCEMENT_SIGNAL,
        })
        .sort({ recordedAt: 1 })
        .limit(limit)
        .toArray();
    },

    async markProcessed(ids: unknown[]): Promise<void> {
      if (!ids.length) return;
      await col.updateMany(
        { _id: { $in: ids as ObjectId[] } },
        { $set: { processed: true, processedAt: new Date() } },
      );
    },
  };
}

/** Direction B — consume pending ZPD signals into student continuity bridge */
export async function consumePendingZpdSignalsForBridge(
  studentId: string,
): Promise<string[]> {
  const db = mongoose.connection.db;
  if (!db) return [];

  try {
    const lines = await consumePendingZpdSignals(
      studentId,
      createMongoGrowthSignalCollection(db),
    );

    if (lines.length) {
      console.log(`[Plas-B] Consumed ZPD growth signal(s) for student ${studentId}`);
    }

    return lines;
  } catch (err) {
    console.error(`[Plas-B] Growth signal processor failed (non-fatal) for ${studentId}:`, err);
    return [];
  }
}
