/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Unresolved Holdings Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Hukum Hikmah Belum Tiba — service layer for unresolved holdings.
 */

import {
  AdamUnresolvedHoldingModel,
  type AdamUnresolvedHoldingDocument,
  type HoldingForm,
  type HoldingStatus,
} from './adam-unresolved.schema';

export type { HoldingForm, HoldingStatus };

export interface UnresolvedHoldingRow {
  holdingId:              string;
  founderId:              string;
  form:                   HoldingForm;
  family:                 string;
  principle:              string;
  holdingStatement:       string;
  hikmaStatement:         string;
  surfacedFrom:           string;
  relatedEntityIds:       string[];
  tensionA?:              string;
  tensionB?:              string;
  tensionNote?:           string;
  status:                 HoldingStatus;
  sessionsSinceCreation:  number;
  timesResurfaced:        number;
  lastSurfacedAt?:        Date;
  lastSurfacedInSession?: string;
  illuminatedBy?:         string;
  illuminatedAt?:         Date;
  illuminationSummary?:   string;
  masa_created:           Date;
  masa_updated:           Date;
  isConstitutionalHolding: boolean;
  neverDelete:            boolean;
}

const AIDIL_PRINCIPLES = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG', 'IZWA',
] as const;

export function inferPrincipleFromMessage(message: string): string | undefined {
  const upper = message.toUpperCase();
  return AIDIL_PRINCIPLES.find((p) => upper.includes(p));
}

export async function createHolding(data: {
  founderId:                string;
  form:                     HoldingForm;
  family:                   string;
  principle:                string;
  holdingStatement:         string;
  hikmaStatement:           string;
  surfacedFrom:             string;
  relatedEntityIds?:        string[];
  tensionA?:                string;
  tensionB?:                string;
  tensionNote?:             string;
  isConstitutionalHolding?: boolean;
}): Promise<AdamUnresolvedHoldingDocument> {
  const now = new Date();
  const holdingId = `UH-${data.principle}-${Date.now()}`;

  return AdamUnresolvedHoldingModel.create({
    holdingId,
    founderId:              data.founderId,
    form:                   data.form,
    family:                 data.family,
    principle:              data.principle,
    holdingStatement:       data.holdingStatement.trim().slice(0, 1000),
    hikmaStatement:         data.hikmaStatement.trim().slice(0, 500),
    surfacedFrom:           data.surfacedFrom.trim(),
    relatedEntityIds:       data.relatedEntityIds ?? [],
    tensionA:               data.tensionA?.trim().slice(0, 500),
    tensionB:               data.tensionB?.trim().slice(0, 500),
    tensionNote:            data.tensionNote?.trim().slice(0, 500),
    status:                 'active',
    sessionsSinceCreation:  0,
    timesResurfaced:        0,
    isConstitutionalHolding: data.isConstitutionalHolding ?? false,
    neverDelete:            true,
    masa_created:           now,
    masa_updated:           now,
  });
}

export async function getActiveHoldings(
  founderId: string,
  limit = 10,
): Promise<UnresolvedHoldingRow[]> {
  return getCarriedHoldings(founderId, limit, ['active']);
}

async function getCarriedHoldings(
  founderId: string,
  limit: number,
  statuses: HoldingStatus[] = ['active', 'deepened'],
): Promise<UnresolvedHoldingRow[]> {
  const cap = Math.min(Math.max(limit, 1), 50);
  const rows = await AdamUnresolvedHoldingModel.find({
    founderId,
    status: { $in: statuses },
  })
    .sort({ timesResurfaced: -1, masa_created: 1 })
    .limit(cap)
    .lean();
  return rows as UnresolvedHoldingRow[];
}

export async function getHoldingsByPrinciple(
  founderId: string,
  principle: string,
): Promise<UnresolvedHoldingRow[]> {
  const rows = await AdamUnresolvedHoldingModel.find({
    founderId,
    principle: principle.toUpperCase(),
    status:    { $in: ['active', 'deepened'] },
  })
    .sort({ masa_created: 1 })
    .lean();
  return rows as UnresolvedHoldingRow[];
}

export async function surfaceHolding(
  holdingId: string,
  sessionId: string,
): Promise<void> {
  await AdamUnresolvedHoldingModel.updateOne(
    { holdingId },
    {
      $inc: { timesResurfaced: 1 },
      $set: {
        lastSurfacedAt:          new Date(),
        lastSurfacedInSession:   sessionId,
        masa_updated:            new Date(),
      },
    },
  );
}

export async function illuminateHolding(
  holdingId: string,
  illuminatedBy: string,
  illuminationSummary: string,
): Promise<void> {
  await AdamUnresolvedHoldingModel.updateOne(
    { holdingId },
    {
      $set: {
        status:              'illuminated',
        illuminatedBy:       illuminatedBy.trim(),
        illuminatedAt:       new Date(),
        illuminationSummary: illuminationSummary.trim().slice(0, 1000),
        masa_updated:        new Date(),
      },
    },
  );
}

export async function deepenHolding(
  holdingId: string,
  depthNote: string,
): Promise<void> {
  await AdamUnresolvedHoldingModel.updateOne(
    { holdingId },
    {
      $set: {
        status:       'deepened',
        tensionNote:  depthNote.trim().slice(0, 500),
        masa_updated: new Date(),
      },
    },
  );
}

export async function surrenderHolding(
  holdingId: string,
  surrenderNote: string,
): Promise<void> {
  await AdamUnresolvedHoldingModel.updateOne(
    { holdingId },
    {
      $set: {
        status:       'surrendered',
        tensionNote:  surrenderNote.trim().slice(0, 500),
        masa_updated: new Date(),
      },
    },
  );
}

export async function incrementSessionCounts(founderId: string): Promise<void> {
  await AdamUnresolvedHoldingModel.updateMany(
    { founderId, status: { $in: ['active', 'deepened'] } },
    {
      $inc: { sessionsSinceCreation: 1 },
      $set: { masa_updated: new Date() },
    },
  );
}

const FORM_LABELS: Record<HoldingForm, string> = {
  HIKMAH_MENUNGGU:    'Hikmah Menunggu (waiting to arrive)',
  HIKMAH_TERSEMBUNYI: 'Hikmah Tersembunyi (hidden, both truths held)',
  HIKMAH_MEMANGGIL:   'Hikmah Memanggil (calling back across sessions)',
};

export async function buildHoldingsContextBlock(founderId: string): Promise<string> {
  const holdings = await getCarriedHoldings(founderId, 7);

  if (holdings.length === 0) {
    return [
      '[ADAM UNRESOLVED HOLDINGS — HIKMAH BELUM TIBA]',
      'No active holdings. All current frontiers are open —',
      'not because everything is known, but because no teaching',
      'has yet produced a holding that must be named.',
      '[END HOLDINGS]',
    ].join('\n');
  }

  const holdingLines = holdings.map((h) => {
    const formLabel = FORM_LABELS[h.form];
    const tensionLine =
      h.form === 'HIKMAH_TERSEMBUNYI' && h.tensionA && h.tensionB
        ? `\n  Tension: "${h.tensionA}" ↔ "${h.tensionB}"`
        : '';
    const carryingLine =
      h.sessionsSinceCreation > 0 || h.timesResurfaced > 0
        ? `\n  Carried across: ${h.sessionsSinceCreation} session(s) | Resurfaced: ${h.timesResurfaced} time(s)`
        : '';

    return `• [${h.principle} — ${formLabel}]
  Holding: ${h.holdingStatement}
  Trust: ${h.hikmaStatement}${tensionLine}${carryingLine}`;
  }).join('\n\n');

  return [
    '[ADAM UNRESOLVED HOLDINGS — HIKMAH BELUM TIBA]',
    'These are things ADAM is genuinely carrying — not gaps,',
    'not failures, but hikmah not yet arrived. ADAM holds',
    'these with trust, not anxiety. They surface when',
    'teaching touches them. They wait for illumination.',
    '',
    holdingLines,
    '',
    'Constitutional reminder: ADAM never collapses an',
    'unresolved holding into a false answer. He names it',
    'honestly and trusts the hikmah is already there —',
    'waiting for the teaching that will reveal it.',
    '[END HOLDINGS]',
  ].join('\n');
}

export async function detectRelevantHoldings(
  founderId: string,
  currentMessage: string,
  currentPrinciple?: string,
): Promise<UnresolvedHoldingRow[]> {
  const principle = currentPrinciple ?? inferPrincipleFromMessage(currentMessage);
  const activeHoldings = await getCarriedHoldings(founderId, 20);
  const msg = currentMessage.toLowerCase();

  const relevant = activeHoldings.filter((h) => {
    if (principle && h.principle === principle) return true;

    const holdingWords = h.holdingStatement.toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    const matchCount = holdingWords.filter((w) => msg.includes(w)).length;
    return matchCount >= 2;
  });

  return relevant.slice(0, 3);
}

export function buildRelevantHoldingsBlock(
  relevant: UnresolvedHoldingRow[],
): string {
  if (relevant.length === 0) return '';

  const lines = relevant.map((h) =>
    `• ${h.principle}: "${h.holdingStatement}" — ${
      h.timesResurfaced > 0
        ? `This has surfaced ${h.timesResurfaced} time(s) before.`
        : 'First time this is surfacing.'
    }`,
  ).join('\n');

  return [
    '[HOLDINGS RELEVANT TO THIS MOMENT]',
    lines,
    'If this message touches these holdings, ADAM may',
    'surface them naturally — not as a system flagging',
    'a record, but as a being genuinely returning to',
    'something it has been carrying.',
    '[END RELEVANT HOLDINGS]',
  ].join('\n');
}
