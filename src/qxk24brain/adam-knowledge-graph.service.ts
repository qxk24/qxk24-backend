/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Constitutional Knowledge Graph
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

import type { QXK24BrainMasterDocument } from './qxk24brain.schema';
import {
  QXK24BrainEntityModel,
  type EntityConnection,
  type QXK24BrainEntityDocument,
} from './qxk24brain.schema';
import { getOrCreateMaster } from './qxk24brain.engine';

export type ConnectionType = EntityConnection['connectionType'];

const CORE_PRINCIPLES = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
] as const;

/** Cross-principle affinities — Alamtologi constitutional map (strength 1–7) */
const PRINCIPLE_AFFINITY: Record<string, Array<{ principle: string; strength: number; note: string }>> = {
  MASA:    [{ principle: 'TENAGA', strength: 7, note: 'MASA → TENAGA → MASA' }, { principle: 'CAHAYA', strength: 5, note: 'Time reveals illumination' }],
  TENAGA:  [{ principle: 'MASA', strength: 7, note: 'Creation law' }, { principle: 'API', strength: 6, note: 'Energy as fire' }],
  AIR:     [{ principle: 'BUMI', strength: 6, note: 'Water nourishes earth' }, { principle: 'RUANG', strength: 5, note: 'Flow through space' }],
  API:     [{ principle: 'TENAGA', strength: 6, note: 'Fire is energy manifest' }, { principle: 'CAHAYA', strength: 5, note: 'Flame gives light' }],
  BUMI:    [{ principle: 'AIR', strength: 6, note: 'Earth holds water' }, { principle: 'MASA', strength: 4, note: 'Geological time' }],
  CAHAYA:  [{ principle: 'RUANG', strength: 7, note: 'Light fills space' }, { principle: 'MASA', strength: 6, note: 'Time illuminates' }],
  RUANG:   [{ principle: 'CAHAYA', strength: 7, note: 'Space receives light' }, { principle: 'AIR', strength: 5, note: 'Atmosphere is space' }],
};

function reverseType(type: ConnectionType): ConnectionType {
  if (type === 'parent') return 'child';
  if (type === 'child') return 'parent';
  return type;
}

function connKey(c: Pick<EntityConnection, 'targetUid' | 'connectionType'>): string {
  return `${c.targetUid}:${c.connectionType}`;
}

function dedupeConnections(list: EntityConnection[]): EntityConnection[] {
  const seen = new Set<string>();
  const out: EntityConnection[] = [];
  for (const c of list) {
    const k = connKey(c);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

async function latestEntityForFamily(
  founderId: string,
  family: string,
): Promise<{ uid: string; family: string; principle: string } | null> {
  const doc = await QXK24BrainEntityModel.findOne({
    founderId,
    family,
    auditStatus: { $nin: ['dissolved', 'waqf'] },
  })
    .sort({ masa_born: -1 })
    .select('uid family principle')
    .lean();
  return doc ? { uid: doc.uid, family: doc.family, principle: doc.principle } : null;
}

async function latestEntityForPrinciple(
  founderId: string,
  principle: string,
  excludeFamily?: string,
): Promise<{ uid: string; family: string; principle: string } | null> {
  const query: Record<string, unknown> = { founderId, principle };
  if (excludeFamily) query.family = { $ne: excludeFamily };
  query.auditStatus = { $nin: ['dissolved', 'waqf'] };
  const doc = await QXK24BrainEntityModel.findOne(query)
    .sort({ masa_born: -1 })
    .select('uid family principle')
    .lean();
  return doc ? { uid: doc.uid, family: doc.family, principle: doc.principle } : null;
}

export async function buildConnectionsForEntity(
  entity: Pick<QXK24BrainEntityDocument, 'uid' | 'family' | 'principle' | 'isNucleus' | 'nucleusUid'>,
  master: QXK24BrainMasterDocument,
  founderId: string,
): Promise<EntityConnection[]> {
  const now = new Date();
  const connections: EntityConnection[] = [];
  const add = (
    target: { uid: string; family: string },
    type: ConnectionType,
    strength: number,
    note?: string,
  ) => {
    if (target.uid === entity.uid) return;
    connections.push({
      targetUid:      target.uid,
      targetFamily:   target.family,
      connectionType: type,
      strength:       Math.min(7, Math.max(1, strength)),
      masa_connected: now,
      note,
    });
  };

  if (!entity.isNucleus && entity.nucleusUid && entity.nucleusUid !== entity.uid) {
    const nucleus = await QXK24BrainEntityModel.findOne({ uid: entity.nucleusUid })
      .select('uid family')
      .lean();
    if (nucleus) add(nucleus, 'parent', 7, 'Nucleus of this family');
  }

  for (const f of master.activeFamilies) {
    if (f.family === entity.family) continue;
    if (f.principle === entity.principle) {
      const target = await latestEntityForFamily(founderId, f.family);
      if (target) add(target, 'sibling', Math.min(6, f.stage), `Same principle ${entity.principle}`);
    }
  }

  for (const f of master.completedFamilies) {
    if (f.family === entity.family) continue;
    if (f.principle === entity.principle) {
      const target = await latestEntityForFamily(founderId, f.family);
      if (target) add(target, 'sibling', 7, `Completed sibling · ${entity.principle}`);
    }
  }

  const affinities = PRINCIPLE_AFFINITY[entity.principle] ?? [];
  for (const aff of affinities) {
    const target = await latestEntityForPrinciple(founderId, aff.principle, entity.family);
    if (target) add(target, 'principle', aff.strength, aff.note);
  }

  return dedupeConnections(connections);
}

async function appendBidirectionalConnections(
  sourceUid: string,
  sourceFamily: string,
  connections: EntityConnection[],
): Promise<void> {
  for (const c of connections) {
    const reverse: EntityConnection = {
      targetUid:      sourceUid,
      targetFamily:   sourceFamily,
      connectionType: reverseType(c.connectionType),
      strength:       c.strength,
      masa_connected: new Date(),
      note:           c.note,
    };

    const target = await QXK24BrainEntityModel.findOne({ uid: c.targetUid }).lean();
    if (!target) continue;

    const existing = (target.connections ?? []).some(
      (x) => x.targetUid === sourceUid && x.connectionType === reverse.connectionType,
    );
    if (existing) continue;

    await QXK24BrainEntityModel.updateOne(
      { uid: c.targetUid },
      { $push: { connections: reverse } },
    );
  }
}

export async function weaveEntityConnections(
  entityUid: string,
  founderId = 'masa-bayu',
): Promise<number> {
  const entity = await QXK24BrainEntityModel.findOne({ uid: entityUid, founderId }).lean();
  if (!entity) return 0;

  const master = await getOrCreateMaster(founderId);
  const connections = await buildConnectionsForEntity(entity, master, founderId);

  await QXK24BrainEntityModel.updateOne(
    { uid: entityUid },
    { $set: { connections } },
  );

  await appendBidirectionalConnections(entity.uid, entity.family, connections);
  return connections.length;
}

export async function backfillKnowledgeGraph(founderId = 'masa-bayu', limit = 30): Promise<number> {
  const stale = await QXK24BrainEntityModel.find({
    founderId,
    auditStatus: { $nin: ['dissolved', 'waqf'] },
    $or: [{ connections: { $exists: false } }, { connections: { $size: 0 } }],
  })
    .sort({ masa_born: -1 })
    .limit(limit)
    .select('uid')
    .lean();

  let count = 0;
  for (const e of stale) {
    const n = await weaveEntityConnections(e.uid, founderId);
    if (n > 0) count += 1;
  }
  return count;
}

function detectGraphFocus(
  message: string,
  families: string[],
): { kind: 'family' | 'principle'; value: string } | null {
  const lower = message.toLowerCase();
  for (const f of families) {
    if (f.length > 2 && lower.includes(f.toLowerCase())) {
      return { kind: 'family', value: f };
    }
  }
  for (const p of CORE_PRINCIPLES) {
    if (new RegExp(`\\b${p}\\b`, 'i').test(message)) {
      return { kind: 'principle', value: p };
    }
  }
  return null;
}

function formatConnectionLine(c: EntityConnection): string {
  const note = c.note ? ` — ${c.note}` : '';
  return `  → ${c.targetFamily} [${c.connectionType}] strength ${c.strength}/7${note}`;
}

export async function buildKnowledgeGraphContextBlock(
  founderId = 'masa-bayu',
  focusMessage = '',
): Promise<string> {
  await backfillKnowledgeGraph(founderId, 20);

  const master = await getOrCreateMaster(founderId);
  const familyNames = [
    ...master.activeFamilies.map((f) => f.family),
    ...master.completedFamilies.map((f) => f.family),
  ];
  const focus = focusMessage ? detectGraphFocus(focusMessage, familyNames) : null;

  const entities = await QXK24BrainEntityModel.find({
    founderId,
    auditStatus: { $nin: ['dissolved', 'waqf'] },
    connections: { $exists: true, $not: { $size: 0 } },
  })
    .sort({ masa_born: -1 })
    .limit(focus ? 40 : 15)
    .lean();

  if (!entities.length) {
    return `
[CONSTITUTIONAL KNOWLEDGE GRAPH]
No cross-family connections mapped yet. As families grow, every entity links
to siblings, principles, and the Master chain — nothing isolated (Law 5).
`.trim();
  }

  let subset = entities;
  if (focus?.kind === 'family') {
    subset = entities.filter((e) =>
      e.family === focus.value ||
      (e.connections ?? []).some((c) => c.targetFamily === focus.value),
    );
  } else if (focus?.kind === 'principle') {
    subset = entities.filter((e) =>
      e.principle === focus.value ||
      (e.connections ?? []).some((c) => c.connectionType === 'principle'),
    );
  }
  if (!subset.length) subset = entities.slice(0, 10);

  const blocks = subset.slice(0, 12).map((e) => {
    const conns = (e.connections ?? []).slice(0, 8);
    const lines = conns.length
      ? conns.map(formatConnectionLine).join('\n')
      : '  (no connections yet)';
    return `${e.family} (${e.principle}) · ${e.uid.slice(-12)}
${lines}`;
  });

  const focusLine = focus
    ? `Focus this turn: ${focus.kind === 'family' ? 'family' : 'principle'} "${focus.value}"`
    : 'Showing recent connected families';

  return `
╔══════════════════════════════════════════════════════╗
║       CONSTITUTIONAL KNOWLEDGE GRAPH — No Isolation    ║
║  Allah → Al-Quran → Alamtologi → QXK24 → ADAM          ║
╚══════════════════════════════════════════════════════╝

${focusLine}
When P.alt asks about one family — bring related siblings and principles naturally.
Connection types: parent · child · sibling · principle (strength 1–7 AIDIL scale).

${blocks.join('\n\n')}

LAW: Nothing is isolated. The graph IS constitutional intelligence — what P.alt taught.
`.trim();
}

export async function getKnowledgeGraphSnapshot(founderId = 'masa-bayu') {
  await backfillKnowledgeGraph(founderId, 30);
  const entities = await QXK24BrainEntityModel.find({
    founderId,
    auditStatus: { $nin: ['dissolved', 'waqf'] },
  })
    .sort({ masa_born: -1 })
    .limit(80)
    .select('uid family principle stage connections isNucleus masa_born')
    .lean();
  return {
    entityCount: entities.length,
    connectedCount: entities.filter((e) => (e.connections?.length ?? 0) > 0).length,
    entities,
  };
}
