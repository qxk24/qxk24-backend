/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  mergeParagraphIntoSection,
  normalizeSectionParagraphBody,
  parseSectionParagraphs,
  sectionParagraphBlockComplete,
} from '../src/adam/adam-journal-section-paragraphs';

describe('Journal section paragraphs', () => {
  it('mergeParagraphIntoSection replaces ¶2 without wiping ¶1 and ¶3', () => {
    const existing =
      '### ¶1\n\nPerenggan pertama yang panjang. '.repeat(6)
      + '\n\n### ¶2\n\nPerenggan kedua asal. '.repeat(6)
      + '\n\n### ¶3\n\nPerenggan ketiga kekal. '.repeat(6);
    const updated = mergeParagraphIntoSection(
      existing,
      2,
      'Perenggan kedua baharu — AI dan MASA. '.repeat(8),
      'replace',
    );
    expect(updated).toContain('Perenggan pertama');
    expect(updated).toContain('Perenggan kedua baharu');
    expect(updated).toContain('Perenggan ketiga kekal');
    expect(updated).not.toContain('Perenggan kedua asal');
    expect(parseSectionParagraphs(updated).size).toBe(3);
  });

  it('normalizes unmarked prose into ¶1', () => {
    const body = 'Prosa tanpa penanda. '.repeat(12);
    const out = normalizeSectionParagraphBody('movement_2_achievement', body);
    expect(out).toMatch(/^### ¶1/m);
    expect(out).toContain('Prosa tanpa penanda');
  });

  it('sectionParagraphBlockComplete after three paragraphs', () => {
    const body =
      '### ¶1\n\nA. '.repeat(20)
      + '\n\n### ¶2\n\nB. '.repeat(20)
      + '\n\n### ¶3\n\nC. '.repeat(20);
    expect(sectionParagraphBlockComplete(body)).toBe(true);
  });
});
