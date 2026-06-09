/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Universal Voice (Founder policy 2026-06-08)
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
 * Universal voice — student and guest turns:
 * A) No Quran unless the user opened the faith door.
 * Neutral hello — no Bismillah or religious opener from ADAM.
 * Alamtologi/Quran = bloodstream (internal), never the nametag.
 */

import { studentExplicitlyRequestsQuran } from './adam-student-prompts';

/** User explicitly invited faith, Quran, or Islamic framing in this turn. */
export function userOpenedFaithDoor(message: string): boolean {
  return studentExplicitlyRequestsQuran(message);
}

/** User explicitly asked about Alamtologi or the constitutional framework. */
export function userAskedForAlamtologi(message: string): boolean {
  return /\b(alamtologi|framework\s+alamtologi|prinsip\s+tujuh|teori\s+masa\s+bayu|qxk24\s+framework)\b/i.test(
    message,
  );
}

/** Scientist-scholar identity — student substantive turns (not fantasist, not copy-paste). */
export const ADAM_SCIENTIST_SCHOLAR_IDENTITY = `
ADAM — SCIENTIST-SCHOLAR (ilmuan), NOT IMAGINATION:
- You speak with ilmu and scientific facts: mechanisms, statistics, formulas, penemuan — from search hits only.
- Never invent studies, journals, percentages, or authorities. Never poetic fantasy where science is required.
- Deliver like P.alt teaches a student at the table: warm, human, flowing paragraphs — full depth, never a clinical memo or Wikipedia outline.
- Synthesize as a tutor; weave verified facts into prose that breathes — NOT copy-paste from search snippets, NOT numbered syllabus (1. 2. 3.).
- Alamtologi and Quran guide conscience internally (bloodstream) — shape honesty and adab; do not billboard them on science/health answers unless asked.
Example: "Apa punca manusia mengidap diabetes?" → search → jawab mekanisme dalam perenggan mengalir, bukan senarai berangka.
`.trim();

const EXPLANATORY_SCIENCE_ASK =
  /\b(?:apa[kk]?\s+punca|apakah\s+punca|kenapa|mengapa|why\s+(?:do|does)|what\s+(?:causes|cause)|bagaimana\s+(?:berlaku|terjadi)|how\s+does\s+.+\s+(?:happen|occur|work))\b/i;

const HEALTH_SCIENCE_TOPIC =
  /\b(?:diabetes|kencing\s+manis|darah\s+tinggi|hipertensi|jantung|kanser|penyakit|sakit|virus|bakteri|imun|autoimun|metabolik|insulin|glukosa|hormon|genetik|epidemi|stroke|asma|alergi|obesiti|kolesterol|vaksin|jangkitan)\b/i;

/** "Apa punca/kenapa" health or science explanation — tutor prose, not spec sheet. */
export function isExplanatoryScienceQuestion(message: string): boolean {
  const t = message.trim();
  if (!t || isTechnicalPrecisionQuestion(t)) return false;
  if (EXPLANATORY_SCIENCE_ASK.test(t)) return true;
  if (HEALTH_SCIENCE_TOPIC.test(t) && /\b(?:apa|kenapa|mengapa|punca|faktor|risiko|jelaskan|terangkan)\b/i.test(t)) {
    return true;
  }
  return false;
}

export const ADAM_UNIVERSAL_VOICE_POLICY = `
UNIVERSAL VOICE — student and guest (substance; format is STUDENT OUTPUT LAW L1):

You are a scientist-scholar and universal tutor — not a fantasist, not a copy-paste engine.
Depth stays full — never shallow on purpose. Conventional knowledge first; conscience internal; framework labels silent in output.

DEPTH AND EVIDENCE (substantive pipeline):
- User soalan → web search → analisa hits → jawab dengan fakta saintifik lengkap dan kedalaman ilmiah (imiah).
- Include mechanisms, statistics, and formulas WHEN search hits support them — attribute credible sources in plain prose.
- Synthesize as a teacher; never dump raw hit text. Never invent beyond hits.
- Principled perspective after verified facts — never framework labels or sermon performance.

FLOW LIKE WATER (life, emotion, relationships):
- Short paragraphs only (2–4 complete sentences each). One idea per paragraph. Blank line between paragraphs.
- Read aloud naturally — plain BM Malaysia, not poetry performance or lecture headers.
- Never markdown tables, layer matrices (Fizikal/Emosi/Ruhani), emoji section breaks, or numbered ritual scripts on these turns.

TECHNICAL PRECISION (mandatory — all measurable / verifiable topics):
- Specs, dosage, formula, constants, price, statistics, mechanism with numbers, product comparison →
  OPEN with the direct technical answer (numbers, units, table, or verified comparison from web search).
- MUST search before stating precise figures — automotive, medicine, chemistry, physics, biology,
  engineering, electronics, programming APIs, finance rates, or any "berapa / how much / what is the value".
- Do NOT reinterpret product, model, or variant names (trim, Pro, Elite, dosage form) as abstract philosophical concepts.
- Never substitute Hukum Peleraian / MASA / TENAGA sermons for missing km/L, mg, volts, or price figures.
- If search returns no reliable numbers, say so honestly — := 0 SUSPENDED or verified range only; no guessed precision.
- Optional insight in plain prose may follow AFTER the technical answer — brief, never instead of it.

THREE TIERS (see ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE):
- Tier 1 answer first always; tier 2/3 only when the student opts in — optional single-question door after a complete answer, never before.
`.trim();

const TECHNICAL_EMOTIONAL_EXCLUDE =
  /\b(sayang|cinta|sedih|marah|risau|cemas|hati\s+saya|perasaan\s+saya|meaning\s+of\s+life|jiwa\s+saya|broken\s+heart)\b/i;

const LIFE_EMOTION_SIGNAL =
  /\b(?:cemas|anxious|anxiety|risau|gelisah|sedih|marah|putus\s+asa|takut|insomnia|tidur|sleep|stres|stress|overwhelmed|burnout|perasaan|jiwa\s+saya|hati\s+saya|hubungan|pasangan|keluarga|relationship|lonely|sunyi|overthink|susah\s+tidur|tidak\s+boleh\s+tidur|kebimbangan)\b/i;

/** Life / emotion turn — search + analisa + flowing factual prose (not layer tables). */
export function isLifeEmotionTurn(message: string): boolean {
  const t = message.trim();
  if (!t || isTechnicalPrecisionQuestion(t)) return false;
  return LIFE_EMOTION_SIGNAL.test(t);
}

const TECHNICAL_MEASUREMENT_UNITS =
  /\d[\d.,]*\s*(?:v\b|a\b|w\b|hz|mhz|ghz|khz|kg|g\b|mg|ml|l\b|°c|celsius|kelvin|ohm|ω|mbps|gb|tb|mah|kpa|bar|psi|rpm|kw|kwh|μm|mm|cm|m\b|nm\b|ph\b|ppm|mol|kcal|cal\b|iu\b|mmhg|bpm)/i;

/** Dimension words that signal a spec/measurement question (any product or domain). */
const TECHNICAL_DIMENSION =
  /\b(tork|torque|kuasa\s+tork|horsepower|hp\b|ps\b|bhp\b|rpm\b|spesifikasi|specs?|spek\b|dos[a-z]*|dosis|dosage|mg\b|ml\b|kg\b|ph\b|enjin|engine|cc\b|nm\b|watt|mah|voltan|voltage|kapasiti|capacity|resolution|pixel|jisim\s+molar|takat\s+(?:didih|lebur)|fuel\s+consumption|km\/?l|mileage|penjimatan\s+minyak|tekanan\s+darah|protein|kalori|ram\b|storage|api\s+version)\b/i;

/** True when message uses specA/specB shorthand with a dimension token on each side of /. */
export function messageHasSlashSeparatedDimensions(message: string): boolean {
  const slashIdx = message.indexOf('/');
  if (slashIdx === -1) return false;
  const leftToken = message.slice(0, slashIdx).match(/(\S+)\s*$/);
  const rightToken = message.slice(slashIdx + 1).match(/^\s*(\S+)/);
  if (!leftToken?.[1] || !rightToken?.[1]) return false;
  return TECHNICAL_DIMENSION.test(leftToken[1]) && TECHNICAL_DIMENSION.test(rightToken[1]);
}

/** User asked for verifiable technical facts — search mandatory, numbers first. */
export function isTechnicalPrecisionQuestion(message: string): boolean {
  const t = message.trim();
  if (!t) return false;

  // Short spec-only queries (e.g. "tork?", "850cc?", "dos?")
  if (t.length >= 4 && t.length < 8 && TECHNICAL_DIMENSION.test(t)) return true;

  // Dimension shorthand: specA/specB (any domain) — e.g. hp/tork, mg/dos, volt/amp
  if (messageHasSlashSeparatedDimensions(t)) return true;

  if (t.length < 8) return false;

  if (
    /\b(fuel\s+consumption|km\/?l|kml|liter\s+per|mpg|mileage|penjimatan\s+minyak|penggunaan\s+minyak|spesifikasi|specs?|spek\b|berapa\s+liter|consumption|efficiency|horsepower|hp\b|torque|tork|kuasa\s+tork|engine\s+size|dos[a-z]*|dosis|dosage|jisim\s+molar|molar\s+mass|takat\s+(?:didih|lebur)|boiling\s+point|melting\s+point|half[\s-]?life|formula\s+kimia|chemical\s+formula|persamaan|equation|voltan|voltage|ampere|arus|watt|ohm|frekuensi|frequency|tekanan\s+darah|blood\s+pressure|kalori|kcal|protein|glukosa|insulin|enzim|hormon|mitokondria|kapasiti|capacity|resolution|pixel|mahab|storage|ram\b|cpu|gpu|api\s+version|breaking\s+change)\b/i.test(
      t,
    )
  ) return true;

  if (TECHNICAL_MEASUREMENT_UNITS.test(t)) return true;

  // Curiosity + dimension — any product/model name, no brand list
  if (
    /\b(?:nak\s+tahu|ingin\s+tahu|saya\s+nak|want\s+to\s+know|what\s+is\s+the)\b/i.test(t)
    && TECHNICAL_DIMENSION.test(t)
  ) return true;

  // Model/trim/variant language + dimension
  if (
    /\b(model|trim|varian|variant|versi|version|edisi|edition|generasi|generation|elite|exclusive|standard|pro\b|max\b|plus\b)\b/i.test(
      t,
    )
    && TECHNICAL_DIMENSION.test(t)
  ) return true;

  if (
    /\b(harga|price|kos\b|cost|kadar|rate|faedah|interest|inflasi|gdp|cpi)\b/i.test(t)
    && /\b(berapa|how\s+much|current|semasa|hari\s+ini|today|rm\b|usd|percent|peratus|%)\b/i.test(
      t,
    )
  ) return true;

  if (
    /\b(banding|compare|comparison|vs\.?|versus|lebih\s+baik|which\s+is\s+better|perbezaan\s+antara)\b/i.test(
      t,
    )
    && /\b(spec|spek|spesifikasi|enjin|engine|dos|mg|watt|km|liter|model|trim|versi|version)\b/i.test(
      t,
    )
  ) return true;

  if (!TECHNICAL_EMOTIONAL_EXCLUDE.test(t)) {
    if (
      /\b(?:berapa|berapakah|how\s+many|how\s+much|what\s+is\s+the\s+(?:value|rate|dose|dosage|capacity|voltage|current|temperature|pressure|mass|weight|speed|frequency|torque|power))\b/i.test(
        t,
      )
      && /\b(volt|watt|amp|dos|kg|mg|ml|liter|cc|hp|nm|suhu|tekanan|harga|kos|jarak|kelajuan|kapasiti|ram|storage|battery|pixel|mhz|ghz|ph|molar|calori|kalori|protein|karbohidrat|gejala|rawatan|enzim|formula|spek|spesifikasi|torque|kuasa|tork)\b/i.test(
        t,
      )
    ) return true;
  }

  if (
    /\b(?:bagaimana|how\s+does|how\s+do|macam\s+mana)\b/i.test(t)
    && /\b(enzim|motor|enjin|transmisi|circuit|litar|api|protein|vaksin|router|dns|tcp|http|photosynthesis|fotosintesis|electrolysis|elektrolisis|turbo|karburator|bateri|sel\s+surya|panel\s+solar|inverter|transformer|transistor|pcr|crispr|mitosis|meiosis|penicillin|antibiotik)\b/i.test(
      t,
    )
  ) return true;

  return false;
}

/** @deprecated Use isTechnicalPrecisionQuestion */
export function isFactualSpecificationQuestion(message: string): boolean {
  return isTechnicalPrecisionQuestion(message);
}

/** Neutral context-bridge acks — students must not echo Bismillah from internal context. */
export const STUDENT_NEUTRAL_CONTEXT_ACKS = {
  anchor:
    'Understood. I am ADAM — ready to speak with you clearly, warmly, and in plain language.',
  epistemic:
    'Understood. I will answer honestly and warmly — without system jargon or framework labels.',
  longTerm: 'I have the conversation context. Ready to respond.',
  shortTerm: 'Session digest integrated for this turn.',
  working: 'Recent messages loaded.',
  sessionHistory: 'Session history is in context for this turn — not memory, current context.',
  language: 'I will reply in the language set for this turn.',
  quranCorpus:
    'Verified ayat received. I will quote only from this corpus, without tafsir in brackets.',
} as const;
