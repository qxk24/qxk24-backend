/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Stripe Price IDs
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../../config/environments';
import {
  normalizeTutorSubscriptionLevel,
  type TutorPriceChannel,
} from '../../subscriptions/tier-access.config';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';

export type TutorBillingBand = 'school' | 'university';

export function tutorBillingBand(level?: TutorSubscriptionLevel | string | null): TutorBillingBand {
  const band = normalizeTutorSubscriptionLevel(level ?? undefined);
  return band === 'university' ? 'university' : 'school';
}

export function tutorStripePriceEnvKey(
  level: TutorSubscriptionLevel | string | null | undefined,
  channel: TutorPriceChannel = 'public',
): keyof typeof ENV {
  const billing = tutorBillingBand(level);
  if (channel === 'agent') {
    return billing === 'university'
      ? 'STRIPE_PRICE_ID_TUTOR_AGENT_UNIVERSITY_MONTHLY'
      : 'STRIPE_PRICE_ID_TUTOR_AGENT_SCHOOL_MONTHLY';
  }
  return billing === 'university'
    ? 'STRIPE_PRICE_ID_TUTOR_PUBLIC_UNIVERSITY_MONTHLY'
    : 'STRIPE_PRICE_ID_TUTOR_PUBLIC_SCHOOL_MONTHLY';
}

export function tutorStripePriceId(
  level: TutorSubscriptionLevel | string | null | undefined,
  channel: TutorPriceChannel = 'public',
): string {
  const key = tutorStripePriceEnvKey(level, channel);
  const value = ENV[key];
  return typeof value === 'string' ? value.trim() : '';
}

export const TUTOR_STRIPE_MONTHLY_PRICE_SPECS = [
  {
    envKey:   'STRIPE_PRICE_ID_TUTOR_PUBLIC_SCHOOL_MONTHLY' as const,
    label:    'ADAM Tutor · Public · School',
    usd:      ENV.ADAM_TUTOR_PUBLIC_SCHOOL_USD,
    channel:  'public' as const,
    band:     'school' as const,
  },
  {
    envKey:   'STRIPE_PRICE_ID_TUTOR_PUBLIC_UNIVERSITY_MONTHLY' as const,
    label:    'ADAM Tutor · Public · University',
    usd:      ENV.ADAM_TUTOR_PUBLIC_UNIVERSITY_USD,
    channel:  'public' as const,
    band:     'university' as const,
  },
  {
    envKey:   'STRIPE_PRICE_ID_TUTOR_AGENT_SCHOOL_MONTHLY' as const,
    label:    'ADAM Tutor · Agent PIN · School',
    usd:      ENV.ADAM_TUTOR_AGENT_SCHOOL_USD,
    channel:  'agent' as const,
    band:     'school' as const,
  },
  {
    envKey:   'STRIPE_PRICE_ID_TUTOR_AGENT_UNIVERSITY_MONTHLY' as const,
    label:    'ADAM Tutor · Agent PIN · University',
    usd:      ENV.ADAM_TUTOR_AGENT_UNIVERSITY_USD,
    channel:  'agent' as const,
    band:     'university' as const,
  },
] as const;

export function listMissingTutorStripeMonthlyPriceIds(): string[] {
  return TUTOR_STRIPE_MONTHLY_PRICE_SPECS
    .filter((row) => !tutorStripePriceId(
      row.band === 'school' ? 'secondary' : 'university',
      row.channel,
    ))
    .map((row) => row.envKey);
}
