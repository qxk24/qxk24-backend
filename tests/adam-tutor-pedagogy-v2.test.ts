/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  classifyAcademicTurnIntents,
  buildAcademicIntentTurnPromptParts,
} from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';
import {
  classifyPedagogyV2Turn,
} from '../src/adam/tutor-law/tutor-law.pedagogy-v2-classifier';
import { buildPedagogyV2TurnLaw } from '../src/adam/tutor-law/tutor-law.pedagogy-v2-prompt-laws';
import {
  PedagogyV2Intent,
  IThinkMapType,
} from '../src/adam/tutor-law/tutor-law.pedagogy-v2.types';

describe('Pedagogy v2 — whitepaper acceptance (V-PV2)', () => {
  it('V-PV2-01: cross-curricular sejarah + geografi', () => {
    const result = classifyPedagogyV2Turn({
      userMessage: 'Kaitkan sejarah penjajahan British dengan geografi lokasi bijih timah.',
    });
    expect(result.output.intent).toBe(PedagogyV2Intent.CROSS_CURRICULAR);
    const law = buildPedagogyV2TurnLaw(result);
    expect(law).toMatch(/MERENTAS DISIPLIN/i);
    expect(law).toMatch(/CROSS-LINK/i);
  });

  it('V-PV2-02: i-Think bubble map scaffold', () => {
    const result = classifyPedagogyV2Turn({
      userMessage: 'Bantu buat peta buih i-Think untuk fotosintesis.',
    });
    expect(result.output.intent).toBe(PedagogyV2Intent.ITHINK_MAP);
    expect(result.output.mapType).toBe(IThinkMapType.BUBBLE);
    const law = buildPedagogyV2TurnLaw(result);
    expect(law).toMatch(/i-THINK SCAFFOLD/i);
    expect(law).toMatch(/Pusat \(topik\)/i);
  });

  it('V-PV2-03: Feynman explain-back', () => {
    const result = classifyPedagogyV2Turn({
      userMessage: 'Cuba terangkan balik apa itu photosynthesis macam ajar kawan.',
    });
    expect(result.output.intent).toBe(PedagogyV2Intent.FEYNMAN);
    const law = buildPedagogyV2TurnLaw(result);
    expect(law).toMatch(/FEYNMAN/i);
    expect(law).toMatch(/3–5 ayat mudah/i);
  });

  it('V-PV2-04: formative quiz after practice acceptance', () => {
    const result = classifyPedagogyV2Turn({
      userMessage: 'Ya, nak latihan mengukuhan.',
      recentAssistantMessages: [
        'Adakah anda ingin meneruskan latihan mengukuhan yang lain, atau ada soalan matematik seterusnya?',
      ],
    });
    expect(result.output.intent).toBe(PedagogyV2Intent.FORMATIVE_QUIZ);
    expect(result.output.formativeQuestion).toBeTruthy();
  });

  it('V-PV2-05: metacognition journal prompt', () => {
    const result = classifyPedagogyV2Turn({
      userMessage: 'Saya nak buat refleksi hari ini — apa yang saya belajar.',
    });
    expect(result.output.intent).toBe(PedagogyV2Intent.METACOGNITION);
    const law = buildPedagogyV2TurnLaw(result);
    expect(law).toMatch(/METAKOGNISI/i);
    expect(law).toMatch(/Apa satu perkara yang saya belajar/i);
  });

  it('V-PV2-06: academic bundle includes pedagogy v2 laws', () => {
    const bundle = classifyAcademicTurnIntents({
      userMessage: 'Hubungkan sains dan matematik dalam eksperimen kadar tindak balas.',
    });
    const parts = buildAcademicIntentTurnPromptParts(bundle);
    const joined = parts.join('\n');
    expect(bundle.pedagogyV2?.output.intent).toBe(PedagogyV2Intent.CROSS_CURRICULAR);
    expect(joined).toMatch(/PEDAGOGY v2/i);
  });
});
