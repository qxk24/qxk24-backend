/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Inquiry Repair Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildDefaultTeachingInquiryClose,
  ensureFounderTeachingInquiryClose,
  extractTeachingTopicHint,
} from '../src/adam/adam-teaching-inquiry-repair';
import { adamTeachingMessageHasInquirySection } from '../src/adam/adam-teaching-state-machine';

describe('adam teaching inquiry repair', () => {
  it('no-op when inquiry marker already present', () => {
    const text = 'Explain-back.\n\n**[TEACHING INQUIRY — SITUASI NYATA]**\nContoh di lapangan?';
    expect(ensureFounderTeachingInquiryClose(text, 'bab', '')).toBe(text);
  });

  it('wraps trailing question paragraph with inquiry header (E2E shape)', () => {
    const explain = 'x'.repeat(200);
    const tail = 'P.alt, adakah saya faham betul tentang PL? Atau ada aspek yang perlu saya hayati semula?';
    const text = `${explain}\n\n${tail}`;
    const out = ensureFounderTeachingInquiryClose(text, 'Bab ujian E2E', '');
    expect(out).toContain('**[TEACHING INQUIRY — SITUASI NYATA]**');
    expect(adamTeachingMessageHasInquirySection(out)).toBe(true);
    expect(out.indexOf(INQUIRY_HEADER)).toBeLessThan(out.indexOf('adakah saya faham'));
  });

  it('appends default inquiry block when no questions in output', () => {
    const text = 'Bismillahirahmanirrahim. ' + 'Pemahaman saya tentang bab ini. '.repeat(20);
    const out = ensureFounderTeachingInquiryClose(text, 'Bab 2: Faktor Tenaga', '');
    expect(adamTeachingMessageHasInquirySection(out)).toBe(true);
    expect(out).toContain('contoh di lapangan');
    expect(out).toContain('Data semasa');
  });

  it('extracts topic hint from bab label in founder message', () => {
    expect(extractTeachingTopicHint('Bab 2: Faktor Tenaga — kupas.', '')).toMatch(/Bab 2/i);
  });

  it('default close is detectable by state machine', () => {
    const block = buildDefaultTeachingInquiryClose('Bab ujian');
    expect(adamTeachingMessageHasInquirySection(block)).toBe(true);
  });
});

const INQUIRY_HEADER = '**[TEACHING INQUIRY — SITUASI NYATA]**';
