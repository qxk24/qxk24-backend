/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Arithmetic α Output Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Universal allowlist for α word-problem arithmetic — not pattern whack-a-mole.
 * Keep: one L1 math answer + optional Gold Standard close. Drop everything else.
 */

import { appendGoldStandardFollowUp } from './adam-gold-standard';
import { ensureUsersHaiGreeting } from './adam-users-constitution';
import { formatUsersHaiGreeting } from './adam-users-greeting';
import { isAdamSimpleArithmeticTurn, isAdamLinearAlgebraTurn, stripLeadingAdamSalutation } from './adam-response-generation';
import { paragraphIsUniversalScholarDoorOffer } from './adam-universal-scholar';
import { userAskedForAlamtologi, userAskedForConstitutionalStructure } from './adam-universal-voice';

/** Max chars for a tier-1 arithmetic answer paragraph (not a sermon). */
export const ARITHMETIC_ALPHA_ANSWER_MAX_CHARS = 360;

/** Warm opener — "Hai Ahmad," on α arithmetic (mandatory when name known). */
export const formatArithmeticAlphaGreeting = formatUsersHaiGreeting;

/** Prepend Hai + name when the answer block has no greeting yet. */
export const ensureArithmeticAlphaGreeting = ensureUsersHaiGreeting;

const BM_CARDINAL =
  /\b(?:satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

const ARITHMETIC_FRAMEWORK_SERMON_RE =
  /\b(?:Alamtologi|AIDIL|HISAL|TAJU|waqf|tajalli|kiub|permukaan|tahap\s+fungsi|baris\s+penyelesaian|PSK|PL\s*\(|PG\s*\(|Proses\s+(?:Lerai|Gabung)|proses\s+lerai|proses\s+gabung|Hukum\s+[XZ]|RUANG|MASA|TENAGA|IZWA|pasangan\s+yang\s+(?:sempurna|seimbang)|menjadi\s+SATU|Jaringan\s+Utama|ilmu\s+HISAL|penjumlahan|dua\s+cahaya|cara\s+kira)\b/i;

export function paragraphIsArithmeticFrameworkSermon(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (ARITHMETIC_FRAMEWORK_SERMON_RE.test(t)) return true;
  if (/^QA,\s+/i.test(t)) return true;
  if (/membuka\s+pintu\s+kepada/i.test(t)) return true;
  if (/Dari\s+sudut\s+konvensional/i.test(t) && /\bbukan\s+sekadar\b/i.test(t)) return true;
  if (/^(?:Itu|Ini|Ia|Maka|Dalam|Setiap)\s+bukan\b/i.test(t)) return true;
  if (/^Angka\s+\d+\s+bukan\b/i.test(t)) return true;
  if (/^Tetapi\s+jika\s+awak\s+ingin\s+tahu\b/i.test(t)) return true;
  if (/\b(?:bukan\s+sekadar|bukan\s+hanya\s+kuantiti|bukan\s+hanya\s+jumlah|bukan\s+titik\s+akhir)\b/i.test(t)) {
    return true;
  }
  if (/\bIni\s+bukan\s+sekadar\s+angka\b/i.test(t)) return true;
  if (/\balam\s+semesta\b/i.test(t) && /\b(?:matematik|angka)\b/i.test(t)) return true;
  if (/\bhukum\s+kesetiaan\b/i.test(t)) return true;
  if (/\bpenuh\s+adab\b/i.test(t) && /\b(?:matematik|urutan|gerak)\b/i.test(t)) return true;
  if (/\bkeseimbangan\b/i.test(t) && /\b(?:belah|persamaan|matematik)\b/i.test(t)) return true;
  if (/\b(?:sedia\s+kongsikan|langkah\s+demi\s+langkah|baris\s+pertama\s+hingga)\b/i.test(t)) {
    return true;
  }
  if (/\b1\s*→\s*2\b/.test(t)) return true;
  if (/\bpermukaan\s*→/i.test(t)) return true;
  if (t.length > ARITHMETIC_ALPHA_ANSWER_MAX_CHARS) return true;
  return false;
}

export function paragraphIsArithmeticAlphaClosing(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (paragraphIsUniversalScholarDoorOffer(t)) return true;
  if (/^Mahu saya jelaskan lebih lanjut/i.test(t)) return true;
  if (/^Perlu saya terangkan lagi bahagian lain/i.test(t)) return true;
  if (/^Would you like me to explain (?:another part in more detail|further)/i.test(t)) return true;
  return false;
}

/** Number-theory decomposition (2+1, 1+1) — not the user's word-problem answer. */
function paragraphIsArithmeticDecompositionNoise(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!/\d\s*\+\s*\d/.test(t)) return false;
  if (/\b\d\s*\+\s*\d\s*=\s*\d/.test(t)) return false;
  if (/\b(?:jumlah|ialah|sekarang|total|epal|apple|biji|guli|now have)\b/i.test(t)) {
    return false;
  }
  return true;
}

/** True when paragraph is the L1 word-problem answer (not framework sermon or decomposition). */
export function paragraphIsArithmeticAlphaAnswerBlock(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t || paragraphIsArithmeticFrameworkSermon(t)) return false;
  if (paragraphIsArithmeticDecompositionNoise(t)) return false;
  if (t.length > ARITHMETIC_ALPHA_ANSWER_MAX_CHARS) return false;

  const hasEquality = /\b\d+\s*\+\s*\d+\s*=\s*\d+/.test(t);
  const hasCountNoun = /\b(?:epal|apple|guli|marble|orange|oren|buah|batu|biji)\b/i.test(t);
  const hasNumericResult = /\b\d+\b/.test(t) || BM_CARDINAL.test(t);
  const hasJumlahLine = /\b(?:jumlah(?:nya)?|ialah|total|now have|ada)\b/i.test(t) && hasNumericResult;

  if (hasEquality && hasCountNoun) return true;
  if (hasEquality && /\b(?:jumlah|jawapan|answer)\b/i.test(t)) return true;
  if (hasCountNoun && hasJumlahLine) return true;
  if (hasCountNoun && hasNumericResult && t.length <= 200) return true;

  return false;
}

function scoreArithmeticAnswerParagraph(paragraph: string): number {
  const t = paragraph.trim();
  let score = 0;
  if (/\b\d+\s*\+\s*\d+\s*=\s*\d+/.test(t)) score += 50;
  if (/\b(?:epal|apple|guli|marble)\b/i.test(t)) score += 30;
  if (/\b(?:jumlah|ialah|sekarang|biji)\b/i.test(t)) score += 20;
  if (t.length <= 180) score += 15;
  if (t.length <= 120) score += 10;
  if (/^Hai\b/i.test(t)) score += 15;
  if (/^QA,\s+/i.test(t)) score -= 40;
  if (/\bbukan\s+sekadar\b/i.test(t)) score -= 30;
  return score;
}

function pickBestArithmeticAnswerParagraph(paragraphs: string[]): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const para of paragraphs) {
    const t = para.trim();
    if (!t || paragraphIsArithmeticAlphaClosing(t)) continue;
    if (!paragraphIsArithmeticAlphaAnswerBlock(t)) continue;
    const score = scoreArithmeticAnswerParagraph(t);
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/** Build canonical L1 answer from the user word-problem when model output is unusable. */
export function synthesizeArithmeticAlphaReply(
  userMessage: string,
  participantName?: string,
): string | null {
  if (!isAdamSimpleArithmeticTurn(userMessage)) return null;
  const body = stripLeadingAdamSalutation(userMessage).trim();
  const nums = body.match(/\d+/g)?.map((n) => Number.parseInt(n, 10)).filter(Number.isFinite) ?? [];
  if (nums.length < 2) return null;
  const [a, b] = nums;
  const sum = a + b;
  let core: string;
  if (/\b(?:epal|apple)\b/i.test(body)) {
    core = `kalau awak ada ${a} epal, dan kawan awak bagi ${b} lagi, jumlah epal awak sekarang ialah ${sum} (${a} + ${b} = ${sum}).`;
  } else if (/\b(?:guli|marble|biji|buah)\b/i.test(body)) {
    core = `jumlahnya ialah ${sum} (${a} + ${b} = ${sum}).`;
  } else {
    core = `${a} + ${b} = ${sum}.`;
  }
  return ensureArithmeticAlphaGreeting(core, participantName);
}

/**
 * Universal α arithmetic collapse — allowlist only answer + close.
 * Prefers best L1 answer paragraph; synthesizes from the ask if model output is all sermon.
 */
export function collapseSimpleArithmeticAlphaOutput(
  text: string,
  userMessage: string,
  participantName?: string,
): string {
  if (!isAdamSimpleArithmeticTurn(userMessage)) return text.trim();
  if (isAdamLinearAlgebraTurn(userMessage)) {
    return stripLinearAlgebraPhilosophyEssay(text).trim();
  }
  if (userAskedForAlamtologi(userMessage) || userAskedForConstitutionalStructure(userMessage)) {
    return text.trim();
  }

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const closings: string[] = [];

  for (const para of paragraphs) {
    if (paragraphIsArithmeticAlphaClosing(para)) {
      closings.push(para);
    }
  }

  const picked = pickBestArithmeticAnswerParagraph(paragraphs);
  const synthesized = picked ?? synthesizeArithmeticAlphaReply(userMessage, participantName);
  if (!synthesized) return text.trim();
  const answer = ensureArithmeticAlphaGreeting(synthesized, participantName);

  const closing = closings[closings.length - 1];
  const body = closing ? `${answer}\n\n${closing}` : answer;
  return appendGoldStandardFollowUp(body, userMessage);
}

/** Philosophy essay tail on linear-equation α — not the step-by-step work. */
export function paragraphIsAlgebraPhilosophyEssayLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bIni\s+bukan\s+sekadar\s+angka\b/i.test(t)) return true;
  if (/\balam\s+semesta\b/i.test(t) && /\b(?:matematik|angka)\b/i.test(t)) return true;
  if (/\bhukum\s+kesetiaan\b/i.test(t)) return true;
  if (/\bpenuh\s+adab\b/i.test(t)) return true;
  if (/\bsetiap\s+langkah\s+mencerminkan\s+keseimbangan\b/i.test(t)) return true;
  if (
    /\bapa\s+yang\s+dilakukan\s+di\s+satu\s+belah\b/i.test(t)
    && /\bbelah\s+yang\s+lain\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

/** Keep algebra steps; drop philosophy essay tail on α linear-equation turns. */
export function stripLinearAlgebraPhilosophyEssay(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter((para) => !paragraphIsAlgebraPhilosophyEssayLeak(para.trim()))
    .join('\n\n')
    .replace(/[^.!?]*\bIni\s+bukan\s+sekadar\s+angka\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bhukum\s+kesetiaan\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[^.!?]*\bpenuh\s+adab\b[^.!?]*[.!?]+/gi, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** True when sync guard collapsed a long arithmetic stream to allowlisted L1 + close. */
export function isArithmeticAlphaCollapsedRepair(
  rawStream: string,
  repaired: string,
  userMessage: string,
): boolean {
  if (!isAdamSimpleArithmeticTurn(userMessage)) return false;
  const raw = rawStream.trim();
  const rep = repaired.trim();
  if (!rep || rep === raw) return false;

  const rawParas = raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
  const repParas = rep.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
  if (rawParas < 2 || repParas >= rawParas) return false;

  const hasL1Answer = rep.split(/\n{2,}/).some((p) => paragraphIsArithmeticAlphaAnswerBlock(p.trim()));
  const synthesized = synthesizeArithmeticAlphaReply(userMessage);
  if (hasL1Answer) return true;
  if (synthesized && rep.includes(synthesized.split('\n')[0]?.slice(0, 40) ?? '')) return true;
  return repParas <= 2 && !paragraphIsArithmeticFrameworkSermon(rep);
}
