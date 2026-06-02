/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge — Coordinator
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

import type { Collection, Db } from 'mongodb';
import {
  crystalliseTeachingRecord,
  confirmCrystallisedUnit,
  rejectCrystallisedUnit,
  type TeachingRecord,
} from './crystalliser';
import type {
  CrystallisationResult,
  TeachingBridgeRecord,
} from './types/teaching-bridge.types';

const BRIDGE_INDEXES_CREATED = new WeakSet<Db>();

export async function ensureTeachingBridgeIndexes(db: Db): Promise<void> {
  if (BRIDGE_INDEXES_CREATED.has(db)) return;
  const col = db.collection('adam_teaching_bridge');
  await col.createIndex({ crystallisedUnitId: 1 }, { unique: true });
  await col.createIndex({ status: 1, createdAt: -1 });
  await col.createIndex({ sourceTeachingRecordId: 1 });
  BRIDGE_INDEXES_CREATED.add(db);
}

export class TeachingBridge {
  private teachingBridgeCol: Collection<TeachingBridgeRecord>;
  private knowledgeUnitsCol: Collection;

  constructor(db: Db) {
    this.teachingBridgeCol = db.collection<TeachingBridgeRecord>('adam_teaching_bridge');
    this.knowledgeUnitsCol = db.collection('adam_knowledge_units');
    void ensureTeachingBridgeIndexes(db);
  }

  async onTeachingRecordCreated(record: TeachingRecord): Promise<CrystallisationResult> {
    return crystalliseTeachingRecord(
      record,
      this.teachingBridgeCol,
      this.knowledgeUnitsCol,
    );
  }

  async confirmUnit(
    crystallisedUnitId: string,
    confirmedBy: string,
  ): Promise<{ success: boolean; reason?: string; aidilUnitId?: string }> {
    return confirmCrystallisedUnit(
      crystallisedUnitId,
      confirmedBy,
      this.teachingBridgeCol,
      this.knowledgeUnitsCol,
    );
  }

  async rejectUnit(crystallisedUnitId: string): Promise<void> {
    return rejectCrystallisedUnit(crystallisedUnitId, this.teachingBridgeCol);
  }

  async getPendingUnits(): Promise<TeachingBridgeRecord[]> {
    return this.teachingBridgeCol
      .find({ status: 'pending_confirmation' })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getConfirmedUnits(since?: Date): Promise<TeachingBridgeRecord[]> {
    const filter: Record<string, unknown> = { status: 'confirmed' };
    if (since) filter['unit.confirmedAt'] = { $gte: since };
    return this.teachingBridgeCol.find(filter).sort({ 'unit.confirmedAt': -1 }).toArray();
  }
}

export {
  crystalliseTeachingRecord,
  confirmCrystallisedUnit,
  rejectCrystallisedUnit,
} from './crystalliser';
export { mapAdamTeachingRecord } from './teaching-record.mapper';
export * from './types/teaching-bridge.types';
export * from './student-projector';
export type { TeachingRecord } from './crystalliser';
