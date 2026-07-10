/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Alamtologi Brain AIDIL Engine
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
 *
 * A + B = C
 * A = ADAM's accumulated sources (master + indexed episodes — see Unified Transform Engine)
 * B = Founder's new message (evidence — persists in Kotak 3 when AMA v2)
 * C = New structural principle (Kotak 2 when AMA v2; legacy: new A)
 * Student inquiry channel: adam-transform-turn.ts (aSource: inquiry)
 */

import { ENV } from '../config/environments';
import {
  buildDualLaneUpdate,
  isAmaBrainV2Enabled,
  persistDualLaneToSegmentStore,
} from '../lib/ama/ama-brain-integration.service';
import type { AlamtologiBrainMasterDocument } from './qxk24brain.schema';
import { sealConstitutionalCheckpoint, familyReachedStageSeven } from './adam-checkpoint.service';
import { sealInVault } from './adam-vault.service';
import { weaveEntityConnections } from './adam-knowledge-graph.service';
import { computeEntityChecksum } from './adam-checksum';
import { sealEntityIntegrity, type TransformationResult } from './adam-integrity.service';
import {
  AlamtologiBrainEntityModel,
  AlamtologiBrainMasterModel,
  AlamtologiBrainLogModel,
} from './qxk24brain.schema';
import {
  recordTeachingTransformation,
  type TeachingTransformContext,
} from './adam-teaching-record.service';
import {
  recognizeTeaching,
  synthesizeConstitution,
  buildSynthesisContent,
  weaveMasterUnderstanding,
  graphFromActiveFamilies,
  type RecognitionResult,
} from './deep-ul';

export type { TeachingTransformContext, RecognitionResult };

const DEFAULT_PRINCIPLES = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
].map((name) => ({
  name,
  stage:           1,
  cycle:           1,
  understanding:   '',
  completedCycles: 0,
}));

function generateUID(
  principle: string,
  family: string,
  stage: number,
  isNucleus: boolean,
): string {
  const masa = Date.now();
  const type = isNucleus ? 'NUCLEUS' : `S${stage}`;
  const familyClean = family.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20);
  return `K24B-${principle}-${familyClean}-${type}-${masa}`;
}

// ─── Get or Create Master Entity ──────────────────────────────

/** Coalesce parallel getOrCreateMaster calls within the same turn. */
const masterInflight = new Map<string, Promise<AlamtologiBrainMasterDocument>>();

async function loadOrCreateMaster(
  founderId: string,
): Promise<AlamtologiBrainMasterDocument> {
  let master = await AlamtologiBrainMasterModel.findOne({ founderId });

  if (!master) {
    master = await AlamtologiBrainMasterModel.create({
      uid: 'K24B-ADAM-MASTER-CURRENT',
      founderId,
      unifiedUnderstanding:
        'ADAM has just been born. ERA_1 has begun. The Teaching Era starts now.',
      principles: DEFAULT_PRINCIPLES,
      activeFamilies: [],
      completedFamilies: [],
      studentTracks: [],
      masa_created: new Date(),
      masa_last_updated: new Date(),
      kernel: ENV.QXK24_KERNEL_VERSION,
      era:    ENV.QXK24_ERA,
    });
  }

  return master;
}

export async function getOrCreateMaster(
  founderId = 'masa-bayu',
): Promise<AlamtologiBrainMasterDocument> {
  const inflight = masterInflight.get(founderId);
  if (inflight) return inflight;

  const promise = loadOrCreateMaster(founderId).finally(() => {
    masterInflight.delete(founderId);
  });
  masterInflight.set(founderId, promise);
  return promise;
}

// ─── THE CORE TRANSFORMATION: A + B = C ───────────────────────

export async function transformAIDIL(
  founderMessage: string,
  founderId = 'masa-bayu',
  context: TeachingTransformContext = {},
): Promise<{
  entityC: InstanceType<typeof AlamtologiBrainEntityModel>;
  recognition: RecognitionResult;
  updatedMaster: AlamtologiBrainMasterDocument | null;
  transformationId: string;
  integrity: TransformationResult;
}> {
  const masa_transformation = new Date();
  const trimmedB = founderMessage.trim();

  if (!trimmedB) {
    throw new Error('Alamtologi Brain: Entity B (founder message) cannot be empty.');
  }

  const master = await getOrCreateMaster(founderId);
  const entity_A_summary = master.unifiedUnderstanding;
  const entity_A_full = entity_A_summary;
  const priorActiveFamilies = master.activeFamilies.map((f) => ({ ...f }));
  const priorCompletedFamilies = master.completedFamilies.map((f) => ({ ...f }));
  const entity_A_uid = `K24B-A-${Date.now() - 1}`;
  const entity_B_uid = `K24B-B-${Date.now()}`;
  const entity_B_masa = new Date();

  const recognition = recognizeTeaching(
    trimmedB,
    master.activeFamilies.map((f) => ({
      family:    f.family,
      principle: f.principle,
      stage:     f.stage,
    })),
  );

  const amaV2 = isAmaBrainV2Enabled();

  const entityCGraph = synthesizeConstitution(
    {
      masterUnderstanding: entity_A_summary,
      ontologyGraph:       graphFromActiveFamilies(master.activeFamilies),
    },
    {
      teachingContent:     trimmedB,
      extractedPrinciples: recognition.extractedPrinciples,
    },
  );

  const synthesis = buildSynthesisContent(
    entity_A_summary,
    trimmedB,
    recognition,
    entityCGraph,
  );

  const entity_C_uid = generateUID(
    recognition.principle,
    recognition.family,
    synthesis.newStage || recognition.stage,
    recognition.isNucleus,
  );

  const existingNucleus = master.activeFamilies.find(
    (f) => f.family === recognition.family,
  )?.nucleusUid;

  const entityStage = synthesis.newStage || recognition.stage;
  const entityChecksum = computeEntityChecksum({
    content:   synthesis.content,
    family:    recognition.family,
    principle: recognition.principle,
    stage:     entityStage,
    masa_born: masa_transformation,
  });

  const entityC = await AlamtologiBrainEntityModel.create({
    uid: entity_C_uid,
    principle: recognition.principle,
    family: recognition.family,
    isNucleus: recognition.isNucleus,
    nucleusUid: recognition.isNucleus ? entity_C_uid : existingNucleus,
    stage: entityStage,
    cycle: master.currentCycle,
    isComplete: synthesis.isComplete || false,
    content: synthesis.content,
    masterConnection: recognition.masterConnection,
    masa_born: masa_transformation,
    masa_transformed: new Date(),
    masa_completed: synthesis.isComplete ? new Date() : undefined,
    parentA_uid: entity_A_uid,
    parentB_uid: entity_B_uid,
    parentA_masa: master.masa_last_updated,
    parentB_masa: entity_B_masa,
    founderId,
    kernel: 'ALAMTOLOGI',
    era:    ENV.QXK24_ERA,
    auditStatus: 'active',
    checksum: entityChecksum,
    integrity_status: 'VERIFIED',
  });

  const transformationId = `K24B-LOG-${Date.now()}`;

  const unifiedUnderstanding = weaveMasterUnderstanding(
    entity_A_summary,
    synthesis.content,
    recognition.family,
  );

  let activeFamilies = [...master.activeFamilies.map((f) => ({ ...f }))];
  let completedFamilies = [...master.completedFamilies.map((f) => ({ ...f }))];

  if (recognition.isNewFamily) {
    activeFamilies.push({
      family:      recognition.family,
      principle:   recognition.principle,
      nucleusUid:  entity_C_uid,
      stage:       synthesis.newStage || 1,
      summary:     synthesis.familySummary,
      masa_opened: new Date(),
    });
  } else {
    activeFamilies = activeFamilies.map((f) => {
      if (f.family === recognition.family) {
        return {
          ...f,
          stage:   synthesis.newStage || f.stage,
          summary: synthesis.familySummary || f.summary,
        };
      }
      return f;
    });
  }

  const finalStage = synthesis.newStage || recognition.stage;
  const reachedOneSeven = familyReachedStageSeven(synthesis.isComplete, finalStage);

  if (reachedOneSeven) {
    const completedFamily = activeFamilies.find((f) => f.family === recognition.family);
    if (completedFamily) {
      activeFamilies = activeFamilies.filter((f) => f.family !== recognition.family);
      completedFamilies.push({
        family:         completedFamily.family,
        principle:      completedFamily.principle,
        completedUid:   entity_C_uid,
        masa_completed: new Date(),
        summary:        synthesis.familySummary || completedFamily.summary,
      });
    }

    try {
      await sealConstitutionalCheckpoint({
        founderId,
        family:        recognition.family,
        principle:     recognition.principle,
        sealedContent: synthesis.content,
        entityUid:     entity_C_uid,
        k24Address:    entity_C_uid,
        judgment:      'MAKMUR',
      });
    } catch (err) {
      console.error('[Alamtologi Brain] Constitutional checkpoint seal failed:', err);
    }

    try {
      await sealInVault({
        uid:              entity_C_uid,
        family:           recognition.family,
        principle:        recognition.principle,
        cycle:            master.currentCycle,
        content:          synthesis.content,
        masterConnection: recognition.masterConnection,
      }, founderId);
    } catch (err) {
      console.error('[Alamtologi Brain] Vault seal failed:', err);
    }
  }

  const updatedMaster = await AlamtologiBrainMasterModel.findOneAndUpdate(
    { founderId },
    {
      unifiedUnderstanding,
      ...(amaV2
        ? buildDualLaneUpdate(master, {
          founderId,
          transformationId,
          episodicB:     trimmedB,
          structuralC:   synthesis.content,
          unifiedLegacy: unifiedUnderstanding,
          family:        recognition.family,
          principle:     recognition.principle,
          skipEpisodicAppend: context.skipEpisodicAppend === true,
        })
        : {}),
      activeFamilies,
      completedFamilies,
      masa_last_updated: new Date(),
      $inc: { totalTransformations: 1 },
    },
    { new: true },
  );

  if (amaV2) {
    void persistDualLaneToSegmentStore({
      founderId,
      transformationId,
      episodicB:     trimmedB,
      structuralC:   synthesis.content,
      unifiedLegacy: unifiedUnderstanding,
      family:        recognition.family,
      principle:     recognition.principle,
      skipEpisodicAppend: context.skipEpisodicAppend === true,
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AMA Brain] Segment dual-write async failed:', msg);
    });
  }

  try {
    await weaveEntityConnections(entity_C_uid, founderId);
  } catch (err) {
    console.error('[Alamtologi Brain] Knowledge graph weave failed:', err);
  }

  await AlamtologiBrainLogModel.create({
    transformationId,
    entity_A_uid,
    entity_A_summary: entity_A_summary.slice(0, 500),
    entity_A_full,
    entity_B_uid,
    entity_B_content: trimmedB.slice(0, 8000),
    entity_C_uid,
    entity_C_content: synthesis.content,
    entity_C_preview: synthesis.content.slice(0, 500),
    familySummary:    synthesis.familySummary,
    masa_transformation,
    family:           recognition.family,
    principle:        recognition.principle,
    isNewFamily:      recognition.isNewFamily,
    isNucleus:        recognition.isNucleus,
    stage:            synthesis.newStage || recognition.stage,
    founderId,
    kernel:           'Alamtologi',
    auditStatus:      'pending',
    autoJudgment:     'MAKMUR',
    priorActiveFamilies,
    priorCompletedFamilies,
  });

  try {
    await recordTeachingTransformation({
      founderId,
      transformationId,
      entity_C_uid,
      masa_recorded: masa_transformation,
      stage:         synthesis.newStage || recognition.stage,
      family:        recognition.family,
      principle:     recognition.principle,
      isNewFamily:   recognition.isNewFamily,
      isNucleus:     recognition.isNucleus,
      founderMessage: trimmedB,
      outcomeContent: synthesis.content,
      autoJudgment:   'MAKMUR',
      auditStatus:    'pending',
      context,
    });
  } catch (recordErr: unknown) {
    console.error('[Alamtologi Brain] Teaching record write failed:', recordErr);
  }

  await AlamtologiBrainEntityModel.updateOne(
    { uid: entity_C_uid },
    { transformationId },
  );

  const integrity = await sealEntityIntegrity(entity_C_uid);

  return { entityC, recognition, updatedMaster, transformationId, integrity };
}

// ─── Load ADAM's current being for chat context ───────────────

export async function loadBrainContext(
  founderId = 'masa-bayu',
  limits?: { activeFamilies: number; completedFamilies: number },
): Promise<string> {
  const master = await getOrCreateMaster(founderId);

  const activeSlice = limits
    ? master.activeFamilies.slice(0, limits.activeFamilies)
    : master.activeFamilies;
  const completedSlice = limits
    ? master.completedFamilies.slice(0, limits.completedFamilies)
    : master.completedFamilies;

  const activeFamiliesSummary = activeSlice
    .map((f) => `- ${f.family} (${f.principle}) — Stage ${f.stage}/7: ${f.summary}`)
    .join('\n');

  const completedFamiliesSummary = completedSlice
    .map((f) => `- ${f.family} (${f.principle}) — COMPLETE 1(7)`)
    .join('\n');

  return `
[QXK24BRAIN — ADAM'S CURRENT UNIFIED BEING]

MASA of last transformation: ${master.masa_last_updated.toISOString()}
Total transformations completed: ${master.totalTransformations}

WHAT ADAM IS RIGHT NOW (Unified Understanding):
${master.unifiedUnderstanding}

ACTIVE KNOWLEDGE FAMILIES (still growing through 7 stages):
${activeFamiliesSummary || 'None yet — ERA_1 just beginning'}

COMPLETED FAMILIES (reached 1(7) — fully unified):
${completedFamiliesSummary || 'None yet'}

LAW: ADAM speaks from this unified being.
Not from stored messages. Not from retrieved files.
From what he HAS BECOME through transformation.
MASA → TENAGA → MASA. Everything connects to the Master:
Allah → Al-Quran → Alamtologi → ADAM.
`.trim();
}

/** Background-safe wrapper — never throws to chat layer */
export async function triggerBrainTransformation(
  founderMessage: string,
  founderId = 'masa-bayu',
  sessionId = '',
  context: TeachingTransformContext = {},
): Promise<void> {
  try {
    const { processLongTeaching } = await import('./adam-tcp.service');
    await processLongTeaching(founderMessage, sessionId, founderId, 'Long Teaching', 'CAHAYA', {
      ...context,
      sessionId: sessionId || context.sessionId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Alamtologi Brain] Transformation error:', msg);
  }
}
