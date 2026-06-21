/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Arithmetic Phase Progression
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

import {
  extractActiveStackOperands,
  tutorColumnDigit,
  tutorReplyClaimsColumnSum,
  tutorReplyMentionsPlaceColumn,
  type TutorPlaceColumn,
} from './tutor-law.place-value-routing';
import { stripTrailingArithmeticBoilerplate } from './tutor-law.arithmetic-closure';

const COLUMN_ORDER: TutorPlaceColumn[] = ['sa', 'puluh', 'ratus', 'ribu'];

export interface AddThenSubtractProblem {
  start:    number;
  add:      number;
  subtract: number;
  unit:     string;
  subject?: string;
}

function fmtStack(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function columnIndex(col: TutorPlaceColumn): number {
  return COLUMN_ORDER.indexOf(col);
}

function nextColumnAfter(col: TutorPlaceColumn): TutorPlaceColumn | null {
  const idx = columnIndex(col);
  return idx >= 0 && idx < COLUMN_ORDER.length - 1 ? COLUMN_ORDER[idx + 1]! : null;
}

/** Pelajar betulkan cikgu — termasuk ulang langkah / loop fasa (bukan semua "sepatutnya"). */
export function tutorStudentFlagsTeachingLoopError(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /\b(?:mengulang|ulang\s+semula|kembali\s+(?:ke|mengulang)|ulang\s+proses)\b/i.test(t)
    || /\bkesilapan\s+dalam\s+penerangan\b/i.test(t)
    || /\bseharusnya\s+selepas\b/i.test(t)
    || (/\bsepatutnya\b/i.test(t) && /\b(?:mengulang|ulang|langkah\s+seterusnya|1561|560\s*\+\s*1001)\b/i.test(t))
    || /\bbukan\s+(?:soalan|proses|bilangan)\b/i.test(t)
    || /\btidak\s+(?:stabil|relevan|kena\s+mengena)\b/i.test(t)
  );
}

function isSimpleColumnAnswer(message: string): boolean {
  const t = message.trim();
  if (!t || t.length > 48) return false;
  if (/\?/.test(t)) return false;
  return (
    /^\d+\s*\+\s*\d+\s*=\s*\d+/i.test(t)
    || /^\d+\s*[-−]\s*\d+\s*=\s*\d+/i.test(t)
    || /^\d+$/.test(t)
  );
}

/** Furthest place-value column the student has already answered in this thread. */
export function tutorInferFurthestColumnInThread(
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  userMessage = '',
): TutorPlaceColumn | null {
  let furthest: TutorPlaceColumn | null = null;
  const userTurns = [...recentUserMessages];
  if (userMessage.trim()) userTurns.push(userMessage);
  const pairCount = Math.max(recentAssistantMessages.length, userTurns.length);

  for (let i = 0; i < pairCount; i++) {
    const assistant = recentAssistantMessages[i];
    const user = userTurns[i];
    if (!assistant?.trim()) continue;

    const col = tutorReplyMentionsPlaceColumn(assistant);
    if (!col) continue;
    if (!/→\s*_{3,}|Berapa\s+\*?\*?\d/i.test(assistant)) continue;
    if (!user?.trim() || !isSimpleColumnAnswer(user)) continue;

    if (!furthest || columnIndex(col) > columnIndex(furthest)) {
      furthest = col;
    }
  }

  return furthest;
}

export function tutorReplyRegressesColumnPhase(
  text: string,
  furthest: TutorPlaceColumn | null,
): boolean {
  if (!text?.trim() || !furthest) return false;
  const current = tutorReplyMentionsPlaceColumn(text);
  if (!current) return false;
  return columnIndex(current) < columnIndex(furthest);
}

export function tutorAdditionPhaseComplete(
  operands: number[],
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  userMessage = '',
): boolean {
  if (operands.length < 2) return false;

  const sum = operands[0]! + operands[1]!;
  const blob = [userMessage, ...recentUserMessages, ...recentAssistantMessages].join('\n');
  if (new RegExp(`\\b${sum}\\b`).test(blob)) return true;

  const furthest = tutorInferFurthestColumnInThread(
    recentUserMessages,
    recentAssistantMessages,
    userMessage,
  );
  if (furthest !== 'ribu') return false;

  const ribuPrompt = recentAssistantMessages.some((m) =>
    /\b(?:Digit|tempat|lajur)\s+\*?\*?Ribu\*?\*?|\bdi\s+tempat\s+\*?\*?Ribu/i.test(m),
  );
  const allUser = [userMessage, ...recentUserMessages];
  const ribuAnswer = allUser.some((m) =>
    /\b0\s*\+\s*1\s*=\s*1\b/i.test(m) || /^1$/.test(m.trim()),
  );

  return ribuPrompt && ribuAnswer;
}

export function tutorReplyStillInAdditionPhase(text: string, operands: number[]): boolean {
  if (!text?.trim() || operands.length < 2) return false;
  if (/\-\s*\d[\d,]*/.test(text) && !/\+/.test(text.split('-')[0] ?? '')) return false;

  const claim = tutorReplyClaimsColumnSum(text);
  if (!claim) return false;

  const col = tutorReplyMentionsPlaceColumn(text) ?? 'sa';
  const d1 = tutorColumnDigit(operands[0]!, col);
  const d2 = tutorColumnDigit(operands[1]!, col);
  return claim.a === d1 && claim.b === d2 && /\+/.test(text);
}

/** Parse tambah-then-tolak word problems (e.g. Penny ping pong). */
export function parseAddThenSubtractProblem(...blobs: string[]): AddThenSubtractProblem | null {
  const blob = blobs.filter(Boolean).join('\n');
  if (!blob.trim()) return null;

  const unitMatch = blob.match(/\b(biji\s+bola\s+ping\s*pong|bola\s+ping\s*pong|biji|buah|guli|kotak)\b/i);
  const unit = unitMatch?.[1]?.toLowerCase().replace(/\s+/g, ' ') ?? 'unit';

  const explicit = blob.match(/(\d[\d,]*)\s*\+\s*(\d[\d,]*)\s*[-−]\s*(\d[\d,]*)/);
  if (explicit) {
    return {
      start:    parseInt(explicit[1]!.replace(/,/g, ''), 10),
      add:      parseInt(explicit[2]!.replace(/,/g, ''), 10),
      subtract: parseInt(explicit[3]!.replace(/,/g, ''), 10),
      unit,
      subject:  /Penny/i.test(blob) ? 'Penny' : undefined,
    };
  }

  const haveM = blob.match(/mempunyai\s+(\d[\d,]*)/i);
  if (!haveM) return null;

  const addM = blob.match(/(?:membeli|serahkan(?:kan)?|diserahkan|tambah(?:kan)?)\s+(\d[\d,]*)/i);
  const subM = blob.match(/(?:memberi|berikan)\s+(\d[\d,]*)[\s\S]{0,80}(?:kepada|kpd)/i)
    ?? blob.match(/(?:memberi|berikan)\s+(?:[\p{L}\s]{1,40}?)(\d[\d,]*)\s*biji/iu);

  if (addM && subM) {
    return {
      start:    parseInt(haveM[1]!.replace(/,/g, ''), 10),
      add:      parseInt(addM[1]!.replace(/,/g, ''), 10),
      subtract: parseInt(subM[1]!.replace(/,/g, ''), 10),
      unit,
      subject:  /Penny/i.test(blob) ? 'Penny' : undefined,
    };
  }

  return null;
}

function extractProblemAnchor(blob: string): string | null {
  if (/Penny|bola\s+ping\s*pong/i.test(blob)) return 'penny';
  if (/Aiman|guli/i.test(blob)) return 'aiman';
  if (/Perpustakaan|buku/i.test(blob)) return 'library';
  return null;
}

/** Prefer the word problem that matches the active thread (avoid Aiman bleed into Penny). */
export function resolveActiveAddThenSubtractProblem(
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): AddThenSubtractProblem | null {
  const anchor = extractProblemAnchor(
    [userMessage, ...recentUserMessages.slice(-4)].join('\n'),
  ) ?? extractProblemAnchor(recentAssistantMessages.slice(-3).join('\n'));

  const sources = [
    userMessage,
    ...recentUserMessages.slice().reverse(),
    ...recentAssistantMessages.slice().reverse(),
  ].filter(Boolean);

  for (const blob of sources) {
    const problem = parseAddThenSubtractProblem(blob);
    if (!problem) continue;
    if (!anchor) return problem;
    const blobAnchor = extractProblemAnchor(blob);
    if (!blobAnchor || blobAnchor === anchor) return problem;
  }

  return null;
}

export function buildTutorSubtractionPhaseRecovery(
  minuend: number,
  subtrahend: number,
  unit: string,
  subject?: string,
): string {
  const d1Sa = tutorColumnDigit(minuend, 'sa');
  const d2Sa = tutorColumnDigit(subtrahend, 'sa');
  const who = subject ? `${subject}` : 'pelajar';

  const lines = [
    'Terima kasih — anda betul semak langkah.',
    '',
    `Hasil tambah sudah lengkap: **${fmtStack(minuend)}** ${unit}.`,
    '',
    `Langkah seterusnya: **tolak** jumlah yang ${who} berikan.`,
    '',
    '```',
    `  ${fmtStack(minuend)}`,
    `- ${fmtStack(subtrahend)}`,
    '-------',
    '```',
    '',
  ];

  if (d1Sa < d2Sa) {
    lines.push(
      `Digit **Sa**: **${d1Sa} − ${d2Sa}** — nombor atas lebih kecil. Perlu **pinjam** dari **Puluh** sebelum tolak.`,
      '',
      'Adakah pelajar faham perlu pinjam? Jika ya, berapa digit **Puluh** selepas pinjam, dan **Sa** selepas pinjam?',
    );
  } else {
    lines.push(
      `Digit **Sa**: **${d1Sa} − ${d2Sa}**`,
      '',
      `Berapa **${d1Sa} − ${d2Sa}** di tempat **Sa**?`,
    );
  }

  lines.push('', '→ ______');
  return lines.join('\n');
}

function buildTutorNextColumnRecovery(
  operands: number[],
  column: TutorPlaceColumn,
): string {
  const d1 = tutorColumnDigit(operands[0]!, column);
  const d2 = tutorColumnDigit(operands[1]!, column);
  const label = column === 'sa' ? 'Sa' : column === 'puluh' ? 'Puluh' : column === 'ratus' ? 'Ratus' : 'Ribu';

  return [
    `Teruskan — jangan ulang lajur yang sudah selesai.`,
    '',
    `Digit **${label}**: **${d1} + ${d2}**`,
    '',
    `Berapa **${d1} + ${d2}** di tempat **${label}**?`,
    '→ ______',
  ].join('\n');
}

function stripRegressionParagraphs(text: string, regressedBelow: TutorPlaceColumn): string {
  const threshold = columnIndex(regressedBelow);

  return text
    .split(/\n{2,}/)
    .filter((p) => {
      const t = p.trim();
      if (!t) return false;
      if (/Cikgu tidak siapkan kiraan penuh/i.test(t)) return false;
      if (/Mari betulkan langkah/i.test(t)) return false;
      if (/satu langkah\s+\*?\*?Sa\*?\*?\s+sahaja/i.test(t)) return false;

      const col = tutorReplyMentionsPlaceColumn(t);
      if (col && columnIndex(col) < threshold) return false;

      const claim = tutorReplyClaimsColumnSum(t);
      if (claim && col && columnIndex(col) < threshold) return false;

      return true;
    })
    .join('\n\n')
    .trim();
}

export function tutorReplyBleedsWrongProblemAnchor(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
): boolean {
  if (!text?.trim()) return false;
  const anchor = extractProblemAnchor(
    [userMessage, ...recentUserMessages.slice(-5)].join('\n'),
  );
  if (!anchor) return false;
  if (anchor === 'penny' && /\b(?:Aiman|934\s*[−-]\s*366|1\s*023\s+kotak)\b/i.test(text)) {
    return true;
  }
  if (anchor === 'aiman' && /\b(?:Penny|bola\s+ping\s*pong|560\s*\+\s*1001)\b/i.test(text)) {
    return true;
  }
  return false;
}

/** Prevent column loop regression and advance to subtraction when addition is done. */
export function enforceTutorPlaceValuePhaseGuard(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  const operands = extractActiveStackOperands(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
    text,
  );
  if (operands.length < 2) return stripTrailingArithmeticBoilerplate(text);

  const furthest = tutorInferFurthestColumnInThread(
    recentUserMessages,
    recentAssistantMessages,
    userMessage,
  );
  const additionDone = tutorAdditionPhaseComplete(
    operands,
    recentUserMessages,
    recentAssistantMessages,
    userMessage,
  );
  const loopFix = tutorStudentFlagsTeachingLoopError(userMessage);
  const addSubProblem = resolveActiveAddThenSubtractProblem(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );

  if ((loopFix || additionDone) && addSubProblem) {
    const sum = addSubProblem.start + addSubProblem.add;
    if (
      additionDone
      || loopFix
      || tutorReplyRegressesColumnPhase(text, furthest)
      || tutorReplyStillInAdditionPhase(text, operands)
      || tutorReplyBleedsWrongProblemAnchor(text, userMessage, recentUserMessages)
    ) {
      return buildTutorSubtractionPhaseRecovery(
        sum,
        addSubProblem.subtract,
        addSubProblem.unit,
        addSubProblem.subject,
      );
    }
  }

  let out = stripTrailingArithmeticBoilerplate(text);

  if (tutorReplyRegressesColumnPhase(out, furthest) && furthest) {
    out = stripRegressionParagraphs(out, furthest);

    if (additionDone && addSubProblem) {
      const sum = addSubProblem.start + addSubProblem.add;
      return buildTutorSubtractionPhaseRecovery(
        sum,
        addSubProblem.subtract,
        addSubProblem.unit,
        addSubProblem.subject,
      );
    }

    const next = nextColumnAfter(furthest);
    if (next) {
      return `${out}\n\n${buildTutorNextColumnRecovery(operands, next)}`.replace(/\n{3,}/g, '\n\n').trim();
    }
  }

  return out;
}
