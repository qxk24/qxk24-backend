import { describe, expect, it } from '@jest/globals';
import {
  composeK24,
  composeSampleJiFromZa,
  countZaUnits,
  expectedZaCountAtLevel,
  getUnits,
  validateIntegrity,
  AMA_K24_ZA_COUNT_AT_MD,
} from '../../src/lib/ama/k24-level-orchestrator';

describe('k24-level-orchestrator', () => {
  it('expected za counts follow 6^n fractal', () => {
    expect(expectedZaCountAtLevel('za')).toBe(1);
    expect(expectedZaCountAtLevel('ji')).toBe(6);
    expect(expectedZaCountAtLevel('at')).toBe(36);
    expect(expectedZaCountAtLevel('md')).toBe(AMA_K24_ZA_COUNT_AT_MD);
  });

  it('composes ji from 6 za units without summarization', () => {
    const units = Array.from({ length: 6 }, (_, i) => ({
      id:      `hrv-${i}`,
      payload: { value: 55 + i, precision: true },
    }));
    const ji = composeSampleJiFromZa(units);
    expect(ji.level).toBe('ji');
    expect(validateIntegrity(ji)).toBe(true);
    expect(countZaUnits(ji)).toBe(6);
    const flat = getUnits(ji);
    expect(flat[3].payload.value).toBe(58);
  });

  it('rejects wrong child count at ji level', () => {
    const zaNodes = Array.from({ length: 5 }, (_, i) =>
      composeK24('za', [{ id: `z-${i}`, payload: {} }], `z-${i}`),
    );
    expect(() => composeK24('ji', zaNodes)).toThrow(/requires exactly 6/);
  });

  it('lazy getUnits caches flat za list', () => {
    const ji = composeSampleJiFromZa(
      Array.from({ length: 6 }, (_, i) => ({
        id:      `u-${i}`,
        payload: { n: i },
      })),
    );
    const a = getUnits(ji);
    const b = getUnits(ji);
    expect(a).toBe(b);
    expect(a.length).toBe(6);
  });
});
