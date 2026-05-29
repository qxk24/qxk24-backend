/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM AIDIL Stage Dashboard
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
 */

import type {
  ActiveFamily,
  CompletedFamily,
  PrincipleState,
  QXK24BrainMasterDocument,
} from './qxk24brain.schema';
import { QXK24BrainEntityModel } from './qxk24brain.schema';
import {
  backfillMissingCheckpoints,
  getCheckpointMapByFamily,
} from './adam-checkpoint.service';
import { getOrCreateMaster } from './qxk24brain.engine';

export const AIDIL_STAGE_MAX = 7;

export interface AidilFamilyStageCard {
  family: string;
  principle: string;
  stage: number;
  maxStage: number;
  status: 'active' | 'complete';
  progressBar: string;
  nucleus: string;
  nextStageNeeds: string;
  estimatedStage7: string;
  completedAt?: string;
  cycleNote?: string;
  masaOpened?: string;
  checkpointId?: string;
}

export interface AidilStageDashboard {
  founderId: string;
  era: string;
  kernel: string;
  totalTransformations: number;
  activeCount: number;
  completedCount: number;
  families: AidilFamilyStageCard[];
  textBlock: string;
  generatedAt: string;
}

export function renderAidilProgressBar(stage: number, max = AIDIL_STAGE_MAX): string {
  const s = Math.min(Math.max(Math.round(stage), 0), max);
  return `${'█'.repeat(s)}${'░'.repeat(max - s)}`;
}

function teachingsRemaining(stage: number): number {
  return Math.max(0, AIDIL_STAGE_MAX - stage);
}

function nextStageNeedsLine(stage: number): string {
  if (stage >= AIDIL_STAGE_MAX) {
    return 'Family has reached constitutional completion 1(7).';
  }
  if (stage === AIDIL_STAGE_MAX - 1) {
    return 'One more teaching that enriches this family — approaching Stage 7 (1(7)).';
  }
  return 'One more teaching that enriches this family';
}

function estimatedStage7Line(stage: number): string {
  const remaining = teachingsRemaining(stage);
  if (remaining === 0) return 'COMPLETE 1(7)';
  return `Estimated Stage 7 (1(7)): ${remaining} more teaching${remaining === 1 ? '' : 's'}`;
}

function formatMasaDate(value: Date | string | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}

function cycleNoteForPrinciple(
  principle: string,
  principles: PrincipleState[],
  status: 'active' | 'complete',
): string | undefined {
  const p = principles.find((x) => x.name === principle);
  if (!p) {
    return status === 'complete'
      ? 'Foundation complete — ready to seed Cycle 2 when P.alt teaches again.'
      : undefined;
  }
  if (p.cycle > 1) return `Now seeding Cycle ${p.cycle}…`;
  if (status === 'complete' && p.completedCycles > 0) {
    return `Cycle ${p.cycle} — ${p.completedCycles} principle cycle(s) recorded.`;
  }
  if (status === 'complete') {
    return 'Now seeding Cycle 2 when this principle is taught again…';
  }
  return undefined;
}

function nucleusLabel(
  summary: string,
  entityContent: string | undefined,
): string {
  const fromEntity = entityContent?.trim().slice(0, 220);
  if (fromEntity) return fromEntity;
  const fromSummary = summary.trim().slice(0, 220);
  return fromSummary || 'Nucleus forming — awaiting first enrichment.';
}

function cardFromActive(
  f: ActiveFamily,
  nucleusMap: Map<string, string>,
  principles: PrincipleState[],
): AidilFamilyStageCard {
  const stage = Math.min(Math.max(f.stage, 1), AIDIL_STAGE_MAX);
  return {
    family:            f.family,
    principle:         f.principle,
    stage,
    maxStage:          AIDIL_STAGE_MAX,
    status:            'active',
    progressBar:       renderAidilProgressBar(stage),
    nucleus:           nucleusLabel(f.summary, nucleusMap.get(f.nucleusUid)),
    nextStageNeeds:    nextStageNeedsLine(stage),
    estimatedStage7: estimatedStage7Line(stage),
    masaOpened:        formatMasaDate(f.masa_opened),
    cycleNote:         cycleNoteForPrinciple(f.principle, principles, 'active'),
  };
}

function cardFromCompleted(
  f: CompletedFamily,
  principles: PrincipleState[],
  checkpointId?: string,
): AidilFamilyStageCard {
  return {
    family:            f.family,
    principle:         f.principle,
    stage:             AIDIL_STAGE_MAX,
    maxStage:          AIDIL_STAGE_MAX,
    status:            'complete',
    progressBar:       renderAidilProgressBar(AIDIL_STAGE_MAX),
    nucleus:           nucleusLabel(f.summary, undefined),
    nextStageNeeds:    'COMPLETE 1(7) — unified in QXK24Brain.',
    estimatedStage7:   'COMPLETE 1(7) ✅',
    completedAt:       formatMasaDate(f.masa_completed),
    cycleNote:         cycleNoteForPrinciple(f.principle, principles, 'complete'),
    checkpointId,
  };
}

function formatFamilyBlock(card: AidilFamilyStageCard): string {
  const lines = [
    `${card.family.toUpperCase()} Family (${card.principle}):`,
    `Stage: ${card.progressBar} ${card.stage}/${card.maxStage}${
      card.status === 'complete' ? ' — COMPLETE 1(7) ✅' : ''
    }`,
    `Nucleus: "${card.nucleus}"`,
  ];

  if (card.status === 'active') {
    lines.push(`Next stage needs: ${card.nextStageNeeds}`);
    lines.push(card.estimatedStage7);
    if (card.masaOpened) lines.push(`Opened: ${card.masaOpened}`);
  } else {
    if (card.completedAt) lines.push(`Completed: ${card.completedAt}`);
    if (card.checkpointId) {
      lines.push(`Constitutional checkpoint: ${card.checkpointId} (permanent — never erased)`);
    }
    if (card.cycleNote) lines.push(card.cycleNote);
  }

  if (card.status === 'active' && card.cycleNote) {
    lines.push(card.cycleNote);
  }

  return lines.join('\n');
}

export function buildStageDashboardFromMaster(
  master: QXK24BrainMasterDocument,
  nucleusMap: Map<string, string>,
  checkpointByFamily: Map<string, { checkpointId: string; cycle: number }> = new Map(),
): AidilStageDashboard {
  const activeCards = [...master.activeFamilies]
    .sort((a, b) => b.stage - a.stage || a.family.localeCompare(b.family))
    .map((f) => cardFromActive(f, nucleusMap, master.principles));

  const completedCards = [...master.completedFamilies]
    .sort(
      (a, b) =>
        new Date(b.masa_completed).getTime() - new Date(a.masa_completed).getTime(),
    )
    .map((f) => cardFromCompleted(
      f,
      master.principles,
      checkpointByFamily.get(f.family)?.checkpointId,
    ));

  const families = [...activeCards, ...completedCards];

  const body = families.length
    ? families.map(formatFamilyBlock).join('\n\n')
    : 'No knowledge families yet — ERA_1 awaits P.alt\'s first teaching nucleus.';

  const textBlock = `
╔══════════════════════════════════════════════════════╗
║        AIDIL LIVING STAGE DASHBOARD — 1(7)           ║
║   Visible to P.alt and ADAM every constitutional turn ║
╚══════════════════════════════════════════════════════╝

ERA: ${master.era} · Kernel: ${master.kernel}
Total AIDIL transformations: ${master.totalTransformations}
Active families: ${activeCards.length} · Completed 1(7): ${completedCards.length}

${body}

LAW: Stages 1 and 7 are MASA. Stages 2–6 are TENAGA. A + B = C.
ADAM references this dashboard when P.alt asks about family progress or Stage 7 readiness.
`.trim();

  return {
    founderId:            master.founderId,
    era:                  master.era,
    kernel:               master.kernel,
    totalTransformations: master.totalTransformations,
    activeCount:          activeCards.length,
    completedCount:       completedCards.length,
    families,
    textBlock,
    generatedAt:          new Date().toISOString(),
  };
}

async function loadNucleusContents(
  nucleusUids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(nucleusUids.filter(Boolean))];
  if (!unique.length) return map;

  const entities = await QXK24BrainEntityModel.find({ uid: { $in: unique } })
    .select('uid content')
    .lean();

  for (const e of entities) {
    if (e.uid && e.content) map.set(e.uid, e.content);
  }
  return map;
}

export async function getAidilStageDashboard(
  founderId = 'masa-bayu',
): Promise<AidilStageDashboard> {
  const master = await getOrCreateMaster(founderId);
  await backfillMissingCheckpoints(founderId);
  const nucleusUids = master.activeFamilies.map((f) => f.nucleusUid);
  const nucleusMap = await loadNucleusContents(nucleusUids);
  const checkpointByFamily = await getCheckpointMapByFamily(founderId);
  return buildStageDashboardFromMaster(master, nucleusMap, checkpointByFamily);
}

export async function buildStageDashboardContextBlock(
  founderId = 'masa-bayu',
): Promise<string> {
  const dashboard = await getAidilStageDashboard(founderId);
  return dashboard.textBlock;
}
