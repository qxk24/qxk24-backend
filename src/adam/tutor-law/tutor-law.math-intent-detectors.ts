/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Math Intent Detectors
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { isAdamLightChatTurn } from '../adam-response-generation';

const NUMERICAL_COMPUTATION = [
  /\d[\d,]*\s*[+\-×÷*/^=]\s*\d/,
  /[A-Za-z]\s*[+\-×÷*/^=]\s*\d/,
  /\b\d+\s*%\s*(?:daripada|of)\s*\d/i,
  /\b\d+\s*\/\s*\d+\s*[×x*]\s*\d/,
  /\b(?:kira|hitung|selesaikan|find\s+x|car\s+i\s+x|cuba\s+kira)\b/i,
  /\btempat\s+(?:Sa|Puluh|Ratus|Ribu)\b/i,
  /=\s*[\d,]+/,
];

const TUTOR_MATH_DOMAIN = [
  /\d[\d,]*\s*[+\-×÷*/]\s*\d/,
  /[A-Za-z]\s*[+\-]\s*\d+\s*=\s*\d/,
  /\b\d*x\b|\bx\s*=\s*\d/i,
  /\b(?:matematik|math|algebra|pecahan|peratus|kuadratik|aritmetik)\b/i,
  /\b(?:selesaikan|hitung|cuba\s+kira|kira(?:kan)?|kira\s+jumlah)\b/i,
  /\b(?:Ali|Ahmad|Siti|Puan|Encik|Penny)\s+(?:ada|membeli|mempunyai)\s+\d/i,
  /\b(?:guli|buku|epal|gaji|wang|harga|kotak|lori)\b.*\d[\d,]*/i,
  /\b(?:apa\s+itu|beza\s+antara|perbezaan|tak\s+faham)\b.*\b(?:pecahan|algebra|nombor|persamaan)\b/i,
];

export function hasNumericalComputation(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (!/\d/.test(t) && !/\bx\b/i.test(t)) return false;
  return NUMERICAL_COMPUTATION.some((re) => {
    re.lastIndex = 0;
    return re.test(t);
  });
}

export function isTutorMathDomainMessage(message: string): boolean {
  const t = message.trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  return TUTOR_MATH_DOMAIN.some((re) => {
    re.lastIndex = 0;
    return re.test(t);
  });
}

export function studentAsksMathConcept(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (hasNumericalComputation(t) && /\b(?:selesaikan|hitung|cuba\s+kira)\b/i.test(t)) {
    return false;
  }
  return (
    /\b(?:apa\s+(?:itu|beza|maksud)|what\s+is|beza\s+antara|perbezaan)\b/i.test(t)
    || /\btak\s+faham\s+(?:apa|konsep|idea|pecahan|algebra|nombor)\b/i.test(t)
    || /\bkenapa\s+(?:negatif|pecahan|nombor|-\s*\d+\s*[×x*]\s*-)/i.test(t)
    || /\b(?:explain|terangkan|jelaskan)\s+(?:what|apa)\s+(?:is|itu)\b/i.test(t)
  );
}

export function studentShowsPartialWorking(message: string): boolean {
  const t = message.trim();
  if (!t || t.length < 6) return false;
  return (
    /\b(?:langkah|step)\s*(?:\d+|pertama|kedua|ketiga|first|second)/i.test(t)
    || /\d+\s*[+\-×÷]\s*\d+\s*=\s*\d+/.test(t)
    || /[A-Za-z]\s*[+\-×÷]\s*\d+\s*=\s*\d+/i.test(t)
    || /\b(?:saya\s+(?:dah|telah)\s+(?:buat|kira|tolak|tambah|bahagi|darab))/i.test(t)
    || /^\d+\s*[+\-×÷]\s*\d+\s*=\s*\d+/i.test(t)
  );
}

export function studentShowsFullWorking(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  const steps = (t.match(/=\s*[\d,x]+/gi) ?? []).length;
  return steps >= 2 || (studentShowsPartialWorking(t) && t.length > 80);
}

export function studentRequestsAnswerVerification(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/\b(?:betul\s+tak|sah\s+tak|correct\s*\?|is\s+this\s+right|is\s+it\s+correct)\b/i.test(t)) {
    return true;
  }
  if (studentShowsFullWorking(t)) return false;
  return (
    /\b(?:jawapan\s+(?:saya|aku)\s+(?:ialah|adalah|=))/i.test(t)
    || /\b(?:saya\s+dapat|i\s+got)\s+[\d,x]/i.test(t)
    || /^[\d,]+(?:\.\d+)?\s*(?:biji|buah|orang|cm|kg|guli|kotak|buku)\s*\??$/i.test(t)
    || /\bx\s*=\s*[\d.]+\s*\??$/i.test(t)
  );
}

/** Assistant micro-teaching turn with a student answer slot. */
export function threadHasMicroTeachingBlank(
  recentAssistantMessages: string[] = [],
): boolean {
  return recentAssistantMessages.some((m) => /→\s*_{3,}/.test(m));
}

export function studentRequestsTeachMePattern(message: string): boolean {
  const t = message.trim();
  return (
    /\b(?:ajar\s+(?:saya|aku)|teach\s+me|macam\s+mana\s+nak\s+buat\s+soalan\s+jenis)/i.test(t)
    || /\bboleh\s+ajar\b/i.test(t)
  );
}

export function studentPresentsExamOrHomeworkDump(message: string): boolean {
  const t = message.trim();
  return (
    /\b(?:tolong\s+(?:selesaikan|buat|tulis|jawab)|solve\s+this|do\s+my\s+homework)\b/i.test(t)
    || /\b(?:soalan\s+(?:peperiksaan|spm|upsr|pt3|trial|trial\s+exam))\b/i.test(t)
    || (t.length > 120 && /\d/.test(t) && /\?/.test(t) && !studentShowsPartialWorking(t))
  );
}

export function studentHasNoAttemptSignal(message: string): boolean {
  const t = message.trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (studentShowsPartialWorking(t) || studentShowsFullWorking(t)) return false;
  if (studentRequestsAnswerVerification(t)) return false;
  if (/\b(?:selesaikan|hitung|kira)\b/i.test(t) && /\d/.test(t)) {
    return !studentShowsPartialWorking(t);
  }
  return (
    /\b(?:macam\s+mana|how\s+to)\b/i.test(t)
    || studentAsksMathConcept(t)
    || (/\d/.test(t) && !studentShowsPartialWorking(t) && t.length < 100)
  );
}

export function studentAsksMathProcedural(message: string): boolean {
  return (
    studentShowsPartialWorking(message)
    || studentShowsFullWorking(message)
    || /\b(?:langkah\s+(?:ni|ini|kedua|ketiga)|step\s+\d)\b/i.test(message)
  );
}

/** Assistant already delivered full arithmetic closure summary in this thread. */
export function threadHasArithmeticClosureSummary(
  recentAssistantMessages: string[],
): boolean {
  return recentAssistantMessages.some((msg) =>
    /Jawapan\s*(?:akhir)?\s*:?\s*[\d,\s]{3,}/i.test(msg)
    && /(?:Kaedah\s+penyelesaian|Baki\s+bola|ringkaskan\s+cara|Susunan\s+cara\s+kira|560\s*\+|1\s*561\s*−)/i.test(msg)
  );
}

/** Pelajar jawab satu digit bila guru minta nombor penuh / jawapan akhir. */
export function studentAnsweredSingleDigitAfterFullNumberAsk(
  userMessage: string,
  recentAssistantMessages: string[],
): boolean {
  const t = userMessage.trim();
  if (!/^\d$/.test(t)) return false;
  const last = recentAssistantMessages[0] ?? '';
  return /nombor\s+penuh|jawapan\s+akhir(?:nya)?|apakah\s+nombor|tulis\s+jawapan\s+akhir|nombor\s+penuh\s+yang/i.test(last);
}
