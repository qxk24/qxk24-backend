/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Visual Draw Output Guard
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
 * When user asks lukiskan / draw — reply must SHOW shapes (ASCII), not essay.
 * Uses <adam-visual-draw> tags — NOT markdown fences (SSE + cleanAdamText eat them).
 */

import { appendGoldStandardFollowUp } from './adam-gold-standard';
import { formatUsersHaiGreeting, userAddressedAdamByName } from './adam-users-greeting';
import { paragraphIsExplainBackSoulStrikeLeak } from './adam-users-output-law';
import { isAdamVisualDrawTurn } from './adam-response-generation';
import { userAskedForAlamtologi, userAskedForConstitutionalStructure } from './adam-universal-voice';

export const ADAM_VISUAL_DRAW_TAG_OPEN = '<adam-visual-draw>';
export const ADAM_VISUAL_DRAW_TAG_CLOSE = '</adam-visual-draw>';

/** ASCII art only — dots and box chars; never asterisks (markdown bold). */
export const VISUAL_DRAW_SHAPE_INNER = [
  'Bulatan:',
  '    ....',
  '  ..    ..',
  ' .        .',
  ' .        .',
  '  ..    ..',
  '    ....',
  '',
  'Segiempat:',
  ' +----------+',
  ' |          |',
  ' |          |',
  ' +----------+',
].join('\n');

export const VISUAL_DRAW_SHAPE_BLOCK = [
  ADAM_VISUAL_DRAW_TAG_OPEN,
  VISUAL_DRAW_SHAPE_INNER,
  ADAM_VISUAL_DRAW_TAG_CLOSE,
].join('\n');

const GEOMETRY_POETIC_LEAK_RE =
  /\b(?:langit\s+yang\s+bulat|bumi\s+yang\s+kita\s+huni|tenaga\s+tersebar|keseimbangan\s+penuh|kelengkapan\s+tanpa\s+batas|ketertiban\s+melalui\s+batas|saling\s+melengkapi\s+seperti|simetri\s+sempurna\s+dalam\s+semua\s+arahan|tiada\s+permulaan\s+atau\s+akhir|seperti\s+MASA\s+dan\s+TENAGA|MASA\s+dan\s+TENAGA)\b/i;

const FRAMEWORK_BILLBOARD_RE = /\b(?:MASA|TENAGA|HISAL|AIDIL|TAJU|RUANG)\b/i;

export function paragraphIsGeometryPoeticLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (GEOMETRY_POETIC_LEAK_RE.test(t)) return true;
  if (FRAMEWORK_BILLBOARD_RE.test(t)) return true;
  if (paragraphIsExplainBackSoulStrikeLeak(t)) return true;
  if (/\b(?:hati\s+yang\s+bersih|warisan\s+budaya|ruang\s+latihan|kesinambungan|keabadian|tamparan)\b/i.test(t) && t.length > 100) {
    return true;
  }
  return false;
}

export function outputHasDrawnShapes(text: string): boolean {
  const t = text.trim();
  if (t.includes(ADAM_VISUAL_DRAW_TAG_OPEN) && t.includes(ADAM_VISUAL_DRAW_TAG_CLOSE)) return true;
  if (/\+[-+]+\+/.test(t) && /\|/.test(t)) return true;
  if (/\.{4,}/.test(t)) return true;
  if (/[○◯□■▢]/.test(t)) return true;
  return false;
}

export function outputHasCircleDrawing(text: string): boolean {
  const t = text.trim();
  if (/\.{4,}/.test(t)) return true;
  const draw = extractAdamVisualDrawInner(t);
  return draw !== null && /\.{2,}/.test(draw);
}

/** Inner ASCII block between protocol tags (if present). */
export function extractAdamVisualDrawInner(text: string): string | null {
  const m = text.match(/<adam-visual-draw>([\s\S]*?)<\/adam-visual-draw>/i);
  return m?.[1]?.trim() ?? null;
}

const ADAM_VISUAL_DRAW_STASH_RE = /<adam-visual-draw>[\s\S]*?<\/adam-visual-draw>/gi;

/** Stash draw blocks before prose whitespace collapse (BM guard, greeting, etc.). */
export function stashAdamVisualDrawBlocks(text: string): { prose: string; blocks: string[] } {
  const blocks: string[] = [];
  const prose = text.replace(ADAM_VISUAL_DRAW_STASH_RE, (match) => {
    const slot = `\x00ADAM_DRAW_${blocks.length}\x00`;
    blocks.push(match);
    return slot;
  });
  return { prose, blocks };
}

export function restoreAdamVisualDrawBlocks(text: string, blocks: string[]): string {
  let out = text;
  for (let i = 0; i < blocks.length; i += 1) {
    out = out.replace(`\x00ADAM_DRAW_${i}\x00`, blocks[i]);
  }
  return out;
}

function buildVisualDrawCoreAnswer(): string {
  return [
    'Bulatan: semua titik pada sisinya sama jarak dari pusat; tiada sudut.',
    'Segiempat: empat sisi lurus dan empat sudut (90° jika segi empat sama).',
    'Perbezaan utama: bulatan lengkung tanpa sudut; segiempat mempunyai tepi lurus dan sudut tetap.',
  ].join(' ');
}

/** Canonical lukis turn — tagged ASCII + short konvensional geometry. */
export function buildVisualDrawCanonicalAnswer(
  userMessage: string,
  participantName?: string,
): string {
  const greeting = userAddressedAdamByName(userMessage)
    ? formatUsersHaiGreeting(participantName)
    : '';
  const merged = [
    greeting,
    greeting ? '' : null,
    VISUAL_DRAW_SHAPE_BLOCK,
    '',
    buildVisualDrawCoreAnswer(),
  ].filter((line): line is string => line !== null).join('\n');
  let mergedOut = merged;
  mergedOut = appendGoldStandardFollowUp(mergedOut, userMessage);
  return mergedOut.replace(
    /Mahukah saya jelaskan lebih lanjut\?\s*\n+\s*Mahu saya jelaskan lebih lanjut\?/gi,
    'Mahu saya jelaskan lebih lanjut?',
  );
}

/** Ensure tagged ASCII shapes + short geometry answer when user asked to draw. */
export function repairVisualDrawOutput(
  text: string,
  userMessage: string,
  participantName?: string,
): string {
  if (!isAdamVisualDrawTurn(userMessage)) return text.trim();
  if (userAskedForAlamtologi(userMessage) || userAskedForConstitutionalStructure(userMessage)) {
    return text.trim();
  }

  return buildVisualDrawCanonicalAnswer(userMessage, participantName);
}

/** True when sync guard collapsed a long draw stream to tagged ASCII shapes + short facts. */
export function isVisualDrawCollapsedRepair(
  rawStream: string,
  repaired: string,
  userMessage: string,
): boolean {
  if (!isAdamVisualDrawTurn(userMessage)) return false;
  const raw = rawStream.trim();
  const rep = repaired.trim();
  if (!rep || rep === raw) return false;
  if (!outputHasDrawnShapes(rep)) return false;
  if (!outputHasDrawnShapes(raw)) return true;
  if (raw.length > 280 && rep.length < raw.length * 0.35) return true;
  if (FRAMEWORK_BILLBOARD_RE.test(raw) && !FRAMEWORK_BILLBOARD_RE.test(rep)) return true;
  return false;
}
