/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Guard Patterns
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export const TUTOR_ANSWER_LEAK_LINE = [
  /jawapan\s+akhir(?:nya)?\s+(?:ialah|adalah)\b[^\n]*/gi,
  /jawapannya\s+(?:ialah|adalah)\b[^\n]*/gi,
  /hasilnya\s+(?:ialah|adalah)\b[^\n]*/gi,
  /jumlah[^.\n]{0,48}(?:ialah|adalah)\s*[\d,*]+[^\n]*/gi,
  /final\s+answer\s+is\b[^\n]*/gi,
  /the\s+(?:answer|total|result)\s+is\b[^\n]*/gi,
  /kesimpulannya[,:\s]+(?:\*\*)?-?\d+/gi,
  /jadi[,，]?\s*hasilnya\s+(?:ialah|adalah)\b[^\n]*/gi,
];

/** Column-addition / long-division step lines that reveal the solution path. */
export const TUTOR_WORKED_STEP_LINE = [
  /^(?:Sa(?:at)?|Puluh|Ratus|Ribu|Ones|Tens|Hundreds|Thousands)\s*:/i,
  /\bbawa\s+\*?\*?\d/i,
  /→\s*tulis\s+\*?\*?\d/i,
  /tulis\s+\*?\*?\d+\*?\*?\s*,\s*bawa/i,
  /\d[\d,]*\s*\+\s*\d[\d,]*\s*=\s*[\d,]+/,
];

export const TUTOR_VERIFY_LEAK_BLOCK =
  /\n\s*Jika\s+[A-Za-z]\s*=\s*\d+[^]*?→\s*betul\.?/gi;

/** Poetic / Alamtologi vocabulary that must not appear in Tutor replies. */
export const TUTOR_PLAIN_LANGUAGE_BLEED = [
  /\balamtologi\b/i,
  /\bama\s*124\b/i,
  /\bama\s*\(\s*1\s*\)/i,
  /\btaju\b/i,
  /\bqxk24\b/i,
  /\bnafas\s+masuk\b/i,
  /\bniche\b/i,
  /\bMishk[āaā]?t\b/i,
  /\bpengenalan\s+kembali\b/i,
  /\bruang\s+terbuka\b/i,
  /\bkehadiran\s+ilmu\b/i,
  /\bkelengkungan\b/i,
  /\bIZWA\b/,
  /\bRUANG\b(?!\s+kerja)/,
  /\bLeraian\b/i,
  /\bTeori\s+Masa\s+Bayu\b/i,
  /\bconstitutional\b/i,
  /\bperlembagaan\s+alamtologi\b/i,
  /\bPhase\s+1[AB]\b/i,
  /\bnafas\s+(?:keluar|diam)\b/i,
  /\bseven\s+principle\b/i,
  /\btujuh\s+prinsip\b/i,
  /\bMASA\s*(?:→|->|—)\s*TENAGA\b/i,
  /\b(?:sudut|konteks)\s+masa\s+dan\s+tenaga\b/i,
  /\btenaga\s+akal\b/i,
  /\b(?:Utara|Timur|Barat|Selatan)(?:,\s*(?:Utara|Timur|Barat|Selatan)){2,}/i,
  /\bempat\s+arah\b/i,
  /\bNombor\s+4\s+bukan\s+muncul\b/i,
  /\b(?:dalam\s+)?AMA\b/i,
  /\bcerita\s+yang\s+hidup\b/i,
  /\bawal\s+penciptaan\b/i,
  /\blaboratorium\s+alamiah\b/i,
];

/** English menu bleed when session profile is Malay. */
export const TUTOR_ENGLISH_SESSION_BLEED = [
  /\bWould you like to\b/i,
  /\bExplore what\b/i,
  /\bConnect it to\b/i,
  /\bOr relate it to\b/i,
  /\bLet me know,\s*and I'll guide\b/i,
  /\bYou do the thinking\b/i,
  /\bI hold the light\b/i,
  /\bperfect number\b/i,
  /\bstep by step,\s*clearly and patiently\b/i,
  /\bGood(?:\s+job|\s+try|\s+work)\b/i,
  /\bWell done\b/i,
  /\bThat(?:'| i)s (?:correct|right|not quite|almost)\b/i,
  /\bNot quite\b/i,
  /\bLet me explain\b/i,
  /\bLet's (?:look|try|continue|move)\b/i,
  /\bThe next step\b/i,
  /\bTry again\b/i,
  /\bRemember that\b/i,
  /\bYou (?:wrote|got|answered)\b/i,
  /\bI see (?:you|that)\b/i,
  /\bActually,\b/i,
  /\bCorrect!\b/i,
  /\bWrong\b/i,
  /\bKeep going\b/i,
];

export const TUTOR_ENGLISH_CLOSING_LEAK =
  /\bTeacher won't give the final number\b/i;

export function lineHasPlainLanguageBleed(line: string): boolean {
  return TUTOR_PLAIN_LANGUAGE_BLEED.some((re) => {
    re.lastIndex = 0;
    return re.test(line);
  });
}
