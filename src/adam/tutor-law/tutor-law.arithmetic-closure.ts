/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Arithmetic Session Closure
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

import { parseTutorIntegers } from './tutor-law.place-value-routing';
import { studentAsksTutorFullWorkingLayout } from './tutor-law.percentage-routing';
import { tutorThreadIsMultiStepArithmetic } from './tutor-law.arithmetic-proficiency';
import {
  resolveActiveAddThenSubtractProblem,
  tutorStudentFlagsTeachingLoopError,
} from './tutor-law.arithmetic-phase';

export interface SubtractThenAddProblem {
  start:    number;
  subtract: number;
  add:      number;
  unit:     string;
  subject?: string;
}

function fmtStack(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Pelajar nyatakan jawapan akhir (termasuk ayat panjang dengan 2023 biji guli). */
export function studentStatesFinalArithmeticAnswer(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/jawapan\s+akhir|maka\s+jawapan|hasil(?:nya)?\s+(?:ialah|adalah)/i.test(t) && /\d[\d,]{2,}/.test(t)) {
    return true;
  }
  if (tutorStudentFlagsTeachingLoopError(t)) return false;
  if (/\?/.test(t) && !/jawapan\s+akhir/i.test(t)) return false;
  if (
    /\b(?:kesilapan|mengulang|ulang\s+semula|keliru|bukan\s+(?:soalan|proses))\b/i.test(t)
    && t.length > 50
    && !/jawapan\s+akhir/i.test(t)
  ) {
    return false;
  }
  if (/^[\d,]+(?:\.\d+)?\s*(?:biji|buah|guli|kotak|buku|orang|kg)?\.?$/i.test(t)) return true;
  if (/^\d(?:\s\d{3})+\s*(?:biji|buah|guli|orang|kotak|buku)?\.?$/i.test(t)) return true;
  if (/^=\s*[\d,]+/i.test(t)) return true;
  if (/^(?:betul|ya|yes|ok)\b/i.test(t) && t.length <= 24) return true;
  if (/\b\d[\d,]{3,}\s*(?:biji|buah|guli)\b/i.test(t) && t.length <= 140) return true;
  if (
    /rumah\s+ribu.*\d[\d,]{3,}/i.test(t)
    && /\d\s*\+\s*\d/.test(t)
    && !/\b(?:kesilapan|mengulang|sepatutnya)\b/i.test(t)
  ) {
    return true;
  }

  return false;
}

export function studentRequestsArithmeticSummary(message: string): boolean {
  return studentAsksTutorFullWorkingLayout(message)
    || /\brumus(?:kan)?\s+keseluruhan\b/i.test(message)
    || /\bkaedah\s+penyelesaian\b/i.test(message)
    || /\bmohon\s+buatkan\s+rumus\b/i.test(message)
    || /\bsusunan\s+cara\s+kira\b/i.test(message);
}

function extractProblemAnchor(blob: string): string | null {
  if (/Penny|bola\s+ping\s*pong/i.test(blob)) return 'penny';
  if (/Aiman|guli/i.test(blob)) return 'aiman';
  if (/Perpustakaan|buku/i.test(blob)) return 'library';
  return null;
}

/** Parse tolak-then-tambah word problems (e.g. guli Aiman). */
export function parseSubtractThenAddProblem(...blobs: string[]): SubtractThenAddProblem | null {
  const blob = blobs.filter(Boolean).join('\n');
  if (!blob.trim()) return null;

  const unitMatch = blob.match(/\b(biji\s+guli|guli|buku|buah|kotak)\b/i);
  const unit = unitMatch?.[1]?.toLowerCase() ?? 'unit';

  const explicit = blob.match(/(\d[\d,]*)\s*[-−]\s*(\d[\d,]*)\s*\+\s*(\d[\d,]*)/);
  if (explicit) {
    return {
      start:    parseInt(explicit[1]!.replace(/,/g, ''), 10),
      subtract: parseInt(explicit[2]!.replace(/,/g, ''), 10),
      add:      parseInt(explicit[3]!.replace(/,/g, ''), 10),
      unit,
      subject:  /Aiman/i.test(blob) ? 'Aiman' : undefined,
    };
  }

  const haveM = blob.match(/mempunyai\s+(\d[\d,]*)/i);
  if (!haveM) return null;

  const subM = blob.match(/memberikan\s+(\d[\d,]*)[\s\S]{0,60}kepada/i)
    ?? blob.match(/berikan\s+(\d[\d,]*)[\s\S]{0,40}kepada/i);
  const addM = blob.match(/(?:keesokan|Pak Abu)[\s\S]{0,120}?memberikan\s+(\d[\d,]*)/i)
    ?? blob.match(/(?:keesokan|Pak Abu)[\s\S]{0,120}?berikan\s+(\d[\d,]*)/i);

  if (subM && addM) {
    return {
      start:    parseInt(haveM[1]!.replace(/,/g, ''), 10),
      subtract: parseInt(subM[1]!.replace(/,/g, ''), 10),
      add:      parseInt(addM[1]!.replace(/,/g, ''), 10),
      unit,
      subject:  /Aiman/i.test(blob) ? 'Aiman' : undefined,
    };
  }

  const nums = parseTutorIntegers(blob);
  if (nums.length >= 3 && /\btolak\b|\btambah\b|memberikan/i.test(blob)) {
    return {
      start:    nums[0]!,
      subtract: nums[1]!,
      add:      nums[2]!,
      unit,
    };
  }

  return null;
}

export function buildConciseSubtractThenAddSummary(problem: SubtractThenAddProblem): string {
  const afterSub = problem.start - problem.subtract;
  const final    = afterSub + problem.add;
  const who      = problem.subject ?? 'pelajar';
  const unit     = problem.unit;

  return [
    'Terima kasih — ringkasan padat:',
    '',
    `**Perlu dicari:** jumlah ${unit} yang ${who} miliki sekarang.`,
    `**Operasi:** tambah dan tolak — ${fmtStack(problem.start)} − ${fmtStack(problem.subtract)} + ${fmtStack(problem.add)}`,
    '',
    '**Kaedah penyelesaian:**',
    '',
    'Langkah 1 — tolak:',
    '```',
    `  ${fmtStack(problem.start)}`,
    `- ${fmtStack(problem.subtract)}`,
    '-------',
    `  ${fmtStack(afterSub)}`,
    '```',
    '',
    'Langkah 2 — tambah:',
    '```',
    `  ${fmtStack(afterSub)}`,
    `+ ${fmtStack(problem.add)}`,
    '-------',
    `  ${fmtStack(final)}`,
    '```',
    '',
    `**Jawapan akhir:** ${fmtStack(final)} ${unit}.`,
    '',
    'Nak latihan lain yang serupa?',
  ].join('\n');
}

export function tutorReplyHasArithmeticWorkingSummary(
  text: string,
  problem?: SubtractThenAddProblem | null,
): boolean {
  if (!text?.trim()) return false;
  if (!/Jawapan\s+akhir|Jawapan:/i.test(text)) return false;
  if (!/Langkah\s+1|Kaedah\s+penyelesaian/i.test(text)) return false;

  const equals = (text.match(/=\s*[\d,]+/g) ?? []).length;
  if (equals < 2) return false;

  if (problem) {
    const final = problem.start - problem.subtract + problem.add;
    const finalStr = String(final).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return new RegExp(finalStr.replace(/\s/g, '\\s*')).test(text);
  }

  return true;
}

/** Remove erroneous "Mari betulkan langkah … 0 + 0" boilerplate and zero-answer nudges. */
export function stripTrailingArithmeticBoilerplate(text: string): string {
  let out = text;

  out = out
    .split(/\n{2,}/)
    .filter((p) => {
      if (!/Mari betulkan langkah/i.test(p)) return true;
      if (/\*\*0\*\*\s*\+\s*\*\*0\*\*|\b0\s*\+\s*0\b/.test(p)) return false;
      return true;
    })
    .join('\n\n');

  out = out
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/Mari betulkan langkah/i.test(t)) return false;
      if (/Digit\s+\*\*(?:Sa|Puluh|Ratus|Ribu)\*\*:\s*\*\*0\*\*\s*\+\s*\*\*0\*\*/i.test(t)) {
        return false;
      }
      if (/Berapa\s+\*\*0\s*\+\s*0\*\*/i.test(t)) return false;
      return true;
    })
    .join('\n');

  out = out.replace(
    /\nMari betulkan langkah\s+\*\*(?:Sa|Puluh|Ratus|Ribu)\*\*[\s\S]*?→\s*_{3,}\s*$/gi,
    '',
  );
  out = out.replace(
    /\n(?:Cikgu|Teacher)\s+tidak\s+siapkan\s+kiraan\s+penuh[^\n]*/gi,
    '',
  );
  out = out.replace(/\nMari betulkan langkah[\s\S]*?→\s*_{3,}\s*$/gi, '');
  out = out.replace(/\n→\s*_{3,}\s*$/g, '');

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export function tutorReplyAcknowledgesOwnError(text: string): boolean {
  return /\b(?:kesilapan\s+saya|saya\s+tersilap|saya\s+akui|tidak\s+tepat|salah\s+menyebut|itu\s+kesilapan\s+saya)\b/i.test(text);
}

function resolveActiveSubtractThenAddProblem(
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): SubtractThenAddProblem | null {
  const anchor = extractProblemAnchor(
    [userMessage, ...recentUserMessages.slice(-4)].join('\n'),
  ) ?? extractProblemAnchor(recentAssistantMessages.slice(-3).join('\n'));

  const sources = [
    userMessage,
    ...recentUserMessages.slice().reverse(),
    ...recentAssistantMessages.slice().reverse(),
  ].filter(Boolean);

  for (const blob of sources) {
    const problem = parseSubtractThenAddProblem(blob);
    if (!problem) continue;
    if (!anchor) return problem;
    const blobAnchor = extractProblemAnchor(blob);
    if (!blobAnchor || blobAnchor === anchor) return problem;
  }

  return null;
}

/** Replace verbose / broken replies with concise closure when problem is done. */
export function enforceTutorArithmeticClosureGuard(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  const cleaned = stripTrailingArithmeticBoilerplate(text);

  if (tutorStudentFlagsTeachingLoopError(userMessage)) {
    return cleaned;
  }

  const multiStep = tutorThreadIsMultiStepArithmetic(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );

  const wantsSummary = studentRequestsArithmeticSummary(userMessage)
    || studentStatesFinalArithmeticAnswer(userMessage);

  if (!wantsSummary || !multiStep) {
    return cleaned;
  }

  if (resolveActiveAddThenSubtractProblem(userMessage, recentUserMessages, recentAssistantMessages)) {
    return cleaned;
  }

  const problem = resolveActiveSubtractThenAddProblem(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );
  if (!problem) return cleaned;

  if (
    studentStatesFinalArithmeticAnswer(userMessage)
    && !studentRequestsArithmeticSummary(userMessage)
    && tutorReplyHasArithmeticWorkingSummary(cleaned, problem)
  ) {
    return cleaned;
  }

  return buildConciseSubtractThenAddSummary(problem);
}
