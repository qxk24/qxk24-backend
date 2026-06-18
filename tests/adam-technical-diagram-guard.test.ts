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
  stripGenericTechnicalDiagrams,
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

  it('does not inject fallback diagram on structured opt-in when model omitted one', () => {
    const prose = 'Fotosintesis ialah proses tumbuhan.\n\n### Bahan';
    const out = repairTechnicalDiagramOutput(prose, 'Senarai langkah-langkah proses fotosintesis');
    expect(out).not.toMatch(/<adam-technical-diagram>/);
  });

  it('does not inject diagram on plain definitional ask', () => {
    const prose = 'Fotosintesis ialah proses tumbuhan.';
    const out = repairTechnicalDiagramOutput(prose, 'Apa itu fotosintesis?');
    expect(out).not.toMatch(/<adam-technical-diagram>/);
  });

  it('strips generic placeholder diagrams on universal turns', () => {
    const prose = [
      'Bubble sort membandingkan elemen.',
      wrapTechnicalDiagram([
        'flowchart LR',
        '  A[Input atau punca]',
        '  B[Proses]',
        '  C[Hasil]',
        '  A --> B --> C',
      ].join('\n')),
      'Kerumitan O(n²).',
    ].join('\n\n');
    const out = stripGenericTechnicalDiagrams(prose);
    expect(out).not.toMatch(/<adam-technical-diagram>/i);
    expect(out).toMatch(/Kerumitan O\(n²\)/i);
  });
});
