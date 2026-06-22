/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Science Factual Routing
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 */

import { hasNumericalComputation } from './tutor-law.math-intent-detectors';
import {
  buildScienceClassifierInput,
  classifyScienceIntent,
  isTutorScienceDomainMessage,
} from './tutor-law.science-intent-classifier';
import { ScienceIntent } from './tutor-law.science-intent.types';
import { countSignalHits, SCIENCE_DOMAIN_MARKERS } from './tutor-law.science-intent-signals';

/** Math exercise / equation-solving — not factual science Q&A. */
const TUTOR_MATH_EXERCISE_MARKERS = [
  /\d[\d,]*\s*[+\-×÷*/]\s*\d[\d,]*(?:\s*=\s*[\d,]+)?/,
  /[A-Za-z]\s*[+\-]\s*\d+\s*=\s*\d/,
  /\b\d*x\b|\bx\s*=\s*\d/i,
  /\b(?:selesaikan|hitung|cuba\s+kira|kira\s+jumlah|tempat\s+(?:Sa|Puluh|Ribus?))\b/i,
  /\b(?:Ali|Ahmad|Siti|Puan|Encik)\s+(?:ada|membeli|menjual|mempunyai)\s+\d/i,
  /\b(?:guli|buku|epal|gaji|wang|harga)\b.*\d[\d,]*/i,
];

/** Legacy factual cues — used when science domain is thin but question is clearly Q&A. */
const TUTOR_SCIENCE_FACTUAL_MARKERS = [
  /\b(?:fizik|sains|biologi|kimia|geografi|astronomi|ekologi)\b/i,
  /\b(?:cahaya|matahari|bumi|bulan|planet|bintang|atom|molekul|tenaga|kelajuan|jarak|graviti|elektron|sel\s+suria|vakum|au\b|unit\s+astronomi)\b/i,
  /\b(?:how\s+long|how\s+far|how\s+fast|what\s+is\s+the\s+(?:speed|distance|mass|time|temperature))\b/i,
  /\b(?:berapa\s+(?:lama|jauh|cepat|besar|tinggi|berat|suhu|jarak|kelajuan))\b/i,
  /\b(?:mengapa|kenapa|why|what\s+is|what\s+are|apakah\s+(?:fungsi|maksud|proses|sebab))\b/i,
  /\b(?:photosynthesis|mitosis|gravity|velocity|acceleration|wavelength|frequency)\b/i,
  /\bE\s*=\s*mc²?\b/i,
  /\b(?:formula|persamaan)\s+(?:fizik|tenaga|physics)\b/i,
];

export { hasNumericalComputation } from './tutor-law.math-intent-detectors';

export function tutorQuestionIsScienceFactual(message: string): boolean {
  const t = message.trim();
  if (!t || t.length < 12) return false;

  if (isTutorScienceDomainMessage(t)) {
    const classified = classifyScienceIntent(buildScienceClassifierInput({ userMessage: t }));
    return classified.intent === ScienceIntent.F_FACTUAL;
  }

  if (hasNumericalComputation(t)) return false;
  if (TUTOR_MATH_EXERCISE_MARKERS.some((re) => {
    re.lastIndex = 0;
    return re.test(t);
  })) {
    return false;
  }
  const hasQuestionCue = /[?？]/.test(t)
    || /\b(?:berapa|mengapa|kenapa|apakah|what|why|how|bila|adakah)\b/i.test(t)
    || /\bapa\s+(?:itu|maksud|beza)\b/i.test(t);
  if (!hasQuestionCue) return false;
  return TUTOR_SCIENCE_FACTUAL_MARKERS.some((re) => {
    re.lastIndex = 0;
    return re.test(t);
  });
}

export function tutorMessageHasScienceDomainMarkers(message: string): boolean {
  const norm = message.trim().toLowerCase();
  return countSignalHits(norm, SCIENCE_DOMAIN_MARKERS) >= 1;
}
