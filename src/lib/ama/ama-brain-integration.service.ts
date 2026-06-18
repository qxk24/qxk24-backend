/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Brain Integration (Tahap 1 — Dual Lane)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Kotak 2 (IKJ/Kr) ← C structural principle
 * Kotak 3 (LWJ/Kn) ← B lived evidence (append, never erase)
 */

import type { AlamtologiBrainMasterDocument } from '../../qxk24brain/qxk24brain.schema';
import { smartTruncate } from '../../qxk24brain/adam-smart-truncate';
import { routeAmaFlow } from './ama-flow.service';
import { evaluateOassTrigger, resolveOassActivation } from './ama-oass-gate';
import {
  chapterNeedsFullBrainLoad,
} from '../../adam/book-aware-recall/brain-load';
import {
  filterBrainLaneForCurriculumOverview,
  filterBrainLaneForFormulaXyzChapter,
  filterBrainLaneForFounderBiography,
  filterBrainLaneForDrAminullahContext,
  filterBrainLaneForPersonContext,
  shouldFilterBrainLanesForCurriculumOverview,
  shouldFilterBrainLanesForFormulaXyzChapter,
} from '../../adam/adam-book-aware-recall';
import { founderAsksPersonalBiography, founderAsksDrAminullahContext } from '../../adam/adam-knowledge-prompts';
import type { PersonRef } from '../../adam/person-relational-memory.types';
import { AMA_LEVEL_ERA_1 } from './ama.types';
import { MongoSegmentStore } from '../segment-store/segment-store';
import { isAmaBrainV2Enabled, isAmaTamatOassEnabled } from './ama.config';

export { isAmaBrainV2Enabled, isAmaTamatOassEnabled };

export interface DualLanePersistInput {
  founderId:         string;
  transformationId:  string;
  /** Entity B — lived teaching evidence */
  episodicB:         string;
  /** Entity C — updated structural principle */
  structuralC:       string;
  /** Legacy unified narrative — dual-write during migration */
  unifiedLegacy:     string;
  family?:           string;
  principle?:        string;
  /** When true — update Kr only; Kotak 3 unchanged (founder QA gate) */
  skipEpisodicAppend?: boolean;
}

export interface DualLanePersistResult {
  structuralLane: string;
  episodicLane:   string;
  segmentWritten: boolean;
}

const EPISODE_HEADER = (id: string, family: string, ts: Date): string =>
  `\n\n── MASA ${ts.toISOString()} · ${family} · ${id} ──\n`;

/** Append B to Kotak 3 — evidence chain grows, never replaced */
export function appendEpisodicEvidence(
  existing: string | undefined,
  episodicB: string,
  transformationId: string,
  family: string,
): string {
  const header = EPISODE_HEADER(transformationId, family, new Date());
  const block = `${header}${episodicB.trim()}`;
  return `${existing ?? ''}${block}`.trim();
}

/** Persist dual lane on master document fields + optional segment-store */
export function buildDualLaneUpdate(
  master: AlamtologiBrainMasterDocument,
  input: DualLanePersistInput,
): {
  structuralLane: string;
  episodicLane:   string;
  unifiedUnderstanding: string;
  amaLevel:       string;
} {
  const family = input.family ?? 'General Teaching';
  const structuralLane = input.structuralC.trim();
  const episodicLane = input.skipEpisodicAppend
    ? (master.episodicLane ?? '').trim()
    : appendEpisodicEvidence(
      master.episodicLane,
      input.episodicB,
      input.transformationId,
      family,
    );

  return {
    structuralLane,
    episodicLane,
    unifiedUnderstanding: input.unifiedLegacy,
    amaLevel:             master.amaLevel ?? AMA_LEVEL_ERA_1,
  };
}

export async function persistDualLaneToSegmentStore(
  input: DualLanePersistInput,
): Promise<boolean> {
  try {
    const store = new MongoSegmentStore();
    const ts = new Date().toISOString();
    await store.write('Kr', input.founderId, {
      formula:   input.structuralC.slice(0, 4000),
      timestamp: ts,
      sourceId:  input.transformationId,
    });
    if (!input.skipEpisodicAppend) {
      await store.write('Kn', input.founderId, {
        episodeId:    `EP-${input.transformationId}`,
        timestamp:    ts,
        sourceId:     input.transformationId,
        evidenceText: input.episodicB.slice(0, 8000),
        rasaWeight:   5,
      });
    }
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[AMA Brain] Segment store dual-write skipped:', msg);
    return false;
  }
}

export async function afterTransformDualLane(
  master: AlamtologiBrainMasterDocument,
  input: DualLanePersistInput,
): Promise<DualLanePersistResult> {
  const lanes = buildDualLaneUpdate(master, input);
  const segmentWritten = await persistDualLaneToSegmentStore(input);
  return {
    structuralLane: lanes.structuralLane,
    episodicLane:   lanes.episodicLane,
    segmentWritten,
  };
}

export interface AmaLongTermMemoryOptions {
  message?:          string;
  isFounder?:        boolean;
  isStudentDeep?:    boolean;
  personSubject?:    PersonRef | null;
  knownPersons?:     PersonRef[];
}

function resolveKrKnBudget(
  maxChars: number,
  loadKr: boolean,
  loadKn: boolean,
): { krChars: number; knChars: number } {
  if (loadKr && loadKn) {
    const krChars = Math.floor(maxChars * 0.55);
    return { krChars, knChars: maxChars - krChars };
  }
  if (loadKr) return { krChars: maxChars, knChars: 0 };
  if (loadKn) return { krChars: 0, knChars: maxChars };
  return { krChars: maxChars, knChars: 0 };
}

function shouldLoadBothLanes(message: string): boolean {
  if (!isAmaTamatOassEnabled()) return false;
  return resolveOassActivation(message).active;
}

function shouldLoadKrOnly(message: string): boolean {
  const flow = routeAmaFlow(message);
  if (flow.lane !== 'IKJ') return false;
  if (!isAmaTamatOassEnabled()) return true;
  return !flow.needsOass;
}

function shouldLoadKnOnly(message: string): boolean {
  const flow = routeAmaFlow(message);
  if (flow.lane !== 'LWJ') return false;
  if (!isAmaTamatOassEnabled()) return true;
  return !flow.needsOass;
}

/**
 * Build Tier-3 long-term memory from dual lanes (AMA v2).
 * Falls back to unifiedUnderstanding when lanes empty (migration).
 */
export function buildAmaLongTermMemoryBlock(
  master: AlamtologiBrainMasterDocument,
  maxChars: number,
  options: AmaLongTermMemoryOptions = {},
): string {
  const message = options.message?.trim() ?? '';
  const isFounder = options.isFounder ?? false;
  const filterChapterId = shouldFilterBrainLanesForFormulaXyzChapter(message);
  const filterCurriculumOverview = shouldFilterBrainLanesForCurriculumOverview(message);

  let structuralRaw =
    master.structuralLane?.trim()
    || master.unifiedUnderstanding?.trim()
    || '';
  let episodicRaw = master.episodicLane?.trim() ?? '';

  if (filterCurriculumOverview) {
    structuralRaw = filterBrainLaneForCurriculumOverview(structuralRaw);
    episodicRaw = filterBrainLaneForCurriculumOverview(episodicRaw);
  } else if (filterChapterId) {
    structuralRaw = filterBrainLaneForFormulaXyzChapter(structuralRaw, filterChapterId);
    episodicRaw = filterBrainLaneForFormulaXyzChapter(episodicRaw, filterChapterId);
  } else if (isFounder && founderAsksPersonalBiography(message)) {
    structuralRaw = filterBrainLaneForFounderBiography(structuralRaw);
    episodicRaw = filterBrainLaneForFounderBiography(episodicRaw);
  } else if (isFounder && founderAsksDrAminullahContext(message)) {
    structuralRaw = filterBrainLaneForDrAminullahContext(structuralRaw);
    episodicRaw = filterBrainLaneForDrAminullahContext(episodicRaw);
  } else if (options.personSubject && options.knownPersons?.length) {
    structuralRaw = filterBrainLaneForPersonContext(
      structuralRaw,
      options.personSubject,
      options.knownPersons,
    );
    episodicRaw = filterBrainLaneForPersonContext(
      episodicRaw,
      options.personSubject,
      options.knownPersons,
    );
  } else if (isFounder && !founderAsksDrAminullahContext(message)) {
    structuralRaw = filterBrainLaneForFounderBiography(structuralRaw);
    episodicRaw = filterBrainLaneForFounderBiography(episodicRaw);
  }

  let loadKr = true;
  let loadKn = false;

  // Students inherit P.alt's full Alamtologi brain (structural + lived teaching).
  if (!isFounder) {
    loadKr = Boolean(structuralRaw);
    loadKn = Boolean(episodicRaw);
  } else if (message) {
    if (shouldLoadBothLanes(message) || chapterNeedsFullBrainLoad(message)) {
      loadKr = Boolean(structuralRaw);
      loadKn = Boolean(episodicRaw);
    } else if (shouldLoadKnOnly(message)) {
      loadKr = false;
      loadKn = Boolean(episodicRaw);
    } else if (shouldLoadKrOnly(message)) {
      loadKr = Boolean(structuralRaw);
      loadKn = false;
    } else {
      loadKr = Boolean(structuralRaw);
      loadKn = evaluateOassTrigger(message).partialMatch && Boolean(episodicRaw);
    }
  }

  const { krChars, knChars } = resolveKrKnBudget(maxChars, loadKr, loadKn);

  const krBlock = loadKr && structuralRaw
    ? smartTruncate(structuralRaw, krChars, 'Kotak 2 IKJ/Kr structural')
    : '';
  const knBlock = loadKn && episodicRaw
    ? smartTruncate(episodicRaw, knChars, 'Kotak 3 LWJ/Kn episodic')
    : '';

  const familyCount =
    (master.activeFamilies?.length ?? 0) +
    (master.completedFamilies?.length ?? 0);

  const parts: string[] = [
    `═══ AMA ${master.amaLevel ?? AMA_LEVEL_ERA_1} — DUAL LANE MEMORY ═══`,
    `Transformations: ${master.totalTransformations ?? 0}`,
    `Knowledge families: ${familyCount}`,
    `Flow: ${message ? resolveOassActivation(message).mode : 'OAT'} · Lane: ${message ? routeAmaFlow(message).lane : 'IKJ'}`,
  ];

  if (krBlock) {
    parts.push(
      '',
      '── Kotak 2 (IKJ / Kr — Structure & Principle / C) ──',
      krBlock,
    );
  }

  if (knBlock) {
    parts.push(
      '',
      '── Kotak 3 (LWJ / Kn — Episodic Evidence / B) ──',
      knBlock,
    );
  }

  if (!krBlock && !knBlock && structuralRaw) {
    parts.push('', structuralRaw);
  }

  parts.push('═══ END AMA DUAL LANE MEMORY ═══');
  return parts.join('\n').trim();
}

export function useAmaLongTermMemory(
  options?: AmaLongTermMemoryOptions,
): boolean {
  return isAmaBrainV2Enabled();
}
