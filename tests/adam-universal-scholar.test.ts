/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Scholar Test
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
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  ADAM_UNIVERSAL_SCHOLAR_CHARTER,
  paragraphIsUniversalScholarDoorOffer,
  resolveStudentKnowledgeTier,
  userAcceptedUniversalScholarDoor,
  UNIVERSAL_SCHOLAR_DOOR_EN,
} from '../src/adam/adam-universal-scholar';

describe('ADAM Universal Scholar gold standard', () => {
  it('charter forbids doctrine push and mandates practical door', () => {
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Universal Scholar/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Do NOT represent Islam/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/ONE PRACTICAL CLOSING QUESTION/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toContain(UNIVERSAL_SCHOLAR_DOOR_EN);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/spiritual accountability/i);
  });

  it('detects practical tier-1 door offers', () => {
    expect(paragraphIsUniversalScholarDoorOffer(UNIVERSAL_SCHOLAR_DOOR_EN)).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(
      'Would you like more on skills and tools, a career path, or a real-world example?',
    )).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(
      'Adakah anda ingin melihat perspektif lain tentang ini?',
    )).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(
      'Jika QA ingin tahu dari sudut Alamtologi dan hikmah pelantikan.',
    )).toBe(false);
  });

  it('broad yes after door opens tier 2', () => {
    const adamDoor = `Prabowo is president.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`;
    expect(userAcceptedUniversalScholarDoor('Yes, tell me more', [adamDoor])).toBe(true);
    expect(userAcceptedUniversalScholarDoor('Ya, perspektif lain', [adamDoor])).toBe(true);
    expect(resolveStudentKnowledgeTier('Yes please', [], [adamDoor])).toBe(2);
    expect(resolveStudentKnowledgeTier('Who is president?', [], [adamDoor])).toBe(1);
  });

  it('student prompt includes universal scholar charter', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    expect(prompt).toMatch(/UNIVERSAL SCHOLAR — CONSUMER GOLD STANDARD/i);
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 1/);
    expect(prompt).not.toMatch(/ADAM_FOUNDER_NARRATIVE/);
  });

  it('tier 2 prompt includes brain C overlay', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 2,
    });
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 2/);
    expect(prompt).toMatch(/Brain C/i);
  });

  it('output guard keeps practical door paragraph', () => {
    const door = UNIVERSAL_SCHOLAR_DOOR_EN;
    const out = sanitizeStudentOutputSync(
      `The president is Prabowo Subianto.\n\n${door}`,
      'Who is president of Indonesia?',
    );
    expect(out).toMatch(/skills and tools/i);
  });
});
