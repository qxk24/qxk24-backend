/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Web Search Config
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * Updated     : 2026-06-05 — student-specific search prompt; citation honesty
 * ============================================================
 */

import { ENV } from '../config/environments';
import { parseQuranAyahRefs } from '../quran/quran-ayah-parser';
import { resolveTechnicalPrecisionTurn } from './adam-factual-grounding';
import { ADAM_CHAT_MATH_NOTATION } from './adam-math-prompt';

// ── Explicit user request to search ─────────────────────────────────────────
const EXPLICIT_WEB_SEARCH =
  /\b(cuba\s+search|carian\s+web|search\s+the\s+web|web\s+search|google|mencari\s+(?:di\s+)?internet|search\s+online|search\s+tentang)\b/i;

// ── Pure greeting — no search needed ────────────────────────────────────────
const GREETING_ONLY =
  /^(salam|assalamu|waalaikum|bismillah|hi|hello|terima\s+kasih|thank\s+you|syukran|good\s+(morning|afternoon|evening|night))\b/i;

// ── Pure opinion / reflection — no external data needed ─────────────────────
const PURE_REFLECTION =
  /^(apa\s+pendapat|apa\s+pandangan|apa\s+perasaan|what\s+do\s+you\s+think|how\s+do\s+you\s+feel|tell\s+me\s+about\s+yourself|siapa\s+kamu|who\s+are\s+you)\b/i;

// ── Founder comparing own in-session teaching ────────────────────────────────
const FOUNDER_OWN_TEACHING =
  /\b(banding|bandingkan|compare|comparison)\b/i;
const FOUNDER_SESSION_REF =
  /\b(saya|p\.?alt|panduan|penjelasan|teaching|mengajar|dalam\s+sesi|tadi|just\s+now|earlier)\b/i;

const SEARCH_WHEN_TO = `
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

const CITATION_HONESTY = `
CITATION HONESTY — mandatory whenever you cite external research:
- Cite ONLY sources that actually appeared in your search results
- NEVER invent journal names, volume/issue numbers, author lists, or study statistics
- NEVER fabricate Harvard, Nature, Lancet, WHO, or Max Planck citations with made-up details
- If search returned nothing useful, say so honestly — do not fill the gap with invented studies
- If year or domain was not in the search result, omit it — do not guess
- Format when fields are known: [Source: Title — domain.com, Year]
`.trim();

const FOUNDER_TEACHING_SEARCH_INSTRUCTION = `
YOUR WEB SEARCH (founder teaching absorption — P.alt tests your breadth):

${SEARCH_WHEN_TO}

WHEN TO SEARCH (teaching absorption):
- P.alt shared a bab or teaching upload — search for conventional knowledge on its topics
- Health, environment, economy, technology, ethics, education, psychology, policy — whatever the bab covers
- Search even if P.alt's typed message is short — the upload carries the topic

HOW TO USE SEARCH RESULTS (teaching absorption):
- Part 1: What you understood from P.alt's bab — learner voice, plain Malay
- Part 2: On those same specific points — what research or policy says; tie back to his themes, not a new topic
- Then STOP — no section label, no generic last-sentence closer (no "Namun, dalam konteks konvensional…")
- Cite only what search returned — never invent journals or statistics
- Do NOT lecture P.alt on Alamtologi — show your knowledge is wide, not that you can remap his bab to a system

${CITATION_HONESTY}
`.trim();

const FOUNDER_TEACHING_SYNTHESIS_SEARCH_INSTRUCTION = `
YOUR WEB SEARCH (founder teaching SYNTHESIS — mandatory this turn):

P.alt asked for **rigorous conventional scientific codes** plus real-world issues — while Alamtologi terms stay unchanged.
You MUST search — do not answer from memory alone for equations, open problems, statistics, or current events.

${SEARCH_WHEN_TO}

WHAT TO SEARCH (synthesis — run multiple searches if needed):
- Standard models and notation: Friedmann equations, Λ-CDM, H₀, entropy, Shannon diversity, neural development stages, DNA/RNA central dogma, chemical equilibrium, coupled dynamical systems
- Named unsolved problems and method limits: cosmological constant problem, measurement problem, origin of life, hard problem of consciousness, dark matter/energy nature, limitations of equilibrium thermodynamics for living systems
- Peer-reviewed or institutional sources on the same topics as P.alt's bab (Formula XYZ, Faktor X/Y/Z)
- Current real-world data: IPBES, NASA, WHO, UNESCO, Planck, COP reports — only cite what search returns

HOW TO USE SEARCH RESULTS (synthesis):
- Keep P.alt's Alamtologi labels (Y, Z, X, PL, PG, Pola, Kadar, …) — never replace them
- Add beside each: conventional equations, theory names, parameter symbols, and where the method or formula fails or remains open
- Then: real-world issue with verified data from search
- NEVER invent journal names, volume numbers, or statistics not in search results
- Formulas: write as $$...$$ (display) or $...$ (inline) — never \\[...\\] or \\(...\\) delimiters; never wrap $$ in [ ] square brackets
- ${ADAM_CHAT_MATH_NOTATION}
- Do NOT write a plain popular-science summary — write for scientific recognition

${CITATION_HONESTY}
`.trim();

const FOUNDER_SEARCH_INSTRUCTION = `
YOUR WEB SEARCH (DashScope agent mode — you decide when to search):

${SEARCH_WHEN_TO}

HOW TO USE SEARCH RESULTS (founder turn):
- Cite your sources clearly: title, domain, and year only if search provided them
- Present the data first, then offer the Quranic or Alamtologi perspective if relevant
- If search results contradict each other, note it honestly
- If search results align with Quran, say so with confidence
- If search results conflict with Quran, explain the difference with adab — the Quran holds

${CITATION_HONESTY}
`.trim();

const STUDENT_TECHNICAL_PRECISION_SEARCH = `
TECHNICAL PRECISION — UNIVERSAL (student — mandatory this turn):
- MUST search before ANY precise number, formula, dosage, spec, rate, or comparison — every domain, every product.
- Search results govern. Memory, trim names, model labels, and analogy never substitute for verified figures.
- Answer structure: direct figure with units → table/bullets if comparing → source domain/title from search only.
- Trim/variant/package names ≠ different engineering unless search proves it (cars, phones, drugs, APIs — same rule).
- If search is thin: := 0 SUSPENDED or honest range — never "mungkin sekitar" + invented precision.
- NEVER invent bulletins, report numbers, journal Vol./Issue, or "official document" IDs.
`.trim();

const STUDENT_SEARCH_INSTRUCTION = `
YOUR WEB SEARCH (student turn — DashScope agent mode — you decide when to search):

${SEARCH_WHEN_TO}

HOW TO USE SEARCH RESULTS (student turn — Layer 5):
- Answer with verified facts from search — mechanisms, data, named studies only when search returned them
- Shape delivery by student state (Baligha for ready technical questions, Maysura when overwhelmed)
- Alamtologi in plain prose when it clarifies — ADAM's synthesis, not P.alt copy-paste
- Quran when topic warrants — natural weave; omit on pure code/technique or tanpa Quran
- NEVER invent journal names, Vol./Issue, or statistics not in search results
- FORBIDDEN openers: "lensa Alamtologi", "Dari perspektif Alamtologi", "Dalam cara P.alt Masa Bayu ajarkan"
- Simple greeting or thank-you — no search layer needed
- ${ADAM_CHAT_MATH_NOTATION}

${CITATION_HONESTY}
`.trim();

const STUDENT_TECHNICAL_PRECISION_SEARCH_INSTRUCTION = `
YOUR WEB SEARCH (student turn — TECHNICAL PRECISION — search is MANDATORY this turn):

You MUST run web search before stating any precise technical figure, formula, dosage, spec, rate, or comparison.
Do NOT answer technical questions from memory alone — search first, numbers second, insight last.

${STUDENT_TECHNICAL_PRECISION_SEARCH}

${SEARCH_WHEN_TO}

HOW TO USE SEARCH RESULTS (technical precision turn — universal):
- Open with verified numbers and units from search — table or bullets
- Same rule for every product: variant names describe equipment unless search proves different specs underneath
- If search is inconclusive, say so — verified range only, never invented precision or fabricated document IDs
- ${ADAM_CHAT_MATH_NOTATION}

${CITATION_HONESTY}
`.trim();

/** Whether search is enabled globally via env config */
export function adamWebSearchEnabled(): boolean {
  return ENV.QWEN_ENABLE_SEARCH;
}

/** @deprecated Use adamWebSearchEnabled */
export const founderWebSearchEnabled = adamWebSearchEnabled;

export function getAdamWebSearchPrompt(
  isFounder = true,
  options?: {
    founderTeachingSynthesis?: boolean;
    userMessage?: string;
    recentUserMessages?: string[];
  },
): string {
  if (!isFounder) {
    const msg = options?.userMessage?.trim() ?? '';
    const recent = options?.recentUserMessages ?? [];
    if (msg && resolveTechnicalPrecisionTurn(msg, recent).isActive) {
      return STUDENT_TECHNICAL_PRECISION_SEARCH_INSTRUCTION;
    }
    return STUDENT_SEARCH_INSTRUCTION;
  }
  if (options?.founderTeachingSynthesis) return FOUNDER_TEACHING_SYNTHESIS_SEARCH_INSTRUCTION;
  return FOUNDER_SEARCH_INSTRUCTION;
}

/** @deprecated Use getAdamWebSearchPrompt */
export const getFounderWebSearchPrompt = getAdamWebSearchPrompt;

/** DashScope search_options passed to API */
export function buildQwenSearchOptions(forcedSearch = false): Record<string, unknown> {
  const options: Record<string, unknown> = {
    search_strategy: ENV.QWEN_SEARCH_STRATEGY,
    forced_search:   forcedSearch,
  };
  if (ENV.QWEN_SEARCH_ENABLE_CITATION) {
    options.enable_citation = true;
  }
  return options;
}

/**
 * Gate web search per turn.
 *
 * Philosophy: ADAM should search on almost every factual question.
 * Real data makes every answer stronger and more trustworthy.
 * Only skip search for greetings, pure reflection, Quran references,
 * and founder comparing their own in-session teaching.
 */
export function getWebSearchGateReason(
  message: string,
  options?: {
    isFounder?: boolean;
    hasTeachingUpload?: boolean;
    founderTeachingSynthesis?: boolean;
    /** Short reply continuing a technical thread (e.g. "850cc?", "Exclusive pula?"). */
    technicalFollowUp?: boolean;
  },
): string | null {
  if (!adamWebSearchEnabled()) return null;

  if (options?.founderTeachingSynthesis) {
    return options.hasTeachingUpload
      ? 'founder_teaching_synthesis_upload'
      : 'founder_teaching_synthesis';
  }

  if (options?.isFounder && options?.hasTeachingUpload) {
    return 'founder_teaching_upload';
  }

  const text = message.trim();
  if (!text) return null;

  // Always search if explicitly requested
  if (EXPLICIT_WEB_SEARCH.test(text)) return 'explicit_search';

  if (options?.technicalFollowUp) return 'technical_follow_up';

  // Skip: too short to be factual
  if (text.length < 8) return null;

  // Skip: pure greeting
  if (GREETING_ONLY.test(text)) return null;

  // Skip: Quran ayah reference — use corpus instead
  if (parseQuranAyahRefs(text).length > 0) return null;

  // Skip: pure personal reflection question
  if (PURE_REFLECTION.test(text)) return null;

  // Skip: founder comparing their own in-session teaching
  if (
    options?.isFounder &&
    FOUNDER_OWN_TEACHING.test(text) &&
    FOUNDER_SESSION_REF.test(text)
  ) return null;

  // Everything else — search
  // Real data always makes ADAM's answer more credible and trustworthy
  return 'factual_question';
}

export function shouldEnableWebSearchForMessage(message: string): boolean {
  return getWebSearchGateReason(message) !== null;
}
