/// <reference types="jest" />

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal MongoDB Integration Tests
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Live write path: saveJournalSectionProgress → adam_journals → read back.
 * Requires MongoDB (MONGODB_URI or mongodb://127.0.0.1:27017/qxk24_test).
 */

import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { ADAMJournalModel } from '../src/adam/adam.schema';
import {
  loadJournalSectionDraft,
  saveJournalSectionProgress,
} from '../src/adam/adam-journal-section-draft';
import { tryPersistInteractiveJournalSection } from '../src/adam/adam-journal-section-detect';
import { assembleManuscriptFromSections } from '../src/adam/adam-journal-section-writer';
import { countJournalWords } from '../src/adam/adam-journal.constants';
import { JOURNAL_SECTION_ORDER } from '../src/adam/adam-journal-section.types';
import type { JournalSectionId } from '../src/adam/adam-journal-section.types';
import { getTopicById } from '../src/adam/adam-journal-daily-segment';

const TEST_SESSION = 'test-session-integration-001';
const TEST_SESSION_ABSTRACT = 'test-session-abstract-only-002';
const TEST_TOPIC = '3.1-thermodynamics';
const TEST_URI =
  process.env.MONGODB_URI?.includes('_test')
    ? process.env.MONGODB_URI
    : 'mongodb://127.0.0.1:27017/qxk24_test';

function buildMockSections(): Partial<Record<JournalSectionId, string>> {
  const sections: Partial<Record<JournalSectionId, string>> = {};
  for (const id of JOURNAL_SECTION_ORDER) {
    sections[id] = `${id} substantive prose. `.repeat(120);
  }
  return sections;
}

describe('Live MongoDB journal draft write path', () => {
  let mongoAvailable = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 4_000 });
      mongoAvailable = true;
      await ADAMJournalModel.deleteMany({
        $or: [
          { sourceSessionId: TEST_SESSION },
          { sourceSessionId: TEST_SESSION_ABSTRACT },
        ],
        knowledgeTopicId: TEST_TOPIC,
      });
    } catch {
      mongoAvailable = false;
    }
  }, 15_000);

  afterAll(async () => {
    if (mongoAvailable) {
      await ADAMJournalModel.deleteMany({
        $or: [
          { sourceSessionId: TEST_SESSION },
          { sourceSessionId: TEST_SESSION_ABSTRACT },
        ],
        knowledgeTopicId: TEST_TOPIC,
      });
      await mongoose.disconnect();
    }
  });

  it('saves journal draft to adam_journals and reads it back', async () => {
    if (!mongoAvailable) {
      console.warn('[integration] MongoDB unavailable — skipping live write test');
      return;
    }

    const topic = getTopicById(TEST_TOPIC);
    expect(topic).not.toBeNull();

    const sections = buildMockSections();
    const manuscript = assembleManuscriptFromSections(sections);
    expect(countJournalWords(manuscript)).toBeGreaterThan(500);

    const saved = await saveJournalSectionProgress({
      sessionId: TEST_SESSION,
      topic:     topic!,
      sections,
      lastSection: 'references',
    });

    expect(saved.journalId).toBeTruthy();

    const found = await loadJournalSectionDraft(TEST_SESSION, TEST_TOPIC);
    expect(found).not.toBeNull();
    expect(found!.journalId).toBe(saved.journalId);
    expect(found!.sections.movement_1_human_opening?.length ?? 0).toBeGreaterThan(80);

    const doc = await ADAMJournalModel.findOne({
      sourceSessionId:  TEST_SESSION,
      knowledgeTopicId: TEST_TOPIC,
      status:           'DRAFT',
    }).lean();

    expect(doc).not.toBeNull();
    expect(ADAMJournalModel.collection.name).toBe('adam_journals');
    expect(doc!.status).toBe('DRAFT');
    expect(doc!.topicId).toBe(TEST_TOPIC);
    expect(doc!.sessionId).toBe(TEST_SESSION);
    expect(doc!.totalWords).toBeGreaterThan(0);
    expect(doc!.source).toBe('founder_teaching');
  }, 20_000);

  it('saves abstract-only interactive turn to adam_journals', async () => {
    if (!mongoAvailable) {
      console.warn('[integration] MongoDB unavailable — skipping abstract-only test');
      return;
    }

    const topic = getTopicById(TEST_TOPIC);
    expect(topic).not.toBeNull();

    const abstractReply = `
# Thermodynamics and Constitutional Energy

Abstract

${'Thermodynamic flow shapes every living exchange. '.repeat(20)}
`.trim();

    const saved = await tryPersistInteractiveJournalSection({
      sessionId:    TEST_SESSION_ABSTRACT,
      topic:        topic!,
      userMessage:  'Tulis abstrak sahaja. Berhenti.',
      adamResponse: abstractReply,
    });

    expect(saved).not.toBeNull();
    expect(saved!.lastSection).toBe('title_and_abstract');
    expect(saved!.sections.title_and_abstract?.length ?? 0).toBeGreaterThan(80);

    const found = await loadJournalSectionDraft(TEST_SESSION_ABSTRACT, TEST_TOPIC);
    expect(found?.sections.title_and_abstract).toContain('Thermodynamics');
    expect(found?.sections.movement_1_human_opening).toBeUndefined();
  }, 20_000);
});
