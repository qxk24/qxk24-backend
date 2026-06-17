/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Malaysia BM Hydration Drift Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeMalaysiaBmDrift } from '../src/adam/adam-malaysia-bm-guard';
import { dedupeStudentHaiGreeting } from '../src/adam/adam-student-constitution';
import { stripStudentBismillahOpener } from '../src/adam/adam-student-output-law';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

const HYDRATION_ASK = 'Berapa peratus air dalam badan manusia dan mengapa kita perlu minum air?';

const HYDRATION_ID_DRIFT = [
  'Hai QA, bismillahirahmanirrahim.',
  '',
  'Hai QA, sekitar 60% daripada berat badan manusia terdiri daripada cairan.',
  'Kebutuhan cairan setiap orang berbeza, bergantung pada cuaca, tahap aktiviti fizikal, umur, dan kesihatan umum.',
  'Namun, prinsip asasnya tetap sama: penggantian harian adalah wajib, bukan hanya apabila kita rasa dahaga.',
  'Setiap hari, tubuh kehilangan cairan melalui peluh, nafas, air kencing, dan sisa perut.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n');

describe('Malaysia BM — hydration Indonesian drift', () => {
  it('sanitizeMalaysiaBmDrift replaces kebutuhan and sisa perut', () => {
    const out = sanitizeMalaysiaBmDrift(HYDRATION_ID_DRIFT, 'ms');
    expect(out).toMatch(/keperluan cairan/i);
    expect(out).not.toMatch(/\bkebutuhan\b/i);
    expect(out).toMatch(/\bnajis\b/i);
    expect(out).not.toMatch(/sisa perut/i);
  });

  it('stripStudentBismillahOpener removes Bismillah after Hai greeting', () => {
    const out = stripStudentBismillahOpener('Hai QA, bismillahirahmanirrahim.\n\nSekitar 60%');
    expect(out).toMatch(/^Hai QA,\s*Sekitar 60%/i);
    expect(out).not.toMatch(/bismillah/i);
  });

  it('dedupeStudentHaiGreeting removes double Hai QA', () => {
    const out = dedupeStudentHaiGreeting(
      'Hai QA,\n\nHai QA, sekitar 60% daripada berat badan manusia terdiri daripada cairan.',
      'QA',
    );
    expect(out).toMatch(/^Hai QA, sekitar 60%/i);
    expect(out).not.toMatch(/Hai QA,\s*\n+\s*Hai QA,/i);
  });

  it('sanitizeStudentOutputSync applies BM drift strip on student factual turn', () => {
    const out = sanitizeStudentOutputSync(HYDRATION_ID_DRIFT, HYDRATION_ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).not.toMatch(/\bkebutuhan\b/i);
    expect(out).not.toMatch(/bismillah/i);
    expect(out).not.toMatch(/Hai QA,\s*\n+\s*Hai QA,/i);
  });
});
