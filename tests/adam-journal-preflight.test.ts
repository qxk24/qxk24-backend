/// <reference types="jest" />

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Preflight Tests
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
 * Run: npm test -- tests/adam-journal-preflight.test.ts
 */

import { describe, expect, it } from '@jest/globals';

import {
  countJournalWords,
  meetsJournalLengthMinimum,
  JOURNAL_TARGET_WORD_MIN,
} from '../src/adam/adam-journal.constants';
import {
  demoteProseLatexFormulas,
  prepareContentForStorage,
  renderFormulas,
} from '../src/adam/adam-journal-formula';
import { founderWantsJournalStop } from '../src/adam/adam-chat-response-parser';
import {
  getJournalContinuationConfig,
  shouldTriggerSectionContinuation,
} from '../src/adam/adam-journal-continuation.config';
import {
  assembleManuscriptFromSections,
  buildCompletedSectionsSummary,
} from '../src/adam/adam-journal-section-writer';
import { JOURNAL_SECTION_ORDER } from '../src/adam/adam-journal-section.types';
import {
  extractSectionBodyForSave,
  inferJournalSectionFromAdamResponse,
  inferJournalSectionIntent,
  INTERACTIVE_SAVEABLE_SECTIONS,
  resolveJournalSectionForTurn,
  resolveJournalTopicIdForDraft,
} from '../src/adam/adam-journal-section-detect';
import {
  selectFounderJournalProseSource,
  sectionModeSkipsSessionCorpus,
} from '../src/adam/adam-journal.service';

type JournalSectionId = (typeof JOURNAL_SECTION_ORDER)[number];

describe('Fix 1 — Accumulator word count', () => {
  it('sums all sections and gates at 4,000 words', () => {
    const sections: Partial<Record<JournalSectionId, string>> = {
      title_and_abstract:      'Abstract text here. '.repeat(30),
      movement_1_human_opening: 'Human opening paragraph. '.repeat(40),
      movement_2_achievement:   'Achievement section text. '.repeat(50),
      movement_3_honest_wall:   'Honest wall content. '.repeat(50),
      movement_4_alamtologi:    'Alamtologi framework. '.repeat(60),
      movement_5_application:   'Application technology. '.repeat(60),
      movement_6_invitation:    'Invitation closing. '.repeat(50),
      references:               'Author, A. (2024). '.repeat(30),
    };

    const manuscript = assembleManuscriptFromSections(sections);
    const totalWords = countJournalWords(manuscript);
    expect(totalWords).toBeGreaterThan(900);
    expect(totalWords).toBeLessThan(JOURNAL_TARGET_WORD_MIN);
    expect(meetsJournalLengthMinimum(manuscript)).toBe(false);

    sections.movement_4_alamtologi =
      (sections.movement_4_alamtologi ?? '') + 'Extended framework. '.repeat(2_500);

    const expanded = assembleManuscriptFromSections(sections);
    const totalWords2 = countJournalWords(expanded);
    expect(totalWords2).toBeGreaterThanOrEqual(JOURNAL_TARGET_WORD_MIN);
    expect(meetsJournalLengthMinimum(expanded)).toBe(true);
  });
});

describe('Fix 2 — Section-only save path', () => {
  it('uses section manuscript only and skips session corpus', () => {
    const sessionCorpus = [
      'Teaching session message 1',
      'Teaching session message 2',
      'Teaching session message 3',
    ].join('\n\n');

    const sectionManuscript = assembleManuscriptFromSections({
      movement_1_human_opening: '## Introduction\n\nReal journal content with conclusion and references.',
      references:               'Author (2024). Title. Journal.',
    });

    expect(sectionModeSkipsSessionCorpus(sectionManuscript)).toBe(true);

    const prose = selectFounderJournalProseSource({
      sectionManuscriptOnly:  sectionManuscript,
      sectionJournalComplete: true,
      fullResponse:           sectionManuscript,
      sessionCorpus,
    });

    expect(prose).toBe(sectionManuscript);
    expect(prose).not.toContain('Teaching session message');
  });

  it('falls back to session corpus only when not in section mode', () => {
    const sessionCorpus =
      '## Introduction\n\nSubstantive introduction with background methodology findings discussion conclusion and references. '
      + 'word '.repeat(500);

    const prose = selectFounderJournalProseSource({
      fullResponse:  'short reply',
      sessionCorpus,
    });

    expect(prose).toBe(sessionCorpus);
  });
});

describe('Fix 3 — No triple-write in section mode', () => {
  it('sets maxContinuations to 0 and blocks continuation', () => {
    const config = getJournalContinuationConfig({
      isFounder:              true,
      mode:                   'JOURNAL_GEN',
      journalWriteBySections: true,
    });

    expect(config.maxContinuations).toBe(0);
    expect(config.allowRetry).toBe(false);

    const shouldContinue = shouldTriggerSectionContinuation(
      { allSectionsComplete: false, totalWords: 3_500 },
      config,
    );
    expect(shouldContinue).toBe(false);
  });

  it('allows continuations in legacy single-stream mode', () => {
    const config = getJournalContinuationConfig({
      isFounder:              true,
      mode:                   'JOURNAL_GEN',
      journalWriteBySections: false,
    });

    expect(config.maxContinuations).toBe(4);
    expect(config.allowRetry).toBe(true);
  });
});

describe('Fix 4 — Stop command detection', () => {
  const stopPhrases = [
    'berhenti sekarang',
    'jangan sambung menulis',
    'stop writing',
    'stop now',
    'hentikan',
    'BERHENTI SEKARANG',
    'Jangan Sambung Menulis',
    'please berhenti sekarang',
  ];

  const nonStopPhrases = [
    'sambung menulis jurnal',
    'teruskan dengan movement 4',
    'continue writing',
    'tulis jurnal sekarang',
  ];

  it.each(stopPhrases)('detects stop: "%s"', (phrase) => {
    expect(founderWantsJournalStop(phrase)).toBe(true);
  });

  it.each(nonStopPhrases)('does not false-positive: "%s"', (phrase) => {
    expect(founderWantsJournalStop(phrase)).toBe(false);
  });
});

describe('Fix 5 — Formula storage round-trip', () => {
  const testContent = `
The harmony index formula is:


$$H = \\sum_{i=1}^{7} \\left( p_i \\times Q_i \\right)$$

Where the quality factor is $Q_i = \\frac{i}{7}$ for each level.

Einstein showed that $E = mc^2$ explains mass-energy equivalence.
`.trim();

  it('escapes raw $ delimiters and restores losslessly', () => {
    const escaped = prepareContentForStorage(testContent);

    expect(escaped.includes('$$')).toBe(false);
    expect(escaped.includes('[DISPLAY_FORMULA]')).toBe(true);
    expect(escaped.includes('[INLINE_FORMULA]')).toBe(true);

    const restored = renderFormulas(escaped);
    expect(restored.trim()).toBe(testContent);
  });

  it('preserves Arabic UTF-8 through storage', () => {
    const arabicContent = 'وَإِذْ قَالَ رَبُّكَ';
    const escapedArabic = prepareContentForStorage(arabicContent);
    const restoredArabic = renderFormulas(escapedArabic);
    expect(restoredArabic).toBe(arabicContent);
  });

  it('demotes prose statistics disguised as LaTeX', () => {
    const proseMath = '$\\text{Science understands} = 5\\%$';
    const demoted = demoteProseLatexFormulas(proseMath);
    expect(demoted).not.toContain('$');
    expect(demoted).toContain('Science understands');
    expect(demoted).toContain('5%');
  });

  it('demotes \\text{} prose display formulas to plain text', () => {
    const input =
      '$$\\text{Science understands} = 5\\% \\text{ of the universe}$$';
    const result = demoteProseLatexFormulas(input);
    expect(result).not.toContain('$$');
    expect(result).not.toContain('\\text');
    expect(result).toContain('5%');
    expect(result).toContain('Science understands');
  });

  it('demotes stored DISPLAY_FORMULA tags containing \\text{}', () => {
    const stored =
      '[DISPLAY_FORMULA]\\text{Science cannot explain} = 95\\% \\text{ of the universe}[/DISPLAY_FORMULA]';
    const demoted = demoteProseLatexFormulas(stored);
    expect(demoted).not.toContain('[DISPLAY_FORMULA]');
    expect(demoted).not.toContain('\\text');
    expect(demoted).toContain('95%');
  });
});

describe('Part 2 — Section continuity context', () => {
  it('buildCompletedSectionsSummary includes per-section previews', () => {
    const sections: Partial<Record<JournalSectionId, string>> = {
      movement_1_human_opening: 'Have you ever woken in the night and asked what flows inside you?',
      movement_2_achievement:   'Thermodynamics achieved measurable precision across centuries.',
    };

    const summary = buildCompletedSectionsSummary(sections);
    expect(summary).toContain('MOVEMENT_1_HUMAN_OPENING');
    expect(summary).toContain('MOVEMENT_2_ACHIEVEMENT');
    expect(summary).toContain('words');
    expect(summary).toContain('Have you ever woken');
  });
});

describe('Option A — Abstract as Section Zero (interactive draft save)', () => {
  const abstractAdamReply = `
Berdasarkan pengajaran sesi ini, topik yang paling tepat ialah Termodinamik — 3.1-thermodynamics.

Menulis sekarang...

# Entropy and the Constitutional Flow of Heat

Abstract

Thermodynamics governs every exchange of energy in the living world. From the warmth
of a hand to the fire of stars, heat moves according to laws that science has measured
with precision yet still struggles to place within the full picture of existence.
This manuscript examines how conventional knowledge honours those achievements while
honestly naming the wall where measurement alone cannot reach. Alamtologi offers a
constitutional reading that neither replaces nor diminishes the laboratory — it
extends the question toward meaning, responsibility, and the trust placed in every
transfer of energy between beings and systems.
`.trim();

  it('lists abstract as the first interactive saveable section', () => {
    expect(INTERACTIVE_SAVEABLE_SECTIONS[0]).toBe('title_and_abstract');
    expect(INTERACTIVE_SAVEABLE_SECTIONS).toHaveLength(8);
  });

  it('detects abstract from ADAM reply structure', () => {
    expect(inferJournalSectionFromAdamResponse(abstractAdamReply)).toBe('title_and_abstract');
  });

  it('detects movement 1 from founder turn intent', () => {
    expect(
      inferJournalSectionIntent('Abstrak diterima. Teruskan ke Movement 1. Tulis M1 sahaja.'),
    ).toBe('movement_1_human_opening');
  });

  it('prefers user section intent over ADAM structure', () => {
    expect(
      resolveJournalSectionForTurn(
        'Tulis M1 sahaja. Berhenti.',
        abstractAdamReply,
      ),
    ).toBe('movement_1_human_opening');
  });

  it('resolves topicId from ADAM transparency when journal context empty', () => {
    const topicId = resolveJournalTopicIdForDraft({
      userMessage: 'Teruskan ke Movement 1.',
      adamResponse:
        'Berdasarkan pengajaran sesi ini, topik yang paling tepat ialah Termodinamik — 3.1-thermodynamics.\n\nMovement 1\n\n' +
        'Have you ever felt the warmth of the sun on your skin? '.repeat(20),
    });
    expect(topicId).toBe('3.1-thermodynamics');
  });

  it('detects Movement 1 from ADAM reply without formal IMRaD heading', () => {
    const section = inferJournalSectionFromAdamResponse(
      'Movement 1\n\n' + 'The night air carries heat from every breath we take. '.repeat(15),
    );
    expect(section).toBe('movement_1_human_opening');
  });

  it('strips transparency preamble before storage', () => {
    const body = extractSectionBodyForSave(abstractAdamReply, 'title_and_abstract');
    expect(body).not.toContain('Berdasarkan pengajaran');
    expect(body).not.toContain('Menulis sekarang');
    expect(body).toMatch(/^#\s+Entropy/);
    expect(body).toContain('Abstract');
    expect(body.length).toBeGreaterThan(80);
  });
});
