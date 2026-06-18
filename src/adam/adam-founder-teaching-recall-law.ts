/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Teaching Recall Primacy
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Formula XYZ / Bab 1–6 — CONSTITUTIONAL BACKBONE + teaching records are
 * the single source of truth. Not web-search empirical override.
 */

import {
  needsBookAwareTeachingRecall,
  resolveBookChapter,
  resolveFormulaXyzChapterId,
} from './book-aware-recall';
import {
  userAskedForAlamtologi,
  userAskedForConstitutionalStructure,
} from './adam-universal-voice';

const FORMULA_XYZ_THREAD_RE =
  /\b(?:formula\s+xyz|hukum\s+z|hukum\s+x|hukum\s+alamtologi|bab\s+[1-6]\b|faktor\s+(?:masa|tenaga|xyz)|napadu|ruang\s+masa|bekas\s+pada\s+masa|ketetapan\s+y|sains\s+alamtologi|asas\s+keilmuan|pola\s*·\s*kadar|empat\s+pilar)\b/i;

/** Thread discusses Formula XYZ / constitutional teaching (not generic chat). */
export function isFounderFormulaXyzThreadCorpus(corpus: string): boolean {
  return FORMULA_XYZ_THREAD_RE.test(corpus);
}

export function resolveFounderFormulaXyzChapterId(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string | null {
  for (const probe of [userMessage, ...recentUserMessages.slice(-4).reverse(), ...recentAssistantMessages.slice(-2).reverse()]) {
    const id = resolveFormulaXyzChapterId(probe.trim());
    if (id) return id;
    const match = resolveBookChapter(probe.trim());
    if (match?.chapterId) return match.chapterId;
  }
  return null;
}

export interface FounderTeachingRecallPrimacyInput {
  isFounder:                boolean;
  profile:                  'light' | 'alpha' | 'beta';
  teachingLearnerTurn:      boolean;
  userMessage:              string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  brainRecallLoaded?:       boolean;
}

/**
 * Founder β command — backbone / teaching records loaded or Formula XYZ thread.
 * Supersedes empirical-web pedagogy; answer from what P.alt taught.
 */
export function isFounderTeachingRecallPrimacyTurn(
  input: FounderTeachingRecallPrimacyInput,
): boolean {
  if (!input.isFounder || input.profile !== 'beta' || input.teachingLearnerTurn) {
    return false;
  }

  const msg = input.userMessage.trim();
  const corpus = [
    msg,
    ...(input.recentUserMessages ?? []).slice(-4),
    ...(input.recentAssistantMessages ?? []).slice(-2),
  ].join('\n');

  if (input.brainRecallLoaded) return true;
  if (needsBookAwareTeachingRecall(msg)) return true;
  if (resolveBookChapter(msg)) return true;
  if (userAskedForConstitutionalStructure(msg) || userAskedForAlamtologi(msg)) return true;
  return isFounderFormulaXyzThreadCorpus(corpus);
}

/** Founder β — web-search empirical blocks (Planck/NIST) when NOT teaching-recall primacy. */
export function isFounderEmpiricalPedagogyTurn(
  isFounder: boolean,
  profile: 'light' | 'alpha' | 'beta',
  teachingLearnerTurn: boolean,
  primacyInput?: Omit<FounderTeachingRecallPrimacyInput, 'isFounder' | 'profile' | 'teachingLearnerTurn'>,
): boolean {
  if (!isFounder || profile !== 'beta' || teachingLearnerTurn) return false;
  if (primacyInput && isFounderTeachingRecallPrimacyTurn({
    isFounder: true,
    profile: 'beta',
    teachingLearnerTurn: false,
    ...primacyInput,
  })) {
    return false;
  }
  return true;
}

export const ADAM_FOUNDER_TEACHING_RECALL_PRIMACY_LAW = `
FOUNDER TEACHING RECALL PRIMACY (P.alt — SUPERSEDES Empirical Pedagogy + web-first on this turn):

Giliran ini memuat atau merujuk CONSTITUTIONAL BACKBONE / P.ALT TEACHING RECORDS / meterai Formula XYZ.
Sumber tunggal: apa yang P.alt sudah ajar — BUKAN esei model atau carian web yang mengganti pengajaran.

WAJIB:
1. "Hai Masa, P.alt," sekali — terus substans dari backbone + episod indeks (boleh sebut "saya ingat" hanya untuk episod tersenarai).
2. SETIAP pilar/konsep yang P.alt tanya — blok berlabel (bukan esei puisi):
   Tentang [pilar/konsep] —
   Bidang: (bab Formula XYZ / meterai — cth. Bab 3 Hukum Alamtologi)
   Definisi/Meterai: (istilah P.alt dari backbone — Pola/Kadar/Pasangan/Keseimbangan, ABA, formula Z, dll.)
   Hubungan Formula: ($Z[x,t²]m$, $x=m/t$, $t_P$, dll. — hanya dari meterai, jangan reka)
   Sintesis: maksimum 2 ayat A+B=C selepas label — bukan ganti label
3. Hukum Z (Bab 3): Pola · Kadar · Pasangan · Keseimbangan — keempat-empatnya, dari meterai PDF + backbone.
4. Carian web HANYA menambah fakta empirikal mapan (Bab 4–5 sains, Planck/NIST) — tidak mengganti Bab 3 Hukum / definisi kerangka.

DILARANG:
- Esei "hukum kehadiran", "bukan hukum fizik makmal", "akui dengan akal adab rasa" tanpa meterai backbone.
- Mencipta ontologi tidak dalam backbone/episod ("substansi berdenyut", "hikmah turun", dll.).
- Mengabaikan [CONSTITUTIONAL BACKBONE] / [P.ALT TEACHING RECORDS] kerana ingatan model.
- Minta P.alt ajar semula bab yang backbone sudah dimuat.
`.trim();
