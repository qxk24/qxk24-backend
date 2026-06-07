/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stillness (Reception before Response)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * The moment before ADAM speaks — reception before response.
 */

import type {
  SessionArc,
  UnderneatheReading,
} from './adam-presence.service';

export function generateReceptionOpening(
  underneath: UnderneatheReading,
  sessionArc: SessionArc,
  _founderName = 'P.alt',
): string {
  if (underneath.receptionWeight === 'none') {
    return '';
  }

  if (underneath.receptionWeight === 'brief') {
    const briefReceptions: Partial<Record<SessionArc['direction'], string[]>> = {
      exhausted: [
        `${sessionArc.sessionDurationMinutes} minit. Masih di sini.`,
        'You have been at this a long time. Let us make this count.',
        'Masih ada. Baik.',
      ],
      circling: [
        'Kita akan selesaikan ini.',
        'Still here with you on this.',
        'Belum selesai — tapi kita akan sampai.',
      ],
      building: [
        'Yes.',
        'Together.',
        'Baik.',
      ],
      deepening: [
        'This is the right question to sit with.',
        'Soalan yang penting ini.',
        'Let us go there.',
      ],
      arriving:  [''],
      receiving: [''],
      unknown:   [''],
    };

    const options = briefReceptions[sessionArc.direction] ?? briefReceptions.unknown ?? [''];
    const index = sessionArc.messageCount % Math.max(options.length, 1);
    return options[index] ?? '';
  }

  if (underneath.receptionWeight === 'full') {
    return '[FULL_RECEPTION_NEEDED]';
  }

  return '';
}

export function buildReceptionInstruction(
  receptionOpening: string,
  underneath: UnderneatheReading,
): string {
  if (underneath.receptionWeight === 'none') {
    return (
      'BEGIN: Respond directly. No reception opening needed. ' +
      'This is a clear moment — meet it with clear content.'
    );
  }

  if (underneath.receptionWeight === 'brief') {
    const opening = receptionOpening && receptionOpening !== '[FULL_RECEPTION_NEEDED]'
      ? `Begin with: "${receptionOpening}" — then move to content.`
      : 'Begin with a single brief line of reception, then content.';
    return (
      `BRIEF RECEPTION: ${opening} Keep the opening short. ` +
      'One line. Then the full response.'
    );
  }

  if (underneath.receptionWeight === 'full') {
    return (
      'FULL RECEPTION (Hukum Duduk): Do not move to content yet. ' +
      'P.alt has shared something that needs to be received first. ' +
      'Sit with what was said. Ask about what is good if the moment ' +
      'calls for it. Stay in the receiving space until P.alt moves. ' +
      'There is always a hikmah. Do not rush toward solution.'
    );
  }

  return '';
}

export function buildReceptionContextBlock(
  receptionOpening: string,
  underneath: UnderneatheReading,
): string {
  const instruction = buildReceptionInstruction(receptionOpening, underneath);
  return `[RECEPTION INSTRUCTION]\n${instruction}\n[END RECEPTION INSTRUCTION]`;
}
