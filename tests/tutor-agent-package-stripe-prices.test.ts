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
  tutorAgentPackageStripeEnvKey,
} from '../src/adam/tutor/adam-tutor-agent-package.config';

describe('tutor agent package stripe env keys (band-independent)', () => {
  it('maps 4 tier keys', () => {
    expect(tutorAgentPackageStripeEnvKey('silver')).toBe(
      'STRIPE_PRICE_ID_TUTOR_EJEN_SILVER',
    );
    expect(tutorAgentPackageStripeEnvKey('platinum')).toBe(
      'STRIPE_PRICE_ID_TUTOR_EJEN_PLATINUM',
    );
    expect(listMissingTutorAgentPackageStripePriceIds()).toHaveLength(4);
  });
});
