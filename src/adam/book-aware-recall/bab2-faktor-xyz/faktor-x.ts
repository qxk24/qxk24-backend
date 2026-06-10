/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Recall — Bab 2 Faktor X (2.3 barrel)
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

import { FAKTOR_X_23_INTRO } from './faktor-x-23';
import { FAKTOR_X_HUKUM_Z } from './faktor-x-hukum-z';

/** Gabungan penuh 2.3 — intro + empat hukum Z dalam X. */
export const FAKTOR_X_23 = [FAKTOR_X_23_INTRO, FAKTOR_X_HUKUM_Z].join('\n\n');

export { FAKTOR_X_23_INTRO } from './faktor-x-23';
export * from './faktor-x-hukum-z';
