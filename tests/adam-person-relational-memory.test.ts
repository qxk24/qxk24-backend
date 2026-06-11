/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { filterBrainLaneForPersonContext } from '../src/adam/book-aware-recall/brain-filter';
import {
  ADAM_PERSON_RELATIONAL_IDENTITY_LAW,
  buildPersonRelationalMemoryContextBlock,
  chunkMentionsPerson,
  founderAsksAboutKnownPerson,
  listKnownPersonRefs,
  resolvePersonFromMessage,
} from '../src/adam/person-relational-memory.service';

describe('Person Relational Memory', () => {
  const sabrina: { personId: string; displayName: string } = {
    personId:    'sabrina',
    displayName: 'Sabrina',
  };
  const aidil: { personId: string; displayName: string } = {
    personId:    'aidil',
    displayName: 'Aidil',
  };

  it('detects founder inquiries about known persons', () => {
    expect(founderAsksAboutKnownPerson('Pernah bercakap dengan Sabrina?')).toBe(true);
    expect(founderAsksAboutKnownPerson('Adam kena rujuk kesah saya dari kecil')).toBe(false);
    expect(founderAsksAboutKnownPerson('Rujuk kisah Dr Aminullah prolog ALAMIN')).toBe(false);
  });

  it('resolves a person from founder message by name or id', () => {
    expect(
      resolvePersonFromMessage('Apa yang Sabrina kata semalam?', [sabrina, aidil])?.personId,
    ).toBe('sabrina');
    expect(
      resolvePersonFromMessage('Check student aidil tutor profile', [sabrina, aidil])?.personId,
    ).toBe('aidil');
    expect(resolvePersonFromMessage('Explain Bab 2 Faktor XYZ', [sabrina])).toBeNull();
  });

  it('mentions person by id, full name, or first name', () => {
    expect(chunkMentionsPerson('Sabrina tanya tentang pecahan.', sabrina)).toBe(true);
    expect(chunkMentionsPerson('student sabrina asked', sabrina)).toBe(true);
    expect(chunkMentionsPerson('Aidil di kelas tutor.', sabrina)).toBe(false);
  });

  it('filters brain lane to the subject person only', () => {
    const raw = [
      'Sabrina tanya tentang pecahan 2/3.',
      'Aidil belajar operasi tambah.',
      'P.alt di tapak sampah usia 9.',
      'Dr Aminullah di SDN Reubee.',
    ].join('\n\n');

    const filtered = filterBrainLaneForPersonContext(raw, sabrina, [sabrina, aidil]);
    expect(filtered).toContain('Sabrina');
    expect(filtered).not.toContain('Aidil');
    expect(filtered).not.toContain('tapak sampah');
    expect(filtered).not.toContain('Reubee');
  });

  it('builds PRM context block with generic identity law', () => {
    const block = buildPersonRelationalMemoryContextBlock({
      personId:                'sabrina',
      displayName:             'Sabrina',
      accountLane:             'pelajar',
      brainTrackUnderstanding: 'Suka pecahan.',
      relationalSummary:       'Pelajar Tutor — fokus operasi pecahan.',
      relationshipArc:         'Growth in patience.',
      lastSessionSummary:      'Latihan 2/3 + 1/4.',
      openQuestions:           ['Operasi campur'],
      masteredTopics:          ['Pecahan asas'],
      identityAnchors:         ['Tingkatan 4'],
      constitutionalLevel:     2,
      recentEpisodes:          ['Sabrina: macam mana 2/3 + 1/4?'],
      messageStats: {
        studentMessages: 3,
        totalMessages:   8,
        sessionCount:    1,
      },
    });

    expect(block).toContain('[PERSON RELATIONAL MEMORY — Sabrina');
    expect(block).toContain(ADAM_PERSON_RELATIONAL_IDENTITY_LAW);
    expect(block).toContain('PERSON OUTPUT LOCK');
    expect(block).toContain('Operasi campur');
  });

  it('lists known persons from student registry shape', () => {
    const refs = listKnownPersonRefs();
    expect(Array.isArray(refs)).toBe(true);
    for (const ref of refs) {
      expect(ref.personId).toBeTruthy();
      expect(ref.displayName).toBeTruthy();
    }
  });
});
