/**
 * R&D Industry access — subscription category gates
 */

import { RdAppliedSku } from '../src/rd-applied/rd-applied.types';

describe('Industry SKU set', () => {
  it('includes solo, lab, and bundle SKUs', () => {
    expect(RdAppliedSku.RD_IND_SOLO).toBe('RD-IND-SOLO');
    expect(RdAppliedSku.BUNDLE_IND_AS_SOLO).toBe('BUNDLE-IND-AS-SOLO');
  });
});
