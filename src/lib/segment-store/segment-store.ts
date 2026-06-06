/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Segment Store (Six Collections)
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
 * Six physically separate collections — Kr, Kn, Dn, Bg, As, Bh.
 * Tahap 0: in-memory store + optional MongoDB dual-write hook.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { AmaSegment } from '../ama/ama.types';
import {
  parseSegmentEntry,
  type SegmentEntry,
} from './segment-schemas';

export interface StoredSegmentRow {
  _id?:      string;
  segment:   AmaSegment;
  founderId: string;
  entry:     SegmentEntry;
  createdAt: Date;
}

export interface SegmentStoreWriteResult {
  segment:   AmaSegment;
  id:        string;
  latencyMs: number;
}

export interface SegmentStoreQueryResult {
  rows:      StoredSegmentRow[];
  latencyMs: number;
}

const SEGMENTS: AmaSegment[] = ['Kr', 'Kn', 'Dn', 'Bg', 'As', 'Bh'];

function collectionName(segment: AmaSegment): string {
  return `ama_segment_${segment.toLowerCase()}`;
}

/** In-memory store — unit tests and Tahap 0 lab */
export class InMemorySegmentStore {
  private readonly buckets = new Map<AmaSegment, StoredSegmentRow[]>();

  constructor() {
    for (const s of SEGMENTS) {
      this.buckets.set(s, []);
    }
  }

  async write(
    segment: AmaSegment,
    founderId: string,
    raw: unknown,
  ): Promise<SegmentStoreWriteResult> {
    const start = Date.now();
    const entry = parseSegmentEntry(segment, raw);
    const id = `${segment}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const row: StoredSegmentRow = {
      _id:       id,
      segment,
      founderId,
      entry,
      createdAt: new Date(),
    };
    this.buckets.get(segment)!.push(row);
    return { segment, id, latencyMs: Date.now() - start };
  }

  async query(
    segment: AmaSegment,
    founderId: string,
    limit = 50,
  ): Promise<SegmentStoreQueryResult> {
    const start = Date.now();
    const rows = this.buckets
      .get(segment)!
      .filter((r) => r.founderId === founderId)
      .slice(-limit);
    return { rows, latencyMs: Date.now() - start };
  }

  async count(segment: AmaSegment): Promise<number> {
    return this.buckets.get(segment)!.length;
  }

  /** Dual-lane write — Kotak 2 → Kr, Kotak 3 → Kn */
  async writeDualLane(
    founderId: string,
    structuralC: string,
    episodicB: string,
    sourceId: string,
  ): Promise<{ kr: SegmentStoreWriteResult; kn: SegmentStoreWriteResult }> {
    const ts = new Date().toISOString();
    const [kr, kn] = await Promise.all([
      this.write('Kr', founderId, {
        formula:   structuralC.slice(0, 4000),
        timestamp: ts,
        sourceId,
      }),
      this.write('Kn', founderId, {
        episodeId:    `EP-${sourceId}`,
        timestamp:    ts,
        sourceId,
        evidenceText: episodicB.slice(0, 8000),
        rasaWeight:   5,
      }),
    ]);
    return { kr, kn };
  }
}

interface SegmentDoc extends Document {
  founderId: string;
  entry:     Record<string, unknown>;
}

const mongoModels = new Map<AmaSegment, Model<SegmentDoc>>();

function getMongoModel(segment: AmaSegment): Model<SegmentDoc> {
  const existing = mongoModels.get(segment);
  if (existing) return existing;

  const schema = new Schema<SegmentDoc>(
    {
      founderId: { type: String, required: true, index: true },
      entry:     { type: Schema.Types.Mixed, required: true },
    },
    {
      timestamps: true,
      collection: collectionName(segment),
    },
  );

  const model = mongoose.models[collectionName(segment)]
    ?? mongoose.model<SegmentDoc>(collectionName(segment), schema);
  mongoModels.set(segment, model);
  return model;
}

/** MongoDB-backed segment store — production dual-write phase */
export class MongoSegmentStore {
  async write(
    segment: AmaSegment,
    founderId: string,
    raw: unknown,
  ): Promise<SegmentStoreWriteResult> {
    const start = Date.now();
    const entry = parseSegmentEntry(segment, raw);
    const Model = getMongoModel(segment);
    const doc = await Model.create({ founderId, entry });
    return {
      segment,
      id:        String(doc._id),
      latencyMs: Date.now() - start,
    };
  }

  async query(
    segment: AmaSegment,
    founderId: string,
    limit = 50,
  ): Promise<SegmentStoreQueryResult> {
    const start = Date.now();
    const Model = getMongoModel(segment);
    const docs = await Model.find({ founderId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const rows: StoredSegmentRow[] = docs.map((d) => ({
      _id:       String(d._id),
      segment,
      founderId: d.founderId,
      entry:     parseSegmentEntry(segment, d.entry),
      createdAt: (d as { createdAt?: Date }).createdAt ?? new Date(),
    }));
    return { rows, latencyMs: Date.now() - start };
  }

  async writeDualLane(
    founderId: string,
    structuralC: string,
    episodicB: string,
    sourceId: string,
  ): Promise<{ kr: SegmentStoreWriteResult; kn: SegmentStoreWriteResult }> {
    const ts = new Date().toISOString();
    const [kr, kn] = await Promise.all([
      this.write('Kr', founderId, {
        formula:   structuralC.slice(0, 4000),
        timestamp: ts,
        sourceId,
      }),
      this.write('Kn', founderId, {
        episodeId:    `EP-${sourceId}`,
        timestamp:    ts,
        sourceId,
        evidenceText: episodicB.slice(0, 8000),
        rasaWeight:   5,
      }),
    ]);
    return { kr, kn };
  }
}

let defaultStore: InMemorySegmentStore | null = null;

export function getSegmentStore(): InMemorySegmentStore {
  if (!defaultStore) defaultStore = new InMemorySegmentStore();
  return defaultStore;
}

export function resetSegmentStoreForTests(): void {
  defaultStore = new InMemorySegmentStore();
}

/** Stress test helper — Tahap 0 target ≤ 120ms avg per collection */
export async function stressTestSegmentStore(
  entriesPerSegment = 1000,
): Promise<Record<AmaSegment, { writeAvgMs: number; queryAvgMs: number }>> {
  const store = new InMemorySegmentStore();
  const founderId = 'stress-test';
  const stats = {} as Record<AmaSegment, { writeAvgMs: number; queryAvgMs: number }>;

  for (const segment of SEGMENTS) {
    const writeTimes: number[] = [];
    for (let i = 0; i < entriesPerSegment; i++) {
      const ts = new Date().toISOString();
      const base = { timestamp: ts, sourceId: `src-${i}` };
      let raw: unknown;
      if (segment === 'Kn') {
        raw = { ...base, episodeId: `ep-${i}` };
      } else if (segment === 'Kr') {
        raw = { ...base, formula: `f(${i})=x` };
      } else {
        raw = base;
      }
      const r = await store.write(segment, founderId, raw);
      writeTimes.push(r.latencyMs);
    }
    const queryStart = Date.now();
    await Promise.all(SEGMENTS.map((s) => store.query(s, founderId, 10)));
    const queryMs = Date.now() - queryStart;
    stats[segment] = {
      writeAvgMs: writeTimes.reduce((a, b) => a + b, 0) / writeTimes.length,
      queryAvgMs: queryMs / SEGMENTS.length,
    };
  }
  return stats;
}
