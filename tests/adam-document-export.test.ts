/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  parseMarkdownExportBlocks,
  stripAdamExportMetadata,
} from '../src/adam/adam-markdown-export-blocks';
import { compileAdamDocument } from '../src/adam/adam-document-export.service';

const SAMPLE = `
**Langkah 1 — Susun nombor**

| Ribu | Ratus | Puluhan | Satu |
| --- | --- | --- | --- |
| 3 | 0 | 5 | 7 |
| 1 | 2 | 4 | 0 |

→ ______
`.trim();

describe('adam-markdown-export-blocks', () => {
  it('parses table, paragraph, and answer line', () => {
    const blocks = parseMarkdownExportBlocks(SAMPLE);
    expect(blocks.some((b) => b.type === 'table')).toBe(true);
    expect(blocks.some((b) => b.type === 'answer')).toBe(true);
    expect(blocks.some((b) => b.type === 'paragraph')).toBe(true);
  });

  it('strips adam protocol blocks', () => {
    const raw = '<adam_meta>hidden</adam_meta>\n\nHello';
    expect(stripAdamExportMetadata(raw)).toBe('Hello');
  });
});

describe('adam-document-export.service', () => {
  it('builds pdf and docx buffers', async () => {
    const pdf = await compileAdamDocument({ content: SAMPLE, format: 'pdf' });
    expect(pdf.buffer.length).toBeGreaterThan(100);
    expect(pdf.mimeType).toBe('application/pdf');

    const docx = await compileAdamDocument({ content: SAMPLE, format: 'docx' });
    expect(docx.buffer.length).toBeGreaterThan(100);
    expect(docx.mimeType).toContain('wordprocessingml');
  });
});
