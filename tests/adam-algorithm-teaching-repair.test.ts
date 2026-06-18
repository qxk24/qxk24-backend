/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Algorithm Teaching Repair Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAlgorithmTeachingRepairApplied,
  repairAlgorithmTeachingOutput,
} from '../src/adam/adam-algorithm-teaching-repair';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const BUBBLE_SORT_ASK =
  'Bagaimana algoritma pengisihan gelembung (bubble sort) berfungsi? Apakah kerumitan masanya?';

const PRODUCTION_MEDIUM = `Hai QA, Algoritma pengisihan gelembung (bubble sort) berfungsi dengan cara membandingkan dua elemen berturut-turut dalam senarai, dan menukarkan kedudukannya jika susunannya salah, contohnya, apabila elemen kiri lebih besar daripada elemen kanan dalam susunan menaik. Proses ini diulang pada setiap pasangan bersebelahan dari hujung kiri ke kanan, sehingga elemen terbesar "naik ke atas" seperti gelembung, dan akhirnya berada di kedudukan paling kanan.

Setiap pusingan lengkap disebut satu *pass*, dan algoritma akan mengulang proses ini sehingga tiada lagi pertukaran berlaku, tanda bahawa senarai sudah tersusun sepenuhnya.

Kerumitan masa (time complexity) bubble sort adalah O(n²) dalam kes terburuk dan purata, iaitu apabila senarai berada dalam susunan songsang atau hampir songsang. Ini berlaku kerana ia melakukan hingga n−1 perbandingan pada pass pertama, n−2 pada pass kedua, dan seterusnya, jumlahnya menjadi n(n−1)/2, yang setara dengan O(n²).

Namun, dalam kes terbaik, apabila senarai sudah tersusun, kerumitan masanya adalah O(n), kerana hanya satu pass diperlukan untuk mengesahkan tiada pertukaran berlaku.

Bubble sort tidak digunakan dalam aplikasi praktikal berskala besar kerana ketidakcekapan relatifnya dibandingkan algoritma seperti quicksort atau mergesort. Tetapi ia sangat berguna sebagai alat pembelajaran: ia jelas, mudah difahami, dan menunjukkan prinsip asas pengisihan, iaitu bagaimana ketertiban muncul melalui perbandingan dan penyesuaian berulang antara elemen yang berdekatan.

Jika QA ingin, saya boleh tunjukkan contoh langkah demi langkah dengan senarai nombor konkrit, atau bincangkan kenapa ia tetap relevan dalam konteks pemikiran pedagogi, bukan sekadar sebagai kod, tetapi sebagai cermin proses belajar yang sabar dan berulang.`;

describe('repairAlgorithmTeachingOutput', () => {
  it('appends worked example, pseudocode, table, and Cadangan to production-medium answer', () => {
    const out = repairAlgorithmTeachingOutput(PRODUCTION_MEDIUM, BUBBLE_SORT_ASK);
    expect(out).not.toMatch(/Jika QA ingin/i);
    expect(out).toMatch(/\[5,\s*3,\s*8,\s*4,\s*2\]/);
    expect(out).toMatch(/```/);
    expect(out).toMatch(/\| Kes \|/);
    expect(out).toMatch(/Kerumitan ruang.*O\(1\)/i);
    expect(out).toMatch(/\*\*Cadangan:\*\*/);
    expect(isAlgorithmTeachingRepairApplied(PRODUCTION_MEDIUM, out, BUBBLE_SORT_ASK)).toBe(true);
  });

  it('sanitize pipeline applies algorithm repair on bubble sort turn', () => {
    const out = sanitizeUsersOutputSync(PRODUCTION_MEDIUM, BUBBLE_SORT_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/\[5,\s*3,\s*8,\s*4,\s*2\]/);
    expect(out).toMatch(/\*\*Cadangan:\*\*/);
    expect(out).not.toMatch(/Jika QA ingin/i);
  });
});
