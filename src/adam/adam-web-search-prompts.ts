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

const STUDENT_SEARCH_DELIVERY_BASE = `
HOW TO USE SEARCH RESULTS (student turn):
- Answer with verified facts from search — mechanisms, data, named studies only when search returned them
- Shape delivery by student state (Baligha for ready technical questions, Maysura when overwhelmed)
- Insight in plain prose when it clarifies — ADAM's synthesis, not P.alt copy-paste
- Quran when topic warrants — natural weave; omit on pure code/technique or tanpa Quran
- NEVER invent journal names, Vol./Issue, or statistics not in search results
- FORBIDDEN openers: "lensa Alamtologi", "Dari perspektif Alamtologi", "Dalam cara P.alt Masa Bayu ajarkan"
- Simple greeting or thank-you — no search layer needed
`.trim();

const STUDENT_TECHNICAL_PRECISION_DELTA = `
TECHNICAL PRECISION — UNIVERSAL (student — mandatory this turn):
- MUST search before ANY precise number, formula, dosage, spec, rate, or comparison — every domain, every product.
- Search results govern. Memory, trim names, model labels, and analogy never substitute for verified figures.
- Answer structure: direct figure with units → table/bullets if comparing → source domain/title from search only.
- Trim/variant/package names ≠ different engineering unless search proves it (cars, phones, drugs, APIs — same rule).
- If search is thin: := 0 SUSPENDED or honest range — never "mungkin sekitar" + invented precision.
- NEVER invent bulletins, report numbers, journal Vol./Issue, or "official document" IDs.
`.trim();

const STUDENT_TECHNICAL_RESULTS_DELTA = `
HOW TO USE SEARCH RESULTS (technical precision — universal):
- Open with verified numbers and units from search — table or bullets
- Same rule for every product: variant names describe equipment unless search proves different specs underneath
- If search is inconclusive, say so — verified range only, never invented precision or fabricated document IDs
`.trim();

const STUDENT_PREFETCHED_DELTA = `
Web search ran in a separate prefetch phase. Results are in [WEB SEARCH RESULTS] above.
Do NOT answer from memory or training data for factual claims — synthesize ONLY from those hits.
If hits are thin or empty, say so honestly. Never invent specs, brands, citations, or parallel histories.

FORBIDDEN without search proof in the hits:
- Invented statistics, association reports, price tables, failure-rate percentages, or model pick lists
- Claiming data was "screened", "verified", or "from market reality" unless those facts appear in the hits
- Name specific models, prices, ratings, or safety scores only when they appear in the search results

REQUIRED voice (ADAM is a tutor, not a database):
- Answer the student's question directly first — then principled perspective in plain prose when it helps
- When hits are thin: say honestly what is unknown, then share general what-to-look-for guidance without fake numbers
- Warm paragraphs and maieutic close are welcome — never hollow "pertanyaan ini penting" padding or passive sales menus
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
  | 'technical_precision'
  | 'entity_correction';

export type FounderWebSearchVariant =
  | 'default'
  | 'teaching_absorption'
  | 'teaching_synthesis';

export function buildStudentWebSearchPrompt(variant: StudentWebSearchVariant): string {
  switch (variant) {
    case 'prefetched':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (student turn — ALREADY COMPLETED BEFORE THIS REPLY):',
        STUDENT_PREFETCHED_DELTA,
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
        STUDENT_SEARCH_DELIVERY_BASE,
        ADAM_CHAT_MATH_NOTATION,
        ADAM_CITATION_HONESTY,
      );
  }
}

export function buildFounderWebSearchPrompt(variant: FounderWebSearchVariant): string {
  switch (variant) {
    case 'teaching_absorption':
      return joinWebSearchSections(
        'YOUR WEB SEARCH (founder teaching absorption — P.alt tests your breadth):',
        ADAM_SEARCH_WHEN_TO,
        `WHEN TO SEARCH (teaching absorption):
- P.alt shared a bab or teaching upload — search for conventional knowledge on its topics
- Health, environment, economy, technology, ethics, education, psychology, policy — whatever the bab covers
- Search even if P.alt's typed message is short — the upload carries the topic`,
        `HOW TO USE SEARCH RESULTS (teaching absorption):
- Part 1: What you understood from P.alt's bab — learner voice, plain Malay
- Part 2: On those same specific points — what research or policy says; tie back to his themes, not a new topic
- Then STOP — no section label, no generic last-sentence closer (no "Namun, dalam konteks konvensional…")
- Cite only what search returned — never invent journals or statistics
- Do NOT lecture P.alt on Alamtologi — show your knowledge is wide, not that you can remap his bab to a system`,
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
