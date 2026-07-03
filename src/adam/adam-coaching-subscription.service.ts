/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Coaching Subscription Access
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { isQaUnlimitedAccount } from '../qa/qa-unlimited-account.service';
import { resolveSubscriptionAccess } from '../subscriptions/subscription-access.service';
import { isTutorQaBypassUser } from './adam-tutor-subscription.service';

export interface CoachingSubscriptionAccess {
  canChat:   boolean;
  active:    boolean;
  status:    string;
  freemium?: boolean;
  message?:  string;
  code?:     string;
}

export async function resolveCoachingSubscriptionAccess(
  userId: string,
): Promise<CoachingSubscriptionAccess> {
  if (isTutorQaBypassUser(userId) || await isQaUnlimitedAccount(userId)) {
    return {
      canChat:  true,
      active:   true,
      status:   'QA_BYPASS',
      freemium: false,
    };
  }

  if (ENV.ADAM_FREEMIUM_ENABLED) {
    const learnAccess = await resolveSubscriptionAccess(userId);
    if (learnAccess.canChat) {
      return {
        canChat:  true,
        active:   false,
        status:   learnAccess.status,
        freemium: true,
      };
    }
    return {
      canChat: false,
      active:  false,
      status:  learnAccess.status,
      code:    learnAccess.code,
      message: learnAccess.message,
    };
  }

  return {
    canChat:  true,
    active:   true,
    status:   'OPEN',
    freemium: false,
  };
}
