/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Explain Back Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
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
  ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD,
  ADAM_EXPLAIN_BACK_LAW,
} from '../src/adam/adam-student-explain-back-law';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { paragraphIsConstitutionalFrameworkLeak } from '../src/adam/adam-student-output-law';

describe('ADAM_EXPLAIN_BACK_LAW (universal)', () => {
  it('applies to Founder, students, guests — not Teaching learner only', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Founder \(P\.alt\), students, guests/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/NOT on Teaching-room learner/i);
  });

  it('requires explain-back outward, not P.alt copy-paste', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/outward/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Copy-paste/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/ilmu konvensional/i);
  });

  it('embeds pandangan + fakta, full flow, soul-touching close, ≥3 examples', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/A \+ B = C/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/PEDAGOGICAL SEQUENCE/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/PANDANGAN \+ FAKTA MENGIKAT/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/menguatkan hujah/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/pandangan kosong/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/menyentuh jiwa/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/BUKAN SINGKAT/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/PHASE 1A/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/PHASE 1B/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Lasswell/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Minimum THREE/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/MENYENTUH JIWA/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/PHASE 2/i);
  });

  it('embeds Founder three QA checks', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/P\.alt transcript/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/does not know "Alamtologi"/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/opinion-only/i);
  });

  it('references gold pattern komunikasi and ALAMIN', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Komunikasi/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/ALAMIN/i);
  });

  it('embeds Founder-sealed komunikasi gold shape — reference not copy-paste', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/never copy-paste verbatim/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/QA gold/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Lasswell/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Shannon/);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/felt understood without explaining/i);
  });

  it('states ADAM mission — return to Pencipta; Pencipta weave in 1B is intentional', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/MENGEMBALIKAN MANUSIA KEPADA PENCIPTA/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/not a secular textbook/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Gentle Pencipta/i);
  });

  it('embeds Founder-sealed ubi kentang gold shape', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Ubi kentang/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Solanum tuberosum/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/resistant starch/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/not grams of carbohydrate/i);
  });

  it('embeds Founder-sealed ALAMIN gold shape — disiplin baru, kehadiran', () => {
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/ALAMIN \(Founder-sealed/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/Sains Komunikasi Alamtologi/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/ruang kehadiran yang saling[\s\n]+mengenali/i);
    expect(ADAM_EXPLAIN_BACK_LAW).toMatch(/mendengar ceritanya/i);
  });
});

describe('student prompt assembly — pedagogy before constitutional hold', () => {
  it('orders Explain-Back Law before Teori MASABAYU and knowledge hold', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'QA',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    const explainIdx = prompt.indexOf('ADAM EXPLAIN-BACK LAW');
    const holdIdx = prompt.indexOf('ADAM CONSTITUTIONAL HOLD');
    const teoriIdx = prompt.indexOf('TEORI MASABAYU');
    expect(explainIdx).toBeGreaterThan(-1);
    expect(holdIdx).toBeGreaterThan(explainIdx);
    expect(teoriIdx).toBeGreaterThan(holdIdx);
    expect(prompt).toContain(ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD.slice(0, 40));
    expect(prompt).toMatch(/THREE TIERS OF KNOWLEDGE/);
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 1/);
  });
});

describe('paragraphIsConstitutionalFrameworkLeak — Tier 1 billboard', () => {
  it('flags Alamtologi lens openers', () => {
    expect(
      paragraphIsConstitutionalFrameworkLeak('Dari sudut Alamtologi, ubi kentang ialah RUANG.'),
    ).toBe(true);
    expect(
      paragraphIsConstitutionalFrameworkLeak('Dalam lensa Alamtologi komunikasi berlaku.'),
    ).toBe(true);
  });

  it('allows plain prose without framework billboard', () => {
    expect(
      paragraphIsConstitutionalFrameworkLeak(
        'Komunikasi juga hadir dalam senyap antara dua orang yang saling memahami.',
      ),
    ).toBe(false);
  });
});
