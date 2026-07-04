/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Markdown Export Blocks Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-04
 * ============================================================
 */

import { parseMarkdownExportBlocks } from '../src/adam/adam-markdown-export-blocks';

describe('parseMarkdownExportBlocks', () => {
  it('keeps intro paragraph separate from numbered list items', () => {
    const blocks = parseMarkdownExportBlocks([
      'Anda boleh mulakan dengan langkah-langkah berikut:',
      '1. Kira kos bahan mentah.',
      '2. Kira kos tenaga kerja.',
      '3. Kira kos tetap.',
    ].join('\n'));

    expect(blocks[0]).toEqual({
      type: 'paragraph',
      text: 'Anda boleh mulakan dengan langkah-langkah berikut:',
    });
    expect(blocks[1]).toEqual({ type: 'paragraph', text: '1. Kira kos bahan mentah.' });
    expect(blocks[2]).toEqual({ type: 'paragraph', text: '2. Kira kos tenaga kerja.' });
    expect(blocks[3]).toEqual({ type: 'paragraph', text: '3. Kira kos tetap.' });
  });

  it('parses blockquotes and fenced code as answer boxes', () => {
    const blocks = parseMarkdownExportBlocks([
      '> **Fakta:** Cashflow bukan untung.',
      '',
      '```',
      'Masuk - Keluar = Bersih',
      '```',
    ].join('\n'));

    expect(blocks[0]).toEqual({
      type: 'answer',
      text: '**Fakta:** Cashflow bukan untung.',
    });
    expect(blocks[1]).toEqual({
      type: 'answer',
      text: 'Masuk - Keluar = Bersih',
    });
  });
});
