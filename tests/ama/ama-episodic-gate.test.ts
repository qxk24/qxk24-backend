/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Ama Episodic Gate Test
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

import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { shouldAppendEpisodicB } from '../../src/lib/ama/ama-episodic-gate';
import {
  parseEpisodicLane,
  purgeEpisodicLaneEntries,
  rebuildEpisodicLane,
  AMA_UAT_PURGE_WINDOW,
} from '../../src/lib/ama/ama-episodic-purge';

describe('ama-episodic-gate', () => {
  const prev = process.env.ADAM_AMA_BRAIN_V2;

  beforeEach(() => {
    process.env.ADAM_AMA_BRAIN_V2 = 'true';
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.ADAM_AMA_BRAIN_V2;
    else process.env.ADAM_AMA_BRAIN_V2 = prev;
  });

  it('allows append on teaching upload', () => {
    expect(shouldAppendEpisodicB({
      isFounder: true,
      message:   'P.alt ajar bab ini',
      uploadIds: ['up-1'],
      teachingContext: 'FOUNDER TEACHING DATA…',
    })).toBe(true);
  });

  it('blocks founder QA mixed question', () => {
    expect(shouldAppendEpisodicB({
      isFounder: true,
      message:   'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?',
      uploadIds: [],
      teachingContext: '',
    })).toBe(false);
  });

  it('blocks founder recall QA', () => {
    expect(shouldAppendEpisodicB({
      isFounder: true,
      message:   'Adam, ingat tak waktu kita bincang rh di Kelantan?',
      uploadIds: [],
      teachingContext: '',
    })).toBe(false);
  });

  it('blocks meta paste from uat', () => {
    expect(shouldAppendEpisodicB({
      isFounder: true,
      message:   'Tahap 4, 5, dan Langkah 6 siap — neuro validation',
      uploadIds: [],
      teachingContext: '',
    })).toBe(false);
  });

  it('allows long teaching text without upload', () => {
    expect(shouldAppendEpisodicB({
      isFounder: true,
      message:   'Bismillahirahmanirrahim. '.repeat(20),
      uploadIds: [],
      teachingContext: '',
    })).toBe(true);
  });
});

describe('ama-episodic-purge', () => {
  it('parses and rebuilds lane entries', () => {
    const raw = [
      '',
      '── MASA 2026-06-06T23:42:55.383Z · Ruang · K24B-LOG-1 ──',
      'QA question',
      '',
      '── MASA 2026-06-06T10:00:00.000Z · rh · K24B-LOG-keep ──',
      'Real teaching evidence',
    ].join('\n');

    const entries = parseEpisodicLane(raw);
    expect(entries).toHaveLength(2);
    expect(rebuildEpisodicLane(entries)).toContain('Real teaching evidence');
  });

  it('purges entries in uat window only', () => {
    const raw = [
      '',
      '── MASA 2026-06-06T23:43:00.000Z · Test · K24B-LOG-uat ──',
      'UAT mixed question',
      '',
      '── MASA 2026-06-05T12:00:00.000Z · rh · K24B-LOG-old ──',
      'Keep this',
    ].join('\n');

    const { removed, kept, rebuilt } = purgeEpisodicLaneEntries(raw, AMA_UAT_PURGE_WINDOW);
    expect(removed).toHaveLength(1);
    expect(removed[0].id).toBe('K24B-LOG-uat');
    expect(kept).toHaveLength(1);
    expect(rebuilt).toContain('Keep this');
    expect(rebuilt).not.toContain('UAT mixed');
  });
});
