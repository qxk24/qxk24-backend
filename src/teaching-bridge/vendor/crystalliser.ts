/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge — Crystalliser (Leg 1)
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

import crypto from 'crypto';
import type { Collection } from 'mongodb';
import type { VerificationAuthority, AidilKnowledgeUnitInsert } from './types/verification.types';
import { MAQASID_ALIGNED } from './types/verification.types';
import type {
  CrystallisedUnit,
  CrystallisationResult,
  TeachingBridgeRecord,
  TeachingBridgeStatus,
} from './types/teaching-bridge.types';

const ALAMTOLOGI_MIN_CONF = 0.75;
const DOMAIN_MIN_CONF = 0.7;

const CONTEXT_ONLY_AUTHORITIES: VerificationAuthority[] = [
  'hadith_context',
  'scholar_context',
  'tafsir_context',
  'unverified',
];

const MAQASID_MAP: Record<string, string[]> = {
  aqidah:     ['din', 'aql'],
  ibadah:     ['din'],
  fiqh:       ['din', 'mal'],
  alamtologi: ['din', 'aql', 'nafs'],
  psychology: ['nafs', 'aql'],
  economics:  ['mal'],
  family:     ['nasl', 'nafs'],
  health:     ['nafs'],
  default:    ['din'],
};

export interface TeachingRecord {
  _id: string;
  recordId: string;
  transformationId: string;
  sessionId: string;
  founderMessageId: string;
  entity_A: string;
  entity_B: string;
  entity_C: string;
  relationship: string;
  family: string;
  subRegion?: string;
  level?: number;
  relationalTags?: string[];
  quranReference?: string;
  quranRootTrace?: {
    ayah: string;
    text: string;
    principle: string;
    traceReason: string;
    tracedBy: 'quran' | 'alamtologi' | 'domain_verified';
    confidence: number;
  };
  confidenceScore?: number;
  primaryAuthority?: VerificationAuthority;
  entity_C_uid: string;
  createdAt: Date;
}

function inferMaqasid(subRegion: string, family: string): string[] {
  return (
    MAQASID_MAP[subRegion.toLowerCase()] ??
    MAQASID_MAP[family.toLowerCase()] ??
    MAQASID_MAP['default']
  );
}

function generateUnitId(transformationId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${transformationId}-${Date.now()}`)
    .digest('hex')
    .slice(0, 8);
  return `tb-${Date.now()}-${hash}`;
}

function evaluateAuthority(
  authority: VerificationAuthority,
  confidence: number,
  quranRef: string,
): { status: TeachingBridgeStatus; reason?: string } {
  if (CONTEXT_ONLY_AUTHORITIES.includes(authority)) {
    return {
      status: 'suspended',
      reason: `Authority '${authority}' cannot be primary — context-only source`,
    };
  }
  if (authority === 'quran' && !quranRef) {
    return {
      status: 'suspended',
      reason: 'Quran authority claimed but no reference provided',
    };
  }
  if (authority === 'alamtologi' && confidence < ALAMTOLOGI_MIN_CONF) {
    return {
      status: 'suspended',
      reason: `Alamtologi confidence ${confidence} below threshold ${ALAMTOLOGI_MIN_CONF}`,
    };
  }
  if (authority === 'domain_verified' && confidence < DOMAIN_MIN_CONF) {
    return {
      status: 'suspended',
      reason: `Domain confidence ${confidence} below threshold ${DOMAIN_MIN_CONF}`,
    };
  }
  return { status: 'pending_confirmation' };
}

function buildAidilInsert(unit: CrystallisedUnit): Omit<
  AidilKnowledgeUnitInsert,
  'id' | 'deleted' | 'createdAt' | 'updatedAt' | 'historicalRecord' | 'teachingBridge'
> {
  const level = Math.min(6, Math.max(1, unit.level));
  const slug = unit.id.replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'tb-unit';

  return {
    A: { id: `${slug}-a`, content: unit.nodeA, level, subRegion: unit.subRegion },
    B: { id: `${slug}-b`, content: unit.nodeB.slice(0, 4000), level, subRegion: unit.subRegion },
    C: { id: `${slug}-c`, content: unit.synthesis.slice(0, 4000), level, subRegion: unit.subRegion },
    relationship: { type: 'extends', weight: 1.0, direction: 'unidirectional' },
    state: 'conditional',
    level,
    subRegion: unit.subRegion,
    verificationSource: {
      primaryAuthority: unit.primaryAuthority,
      primarySource: unit.quranReference || `Alamtologi — ${unit.family}`,
      quranRootTrace: unit.quranRootTrace,
      confidence: unit.confidenceScore,
      verifiedAt: new Date(),
      verifiedBy: 'founder',
    },
    maqasidAlignment: MAQASID_ALIGNED,
  };
}

export async function crystalliseTeachingRecord(
  record: TeachingRecord,
  teachingBridgeCollection: Collection<TeachingBridgeRecord>,
  _knowledgeUnitsCollection: Collection,
): Promise<CrystallisationResult> {
  try {
    const existing = await teachingBridgeCollection.findOne({
      sourceTeachingRecordId: record._id,
    });
    if (existing) {
      return {
        success: false,
        status: existing.status,
        reason: 'Already crystallised',
        crystallisedUnitId: existing.crystallisedUnitId,
      };
    }

    const authority = (record.primaryAuthority ?? 'alamtologi') as VerificationAuthority;
    const confidence = record.quranRootTrace?.confidence ?? record.confidenceScore ?? 0;
    const quranRef = record.quranReference ?? '';
    const { status, reason } = evaluateAuthority(authority, confidence, quranRef);

    const unitId = generateUnitId(record.transformationId);
    const subRegion = record.subRegion ?? record.family ?? 'general';
    const level = record.level ?? 2;

    const unit: CrystallisedUnit = {
      id:                     unitId,
      sourceTeachingRecordId: record._id,
      sourceTransformationId: record.transformationId,
      sessionId:              record.sessionId,
      founderMessageId:       record.founderMessageId,

      nodeA:          record.entity_A,
      relationship:   record.relationship,
      nodeB:          record.entity_B,
      synthesis:      record.entity_C,
      level,
      subRegion,
      family:         record.family,
      relationalTags: record.relationalTags ?? [],

      primaryAuthority: authority,
      quranReference:   quranRef,
      quranRootTrace:   record.quranRootTrace ?? {
        ayah:         '6:38',
        text:         record.entity_C.slice(0, 280),
        principle:    record.entity_A,
        traceReason:  'Teaching bridge inferred trace',
        tracedBy:     'alamtologi',
        confidence,
      },
      confidenceScore:   confidence,
      maqasidDimensions: inferMaqasid(subRegion, record.family),

      status,
      createdAt: new Date(),
    };

    const bridgeRecord: TeachingBridgeRecord = {
      crystallisedUnitId:     unitId,
      sourceTeachingRecordId: record._id,
      transformationId:       record.transformationId,
      sessionId:              record.sessionId,
      status,
      unit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await teachingBridgeCollection.insertOne(bridgeRecord);

    if (status === 'suspended') {
      return { success: false, status, reason, crystallisedUnitId: unitId };
    }

    return {
      success: true,
      status:             'pending_confirmation',
      crystallisedUnitId: unitId,
      unit,
    };
  } catch (err) {
    console.error('[TeachingBridge:crystalliser] Error:', err);
    return { success: false, status: 'suspended', reason: String(err) };
  }
}

export async function confirmCrystallisedUnit(
  crystallisedUnitId: string,
  confirmedBy: string,
  teachingBridgeCollection: Collection<TeachingBridgeRecord>,
  knowledgeUnitsCollection: Collection,
): Promise<{ success: boolean; reason?: string; aidilUnitId?: string }> {
  const record = await teachingBridgeCollection.findOne({ crystallisedUnitId });
  if (!record) return { success: false, reason: 'Unit not found' };
  if (record.status !== 'pending_confirmation') {
    return { success: false, reason: `Unit is already ${record.status}` };
  }

  const unit = record.unit;
  const aidilInsert = buildAidilInsert(unit);
  const now = new Date();

  const aidilDoc: AidilKnowledgeUnitInsert & { source: string } = {
    ...aidilInsert,
    id:        unit.id,
    source:    'teaching_bridge',
    deleted:   false,
    createdAt: now,
    updatedAt: now,
    historicalRecord: [],
    teachingBridge: {
      source:      'teaching_bridge',
      confirmedBy,
      confirmedAt: now,
      marker:      ':= 1 Conditional',
    },
  };

  await knowledgeUnitsCollection.insertOne(aidilDoc);

  await teachingBridgeCollection.updateOne(
    { crystallisedUnitId },
    {
      $set: {
        status:            'confirmed',
        'unit.status':     'confirmed',
        'unit.confirmedAt': new Date(),
        'unit.confirmedBy': confirmedBy,
        updatedAt:         new Date(),
      },
    },
  );

  return { success: true, aidilUnitId: unit.id };
}

export async function rejectCrystallisedUnit(
  crystallisedUnitId: string,
  teachingBridgeCollection: Collection<TeachingBridgeRecord>,
): Promise<void> {
  await teachingBridgeCollection.updateOne(
    { crystallisedUnitId },
    { $set: { status: 'rejected', 'unit.status': 'rejected', updatedAt: new Date() } },
  );
}

export { buildAidilInsert };
