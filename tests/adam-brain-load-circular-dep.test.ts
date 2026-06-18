/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Brain Load Gate — Circular Dep Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import { describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chapterNeedsFullBrainLoad } from '../src/adam/book-aware-recall/brain-load';
import { needsBookAwareTeachingRecall } from '../src/adam/book-aware-recall/teaching-recall-probes';

describe('book-aware-recall leaf modules — circular dep fix', () => {
  it('leaf probes are callable', () => {
    expect(typeof chapterNeedsFullBrainLoad).toBe('function');
    expect(typeof needsBookAwareTeachingRecall).toBe('function');
    expect(chapterNeedsFullBrainLoad('Bab 5 napadu')).toBe(true);
    expect(needsBookAwareTeachingRecall('ingatkan pengajaran Bab 2')).toBe(true);
  });

  it('hot paths import leaf modules directly', () => {
    const ama = readFileSync(
      join(__dirname, '../dist/lib/ama/ama-brain-integration.service.js'),
      'utf8',
    );
    const ctx = readFileSync(
      join(__dirname, '../dist/qxk24brain/adam-context-builder.js'),
      'utf8',
    );
    expect(ama).toMatch(/book-aware-recall\/brain-load/);
    expect(ama).not.toMatch(/adam_book_aware_recall_1\.chapterNeedsFullBrainLoad/);
    expect(ctx).toMatch(/book-aware-recall\/teaching-recall-probes/);
    expect(ctx).not.toMatch(/adam_book_aware_recall_1\.needsBookAwareTeachingRecall/);
  });

  it('context-builder loads without undefined probe exports', () => {
    expect(() => {
      jest.isolateModules(() => {
        const ctx = require('../dist/qxk24brain/adam-context-builder.js');
        const probes = require('../dist/adam/book-aware-recall/teaching-recall-probes.js');
        expect(typeof probes.needsBookAwareTeachingRecall).toBe('function');
        expect(typeof ctx.buildSmartContext).toBe('function');
      });
    }).not.toThrow();
  });
});
