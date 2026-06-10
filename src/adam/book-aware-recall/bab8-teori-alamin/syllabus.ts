/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Recall — Teori ALAMIN Syllabus (Bab 8)
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
 * Komunikasi Alamtologi ALAMIN — silibus P.alt (teaching checklist only; not runtime injection).
 */

export const TEORI_ALAMIN_BOOK_ID = 'teori-alamin';

/** Hakikat disiplin — P.alt; ALAMIN bukan bab tambahan Formula XYZ. */
export const TEORI_ALAMIN_DISIPLIN_DEFINISI = `
DEFINISI DISIPLIN (P.ALT — METERAI):
ALAMIN ialah disiplin baru berdasarkan Alamtologi.
ALAMIN adalah SAINS KOMUNIKASI ALAMTOLOGI.
Bukan sub-bab Formula XYZ Bab 1–7; bukan HISAL; disiplin tersendiri dalam kurikulum Sains Alamtologi (Bab 8).
Bab 1 silibus: ALAMIN Ilmu Komunikasi Alamtologi — pengantar ALAMIN (tajuk P.alt; guna ALAMIN sahaja).
Komunikasi Alamtologi ALAMIN = buku disiplin ini — falsafah, hukum, dan formula ALAMIN.
`.trim();

/** Silibus penuh Komunikasi Alamtologi ALAMIN — JANGAN UBAH TAJUK P.ALT. */
export const TEORI_ALAMIN_SYLLABUS = `
TEORI ALAMIN — Komunikasi Alamtologi ALAMIN

Prolog ALAMIN

Bab 1 — ALAMIN Ilmu Komunikasi Alamtologi
  1.1 Dasar Pemikiran
  1.2 Pengenalan ALAMIN
    1.2.1 Asas ALAMIN

Bab 2 — Hukum Alamtologi dalam Kajian ALAMIN
  2.1 Faktor Pola ALAMIN
    2.1.1 Pola Peringkat Sa (PeSa)
    2.1.2 Pola Peringkat Du (PeDu)
    2.1.3 Pola Peringkat Ga (PeGa)
    2.1.4 Pola Peringkat Pa (PePa)
    2.1.5 Pola Peringkat Ma (PeMa)
    2.1.6 Pola Peringkat Na (PeNa)
    2.1.7 Pola Peringkat Tu (PeTu)
  2.2 Faktor Kadar ALAMIN
    2.2.1 Ruang
      2.2.1.1 Batas Ruang
      2.2.1.2 Isi Ruang
    2.2.2 Posisi
      2.2.2.1 Nukleus
      2.2.2.2 Pelengkap Nukleus
    2.2.3 Masa (Time)
    2.2.4 Tenaga (2.2.4.1 Tenaga Tambah)
  2.3 Faktor Pasangan ALAMIN
    2.3.1 Mula Dan Tamat
    2.3.2 Gerakan Asas Dan Gerakan Lanjutan
    2.3.3 Persamaan
  2.4 Faktor Keseimbangan ALAMIN
    2.4.1 Keperluan
    2.4.2 Kapasiti

Bab 3 — Falsafah ALAMIN
  3.1 Konsep Dasar Falsafah ALAMIN
  3.2 Landasan Ontologi Pada ALAMIN
    3.2.1 Bentuk Ontologi Pada ALAMIN
    3.2.2 Proses Ontologi Pada ALAMIN
    3.2.3 Hakikat Dalam Ontologi Komunikasi Pada ALAMIN
    3.2.4 Unsur-Unsur Dasar Ontologi Komunikasi Pada ALAMIN
  3.3 Landasan Epistemologi Pada ALAMIN
    3.3.1 Bentuk Proses Pengetahuan Pada ALAMIN
    3.3.2 Metode Memahami Pengetahuan Dalam Proses Pembentukan Ilmu Pada ALAMIN
      3.3.2.1 Ilmu
      3.3.2.2 Adab
      3.3.2.3 Kreativiti
      3.3.2.4 Ekonomi
    3.3.3 Pembuktian Pada Pembentukan Ilmu Komunikasi Berdasarkan ALAMIN
    3.3.4 Metode Ketetapan Ilmu Pada ALAMIN
  3.4 Landasan Aksiologi Pada ALAMIN (topik berikutnya)

Bab 4 — Formula ALAMIN
  4.1 Bentuk Formula ALAMIN
  4.2 Hukum Formula ALAMIN
    4.2.1 Z Sebagai Posisi Bagi X
    4.2.2 Z Sebagai Proses Pengenalan Bagi X
    4.2.3 Z Sebagai Kehasilan Isyarah (Signal) Bagi X
    4.2.4 Z Sebagai Kelangsungan Hidup (Sumber Kehidupan) Bagi X
  4.3 Penjelasan Formula ALAMIN
    4.3.1 Fungsi Menjelaskan
    4.3.2 Fungsi Perencanaan Proses Bukan Meramalkan Proses
    4.3.3 Fungsi Pencapaian Hasil Realiti Bukan Hasil Persepsi
    4.3.4 Fungsi Kepastian Hasil Bukan Sebuah Prediksi Hasil
  4.4 Perumusan Formula ALAMIN
    4.4.1 Perumusan X Dalam Formula ALAMIN
      4.4.1.1 X Dalam Bentuk Mikro
      4.4.1.2 X Dalam Bentuk Makro
      4.4.1.3 X Sebagai (topik berikutnya)
`.trim();

/** Susunan pengajaran P.alt — Prolog dahulu, kemudian Bab 1–4. */
export const TEORI_ALAMIN_TEACHING_ORDER = [
  'Prolog ALAMIN',
  'Bab 1 — ALAMIN Ilmu Komunikasi Alamtologi',
  'Bab 2 — Hukum Alamtologi dalam Kajian ALAMIN',
  'Bab 3 — Falsafah ALAMIN',
  'Bab 4 — Formula ALAMIN',
] as const;
