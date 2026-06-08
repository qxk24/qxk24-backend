/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { prepareContentForStorage } from '../src/adam/adam-journal-formula';
import {
  sanitizeAdamProseDashBridges,
  sanitizeMalayJournalDashBridges,
} from '../src/adam/adam-prose-sanitize';
import { formatSingleSectionDisplay } from '../src/adam/adam-journal-section-writer';
import {
  listKnowledgeMajorNames,
  searchUniversityKnowledgeTopics,
} from '../src/adam/adam-university-knowledge';

describe('ADAM prose dash sanitize', () => {
  it('replaces em dash bridges with commas in all languages', () => {
    const raw =
      'Oral Literature — especially Spoken Word — is not merely form. '
      + 'honest wall — that convention fails.';
    const out = sanitizeAdamProseDashBridges(raw);
    expect(out).not.toMatch(/[—–]/);
    expect(out).toContain('Oral Literature, especially Spoken Word, is');
    expect(out).toContain('honest wall, that convention fails.');
  });

  it('keeps deprecated alias in sync', () => {
    expect(sanitizeMalayJournalDashBridges('A — B')).toBe('A, B');
  });

  it('prepareContentForStorage applies dash sanitize before save', () => {
    const stored = prepareContentForStorage('Voice — alive — pulsing.');
    expect(stored).not.toMatch(/[—–]/);
    expect(stored).toBe('Voice, alive, pulsing.');
  });

  it('formatSingleSectionDisplay sanitizes title_and_abstract body', () => {
    const body = '# Title\n\n## Abstrak\n\nOne — two — three.';
    const display = formatSingleSectionDisplay('title_and_abstract', body);
    expect(display).not.toMatch(/[—–]/);
    expect(display).toContain('One, two, three.');
  });
});

describe('664-map topic search', () => {
  it('lists five majors and searches by keyword', () => {
    const majors = listKnowledgeMajorNames();
    expect(majors.length).toBe(5);
    const { topics, total } = searchUniversityKnowledgeTopics({ q: 'oral', limit: 5 });
    expect(total).toBeGreaterThan(0);
    expect(topics.length).toBeLessThanOrEqual(5);
    expect(topics[0]?.topicId).toBeTruthy();
  });
});
