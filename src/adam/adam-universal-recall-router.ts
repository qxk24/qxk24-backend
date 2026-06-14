/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Recall Router
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
 * Every substantive turn (not only bab/buku keywords) searches teaching
 * records and loads relevant Brain C episodes into context — one channel
 * for all questions, no per-topic hardcode.
 */

import { founderAsksPersonalBiography } from './adam-knowledge-prompts';
import { isAdamLightChatTurn } from './adam-response-generation';
import { buildUniversalTeachingRecallBlock } from '../qxk24brain/adam-teaching-record.service';
import { FOUNDER_USER_ID } from './adam-student.types';

export interface UniversalRecallRouterInput {
  message:              string;
  teachingAbsorption:   boolean;
  bookAwareRecallLoaded: boolean;
  isGuestTrial?:        boolean;
}

/** Gate universal recall — substantive turns outside Founder Teaching absorption. */
export function shouldRunUniversalTeachingRecall(input: UniversalRecallRouterInput): boolean {
  const {
    message,
    teachingAbsorption,
    bookAwareRecallLoaded,
    isGuestTrial = false,
  } = input;

  if (teachingAbsorption) return false;
  if (bookAwareRecallLoaded) return false;
  if (isGuestTrial) return false;

  const probe = message.trim();
  if (!probe || isAdamLightChatTurn(probe)) return false;
  if (founderAsksPersonalBiography(probe)) return false;

  return true;
}

/** Load teaching-record block for universal recall; null when no hits. */
export async function runUniversalTeachingRecall(
  userMessage: string,
  founderId = FOUNDER_USER_ID,
): Promise<string | null> {
  return buildUniversalTeachingRecallBlock(founderId, userMessage.trim());
}
