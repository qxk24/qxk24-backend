/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Segment Store Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  InMemorySegmentStore,
  resetSegmentStoreForTests,
  stressTestSegmentStore,
} from '../../src/lib/segment-store/segment-store';
import { parseSegmentEntry } from '../../src/lib/segment-store/segment-schemas';

describe('segment-store', () => {
  beforeEach(() => {
    resetSegmentStoreForTests();
  });

  it('writes Kr and Kn on dual-lane write', async () => {
    const store = new InMemorySegmentStore();
    const { kr, kn } = await store.writeDualLane(
      'masa-bayu',
      'C: rh formula updated',
      'B: 42 students Sekolah Rantau Panjang July 2026',
      'tx-001',
    );
    expect(kr.segment).toBe('Kr');
    expect(kn.segment).toBe('Kn');

    const krRows = await store.query('Kr', 'masa-bayu');
    const knRows = await store.query('Kn', 'masa-bayu');
    expect(krRows.rows.length).toBe(1);
    expect(knRows.rows.length).toBe(1);
  });

  it('validates Kr schema fields', () => {
    const entry = parseSegmentEntry('Kr', {
      formula:   'x=m/t',
      timestamp: new Date().toISOString(),
      sourceId:  'src-1',
    });
    expect(entry.formula).toBe('x=m/t');
  });

  it('validates Kn rasaWeight range', () => {
    expect(() =>
      parseSegmentEntry('Kn', {
        episodeId:   'ep-1',
        timestamp:   new Date().toISOString(),
        sourceId:    'src-1',
        rasaWeight:  11,
      }),
    ).toThrow();
  });

  it('stress test avg write latency ≤ 120ms per segment', async () => {
    const stats = await stressTestSegmentStore(200);
    for (const seg of Object.keys(stats) as Array<keyof typeof stats>) {
      expect(stats[seg].writeAvgMs).toBeLessThanOrEqual(120);
    }
  }, 30_000);
});
