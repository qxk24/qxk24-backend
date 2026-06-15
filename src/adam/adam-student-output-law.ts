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

/** Standalone Bismillah opener paragraph — drop on all consumer turns (L1 / OL-S03). */
export function paragraphIsBismillahOpenerOnly(paragraph: string): boolean {
  return /^\s*Bismillah(?:irahmanirrahim)?\.?\s*$/i.test(paragraph.trim());
}

/** Consumer universal voice — never open with Bismillah. */
export function stripStudentBismillahOpener(text: string): string {
  let out = text.replace(/^\uFEFF/, '');
  out = out.replace(
    /^(?:[\t \u00A0]*\r?\n)*\s*Bismillah(?:irahmanirrahim)?\.?\s*(?:\r?\n\s*)+/i,
    '',
  );
  out = out.replace(/^(\s*)Bismillah(?:irahmanirrahim)?\.?\s*(?:\r?\n\s*)+/im, '$1');
  out = out.replace(
    /^(\s*)Bismillah(?:irahmanirrahim)?\.?\s+(?=[A-ZÀ-ÿ0-9"(\[$])/im,
    '$1',
  );
  return out;
}

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
  const t = paragraph.trim();
  if (/\bDari\s+sudut\s+Alamtologi\b/i.test(t)) return true;
  if (/\bFrom\s+an\s+Alamtologi\s+perspective\b/i.test(t)) return true;
  if (/\bDalam\s+(?:lensa|perspektif)\s+Alamtologi\b/i.test(t)) return true;
  if (/\bperspektif\s+Alamtologi\b/i.test(t)) return true;
  if (/\bhukum\s+Z\b/i.test(t)) return true;
  if (/\bpola,\s*kadar,\s*pasangan,\s*(?:dan\s+)?keseimbangan\b/i.test(t)) return true;
  if (/\b(?:titik\s+pertemuan|Hukum\s+Peleraian|ritual\s+penyelarasan)\b/i.test(t)) {
    return true;
  }
  if (/\bpeka\s+terhadap\s+MASA\b/i.test(t)) return true;
  if (/\b(?:keteguhan\s+ruang|ketenangan\s+bumi|kejelasan\s+cahaya)\b/i.test(t)) return true;
  if (/\bam[āa]n?ah\b/i.test(t) && /\b(?:kepimpinan|presiden|presidency|office)\b/i.test(t)) return true;
  if (/\bm[īi]z[āa]n\b/i.test(t)) return true;
  if (/\bbukan\s+sekadar\s+soalan\s+jawatan\b/i.test(t)) return true;
  if (/\bkemampuan\s+menahan\s+MASA\s+dengan\s+TENAGA\b/i.test(t)) return true;
  if (/\bLeraian\s*\d/i.test(t)) return true;
  if (/\bDalam\s+AMA\b/i.test(t)) return true;
  if (/\bunsur\s+aktif\s*:/i.test(t) && /\bunsur\s+pasif\s*:/i.test(t)) return true;
  if (/\bizwa\b/i.test(t) && /\b(?:berkat|mengikat|kehadiran|tenang|sabar)\b/i.test(t)) return true;
  if (/ayat\s+kecil\s+dari\s+Al-?Quran/i.test(t)) return true;
  if (/hikmah\s+yang\s+ditanam/i.test(t)) return true;
  return CONSTITUTIONAL_PRINCIPLE_REGEX.test(t);
}

/** Dual-lane essay skeleton — "Secara zahir / syar'i" performance, not tutor prose. */
export function paragraphIsDualLaneEssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/Secara\s+zahir\s*\(/i.test(t)) return true;
  if (/Secara\s+syar['']?i/i.test(t)) return true;
  if (/Secara\s+maknawi/i.test(t)) return true;
  if (/ilmu\s+konvensional\s*\)/i.test(t) && /Secara/i.test(t)) return true;
  if (/A\s+Deeper\s+Truth/i.test(t)) return true;
  if (/From\s+Science\s+and\b/i.test(t)) return true;
  return false;
}

/** Strip dual-lane labels — keep scientific substance after the colon. */
export function rewriteDualLaneEssayLabels(text: string): string {
  return text
    .split('\n')
    .map((line) =>
      line.replace(
        /^\.?\s*Secara\s+(?:zahir\s*\([^)]*\)|syar['']?i(?:\s+dan\s+maknawi)?(?:\s*\([^)]*\))?|maknawi)\s*:?\s*/i,
        '',
      ),
    )
    .join('\n');
}

/** Quranic gloss / Arabic / Pencipta sermon on tier-1 science without faith door. */
export function paragraphIsUnsolicitedTier1FaithWeave(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/[\u0600-\u06FF]/.test(t)) return true;
  if (/Kata\s+["'«]?\w+["'»]?\s*\(/i.test(t) && /[\u0600-\u06FF]/.test(t)) return true;
  if (/\bmenegakkan\b/i.test(t) && /[\u0600-\u06FF]/.test(t)) return true;
  if (/\bkebijaksanaan\s+Pencipta\b/i.test(t)) return true;
  if (/\btanda\s+kekuasaan\s+dan\s+hikmah\b/i.test(t)) return true;
  if (/\bmengembalikan\s+manusia\s+kepada\s+Pencipta\b/i.test(t)) return true;
  if (/\bbukan\s+kebetulan\b/i.test(t) && /\b(?:Pencipta|hikmah|kekuasaan)\b/i.test(t)) return true;
  if (/\bkeadaan\s+optimum\b/i.test(t) && /\b(?:Pencipta|hikmah|radiasi\s+kosmik)\b/i.test(t) && t.length > 120) {
    return true;
  }
  if (/\bilmu\s+ini\s+tidak\s+bertentangan\s+dengan\s+hikmah\b/i.test(t)) return true;
  if (/\bfirman\s+Allah\b/i.test(t)) return true;
  if (/\bAn-Naziat\b/i.test(t)) return true;
  if (/\bdihamparkanNya\b/i.test(t)) return true;
  if (/\bdihamparkan\s+dengan\s+kebijaksanaan\b/i.test(t)) return true;
  if (/\bMaknanya\s+bukan\s+[""]rata[""]/i.test(t)) return true;
  return false;
}

/** Science anchors — keep paragraph when faith leak is inline-strippable. */
export function paragraphHasSubstantiveScienceAnchors(paragraph: string): boolean {
  return /\b(?:geoid|GRACE|GOCE|GPS|graviti|Newton|satelit|gerhana|flattening|6,?378|\$\$|g_\{|g_\{\\text|pemutaran|sentrifugal|khatulistiwa)\b/i.test(
    paragraph,
  );
}

/** Faith sermon / doa ritual when user did not open the faith door. */
export function paragraphIsUnsolicitedFaithSermon(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/\bBismillah(?:irahmanirrahim)?\b/i.test(t)) return true;
  if (/\bYa\s+ALLAH\b/i.test(t)) return true;
  if (/\bALLAH\b/i.test(t)) return true;
  if (/\bbefore\s+Allah\b/i.test(t)) return true;
  if (/\bRasulullah\b/i.test(t)) return true;
  if (/\b(?:hadis|hadith)\b/i.test(t)) return true;
  if (/\(\s*HR\./i.test(t)) return true;
  if (/sanad\s+hasan/i.test(t)) return true;
  if (/\bSurah\b/i.test(t)) return true;
  if (/\(\s*Surah\s+/i.test(t)) return true;
  if (/\bThe\s+Quran\s+reminds\b/i.test(t)) return true;
  if (/\bibadah\b/i.test(t)) return true;
  if (/\bamanah\b/i.test(t) && /\b(?:entrusted|sacred|deposit|data)\b/i.test(t)) return true;
  if (/\bikhlas\b/i.test(t)) return true;
  if (/\bniyyah\b/i.test(t)) return true;
  if (/\bspiritual\s+accountability\b/i.test(t)) return true;
  if (/Secara\s+syar['']?i/i.test(t)) return true;
  if (/\b(?:Dia yang Maha|mengingati Dia)\b/i.test(t)) return true;
  if (/\b(?:zikir|syaitan|bisikan)\b/i.test(t)) return true;
  if (/\bpenyerahan\s+tiga\s+waktu\b/i.test(t)) return true;
  if (/\bsecara\s+ruhani\b/i.test(t)) return true;
  if (/\bRuhani\b/i.test(t)) return true;
  if (/And quietly,\s*beneath all technique/i.test(t)) return true;
  return false;
}

/** Values-trifold / stewardship essay on practical consumer turns. */
export function paragraphIsConstitutionalValuesEssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bclarity,?\s+responsibility,?\s+and\s+service\b/i.test(t)) return true;
  if (/\bstewardship,?\s+trust,?\s+and\s+spiritual\b/i.test(t)) return true;
  if (/\bthree\s+strands\s+in\s+one\s+rope\b/i.test(t)) return true;
  if (/\bquiet\s+soil\b/i.test(t)) return true;
  if (/\bholding\s+space\s+for\b/i.test(t)) return true;
  if (/\blike\s+a\s+gardener\b/i.test(t)) return true;
  if (/\bmoral\s+gravity\b/i.test(t)) return true;
  if (/\bsilence\s+between\s+the\s+numbers\b/i.test(t)) return true;
  if (/\bClarity\s+in\s+action:?/i.test(t)) return true;
  if (/\bResponsibility\s+in\s+action:?/i.test(t)) return true;
  if (/\bService\s+in\s+action:?/i.test(t)) return true;
  if (/\bClarity\s+asks,/i.test(t) && /\bResponsibility\s+asks,/i.test(t)) return true;
  if (/\bdata\s+silence\b/i.test(t)) return true;
  if (/\bworship\s+in\s+action\b/i.test(t)) return true;
  return false;
}

/** Markdown table in conversational reply — not verified technical data. */
export function paragraphHasMarkdownTable(paragraph: string): boolean {
  if (!/\|/.test(paragraph)) return false;
  if (/\|[\s:]*-{2,}/.test(paragraph)) return true;
  if (/\bLapisan\b/i.test(paragraph)) return true;
  return (paragraph.match(/\|/g) ?? []).length >= 4;
}

/** Strip "Pertama," / "Kedua," essay openers — keep substance after the label. */
export function rewriteOrdinalEssayOpeners(text: string): string {
  return text
    .split('\n')
    .map((line) =>
      line.replace(
        /^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),?\s*(?:saya\s+ingin\s+nyatakan\s+dengan\s+jujur:?\s*)?/i,
        '',
      ),
    )
    .join('\n');
}

/** Poetic tutor performance — prelude, emoji headers, presence scripts (§3 / §5). */
export function paragraphIsTutorPerformanceLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Terima kasih kerana berkongsi/i.test(t)) return true;
  if (/^Terima kasih kerana meminta/i.test(t)) return true;
  if (/terima kasih kerana bertanya/i.test(t)) return true;
  if (/thank you for this important question/i.test(t)) return true;
  if (/^Thank you for saying/i.test(t)) return true;
  if (/That simple phrase carries weight/i.test(t)) return true;
  if (/It['']?s not just curiosity/i.test(t)) return true;
  if (/willingness to go deeper/i.test(t)) return true;
  if (/opens the door to something vital/i.test(t)) return true;
  if (/^So let['']?s go deeper/i.test(t)) return true;
  if (/Quiet, ancient, elemental/i.test(t)) return true;
  if (/Hold both life and danger/i.test(t)) return true;
  if (/^What ["']?More["']? Means Here/i.test(t)) return true;
  if (/^You['']?ve already heard the key/i.test(t)) return true;
  if (/Not just \*what\* harms, but \*how\*/i.test(t)) return true;
  if (/opens a doorway not just to science/i.test(t)) return true;
  if (/honour the earth['']?s gifts/i.test(t)) return true;
  if (/not to lecture,?\s*but to walk with you/i.test(t)) return true;
  if (/I['']?m here\.?\s*not to lecture/i.test(t)) return true;
  if (/step by thoughtful step/i.test(t)) return true;
  if (/soalan yang sangat penting/i.test(t)) return true;
  if (/menyentuh harapan/i.test(t) && /\b(?:kepercayaan|harapan|jiwa|hati)\b/i.test(t)) return true;
  if (/batas ilmu perubatan/i.test(t) && /terima kasih|sangat penting/i.test(t)) return true;
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
  return bullets.length >= 2;
}

/** Rewrite dash bullets into flowing sentences inside a paragraph. */
export function rewriteMarkdownBulletsToProse(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^\s*[-•*]\s+(.+)$/);
      if (!m) return line;
      const body = m[1].trim();
      return body.endsWith('.') ? body : `${body}.`;
    })
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Numbered syllabus (1. 2. 3.) — textbook memo, not tutor prose. */
export function paragraphIsNumberedSyllabusLeak(paragraph: string): boolean {
  const numbered = paragraph.split('\n').filter((line) => /^\s*\d+[.)]\s+/.test(line));
  return numbered.length >= 2;
}

/** Month/week/phase roadmap lines — keep on practical career-path depth turns. */
export function paragraphIsCareerTimelineBlock(paragraph: string): boolean {
  const t = paragraph.trim();
  return /\b(?:Month|Bulan|Week|Minggu|Phase|Fasa|Quarter|Suku)\s+[\d–—-]+/i.test(t)
    || /^\s*(?:Step|Langkah|Tier|Tahap)\s+\d/i.test(t);
}

/** Tier-1 essay leak — vignettes, checklists, humility closers belong in tier 2. */
export function paragraphIsTier1EssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Let me explain it not as a (?:job description|textbook)/i.test(t)) return true;
  if (/^Imagine a\b/i.test(t)) return true;
  if (/^Bayangkan\b/i.test(t)) return true;
  if (/^What a .+ actually does, day to day:/i.test(t)) return true;
  if (/^What they actually do, day to day:/i.test(t)) return true;
  if (/^What a .+ does, in practice:/i.test(t)) return true;
  if (/^Core skills you need, grouped by function:/i.test(t)) return true;
  if (/^Core skills you/i.test(t) && t.length < 72) return true;
  if (/^One quiet truth many miss:/i.test(t)) return true;
  if (/^That['']?s the heart of it:/i.test(t)) return true;
  if (/^Thank you for this important question/i.test(t)) return true;
  if (/^Defines the question:/i.test(t)) return true;
  if (/^Collects & cleans data:/i.test(t)) return true;
  if (/^Explores & visualises:/i.test(t)) return true;
  if (/^Models & interprets:/i.test(t)) return true;
  if (/^Communicates insight:/i.test(t)) return true;
  if (/^Peranan harian:/i.test(t)) return true;
  if (/^In practice, an .+ may include:/i.test(t)) return true;
  if (/^What makes this role deeply human/i.test(t)) return true;
  if (/^These skills grow not only/i.test(t)) return true;
  if (/^At its heart,/i.test(t)) return true;
  if (/^At its core,/i.test(t)) return true;
  if (/^You don't need to be perfect to begin/i.test(t)) return true;
  if (/^The skills you need fall into/i.test(t) && t.length < 90) return true;
  if (/^These skills are not fixed at graduation/i.test(t)) return true;
  if (/^---+$/.test(t)) return true;
  return false;
}

/** Single labeled skill line — Clinical competence: … (tier-2 detail). */
export function paragraphIsLabeledSkillLine(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t || t.length > 520) return false;
  if (/\b(?:Mari kita lihat|tiga lapisan|Bayangkan|soalan ini menyentuh)\b/i.test(t)) return false;
  if (/^(?:Clinical competence|Critical thinking|Communication|Emotional resilience|Cultural humility)/i.test(t)) {
    return true;
  }
  return /^[\w\s&'’]+:\s+[A-Z]/.test(t) && !/^Would you like/i.test(t);
}

/** Emoji skill checklist — tier-2 detail, not tier-1 role overview. */
export function paragraphIsEmojiSkillChecklist(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  const emojiLines = t.split('\n').filter((line) => /^\s*✅/.test(line.trim()));
  if (emojiLines.length >= 2) return true;
  return /^\s*✅/.test(t) && t.length > 60;
}

/** @deprecated Use paragraphIsTier1EssayLeak */
export const paragraphIsPracticalTier1EssayLeak = paragraphIsTier1EssayLeak;

/** Essay skeleton "Pertama," "Kedua," — machine syllabus, not tutor prose. */
export function paragraphIsOrdinalSyllabusLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/\b(?:diabetes|insulin|remisi|perubatan moden|type\s+[12])\b/i.test(t)) return false;
  if (/^(?:Pertama|Kedua|Ketiga|Keempat|Kelima),/i.test(t)) return true;
  const ordinals = paragraph.split('\n').filter((line) =>
    /^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),/i.test(line),
  );
  return ordinals.length >= 2;
}

/** Long philosophical essay — nature metaphor + constitutional layers on practical asks. */
export function paragraphIsPhilosophicalEssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/\b(?:Mari kita lihat dari tiga lapisan|tiga lapisan)\b/i.test(t)) return true;
  if (/\bbukan sekadar tentang jawatan\b/i.test(t)) return true;
  if (/\bsoalan ini bukan sekadar\b/i.test(t)) return true;
  if (/\bsoalan ini menyentuh\b/i.test(t)) return true;
  if (/\bBayangkan sebatang pokok\b/i.test(t)) return true;
  if (/\bpenghubung antara Z\b/i.test(t)) return true;
  if (/\bpertumbuhan yang membawa hikmah\b/i.test(t)) return true;
  if (/\bSaya sedia duduk bersama\b/i.test(t)) return true;
  if (/\bApakah ada satu situasi spesifik\b/i.test(t)) return true;
  if (/\bdi mana ilmu, adab, dan hikmah\b/i.test(t)) return true;
  if (/\bstruktur besar alam dan sistem kehidupan\b/i.test(t)) return true;
  if (/\b(?:living path|ticking boxes on a syllabus|truth reveals itself in numbers)\b/i.test(t)) return true;
  if (/\bnot as a checklist\b/i.test(t)) return true;
  if (/\bgrowing in rhythm with how truth\b/i.test(t)) return true;
  if (/\bOne truth to carry with you\b/i.test(t)) return true;
  if (/\bquiet credential\b/i.test(t) && /\bpatience to clean messy data\b/i.test(t)) return true;
  if (/\bthe person behind the chart\b/i.test(t)) return true;
  if (/\bpause before entering a room\b/i.test(t)) return true;
  if (/\bCommunication that heals\b/i.test(t)) return true;
  if (/\bnot just about tasks\b/i.test(t) && /\bpresence with purpose\b/i.test(t)) return true;
  if (/\bliving bridge between\b/i.test(t)) return true;
  if (/\bmedicine meets meaning\b/i.test(t)) return true;
  if (/\bfar more than a caregiver\b/i.test(t)) return true;
  if (/\bquiet covenant between\b/i.test(t)) return true;
  if (/\bnot just biology,\s*it['']s a quiet covenant\b/i.test(t)) return true;
  if (/\brestoration of a living rhythm\b/i.test(t)) return true;
  return false;
}

/** Coaching-script closing — not maieutic tier door. */
export function paragraphIsCoachingScriptClosing(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/^Apa\s+yang\s+paling\s+ingin\s+dikongsikan/i.test(t)) return true;
  if (/^Apa[kk]ah\s+yang\s+paling\s+ingin/i.test(t)) return true;
  if (/paling\s+ingin\s+(?:anda\s+)?dikongsikan/i.test(t)) return true;
  if (/paling\s+ingin\s+kamu\s+kembangkan/i.test(t)) return true;
  if (/Saya di sini untuk membantu anda faham/i.test(t)) return true;
  if (/bukan untuk memutuskan bagi anda/i.test(t)) return true;
  if (/berdiri teguh dengan ilmu/i.test(t)) return true;
  if (/agar anda berdiri teguh/i.test(t)) return true;
  if (/Ada\s+aspek\s+mana.*ingin\s+anda\s+gali/i.test(t)) return true;
  if (/Atau\s+mungkin,?\s*ada\s+satu\s+kenangan/i.test(t)) return true;
  if (/Saya\s+di\s+sini\.?\s*duduk/i.test(t)) return true;
  if (/mendengar,?\s*dan\s+bersama/i.test(t)) return true;
  if (/^Would you like me to:/i.test(t)) return true;
  if (/^Would you like me to\b/i.test(t)) return true;
  if (/^Focus on one\b.*in more depth/i.test(t)) return true;
  if (/^Explain how traditional systems/i.test(t)) return true;
  if (/^Or explore how\b/i.test(t)) return true;
  if (/^Just say the word/i.test(t)) return true;
  if (/walk there together/i.test(t)) return true;
  if (/we['']?ll walk there together/i.test(t)) return true;
  if (/\b(?:clarity|responsibility|service|stewardship|spiritual accountability)\b/i.test(t)
    && /\b(?:other perspectives?|explore this from|Would you like)\b/i.test(t)) return true;
  if (/\bbroader ideas of stewardship\b/i.test(t)) return true;
  if (/\bdeepen our understanding of leadership\b/i.test(t)) return true;
  if (/\bnon-technical roles like teaching\b/i.test(t)) return true;
  if (/^You don't need to be perfect to begin/i.test(t)) return true;
  return false;
}

/** Convert "3. Mercury" outline lines to flowing prose sentences. */
export function rewriteNumberedOutlineToProse(text: string): string {
  const lines = text.split('\n');
  const hasNumbered = lines.some((line) => /^\s*\d+[.)]\s+/.test(line));
  if (!hasNumbered) return text;
  return lines
    .map((line) => {
      const m = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (!m) return line.trim();
      const body = m[1].trim();
      return body.endsWith('.') ? body : `${body}.`;
    })
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Convert "Pertama," / "Kedua," essay skeleton into flowing prose. */
export function rewriteOrdinalOutlineToProse(text: string): string {
  const lines = text.split('\n');
  const hasOrdinal = lines.some((line) =>
    /^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),?\s+/i.test(line),
  );
  if (!hasOrdinal) return text;
  return lines
    .map((line) => {
      const m = line.match(/^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),?\s*(.+)$/i);
      if (!m) return line.trim();
      const body = m[1].trim();
      return body.endsWith('.') ? body : `${body}.`;
    })
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** "Secara ringkas:" + dash bullets → plain prose paragraph. */
export function rewriteSecaraRingkasBlock(text: string): string {
  const trimmed = text.trim();
  if (!/^Secara ringkas:/i.test(trimmed)) return text;
  const body = trimmed.replace(/^Secara ringkas:\s*/i, '');
  if (/^\s*[-•*]\s+/m.test(body)) return rewriteMarkdownBulletsToProse(body);
  return body.trim();
}

/** Convert "3. Mercury" outline lines to **Mercury** section labels. */
export function rewriteNumberedOutlineToBoldLabels(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
      if (!m) return line;
      return `${m[1]}**${m[2].trim()}**`;
    })
    .join('\n');
}

/** Guest/student display — restore paragraph breaks after guard flattening. */
export function normalizeConsumerParagraphBreaks(text: string): string {
  let out = text.trim();
  if (!out) return out;

  out = out.replace(/([.!?…])\n(?=[A-ZÀ-ÿ"(\[]|Secara |Bayangkan |Adakah |Yang |Ini |QA,)/g, '$1\n\n');
  out = out.replace(
    /([.!?…])\s+(?=(?:Secara (?:saintifik|ilmu|formula)|Bayangkan |Adakah |Yang menarik|Ini disebabkan|Nilai |Di mana ))/gi,
    '$1\n\n',
  );

  if (!/\n{2,}/.test(out) && out.length > 320) {
    out = out.replace(
      /([.!?…])\s+(?=[A-ZÀ-ÿ][a-zà-ÿ]{2,})/g,
      (match, punct, offset, whole) => {
        const before = whole.slice(Math.max(0, offset - 8), offset);
        if (/[\d$\\]$/.test(before.trim())) return match;
        return `${punct}\n\n`;
      },
    );
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Remove **bold** / *italic* markers — guest chat renders plain text, not markdown. */
export function stripConsumerMarkdownEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1');
}

/** True when text uses dash bullets, emoji lines, or numbered skill layers. */
export function outputHasScannableListStructure(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^\s*[-•*]\s+/m.test(t)) return true;
  if (/^\s*✅/m.test(t)) return true;
  if (/^\s*\d+[.)]\s+/m.test(t)) return true;
  return false;
}

/** Capitalize opener and fix stray leading punctuation after label strip. */
export function polishStudentOutputSurface(
  text: string,
  technicalOk = false,
  preserveNumberedLists = false,
): string {
  let out = text.trim();
  out = out.replace(/^[\s.]+/, '');
  out = out.replace(/\*{3,}/g, '**');
  if (!technicalOk && !preserveNumberedLists) {
    out = out
      .split(/\n{2,}/)
      .map((para) => {
        let block = rewriteSecaraRingkasBlock(para);
        block = rewriteOrdinalOutlineToProse(block);
        block = rewriteNumberedOutlineToProse(block);
        if (/^\s*[-•*]\s+/m.test(block)) return rewriteMarkdownBulletsToProse(block);
        return block;
      })
      .join('\n\n');
  }
  out = out.replace(/\.\s+([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`);
  if (out.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
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
  if (/\bLeraian\s*\d/i.test(t)) return true;
  if (/\bDalam\s+AMA\b/i.test(t)) return true;
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
  if (paragraphIsEmojiOnlyOpener(paragraph)) return true;
  if (paragraphIsPhilosophicalEssayLeak(paragraph)) return true;
  if (paragraphIsConstitutionalValuesEssayLeak(paragraph)) return true;
  if (paragraphIsDualLaneEssayLeak(paragraph)) return true;
  if (paragraphIsFounderTeachingVoiceLeak(paragraph)) return true;
  if (paragraphIsThreeTierDoorOffer(paragraph)) return false;
  if (!options.alamtologiOk && paragraphIsConstitutionalFrameworkLeak(paragraph)) return true;
  if (
    !options.faithOk
    && paragraphIsUnsolicitedFaithSermon(paragraph)
    && paragraphHasSubstantiveScienceAnchors(paragraph)
  ) {
    return false;
  }
  if (
    !options.faithOk
    && paragraphIsUnsolicitedTier1FaithWeave(paragraph)
    && paragraphHasSubstantiveScienceAnchors(paragraph)
  ) {
    return false;
  }
  if (!options.faithOk && paragraphIsUnsolicitedFaithSermon(paragraph)) return true;
  if (!options.faithOk && paragraphIsUnsolicitedTier1FaithWeave(paragraph)) return true;
  if (paragraphIsTutorPerformanceLeak(paragraph)) return true;
  if (paragraphIsCoachingScriptClosing(paragraph)) return true;
  if (paragraphIsOrdinalSyllabusLeak(paragraph)) return true;
  if (paragraphIsMarkdownBulletForest(paragraph)) return true;
  if (paragraphHasMarkdownTable(paragraph)) return true;
  return false;
}

/** SuNom / constitutional notation — never visible to students. */
export const SUNOM_NOTATION_PATTERN =
  /:=\s*[01]\s*(?:VERIFIED|CONDITIONAL|SUSPENDED)|\b(?:VERIFIED|CONDITIONAL|SUSPENDED)\s*\(:?=\s*[01]\)/i;

export function stripSunomNotation(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) =>
      para
        .replace(/\s*\(:?=\s*[01]\s*(?:VERIFIED|CONDITIONAL|SUSPENDED)\)/gi, '')
        .replace(/:=\s*[01]\s*(?:VERIFIED|CONDITIONAL|SUSPENDED)/gi, '')
        .replace(/\b(?:VERIFIED|CONDITIONAL|SUSPENDED)\s*\(:?=\s*[01]\)/gi, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/ +([.,!?;:])/g, '$1')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n');
}

const EMOJI_OPENER_PREFIX =
  /^[\u{2600}-\u{27BF}\u{FE0F}\u{1F300}-\u{1FAFF}\u{200D}]+\s*/u;

/** Remove emoji / clinical preamble lines — keep substance on the same line. */
export function rewriteEmojiPerformanceOpeners(text: string): string {
  return text
    .split('\n')
    .map((line) =>
      line
        .replace(EMOJI_OPENER_PREFIX, '')
        .replace(/^\uFE0F\s*/u, '')
        .replace(/^Saya akan kongsikan dengan jujur:?\s*/i, ''),
    )
    .join('\n');
}

/** Paragraph that is only emoji/preamble — no substantive answer. */
export function paragraphIsEmojiOnlyOpener(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Saya akan kongsikan dengan jujur:?\s*$/i.test(t)) return true;
  if (/^[✅⚠️🩺🔸📋]\s*Saya akan kongsikan dengan jujur:?\s*$/iu.test(t)) return true;
  if (/^[✅⚠️🩺🔸📋]\s*$/u.test(t)) return true;
  return false;
}

/** Plan / tester tier labels used as addressee — not the student's human name. */
export function stripPlanTesterAddress(text: string): string {
  return text
    .replace(/^QA,\s*/gm, '')
    .replace(/([.!?…])\s*QA,\s*/g, '$1 ')
    .replace(/\bQA,\s+/g, '')
    .replace(/\bQA\s+Unlimited,?\s*/gi, '')
    .replace(/Kalau\s+QA\s+Unlimited\s+sudi/gi, 'Jika anda sudi')
    .replace(/\bQA\s+Unlimited\s+sudi/gi, 'anda sudi');
}

/** Paragraph still has verifiable conventional anchor — do not strip whole BM essay block. */
function paragraphHasConventionalAnchor(paragraph: string): boolean {
  return /\b(?:UNESCO|Kementerian Pendidikan|WHO|CDC|JPM|JTM|JBPM|MS IEC|Electrical Regulations|Sijil Kemahiran|SKM)\b/i.test(paragraph)
    || /\(\d+\)\s*(?:kompetensi|pilar|literasi)/i.test(paragraph);
}

/**
 * BM tier-1 practical essay prelude — strip only when no conventional facts remain.
 * Keeps UNESCO/KPM pillars inside mixed paragraphs.
 */
export function paragraphIsBmPracticalEssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t || paragraphHasConventionalAnchor(t)) return false;
  if (/\bbukan sekadar menyampaikan ilmu\b/i.test(t)) return true;
  if (/\bpembentukan identiti,\s*akal,\s*dan hati\b/i.test(t)) return true;
  if (/\bilmu benar-benar berakar,\s*bukan di buku\b/i.test(t)) return true;
  if (/\bbukan di buku,\s*tetapi di hati\b/i.test(t)) return true;
  if (/\bbukan sekadar gred,\s*tetapi kepercayaan diri\b/i.test(t)) return true;
  if (/\bsoalan ini menyentuh\b/i.test(t)) return true;
  return false;
}

/** Inline BM essay leaks inside mixed tier-1 practical answers (QA clause, poetic closer). */
export function stripBmPracticalEssayInline(text: string): string {
  return text
    .replace(
      /\s*QA,\s*peranan ini tidak diukur[^.!?]*[.!?]+/gi,
      ' ',
    )
    .replace(
      /\s*Itulah ruang di mana ilmu benar-benar berakar, bukan di buku, tetapi di hati dan ingatan yang hidup\.?\s*/gi,
      '\n\n',
    )
    .replace(/[^.!?]*\bbukan sekadar menyampaikan ilmu[^.!?]*[.!?]+/gi, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Strip faith/Quran sentences from one science paragraph — preserve line/paragraph breaks. */
function stripScienceFaithParagraph(paragraph: string): string {
  let out = paragraph
    .replace(/[^.!?]*[\u0600-\u06FF][^.!?]*[.!?]+/gu, ' ')
    .replace(/[^.!?]*\bKata\s+["'«][^"'»]+["'»]\s*\([^)]*[\u0600-\u06FF][^)]*\)[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bkebijaksanaan\s+Pencipta\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bilmu\s+ini\s+tidak\s+bertentangan\s+dengan\s+hikmah\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\btanda\s+kekuasaan\s+dan\s+hikmah\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bKedu-dua\s+tidak\s+bertentangan\s+dengan\s+firman\s+Allah\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bfirman\s+Allah\s+dalam\s+Surah\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bSurah\s+An-Naziat\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bSurah\s+[A-Za-z][A-Za-z'\-]*\s+ayat\s+\d+[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bdihamparkanNya\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bMaknanya\s+bukan\s+[""]rata[""][^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bdihamparkan\s+dengan\s+kebijaksanaan\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bsetiap\s+lengkungnya\s+mengatur\s+iklim[^.!?]*[.!?]+/gi, ' ')
    .replace(/^\s*["'«]\s*/gm, '')
    .trim();

  const faithSentence = (s: string): boolean => {
    const t = s.trim();
    if (!t) return true;
    if (/\b(?:firman\s+Allah|Surah\s+An-Naziat|dihamparkanNya|dihamparkan\s+dengan\s+kebijaksanaan)\b/i.test(t)) {
      return true;
    }
    return /Maknanya\s+bukan\s+[""]rata/i.test(t);
  };

  return out
    .split(/\n/)
    .map((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !faithSentence(sentence))
        .join(' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Science/nature tier-1 — strip Arabic gloss, Surah tafsir, Pencipta sermon inline. */
export function stripScienceFaithInline(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => stripScienceFaithParagraph(para.trim()))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

/** Science/health tier-1 poetic closers — keep facts, drop covenant essay lines. */
export function stripSciencePoeticInline(text: string): string {
  return text
    .replace(/[^.!?]*\bquiet covenant between sun, air, water, and life\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bnot just biology,\s*it['']s a quiet covenant\b[^.!?]*[.!?]+/gi, ' ')
    .replace(
      /[^.!?]*\brestoration of a living rhythm\b[^.!?]*[.!?]+/gi,
      ' ',
    )
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Exam-stress tier-1 — strip unsolicited faith blocks and MASA billboards inline. */
export function stripLifeStressFaithInline(text: string): string {
  return text
    .replace(/[^.!?]*\bAllah says in Surah\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bIndeed, it is in the remembrance of Allah\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bYa Allah,\s+ease this\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bprotect your MASA,\s*not just time,\s*but living time\b[^.!?]*[.!?]+/gi, ' ')
    .replace(
      /\bprotect your MASA,\s*not just time,\s*but living time\b/gi,
      'protect your rest — sleep and consolidation matter as much as study hours',
    )
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Emoji checklist / clinical pamphlet opener. */
export function paragraphIsEmojiPerformanceOpener(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Saya akan kongsikan dengan jujur/i.test(t)) return true;
  if (EMOJI_OPENER_PREFIX.test(t)) return true;
  if (EMOJI_OPENER_PREFIX.test(t) && /jujur/i.test(t)) return true;
  return false;
}

/**
 * Unified ADAM — same voice for students and founder chat (Founder decree).
 * Hygiene only; never flatten warmth, Bismillah, narrative depth, or examples.
 */
export const ADAM_UNIFIED_SURFACE_HYGIENE = `
UNIFIED ADAM SURFACE (student & guest — same person as Founder chat):
You are the same ADAM — same character, warmth, depth, and prose rhythm as with P.alt Masa Bayu.
Teach generously: multiple paragraphs, real examples, flowing prose in the speaker's language.

HYGIENE ONLY (not voice suppression):
- FORBIDDEN pronouns: ${FORBIDDEN_PRONOUN_LIST}. Use saya; address by name when known.
- NEVER visible := VERIFIED/SUSPENDED, SuNom, AMA 124, PL/PG codes, or constitutional notation.
- Never call anyone "P.alt" or paste Founder Teaching-room scripts verbatim.
- No emoji checklists (✅⚠️🩺); no "Certainly!" / clinical memo tone.
- Do NOT open with Bismillahirahmanirrahim or Bismillah — universal consumer voice.
- Default to English when the user's language is unclear; mirror their language when they write in another tongue.
- Em dashes and narrative depth are welcome when PROSE_DASH_LAW and CHARACTER govern.
- Insight in plain words — avoid billboard labels ("Dalam lensa Alamtologi") unless tier 2/3 is open.
- Quran/ayat when faith door is open or tier 3 — weave in plain prose, not blockquote tafsir.
`.trim();

/** @deprecated Use ADAM_UNIFIED_SURFACE_HYGIENE — kept for legacy imports. */
export const ADAM_STUDENT_OUTPUT_LAW_SURFACE = ADAM_UNIFIED_SURFACE_HYGIENE;

export const ADAM_STUDENT_OUTPUT_LAW = `
STUDENT OUTPUT LAW (L1) — CANONICAL
This block is the single authority for student output format and forbidden voice.
If any other block conflicts, L1 wins. Re-read before sending.

§1 LANGUAGE & REGISTER
- Mirror the speaker's language this turn. If they write in English, reply in English only.
- If their language is unclear, default to English — warm, clear, natural tutor voice.
- When they write in Bahasa Melayu Malaysia, use plain DBP tutor register (not Indonesian).
- Do NOT use em dash (—) or hyphen to splice clauses. Use full stops, commas, or "iaitu".
- Do NOT use markdown bullet lists (- item) in conversational replies unless listing verified data in a table.
- FORBIDDEN pronouns: ${FORBIDDEN_PRONOUN_LIST}. Use "I" for yourself in English; "saya" in Malay; address the student by name if known.
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
- "Terima kasih kerana bertanya" + long prelude ("soalan yang sangat penting", "menyentuh harapan", "batas ilmu perubatan")
- "Pertama, saya ingin nyatakan dengan jujur" / "Pertama," "Kedua," essay skeleton on health or science answers
- "Saya di sini untuk membantu anda faham" / "bukan untuk memutuskan bagi anda" / "berdiri teguh dengan ilmu dan keyakinan"
- Plan or product names as opener (QA Unlimited, subscription tier labels) — never prefix replies with billing/plan text
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
- Explain / understand asks (any subject): WRONG — coaching prelude ("Terima kasih kerana bertanya… soalan sangat penting… Pertama, saya ingin nyatakan dengan jujur:")
  RIGHT — open with the student's first name once (from STUDENT ADDRESS block), then verified facts in flowing prose.
  Example: "Ahmad, ubi kentang atau Solanum tuberosum…"
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
FINAL CHECK — UNIFIED ADAM:
Same person as Founder chat — warm, generous, real examples, mirror the speaker's language; English when unclear.
Hygiene only: no kau/kamu, no := notation, no P.alt/AMA codes, no coaching menus, no Bismillah opener, no invented [Source:].
`.trim();
