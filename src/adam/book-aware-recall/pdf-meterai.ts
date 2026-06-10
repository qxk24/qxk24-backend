/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — PDF Meterai (ALAMTOLOGI.pdf)
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
 * Sumber: /Users/masabayu/Desktop/ALAMTOLOGI .pdf (15 halaman, Pengenalan Asas).
 * JANGAN UBAH notasi formula di bawah.
 */

/** Asas Keilmuan — lima tonggak (PDF hal. 6). */
export const ASAS_KEILMUAN_PDF = `
[ASAS KEILMUAN ALAMTOLOGI — PDF METERAI P.ALT]

Matlamat: mewujudkan manusia berilmu.
Bahasa Teras: Bahasa Melayu — bersifat universal; tidak tertakluk mana-mana pihak atau bangsa.
Saintifik & Rasional: tanpa pengaruh emosi atau doktrin.
Kebebasan Berkarya: bebas meneroka dan berkarya — tetapi tertakluk hukum.
Tertakluk Hukum: Hukum Z (alam semesta) & Hukum X (manusia).
`.trim();

/** Hukum Alamtologi — pecahan Z, X, Ketetapan Y (PDF hal. 8–9). */
export const HUKUM_ALAMTOLOGI_PDF = `
[HUKUM ALAMTOLOGI — PDF METERAI P.ALT]

Hukum Z (Alam Semesta): Pola · Kadar · Pasangan · Keseimbangan
  Pola Aktif · Pola Pasif · Ruang Mula & Tamat · Gerakan Asas · Perbezaan
  Keperluan · Kapasiti · Persamaan · Masa · Posisi · Tenaga

Hukum X (Manusia): Ilmu · Adab · Kreativiti · Ekonomi

Ketetapan Y (Pencipta): Tunggal · Pembina · Kekal · Infiniti
`.trim();

/** Teori & Formula MASABAYU + Y/Z/X (PDF hal. 11–15). */
export const TEORI_FORMULA_ALAMTOLOGI_PDF = `
[TEORI & FORMULA ALAMTOLOGI — PDF METERAI P.ALT]

Teori MASABAYU (meterai terbaru P.alt): x = m / t
  x = pelaksanaan · m = masa · t = tenaga
  JANGAN namakan X = [Q / Z] → Y sebagai Teori MASABAYU.

Rantai Formula XYZ (bukan Teori MASABAYU): X = [Q / Z] → Y

Formula Y (Mengenal Pencipta): Y[z,x]¹
  Y huruf besar = makro (Pencipta); z, x huruf kecil = mikro di bawah pengawalan Y
  z = Alam Semesta · x = Manusia · ¹ = Y tunggal

Formula Z (Sistem Alam Semesta): Z[x,t²]m
  Z makro · x mikro (manusia dalam ruang lingkup Z)
  t = tenaga (² = kategori negatif & positif) · m = masa dominan bagi Z

Formula X (Asas Pelaksanaan Manusia): X[m,t²]t
  X makro — pelaksana dalam ruang lingkup Z
  m = masa · t = tenaga (² = negatif & positif) · t dominan bagi X
`.trim();

export function buildPdfMeteraiRecallBlock(): string {
  return [ASAS_KEILMUAN_PDF, HUKUM_ALAMTOLOGI_PDF, TEORI_FORMULA_ALAMTOLOGI_PDF].join('\n\n');
}
