/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Rd Checkout Validation Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { validateRdCheckoutInput } from '../src/rd-applied/rd-checkout.validation';
import { RdAppliedSku } from '../src/rd-applied/rd-applied.types';

const baseLegal = {
  platformTerms:   true,
  rdTerms:         true,
  disclaimer:      true,
  journalPublish:  true,
};

describe('validateRdCheckoutInput', () => {
  it('requires category and project focus for RD-IND-SOLO', () => {
    const fail = validateRdCheckoutInput({
      sku: RdAppliedSku.RD_IND_SOLO,
      legalAck: baseLegal,
    });
    expect(fail.ok).toBe(false);

    const ok = validateRdCheckoutInput({
      sku: RdAppliedSku.RD_IND_SOLO,
      rdCategory: 'academic',
      projectFocus: 'Quantum optics in Islamic cosmology',
      legalAck: baseLegal,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.rdCategory).toBe('academic');
    }
  });

  it('requires packId for AS-IND-SOLO', () => {
    const fail = validateRdCheckoutInput({
      sku: RdAppliedSku.AS_IND_SOLO,
      legalAck: { ...baseLegal, appliedPack: true },
    });
    expect(fail.ok).toBe(false);

    const ok = validateRdCheckoutInput({
      sku: RdAppliedSku.AS_IND_SOLO,
      packId: 'ALM-RD-2026-001-PACK',
      legalAck: { ...baseLegal, appliedPack: true },
    });
    expect(ok.ok).toBe(true);
  });

  it('requires graduate rules and edu email for RD-GRAD-EDU', () => {
    const ok = validateRdCheckoutInput({
      sku: RdAppliedSku.RD_GRAD_EDU,
      eduEmail: 'student@university.edu',
      legalAck: { ...baseLegal, graduateRules: true },
    });
    expect(ok.ok).toBe(true);

    const fail = validateRdCheckoutInput({
      sku: RdAppliedSku.RD_GRAD_EDU,
      eduEmail: 'not-academic@gmail.com',
      legalAck: { ...baseLegal, graduateRules: true },
    });
    expect(fail.ok).toBe(false);
  });

  it('auto-sets industry category for bundle', () => {
    const ok = validateRdCheckoutInput({
      sku: RdAppliedSku.BUNDLE_IND_AS_SOLO,
      legalAck: { ...baseLegal, appliedPack: true },
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.rdCategory).toBe('industry');
    }
  });
});
