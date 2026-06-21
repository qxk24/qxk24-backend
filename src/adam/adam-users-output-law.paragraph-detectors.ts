/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Law (L1)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */
import { paragraphIsUniversalScholarDoorOffer } from './adam-universal-scholar';
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
  if (/\bDalam\s+(?:lensa|perspektif|konteks|pandangan)\s+Alamtologi\b/i.test(t)) return true;
  if (/\bpandangan\s+Alamtologi\b/i.test(t)) return true;
  if (/\bperspektif\s+Alamtologi\b/i.test(t)) return true;
  if (/\bkonteks\s+Alamtologi\b/i.test(t)) return true;
  if (/\bMASA\s*(?:→|->|—|–)\s*TENAGA\b/i.test(t)) return true;
  if (/\b(?:ekspresi|pernyataan)\s+MASA\b/i.test(t) && /\bTENAGA\b/i.test(t)) return true;
  if (/\bmenyelaraskan\s+MASA\b/i.test(t)) return true;
  if (/\bMASA\s*\([^)]+\)/i.test(t) && /\bTENAGA\b/i.test(t) && /\bRUANG\b/i.test(t)) return true;
  if (/\bpenyelarasan\s+antara\b/i.test(t) && /\bMASA\b/.test(t) && /\bTENAGA\b/.test(t)) return true;
  if (/\bMASA\b/.test(t) && /\bTENAGA\b/.test(t) && /\bCAHAYA\b/.test(t)) return true;
  if (/\*MASA\*/.test(t) && /\*TENAGA\*/.test(t)) return true;
  if (/\bseperti\s+MASA\b/i.test(t)) return true;
  if (/\bmembawa\s+TENAGA\b/i.test(t)) return true;
  if (/\bMASA\s+yang\s+bergerak\b/i.test(t) && /\bTENAGA\b/i.test(t)) return true;
  if (/\b(?:Dalam\s+)?ilmu\s+HISAL\b/i.test(t)) return true;
  if (/\bHISAL\s+Alamtologi\b/i.test(t)) return true;
  if (/\bpermukaan\s+kiub\b/i.test(t)) return true;
  if (/\bangka\s+kesempurnaan\s+proses\b/i.test(t)) return true;
  if (/\bhukum\s+Z\b/i.test(t)) return true;
  if (/\bpola,\s*kadar,\s*pasangan,\s*(?:dan\s+)?keseimbangan\b/i.test(t)) return true;
  if (/\b(?:titik\s+pertemuan|Hukum\s+Peleraian|ritual\s+penyelarasan)\b/i.test(t)) {
    return true;
  }
  if (/\bpeka\s+terhadap\s+MASA\b/i.test(t)) return true;
  if (/\b(?:keteguhan\s+ruang|ketenangan\s+bumi|kejelasan\s+cahaya)\b/i.test(t)) return true;
  if (/\b(?:dikenali\s+sebagai|bentuk)\s+IZWA\b/i.test(t)) return true;
  if (/\bIZWA\b/i.test(t) && /\b(?:anugerah|izin|rahmat|turun\s+tanpa)\b/i.test(t)) return true;
  if (/\b(?:dikenali\s+sebagai|yang\s+dikenali\s+sebagai)\s+TENAGA\b/i.test(t)) return true;
  if (/\b(?:dari\s+permukaan|ke\s+dalam)\s+RUANG\b/i.test(t) && /\bBUMI\b/i.test(t)) return true;
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

/** α arithmetic sermon — HISAL / AIDIL / TAJU on 3+4=7 turns (not spider biology). */
export function paragraphIsSimpleArithmeticPhilosophyLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\b(?:HISAL|ilmu\s+HISAL)\b/i.test(t)) return true;
  if (/\bAIDIL\b/i.test(t)) return true;
  if (/\b(?:TAJU|Tujuh\s+Angka\s+Jaringan)\b/i.test(t)) return true;
  if (/\bP\.?\s*alt\b/i.test(t)) return true;
  if (/\bpermukaan\s+kiub\b/i.test(t)) return true;
  if (/\bpermukaan\s*→\s*laluan\s*→\s*bekas(?:\s*→\s*kiub)?\b/i.test(t)) return true;
  if (/\bkeenam-enam\s+permukaan\b/i.test(t)) return true;
  if (/\bangka\s+kesempurnaan\s+proses\b/i.test(t)) return true;
  if (/\btahap\s+fungsi\b/i.test(t)) return true;
  if (/\bbaris\s+penyelesaian\b/i.test(t)) return true;
  if (/\bwaqf\b/i.test(t)) return true;
  if (/\bdua\s+arah\s+cahaya\b/i.test(t)) return true;
  if (/^Ia\s+bukan\s+sekadar\s+angka\b/i.test(t)) return true;
  if (/^Itu\s+bukan\s+sekadar\s+hasil\s+tambah\b/i.test(t)) return true;
  if (/^Ini\s+bukan\s+sekadar\s+penambahan\s+angka\b/i.test(t)) return true;
  if (/\bIni\s+bukan\s+sekadar\s+angka\b/i.test(t)) return true;
  if (/\balam\s+semesta\b/i.test(t) && /\b(?:matematik|angka)\b/i.test(t)) return true;
  if (/\bhukum\s+kesetiaan\b/i.test(t)) return true;
  if (/\bpenuh\s+adab\b/i.test(t)) return true;
  if (/\bsetiap\s+langkah\s+mencerminkan\s+keseimbangan\b/i.test(t)) return true;
  if (/\bbukan\s+sekadar\s+(?:hasil\s+tambah|penambahan\s+angka)\b/i.test(t)) return true;
  if (/\bcara\s+kira\s+AIDIL\b/i.test(t)) return true;
  if (/\bpasangan\s+yang\s+sempurna\b/i.test(t)) return true;
  if (/\bproses\s+gabungan\s+yang\s+nyata\b/i.test(t)) return true;
  if (/\bproses\s+yang\s+tertib\b/i.test(t) && /\b1\s*→\s*2\b/.test(t)) return true;
  if (/\b1\s*→\s*2\s*→\s*3\b/.test(t)) return true;
  if (/\bstruktur\s+utuh\b/i.test(t) && /\bbatu-batu\b/i.test(t)) return true;
  if (/^Tetapi\s+untuk\s+soalan\s+ini,\s*jawapannya\s+tetap\s+jelas\b/i.test(t)) return true;
  if (/\bselagi\s+akal\s+dan\s+adab\s+berjalan\s+bersama\b/i.test(t)) return true;
  if (/\bbukan\s+hanya\s+kuantiti\b/i.test(t) && /\btanda\b/i.test(t) && /\b3\s*\+\s*4\b/.test(t)) {
    return true;
  }
  return false;
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
  if (/\bSebagaimana\s+firman\s+Allah\b/i.test(t)) return true;
  if (/\bAr-Ra['']?d\b/i.test(t)) return true;
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
  if (/\b(?:Khalifah|khalifah)\b/i.test(t)) return true;
  if (/\bUmar\s+ibn\s+al-?Khattab\b/i.test(t)) return true;
  if (/\bUthman\b/i.test(t) && /\b(?:kafilah|khalifah|agih)\b/i.test(t)) return true;
  if (/\bIbn\s+Taimiyyah\b/i.test(t)) return true;
  if (/\bhukum\s+Ilahi\b/i.test(t)) return true;
  if (/\bmu[ḥh]ī[ṭt]\b/i.test(t)) return true;
  if (/^\s*w\.\s+(?:dan\s+)?(?:para\s+)?Khalifah/i.test(t)) return true;
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
  if (/^Mari kita mulakan dengan jujur/i.test(t)) return true;
  if (/^Mari kita masuk lebih dalam/i.test(t)) return true;
  if (/^Soalan ini kelihatan ringkas/i.test(t)) return true;
  if (/\bperjalanan pemikiran yang sangat dalam\b/i.test(t)) return true;
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
  if (/^Jika anda ingin,\s*saya boleh bantu/i.test(t) && !paragraphIsUniversalScholarDoorOffer(t)) return true;
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

/** Explain-Back Phase 1A gambar hidup — forbidden on α konvensional (Answer Constitution v2). */
export function paragraphIsExplainBackPhase1ALeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Secara ilmu konvensional/i.test(t)) return false;
  if (/^From a conventional/i.test(t)) return false;
  if (/^Conventionally,/i.test(t)) return false;
  if (/^(?:Pagi tadi|This morning|Earlier today|Tadi pagi),/i.test(t)) return true;
  if (/\b(?:di halaman anda|meja sarapan anda|rumah seterusnya|in your (?:garden|kitchen|home|yard))\b/i.test(t)) {
    return true;
  }
  if (/^Bayi yang sedang tidur/i.test(t)) return true;
  if (/^Roti di meja sarapan/i.test(t)) return true;
  if (/^Imagine (?:you|a morning)/i.test(t)) return true;
  if (/^Soalan ini kelihatan ringkas/i.test(t)) return true;
  if (/^Mari kita renungkan/i.test(t)) return true;
  if (/^Mari kita mulakan dengan jujur/i.test(t)) return true;
  if (/\bperjalanan pemikiran yang sangat dalam\b/i.test(t)) return true;
  return false;
}

/** Science α — book-thread pivot off a factual mechanism answer. */
export function paragraphIsScienceBookPivotLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bbuku\s+kemiskinan\b/i.test(t)) return true;
  if (/\bilustrasi\s+sederhana\s+untuk\s+buku\b/i.test(t)) return true;
  if (/\bmetafora\s+naratif\b/i.test(t)) return true;
  if (/^-\s+Menjelaskan\s+proses\s+ini\s+dalam\s+bentuk\s+ilustrasi/i.test(t)) return true;
  if (/^-\s+Atau\s+menyusunnya\s+sebagai\s+satu\s+metafora\s+naratif/i.test(t)) return true;
  if (/^-\s+/m.test(t) && /\bbuku\s+kemiskinan\b/i.test(t)) return true;
  if (/^Jika\s+anda\s+ingin,\s+saya\s+boleh\s+bantu/i.test(t)) return true;
  if (/^Adakah\s+anda\s+mahu\s+kita\s+kaitkan\s+proses\s+ini\s+dengan\s+tema\s+buku/i.test(t)) {
    return true;
  }
  if (/^Saya\s+di\s+sini,\s+bukan\s+untuk\s+menjelaskan\s+sains\s+semata/i.test(t)) return true;
  return false;
}

/** β L5 tamparan jiwa — forbidden on α unless user opted into Explain-Back. */
export function paragraphIsExplainBackSoulStrikeLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Pernahkah anda/i.test(t)) return true;
  if (/^Adakah\s+anda\s+mahu\s+kita\s+kaitkan/i.test(t)) return true;
  if (/^Saya\s+di\s+sini,\s+bukan\s+untuk\s+menjelaskan\s+sains\s+semata/i.test(t)) return true;
  if (/^Apakah bentuk yang paling sering/i.test(t)) return true;
  if (/bukan untuk memilih, tetapi untuk merasa/i.test(t)) return true;
  if (/bagaimana bentuk itu membantu awak berdiri teguh/i.test(t)) return true;
  if (/tiada siapa melihat/i.test(t)) return true;
  if (/bukan untuk memilih yang/i.test(t) && /lebih betul/i.test(t)) return true;
  return false;
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
  if (/^Saya\s+di\s+sini,?\s*bersama\s+/i.test(t)) return true;
  if (/^Jika\s+.+\s+ingin,?\s*saya\s+boleh\s+bantu\s+jelaskan\s+aspek/i.test(t)) return true;
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
  if (/^Adakah\s+anda\s+pernah\s+mengalami\s+situasi/i.test(t)) return true;
  if (/^Bagaimana\s+anda\s+menyeimbangkannya/i.test(t)) return true;
  if (/^Apakah\s+kesetiaan\s+itu\s+buta/i.test(t)) return true;
  if (/Dalam\s+konteks\s+hari\s+ini,\s+Hang\s+Tuah\s+mengajak\s+kita\s+bertanya/i.test(t)) {
    return true;
  }
  return false;
}

