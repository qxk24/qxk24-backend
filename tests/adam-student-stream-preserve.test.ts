/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Stream Preserve Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { preserveAlphaStatStreamBody } from '../src/adam/adam-alpha-output-guard';
import { compactAlphaStatVerifiedBody } from '../src/adam/adam-alpha-stat-compact';
import {
  resolveStudentStreamSurface,
  studentStreamBodyWasGutted,
} from '../src/adam/adam-student-output-guard';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';
import { KPTM_FULL_VOICE_REGRESSION_SAMPLE } from '../src/adam/adam-stat-stream-preserve';

const FULL = [
  'Jumlah pelajar KPTM di seluruh kampus adalah sekitar 14,000 orang mengikut sesi 2025/2026.',
  'Institusi ini menawarkan diploma dan sijil dalam kejuruteraan, perniagaan, dan IT.',
  'Adakah anda ingin saya bantu mencari maklumat spesifik seperti jumlah mengikut kampus?',
].join('\n\n');

const CLOSING_ONLY = FULL.split('\n\n').slice(-1)[0]!;

const KPTM_EVIDENCE = [{
  title: 'Sejarah KPTM',
  url:   'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
  snippet: 'lebih 18,000 orang pelajar | 62,000 graduan',
}];

describe('studentStreamBodyWasGutted', () => {
  it('detects when only the closing paragraph remains', () => {
    expect(studentStreamBodyWasGutted(FULL, CLOSING_ONLY)).toBe(true);
  });

  it('allows light meta strip that keeps all paragraphs', () => {
    const light = FULL.replace(/^Jumlah/, 'Angka jumlah');
    expect(studentStreamBodyWasGutted(FULL, light)).toBe(false);
  });
});

describe('resolveStudentStreamSurface', () => {
  it('keeps raw stream for stat turns when body was gutted', () => {
    const resolved = resolveStudentStreamSurface(FULL, CLOSING_ONLY, {
      preserveStreamBody: true,
    });
    expect(resolved.fullResponse).toBe(FULL);
    expect(resolved.streamReplace).toBeNull();
  });
});

describe('preserveAlphaStatStreamBody', () => {
  it('keeps full streamed essay — only adds opener and follow-up', () => {
    const body = [
      'KPTM, Institut Pengajian Tinggi Swasta Bumiputera terbesar di Malaysia, kini mempunyai lebih daripada 18,000 orang pelajar sepenuh masa di tujuh kampus: Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
      'Sehingga hari ini, KPTM telah menghasilkan seramai 62,000 orang graduan sejak penubuhannya secara rasmi pada tahun 2003.',
    ].join('\n\n');
    const out = preserveAlphaStatStreamBody(
      body,
      'Salam QA. Berapa ramai pelajar KPTM?',
      KPTM_EVIDENCE,
      '18,000 | 62,000 graduan',
      '18000',
    );
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).toMatch(/Alor Setar/);
    expect(out).toMatch(/62,000.*graduan/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
    expect(out.length).toBeGreaterThan(body.length);
  });
});

describe('resolveAdamTurnDisplayForSave', () => {
  it('persists streamed body when repair dropped paragraphs', () => {
    const saved = resolveAdamTurnDisplayForSave(FULL, CLOSING_ONLY);
    expect(saved).toBe(FULL);
  });

  it('keeps canonical KPTM full-voice essay when sanitize would gut body', () => {
    const shortSanitized = 'KPTM: 18,000 (verified via web search, kptm.edu.my).';
    expect(resolveAdamTurnDisplayForSave(KPTM_FULL_VOICE_REGRESSION_SAMPLE, shortSanitized))
      .toBe(KPTM_FULL_VOICE_REGRESSION_SAMPLE);
    expect(KPTM_FULL_VOICE_REGRESSION_SAMPLE).toMatch(/18,000.*pelajar/i);
    expect(KPTM_FULL_VOICE_REGRESSION_SAMPLE).toMatch(/62,000.*graduan/i);
    expect(KPTM_FULL_VOICE_REGRESSION_SAMPLE).toMatch(/MASA yang sedang bergerak/i);
    expect(KPTM_FULL_VOICE_REGRESSION_SAMPLE).toMatch(/menyusun surat rasmi kepada KPTM/i);
  });

  it('honours forceReplace for current-affairs repair', () => {
    const bad = `${'Bismillah. Jokowi masih presiden. '.repeat(12)}Prabowo dilantik.`;
    const good = 'Presiden Republik Indonesia saat ini ialah Ir. H. Prabowo Subianto, dilantik 20 Oktober 2024.';
    expect(resolveAdamTurnDisplayForSave(bad, good, { forceReplace: true })).toBe(good);
  });
});

describe('compactAlphaStatVerifiedBody (deprecated — not used at runtime)', () => {
  it('still compacts in isolation for legacy tests only', () => {
    const messy = [
      'KPTM: 18,000 (verified via web search, kptm.edu.my).',
      'KPTM mempunyai lebih 18,000 orang pelajar di tujuh kampus.',
      'Angka ini bukan sekadar statistik, ia adalah wujudnya MASA yang hidup.',
    ].join('\n\n');
    const repaired = compactAlphaStatVerifiedBody(
      messy,
      'Berapa jumlah pelajar KPTM?',
      KPTM_EVIDENCE,
      '18,000 | Sejarah KPTM',
    );
    expect(repaired.length).toBeLessThan(messy.length);
  });
});
