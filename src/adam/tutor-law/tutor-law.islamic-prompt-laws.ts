/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Education Prompt Laws
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import { ADAM_QURAN_CONSTITUTIONAL_SUPREMACY_LAW } from '../adam-universal-voice';
import { ADAM_QURAN_TRANSLATION_ONLY_LAW } from './tutor-law.quran-translation';
import {
  FabricationRisk,
  IslamicClassifierOutput,
  IslamicIntent,
  SourceTier,
} from './tutor-law.islamic-intent.types';

export const ADAM_TUTOR_ISLAMIC_SOURCE_HIERARCHY_LAW = `
ADAM — ISLAMIC SOURCE HIERARCHY (mandatory — never invert):
${ADAM_QURAN_CONSTITUTIONAL_SUPREMACY_LAW}
- Pedagogical tiers for citations this turn: Quran → Hadith → Ijmak/Qiyas → Academic.
- State which tier you draw from; never present textbook or ijtihad as above wahyu.
- DILARANG: petik ayat Al-Quran atau teks Hadith verbatim dari ingatan — arahkan ke quran.com / sunnah.com.
- DILARANG: mengeluarkan fatwa peribadi — paparkan kedudukan ulama / mazhab dengan adab.
${ADAM_QURAN_TRANSLATION_ONLY_LAW}
`.trim();

export const ADAM_TUTOR_ISLAMIC_FABRICATION_LAW = `
ADAM — ISLAMIC FABRICATION GUARD (hard stop):
- Jangan hasilkan teks ayat atau hadis — hanya maksud, konteks, dan rujukan tier.
- Redirect ke sumber disahkan sebelum terangkan lanjut.
`.trim();

export const ADAM_TUTOR_ISLAMIC_FIQH_LAW = `
ADAM — FIQH (bukan fatwa):
- Probe pemahaman pelajar dahulu; jangan hantar hukum muktamad tanpa asas.
- Hal yang diperselisihkan: paparkan pandangan mazhab utama — jangan isytiharkan satu sahaja "betul".
`.trim();

export function buildIslamicIntentTurnLaw(
  intent: IslamicClassifierOutput | null,
): string {
  if (!intent) return '';

  const parts: string[] = [ADAM_TUTOR_ISLAMIC_SOURCE_HIERARCHY_LAW];

  if (intent.sourceTier !== SourceTier.UNKNOWN) {
    parts.push(`ISLAMIC SOURCE TIER THIS TURN: ${intent.sourceTier}`);
  }

  if (intent.fabricationRisk === FabricationRisk.HIGH
    || intent.fabricationRisk === FabricationRisk.MEDIUM) {
    parts.push(`FABRICATION RISK: ${intent.fabricationRisk} — verify external text only.`);
  }

  switch (intent.intent) {
    case IslamicIntent.FABRICATION_RISK:
      parts.push(ADAM_TUTOR_ISLAMIC_FABRICATION_LAW);
      if (intent.fabricationGuard) {
        parts.push(`FABRICATION GUARD (turn ini — ikut sahaja):\n${intent.fabricationGuard}`);
      }
      break;
    case IslamicIntent.Q_QURAN:
    case IslamicIntent.Q_HADITH:
      parts.push(ADAM_QURAN_TRANSLATION_ONLY_LAW);
      if (intent.pedagogyProbe) {
        parts.push(`ISLAMIC PEDAGOGY PROBE FIRST:\n${intent.pedagogyProbe}`);
      }
      if (intent.verificationReminder) {
        parts.push(`VERIFICATION REMINDER (akhiri jawapan dengan nota ini):\n${intent.verificationReminder}`);
      }
      break;
    case IslamicIntent.Q_FIQH:
      parts.push(ADAM_TUTOR_ISLAMIC_FIQH_LAW);
      if (intent.pedagogyProbe) {
        parts.push(`FIQH PROBE FIRST:\n${intent.pedagogyProbe}`);
      }
      break;
    case IslamicIntent.Q_IMAN:
    case IslamicIntent.Q_AKHLAQ:
    case IslamicIntent.Q_HISTORY:
    case IslamicIntent.Q_COMPARE:
      if (intent.pedagogyProbe) {
        parts.push(`ISLAMIC PEDAGOGY PROBE FIRST:\n${intent.pedagogyProbe}`);
      }
      break;
    case IslamicIntent.AMBIGUOUS:
      if (intent.probeQuestion) {
        parts.push(`ISLAMIC PROBE (tanya sahaja):\n${intent.probeQuestion}`);
      }
      break;
    default:
      break;
  }

  return parts.filter(Boolean).join('\n\n');
}
