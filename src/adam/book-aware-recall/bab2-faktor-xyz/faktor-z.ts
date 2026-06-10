/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Recall — Bab 2 Faktor Z (2.2–2.2.2)
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

import { STRUKTUR_SA_22111 } from './struktur-sa-22111';
import { STRUKTUR_DU_22112 } from './struktur-du-22112';
import { STRUKTUR_GA_22113 } from './struktur-ga-22113';
import { STRUKTUR_PA_22114 } from './struktur-pa-22114';
import { STRUKTUR_MA_22115 } from './struktur-ma-22115';
import { STRUKTUR_NA_22116 } from './struktur-na-22116';
import { STRUKTUR_TU_22117 } from './struktur-tu-22117';
import { PERINGKAT_KEJADIAN_Z_222 } from './peringkat-kejadian-z-222';
import {
  ASAS_PEMBENTUKAN_STRUKTUR_Z_2211,
  PENCIPTAAN_STRUKTUR_Z_221,
} from './struktur-z-penciptaan';

/** 2.2 pengenalan Faktor Z — meterai P.alt. */
export const FAKTOR_Z_22_INTRO = `
[2.2 — FAKTOR Z — METERAI P.ALT]

Secara ilmiah: Z (alam semesta) = tempat permulaan semua kehidupan —
dari sekecil-kecil mikrob hingga sebesar-besar bintang bertaburan di langit.
Setiap satunya bergerak & berfungsi sistematik ikut hukum Z — keadaan cukup sempurna.
Contoh: hujan turun membersih debu udara — alam bertindak ikut keperluan, bukan kehendak.
Faktor Z / Z = rujukan kepada X; memiliki "nilai" sama dengan X.
Z = cerminan kepada X yang mencari "alatan" atau kaedah bertepatan untuk hasil kelangsungan hidup.

Mengapa Z rujukan utama pengkajian ALAMTOLOGI:
setiap perkara dalam Z berkait X secara langsung & tidak langsung.
Mengkaji & mengenal Z = seumpama mengkaji & mengenal diri sendiri.
Hidup tanpa mengenal diri → pasti tidak kenal Pencipta.
Manusia tanpa kenal diri = zombi berjalan tanpa tahu tujuan hidup & untuk apa di alam semesta.
`.trim();

/** Gabungan penuh 2.2 — intro + penciptaan struktur + kejadian Z. */
export const FAKTOR_Z_22 = [
  FAKTOR_Z_22_INTRO,
  PENCIPTAAN_STRUKTUR_Z_221,
  ASAS_PEMBENTUKAN_STRUKTUR_Z_2211,
  STRUKTUR_SA_22111,
  STRUKTUR_DU_22112,
  STRUKTUR_GA_22113,
  STRUKTUR_PA_22114,
  STRUKTUR_MA_22115,
  STRUKTUR_NA_22116,
  STRUKTUR_TU_22117,
  PERINGKAT_KEJADIAN_Z_222,
].join('\n\n');

/** @deprecated Gunakan PERINGKAT_KEJADIAN_Z_222 — kekal untuk import sedia ada. */
export const FAKTOR_Z_22_LANJUTAN = PERINGKAT_KEJADIAN_Z_222;
