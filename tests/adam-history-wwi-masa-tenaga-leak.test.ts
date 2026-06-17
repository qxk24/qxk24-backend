/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM History WWI MASA/TENAGA Leak Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { isAdamHistorySynthesisTurn } from '../src/adam/adam-response-generation';
import { paragraphIsConstitutionalFrameworkLeak } from '../src/adam/adam-student-output-law';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

const WWI_ASK = 'Kenapa Perang Dunia Pertama tercetus?';

const MASA_LEAK_PARA =
  'Semua faktor ini tidak berdiri berasingan. Mereka saling menyambung, seperti MASA yang bergerak dari satu keadaan ke keadaan lain, membawa TENAGA yang telah terkumpul, hingga mencapai titik pecah.';

const WWI_SAMPLE = [
  'Hai QA, Perang Dunia Pertama tercetus pada tahun 1914, bukan kerana satu sebab tunggal, tetapi akibat pertemuan beberapa faktor.',
  'Nasionalisme menjadi bahan api utama di Balkan, termasuk pembunuhan Archduke Franz Ferdinand pada 28 Jun 1914 di Sarajevo.',
  'Sistem sekutu Triple Entente dan Triple Alliance menjadikan konflik tempatan berkembang menjadi perang Eropah.',
  MASA_LEAK_PARA,
  'Tiada satu negara yang ingin perang secara sengaja, tetapi sistem dan keputusan akhirnya membawa kepada hasil yang dahsyat.',
  'Adakah anda ingin saya jelaskan lebih lanjut tentang kesan perang ini, atau bagaimana Tanah Melayu terlibat?',
].join('\n\n');

describe('history WWI — no MASA/TENAGA framework weave', () => {
  it('detects WWI ask as history synthesis turn', () => {
    expect(isAdamHistorySynthesisTurn(WWI_ASK)).toBe(true);
  });

  it('detects poetic MASA/TENAGA paragraph as constitutional leak', () => {
    expect(paragraphIsConstitutionalFrameworkLeak(MASA_LEAK_PARA)).toBe(true);
  });

  it('sanitizeStudentOutputSync removes MASA/TENAGA weave but keeps history facts', () => {
    const out = sanitizeStudentOutputSync(WWI_SAMPLE, WWI_ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).toMatch(/1914|Sarajevo|Archduke/i);
    expect(out).not.toMatch(/\bMASA\b.*\bTENAGA\b|\bTENAGA\b.*\bMASA\b/is);
    expect(out).not.toMatch(/seperti\s+MASA\s+yang\s+bergerak/i);
    expect(out).toMatch(/jelaskan lebih lanjut|kesan perang/i);
  });

  it('keeps weapons fact when MASA weave is in the same paragraph', () => {
    const mixed = [
      'Senjata moden seperti meriam berat menjadikan peperangan ini lebih mematikan daripada mana-mana konflik sebelumnya.',
      'Semua faktor ini saling menyambung, seperti MASA yang bergerak dari satu keadaan ke keadaan lain, membawa TENAGA yang telah terkumpul, hingga mencapai titik pecah.',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(mixed, WWI_ASK, [], [], 'QA');
    expect(out).toMatch(/meriam berat/i);
    expect(out).not.toMatch(/seperti\s+MASA/i);
    expect(out).not.toMatch(/\bTENAGA\b/);
  });
});
