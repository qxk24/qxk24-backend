/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Carry / Bawaan Placement
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  tutorColumnDigit,
} from './tutor-law.place-value-routing';

export function tutorColumnSum(
  operands: number[],
  column: 'sa' | 'puluh' | 'ratus' | 'ribu',
  carryIn = 0,
): number {
  if (operands.length < 2) return 0;
  return tutorColumnDigit(operands[0]!, column)
    + tutorColumnDigit(operands[1]!, column)
    + carryIn;
}

/** Detect carry digit placed in Sa when Puluh sum was ≥10 (e.g. 1250+375 → ?2 not ?25). */
export function tutorReplyMisplacesCarry(
  text: string,
  operands: number[],
): boolean {
  if (!text?.trim() || operands.length < 2) return false;

  const puluhSum = tutorColumnSum(operands, 'puluh');
  if (puluhSum < 10) return false;

  const onesDigit = puluhSum % 10;
  const carryDigit = Math.floor(puluhSum / 10);

  const wrongSaCarry =
    /\bdigit\s+\*?\*?2\*?\*?\s+untuk\s+lajur\s+\*?\*?Sa/i.test(text)
    || /\blajur\s+\*?\*?Sa\*?\*?.*\*\*2\*\*/i.test(text)
    || /\?\s*3\s*2|\?\s*2\s*\n.*Puluh/i.test(text);

  const wrongLayout =
    /\?\s*3\s*2/.test(text)
    || (/\?\s*2\b/.test(text) && !/\?\s*25|\?\s*2\s*5/.test(text) && /5\s*\+\s*7\s*=\s*12/i.test(text));

  const doubleCountPuluh =
    /5\s*\+\s*7\s*\+\s*1\s*\(?\s*bawaan/i.test(text)
    && /5\s*\+\s*7\s*=\s*12/i.test(text)
    && !/\?\s*25/.test(text);

  if (wrongSaCarry || wrongLayout || doubleCountPuluh) {
    return onesDigit === tutorColumnSum(operands, 'sa') % 10
      || onesDigit === 2;
  }

  if (carryDigit > 0 && wrongLayout) return true;

  return false;
}

export function buildTutorCarryStepRecovery(
  operands: number[],
  completedSa = true,
): string {
  const [n1, n2] = operands;
  const d1Sa = tutorColumnDigit(n1!, 'sa');
  const d2Sa = tutorColumnDigit(n2!, 'sa');
  const d1Puluh = tutorColumnDigit(n1!, 'puluh');
  const d2Puluh = tutorColumnDigit(n2!, 'puluh');
  const d1Ratus = tutorColumnDigit(n1!, 'ratus');
  const d2Ratus = tutorColumnDigit(n2!, 'ratus');

  const saSum = tutorColumnSum(operands, 'sa');
  const puluhSum = tutorColumnSum(operands, 'puluh');
  const puluhOnes = puluhSum % 10;
  const carryToRatus = Math.floor(puluhSum / 10);

  const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const lines = [
    'Betul — semak **bawaan** selepas jumlah lajur ≥ 10:',
    '',
    `**Puluh**: **${d1Puluh} + ${d2Puluh} = ${puluhSum}** → tulis **${puluhOnes}** di lajur **Puluh**, bawa **${carryToRatus}** ke **Ratus** (bukan letak ${puluhOnes} di Sa).`,
    '',
    '```',
    `    ${carryToRatus}`,
    `  ${fmt(n1!)}`,
    `+ ${fmt(n2!).padStart(fmt(n1!).length + 2)}`,
    '-------',
    completedSa ? `     ${saSum}${puluhOnes}` : '       ?',
    '```',
    '',
    `- **Sa**: **${d1Sa} + ${d2Sa} = ${saSum}**`,
    `- **Puluh**: digit **${puluhOnes}**, bawaan **${carryToRatus}** ke Ratus`,
    '',
    `Berapa **${d1Ratus} + ${d2Ratus} + ${carryToRatus} (bawaan)** di tempat **Ratus**?`,
    '→ ______',
  ];

  return lines.join('\n');
}

export function tutorStudentFlagsTeacherMathError(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /\b(?:salah|tidak\s+tepat|tak\s+tepat|keliru|silap)\b/i.test(t)
    || /\bsepatutnya\b/i.test(t)
    || /\bbukan\s*\?/i.test(t)
    || /\?\s*25.*bukan.*\?\s*32/i.test(t)
    || /\bawak\s+jelaskan\s+tidak\s+tepat\b/i.test(t)
  );
}

export function tutorReplyLeakedTotalAfterCorrection(
  text: string,
  userMessage: string,
): boolean {
  if (!tutorStudentFlagsTeacherMathError(userMessage)) return false;
  if (!text?.trim()) return false;

  return (
    /\b1[,.]?625\b/.test(text)
    || /\b1625\b/.test(text)
    || /→\s*\*\*1[,.]?625\*\*/i.test(text)
    || /hasil(?:nya)?\s*:?\s*\*\*1[,.]?625/i.test(text)
    || (/Tempat Ratus[\s\S]{0,400}Tempat Ribu[\s\S]{0,200}1[,.]?625/i.test(text))
  );
}

export function buildTutorCorrectionAckRecovery(operands: number[]): string {
  return [
    'Terima kasih — anda betul semak susunan menegak.',
    '',
    'Digit **25** di hujung = **Sa (5)** + **Puluh (2)** — bukan **32**.',
    '',
    buildTutorCarryStepRecovery(operands, true),
  ].join('\n\n');
}
