/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Visual Draw Pipeline Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { ensureStudentHaiGreeting } from '../src/adam/adam-student-constitution';
import { buildFinalResponseForSave } from '../src/adam/adam-chat-stream-post-finalize';
import {
  ADAM_VISUAL_DRAW_TAG_OPEN,
  buildVisualDrawCanonicalAnswer,
  repairVisualDrawOutput,
} from '../src/adam/adam-visual-draw-guard';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

const DRAW_ASK =
  'Lukiskan bulatan dan segiempat. Apakah perbezaan antara keduanya?';

const MASHED_ESSAY =
  'Hai QA, ```text\nBulatan:.................... Segiempat: +----------+ | | | | +----------+\n```\nBulatan: semua titik...';

describe('visual draw pipeline — audited data path', () => {
  it('sanitizeStudentOutputSync early-returns canonical tagged draw', () => {
    const out = sanitizeStudentOutputSync(MASHED_ESSAY, DRAW_ASK, [], [], 'QA');
    expect(out).toMatch(/^Hai QA,\n\n/);
    expect(out).toContain(ADAM_VISUAL_DRAW_TAG_OPEN);
    expect(out).toContain('  ..    ..');
    expect(out).not.toContain('```');
    expect(out).not.toMatch(/Bulatan:\.{6,}/);
  });

  it('buildFinalResponseForSave does not inline-greet over draw tags', () => {
    const canonical = buildVisualDrawCanonicalAnswer(DRAW_ASK, 'QA');
    expect(canonical).toMatch(/^Hai QA,\n\n<adam-visual-draw>/);
    expect(canonical).toContain('  ..    ..');
    const saved = buildFinalResponseForSave({
      shell: {
        userMessage: DRAW_ASK,
        isFounder: false,
        participant: { userName: 'QA' },
      } as never,
      fullResponse: canonical,
      journal: {} as never,
      journalSealCleanResponse: canonical,
    });
    expect(saved).toContain(ADAM_VISUAL_DRAW_TAG_OPEN);
    expect(saved).not.toMatch(/^Hai QA, </);
    expect(saved).toContain('  ..    ..');
  });

  it('ensureStudentHaiGreeting must not mash tagged draw (regression)', () => {
    const canonical = repairVisualDrawOutput(MASHED_ESSAY, DRAW_ASK, 'QA');
    const broken = ensureStudentHaiGreeting(canonical, 'QA');
    expect(broken).not.toMatch(/Hai QA, <adam-visual-draw>/i);
    expect(broken.split('\n')[0]).toBe('Hai QA,');
  });
});
