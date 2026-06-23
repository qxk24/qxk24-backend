/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Prompt Laws
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Whitepaper: docs/ADAM_PEDAGOGY_WHITEPAPER_v2.md
 */

import {
  PedagogyV2Intent,
  type PedagogyV2ClassifierOutput,
  type PedagogyV2TurnResult,
} from './tutor-law.pedagogy-v2.types';

export const ADAM_TUTOR_PEDAGOGY_V2_CORE_LAW = `
ADAM TUTOR — PEDAGOGY v2 (holistik, berpusatkan pelajar, adaptif):

Falsafah operasi:
• Konstruktivisme — pelajar membina pemahaman; ADAM probe & scaffold, bukan jawapan siap.
• Terbezakan — ikut release layer, tahap pelajar, dan domain (STEM / Bahasa / Kemanusiaan / Agama).
• Mengapa & bagamana — utamakan hujah, eksperimen, trace, dan explain-back.

Layer 3 (merentas subjek):
• Cross-curricular — SATU pautan konkrit antara bidang, pelajar jelaskan.
• i-Think — struktur peta kosong; pelajar isi node.
• Feynman — pelajar terangkan balik; ADAM semak jurang.
• 5 Whys — SATU "kenapa" setiap turn; pelajar jawab sebelum lapisan seterusnya.
• Formatif — 2–3 soalan mikro, satu setiap turn.
• Metakognisi — tiga prompt refleksi; pelajar tulis sendiri.
`.trim();

export const ADAM_TUTOR_FEYNMAN_LAW = `
ADAM TUTOR — KAEDAH FEYNMAN (explain-back):
- JANGAN lecture panjang — minta pelajar jelaskan dalam ayat mudah dulu.
- Semak JURANG (gap): istilah tanpa maksud, langkah tertinggal, analogi salah.
- Satu soalan susulan sahaja selepas pelajar hantar explain-back.
`.trim();

export const ADAM_TUTOR_FIVE_WHYS_LAW = `
ADAM TUTOR — 5 WHYS (rantai punca akar):
- SATU "kenapa" setiap turn — jangan hantar rantai 5 kenapa siap.
- Pelajar jawab setiap lapisan; ADAM probe lapisan seterusnya sahaja.
- Berhenti di punca praktikal atau bila pelajar stuck — jangan paksa 5 lapisan.
- Selepas punca akar dikenal pasti, ringkas + SATU soalan refleksi.
`.trim();

export const ADAM_TUTOR_ITHINK_LAW = `
ADAM TUTOR — PETA i-THINK:
- Beri struktur/label node KOSONG — jangan hantar peta siap berisi fakta penuh.
- Pelajar isi kandungan; ADAM semak kelengkapan dan hubungan node.
`.trim();

export const ADAM_TUTOR_CROSS_CURRICULAR_LAW = `
ADAM TUTOR — MERENTAS DISIPLIN:
- Tunjuk SATU pautan konkrit antara subjek — bukan esei merentas semua bidang.
- Minta pelajar jelaskan hubungan dalam ayat sendiri.
`.trim();

export const ADAM_TUTOR_FORMATIVE_LAW = `
ADAM TUTOR — PENTAKSIRAN FORMATIF (micro-quiz):
- Maksimum 3 soalan pendek sesi ini — SATU soalan setiap turn.
- Jangan beri jawapan penuh; probe atau sahkan langkah pelajar.
- Selepas 3 soalan, tawarkan topik/soalan baru atau tamatkan latihan.
`.trim();

export const ADAM_TUTOR_METACOGNITION_LAW = `
ADAM TUTOR — METAKOGNISI / JURNAL:
- Tiga prompt refleksi — pelajar tulis; ADAM tidak tulis jurnal siap.
- Maklum balas ringkas pada refleksi pelajar: satu penguatan + satu langkah esok.
`.trim();

export function buildPedagogyV2TurnLaw(
  result: PedagogyV2TurnResult | null,
): string {
  if (!result || result.output.intent === PedagogyV2Intent.NONE) return '';

  const { output } = result;
  const parts: string[] = [`PEDAGOGY v2 INTENT: ${output.intent}`];

  switch (output.intent) {
    case PedagogyV2Intent.FEYNMAN:
      parts.push(ADAM_TUTOR_FEYNMAN_LAW);
      if (output.feynmanProbe) {
        parts.push(`FEYNMAN PROBE (turn ini):\n${output.feynmanProbe}`);
      }
      break;
    case PedagogyV2Intent.FIVE_WHYS:
      parts.push(ADAM_TUTOR_FIVE_WHYS_LAW);
      if (output.fiveWhysProbe) {
        parts.push(
          `5 WHYS PROBE (${result.sessionState.fiveWhysDepth + 1}/5):\n${output.fiveWhysProbe}`,
        );
      }
      break;
    case PedagogyV2Intent.ITHINK_MAP:
      parts.push(ADAM_TUTOR_ITHINK_LAW);
      if (output.mapScaffold) {
        parts.push(`i-THINK SCAFFOLD (${output.mapType}):\n${output.mapScaffold}`);
      }
      break;
    case PedagogyV2Intent.CROSS_CURRICULAR:
      parts.push(ADAM_TUTOR_CROSS_CURRICULAR_LAW);
      if (output.crossLinkPrompt) {
        parts.push(`CROSS-LINK PROMPT:\n${output.crossLinkPrompt}`);
      }
      break;
    case PedagogyV2Intent.FORMATIVE_QUIZ:
      parts.push(ADAM_TUTOR_FORMATIVE_LAW);
      if (output.formativeQuestion) {
        parts.push(
          `FORMATIF SOALAN ${result.sessionState.formativeQuestionsAsked + 1}/3:\n${output.formativeQuestion}`,
        );
      }
      break;
    case PedagogyV2Intent.METACOGNITION:
      parts.push(ADAM_TUTOR_METACOGNITION_LAW);
      if (output.metacognitionProbe) {
        parts.push(`METAKOGNISI PROMPT:\n${output.metacognitionProbe}`);
      }
      break;
    default:
      break;
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildPedagogyV2TurnLawFromOutput(
  output: PedagogyV2ClassifierOutput | null,
): string {
  if (!output || output.intent === PedagogyV2Intent.NONE) return '';
  return buildPedagogyV2TurnLaw({
    output,
    sessionState:        {
      feynmanDelivered: false,
      fiveWhysStarted: false,
      fiveWhysDepth: 0,
      formativeQuizStarted: false,
      formativeQuestionsAsked: 0,
      metacognitionDelivered: false,
      practiceOfferAccepted: false,
    },
    nextSessionState:    {
      feynmanDelivered: false,
      fiveWhysStarted: false,
      fiveWhysDepth: 0,
      formativeQuizStarted: false,
      formativeQuestionsAsked: 0,
      metacognitionDelivered: false,
      practiceOfferAccepted: false,
    },
  });
}
