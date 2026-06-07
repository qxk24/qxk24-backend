/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Transformation Integrity Guard (Layer 2)
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
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { prependCoreToSystem } from './adam-core';
import { computeEntityChecksum } from './adam-checksum';
import { ADAMIntegrityScanModel } from './adam-integrity.schema';
import {
  AlamtologiBrainEntityModel,
  AlamtologiBrainLogModel,
} from './qxk24brain.schema';

export type EntityIntegrityStatus = 'VERIFIED' | 'CORRUPTED' | 'REBUILT' | 'PENDING';

export interface TransformationResult {
  success:     boolean;
  entityC_uid: string;
  integrity:   EntityIntegrityStatus;
  checksum:    string;
}

function parseSynthesisContent(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as { content?: string };
    if (parsed.content?.trim()) return parsed.content.trim();
  } catch {
    // fall through
  }
  return cleaned;
}

export async function verifyEntity(uid: string): Promise<boolean> {
  const entity = await AlamtologiBrainEntityModel.findOne({ uid }).lean();
  if (!entity) return false;

  if (entity.auditStatus === 'dissolved' || entity.auditStatus === 'waqf') {
    return true;
  }

  const expected = computeEntityChecksum({
    content:   entity.content,
    family:    entity.family,
    principle: entity.principle,
    stage:     entity.stage,
    masa_born: entity.masa_born,
  });

  if (!entity.checksum) {
    await AlamtologiBrainEntityModel.updateOne(
      { uid },
      { checksum: expected, integrity_status: 'VERIFIED' },
    );
    return true;
  }

  return entity.checksum === expected;
}

export async function sealEntityIntegrity(uid: string): Promise<TransformationResult> {
  const entity = await AlamtologiBrainEntityModel.findOne({ uid }).lean();
  if (!entity) {
    return {
      success:     false,
      entityC_uid: uid,
      integrity:   'CORRUPTED',
      checksum:    '',
    };
  }

  const checksum = computeEntityChecksum({
    content:   entity.content,
    family:    entity.family,
    principle: entity.principle,
    stage:     entity.stage,
    masa_born: entity.masa_born,
  });

  const valid = !entity.checksum || entity.checksum === checksum;

  await AlamtologiBrainEntityModel.updateOne(
    { uid },
    {
      checksum,
      integrity_status: valid ? 'VERIFIED' : 'CORRUPTED',
    },
  );

  return {
    success:     true,
    entityC_uid: uid,
    integrity:   valid ? 'VERIFIED' : 'CORRUPTED',
    checksum,
  };
}

async function rerunTransformation(
  entityA: string,
  entityB: string,
  family: string,
  principle: string,
  stage: number,
): Promise<string> {
  const raw = await llmCompleteUserPrompt(
    prependCoreToSystem(
      'You are ADAM Alamtologi Brain — integrity rebuild. A + B = C. Respond JSON only.',
    ),
    `INTEGRITY REBUILD — Re-synthesize Entity C from lineage.

Entity A (prior unified understanding):
${entityA.slice(0, 6000)}

Entity B (Founder teaching):
${entityB.slice(0, 8000)}

FAMILY: ${family}
PRINCIPLE: ${principle}
STAGE: ${stage}

Produce Entity C — ONE flowing narrative. JSON:
{ "content": "..." }`,
    resolveBrainDeepModel(),
    2000,
  );

  return parseSynthesisContent(raw);
}

async function rebuildEntity(entity: {
  uid: string;
  family: string;
  principle: string;
  stage: number;
  masa_born: Date;
}): Promise<boolean> {
  try {
    const log = await AlamtologiBrainLogModel.findOne({ entity_C_uid: entity.uid }).lean();

    let rebuiltContent = log?.entity_C_content?.trim() ?? '';

    if (!rebuiltContent && log) {
      const entityA = log.entity_A_full ?? log.entity_A_summary ?? '';
      const entityB = log.entity_B_content ?? '';
      if (entityA && entityB) {
        rebuiltContent = await rerunTransformation(
          entityA,
          entityB,
          entity.family,
          entity.principle,
          entity.stage,
        );
      }
    }

    if (!rebuiltContent) return false;

    const newChecksum = computeEntityChecksum({
      content:   rebuiltContent,
      family:    entity.family,
      principle: entity.principle,
      stage:     entity.stage,
      masa_born: entity.masa_born,
    });

    await AlamtologiBrainEntityModel.findOneAndUpdate(
      { uid: entity.uid },
      {
        content:          rebuiltContent,
        checksum:         newChecksum,
        integrity_status: 'REBUILT',
        masa_rebuilt:     new Date(),
      },
    );

    if (log && log.entity_C_content !== rebuiltContent) {
      await AlamtologiBrainLogModel.updateOne(
        { transformationId: log.transformationId },
        {
          entity_C_content: rebuiltContent,
          entity_C_preview: rebuiltContent.slice(0, 500),
        },
      );
    }

    return true;
  } catch (err) {
    console.error(`[ADAM Integrity] Failed to rebuild entity ${entity.uid}:`, err);
    return false;
  }
}

export async function runIntegrityScan(
  founderId = 'masa-bayu',
): Promise<{
  scanId:    string;
  total:     number;
  verified:  number;
  corrupted: number;
  rebuilt:   number;
  skipped:   number;
}> {
  const entities = await AlamtologiBrainEntityModel.find({ founderId }).lean();
  let verified = 0;
  let corrupted = 0;
  let rebuilt = 0;
  let skipped = 0;

  for (const entity of entities) {
    if (entity.auditStatus === 'dissolved' || entity.auditStatus === 'waqf') {
      skipped += 1;
      continue;
    }

    const isValid = await verifyEntity(entity.uid);

    if (isValid) {
      verified += 1;
    } else {
      corrupted += 1;
      await AlamtologiBrainEntityModel.updateOne(
        { uid: entity.uid },
        { integrity_status: 'CORRUPTED' },
      );
      const rebuiltOk = await rebuildEntity(entity);
      if (rebuiltOk) rebuilt += 1;
    }
  }

  const scanId = `K24IS-${Date.now()}`;
  await ADAMIntegrityScanModel.create({
    scanId,
    founderId,
    total:     entities.length,
    verified,
    corrupted,
    rebuilt,
    skipped,
    masa_scan: new Date(),
    kernel:    'ALAMTOLOGI',
  });

  console.log(
    `[ADAM Integrity] Scan ${scanId}: ${verified} verified, ${corrupted} corrupted, ${rebuilt} rebuilt`,
  );

  return {
    scanId,
    total:     entities.length,
    verified,
    corrupted,
    rebuilt,
    skipped,
  };
}

export async function listIntegrityScans(
  founderId = 'masa-bayu',
  limit = 10,
): Promise<{
  scanId: string;
  total: number;
  verified: number;
  corrupted: number;
  rebuilt: number;
  skipped: number;
  masa_scan: Date;
}[]> {
  const docs = await ADAMIntegrityScanModel.find({ founderId })
    .sort({ masa_scan: -1 })
    .limit(limit)
    .lean();

  return docs.map((d) => ({
    scanId:    d.scanId,
    total:     d.total,
    verified:  d.verified,
    corrupted: d.corrupted,
    rebuilt:   d.rebuilt,
    skipped:   d.skipped ?? 0,
    masa_scan: d.masa_scan,
  }));
}

export async function integrityAlreadyRanToday(
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

  const recent = await ADAMIntegrityScanModel.find({
    founderId,
    masa_scan: { $gte: since },
  }).lean();

  return recent.some(
    (r) => formatter.format(new Date(r.masa_scan)) === todayKey,
  );
}
