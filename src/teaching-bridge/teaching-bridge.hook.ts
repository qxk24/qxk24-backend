/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Teaching Bridge Hook (qxk24-backend)
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

import mongoose from 'mongoose';
import type { AdamTeachingRecordDocument } from '../qxk24brain/adam-teaching-record.schema';
import { TeachingBridge } from './vendor/index';
import { mapAdamTeachingRecord } from './vendor/teaching-record.mapper';

let bridgeSingleton: TeachingBridge | null = null;

function getTeachingBridge(): TeachingBridge | null {
  const db = mongoose.connection.db;
  if (!db) return null;
  if (!bridgeSingleton) bridgeSingleton = new TeachingBridge(db);
  return bridgeSingleton;
}

/** Fire-and-forget after recordTeachingTransformation — never blocks chat */
export function hookTeachingBridgeAfterRecord(
  doc: AdamTeachingRecordDocument,
): void {
  void (async () => {
    try {
      const bridge = getTeachingBridge();
      if (!bridge) {
        console.warn('[TeachingBridge] MongoDB not ready — skip crystallisation');
        return;
      }

      const record = mapAdamTeachingRecord({
        _id:              doc._id,
        recordId:         doc.recordId,
        transformationId: doc.transformationId,
        sessionId:        doc.sessionId,
        founderMessageId: doc.founderMessageId,
        principle:        doc.principle,
        family:           doc.family,
        stage:            doc.stage,
        teachingIntent:   doc.teachingIntent,
        outcomeSummary:   doc.outcomeSummary,
        relationalTags:   doc.relationalTags,
        entity_C_uid:     doc.entity_C_uid,
        createdAt:        doc.masa_recorded,
      });

      const result = await bridge.onTeachingRecordCreated(record);

      if (result.success) {

      } else {
        console.warn(`[TeachingBridge] Suspended: ${result.reason ?? result.status}`);
      }
    } catch (err) {
      console.error('[TeachingBridge] Hook error (non-fatal):', err);
    }
  })();
}
