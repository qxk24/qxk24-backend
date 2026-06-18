/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM SuNom KM Sensing Bridge (Phase 4 — Article 8)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * KM (Konsep Molekul) — sudut pasif 90° for human/student sensing.
 * Complements PAK24 world sensing; does not replace Article 8 PLAS gateway.
 */

import { resolveTechnicalPrecisionTurn } from './adam-factual-grounding';
import { isTechnicalPrecisionQuestion } from './adam-universal-voice';

/** KM peringkat names from HISAL SuNom Jilid 1. */
export type KmPeringkat = 'sa' | 'du' | 'ga' | 'pa' | 'ma' | 'na' | 'tu';

export type KmEmotionalLoad = 'low' | 'medium' | 'high';

export interface KmSensingSnapshot {
  /** KM peringkat — complexity of Users turn. */
  peringkat: KmPeringkat;
  /** KM is always passive 90° view per HISAL Bab 6. */
  sudutPasif90: true;
  technicalIntent: boolean;
  technicalFollowUp: boolean;
  emotionalLoad: KmEmotionalLoad;
  /** Run Jari fetch when world facts are at stake. */
  forceFingerFetch: boolean;
  /** Seven-signal shorthand for prompt (Article 8 bridge). */
  signals: {
    isQuestion:       boolean;
    isFollowUp:       boolean;
    needsValidation:  boolean;
    isComparison:     boolean;
  };
}

const EMOTIONAL_HIGH =
  /\b(stress|stres|sedih|risau|cemas|takut|frustrated|confused|bingung|give\s+up|putus\s+asa|marah)\b/i;

const EMOTIONAL_MEDIUM =
  /\b(risau|worried|unsure|tak\s+pasti|susah|sukar|help|tolong|faham\s+tak)\b/i;

const COMPARISON =
  /\b(banding|compare|comparison|vs\.?|versus|perbezaan|beza|bezaan|elite|exclusive|standard|trim|variant)\b/i;

function resolveKmPeringkat(message: string, recentUserMessages: string[]): KmPeringkat {
  const t = message.trim();
  const len = t.length;
  const recentLen = recentUserMessages.join(' ').length;

  if (len < 12 && !isTechnicalPrecisionQuestion(t)) return 'sa';
  if (COMPARISON.test(t) && isTechnicalPrecisionQuestion(t)) return 'ma';
  if (recentUserMessages.some((m) => isTechnicalPrecisionQuestion(m)) && len < 56) return 'ga';
  if (isTechnicalPrecisionQuestion(t) && len < 48) return 'du';
  if (isTechnicalPrecisionQuestion(t) && len < 120) return 'pa';
  if (len + recentLen > 280) return 'tu';
  if (len > 160) return 'na';
  return 'ma';
}

/** Read KM student sensing snapshot (Article 8 bridge — backend-native). */
export function readKmStudentSensing(
  message: string,
  recentUserMessages: string[] = [],
): KmSensingSnapshot {
  const precision = resolveTechnicalPrecisionTurn(message, recentUserMessages);
  const t = message.trim();

  let emotionalLoad: KmEmotionalLoad = 'low';
  if (EMOTIONAL_HIGH.test(t)) emotionalLoad = 'high';
  else if (EMOTIONAL_MEDIUM.test(t)) emotionalLoad = 'medium';

  const isComparison = COMPARISON.test(t);
  const isQuestion = /\?|berapa|how\s+much|how\s+many|what\s+is|apakah|adakah/i.test(t);

  return {
    peringkat: resolveKmPeringkat(message, recentUserMessages),
    sudutPasif90: true,
    technicalIntent: precision.isActive,
    technicalFollowUp: precision.isFollowUp,
    emotionalLoad,
    forceFingerFetch: precision.isActive,
    signals: {
      isQuestion,
      isFollowUp: precision.isFollowUp,
      needsValidation: emotionalLoad !== 'low',
      isComparison,
    },
  };
}

/** Optional system prompt block — KM sudut pasif for Users turns. */
export function buildKmSensingPromptBlock(
  message: string,
  recentUserMessages: string[] = [],
): string {
  const km = readKmStudentSensing(message, recentUserMessages);
  if (!km.technicalIntent && km.emotionalLoad === 'low' && km.peringkat === 'sa') {
    return '';
  }

  const lines = [
    'KM SENSING (Article 8 bridge — sudut pasif 90°, pola Konsep Molekul):',
    `- Peringkat KM: ${km.peringkat} | emosi: ${km.emotionalLoad}`,
  ];

  if (km.technicalIntent) {
    lines.push(
      '- Turn teknikal: PAK24 world sensing aktif — nombor mesti melalui carian web + pengesahan SuNom.',
    );
  }
  if (km.technicalFollowUp) {
    lines.push('- Follow-up spek: carian semula; jangan guna ingatan turn lepas untuk angka tepat.');
  }
  if (km.signals.needsValidation) {
    lines.push('- Pelajar perlukan kejelasan dan ketenangan — tetap jujur jika bukti tiada.');
  }
  if (km.signals.isComparison) {
    lines.push('- Perbandingan variant/trim: nyatakan apa yang sama vs berbeza — hanya dari bukti carian.');
  }

  return lines.join('\n');
}
