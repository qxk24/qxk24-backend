/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  extractAbstractFromTitleSection,
  resolveJournalFieldsFromMongoDoc,
} from '../src/adam/adam-journal-section-map';

describe('Journal translation — V2 draft hydration', () => {
  const titleSection = `# One Is Not a Beginning — But an Opening End

## Abstract

Analysis — the branch of mathematics concerned with limits. `.repeat(4);

  it('extracts abstract from V2 title_and_abstract section', () => {
    const abstract = extractAbstractFromTitleSection(titleSection);
    expect(abstract).toMatch(/^Analysis — the branch/);
    expect(abstract).not.toMatch(/^# One Is Not/);
  });

  it('hydrates title and abstract from draftSections when doc fields empty', () => {
    const resolved = resolveJournalFieldsFromMongoDoc({
      draftSections: {
        title_and_abstract: titleSection,
        movement_1_human_opening: 'Bayangkan anda duduk di tepi sungai. '.repeat(20),
      },
    });
    expect(resolved.title).toMatch(/One Is Not a Beginning/);
    expect(resolved.abstract).toMatch(/Analysis — the branch/);
    expect(resolved.content.introduction).toMatch(/Bayangkan anda/);
  });
});
