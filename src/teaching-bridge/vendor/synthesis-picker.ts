/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Teaching Bridge — Synthesis Picker
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

const MALAY_MARKERS =
  /\b(dan|adalah|apabila|bukan|yang|dalam|dengan|untuk|ialah|sebagai|menjadi|melalui|kepada|Allah|Quran|fitrah|fitra|iman|aql|tawakkul|rizq|amal|maqasid|pengiktirafan|bukanlah|dua|fakulti)\b/i;

const ENGLISH_ADAM_META = /^Bismillahirrahmanirrahim\.\s*ADAM has become/i;

/** Founder teaching in BM — prefer for crystallisation card and knowledge unit C */
export function isMalayTeaching(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return false;
  if (ENGLISH_ADAM_META.test(t)) return false;

  const malayHits = (t.match(MALAY_MARKERS) ?? []).length;
  const englishHits = (
    t.match(/\b(the|is|as|not|and|or|in|of|to|for|with|recognition|acquisition|becomes|through)\b/i)
    ?? []
  ).length;

  return malayHits >= 2 && malayHits > englishHits;
}

export interface PickedSynthesis {
  synthesis: string;
  adamReflection?: string;
}

/** Card + knowledge-graph C: Malay founder teaching when present; ADAM English kept separately */
export function pickCrystallisationSynthesis(
  founderTeaching: string,
  adamOutcome: string,
): PickedSynthesis {
  const founder = founderTeaching.trim();
  const adam = adamOutcome.trim();

  if (founder.length >= 20 && isMalayTeaching(founder)) {
    return {
      synthesis: founder,
      adamReflection: adam && adam !== founder ? adam : undefined,
    };
  }

  return { synthesis: adam || founder };
}

export function enrichCrystallisedUnitDisplay(
  founderTeaching: string,
  currentSynthesis: string,
): {
  synthesis: string;
  founderTeaching: string;
  adamReflection?: string;
} {
  const picked = pickCrystallisationSynthesis(founderTeaching, currentSynthesis);
  return {
    founderTeaching,
    synthesis: picked.synthesis,
    adamReflection: picked.adamReflection,
  };
}
