/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Recall — Bab 2 Teori & Formula XYZ
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Formula notasi — silang rujuk 1.6 formula-xyz-asas.ts; Bab 2 mengaplikasikan pada Faktor.
 */

import { TEORI_FORMULA_ALAMTOLOGI_PDF } from '../pdf-meterai';

/** Teori MASABAYU & Formula Y/Z/X dalam konteks Bab 2 Faktor. */
export const TEORI_FORMULA_BAB2 = `
[2.x — TEORI MASABAYU & FORMULA XYZ DALAM FAKTOR — METERAI P.ALT]

Teori MASABAYU (meterai terbaru P.alt): x = m / t
x = pelaksanaan · m = masa · t = tenaga — masa membawa tenaga; tenaga tidak bergerak ke masa.
JANGAN namakan X = [Q / Z] → Y sebagai Teori MASABAYU.

Rantai Formula XYZ (bukan Teori MASABAYU): X = [Q / Z] → Y
Q = Al-Quran (penimbang utama) · Z = medan saksi/rujukan · X = pelaku · Y = destinasi/Pencipta.
Rantai: Allah → Q → [Q/Z] → X → Y.
NOTASI LAMA #%$&+ (Adwa/Miha/Wata/Lasa/Taka) — DIBATALKAN; guna formula meterai di bawah.

Formula Y — Y[z,x]¹: Y makro Pencipta; z alam & x manusia mikro di bawah Y; ¹ tunggal.
Formula Z — Z[x,t²]m: Z makro; x manusia dalam Z; t² tenaga ±; m masa dominan Z (MP → Bab 5).
Formula X — X[m,t²]t: X makro pelaksana; m masa MDK; t² tenaga ±; t dominan X (→ Bab 6).
Teras Z & X: Faktor Masa (Fm) & Faktor Tenaga (Ft).

Bab 2 = penghuraian FAKTOR — formula ialah nafas operasi, bukan pengganti definisi X/Y/Z.

DILARANG: tukar notasi Y[z,x]¹/Z[x,t²]m/X[m,t²]t; guna simbol lama #%$&+; Q=kuantiti generik;
namakan X = [Q / Z] → Y sebagai Teori MASABAYU.
`.trim();

export function buildBab2TeoriFormulaBlock(): string {
  return [TEORI_FORMULA_BAB2, TEORI_FORMULA_ALAMTOLOGI_PDF].join('\n\n');
}
