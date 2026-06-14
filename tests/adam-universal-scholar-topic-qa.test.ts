/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Scholar Topic QA Test
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
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  ADAM_TOPIC_QA_SCENARIOS,
  formatTopicQaManualScript,
  topicQaScenarioCount,
} from './fixtures/adam-universal-scholar-topic-qa';
import { runStudentVoicePipeline } from './helpers/adam-student-voice-pipeline';

describe('ADAM Universal Scholar — multi-topic QA manifest', () => {
  it('defines eight cross-topic scenarios (one fresh chat each)', () => {
    expect(topicQaScenarioCount()).toBe(8);
    expect(ADAM_TOPIC_QA_SCENARIOS.every((s) => s.freshChat === true)).toBe(true);
    expect(formatTopicQaManualScript()).toMatch(/Multi-Topic Manual QA/);
  });
});

describe.each(
  ADAM_TOPIC_QA_SCENARIOS.flatMap((scenario) =>
    scenario.turns.map((turn, turnIndex) => ({
      scenario,
      turn,
      turnIndex,
      caseLabel: `${scenario.id} · turn ${turnIndex + 1}`,
    })),
  ),
)('Topic QA pipeline — $caseLabel', ({ scenario, turn, turnIndex }) => {
  it(`${scenario.label} — guard invariants`, async () => {
    if (!turn.bloatedFixture) return;
    const out = await runStudentVoicePipeline({
      userMessage:             turn.userMessage,
      recentUserMessages:      turn.priorUserMessages ?? [],
      recentAssistantMessages: turn.priorAssistantMessages ?? [],
      rawModelOutput:          turn.bloatedFixture,
    });
    expect(out.trim().length).toBeGreaterThan(20);
    for (const re of turn.mustMatch) {
      expect(out).toMatch(re);
    }
    for (const re of turn.mustNotMatch) {
      expect(out).not.toMatch(re);
    }
    if (turnIndex === 0 && /skills do I need|kemahiran apa|day to day/i.test(turn.userMessage)) {
      expect(out.split(/\n{2,}/).length).toBeLessThanOrEqual(4);
    }
  });
});
