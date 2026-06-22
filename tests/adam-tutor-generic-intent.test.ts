/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildGenericClassifierInput,
  classifyGenericIntent,
} from '../src/adam/tutor-law/tutor-law.generic-intent-classifier';
import {
  GenericDomain,
  GenericIntent,
} from '../src/adam/tutor-law/tutor-law.generic-intent.types';

describe('classifyGenericIntent (Rule 61)', () => {
  it('V-GN-01: G_FACT — siapa tokoh sejarah', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'Siapa tokoh yang menandatangani Perjanjian 1957?',
    }));
    expect(out.intent).toBe(GenericIntent.G_FACT);
    expect(out.domain).toBe(GenericDomain.SEJARAH);
    expect(out.significanceQuestion).toBeTruthy();
  });

  it('V-GN-02: G_ANALYSIS beats G_FACT when analysis signals present', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'Bincangkan faktor kemerdekaan Tanah Melayu dan kesan terhadap masyarakat.',
    }));
    expect(out.intent).toBe(GenericIntent.G_ANALYSIS);
    expect(out.argumentProbe).toBeTruthy();
  });

  it('V-GN-03: EXAM_DIRECT — tolong jawab soalan peperiksaan', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'Tolong jawab soalan peperiksaan sejarah ini.',
    }));
    expect(out.intent).toBe(GenericIntent.EXAM_DIRECT);
    expect(out.redirectScript).toContain('peperiksaan');
  });

  it('V-GN-04: G_REVIEW — semak kerja', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'Boleh semak jawapan saya untuk soalan sivik ni?',
    }));
    expect(out.intent).toBe(GenericIntent.G_REVIEW);
    expect(out.reviewAnchor).toBeTruthy();
    expect(out.domain).toBe(GenericDomain.SIVIK);
  });

  it('V-GN-05: G_CONCEPT — apa maksud sivik', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'Apa maksud hak asasi manusia dalam kewarganegaraan?',
    }));
    expect(out.intent).toBe(GenericIntent.G_CONCEPT);
    expect(out.domain).toBe(GenericDomain.SIVIK);
  });

  it('V-GN-06: AMBIGUOUS — vague greeting', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'hello',
    }));
    expect(out.intent).toBe(GenericIntent.AMBIGUOUS);
    expect(out.probeQuestion).toBeTruthy();
  });

  it('V-GN-07: analysis before fact when only kenapa present', () => {
    const out = classifyGenericIntent(buildGenericClassifierInput({
      userMessage: 'Kenapa inflasi meningkat tahun lepas?',
    }));
    expect(out.intent).toBe(GenericIntent.G_ANALYSIS);
    expect(out.domain).toBe(GenericDomain.EKONOMI);
  });
});
