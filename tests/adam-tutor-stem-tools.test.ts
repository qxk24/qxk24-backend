/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor STEM Tool Links Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAcademicIntentTurnPromptParts,
  classifyAcademicTurnIntents,
} from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';
import {
  buildStemToolTurnLaw,
  isAllowedStemToolUrl,
  matchStemToolLink,
} from '../src/adam/tutor-law/tutor-law.stem-tool-links';
import { buildTutorLearningStyleLaw } from '../src/adam/tutor-law/tutor-law.profile';

describe('STEM tool links — Pedagogy v2.1 P2 (V-STEM)', () => {
  it('V-STEM-01: allowlist accepts PhET and GeoGebra', () => {
    expect(isAllowedStemToolUrl(
      'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html',
    )).toBe(true);
    expect(isAllowedStemToolUrl('https://www.geogebra.org/graphing')).toBe(true);
    expect(isAllowedStemToolUrl('https://evil.example/phishing')).toBe(false);
  });

  it('V-STEM-02: match parabola topic to PhET projectile', () => {
    const tool = matchStemToolLink('fungsi kuadratik parabola mercun');
    expect(tool?.label).toMatch(/Projectile/i);
    expect(tool?.url).toContain('phet.colorado.edu');
  });

  it('V-STEM-03: buildStemToolTurnLaw for visual profile', () => {
    const law = buildStemToolTurnLaw({
      userMessage: 'Macam mana plot graf fungsi linear?',
      profile:     { level: 'secondary', curriculum: 'national', learningStyle: 'visual' },
    });
    expect(law).toMatch(/STEM TOOL/i);
    expect(law).toMatch(/geogebra|desmos/i);
    expect(law).toMatch(/allowlist/i);
  });

  it('V-STEM-04: auditory profile skips STEM link', () => {
    const law = buildStemToolTurnLaw({
      userMessage: 'Macam mana plot graf fungsi linear?',
      profile:     { level: 'secondary', curriculum: 'national', learningStyle: 'auditory' },
    });
    expect(law).toBe('');
  });

  it('V-STEM-05: academic bundle includes STEM law for experiment', () => {
    const input = {
      userMessage: 'Bantu eksperimen litar seri — cuba simulasi.',
      profile:     {
        level:         'secondary' as const,
        curriculum:    'national' as const,
        learningStyle: 'kinesthetic' as const,
      },
    };
    const bundle = classifyAcademicTurnIntents(input);
    const parts = buildAcademicIntentTurnPromptParts(bundle, input);
    const joined = parts.join('\n');
    expect(joined).toMatch(/STEM TOOL|ALAT STEM/i);
  });
});

describe('VAK profile — Pedagogy v2.1 P1 (V-VAK)', () => {
  it('V-VAK-01: learning style law in profile block', () => {
    const law = buildTutorLearningStyleLaw({
      level:         'secondary',
      curriculum:    'national',
      learningStyle: 'visual',
    });
    expect(law).toMatch(/VAK hint/i);
    expect(law).toMatch(/visual/i);
    expect(law).toMatch(/zero-answer/i);
  });
});
