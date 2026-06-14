/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Level-7 QA Matrix Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Runs 7 question categories × Tahap Akal levels 1–7 (49 cases).
 * Validates turn routing, tier resolution, prompt blocks, and voice pipeline.
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import {
  isAdamConsumerPlainTurn,
  isAdamLightChatTurn,
  isAdamTeachingDepthTurn,
} from '../src/adam/adam-response-generation';
import { isAdamCurrentAffairsTurn } from '../src/adam/adam-web-search';
import { resolveStudentKnowledgeTier } from '../src/adam/adam-universal-scholar';
import { detectLanguage } from '../src/adam/adam-language-mirror.service';
import { ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT } from '../src/adam/adam-universal-scholar';
import {
  ADAM_LEVEL7_QA_MATRIX,
  ADAM_QA_CATEGORY_LABELS,
  matrixSummary,
  type AdamQaMatrixCell,
} from './fixtures/adam-level7-qa-matrix';
import {
  runStudentVoicePipeline,
  STUDENT_VOICE_INVARIANT_PATTERNS,
} from './helpers/adam-student-voice-pipeline';

function caseId(cell: AdamQaMatrixCell): string {
  return `${cell.category} · L${cell.level} ${cell.levelLabel}`;
}

describe('ADAM Level-7 QA matrix — structure', () => {
  it('defines 7 categories × 7 levels = 49 cases', () => {
    const summary = matrixSummary();
    expect(summary.categories).toBe(7);
    expect(summary.levels).toBe(7);
    expect(summary.totalCells).toBe(49);
    for (const label of Object.values(ADAM_QA_CATEGORY_LABELS)) {
      expect(label.length).toBeGreaterThan(3);
    }
    for (const id of Object.keys(ADAM_QA_CATEGORY_LABELS)) {
      expect(summary.byCategory[id as keyof typeof summary.byCategory]).toBe(7);
    }
  });
});

describe.each(ADAM_LEVEL7_QA_MATRIX)('Level-7 QA — $categoryLabel · Tahap $level ($levelLabel)', (cell) => {
  it(`${caseId(cell)} — turn classification`, () => {
    const light     = isAdamLightChatTurn(cell.userMessage);
    const plain     = isAdamConsumerPlainTurn(cell.userMessage);
    const teaching  = isAdamTeachingDepthTurn(cell.userMessage);
    const affairs   = isAdamCurrentAffairsTurn(cell.userMessage);

    if (cell.expectLight === true) {
      expect(light).toBe(true);
      return;
    }
    expect(light).toBe(false);

    if (cell.expectConsumerPlain === true) expect(plain).toBe(true);
    if (cell.expectTeaching === true) expect(teaching).toBe(true);
    if (cell.expectCurrentAffairs === true) expect(affairs).toBe(true);
    if (cell.expectSubstantive === true) expect(!light).toBe(true);

    if (cell.expectMalayLayout) {
      const locale = detectLanguage(cell.userMessage).detectedLocale;
      expect(['ms', 'mixed-ms-en']).toContain(locale);
    }
  });

  it(`${caseId(cell)} — knowledge tier`, () => {
    if (cell.expectedTier == null) return;
    const tier = resolveStudentKnowledgeTier(
      cell.userMessage,
      cell.priorUserMessages ?? [],
      cell.priorAssistantMessages ?? [],
    );
    expect(tier).toBe(cell.expectedTier);
  });

  it(`${caseId(cell)} — voice pipeline invariants`, async () => {
    const out = await runStudentVoicePipeline({
      userMessage:        cell.userMessage,
      recentUserMessages: cell.priorUserMessages ?? [],
      rawModelOutput:     cell.fixtureOutput,
    });
    expect(out.trim().length).toBeGreaterThan(10);
    expect(out).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.forbiddenPronoun);
    expect(out).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.frameworkLabel);
    expect(out).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.sunomNotation);
    if (cell.category !== 'tier_progression' || cell.level < 7) {
      expect(out).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.unsolicitedQuran);
    }
    if (cell.expectMalayLayout) {
      expect(out).not.toMatch(/^\s*[-•*]\s+/m);
      expect(out).not.toMatch(/^Pertama,/im);
    }
  });
});

describe('ADAM Level-7 QA matrix — prompt blocks', () => {
  it('BM factual turn injects Malay layout block', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      userMessage:          'Apakah ibu negara Malaysia?',
      studentKnowledgeTier: 1,
    });
    expect(prompt).toContain(ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT.slice(0, 40));
  });

  it('English factual turn omits Malay layout block', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      userMessage:          'What is the capital of France?',
      studentKnowledgeTier: 1,
    });
    expect(prompt).not.toContain('SUSUNAN OUTPUT (sama kemas seperti English)');
  });
});
