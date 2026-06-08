/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { prepareContentForStorage } from '../src/adam/adam-journal-formula';
import { sanitizeMalayJournalDashBridges } from '../src/adam/adam-journal-prose-sanitize';
import { formatSingleSectionDisplay } from '../src/adam/adam-journal-section-writer';

describe('Malay journal dash sanitize', () => {
  it('replaces em dash bridges with commas in abstract prose', () => {
    const raw =
      'Oral Literature — khususnya Spoken Word — bukan sekadar bentuk. '
      + 'dinding jujur — bahawa ilmu konvensional gagal.';
    const out = sanitizeMalayJournalDashBridges(raw);
    expect(out).not.toMatch(/[—–]/);
    expect(out).toContain('Oral Literature, khususnya Spoken Word, bukan');
    expect(out).toContain('dinding jujur, bahawa ilmu');
  });

  it('prepareContentForStorage applies dash sanitize before save', () => {
    const stored = prepareContentForStorage('Suara — hidup — berdenyut.');
    expect(stored).not.toMatch(/[—–]/);
    expect(stored).toBe('Suara, hidup, berdenyut.');
  });

  it('formatSingleSectionDisplay sanitizes title_and_abstract body', () => {
    const body = '# Tajuk\n\n## Abstrak\n\nSatu — dua — tiga.';
    const display = formatSingleSectionDisplay('title_and_abstract', body);
    expect(display).not.toMatch(/[—–]/);
    expect(display).toContain('Satu, dua, tiga.');
  });
});
