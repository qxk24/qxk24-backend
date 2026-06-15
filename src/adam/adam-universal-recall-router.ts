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
 * Every substantive turn searches teaching records and loads Brain C
 * episodes — no per-topic hardcode. Fresh upload explain-back is
 * the only teaching turn that skips recall (source = file only).
 */

import { founderAsksPersonalBiography } from './adam-knowledge-prompts';
import { isAdamLightChatTurn } from './adam-response-generation';
import { buildUniversalTeachingRecallBlock } from '../qxk24brain/adam-teaching-record.service';
import { FOUNDER_USER_ID } from './adam-student.types';

export interface UniversalRecallRouterInput {
  message:               string;
  /** New file this turn — explain-back from [FOUNDER TEACHING DATA] only. */
  teachingFreshUpload:   boolean;
  bookAwareRecallLoaded: boolean;
  isGuestTrial?:         boolean;
}

/** Gate universal recall — substantive turns; skip fresh-upload explain-back only. */
export function shouldRunUniversalTeachingRecall(input: UniversalRecallRouterInput): boolean {
  const {
    message,
    teachingFreshUpload,
    bookAwareRecallLoaded,
    isGuestTrial = false,
  } = input;

  if (teachingFreshUpload) return false;
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

/** Whether context messages include indexed Brain C recall blocks this turn. */
export function detectContextRecallLoaded(
  messages: ReadonlyArray<{ content?: string }>,
): boolean {
  return messages.some((m) =>
    /\[(?:UNIVERSAL TEACHING RECALL|P\.ALT TEACHING RECORDS)/i.test(m.content ?? ''),
  );
}
