/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prose Craft Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamAnswerShape } from '../src/adam/adam-answer-shape';
import { resolveAdamAnswerPlan } from '../src/adam/adam-answer-plan';
import {
  isAdamProseCraftTurn,
  polishProseCraftOutput,
  isProseCraftSurfaceRepair,
  proseCraftBodyWasGutted,
  resolveProseCraftDisplayForSave,
} from '../src/adam/adam-prose-craft';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard.sanitize';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const REFLECTIVE_ASK =
  "Kembangkan ayat ini dengan lebih panjang: Apabila manusia telah lupa pada realiti maka pasti hidup mereka penuh dengan fantasi.";

describe('isAdamProseCraftTurn', () => {
  it('detects kembangkan ayat', () => {
    expect(isAdamProseCraftTurn(REFLECTIVE_ASK)).toBe(true);
  });

  it('detects susun ayat', () => {
    expect(isAdamProseCraftTurn('Susun ayat ini dengan lebih indah dan lembut.')).toBe(true);
  });

  it('excludes plain teaching ask without craft cue', () => {
    expect(isAdamProseCraftTurn('Apa itu kos peluang?')).toBe(false);
  });
});

describe('answer plan — prose craft', () => {
  it('routes to general relational not technical light', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: REFLECTIVE_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.usersMode).toBe('general');
    expect(plan.usersIntent).toBe('relational');
    expect(plan.answerShape?.intent).toBe('prose-craft');
    expect(plan.answerShape?.structured).toBe(false);
  });
});

describe('resolveAdamAnswerShape — prose-craft', () => {
  it('marks unstructured essay shape', () => {
    const shape = resolveAdamAnswerShape(REFLECTIVE_ASK);
    expect(shape.intent).toBe('prose-craft');
    expect(shape.structured).toBe(false);
  });
});

describe('polishProseCraftOutput', () => {
  it('strips Hai QA opener and asterisk emphasis', () => {
    const raw =
      "Hai QA, Apabila manusia telah lupa pada realiti, bukan sekadar lupa pada *rasa kehadiran* diri.";
    const out = polishProseCraftOutput(raw, REFLECTIVE_ASK);
    expect(out).toMatch(/^Apabila manusia telah lupa pada realiti/);
    expect(out).not.toMatch(/^Hai QA/i);
    expect(out).not.toMatch(/\*rasa kehadiran\*/);
    expect(out).toMatch(/rasa kehadiran/);
  });

  it('replaces em dash clause bridges with comma prose', () => {
    const raw =
      'Kaki kita masih menginjak bumi yang sama — bumi yang tidak pernah berubah loyaliti kepada realiti.';
    const out = polishProseCraftOutput(raw, REFLECTIVE_ASK);
    expect(out).not.toMatch(/—/);
    expect(out).toMatch(/bumi yang sama, bumi yang tidak pernah berubah/i);
  });

  it('does not collapse multi-paragraph essay when faith strip would gut body', () => {
    const raw = `Apabila manusia telah lupa pada realiti, ia kehilangan rasa kehadiran.

Allah tidak menurunkan Al-Quran kepada fantasi.

Fantasi tidak pernah membisik nama kita dengan sebenar.`;
    const out = polishProseCraftOutput(raw, REFLECTIVE_ASK);
    expect(countProseParagraphs(out)).toBe(3);
    expect(out).toMatch(/Fantasi tidak pernah membisik/i);
  });

  it('strips unsolicited ALLAH only when essay body stays intact', () => {
    const raw = `Apabila manusia telah lupa pada realiti, ia kehilangan rasa kehadiran.

Allah tidak menurunkan Al-Quran kepada fantasi.`;
    const out = polishProseCraftOutput(raw, REFLECTIVE_ASK);
    expect(out).toMatch(/Apabila manusia telah lupa pada realiti/);
    expect(out).toMatch(/Allah tidak menurunkan/i);
  });
});

function countProseParagraphs(text: string): number {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
}

describe('resolveProseCraftDisplayForSave', () => {
  it('keeps full streamed essay when repair gutted paragraphs', () => {
    const streamed = `Perenggan satu tentang realiti dan tanah.

Perenggan dua tentang Allah dan Quran yang tidak diminta.

Perenggan tiga tentang fantasi dan mimpi.`;
    const gutted = 'Perenggan tiga tentang fantasi dan mimpi.';
    const saved = resolveProseCraftDisplayForSave(streamed, gutted);
    expect(proseCraftBodyWasGutted(streamed, gutted)).toBe(true);
    expect(countProseParagraphs(saved)).toBe(3);
    expect(saved).toMatch(/Perenggan satu tentang realiti/i);
  });
});

describe('prose-craft sanitize pipeline', () => {
  it('does not fall back to gutted stream — keeps essay and applies polish', () => {
    const raw =
      "Hai QA, Apabila manusia telah lupa pada realiti, bukan sekadar kehilangan *fakta*.\n\nFantasi tidak pernah membisik nama kita dengan sebenar.";
    const out = sanitizeUsersOutputSync(raw, REFLECTIVE_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).not.toMatch(/^Hai QA/i);
    expect(out).not.toMatch(/\*fakta\*/);
    expect(out).toMatch(/Fantasi tidak pernah membisik/i);
    expect(isProseCraftSurfaceRepair(raw, out, REFLECTIVE_ASK)).toBe(true);
  });
});

describe('faith door — prose-craft ayat', () => {
  it('does not open faith door for kembangkan ayat ini', async () => {
    const { usersExplicitlyRequestsQuran } = await import('../src/adam/adam-users-prompts');
    expect(usersExplicitlyRequestsQuran(REFLECTIVE_ASK)).toBe(false);
    expect(usersExplicitlyRequestsQuran('Jelaskan ayat 2:255')).toBe(true);
  });
});

describe('ADAM_PROSE_CRAFT — gold voice meterai', () => {
  it('embeds Founder Qwen-style lyrical essay guidance', async () => {
    const { ADAM_PROSE_CRAFT_TURN, ADAM_PROSE_CRAFT_GOLD_VOICE } = await import('../src/adam/adam-prose-craft');
    expect(ADAM_PROSE_CRAFT_GOLD_VOICE).toMatch(/FALSAFAH HIDUP/i);
    expect(ADAM_PROSE_CRAFT_GOLD_VOICE).toMatch(/UNIVERSAL SCHOLAR/i);
    expect(ADAM_PROSE_CRAFT_GOLD_VOICE).toMatch(/METAFORA ALAM/i);
    expect(ADAM_PROSE_CRAFT_GOLD_VOICE).toMatch(/JANGAN buka dengan "Hai/i);
    expect(ADAM_PROSE_CRAFT_TURN).toMatch(/3–4 perenggan/i);
    expect(ADAM_PROSE_CRAFT_TURN).not.toMatch(/Elak metafora bertimbun/i);
  });
});
