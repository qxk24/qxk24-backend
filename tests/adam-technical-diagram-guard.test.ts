/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Technical Diagram Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  outputHasTechnicalDiagram,
  repairTechnicalDiagramOutput,
  stashAdamTechnicalDiagramBlocks,
  restoreAdamTechnicalDiagramBlocks,
  wrapTechnicalDiagram,
} from '../src/adam/adam-technical-diagram-guard';

describe('adam-technical-diagram-guard', () => {
  it('detects diagram protocol tags', () => {
    const block = wrapTechnicalDiagram('flowchart LR\n  A --> B');
    expect(outputHasTechnicalDiagram(block)).toBe(true);
  });

  it('stash and restore diagram blocks', () => {
    const raw = `Definisi.\n\n${wrapTechnicalDiagram('flowchart LR\n  A --> B')}\n\n### Langkah`;
    const vault = stashAdamTechnicalDiagramBlocks(raw);
    expect(vault.prose).not.toMatch(/<adam-technical-diagram>/);
    const restored = restoreAdamTechnicalDiagramBlocks(vault.prose, vault.blocks);
    expect(restored).toMatch(/<adam-technical-diagram>[\s\S]*flowchart/i);
  });

  it('injects photosynthesis fallback diagram', () => {
    const prose = 'Fotosintesis ialah proses tumbuhan.\n\n### Bahan';
    const out = repairTechnicalDiagramOutput(prose, 'Apa itu fotosintesis?');
    expect(out).toMatch(/<adam-technical-diagram>/);
    expect(out).toMatch(/Klorofil|Glukosa/i);
  });
});
