/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mermaid Sanitize Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeAdamMermaidSource } from '../src/adam/adam-mermaid-sanitize';
import { repairTechnicalDiagramMermaidSyntax } from '../src/adam/adam-technical-diagram-guard';

describe('adam-mermaid-sanitize', () => {
  it('quotes node labels with commas and slashes', () => {
    const raw = [
      'flowchart TD',
      ' B[Legislatif, Parlimen]',
      ' C[Eksekutif, Kabinet / PM]',
    ].join('\n');
    const out = sanitizeAdamMermaidSource(raw);
    expect(out).toContain('B["Legislatif, Parlimen"]');
    expect(out).toContain('C["Eksekutif, Kabinet / PM"]');
  });

  it('quotes mid-line node labels with parentheses (physics momentum)', () => {
    const raw = [
      'flowchart LR',
      'A["Jisim (m)"] --> C[Momentum (Q)]',
      'B["Kelajuan (v)"] --> C',
    ].join('\n');
    const out = sanitizeAdamMermaidSource(raw);
    expect(out).toContain('C["Momentum (Q)"]');
    expect(out).toContain('A["Jisim (m)"]');
  });

  it('leaves simple labels unchanged', () => {
    const raw = 'flowchart TD\n  A[Undang-undang tertinggi]';
    expect(sanitizeAdamMermaidSource(raw)).toBe(raw);
  });

  it('repairs diagram protocol tags in full reply', () => {
    const reply = [
      '### Tiga cabang kuasa',
      '<adam-technical-diagram>',
      'flowchart TD',
      ' B[Legislatif, Parlimen]',
      '</adam-technical-diagram>',
    ].join('\n');
    const out = repairTechnicalDiagramMermaidSyntax(reply);
    expect(out).toContain('B["Legislatif, Parlimen"]');
  });
});
