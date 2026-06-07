/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';

import {
  documentNeedsSectionMigration,
  JOURNAL_SECTION_SCHEMA_VERSION,
  LEGACY_V2_SECTION_KEY_MAP,
  remapApprovedSections,
  remapSectionRecord,
  recalculateV2TotalWords,
} from '../src/adam/journal/adam-journal-section-migrate.service';

describe('Journal section migration — Quran split', () => {
  it('detects legacy V2 keys', () => {
    expect(
      documentNeedsSectionMigration({
        sections: { movement_4_alamtologi_framework: 'text' },
      }),
    ).toBe(true);
    expect(
      documentNeedsSectionMigration({
        sectionSchemaVersion: JOURNAL_SECTION_SCHEMA_VERSION,
        sections: { movement_5_alamtologi_framework: 'text' },
      }),
    ).toBe(false);
  });

  it('remaps V2 section keys and preserves content', () => {
    const { sections, moves } = remapSectionRecord(
      {
        abstract:                        'Abstract here.',
        movement_4_alamtologi_framework:   'Framework body.',
        movement_5_application:          'Application body.',
        movement_6_invitation:             'Closing.',
      },
      LEGACY_V2_SECTION_KEY_MAP,
    );

    expect(moves).toEqual([
      'movement_4_alamtologi_framework → movement_5_alamtologi_framework',
      'movement_5_application → movement_6_application',
      'movement_6_invitation → movement_7_invitation',
    ]);
    expect(sections.movement_5_alamtologi_framework).toBe('Framework body.');
    expect(sections.movement_6_application).toBe('Application body.');
    expect(sections.movement_7_invitation).toBe('Closing.');
    expect(sections.movement_4_quran).toBeUndefined();
  });

  it('remaps approved section list without duplicates', () => {
    const approved = remapApprovedSections(
      ['abstract', 'movement_4_alamtologi_framework', 'movement_5_application'],
      LEGACY_V2_SECTION_KEY_MAP,
    );
    expect(approved).toEqual([
      'abstract',
      'movement_5_alamtologi_framework',
      'movement_6_application',
    ]);
  });

  it('recalculates total words from canonical keys', () => {
    const total = recalculateV2TotalWords({
      abstract: 'one two three four five',
      movement_4_quran: 'six seven eight nine ten',
    });
    expect(total).toBe(10);
  });
});
