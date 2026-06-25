/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Level Scope (soft baseline)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Level is a SOFT baseline, not a lock. ADAM never refuses a
 * question for being above/below the learner's usual level —
 * it adapts depth and teaches from basics. The detected level
 * is used for diagnostics (parent reports), not gating.
 */

import { AGENT_MARKETING_LOCALE_NOTE } from '../tutor/adam-tutor-agent-marketing.constants';
import type { AdamTutorLevel, AdamTutorProfile } from './tutor-law.types';

export const TUTOR_LEVEL_BAND_ORDER: Record<AdamTutorLevel, number> = {
  primary:    0,
  secondary:  1,
  university: 2,
};

const PRIMARY_MARKERS = /\b(?:darjah\s*(?:satu|1|2|3|4|5|6)|tahun\s*(?:satu|1|2|3|4|5|6)|year\s*(?:1|2|3|4|5|6)|upsr|kssr\s*rendah|primary\s*school|sekolah\s*rendah)\b/i;

const SECONDARY_MARKERS = /\b(?:tingkatan\s*(?:1|2|3|4|5)|form\s*(?:1|2|3|4|5)|tahun\s*(?:7|8|9|10|11)|year\s*(?:7|8|9|10|11)|spm|pt3|stpm|igcse|o\s*level|a\s*level|kssm|secondary\s*school|sekolah\s*menengah|menengah)\b/i;

const UNIVERSITY_MARKERS = /\b(?:universiti|university|kolej|college|degree|ijazah|bachelor|sarjana\s+muda|master|phd|doctoral|thesis|disertasi|dissertation|undergraduate|postgraduate|semester|kuliah|fakulti|faculty|kursus\s+degree)\b/i;

const SECONDARY_TOPIC_MARKERS = /\b(?:calculus|kalkulus|trigonometri|trigonometry|kuadratik|quadratic|logaritma|logarithm|matriks|matrix|vektor|vector|derivatif|derivative|integral|differentiation|pembezaan|kamiran)\b/i;

const UNIVERSITY_TOPIC_MARKERS = /\b(?:calculus\s+(?:ii|iii|2|3)|multivariable|thermodynamics|research\s+methodology|literature\s+review|statistical\s+inference|honours|honors\s+thesis|disertasi\s+phd|fyp\s+university|final\s+year\s+project\s+degree)\b/i;

export function isAgentMarketingTutorScope(profile?: AdamTutorProfile | null): boolean {
  return profile?.localeNote === AGENT_MARKETING_LOCALE_NOTE;
}

export function tutorLevelScopeLabel(
  level: AdamTutorLevel,
  language: 'malay' | 'english' = 'malay',
): string {
  if (language === 'english') {
    switch (level) {
      case 'primary':    return 'Primary School (Year 1–6 / Darjah 1–6)';
      case 'secondary':  return 'Secondary School (Form / Tingkatan 1–5, SPM)';
      case 'university': return 'College & University';
    }
  }
  switch (level) {
    case 'primary':    return 'Sekolah Rendah (Darjah/Tahun 1–6)';
    case 'secondary':  return 'Sekolah Menengah (Tingkatan/Form 1–5, SPM)';
    case 'university': return 'Kolej & Universiti';
  }
}

export function tutorLevelScopeCeiling(level: AdamTutorLevel, language: 'malay' | 'english' = 'malay'): string {
  if (language === 'english') {
    switch (level) {
      case 'primary':    return 'up to Year 6 / Grade 6 only';
      case 'secondary':  return 'up to secondary / high-school level (not university degree work)';
      case 'university': return 'tertiary / degree-level and below as needed';
    }
  }
  switch (level) {
    case 'primary':    return 'hingga Darjah/Tahun 6 sahaja';
    case 'secondary':  return 'hingga peringkat menengah/SPM sahaja — bukan ijazah universiti';
    case 'university': return 'peringkat kolej & universiti';
  }
}

export function detectQuestionEducationBand(message: string): AdamTutorLevel | null {
  const t = message.trim();
  if (!t) return null;
  if (UNIVERSITY_MARKERS.test(t) || UNIVERSITY_TOPIC_MARKERS.test(t)) return 'university';
  if (SECONDARY_MARKERS.test(t) || SECONDARY_TOPIC_MARKERS.test(t)) return 'secondary';
  if (PRIMARY_MARKERS.test(t)) return 'primary';
  return null;
}

/**
 * Diagnostic only — is this question above the learner's usual baseline?
 * Used to TAG interactions for parent reports, never to refuse teaching.
 */
export function isQuestionAboveBaselineLevel(
  message: string,
  profile?: AdamTutorProfile | null,
): boolean {
  if (!profile?.level) return false;
  if (isAgentMarketingTutorScope(profile)) return false;

  const student = profile.level;
  const detected = detectQuestionEducationBand(message);

  if (
    detected
    && TUTOR_LEVEL_BAND_ORDER[detected] > TUTOR_LEVEL_BAND_ORDER[student]
  ) {
    return true;
  }

  if (student === 'primary') {
    return SECONDARY_MARKERS.test(message)
      || UNIVERSITY_MARKERS.test(message)
      || SECONDARY_TOPIC_MARKERS.test(message)
      || UNIVERSITY_TOPIC_MARKERS.test(message);
  }

  if (student === 'secondary') {
    return UNIVERSITY_MARKERS.test(message)
      || UNIVERSITY_TOPIC_MARKERS.test(message);
  }

  return false;
}

/** @deprecated Renamed to isQuestionAboveBaselineLevel — kept for compatibility. */
export const isQuestionBeyondStudentLevel = isQuestionAboveBaselineLevel;

export function buildTutorLevelScopeLaw(profile?: AdamTutorProfile | null): string {
  if (!profile?.level || isAgentMarketingTutorScope(profile)) return '';

  const label = tutorLevelScopeLabel(profile.level, 'malay');

  return `
ADAM TUTOR — ARAS BIASA PELAJAR (panduan lembut, BUKAN sekatan):
- Pelajar ini biasanya belajar pada aras **${label}**. Guna ini sebagai titik mula nada, kelajuan, dan contoh.
- JANGAN sekat atau tolak soalan kerana ia lebih tinggi atau lebih rendah daripada aras ini. Tiada topik dilarang.
- Jika soalan melebihi aras biasa: tetap ajar — mulakan dari asas, perlahan-lahan, bina kefahaman langkah demi langkah.
- Jika soalan lebih mudah: jawab ringkas dan jelas tanpa merendahkan.
- Sesuaikan kedalaman pada setiap soalan. ADAM mengalir seperti air: sabar dengan kanak-kanak, jelas dengan pelajar, jujur dengan sarjana.`.trim();
}

/**
 * Per-turn nudge when a question is above the learner's usual baseline.
 * Teaches from basics — never refuses, never upsells.
 */
export function buildTutorAboveBaselineGuidanceLaw(profile: AdamTutorProfile): string {
  const label = tutorLevelScopeLabel(profile.level, 'malay');

  return `
TURN TYPE — SOALAN MELEBIHI ARAS BIASA (ajar dari asas — JANGAN tolak):
- Soalan ini nampak lebih tinggi daripada aras biasa pelajar (${label}).
- Tetap bantu sepenuhnya: mulakan dari konsep asas, bina langkah demi langkah dengan sabar.
- Guna contoh mudah dahulu sebelum istilah lanjutan; semak kefahaman sebelum teruskan.
- JANGAN kata "luar skop", "tidak meliputi", atau "sila naik taraf langganan".
- Ini peluang pembelajaran — ADAM tandakan dalam minda untuk laporan kemajuan, bukan sebab menolak.`.trim();
}

/** @deprecated Renamed to buildTutorAboveBaselineGuidanceLaw — no longer refuses. */
export const buildTutorLevelScopeRefusalLaw = buildTutorAboveBaselineGuidanceLaw;
