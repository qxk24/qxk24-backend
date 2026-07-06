/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Chat Files Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-04
 * ============================================================
 */

import {
  appendNiagaChatFilesToResponse,
  buildNiagaChatFileTags,
  detectNiagaCashflowTemplateFormats,
} from '../src/adam/adam-niaga-chat-files';

describe('adam-niaga-chat-files', () => {
  it('detects cashflow template requests', () => {
    expect(detectNiagaCashflowTemplateFormats('bagi template cashflow')).toEqual([
      'xlsx', 'pdf', 'docx',
    ]);
    expect(detectNiagaCashflowTemplateFormats('hantar excel aliran tunai')).toEqual(['xlsx']);
    expect(detectNiagaCashflowTemplateFormats('download pdf cashflow template')).toEqual(['pdf']);
    expect(detectNiagaCashflowTemplateFormats('bagi word dan excel cashflow')).toEqual([
      'xlsx', 'docx',
    ]);
  });

  it('ignores ordinary cashflow coaching questions', () => {
    expect(detectNiagaCashflowTemplateFormats('Bagaimana jaga cashflow minggu ini?')).toBeNull();
    expect(detectNiagaCashflowTemplateFormats('Margin saya rendah')).toBeNull();
  });

  it('appends file tags idempotently', () => {
    const tags = buildNiagaChatFileTags(['xlsx', 'pdf']);
    const once = appendNiagaChatFilesToResponse('Ini template.', ['xlsx', 'pdf']);
    const twice = appendNiagaChatFilesToResponse(once, ['xlsx', 'pdf']);
    expect(once).toContain('Ini template.');
    expect(once).toContain(tags.split('\n')[0]);
    expect(twice.match(/<adam-chat-file\b/gi)).toHaveLength(2);
  });
});
