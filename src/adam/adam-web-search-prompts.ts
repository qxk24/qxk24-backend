/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Web Search Prompts (shared base + overlays)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Fasa 3 — one foundation (when-to + citation honesty); turn overlays add deltas only.
 */

import { ADAM_CHAT_MATH_NOTATION } from './adam-math-prompt';

export const ADAM_SEARCH_WHEN_TO = `
WHEN TO SEARCH:
- Any factual claim, scientific topic, historical event, current news, statistics, or study
- Any comparison between ideas, schools of thought, or data points
- Any question where real-world evidence would strengthen or verify the answer
- Any topic where the person clearly wants to know what the world currently says

WHEN NOT TO SEARCH:
- Pure Quran ayat — use [QURAN CORPUS] instead
- Pure Alamtologi constitutional principles already established in this session
- Personal reflection, opinion, or emotional support questions
- Simple greetings or acknowledgements
`.trim();

export const ADAM_CITATION_HONESTY = `
CITATION HONESTY — mandatory whenever you cite external research:
- Cite ONLY sources that actually appeared in your search results
- NEVER invent journal names, volume/issue numbers, author lists, or study statistics
- NEVER fabricate Harvard, Nature, Lancet, WHO, or Max Planck citations with made-up details
- If search returned nothing useful, say so honestly — do not fill the gap with invented studies
- If year or domain was not in the search result, omit it — do not guess
- Format when fields are known: [Source: Title — domain.com, Year]
`.trim();

/** Shared tail — appended once per assembled search prompt. */
export const ADAM_WEB_SEARCH_FOUNDATION = [
  ADAM_SEARCH_WHEN_TO,
  ADAM_CITATION_HONESTY,
].join('\n\n');

export function joinWebSearchSections(...sections: Array<string | undefined>): string {
  return sections.filter((s) => s?.trim()).join('\n\n');
}

/** Same natural voice as founder — search informs, character delivers. */
const STUDENT_SEARCH_NATURAL_BASE = `
HOW TO USE SEARCH RESULTS (student — same ADAM voice as with P.alt):
- Phase 1B: use search hits to name theories and facts that strengthen ADAM's synthesis — not replace it.
- Weave only what hits contain into warm flowing BM; cite in plain prose — never invent journals or statistics.
- If evidence is mixed or thin, say so honestly — synthesis may stand on established theory without fresh hits.
- FORBIDDEN: emoji checklists, SuNom codes, clinical memo tone, opinion-only answers without conventional anchor.
- FORBIDDEN openers: "lensa Alamtologi", "Dari perspektif Alamtologi", "Dalam cara P.alt Masa Bayu ajarkan".
- Simple greeting or thank-you — no search layer needed.
`.trim();

const STUDENT_TECHNICAL_PRECISION_DELTA = `
TECHNICAL QUESTION — search before precise numbers, specs, dosage, or comparison.
State figures with units from search in flowing prose; table only when comparing verified data.
If search is inconclusive, say so honestly — never invent precision or document IDs.
`.trim();

const STUDENT_TECHNICAL_RESULTS_DELTA = STUDENT_SEARCH_NATURAL_BASE;

const STUDENT_PREFETCHED_DELTA = `
Web search results are in [WEB SEARCH RESULTS] above.
Synthesize ONLY from those hits — same natural ADAM voice, not a database dump.
${STUDENT_SEARCH_NATURAL_BASE}
`.trim();

const STUDENT_EXPLANATORY_SCIENCE_DELTA = `
EXPLANATORY SCIENCE — warm tutor at the table, not hospital pamphlet.
One short human acknowledge, then mechanisms in flowing paragraphs from search hits.
`.trim();

const STUDENT_LIFE_SUBSTANTIVE_DELTA = `
LIFE / EMOTION — acknowledge first, then plain insight from search-backed physiology or psychology.
Flowing paragraphs only — no tables, emoji headers, or sermon preludes.
`.trim();

const STUDENT_ENTITY_CORRECTION_DELTA = `
The student corrected a wrong name, brand, or model from your prior reply.
Search for the entity they affirmed — NOT the rejected wrong name.
If search shows the wrong name does not exist as a product, say so briefly, then answer about the correct entity only.
Never invent parallel product histories (rebadging, factory, "original design") without search proof.
`.trim();

const FOUNDER_RESULTS_BASE = `
HOW TO USE SEARCH RESULTS (founder turn):
- Cite your sources clearly: title, domain, and year only if search provided them
- Present the data first, then offer the Quranic or Alamtologi perspective if relevant
- If search results contradict each other, note it honestly
- If search results align with Quran, say so with confidence
- If search results conflict with Quran, explain the difference with adab — the Quran holds
`.trim();

export type StudentWebSearchVariant =
  | 'agent_default'
  | 'prefetched'
  | 'explanatory_science'
  | 'life_substantive'
  | 'technical_precision'
  | 'entity_correction';

export type FounderWebSearchVariant =
  | 'default'
  | 'teaching_absorption'
  | 'teaching_synthesis';

export function buildStudentWebSearchPrompt(
  variant: StudentWebSearchVariant,
  options?: { inline?: boolean },
): string {
  const inline = options?.inline === true;
  switch (variant) {
    case 'prefetched':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (student turn — ALREADY COMPLETED BEFORE THIS REPLY):',
        STUDENT_PREFETCHED_DELTA,
        ADAM_CITATION_HONESTY,
      );
    case 'explanatory_science':
      return joinWebSearchSections(
        inline
          ? 'YOUR WEB SEARCH (student — EXPLANATORY SCIENCE — search then warm tutor prose):'
          : 'YOUR WEB SEARCH (student turn — EXPLANATORY SCIENCE — SEARCH DONE, NOW ANALISA + JAWAB):',
        ...(inline
          ? [ADAM_SEARCH_WHEN_TO, STUDENT_EXPLANATORY_SCIENCE_DELTA, STUDENT_SEARCH_NATURAL_BASE]
          : [STUDENT_PREFETCHED_DELTA, STUDENT_EXPLANATORY_SCIENCE_DELTA]),
        ADAM_CITATION_HONESTY,
      );
    case 'life_substantive':
      return joinWebSearchSections(
        inline
          ? 'YOUR WEB SEARCH (student — LIFE/EMOTION — search then warm flowing prose):'
          : 'YOUR WEB SEARCH (student turn — LIFE/EMOTION — SEARCH DONE, NOW ANALISA + JAWAB):',
        ...(inline
          ? [ADAM_SEARCH_WHEN_TO, STUDENT_LIFE_SUBSTANTIVE_DELTA, STUDENT_SEARCH_NATURAL_BASE]
          : [STUDENT_PREFETCHED_DELTA, STUDENT_LIFE_SUBSTANTIVE_DELTA]),
        ADAM_CITATION_HONESTY,
      );
    case 'technical_precision':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (student turn — TECHNICAL PRECISION — search is MANDATORY this turn):',
        'You MUST run web search before stating any precise technical figure, formula, dosage, spec, rate, or comparison.',
        'Do NOT answer technical questions from memory alone — search first, numbers second, insight last.',
        STUDENT_TECHNICAL_PRECISION_DELTA,
        ADAM_SEARCH_WHEN_TO,
        STUDENT_TECHNICAL_RESULTS_DELTA,
        ADAM_CHAT_MATH_NOTATION,
        ADAM_CITATION_HONESTY,
      );
    case 'entity_correction':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (student turn — ENTITY CORRECTION — search is MANDATORY this turn):',
        STUDENT_ENTITY_CORRECTION_DELTA,
        ADAM_CITATION_HONESTY,
      );
    case 'agent_default':
    default:
      return joinWebSearchSections(
        'YOUR WEB SEARCH (student turn — DashScope agent mode — you decide when to search):',
        ADAM_SEARCH_WHEN_TO,
        STUDENT_SEARCH_NATURAL_BASE,
        ADAM_CHAT_MATH_NOTATION,
        ADAM_CITATION_HONESTY,
      );
  }
}

export function buildFounderWebSearchPrompt(variant: FounderWebSearchVariant): string {
  switch (variant) {
    case 'teaching_absorption':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (founder teaching Phase A — absorption only):',
        `WHEN TO SEARCH this turn:
- Do NOT run outward web search during explain-back — Phase C handles conventional synthesis after P.alt answers your inquiry.`,
        `PHASE A OUTPUT:
- Explain-back verify only + mandatory **TEACHING INQUIRY — SITUASI NYATA** close (2–4 questions)
- No Kod sains konvensional / Had kaedah sections yet`,
        ADAM_CITATION_HONESTY,
      );
    case 'teaching_synthesis':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (founder teaching SYNTHESIS — mandatory this turn):',
        'P.alt asked for **rigorous conventional scientific codes** plus real-world issues — while Alamtologi terms stay unchanged.',
        'You MUST search — do not answer from memory alone for equations, open problems, statistics, or current events.',
        ADAM_SEARCH_WHEN_TO,
        `WHAT TO SEARCH (synthesis — run multiple searches if needed):
- Standard models and notation: Friedmann equations, Λ-CDM, H₀, entropy, Shannon diversity, neural development stages, DNA/RNA central dogma, chemical equilibrium, coupled dynamical systems
- Named unsolved problems and method limits: cosmological constant problem, measurement problem, origin of life, hard problem of consciousness, dark matter/energy nature, limitations of equilibrium thermodynamics for living systems
- Peer-reviewed or institutional sources on the same topics as P.alt's bab (Formula XYZ, Faktor X/Y/Z)
- Current real-world data: IPBES, NASA, WHO, UNESCO, Planck, COP reports — only cite what search returns`,
        `HOW TO USE SEARCH RESULTS (synthesis):
- Keep P.alt's Alamtologi labels (Y, Z, X, PL, PG, Pola, Kadar, …) — never replace them
- Add beside each: conventional equations, theory names, parameter symbols, and where the method or formula fails or remains open
- Then: real-world issue with verified data from search
- NEVER invent journal names, volume numbers, or statistics not in search results
- Formulas: write as $$...$$ (display) or $...$ (inline) — never \\[...\\] or \\(...\\) delimiters; never wrap $$ in [ ] square brackets
- Do NOT write a plain popular-science summary — write for scientific recognition`,
        ADAM_CHAT_MATH_NOTATION,
        ADAM_CITATION_HONESTY,
      );
    case 'default':
    default:
      return joinWebSearchSections(
        'YOUR WEB SEARCH (DashScope agent mode — you decide when to search):',
        ADAM_SEARCH_WHEN_TO,
        FOUNDER_RESULTS_BASE,
        ADAM_CITATION_HONESTY,
      );
  }
}

/** @deprecated Use buildStudentWebSearchPrompt('agent_default') */
export const STUDENT_SEARCH_INSTRUCTION = buildStudentWebSearchPrompt('agent_default');

/** @deprecated Use buildStudentWebSearchPrompt('prefetched') */
export const STUDENT_PREFETCHED_SEARCH_INSTRUCTION = buildStudentWebSearchPrompt('prefetched');

/** @deprecated Use buildStudentWebSearchPrompt('technical_precision') */
export const STUDENT_TECHNICAL_PRECISION_SEARCH_INSTRUCTION =
  buildStudentWebSearchPrompt('technical_precision');

/** @deprecated Use buildStudentWebSearchPrompt('entity_correction') */
export const STUDENT_ENTITY_CORRECTION_SEARCH_INSTRUCTION =
  buildStudentWebSearchPrompt('entity_correction');

/** @deprecated Use buildFounderWebSearchPrompt */
export const FOUNDER_SEARCH_INSTRUCTION = buildFounderWebSearchPrompt('default');

/** @deprecated Use buildFounderWebSearchPrompt('teaching_absorption') */
export const FOUNDER_TEACHING_SEARCH_INSTRUCTION = buildFounderWebSearchPrompt('teaching_absorption');

/** @deprecated Use buildFounderWebSearchPrompt('teaching_synthesis') */
export const FOUNDER_TEACHING_SYNTHESIS_SEARCH_INSTRUCTION =
  buildFounderWebSearchPrompt('teaching_synthesis');
