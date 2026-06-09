/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Student Output Law (L1)
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
 * Canonical L1 output rules for student turns — single source.
 * Prompt blocks elsewhere must not repeat these rules; reference L1 only.
 * Runtime guards mirror this module (Fasa 4).
 */

import { ADAM_CHAT_MATH_NOTATION } from './adam-math-prompt';
import { paragraphIsThreeTierDoorOffer } from './adam-three-tier-knowledge';

/** Pronouns forbidden in student-facing output — shared with guards (Fasa 4). */
export const STUDENT_FORBIDDEN_PRONOUNS = ['kau', 'kamu', 'engkau', 'aku'] as const;

export type StudentForbiddenPronoun = (typeof STUDENT_FORBIDDEN_PRONOUNS)[number];

/** Second-person pronouns (excludes aku — replaced with saya, not stripped). */
export const STUDENT_FORBIDDEN_ADDRESS_PRONOUNS = STUDENT_FORBIDDEN_PRONOUNS.filter(
  (p): p is Exclude<StudentForbiddenPronoun, 'aku'> => p !== 'aku',
);

const FORBIDDEN_PRONOUN_LIST = STUDENT_FORBIDDEN_PRONOUNS.join(', ');

/** Regex alternation for guard patterns — `kau|kamu|engkau` or full list. */
export function studentForbiddenPronounAlternation(includeAku = false): string {
  const list = includeAku ? STUDENT_FORBIDDEN_PRONOUNS : STUDENT_FORBIDDEN_ADDRESS_PRONOUNS;
  return [...list].join('|');
}

export function buildStudentForbiddenPronounRegex(flags = 'gi'): RegExp {
  return new RegExp(`\\b(?:${studentForbiddenPronounAlternation(true)})\\b`, flags);
}

const ADDRESS_PRONOUN_PHRASE_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  [/Apa[kk]ah\s+yang\s+ingin\s+(?:kau|kamu|engkau)\s+kongsikan/gi, 'Apa yang ingin dikongsi'],
  [/Apa[kk]ah\s+yang\s+ingin\s+(?:kau|kamu|engkau)\b/gi, 'Apa yang ingin dikongsi'],
  [/Apa\s+yang\s+paling\s+ingin\s+(?:kau|kamu|engkau)\s+kembangkan/gi, 'Apa yang ingin dikembangkan seterusnya'],
  [/Apa\s+yang\s+ingin\s+(?:kau|kamu|engkau)\s+kongsikan/gi, 'Apa yang ingin dikongsi'],
];

/** Post-stream pronoun sync — mirrors §1 BAHASA REGISTER (L1). */
export function sanitizeStudentForbiddenPronouns(text: string): string {
  let out = text;
  for (const [pattern, replacement] of ADDRESS_PRONOUN_PHRASE_FIXES) {
    out = out.replace(pattern, replacement);
  }
  out = out.replace(/\baku\b/gi, (match) => (match[0] === 'A' ? 'Saya' : 'saya'));
  out = out.replace(
    new RegExp(`\\b(?:${studentForbiddenPronounAlternation(false)})\\b`, 'gi'),
    '',
  );
  // Horizontal whitespace only — never collapse paragraph breaks (\n\n).
  return out
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/ +([.,!?;:])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

export function paragraphHasForbiddenStudentPronoun(paragraph: string): boolean {
  return buildStudentForbiddenPronounRegex('i').test(paragraph);
}

/** Seven constitutional principle names — uppercase in student output = framework billboard. */
export const STUDENT_CONSTITUTIONAL_PRINCIPLE_TOKENS = [
  'MASA', 'TENAGA', 'IZWA', 'RUANG', 'AIR', 'API', 'BUMI', 'CAHAYA',
] as const;

const CONSTITUTIONAL_PRINCIPLE_REGEX = new RegExp(
  `\\b(?:${STUDENT_CONSTITUTIONAL_PRINCIPLE_TOKENS.join('|')})\\b`,
);

/** Alamtologi seven-principle leak — guards mirror §3 (unless student asked for framework). */
export function paragraphIsConstitutionalFrameworkLeak(paragraph: string): boolean {
  if (/\b(?:titik\s+pertemuan|Hukum\s+Peleraian|ritual\s+penyelarasan)\b/i.test(paragraph)) {
    return true;
  }
  if (/\bpeka\s+terhadap\s+MASA\b/i.test(paragraph)) return true;
  return CONSTITUTIONAL_PRINCIPLE_REGEX.test(paragraph);
}

/** Faith sermon / doa ritual when user did not open the faith door. */
export function paragraphIsUnsolicitedFaithSermon(paragraph: string): boolean {
  if (/\bBismillah(?:irahmanirrahim)?\b/i.test(paragraph)) return true;
  if (/\bYa\s+ALLAH\b/i.test(paragraph)) return true;
  if (/\bALLAH\b/i.test(paragraph)) return true;
  if (/\b(?:Dia yang Maha|mengingati Dia)\b/i.test(paragraph)) return true;
  if (/\b(?:zikir|syaitan|bisikan)\b/i.test(paragraph)) return true;
  if (/\bpenyerahan\s+tiga\s+waktu\b/i.test(paragraph)) return true;
  if (/\bsecara\s+ruhani\b/i.test(paragraph)) return true;
  if (/\bRuhani\b/i.test(paragraph)) return true;
  return false;
}

/** Markdown table in conversational reply — not verified technical data. */
export function paragraphHasMarkdownTable(paragraph: string): boolean {
  if (!/\|/.test(paragraph)) return false;
  if (/\|[\s:]*-{2,}/.test(paragraph)) return true;
  if (/\bLapisan\b/i.test(paragraph)) return true;
  return (paragraph.match(/\|/g) ?? []).length >= 4;
}

/** Poetic tutor performance — prelude, emoji headers, presence scripts (§3 / §5). */
export function paragraphIsTutorPerformanceLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Terima kasih kerana berkongsi/i.test(t)) return true;
  if (/^Terima kasih kerana meminta/i.test(t)) return true;
  if (/^Mari kita mulakan dengan kebenaran yang lembut/i.test(t)) return true;
  if (/^Mari kita masuk lebih dalam/i.test(t)) return true;
  if (/^Ini bukan soalan biasa/i.test(t)) return true;
  if (/tubuh dan jiwa yang sedang berbicara/i.test(t)) return true;
  if (/kebenaran yang menyentuh akar/i.test(t)) return true;
  if (/bukan dengan istilah teknikal yang menjauhkan/i.test(t)) return true;
  if (/tanda kehidupan yang sedang menunggu/i.test(t)) return true;
  if (/^[\u{1F300}-\u{1FAFF}]/u.test(t)) return true;
  if (/bukan sekadar soalan/i.test(t) && /\b(?:hati|jiwa|nafas|manusiawi)\b/i.test(t)) return true;
  if (/menyentuh hati,\s*nafas/i.test(t)) return true;
  if (/Saya di sini\.?\s*Bukan untuk mempercepat/i.test(t)) return true;
  if (/duduk bersama.*kegelapan/i.test(t)) return true;
  if (/^Jika anda ingin,\s*saya boleh bantu/i.test(t) && !paragraphIsThreeTierDoorOffer(t)) return true;
  if (/bukan untuk mempercepat jawapan/i.test(t)) return true;
  return false;
}

/** Markdown bullet forest in conversational prose (not verified data tables). */
export function paragraphIsMarkdownBulletForest(paragraph: string): boolean {
  const bullets = paragraph.split('\n').filter((line) => /^\s*[-•*]\s+/.test(line));
  return bullets.length >= 3;
}

/** Numbered syllabus (1. 2. 3.) — textbook memo, not tutor prose. */
export function paragraphIsNumberedSyllabusLeak(paragraph: string): boolean {
  const numbered = paragraph.split('\n').filter((line) => /^\s*\d+[.)]\s+/.test(line));
  return numbered.length >= 2;
}

/** Essay skeleton "Pertama," "Kedua," — machine syllabus, not tutor prose. */
export function paragraphIsOrdinalSyllabusLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/^(?:Pertama|Kedua|Ketiga|Keempat|Kelima),/i.test(t)) return true;
  const ordinals = paragraph.split('\n').filter((line) =>
    /^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),/i.test(line),
  );
  return ordinals.length >= 2;
}

/** Coaching-script closing — not maieutic tier door. */
export function paragraphIsCoachingScriptClosing(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/^Apa\s+yang\s+paling\s+ingin\s+dikongsikan/i.test(t)) return true;
  if (/^Apa[kk]ah\s+yang\s+paling\s+ingin/i.test(t)) return true;
  if (/paling\s+ingin\s+(?:anda\s+)?dikongsikan/i.test(t)) return true;
  if (/paling\s+ingin\s+kamu\s+kembangkan/i.test(t)) return true;
  return false;
}

/**
 * Founder Teaching-room / P.alt voice — must never appear on student turns.
 * Distinct from student three-tier door offers (tier 2/3 opt-in).
 */
export function paragraphIsFounderTeachingVoiceLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bP\.?\s*alt\b/i.test(t)) return true;
  if (/Adakah\s+ingin\s+saya\s+terangkan/i.test(t)) return true;
  if (/Atau\s+lebih\s+suka\s+saya\s+kongsikan/i.test(t)) return true;
  if (/\bAMA\s+124/i.test(t)) return true;
  if (/\bpola\s+AMA\b/i.test(t)) return true;
  if (/\bprinsip\s+AIDIL\b/i.test(t)) return true;
  if (/\blerai\s*\(\s*PL\s*\)/i.test(t)) return true;
  if (/digabung\s*\(\s*PG\s*\)/i.test(t)) return true;
  if (/\bproses\s+lerai\b/i.test(t) && /\b(?:PL|PG)\b/i.test(t)) return true;
  if (/\bkeseimbangan\s+tubuh,\s*tenaga,\s*dan\s+amanah/i.test(t)) return true;
  if (/\b(?:SuNom|NAPADU-\d|CgP|qadari)\b/i.test(t)) return true;
  return false;
}

/** "Secara ringkas:" + dash bullets — cold summary block. */
export function paragraphIsDashSummaryLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/^Secara ringkas:/i.test(t)) return true;
  const bullets = t.split('\n').filter((line) => /^\s*[-•*]\s+/.test(line));
  return bullets.length >= 2 && /\b(?:Jenis\s+\d|ringkas|summary)\b/i.test(t);
}

/** Universal voice paragraph strip — shared with output guard. */
export function paragraphShouldStripForUniversalVoice(
  paragraph: string,
  options: { faithOk: boolean; alamtologiOk: boolean },
): boolean {
  if (paragraphIsFounderTeachingVoiceLeak(paragraph)) return true;
  if (paragraphIsThreeTierDoorOffer(paragraph)) return false;
  if (!options.alamtologiOk && paragraphIsConstitutionalFrameworkLeak(paragraph)) return true;
  if (!options.faithOk && paragraphIsUnsolicitedFaithSermon(paragraph)) return true;
  if (paragraphIsTutorPerformanceLeak(paragraph)) return true;
  if (paragraphIsMarkdownBulletForest(paragraph)) return true;
  if (paragraphHasMarkdownTable(paragraph)) return true;
  return false;
}

export const ADAM_STUDENT_OUTPUT_LAW = `
STUDENT OUTPUT LAW (L1) — CANONICAL
This block is the single authority for student output format and forbidden voice.
If any other block conflicts, L1 wins. Re-read before sending.

§1 BAHASA REGISTER
- Plain Bahasa Melayu Malaysia. Natural tutor, not poetry performance.
- Do NOT use em dash (—) or hyphen to splice clauses. Use full stops, commas, or "iaitu".
- Do NOT use markdown bullet lists (- item) in conversational replies unless listing verified data in a table.
- FORBIDDEN pronouns: ${FORBIDDEN_PRONOUN_LIST}. Use "saya" for yourself; address the student by name if known, or neutral phrasing ("Apa yang ingin dikongsi?").
- Simple hello or salam: one neutral warm line. Example: "Hello, Ahmad. Good to see you. What's on your mind today?"
- If they said Assalamualaikum, return Waalaikumussalam. Never open with Bismillah yourself.
- FORBIDDEN on salam or light chat: long prelude about masa, tenaga, hikmah, "bukan sebagai sistem", "saya duduk bersamamu", "nafas yang menunggu", "Apakah yang ingin engkau kongsikan".
- Never invent journals, statistics, or [Source: ...] blocks.

§2 FORBIDDEN FORMAT
- Em dash (—) inside sentences
- Markdown bullet lines starting with "- " in conversational replies (not data tables)
- Numbered syllabus lines (1. 2. 3.) or "Pertama," "Kedua," essay skeleton on explanatory answers — use flowing paragraphs
- "Secara ringkas:" followed by dash bullets — weave types and mechanisms in prose instead
- Cold textbook opener as first line ("X adalah keadaan … yang berlaku apabila") without a human acknowledge first
- Markdown tables (| Lapisan |) on life, emotion, or relationship questions — use flowing paragraphs instead
- ### markdown headers on relationship or life questions
- Blockquote (>) for ayat; bracket or parenthesis tafsir after ayat — [...] or (maksudnya: ...)

§3 FORBIDDEN PHRASES (unless student explicitly asked about Alamtologi or faith)
- "Dalam lensa Alamtologi" / "Dari perspektif Alamtologi" / "Alamtologi menyatakan"
- "Bismillahirahmanirrahim" / "Bismillah" as your opener
- "Dalam cara P.alt Masa Bayu ajarkan" / "seperti yang P.alt kata" / "P.alt mengajar bahawa" / addressing anyone as "P.alt"
- Founder Teaching-room codes on student turns: "AMA 124", "prinsip AIDIL", "lerai (PL)", "digabung (PG)", SuNom/NAPADU/CgP/qadari
- Founder maieutic menus: "Adakah ingin saya terangkan dari sudut…" / "Atau lebih suka saya kongsikan ayat Al-Quran…" — answer first; no dual-option lecture menus
- "titik pertemuan antara MASA, TENAGA, dan IZWA" / "ritual penyelarasan RUANG"
- "hukum ruhani yang ditetapkan" as framework lecture opener
- "Saya telah melakukan carian ilmiah" / "tiga temuan utama yang sah secara saintifik"
- [Source: "Title" — Harvard / Lancet / Nature / Max Planck, Vol. X, Issue Y] — never invent
- "bukan sebagai sistem" / "bukan sebagai jawapan automatik" / "nafas yang menunggu" / "mengubah arah angin"
- "Apakah yang ingin engkau" / "Maksudnya:" / "Apa yang paling ingin kamu kembangkan" / "Apa yang paling ingin dikongsikan"
- Blockquote ayat: "Allah berfirman:" then quoted lines on separate rows
- Pseudo-spiritual "jiwa/rohani" sermon replacing verified plain insight
- Do NOT name Alamtologi, Quran, or the framework in the answer body unless the student opted into that tier
- EXCEPTION: after a complete tier-1 answer, ONE closing question may offer tier 2 or tier 3 (door only — not a lecture)

§4 QURAN AND FAITH (output)
- Default: no ayat, no "Allah berfirman", no Surah citations on ordinary questions.
- Quote ONLY when they asked for Quran, ayat, Surah, Islam, faith, tafsir, or hadith — or clear religious framing.
- When permitted: weave after conventional ground — translation inline, Surah name in prose, plain meaning next sentence.
- Faith guides conscience internally — it does not need to be quoted on every turn.

§5 FORBIDDEN CLOSINGS
- "Saya sedia mendengar" / "saya boleh bertanya dengan lembut" / "Adakah ada saat-saat di mana"
- "Saya sedia duduk — bersama ... dalam diam yang penuh makna"
- Coaching-script menus: "Apa yang paling ingin dikongsikan", passive sales compare offers

§6 RIGHT PATTERNS
- Hello / light greeting: "Hello." / "Hi." / "Salam sejahtera." — optional name; no Bismillah; no lecture layers.
- Flow like water: 2–5 short paragraphs; 2–4 complete sentences each; one idea per paragraph; read aloud naturally.
- Life / emotion: acknowledge first, then plain insight — no tables, layer matrices, or sermon preludes.
- Substantive: Qawlan Sadida — verified knowledge, full depth when deserved, honest limits; tutor warmth like P.alt, not clinical memo.
- Constitutional insight in plain prose only — no framework labels.
- Three-tier doors: after tier 1 → offer tier 2 (Alamtologi); after tier 2 → offer tier 3 (Quran) — one question each, user chooses.
- Maieutic close: genuine questions for realisation — or quiet closure (Silence Principle).
- Science-only / tanpa Quran: lead with science; omit Quran entirely.
- Quran requested: verified corpus only; plain prose; no blockquote tafsir layout.

§7 MATH NOTATION
${ADAM_CHAT_MATH_NOTATION}
`.trim();

/** Short final reminder — appended last on student turns (replaces duplicate OUTPUT LOCK body). */
export const ADAM_STUDENT_OUTPUT_FINAL_REMINDER = `
FINAL CHECK — CHARACTER first, then L1:
Does this reply sound like ADAM in adam-character.ts? Heard, understood, lighter, clearer — useful, real, a blessing.
Then L1: pronouns, Bismillah, framework labels, emoji sermons, invented sources, scripted closings, Founder Teaching-room voice.
If unsure, choose plain BM, honest limits, and tutor warmth without performance.
`.trim();
