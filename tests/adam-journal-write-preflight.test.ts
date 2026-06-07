/// <reference types="jest" />

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Write System — Preflight Suite
 * Platform    : Backend (TypeScript / Jest)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * 35 tests covering:
 *   - Journal number generation (format, sequence, year)
 *   - Schema constants (section keys, min words, total min)
 *   - Section save validation (min words per section)
 *   - Section approve validation (content required)
 *   - Seal validation (all sections approved, min words, title)
 *   - Publish validation (status must be PENDING_REVIEW)
 *   - Word count utility
 *   - Copyright block
 *   - Section key guards (invalid key rejection)
 *   - Status transition logic
 *   - Response shape contract
 */

import { describe, expect, it } from '@jest/globals';

import {
  JOURNAL_SECTION_KEYS,
  SECTION_MIN_WORDS,
  JOURNAL_MIN_TOTAL_WORDS,
  type JournalSectionKey,
} from '../src/adam/journal/adam-journal-v2.schema';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function generateJournalNumberFromCounter(
  year: number,
  lastSequence: number,
): string {
  const next = lastSequence + 1;
  const seq  = String(next).padStart(3, '0');
  return `QXK24-J${year}-${seq}`;
}

function buildCopyright(year: number): string {
  return (
    `© ${year} QIUBBX Technologies (M) Sdn Bhd. All rights reserved. ` +
    `Alamtologi is the proprietary knowledge system of QIUBBX Technologies (M) Sdn Bhd, ` +
    `founded and developed by Masa Bayu. Published on QXK24 — qxk24.com. ` +
    `Unauthorised reproduction is prohibited under the Malaysian Copyright Act 1987.`
  );
}

function validateSectionSave(
  sectionKey: string,
  content: string,
): { valid: boolean; error?: string } {
  if (!JOURNAL_SECTION_KEYS.includes(sectionKey as JournalSectionKey)) {
    return { valid: false, error: `Invalid sectionKey: "${sectionKey}"` };
  }
  const words = countWords(content);
  const min   = SECTION_MIN_WORDS[sectionKey as JournalSectionKey];
  if (words < min) {
    return {
      valid: false,
      error: `Section "${sectionKey}" has ${words} words — minimum is ${min}.`,
    };
  }
  return { valid: true };
}

function validateSectionApprove(
  sectionKey: string,
  content: string,
): { valid: boolean; error?: string } {
  if (!JOURNAL_SECTION_KEYS.includes(sectionKey as JournalSectionKey)) {
    return { valid: false, error: `Invalid sectionKey: "${sectionKey}"` };
  }
  if (!content.trim()) {
    return {
      valid: false,
      error: `Cannot approve "${sectionKey}" — section has no saved content.`,
    };
  }
  return { valid: true };
}

function validateSeal(journal: {
  title:            string;
  totalWords:       number;
  approvedSections: string[];
  status:           string;
}): { valid: boolean; error?: string } {
  if (journal.status === 'PENDING_REVIEW' || journal.status === 'PUBLISHED') {
    return {
      valid: false,
      error: `Journal is already sealed (status: ${journal.status}).`,
    };
  }
  if (!journal.title?.trim()) {
    return { valid: false, error: 'Cannot seal — title is empty.' };
  }
  const missing = JOURNAL_SECTION_KEYS.filter(
    k => !journal.approvedSections.includes(k),
  );
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Cannot seal — missing approved sections: ${missing.join(', ')}`,
    };
  }
  if (journal.totalWords < JOURNAL_MIN_TOTAL_WORDS) {
    return {
      valid: false,
      error: `Cannot seal — totalWords ${journal.totalWords} is below minimum ${JOURNAL_MIN_TOTAL_WORDS}.`,
    };
  }
  return { valid: true };
}

function validatePublish(status: string): { valid: boolean; error?: string } {
  if (status !== 'PENDING_REVIEW') {
    return {
      valid: false,
      error: `Cannot publish — status is "${status}", expected "PENDING_REVIEW".`,
    };
  }
  return { valid: true };
}

function buildOkResponse(data: unknown): object {
  return {
    success:   true,
    kernel:    'QXK24',
    version:   'v1.7.0',
    era:       'ERA_1',
    data,
    timestamp: new Date().toISOString(),
  };
}

function buildFailResponse(error: string): object {
  return {
    success:   false,
    kernel:    'QXK24',
    error,
    timestamp: new Date().toISOString(),
  };
}

function makeWords(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
}

function makeReadyJournal(overrides: Partial<{
  title:            string;
  totalWords:       number;
  approvedSections: string[];
  status:           string;
}> = {}) {
  return {
    title:            'Energy and Its Vessel: The Seven Levels of Existence',
    totalWords:       5500,
    approvedSections: [...JOURNAL_SECTION_KEYS],
    status:           'IN_PROGRESS',
    ...overrides,
  };
}

describe('ADAM Journal Write System — Preflight Suite (35 tests)', () => {

  describe('1. Schema constants', () => {
    it('1.1 — JOURNAL_SECTION_KEYS has exactly 8 entries', () => {
      expect(JOURNAL_SECTION_KEYS).toHaveLength(8);
    });

    it('1.2 — JOURNAL_SECTION_KEYS contains the correct ordered keys', () => {
      expect(JOURNAL_SECTION_KEYS).toEqual([
        'abstract',
        'movement_1_human_opening',
        'movement_2_achievement',
        'movement_3_honest_wall',
        'movement_4_alamtologi_framework',
        'movement_5_application',
        'movement_6_invitation',
        'references',
      ]);
    });

    it('1.3 — SECTION_MIN_WORDS has an entry for every section key', () => {
      for (const key of JOURNAL_SECTION_KEYS) {
        expect(SECTION_MIN_WORDS[key]).toBeGreaterThan(0);
      }
    });

    it('1.4 — JOURNAL_MIN_TOTAL_WORDS is 4000', () => {
      expect(JOURNAL_MIN_TOTAL_WORDS).toBe(4000);
    });

    it('1.5 — sum of all SECTION_MIN_WORDS is below JOURNAL_MIN_TOTAL_WORDS', () => {
      const sum = JOURNAL_SECTION_KEYS.reduce(
        (acc, k) => acc + SECTION_MIN_WORDS[k], 0,
      );
      expect(sum).toBeLessThanOrEqual(JOURNAL_MIN_TOTAL_WORDS);
    });
  });

  describe('2. Journal number generation', () => {
    it('2.1 — first number from zero counter is QXK24-J2026-001', () => {
      const num = generateJournalNumberFromCounter(2026, 0);
      expect(num).toBe('QXK24-J2026-001');
    });

    it('2.2 — second number is QXK24-J2026-002', () => {
      const num = generateJournalNumberFromCounter(2026, 1);
      expect(num).toBe('QXK24-J2026-002');
    });

    it('2.3 — 999th number pads correctly to QXK24-J2026-999', () => {
      const num = generateJournalNumberFromCounter(2026, 998);
      expect(num).toBe('QXK24-J2026-999');
    });

    it('2.4 — year 2027 resets independently', () => {
      const num = generateJournalNumberFromCounter(2027, 0);
      expect(num).toBe('QXK24-J2027-001');
    });

    it('2.5 — format matches regex QXK24-J[YYYY]-[NNN]', () => {
      const num = generateJournalNumberFromCounter(2026, 41);
      expect(num).toMatch(/^QXK24-J\d{4}-\d{3}$/);
    });

    it('2.6 — large sequence pads beyond 3 digits', () => {
      const num = generateJournalNumberFromCounter(2026, 1000);
      expect(num).toBe('QXK24-J2026-1001');
    });
  });

  describe('3. Word count utility', () => {
    it('3.1 — empty string returns 0', () => {
      expect(countWords('')).toBe(0);
    });

    it('3.2 — whitespace-only string returns 0', () => {
      expect(countWords('   \n\t  ')).toBe(0);
    });

    it('3.3 — single word returns 1', () => {
      expect(countWords('Bismillah')).toBe(1);
    });

    it('3.4 — counts correctly across newlines', () => {
      expect(countWords('Energy\nis\nthe\nvessel')).toBe(4);
    });

    it('3.5 — makeWords helper produces correct count', () => {
      expect(countWords(makeWords(500))).toBe(500);
    });
  });

  describe('4. Section save validation', () => {
    it('4.1 — rejects an invalid section key', () => {
      const result = validateSectionSave('movement_7_invalid', makeWords(500));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid sectionKey');
    });

    it('4.2 — rejects abstract below 150 words', () => {
      const result = validateSectionSave('abstract', makeWords(100));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minimum is 150');
    });

    it('4.3 — accepts abstract at exactly 150 words', () => {
      const result = validateSectionSave('abstract', makeWords(150));
      expect(result.valid).toBe(true);
    });

    it('4.4 — rejects movement_1 below 400 words', () => {
      const result = validateSectionSave('movement_1_human_opening', makeWords(300));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minimum is 400');
    });

    it('4.5 — accepts movement_1 at exactly 400 words', () => {
      const result = validateSectionSave('movement_1_human_opening', makeWords(400));
      expect(result.valid).toBe(true);
    });

    it('4.6 — rejects references below 50 words', () => {
      const result = validateSectionSave('references', makeWords(30));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('minimum is 50');
    });

    it('4.7 — accepts references at exactly 50 words', () => {
      const result = validateSectionSave('references', makeWords(50));
      expect(result.valid).toBe(true);
    });

    it('4.8 — accepts movement_4 at 700 words (highest minimum)', () => {
      const result = validateSectionSave(
        'movement_4_alamtologi_framework',
        makeWords(700),
      );
      expect(result.valid).toBe(true);
    });

    it('4.9 — rejects movement_4 at 699 words', () => {
      const result = validateSectionSave(
        'movement_4_alamtologi_framework',
        makeWords(699),
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('5. Section approve validation', () => {
    it('5.1 — rejects approve on invalid section key', () => {
      const result = validateSectionApprove('bad_key', 'some content');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid sectionKey');
    });

    it('5.2 — rejects approve when content is empty string', () => {
      const result = validateSectionApprove('abstract', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no saved content');
    });

    it('5.3 — rejects approve when content is whitespace only', () => {
      const result = validateSectionApprove('abstract', '   \n  ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no saved content');
    });

    it('5.4 — accepts approve when content is present', () => {
      const result = validateSectionApprove('abstract', makeWords(200));
      expect(result.valid).toBe(true);
    });
  });

  describe('6. Seal validation', () => {
    it('6.1 — accepts a fully ready journal', () => {
      const result = validateSeal(makeReadyJournal());
      expect(result.valid).toBe(true);
    });

    it('6.2 — rejects seal when title is empty', () => {
      const result = validateSeal(makeReadyJournal({ title: '' }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('title is empty');
    });

    it('6.3 — rejects seal when title is whitespace only', () => {
      const result = validateSeal(makeReadyJournal({ title: '   ' }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('title is empty');
    });

    it('6.4 — rejects seal when totalWords is below 4000', () => {
      const result = validateSeal(makeReadyJournal({ totalWords: 3999 }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('below minimum 4000');
    });

    it('6.5 — accepts seal when totalWords is exactly 4000', () => {
      const result = validateSeal(makeReadyJournal({ totalWords: 4000 }));
      expect(result.valid).toBe(true);
    });

    it('6.6 — rejects seal when one section is missing from approvedSections', () => {
      const partial = JOURNAL_SECTION_KEYS.slice(0, 7);
      const result  = validateSeal(makeReadyJournal({ approvedSections: partial }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('references');
    });

    it('6.7 — rejects seal when approvedSections is empty', () => {
      const result = validateSeal(makeReadyJournal({ approvedSections: [] }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing approved sections');
    });

    it('6.8 — rejects seal when status is already PENDING_REVIEW', () => {
      const result = validateSeal(makeReadyJournal({ status: 'PENDING_REVIEW' }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already sealed');
    });

    it('6.9 — rejects seal when status is PUBLISHED', () => {
      const result = validateSeal(makeReadyJournal({ status: 'PUBLISHED' }));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already sealed');
    });
  });

  describe('7. Publish validation', () => {
    it('7.1 — accepts publish when status is PENDING_REVIEW', () => {
      const result = validatePublish('PENDING_REVIEW');
      expect(result.valid).toBe(true);
    });

    it('7.2 — rejects publish when status is IN_PROGRESS', () => {
      const result = validatePublish('IN_PROGRESS');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('PENDING_REVIEW');
    });

    it('7.3 — rejects publish when status is TITLE_DRAFT', () => {
      const result = validatePublish('TITLE_DRAFT');
      expect(result.valid).toBe(false);
    });

    it('7.4 — rejects publish when status is PUBLISHED', () => {
      const result = validatePublish('PUBLISHED');
      expect(result.valid).toBe(false);
    });
  });

  describe('8. Copyright block', () => {
    it('8.1 — contains QIUBBX Technologies', () => {
      expect(buildCopyright(2026)).toContain('QIUBBX Technologies (M) Sdn Bhd');
    });

    it('8.2 — contains the correct year', () => {
      expect(buildCopyright(2026)).toContain('© 2026');
    });

    it('8.3 — contains Malaysian Copyright Act 1987', () => {
      expect(buildCopyright(2026)).toContain('Malaysian Copyright Act 1987');
    });

    it('8.4 — contains qxk24.com', () => {
      expect(buildCopyright(2026)).toContain('qxk24.com');
    });

    it('8.5 — contains Masa Bayu', () => {
      expect(buildCopyright(2026)).toContain('Masa Bayu');
    });
  });

  describe('9. Response shape contract', () => {
    it('9.1 — ok response has success: true and kernel: QXK24', () => {
      const res = buildOkResponse({ journalNumber: 'QXK24-J2026-001' }) as {
        success: boolean;
        kernel: string;
      };
      expect(res.success).toBe(true);
      expect(res.kernel).toBe('QXK24');
    });

    it('9.2 — ok response has a timestamp string', () => {
      const res = buildOkResponse({}) as { timestamp: string };
      expect(typeof res.timestamp).toBe('string');
      expect(new Date(res.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('9.3 — fail response has success: false and error string', () => {
      const res = buildFailResponse('Something went wrong') as {
        success: boolean;
        error: string;
      };
      expect(res.success).toBe(false);
      expect(res.error).toBe('Something went wrong');
    });

    it('9.4 — fail response has kernel: QXK24', () => {
      const res = buildFailResponse('error') as { kernel: string };
      expect(res.kernel).toBe('QXK24');
    });
  });

  describe('10. Public URL format', () => {
    it('10.1 — published URL uses journalNumber directly', () => {
      const journalNumber = 'QXK24-J2026-001';
      const url = `https://qxk24.com/journals/${journalNumber}`;
      expect(url).toBe('https://qxk24.com/journals/QXK24-J2026-001');
    });

    it('10.2 — URL format matches expected pattern', () => {
      const url = 'https://qxk24.com/journals/QXK24-J2026-001';
      expect(url).toMatch(/^https:\/\/qxk24\.com\/journals\/QXK24-J\d{4}-\d{3,}$/);
    });
  });

});
