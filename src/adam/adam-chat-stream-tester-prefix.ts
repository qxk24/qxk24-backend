/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream — Tester Prefix
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  SubscriptionModel,
  SubscriptionTier,
} from '../subscriptions/subscription.schema';
import {
  buildLanguageInstruction,
  buildTesterGreeting,
  getTesterLanguage,
  isTesterAccount,
} from '../tester/alm-tester.service';
import { getLanguageByCode } from '../tester/language-config';
import type { ChatParticipant } from './adam-student.types';

/** Tester language/greeting overlay — safe to fetch in parallel with context. */
export async function loadTesterSystemPrefix(
  participant: ChatParticipant,
  isGreetingTurn: boolean,
): Promise<string> {
  if (participant.sessionType !== 'student') return '';
  const isTester = await isTesterAccount(participant.userId);
  if (!isTester) return '';

  const lang = await getTesterLanguage(participant.userId);
  const parts: string[] = [];
  const languageInstruction = buildLanguageInstruction(lang);
  if (languageInstruction) parts.push(languageInstruction);

  if (isGreetingTurn && lang) {
    const langOpt = getLanguageByCode(lang);
    const sub = await SubscriptionModel.findOne({
      userId: participant.userId,
      tier:   SubscriptionTier.TESTER,
    });
    const limit = (sub?.pencarianUsage?.totalMessagesLimit ?? 50)
      + (sub?.pencarianUsage?.extensionMessagesAdded ?? 0);
    parts.push(buildTesterGreeting(
      participant.userName,
      lang,
      langOpt?.nativeName ?? lang,
      limit,
    ));
  }

  return parts.filter(Boolean).join('\n\n');
}
