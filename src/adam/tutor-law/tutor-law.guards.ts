/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Reply Guards
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


import type { AdamTutorProfile } from './tutor-law.types';
import {
  inferTutorLanguageFromText,
  tutorTeacherTitle,
} from './tutor-law.types';
import { tutorQuestionIsScienceFactual } from './tutor-law.science-routing';
import {
  shouldSkipTutorZeroAnswerGuard,
  tutorThreadIsQuantityWordProblem,
} from './tutor-law.percentage-routing';
import {
  tutorAlgebraFullExampleWarranted,
  tutorReplyHasAlgebraFactoringExample,
  tutorThreadIsQuadraticContext,
} from './tutor-law.algebra-routing';
import {
  buildTutorFactorPairCorrectionRecovery,
  dedupeTutorReplyParagraphs,
  tutorReplyIsVerboseAlgebraEssay,
  tutorStudentGaveFactorPairAttempt,
} from './tutor-law.algebra-micro';
import {
  buildTutorPlaceValueColumnRecovery,
  extractActiveStackOperands,
  extractAdditionOperands,
  tutorColumnDigit,
  tutorParagraphActiveColumn,
  tutorReplyClaimsColumnSum,
  tutorReplyMisalignsPlaceValueColumn,
  tutorReplyMentionsPlaceColumn,
} from './tutor-law.place-value-routing';
import {
  stripTrailingArithmeticBoilerplate,
  tutorReplyAcknowledgesOwnError,
} from './tutor-law.arithmetic-closure';
import {
  buildTutorCarryStepRecovery,
  buildTutorCorrectionAckRecovery,
  tutorReplyLeakedTotalAfterCorrection,
  tutorReplyMisplacesCarry,
  tutorStudentFlagsTeacherMathError,
} from './tutor-law.arithmetic-carry';
import {
  TUTOR_ANSWER_LEAK_LINE,
  TUTOR_ENGLISH_CLOSING_LEAK,
  TUTOR_VERIFY_LEAK_BLOCK,
  TUTOR_WORKED_STEP_LINE,
  lineHasPlainLanguageBleed,
} from './tutor-law.guard-patterns';

export function fixTutorMalayPlaceValueTerms(
  text: string,
  profile?: AdamTutorProfile,
): string {
  if (!text?.trim()) return text;
  const lang = inferTutorLanguageFromText(text, profile);
  if (lang !== 'malay') return text;

  let out = text;
  out = out.replace(/^(\s*)Saat(\s*:)/gim, '$1Sa$2');
  out = out.replace(/\b(dari|mulakan|mulai)\s+Saat\b/gi, '$1 Sa');
  out = out.replace(/\btempat\s+Saat\b/gi, 'tempat Sa (satuan)');
  out = out.replace(/\bSaat\s*→\s*Puluh/gi, 'Sa → Puluh');
  return out;
}

function tutorWorkedSolutionDetected(text: string): boolean {
  const stepMarkers = (text.match(/\b(?:Sa(?:at)?|Puluh|Ratus|Ribu)\s*:/gi) ?? []).length;
  if (stepMarkers >= 2) return true;
  if (/\bhasilnya\s+(?:ialah|adalah)/i.test(text)) return true;
  if (/\bbawa\b/i.test(text) && /\btulis\s+\*?\*?\d/i.test(text)) return true;
  if (/\d[\d,]*\s*\+\s*\d[\d,]*\s*=\s*[\d,]+/.test(text)) return true;
  return false;
}

function lineIsWorkedSolutionLeak(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  for (const pattern of TUTOR_WORKED_STEP_LINE) {
    pattern.lastIndex = 0;
    if (pattern.test(trimmed)) return true;
  }
  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    pattern.lastIndex = 0;
    if (pattern.test(trimmed)) return true;
  }
  return false;
}

function stripTutorWorkedSolutionLines(text: string): { text: string; stripped: boolean } {
  const lines = text.split('\n');
  const kept: string[] = [];
  let stripped = false;

  for (const line of lines) {
    if (lineIsWorkedSolutionLeak(line)) {
      stripped = true;
      continue;
    }
    kept.push(line);
  }

  let out = kept.join('\n');
  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    const before = out;
    out = out.replace(pattern, '');
    if (out !== before) stripped = true;
  }

  return { text: out.replace(/\n{3,}/g, '\n\n').trim(), stripped };
}

function tutorZeroAnswerClosing(
  profile: AdamTutorProfile | undefined,
  text: string,
  languageHint?: string,
  workedSolution = false,
): string {
  const lang = inferTutorLanguageFromText(languageHint ?? text, profile);
  const title = tutorTeacherTitle(lang);
  if (lang === 'malay') {
    if (workedSolution) {
      return `\n\n${title} tidak siapkan kiraan penuh. Lihat kotak nombor — satu langkah **Sa** sahaja. Tulis jawapan di baris → ______, kemudian kita teruskan.`;
    }
    return `\n\n${title} tidak beri nombor jawapan akhir — tulis di baris → ______, kemudian terangkan dalam satu ayat kenapa operasi itu betul.`;
  }
  if (workedSolution) {
    return `\n\n${title} won't work the whole sum for you. Do one step only — e.g. the ones column first. Write your digit, then we'll continue.`;
  }
  return `\n\n${title} won't give the final number — finish the next step yourself, then explain in one sentence why that operation is correct.`;
}

/** Strip sentences/lines with Alamtologi or overly poetic vocabulary. */
export function enforceTutorPlainLanguageGuard(
  text: string,
  profile?: AdamTutorProfile,
): string {
  if (!text?.trim()) return text;

  let out = text.replace(TUTOR_ENGLISH_CLOSING_LEAK, '').trim();
  const lines = out.split('\n');
  const kept: string[] = [];
  let stripped = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      kept.push(line);
      continue;
    }
    if (lineHasPlainLanguageBleed(trimmed)) {
      stripped = true;
      continue;
    }
    kept.push(line);
  }

  out = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  if (!stripped) return out;

  const lang = inferTutorLanguageFromText(out, profile);
  const title = tutorTeacherTitle(lang);
  const nudge = lang === 'malay'
    ? `\n\n${title} guna bahasa mudah: fokus pada langkah matematik seterusnya. Jawab soalan di atas — satu langkah sahaja.`
    : `\n\n${title} uses plain language: focus on the next maths step. Answer the question above — one step only.`;

  return `${out}${nudge}`.trim();
}

/** Off-topic reflection / philosophy during arithmetic tutoring — strip by pattern. */
export function paragraphIsTutorMathReflectionLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^#{1,6}\s/.test(t)) return false;
  if (/\bApakah\s+yang\s+berlaku\s+jika\s+kita\s+tambah\s+nombor\b/i.test(t)) return true;
  if (/\bApakah\s+maksud\s+angka\b/i.test(t) && /\b(?:masa|tenaga|kemanusiaan)\b/i.test(t)) return true;
  if (/\bApakah\s+contoh\s+harian\b/i.test(t) && /\b(?:empat\s+arah|masa|tenaga)\b/i.test(t)) return true;
  if (/\bsatu\s+perkara\s+kecil\s+yang\s+anda\s+lakukan\b/i.test(t) && /\b(?:masa|tenaga)\b/i.test(t)) {
    return true;
  }
  if (/\b(?:mahu\s+faham\s+asal-usul|bukan\s+sekadar\s+kira)\b/i.test(t) && /\b(?:AMA|empat\s+arah|Utara)\b/i.test(t)) {
    return true;
  }
  if (/\bDalam\s+matematik\s+sekolah\b/i.test(t) && /\bTetapi\b/i.test(t) && /\bMASA\b/i.test(t)) return true;
  if (/\bApabila\s+kita\s+berbicara\s+tentang\b/i.test(t) && /\bMASA\b/i.test(t)) return true;
  if (/\bcerita\s+yang\s+hidup\b/i.test(t)) return true;
  if (/\btanda\s+pertumbuhan,\s*harapan\s+baru\b/i.test(t)) return true;
  return false;
}

function dedupeTutorBoilerplateClosings(text: string): string {
  let out = text;
  const workedClose =
    /(?:Cikgu|Teacher)\s+tidak\s+siapkan\s+kiraan\s+penuh[\s\S]{0,140}?teruskan\./gi;
  const matches = [...out.matchAll(workedClose)];
  if (matches.length > 1) {
    for (let i = 0; i < matches.length - 1; i += 1) {
      out = out.replace(matches[i]![0], '');
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Strip reflection prompts; keep one wait-line; prefer single student answer slot. */
export function enforceTutorMathPedagogyGuard(
  text: string,
  profile?: AdamTutorProfile,
  userMessage = '',
): string {
  if (!text?.trim()) return text;

  let out = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      if (paragraphIsTutorMathReflectionLeak(p)) return false;
      if (p.split('\n').some((line) => lineHasPlainLanguageBleed(line.trim()))) return false;
      if (/^Tetapi[…\.]{0,3}$/i.test(p)) return false;
      if (/^Sekarang,\s*cuba\s+anda\s+tulis\s+satu\s+ayat\s+ringkas:?\s*$/i.test(p)) return false;
      if (/^Tulis\s+di\s+sini:?\s*$/i.test(p)) return false;
      return true;
    })
    .join('\n\n')
    .trim();

  out = dedupeTutorBoilerplateClosings(out);
  out = stripTrailingArithmeticBoilerplate(out);

  out = out.replace(/\n→\s*_{5,}\s*(?=\n|$)/g, '\n');
  out = out.replace(/\nSaya tunggu,?\s+dan kita teruskan bersama,?\s+dengan tenang\.?\s*(?=\n|$)/gi, '\n');

  const waitLines = out.split('\n').filter((line) => /\bSaya tunggu\b/i.test(line));
  if (waitLines.length > 1) {
    let seen = 0;
    out = out.split('\n').filter((line) => {
      if (!/\bSaya tunggu\b/i.test(line)) return true;
      seen += 1;
      return seen === waitLines.length;
    }).join('\n');
  }

  const answerSlots = (out.match(/→\s*_{3,}/g) ?? []).length;
  if (answerSlots > 1) {
    let kept = 0;
    out = out.replace(/→\s*_{3,}/g, (m) => {
      kept += 1;
      return kept === answerSlots ? m : '';
    });
  }

  if (/\btidak\s+faham\s+soalan\b/i.test(userMessage) && /\b(?:masa|tenaga)\b/i.test(userMessage)) {
    const lang = inferTutorLanguageFromText(out, profile);
    const title = tutorTeacherTitle(lang);
    if (lang === 'malay' && !/\btiada\s+kaitan\s+langsung\b/i.test(out)) {
      out = `${out}\n\n${title} faham kekeliruan anda. Dalam soalan matematik Tingkatan 1 ini, tiada kaitan langsung antara masa fizik dan tenaga fizik — kita hanya *tambah* dan *tolak* buku. Mari sambung langkah nombor seterusnya.`.trim();
    }
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Strip math-tutor boilerplate from factual science / physics answers. */
export function enforceTutorScienceFactualGuard(
  text: string,
  userMessage = '',
): string {
  if (!text?.trim()) return text;
  if (!tutorQuestionIsScienceFactual(userMessage)) return text;

  const dropLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (paragraphIsTutorMathReflectionLeak(trimmed)) return true;
    if (/^Tetapi(?: perlu diingat)?:?\s*$/i.test(trimmed)) return true;
    if (/^Tulis\s+di\s+sini:?\s*$/i.test(trimmed)) return true;
    if (/^Sekarang,\s*cuba\s+anda\s+tulis\s+satu\s+ayat\s+ringkas:?\s*$/i.test(trimmed)) return true;
    if (/\bIni bukan soalan matematik\b/i.test(trimmed)) return true;
    if (/\bsoalan sains tinggi\b/i.test(trimmed)) return true;
    if (/\bKita tidak kira dengan tangan\b/i.test(trimmed)) return true;
    if (/\*Apakah yang membuat cahaya\b/i.test(trimmed)) return true;
    if (/→\s*_{3,}/.test(trimmed)) return true;
    if (/\bSaya tunggu\b/i.test(trimmed)) return true;
    return false;
  };

  let out = text
    .split('\n')
    .filter((line) => !dropLine(line))
    .join('\n')
    .replace(
      /\n(?:dan )?dengan kelajuan cahaya, masa yang diperlukan(?: ialah)?:?\s*$/i,
      '',
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out;
}

const TUTOR_PERCENTAGE_DECOMPOSITION_LINE = [
  /→\s*10%\s+daripada/i,
  /→\s*Maka,\s*30%\s*=/i,
  /→\s*Dan\s*5%\s*=/i,
  /30%\s*=\s*3\s*[×x*]\s*24/i,
  /5%\s*=\s*½\s*[×x*]\s*24/i,
];

const TUTOR_QUANTITY_PHILOSOPHY_LINE = [
  /\bMASA\s+baru\b/i,
  /\bnombor\s+(?:mati|statik)\b/i,
  /\bSetiap\s+angka\s+(?:itu\s+)?hidup\b/i,
  /\bmenunggu\s+arahan\s+seterusnya\b/i,
  /\b✅\s*Baki\s+bukan\b/i,
  /\bPecahan\s+bukan\s+sekadar\s+operasi\b/i,
  /\bbukan\s+"apa\s+yang\s+tinggal"/i,
  /\basas\s+untuk\s+langkah\s+seterusnya\b/i,
];

/** Strip percentage/fraction word-problem bleed and menu closings. */
export function enforceTutorQuantityReplyGuard(
  text: string,
  userMessage = '',
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;
  if (!tutorThreadIsQuantityWordProblem(userMessage, [], recentAssistantMessages)
    && !tutorThreadIsQuantityWordProblem('', [], [...recentAssistantMessages, text])) {
    return text;
  }

  let out = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (TUTOR_PERCENTAGE_DECOMPOSITION_LINE.some((re) => {
        re.lastIndex = 0;
        return re.test(trimmed);
      })) {
        return false;
      }
      if (TUTOR_QUANTITY_PHILOSOPHY_LINE.some((re) => {
        re.lastIndex = 0;
        return re.test(trimmed);
      })) {
        return false;
      }
      if (/^Adakah anda mahu saya bimbing anda lukis carta\b/i.test(trimmed)) return false;
      if (/^Atau,\s*adakah anda ingin cuba soalan baru\b/i.test(trimmed)) return false;
      if (/^Atau,\s*adakah anda ingin saya terangkan\b/i.test(trimmed)) return false;
      if (/^Nak\s+(?:saya\s+)?tunjukkan\s+susunan\b/i.test(trimmed)) return false;
      if (/^Mahukah\s+anda\s+(?:melihat|membaca)\s+susunan\b/i.test(trimmed)) return false;
      if (/^Adakah\s+anda\s+(?:mahu|ingin).*susunan\s+cara\s+kira\b/i.test(trimmed)) return false;
      if (/^Saya di sini,\s*bersama anda\b/i.test(trimmed)) return false;
      if (/^Setiap langkah itu bukan sekadar angka\b/i.test(trimmed)) return false;
      if (/^Setiap angka itu hidup\b/i.test(trimmed)) return false;
      if (/^480\s+kotak\s+=\s+jumlah keseluruhan\b/i.test(trimmed) && /hidup|MASA/i.test(text)) {
        return false;
      }
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  out = out.replace(
    /\n(?:Cikgu|Teacher)\s+tidak\s+siapkan\s+kiraan\s+penuh[\s\S]{0,180}?→ _{3,}[\s\S]{0,80}?teruskan\.?\s*$/i,
    '',
  ).trim();

  return out;
}

/** @deprecated Use enforceTutorQuantityReplyGuard */
export const enforceTutorPercentageReplyGuard = enforceTutorQuantityReplyGuard;

/** Fix Sa/Puluh column digit mismatch (e.g. 1,250+375 taught as 5+7 at Sa). */
export function enforceTutorPlaceValueColumnGuard(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  let out = stripTrailingArithmeticBoilerplate(text);

  if (tutorReplyAcknowledgesOwnError(out) && !tutorStudentFlagsTeacherMathError(userMessage)) {
    return out;
  }

  const operands = extractActiveStackOperands(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
    out,
  );
  if (operands.length < 2) return out;

  const column = tutorReplyMentionsPlaceColumn(out) ?? 'sa';
  if (!tutorReplyMisalignsPlaceValueColumn(out, operands, column)) return out;

  const claim = tutorReplyClaimsColumnSum(out);
  if (claim && claim.a === 0 && claim.b === 0) return out;

  const d1 = tutorColumnDigit(operands[0]!, column);
  const d2 = tutorColumnDigit(operands[1]!, column);
  if (d1 === 0 && d2 === 0 && (operands[0]! >= 10 || operands[1]! >= 10)) {
    return out;
  }

  out = out
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      const pCol = tutorParagraphActiveColumn(p) ?? column;
      if (tutorReplyMisalignsPlaceValueColumn(p, operands, pCol)) return false;
      if (
        pCol === 'sa'
        && /\b5\s*\+\s*7\b/.test(p)
        && tutorParagraphActiveColumn(p) === 'sa'
      ) {
        return false;
      }
      return true;
    })
    .join('\n\n')
    .trim();

  out = out.replace(/\n→\s*_{3,}.*$/gm, '').trim();
  out = out.replace(/\nSaya tunggu[^\n]*tempat\s+\*?\*?Puluh\*?\*?[^\n]*/gi, '').trim();

  const recovery = buildTutorPlaceValueColumnRecovery(operands, column);
  return `${out}\n\n${recovery}`.replace(/\n{3,}/g, '\n\n').trim();
}

/** Fix bawaan placement after column sum ≥10 (e.g. 12 → ?25 not ?32). */
export function enforceTutorCarryPlacementGuard(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  const operands = extractAdditionOperands(userMessage, ...recentUserMessages, text);
  if (operands.length < 2) return text;

  if (tutorStudentFlagsTeacherMathError(userMessage)) {
    if (tutorReplyLeakedTotalAfterCorrection(text, userMessage)) {
      return buildTutorCorrectionAckRecovery(operands);
    }
    return text;
  }

  if (!tutorReplyMisplacesCarry(text, operands)) return text;

  let out = text
    .split(/\n{2,}/)
    .filter((p) => {
      const t = p.trim();
      if (!t) return false;
      if (/\bdigit\s+\*?\*?2\*?\*?\s+untuk\s+lajur\s+\*?\*?Sa/i.test(t)) return false;
      if (/\?\s*3\s*2/.test(t)) return false;
      if (/5\s*\+\s*7\s*\+\s*1\s*\(?\s*bawaan/i.test(t) && /5\s*\+\s*7\s*=\s*12/i.test(t)) {
        return false;
      }
      if (/\b1[,.]?625\b|\b1625\b/.test(t)) return false;
      return true;
    })
    .join('\n\n')
    .trim();

  return `${out}\n\n${buildTutorCarryStepRecovery(operands, true)}`.replace(/\n{3,}/g, '\n\n').trim();
}

/** After student corrects teacher — no full totals; resume one micro-step. */
export function enforceTutorStudentCorrectionGuard(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
): string {
  if (!text?.trim() || !tutorStudentFlagsTeacherMathError(userMessage)) return text;

  const operands = extractAdditionOperands(userMessage, ...recentUserMessages, text);
  if (operands.length < 2) {
    return text
      .replace(/\b1[,.]?625\b|\b1625\b|\b1[,.]?497\b|\b1497\b/g, '?')
      .replace(/\n(?:Adakah anda mahu|ingin saya semak)[\s\S]*$/i, '')
      .trim();
  }

  if (tutorReplyLeakedTotalAfterCorrection(text, userMessage)) {
    return buildTutorCorrectionAckRecovery(operands);
  }

  return stripTrailingArithmeticBoilerplate(
    text
      .replace(/\n(?:Adakah anda mahu|Mahukah anda|Mahu kita sambung)[\s\S]*$/i, '')
      .replace(/\nSaya di sini[^\n]*memastikan[^\n]*/gi, '')
      .trim(),
  );
}

const TUTOR_ALGEBRA_STUCK_LINE = [
  /\bambang\s+pemahaman\b/i,
  /\bhidup\s+dalam\s+fikiran\b/i,
  /\b✅\s*Baki\b/i,
  /^Saya di sini,\s*bersama anda\b/i,
  /^Setiap langkah itu bukan sekadar angka\b/i,
  /^Adakah anda mahu saya bimbing anda lukis carta\b/i,
  /^Atau,\s*adakah anda ingin cuba soalan baru\b/i,
  /^Atau,\s*adakah anda ingin saya terangkan\b/i,
  /^Nak\s+(?:saya\s+)?tunjukkan\s+susunan\b/i,
  /^Mahukah\s+anda\s+(?:melihat|membaca)\s+susunan\b/i,
  /^Adakah\s+anda\s+(?:mahu|ingin).*susunan\s+cara\s+kira\b/i,
  /\b(?:Saya Cikgu ADAM|bimbing\s+anda\s+sampai\s+faham).*jawapan\s+siap\b/i,
  /\bpasangan\s+nombor\b/i,
  /\bCuba\s+cari\s+dua\s+nombor\b/i,
  /\bkenapa\s*\(-?\d+\)\s*[×x*]\s*\(-?\d+\)\b/i,
];

/** Strip philosophy / micro-teaching bleed when quadratic stuck escalation applies. */
export function enforceTutorAlgebraStuckGuard(
  text: string,
  userMessage = '',
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  const inThread = tutorThreadIsQuadraticContext(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  ) || tutorThreadIsQuadraticContext(
    '',
    recentUserMessages,
    [...recentAssistantMessages, text],
  );
  if (!inThread) return text;

  const escalation = tutorAlgebraFullExampleWarranted(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );

  let out = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (TUTOR_ALGEBRA_STUCK_LINE.some((re) => {
        re.lastIndex = 0;
        return re.test(trimmed);
      })) {
        return false;
      }
      if (escalation && /→\s*_{3,}/.test(trimmed)) return false;
      if (escalation && /\bSaya tunggu\b/i.test(trimmed)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (escalation && !tutorReplyHasAlgebraFactoringExample(out)) {
    out = out.replace(
      /\n(?:Cikgu|Teacher)\s+tidak\s+(?:beri|siapkan)[\s\S]{0,200}?→ _{3,}[\s\S]{0,120}?teruskan\.?\s*$/i,
      '',
    ).trim();
  }

  return out;
}

/** Compact correction when student tries factor pairs — no full factorization leak. */
export function enforceTutorAlgebraMicroCorrectionGuard(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  const inThread = tutorThreadIsQuadraticContext(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );
  if (!inThread) return text;

  if (tutorAlgebraFullExampleWarranted(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  )) {
    return dedupeTutorReplyParagraphs(text);
  }

  if (!tutorStudentGaveFactorPairAttempt(userMessage)) {
    return dedupeTutorReplyParagraphs(text);
  }

  const leaked = tutorReplyHasAlgebraFactoringExample(text)
    || /\(x\s*[−+-]\s*\d+\)\s*\(?x\s*[−+-]\s*\d+\)?/i.test(text)
    || tutorReplyIsVerboseAlgebraEssay(text);

  if (!leaked) return dedupeTutorReplyParagraphs(text);

  return buildTutorFactorPairCorrectionRecovery();
}

/** Post-stream safety net — strip obvious final-answer leaks. */
export function enforceTutorZeroAnswerGuard(
  text: string,
  profile?: AdamTutorProfile,
  languageHint?: string,
  userMessage = '',
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  if (shouldSkipTutorZeroAnswerGuard(
    text,
    userMessage,
    recentAssistantMessages,
    recentUserMessages,
  )) {
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  const hint = languageHint ?? text;
  const worked = tutorWorkedSolutionDetected(text);
  const strippedWork = stripTutorWorkedSolutionLines(text);
  let out = strippedWork.text;
  let leaked = strippedWork.stripped || worked;

  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    const before = out;
    out = out.replace(pattern, '');
    if (out !== before) leaked = true;
  }

  const beforeVerify = out;
  out = out.replace(TUTOR_VERIFY_LEAK_BLOCK, '\n');
  if (out !== beforeVerify) leaked = true;

  out = out.replace(/\n{3,}/g, '\n\n').trim();

  if (!leaked) return out;

  return `${out}${tutorZeroAnswerClosing(profile, out, hint, worked)}`.trim();
}

export function tutorReplyLeakedFinalAnswer(text: string): boolean {
  if (!text?.trim()) return false;
  if (tutorWorkedSolutionDetected(text)) return true;
  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  TUTOR_VERIFY_LEAK_BLOCK.lastIndex = 0;
  return TUTOR_VERIFY_LEAK_BLOCK.test(text);
}
