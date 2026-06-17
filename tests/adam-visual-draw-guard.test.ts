/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Visual Draw Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { isAdamVisualDrawTurn } from '../src/adam/adam-response-generation';
import { resolveAdamKnowledgeMode } from '../src/adam/adam-knowledge-mode';
import {
  repairVisualDrawOutput,
  outputHasDrawnShapes,
  outputHasCircleDrawing,
  isVisualDrawCollapsedRepair,
} from '../src/adam/adam-visual-draw-guard';
import { stripConsumerMarkdownEmphasis } from '../src/adam/adam-student-output-law';
import {
  resolveStudentStreamSurface,
  sanitizeStudentOutputSync,
} from '../src/adam/adam-student-output-guard';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';

const DRAW_ASK =
  'Adam tidak lakar. Lukiskan bulatan dan segiempat. Apakah perbezaan antara keduanya?';

const DRAW_ESSAY_LEAK = [
  'bulatan dan segiempat adalah dua bentuk asas dalam geometri — tetapi perbezaannya bukan sekadar pada rupa luar, melainkan pada sifat dalaman masing-masing.',
  'Bulatan ialah satu set titik yang semua berjarak sama dari satu titik pusat. Ia tiada sudut, tiada tepi lurus, dan tiada permulaan atau akhir — ia lengkap, bersambung, dan simetri sempurna dalam semua arah.',
  'Dalam bahasa fizik, bulatan mewakili keseimbangan penuh: tiada tekanan lebih di mana-mana bahagian, tiada ketegangan pada sudut, kerana tenaga tersebar secara merata.',
  'Jadi, perbezaan utamanya bukan hanya “bulat vs tepi”, tetapi antara kelengkapan tanpa batas (bulatan) dan ketertiban melalui batas (segiempat). Keduanya benar.',
  'Keduanya saling melengkapi — seperti langit yang bulat dan bumi yang kita huni dengan ruang-ruang bersegi.',
  'Mahukah saya jelaskan lebih lanjut?',
].join('\n\n');

const PRODUCTION_GEOMETRY_LEAK = [
  'Hai QA, bulatan dan segiempat bukan sekadar dua bentuk yang kelihatan berbeza di atas kertas — keduanya adalah dua cara alam menyampaikan prinsip yang berbeza: satu tentang kesempurnaan tanpa permulaan atau akhir, satu lagi tentang keteguhan dalam batas yang jelas.',
  'Bulatan lahir dari satu titik pusat, dan setiap titik di lengkungannya berjarak sama — ia tidak mempunyai sudut, tidak ada tepi yang tajam, dan tidak ada arah “awal” atau “akhir”.',
  'Segiempat pula dibina dari empat garis lurus yang bertemu pada empat sudut tepat. Ia mempunyai permulaan dan akhir, batas yang nyata, dan ruang yang dapat diukur dengan tepat — panjang, lebar, luas.',
  'Perbezaan sebenarnya bukan pada bentuknya sahaja, tetapi pada cara ia berada dalam ruang dan masa: bulatan mengalir tanpa henti; segiempat berdiri dengan maksud. Keduanya benar.',
  'Keduanya diperlukan. Dan keduanya — seperti MASA dan TENAGA — saling menyempurnakan, bukan bertentangan.',
  'Adakah ada saat dalam hidup QA di mana kamu merasa seperti bulatan — tanpa batas, tanpa sempadan, hanya arus yang tenang?',
].join('\n\n');

describe('isAdamVisualDrawTurn', () => {
  it('detects lukiskan bulatan dan segiempat', () => {
    expect(isAdamVisualDrawTurn(DRAW_ASK)).toBe(true);
  });
});

describe('resolveAdamKnowledgeMode — visual draw', () => {
  it('routes draw turn to konvensional', () => {
    expect(resolveAdamKnowledgeMode({
      userMessage: DRAW_ASK,
      isFounder:   false,
    })).toBe('konvensional');
  });
});

describe('repairVisualDrawOutput', () => {
  it('injects tagged ASCII shapes and strips geometry poetry', () => {
    const out = repairVisualDrawOutput(DRAW_ESSAY_LEAK, DRAW_ASK, 'QA');
    expect(out).toMatch(/^Hai QA,\n\n/i);
    expect(outputHasDrawnShapes(out)).toBe(true);
    expect(outputHasCircleDrawing(out)).toBe(true);
    expect(out).toContain('<adam-visual-draw>');
    expect(out).toContain('</adam-visual-draw>');
    expect(out).toMatch(/Bulatan:/i);
    expect(out).toMatch(/Segiempat:/i);
    expect(out).toMatch(/sudut|sisi lurus/i);
    expect(out).not.toMatch(/\*\*/);
    expect(out).not.toMatch(/tenaga tersebar|langit yang bulat|bumi yang kita huni/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut|Mahukah saya jelaskan lebih lanjut/i);
  });

  it('draw inner block keeps multi-space circle lines', () => {
    const out = repairVisualDrawOutput(DRAW_ESSAY_LEAK, DRAW_ASK, 'QA');
    expect(out).toContain('  ..    ..');
    expect(out).toContain(' .        .');
  });

  it('collapses production MASA/TENAGA geometry essay to canonical draw', () => {
    const out = repairVisualDrawOutput(PRODUCTION_GEOMETRY_LEAK, DRAW_ASK, 'QA');
    expect(out).toMatch(/^Hai QA,/i);
    expect(outputHasDrawnShapes(out)).toBe(true);
    expect(out).not.toMatch(/MASA|TENAGA|Adakah ada saat dalam hidup/i);
    expect(out).toMatch(/sudut|sisi lurus/i);
  });

  it('sanitizeStudentOutputSync applies visual draw repair', () => {
    const out = sanitizeStudentOutputSync(
      DRAW_ESSAY_LEAK,
      DRAW_ASK,
      [],
      [],
      'QA',
      { enforceStudentGreeting: true },
    );
    expect(out).toMatch(/^Hai QA,/i);
    expect(outputHasDrawnShapes(out)).toBe(true);
    expect(out).not.toMatch(/tenaga tersebar|langit yang bulat/i);
  });
});

describe('visual draw stream replace', () => {
  it('isVisualDrawCollapsedRepair detects essay → ASCII collapse', () => {
    const repaired = repairVisualDrawOutput(PRODUCTION_GEOMETRY_LEAK, DRAW_ASK, 'QA');
    expect(isVisualDrawCollapsedRepair(PRODUCTION_GEOMETRY_LEAK, repaired, DRAW_ASK)).toBe(true);
  });

  it('resolveStudentStreamSurface prefers repaired draw over raw essay', () => {
    const repaired = repairVisualDrawOutput(PRODUCTION_GEOMETRY_LEAK, DRAW_ASK, 'QA');
    const resolved = resolveStudentStreamSurface(PRODUCTION_GEOMETRY_LEAK, repaired, {
      userMessage: DRAW_ASK,
    });
    expect(outputHasDrawnShapes(resolved.fullResponse)).toBe(true);
    expect(resolved.streamReplace).toBe(resolved.fullResponse);
    expect(resolved.fullResponse).not.toMatch(/MASA|TENAGA/i);
  });

  it('resolveAdamTurnDisplayForSave persists canonical draw over streamed essay', () => {
    const repaired = repairVisualDrawOutput(PRODUCTION_GEOMETRY_LEAK, DRAW_ASK, 'QA');
    const saved = resolveAdamTurnDisplayForSave(PRODUCTION_GEOMETRY_LEAK, repaired, {
      userMessage: DRAW_ASK,
      visualDrawRepair: true,
    });
    expect(outputHasDrawnShapes(saved)).toBe(true);
    expect(saved).not.toMatch(/MASA|TENAGA/i);
  });
});
