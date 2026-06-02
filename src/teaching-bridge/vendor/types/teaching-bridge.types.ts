/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge Types
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

import type { VerificationAuthority } from './verification.types';

export type TeachingBridgeStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'suspended';

export interface CrystallisedUnit {
  id: string;
  sourceTeachingRecordId: string;
  sourceTransformationId: string;
  sessionId: string;
  founderMessageId: string;

  nodeA: string;
  relationship: string;
  nodeB: string;
  synthesis: string;
  level: number;
  subRegion: string;
  family: string;
  relationalTags: string[];

  primaryAuthority: VerificationAuthority;
  quranReference: string;
  quranRootTrace: import('./verification.types').CrystallisedUnitTrace;
  confidenceScore: number;
  maqasidDimensions: string[];

  status: TeachingBridgeStatus;
  createdAt: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
}

export interface TeachingBridgeRecord {
  crystallisedUnitId: string;
  sourceTeachingRecordId: string;
  transformationId: string;
  sessionId: string;
  status: TeachingBridgeStatus;
  unit: CrystallisedUnit;
  founderNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProjectionRule {
  unitId: string;
  level: number;
  subRegion: string;
  family: string;
  relationalTags: string[];
  masteredTopicKey: string;
  levelThreshold: number;
}

export interface StudentProjectionResult {
  studentId: string;
  projectedUnits: string[];
  newLevel?: number;
  zpdReadiness: boolean;
}

export interface CrystallisationResult {
  success: boolean;
  crystallisedUnitId?: string;
  status: TeachingBridgeStatus;
  reason?: string;
  unit?: CrystallisedUnit;
}
