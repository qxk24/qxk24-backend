/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Place Value Column Routing
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

export type TutorPlaceColumn = 'sa' | 'puluh' | 'ratus' | 'ribu';

const COLUMN_LABEL: Record<TutorPlaceColumn, string> = {
  sa:    'Sa',
  puluh: 'Puluh',
  ratus: 'Ratus',
  ribu:  'Ribu',
};

export function parseTutorIntegers(text: string): number[] {
  const matches = text.match(/\d[\d,]*/g) ?? [];
  return matches
    .map((m) => parseInt(m.replace(/,/g, ''), 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

/** Best-effort pair for stacked addition from thread text. */
export function extractAdditionOperands(...messages: string[]): number[] {
  const blob = messages.filter(Boolean).join('\n');
  if (!/\btambah\b|\+|jumlah|keseluruhan|kira\b/i.test(blob)) return [];

  const sumMatch = blob.match(/(\d[\d,]*)\s*[+\+]\s*(\d[\d,]*)/);
  if (sumMatch) {
    return [
      parseInt(sumMatch[1]!.replace(/,/g, ''), 10),
      parseInt(sumMatch[2]!.replace(/,/g, ''), 10),
    ];
  }

  const nums = parseTutorIntegers(blob);
  if (nums.length >= 2) return [nums[0]!, nums[1]!];
  return [];
}

/** Operands for the active vertical-form addition step (not the original story pair). */
export function extractActiveStackOperands(
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
  replyText = '',
): number[] {
  const recent = [...recentAssistantMessages.slice(-6), replyText, userMessage, ...recentUserMessages.slice(-2)].join('\n');

  const vertical = recent.match(/(\d[\d\s,]*)\s*\n\s*\+\s*(\d[\d\s,]*)\s*\n\s*-+/);
  if (vertical) {
    const a = parseInt(vertical[1]!.replace(/[\s,]/g, ''), 10);
    const b = parseInt(vertical[2]!.replace(/[\s,]/g, ''), 10);
    if (Number.isFinite(a) && Number.isFinite(b)) return [a, b];
  }

  const addMatches = [...recent.matchAll(/(\d[\d,]*)\s*\+\s*(\d[\d,]*)/g)];
  const substantial = addMatches.filter((m) => {
    const a = parseInt(m[1]!.replace(/,/g, ''), 10);
    const b = parseInt(m[2]!.replace(/,/g, ''), 10);
    return a >= 100 || b >= 100;
  });
  if (substantial.length > 0) {
    const last = substantial[substantial.length - 1]!;
    return [
      parseInt(last[1]!.replace(/,/g, ''), 10),
      parseInt(last[2]!.replace(/,/g, ''), 10),
    ];
  }
  if (addMatches.length > 0) {
    const last = addMatches[addMatches.length - 1]!;
    return [
      parseInt(last[1]!.replace(/,/g, ''), 10),
      parseInt(last[2]!.replace(/,/g, ''), 10),
    ];
  }

  return extractAdditionOperands(userMessage, ...recentUserMessages, replyText);
}

export function tutorColumnDigit(n: number, column: TutorPlaceColumn): number {
  switch (column) {
    case 'sa':
      return n % 10;
    case 'puluh':
      return Math.floor(n / 10) % 10;
    case 'ratus':
      return Math.floor(n / 100) % 10;
    case 'ribu':
      return Math.floor(n / 1000) % 10;
    default:
      return 0;
  }
}

export function tutorThreadIsPlaceValueAddition(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  const blob = [userMessage, ...recentUserMessages, ...recentAssistantMessages].join('\n');
  if (!/\btambah\b|\+|jumlah|keseluruhan/i.test(blob)) return false;

  const operands = extractAdditionOperands(blob);
  if (operands.length < 2) return false;

  return operands.some((n) => n >= 10) || /\btempat\s+\*?\*?Sa\b|\bPuluh\b|\bsusunan\s+menegak/i.test(blob);
}

const COLUMN_PATTERNS: Record<TutorPlaceColumn, RegExp> = {
  sa:    /\bDigit\s+\*?\*?Sa\*?\*?|\btempat\s+\*?\*?Sa\*?\*?|\blajur\s+\*?\*?Sa\*?\*?|\bdi\s+tempat\s+\*?\*?Sa|\bsatuan\b/i,
  puluh: /\bDigit\s+\*?\*?Puluh\*?\*?|\btempat\s+\*?\*?Puluh\*?\*?|\blajur\s+\*?\*?Puluh\*?\*?|\bdi\s+tempat\s+\*?\*?Puluh/i,
  ratus: /\bDigit\s+\*?\*?Ratus\*?\*?|\btempat\s+\*?\*?Ratus\*?\*?|\blajur\s+\*?\*?Ratus\*?\*?|\bdi\s+tempat\s+\*?\*?Ratus/i,
  ribu:  /\bDigit\s+\*?\*?Ribu\*?\*?|\btempat\s+\*?\*?Ribu\*?\*?|\blajur\s+\*?\*?Ribu\*?\*?|\bdi\s+tempat\s+\*?\*?Ribu/i,
};

export function tutorParagraphActiveColumn(paragraph: string): TutorPlaceColumn | null {
  if (!paragraph?.trim()) return null;
  for (const [col, pattern] of Object.entries(COLUMN_PATTERNS) as [TutorPlaceColumn, RegExp][]) {
    if (pattern.test(paragraph)) return col;
  }
  return null;
}

export function tutorReplyMentionsPlaceColumn(text: string): TutorPlaceColumn | null {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i]!;
    if (!tutorReplyClaimsColumnSum(p)) continue;
    const active = tutorParagraphActiveColumn(p);
    if (active) return active;
  }

  for (const col of ['sa', 'puluh', 'ratus', 'ribu'] as TutorPlaceColumn[]) {
    if (COLUMN_PATTERNS[col].test(text)) return col;
  }
  return null;
}

/** First "X + Y" pair tied to a micro-teaching step (prefers column step over stray totals). */
export function tutorReplyClaimsColumnSum(text: string): { a: number; b: number } | null {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i]!;
    const patterns = [
      /(?:berapa|Berapa)\s+\*?\*?(\d+)\s*\+\s*(\d+)\*?\*?/i,
      /\*\*(\d+)\s*\+\s*(\d+)\*\*/,
    ];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const m = p.match(pattern);
      if (m) return { a: parseInt(m[1]!, 10), b: parseInt(m[2]!, 10) };
    }
  }

  const m = text.match(/(\d+)\s*\+\s*(\d+)\s*=\s*\d+/);
  if (m) return { a: parseInt(m[1]!, 10), b: parseInt(m[2]!, 10) };
  return null;
}

export function tutorReplyMisalignsPlaceValueColumn(
  text: string,
  operands: number[],
  column: TutorPlaceColumn = 'sa',
): boolean {
  if (!text?.trim() || operands.length < 2) return false;

  const mentioned = tutorReplyMentionsPlaceColumn(text) ?? column;
  const claim = tutorReplyClaimsColumnSum(text);
  if (!claim) return false;

  const expectedA = tutorColumnDigit(operands[0]!, mentioned);
  const expectedB = tutorColumnDigit(operands[1]!, mentioned);
  if (claim.a === expectedA && claim.b === expectedB) return false;

  return true;
}

export function buildTutorPlaceValueColumnRecovery(
  operands: number[],
  column: TutorPlaceColumn = 'sa',
): string {
  const [n1, n2] = operands;
  const d1 = tutorColumnDigit(n1!, column);
  const d2 = tutorColumnDigit(n2!, column);
  const label = COLUMN_LABEL[column];

  return [
    `Mari betulkan langkah **${label}** (digit lajur ${label} — bukan lajur lain):`,
    '',
    `Digit **${label}**: **${d1}** + **${d2}**`,
    '',
    `Berapa **${d1} + ${d2}** di tempat **${label}**?`,
    '→ ______',
  ].join('\n');
}
