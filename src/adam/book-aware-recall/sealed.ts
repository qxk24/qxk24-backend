/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Sealed Chapter Anchors
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
 */

import type { BookChapterMatch } from './types';
import { buildBookCanonAck } from './canon';

export function buildSealedChapterAnchorAck(
  match: BookChapterMatch | null,
  isFounder: boolean,
): string {
  if (!match) return buildBookCanonAck(isFounder);

  if (match.chapterId === 'bab-1-asas') {
    return isFounder
      ? 'Bismillahirahmanirahim. P.alt, saya pegang SEALED Bab 1 — Asas Keilmuan. Saya tidak akan jawab Bab 1 dengan Pengenalan AIDIL.'
      : 'Saya pegang Bab 1 — Asas Keilmuan. Bukan Pengenalan AIDIL HISAL.';
  }

  if (match.chapterId === 'aidil-bab-1') {
    return isFounder
      ? 'Bismillahirahmanirahim. P.alt, saya pegang Bab 7 — HISAL · 7.1 AIDIL — Pengenalan AIDIL.'
      : 'Saya pegang Bab 7 — HISAL · 7.1 AIDIL.';
  }

  if (match.chapterId === 'hisal-chapter-7') {
    return isFounder
      ? 'Bismillahirahmanirahim. P.alt, saya pegang Bab 7 — HISAL (7.1 AIDIL, 7.2 ASAS, 7.3 SuNom, 7.4 GANDA).'
      : 'Saya pegang Bab 7 — HISAL.';
  }

  return buildBookCanonAck(isFounder);
}

const SEALED_CHAPTER_ANCHORS: Partial<Record<string, string>> = {
  'bab-1-asas': [
    '[SEALED — Sains Alamtologi · Bab 1: Asas Keilmuan]',
    '',
    'WAJIB untuk "Apa itu Bab 1":',
    '• Bab 1 = Asas Keilmuan (fondasi epistemologi, Teori MASABAYU, Bahasa Melayu sebagai bahasa berfikir).',
    '• DILARANG menjawab Bab 1 dengan Pengenalan AIDIL — itu 7.1 AIDIL dalam Bab 7 HISAL, bukan Asas Keilmuan.',
    '• Jawab dalam prosa P.alt — dari kefahaman yang diajar, bukan label teknikal kosong.',
    '',
    'DILARANG dalam output (ini ialah HISAL AIDIL / enjin — BUKAN Formula XYZ Bab 1):',
    '• "Bab 1 ialah Pengenalan AIDIL" atau sebarang pembukaan Bab 1 = AIDIL.',
    '• PG / PL / Proses Gabung / Proses Lerai / hisab sebagai pembuktian kehadiran / tajallī / syahadah ritmis / 1(7) sebagai jawapan Bab 1.',
    '• Membuka Bab 1 sebagai "Pengenalan AIDIL" atau PG/PL/hisab-kehadiran — itu HISAL AIDIL, bukan Asas Keilmuan.',
  ].join('\n'),
  'bab-2-faktor-xyz': [
    '[SEALED — Formula XYZ Bab 2: Faktor (X, Y, Z)]',
    '',
    'WAJIB untuk "Apa itu Bab 2" / Bab 2 Formula XYZ:',
    '• Bab 2 = Faktor XYZ — X (pelaku/manusia), Y (Pencipta), Z (alam/medan rujukan), Ketetapan Y.',
    '• DILARANG menjawab Bab 2 dengan HISAL ASAS, Cara Kira, Pola Operasi Tambah, atau Ganda Pa.',
    '• HISAL Bahagian ASAS ialah buku berasingan — Bab 2 dalaman ASAS = Proses Cara Kira, BUKAN Formula XYZ.',
    '• HISAL AIDIL Bab 2 (Ganda Pa/Penetapan) juga buku lain — jangan campur.',
  ].join('\n'),
  'bab-3-hukum': [
    '[SEALED — Formula XYZ Bab 3: Hukum Alamtologi]',
    '',
    'WAJIB untuk "Apa itu Bab 3" / Bab 3 Formula XYZ:',
    '• Bab 3 = Hukum Alamtologi — Hukum Z, Hukum X, Hukum Peleraian; pola kadar pasangan keseimbangan.',
    '• DILARANG menjawab Bab 3 dengan Cara Kira AIDIL (itu HISAL AIDIL · Bab 3 dalaman).',
    '• DILARANG menjawab Bab 3 dengan Operasi SuNom (itu SuNom · Bab 3 dalaman).',
    '• Empat hukum alam dan empat hukum manusia — dalam kerangka Formula XYZ, bukan modul HISAL.',
  ].join('\n'),
  'bab-4-sains': [
    '[SEALED — Formula XYZ Bab 4: Sains Alamtologi]',
    '',
    'WAJIB untuk "Apa itu Bab 4" / Bab 4 Formula XYZ:',
    '• Bab 4 = Sains Alamtologi — kerangka HISAL, IZWA, SIRA, RINA dalam Formula XYZ (bukan buku HISAL AIDIL/ASAS/SuNom).',
    '• HISAL di sini = komponen sains dalam Formula XYZ — BUKAN nama buku "HISAL Bahagian AIDIL".',
    '• DILARANG: Nombor 20 (HISAL AIDIL · Bab 4 dalaman), Pola Garis SuNom (SuNom · Bab 4 dalaman), Cara Kira, Operasi Tambah.',
    '• IZWA, SIRA, RINA = tiang sains Alamtologi di bawah Q — jawab dalam prosa P.alt.',
  ].join('\n'),
  'bab-5-masa': [
    '[SEALED — Formula XYZ Bab 5: Faktor Masa]',
    '',
    'WAJIB untuk "Apa itu Bab 5" / Bab 5 Formula XYZ:',
    '• Bab 5 = Faktor Masa — napadu, ruang masa, bekas pada masa (Z dominan masa: Z[x,t²]m).',
    '• DILARANG: Nombor 24(1) HISAL AIDIL · Bab 5 dalaman, Aplikasi KM HISAL ASAS · Bab 5 dalaman.',
    '• MASA dalam Formula XYZ = faktor kehadiran — bukan modul kira HISAL.',
    '• Jawab dalam prosa P.alt dari Teori MASABAYU dan pengajaran Faktor Masa.',
  ].join('\n'),
  'bab-6-tenaga': [
    '[SEALED — Formula XYZ Bab 6: Faktor Tenaga]',
    '',
    'WAJIB untuk "Apa itu Bab 6" / Bab 6 Formula XYZ:',
    '• Bab 6 = Faktor Tenaga — pasata, UID tenaga, pelaksanaan X berorientasikan tenaga (X[m,t²]).',
    '• DILARANG: Aplikasi Graf / Operasi Tambah (HISAL ASAS · Bab 6 dalaman), Operasi Tolak AIDIL, Cara Kira.',
    '• TENAGA dalam Formula XYZ = faktor pelaksanaan manusia — bukan modul kira HISAL.',
    '• Bab terakhir Formula XYZ sebelum epilog — jawab dalam prosa P.alt dari Teori MASABAYU.',
  ].join('\n'),
  'hisal-chapter-7': [
    '[SEALED — Sains Alamtologi · Bab 7: HISAL]',
    '',
    'Bab 7 — HISAL',
    '  7.1 AIDIL',
    '  7.2 ASAS',
    '  7.3 SuNom',
    '  7.4 GANDA',
    'Jawab dalam prosa P.alt — bukan campur Bab 1–6.',
  ].join('\n'),
  'alamin-overview': [
    '[SEALED — Bab 8 — Teori ALAMIN · Komunikasi Alamtologi ALAMIN]',
    '',
    'WAJIB: Bab 8 = Teori ALAMIN — buku Komunikasi Alamtologi ALAMIN (bukan Formula XYZ Bab 1–7).',
    'DILARANG: campur Bab 8 dengan Faktor XYZ / HISAL linear.',
    'Jawab dari silibus ALAMIN Bab 1–4 — tajuk P.alt tidak diubah.',
  ].join('\n'),
  'alamin-prolog': [
    '[SEALED — Prolog ALAMIN · Komunikasi Alamtologi ALAMIN]',
    '',
    'WAJIB: Prolog = pembuka buku — sebelum Bab 1 ALAMIN Ilmu Komunikasi Alamtologi.',
    'Susunan: Prolog → Bab 1 (1.1–Definisi) → Bab 2–4.',
    'Prolog 5 bahagian — tamat Pencapaian Menemukan ALAMIN; formula X+Z(Y)→gHp · X–Z(0)→gCp; bukan Formula XYZ Bab 1.',
  ].join('\n'),
  'alamin-bab-1': [
    '[SEALED — ALAMIN Bab 1 — Ilmu Komunikasi Alamtologi]',
    '',
    'WAJIB: Bab 1 ALAMIN = ALAMIN = SAINS KOMUNIKASI ALAMTOLOGI.',
    '1.1 Dasar Pemikiran — Gambar rajah 1.1: X · Y · Z · 7 proses interaksi dalam ruang Z.',
    '1.2–1.2.1 Pengenalan & Asas ALAMIN; Definisi ALAMIN — ALAM+AMIN, Gambar 1.3–1.7, gHp/gCp, frekuensi X+↔X-.',
    'DILARANG: jawab ALAMIN Bab 1 dengan Formula XYZ Bab 1 Asas Keilmuan atau komunikasi manusia–manusia semata.',
  ].join('\n'),
  'alamin-bab-2': [
    '[SEALED — ALAMIN Bab 2 — Hukum Alamtologi dalam Kajian ALAMIN]',
    '',
    'WAJIB: hukum = aturan ALAMTOLOGI; ikut hukum (akur) vs tolak hukum (engkar); ruang hukum & proses pelaksanaan.',
    'Gambar 2.1–2.5 hukum & faktor pola · 2.6–2.20 PeSa–PeTu · 2.21–2.67 Kadar · Pasangan · Keseimbangan.',
    '2.2 Kadar · 2.3 Pasangan · 2.4 Keseimbangan (2.61–2.67 · Keperluan · Kapasiti Xy/Xz).',
    'DILARANG: jawab ALAMIN Bab 2 dengan Formula XYZ Bab 2 Faktor (X,Y,Z) atau HISAL ASAS Cara Kira.',
  ].join('\n'),
  'aidil-bab-1': [
    '[SEALED — Bab 7 — HISAL · 7.1 AIDIL · Pengenalan AIDIL]',
    '',
    'WAJIB untuk "Apa itu AIDIL?":',
    '• Jawab dari 7.1 AIDIL dalam Bab 7 HISAL — Pengenalan AIDIL (pola & proses).',
    '• Bukan Bab 1 Asas Keilmuan.',
    '• BUKAN AIDIL formula brain (A+B=C) — itu hanya bila P.alt tanya formula ingatan secara eksplisit.',
    '• Jawab dalam prosa P.alt dari pengajaran Pengenalan AIDIL — PG, PL, pola, proses dalam kerangka HISAL.',
  ].join('\n'),
};

export function buildSealedChapterAnchor(match: BookChapterMatch | null): string | null {
  if (!match) return null;
  return SEALED_CHAPTER_ANCHORS[match.chapterId] ?? null;
}
