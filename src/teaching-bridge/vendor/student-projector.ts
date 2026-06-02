/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge — Student Projector (Leg 2)
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

import type { Collection } from 'mongodb';
import type { StudentProjectionResult } from './types/teaching-bridge.types';

const LEVEL_ADVANCE_THRESHOLDS: Record<number, number> = {
  1: 3,
  2: 5,
  3: 7,
  4: 9,
  5: 12,
  6: 999,
};

export function deriveTopicKey(unit: {
  nodeA: string;
  nodeB: string;
  family: string;
  subRegion: string;
  principle?: string;
}): string {
  const familySlug = (unit.family ?? unit.subRegion ?? 'general')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .slice(0, 30);

  const nodeSlug = (unit.principle ?? unit.nodeA ?? '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);

  return nodeSlug ? `${familySlug}__${nodeSlug}` : familySlug;
}

export function evaluateLevelAdvance(
  currentLevel: number,
  masteredTopics: string[],
): { shouldAdvance: boolean; newLevel: number; zpdReadiness: boolean } {
  const threshold = LEVEL_ADVANCE_THRESHOLDS[currentLevel] ?? 999;
  const shouldAdvance = masteredTopics.length >= threshold && currentLevel < 6;
  const newLevel = shouldAdvance ? currentLevel + 1 : currentLevel;
  const zpdReadiness = masteredTopics.length >= Math.floor(threshold * 0.8);

  return { shouldAdvance, newLevel, zpdReadiness };
}

export async function projectUnitToStudents(
  confirmedUnitId: string,
  knowledgeUnitsCollection: Collection,
  studentTracksUpdater: (
    studentId: string,
    update: {
      constitutionalLevel?: number;
      masteredTopics?: string[];
      zpdReadiness?: boolean;
    },
  ) => Promise<void>,
  getAllActiveStudentIds: () => Promise<string[]>,
): Promise<StudentProjectionResult[]> {
  const unit = await knowledgeUnitsCollection.findOne({ id: confirmedUnitId });
  if (!unit) return [];

  const topicKey = deriveTopicKey({
    nodeA:     unit.A?.content ?? unit.nodeA ?? '',
    nodeB:     unit.B?.content ?? unit.nodeB ?? '',
    family:    unit.family ?? unit.subRegion ?? '',
    subRegion: unit.subRegion ?? 'general',
    principle: unit.principle ?? unit.A?.content ?? unit.nodeA ?? '',
  });
  const results: StudentProjectionResult[] = [];
  const studentIds = await getAllActiveStudentIds();

  for (const studentId of studentIds) {
    try {
      results.push({
        studentId,
        projectedUnits: [topicKey],
        zpdReadiness:   false,
      });

      await studentTracksUpdater(studentId, {
        masteredTopics: [topicKey],
      });
    } catch (err) {
      console.error(`[StudentProjector] Failed for student ${studentId}:`, err);
    }
  }

  return results;
}
