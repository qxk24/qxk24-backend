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
import { ADAM_CHAT_MATH_NOTATION } from './adam-math-prompt';
import { paragraphIsUniversalScholarDoorOffer } from './adam-universal-scholar';
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
    .replace(/(?<!Hai\s)QA,\s+/gi, '')
    .replace(/\bQA\s+Unlimited,?\s*/gi, '')
    .replace(/Kalau\s+QA\s+Unlimited\s+sudi/gi, 'Jika anda sudi')
    .replace(/\bQA\s+Unlimited\s+sudi/gi, 'anda sudi');
}

/** Paragraph still has verifiable conventional anchor — do not strip whole BM essay block. */
function paragraphHasConventionalAnchor(paragraph: string): boolean {
  return /\b(?:UNESCO|Kementerian Pendidikan|WHO|CDC|JPM|JTM|JBPM|MS IEC|Electrical Regulations|Sijil Kemahiran|SKM)\b/i.test(paragraph)
    || /\(\d+\)\s*(?:kompetensi|pilar|literasi)/i.test(paragraph);
}

/** Career skills block on non-career turns (civics, science) — strip whole paragraph. */
export function paragraphIsCareerSkillsBlockLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  return /^Skills you(?:'|')ll need\b/i.test(t)
    || /^Kemahiran yang diperlukan\b/i.test(t)
    || /\btechnical competence,\s*communication,\s*documentation,\s*and professional accountability\b/i.test(t);
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

/** Single sentence with poetic MASA/TENAGA framework weave (not conventional "masa" = time). */
function sentenceIsFrameworkWeaveLeak(sentence: string): boolean {
  const s = sentence.trim();
  if (!s) return false;
  if (/\bseperti\s+MASA\b/i.test(s)) return true;
  if (/\bmembawa\s+TENAGA\b/i.test(s)) return true;
  if (/\bMASA\s+yang\s+bergerak\b/i.test(s)) return true;
  if (/\bTENAGA\s+yang\s+telah\s+terkumpul\b/i.test(s)) return true;
  if (/\bMASA\s*(?:→|->|—|–)\s*TENAGA\b/i.test(s)) return true;
  if (/\b(?:satu|setiap)\s+MASA\s+yang\b/i.test(s)) return true;
  if (/\b(?:ekspresi|pernyataan)\s+MASA\b/i.test(s) && /\bTENAGA\b/i.test(s)) return true;
  if (/\bmenyelaraskan\s+MASA\b/i.test(s)) return true;
  if (/\bMASA\s*\([^)]+\)/i.test(s) && /\bTENAGA\b/i.test(s) && /\bRUANG\b/i.test(s)) return true;
  if (/\bpenyelarasan\s+antara\b/i.test(s) && /\bMASA\b/.test(s) && /\bTENAGA\b/.test(s)) return true;
  if (/\bMASA\b/.test(s) && /\bTENAGA\b/.test(s) && /\bCAHAYA\b/.test(s)) return true;
  if (/\*MASA\*/.test(s) && /\*TENAGA\*/.test(s)) return true;
  if (/\bMASA\b/.test(s) && /\bTENAGA\b/.test(s) && /\bRUANG\b/.test(s)) return true;
  if (/\b(?:liqā|liqa|amānah|amanah)\b/i.test(s)) return true;
  if (/\bruang\s+liqā/i.test(s)) return true;
  return false;
}

/** Strip framework-weave sentences; keep conventional history/science facts in the same paragraph. */
export function stripFrameworkWeaveSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !sentenceIsFrameworkWeaveLeak(sentence))
    .join(' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Science/health tier-1 poetic closers — keep facts, drop covenant essay lines. */
export function stripKonvensionalAlamtologiTailInline(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => {
      let out = para.trim();
      if (!out) return '';
      out = out.replace(/\s*[,;]?\s*(?:Dan\s+)?(?:dalam\s+)?pandangan\s+Alamtologi[\s\S]*$/i, '');
      out = out
        .replace(/[^.!?]*\bMASA\s*(?:→|->|—|–)\s*TENAGA\s*(?:→|->|—|–)\s*MASA\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\b(?:ekspresi|pernyataan)\s+MASA\b[^.!?]*\bTENAGA\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bseperti\s+MASA\b[^.!?]*\bTENAGA\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bseperti\s+MASA\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bmembawa\s+TENAGA\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bmenyelaraskan\s+MASA\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bMASA\s*\([^)]+\)[^.!?]*\bRUANG\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bpandangan\s+Alamtologi\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\b(?:Dalam|Dari)\s+(?:lensa|perspektif|konteks|pandangan)\s+Alamtologi\b[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bIni\s+bukan\s+sekadar\s+perubahan\s+(?:bentuk|rupa)[^.!?]*[.!?]+/gi, ' ')
        .replace(/[^.!?]*\bhukum\s+keabadian\s+(?:jirim\s+(?:dan|&)\s+)?tenaga\b[^.!?]*[.!?]+/gi, ' ');
      out = stripFrameworkWeaveSentences(out);
      return out.replace(/[ \t]{2,}/g, ' ').trim();
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

/** Science α — "bukan sekadar" + conservation-law essay tail (not textbook mechanism). */
export function paragraphIsSciencePhilosophyEssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\b(?:Proses\s+ini|Ia)\s+bukan\s+sekadar\s+reaksi\s+kimia\b/i.test(t)) return true;
  if (/\b(?:Ini|Ia|Proses\s+ini)\s+bukan\s+sekadar\s+perubahan\s+rupa\b/i.test(t)) return true;
  if (/\bhukum\s+keabadian\s+(?:jirim\s+(?:dan|&)\s+)?tenaga\b/i.test(t)) return true;
  if (
    /\btenaga\s+ditambah\b/i.test(t)
    && /→/.test(t)
    && /\b(?:gerakan\s+molekul|susunan\s+ruang|sifat\s+zat)\b/i.test(t)
  ) {
    return true;
  }
  if (/\bTiada\s+zat\s+lenyap\s+atau\s+dicipta\b/i.test(t) && /\bhukum\s+keabadian\b/i.test(t)) {
    return true;
  }
  if (/\bbukan\s+sekadar\b/i.test(t) && /\b(?:MASA|TENAGA|RUANG)\b/i.test(t)) return true;
  if (/\bmenyelaraskan\s+MASA\b/i.test(t)) return true;
  if (/\b(?:bukan\s+mekanisme\s+pasif|sistem\s+hidup\s+yang\s+aktif)\b/i.test(t) && /\b(?:MASA|TENAGA|RUANG)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** Model refuses inline image/video despite user request — drop and let media repair inject tags. */
export function paragraphIsMediaRefusalLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\btidak\s+(?:boleh|dapat)\s+menunjukkan\s+(?:gambar|imej|video)/i.test(t)) return true;
  if (/\btidak\s+(?:boleh|dapat)\s+memaparkan\s+(?:gambar|imej|video)/i.test(t)) return true;
  if (/\bSayangnya,?\s+saya\s+tidak\s+dapat\s+menunjukkan\b/i.test(t)) return true;
  if (/\b(?:I\s+)?cannot\s+(?:directly\s+)?(?:show|display)\s+(?:an?\s+)?(?:image|images|video|videos)/i.test(t)) {
    return true;
  }
  if (/\bsaya\s+boleh\s+(?:berikan|cadangkan)\s+pautan/i.test(t) && /\b(?:gambar|video|Google\s+Images)\b/i.test(t)) {
    return true;
  }
  if (/\bAdakah\s+anda\s+ingin\s+saya\s+bantu\s+(?:sediakan\s+)?pautan/i.test(t)) return true;
  return false;
}

/** Model redirects to Google/keyword search instead of inline media tags. */
export function paragraphIsMediaKeywordRedirectLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bkata\s+kunci\s+(?:seperti|bagai)/i.test(t)) return true;
  if (/\b(?:animasi\s+3D|diagram\s+fotosintesis|chloroplast\s+structure)\b/i.test(t)
    && /\b(?:cari|google|youtube|tonton)\b/i.test(t)) {
    return true;
  }
  if (/\banda\s+boleh\s+mencari\s+dengan\s+(?:mudah|tepat)/i.test(t)) return true;
  if (/^\s*[-*•]\s+/m.test(t) && /\b(?:animasi\s+3D|diagram\s+fotosintesis|chloroplast\s+structure)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function outputHasKonvensionalFrameworkLeak(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\bMASA\b/.test(t) && /\bTENAGA\b/.test(t) && /\bRUANG\b/.test(t)) return true;
  if (/\bMASA\b/.test(t) && /\bTENAGA\b/.test(t) && /\bCAHAYA\b/.test(t)) return true;
  if (/\bpenyelarasan\s+antara\b/i.test(t) && /\bMASA\b/.test(t) && /\bTENAGA\b/.test(t)) return true;
  if (/\*MASA\*/.test(t) && /\*TENAGA\*/.test(t)) return true;
  if (/\bmenyelaraskan\s+MASA\b/i.test(t)) return true;
  if (/\bDari\s+sudut\s+Alamtologi\b/i.test(t)) return true;
  if (/\bpandangan\s+Alamtologi\b/i.test(t)) return true;
  return false;
}

export function outputHasMediaRefusal(text: string): boolean {
  return text
    .split(/\n{2,}/)
    .some((para) => paragraphIsMediaRefusalLeak(para.trim()));
}

const TECHNICAL_BOLD_MAX_CHARS = 72;

/**
 * Universal channel — unwrap whole-paragraph bold and orphan ** markers.
 * Prevents react-markdown from bolding everything after an unclosed **.
 */
export function clampTechnicalMarkdownBold(text: string): string {
  const fixed = text.split(/\n{2,}/).map((block) => {
    const t = block.trim();
    if (!t) return block;
    if (/^<adam-(?:technical-diagram|chat-image|chat-video)\b/i.test(t)) return block;
    if (/^#{1,6}\s/m.test(t)) return block;

    let para = t;
    para = para.replace(/\*\*([^*]+)\*\*/g, (full, inner: string) => {
      if (inner.length <= TECHNICAL_BOLD_MAX_CHARS) return full;
      return inner;
    });

    if ((para.match(/\*\*/g) ?? []).length % 2 !== 0) {
      para = para.replace(/\*\*/g, '');
    }

    const wholeBold = para.match(/^\*\*([^*]+)\*\*$/);
    if (wholeBold) return wholeBold[1]!.trim();

    return para;
  });

  return fixed.join('\n\n').trim();
}

/** Leading paragraph is web-search meta — drop before Bismillah body. */
function paragraphIsWebSearchOpenerLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^(?:disahkan melalui carian web|verified via web search)\b/i.test(t)) return true;
  return /^(?:saya|aku)\s+(?:telah\s+)?(?:menjalankan|melakukan)\s+carian/i.test(t)
    || /^berdasarkan\s+(?:hasil\s+)?carian/i.test(t)
    || /^hasil\s+carian(?:\s+web)?/i.test(t)
    || /^dar[ií]?\s+carian\s+web/i.test(t)
    || /^dari\s+hasil\s+carian/i.test(t)
    || /^soalan\s+(?:anda|p\.?\s*alt)\s+berkaitan/i.test(t)
    || /^setelah\s+(?:menjalankan|melakukan)\s+carian/i.test(t)
    || /^carian\s+web\s+(?:telah|menunjukkan|memberikan)/i.test(t)
    || /^after\s+(?:conducting|running|completing)\s+(?:a\s+)?web\s+search/i.test(t)
    || /^based\s+on\s+(?:my\s+)?web\s+search/i.test(t)
    || /^i\s+(?:have\s+)?(?:conducted|run|completed)\s+(?:a\s+)?web\s+search/i.test(t)
    || /^SUBJECT:\s*.+\(verified via web search/i.test(t);
}

function stripWebSearchOpenerParagraphs(text: string): string {
  const parts = text.split(/\n{2,}/);
  while (parts.length > 1 && paragraphIsWebSearchOpenerLeak(parts[0]!)) {
    parts.shift();
  }
  if (parts.length === 1 && paragraphIsWebSearchOpenerLeak(parts[0]!)) {
    return '';
  }
  return parts.join('\n\n').trim();
}

/** Strip web-search meta attribution — one choke point for all turns. */
export function stripWebSearchAttributionInline(text: string): string {
  let out = text
    .replace(
      /\s*:?\s*\((?:disahkan melalui carian web|verified via web search)[^)]*\)/gi,
      '',
    )
    .replace(
      /\s*(?:Menurut sumber carian|Per the search source|sumber carian web)\s*[:,]?\s*/gi,
      '',
    )
    .replace(
      /^(?:SUBJECT:\s*[^\n]+?\(verified via web search[^)]*\)\.?\s*)/gim,
      '',
    )
    .replace(/\?\s*:\s*(?=\(|[A-Z])/g, '? ')
    .replace(/ {2,}/g, ' ')
    .trim();
  out = stripWebSearchOpenerParagraphs(out);
  return out;
}

/** Strip media-refusal paragraphs on turns that requested gambar/video. */
export function stripMediaRefusalInline(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter((para) => {
      const t = para.trim();
      if (!t) return false;
      if (paragraphIsMediaRefusalLeak(t)) return false;
      if (paragraphIsMediaKeywordRedirectLeak(t)) return false;
      return true;
    })
    .join('\n\n')
    .trim();
}

/** Drop science philosophy essay paragraphs on konvensional α turns. */
export function stripSciencePhilosophyEssayInline(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter((para) => !paragraphIsSciencePhilosophyEssayLeak(para.trim()))
    .join('\n\n')
    .replace(/[^.!?]*\bIni\s+bukan\s+sekadar\s+perubahan\s+(?:bentuk|rupa)[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bhukum\s+keabadian\s+(?:jirim\s+(?:dan|&)\s+)?tenaga\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Science/health tier-1 poetic closers — keep facts, drop covenant essay lines. */
export function stripSciencePoeticInline(text: string): string {
  return text
    .replace(/[^.!?]*\bImagine a\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\blived reality\b[^.!?]*[.!?]+/gi, ' ')
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
