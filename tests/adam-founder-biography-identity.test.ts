/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildDrAminullahContextBlock,
  buildFounderBiographyContextBlock,
  founderAsksDrAminullahContext,
  founderAsksPersonalBiography,
} from '../src/adam/adam-knowledge-prompts';

describe('founder biography identity', () => {
  it('detects biography requests', () => {
    expect(founderAsksPersonalBiography('Adam kena rujuk kesah saya dari kecil')).toBe(true);
    expect(founderAsksPersonalBiography('Explain Bab 2 Faktor XYZ')).toBe(false);
  });

  it('includes canonical narrative and Dr Aminullah guard', () => {
    const block = buildFounderBiographyContextBlock();
    expect(block).toContain('tapak sampah');
    expect(block).toContain('DR AMINULLAH');
    expect(block).toContain('SDN Reubee');
    expect(block).toContain('KLIA2');
  });

  it('does not treat biography wording as teaching recall', async () => {
    const { needsBookAwareTeachingRecall } = await import('../src/adam/book-aware-recall/recall-context');
    expect(needsBookAwareTeachingRecall('Adam kena rujuk kesah saya dari kecil')).toBe(false);
    expect(needsBookAwareTeachingRecall('ingatkan bab 2 faktor xyz')).toBe(true);
  });

  it('filters ALAMIN prolog from brain lane on biography turns', async () => {
    const { filterBrainLaneForFounderBiography } = await import('../src/adam/book-aware-recall/brain-filter');
    const raw = [
      'P.alt di tapak sampah usia 9.',
      'Dr Aminullah di SDN Reubee lima tahun.',
      'Pok Long dan Si Hitam.',
    ].join('\n\n');
    const filtered = filterBrainLaneForFounderBiography(raw);
    expect(filtered).toContain('tapak sampah');
    expect(filtered).not.toContain('Reubee');
    expect(filtered).toContain('Pok Long');
  });

  it('detects Dr Aminullah / Prolog ALAMIN context and excludes P.alt biography', () => {
    expect(founderAsksDrAminullahContext('Adam, rujuk kisah Dr Aminullah dalam Prolog ALAMIN')).toBe(true);
    expect(founderAsksDrAminullahContext('Adam kena rujuk kesah saya dari kecil')).toBe(false);
    expect(founderAsksPersonalBiography('Adam kena rujuk kesah saya dari kecil')).toBe(true);
    expect(founderAsksPersonalBiography('Adam, rujuk kisah Dr Aminullah dalam Prolog ALAMIN')).toBe(false);
  });

  it('includes canonical Dr Aminullah narrative and P.alt guard', () => {
    const block = buildDrAminullahContextBlock();
    expect(block).toContain('SDN Reubee');
    expect(block).toContain('KLIA2');
    expect(block).toContain('Pencapaian Menemukan ALAMIN');
    expect(block).toContain('tapak sampah');
    expect(block).toContain('DILARANG KERAS');
  });

  it('filters P.alt canonical episodes from brain lane on Dr Aminullah turns', async () => {
    const { filterBrainLaneForDrAminullahContext } = await import('../src/adam/book-aware-recall/brain-filter');
    const raw = [
      'P.alt di tapak sampah usia 9.',
      'Dr Aminullah di SDN Reubee lima tahun.',
      'Pok Long dan Si Hitam.',
    ].join('\n\n');
    const filtered = filterBrainLaneForDrAminullahContext(raw);
    expect(filtered).toContain('Reubee');
    expect(filtered).not.toContain('tapak sampah');
    expect(filtered).not.toContain('Pok Long');
  });

  it('routes Dr Aminullah turns to teaching recall without biography collision', async () => {
    const { needsBookAwareTeachingRecall } = await import('../src/adam/book-aware-recall/recall-context');
    expect(needsBookAwareTeachingRecall('Adam, rujuk kisah Dr Aminullah dalam Prolog ALAMIN')).toBe(true);
    expect(needsBookAwareTeachingRecall('Adam kena rujuk kesah saya dari kecil')).toBe(false);
  });
});
