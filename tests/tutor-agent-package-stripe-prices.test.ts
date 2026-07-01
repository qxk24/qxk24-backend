/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Package Stripe Price Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  listMissingTutorAgentPackageStripePriceIds,
  tutorAgentWholesaleStripeEnvKey,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('tutor agent wholesale stripe env keys (school / university)', () => {
  it('maps school and university wholesale keys only', () => {
    expect(tutorAgentWholesaleStripeEnvKey('secondary')).toBe(
      'STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_SCHOOL',
    );
    expect(tutorAgentWholesaleStripeEnvKey('university')).toBe(
      'STRIPE_PRICE_ID_TUTOR_AGENT_WHOLESALE_UNIVERSITY',
    );
    expect(listMissingTutorAgentPackageStripePriceIds()).toHaveLength(2);
  });
});
