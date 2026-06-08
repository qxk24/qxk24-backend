/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Journal Section Paragraphs
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Structured ¶ markers inside each movement — edit one paragraph
 * without wiping siblings.
 */

import type { JournalSectionId } from './adam-journal-section.types';

export const PARAGRAPH_HEADING_RX = /^###\s*¶(\d+)\s*$/gm;
export const PARAGRAPH_HEADING_LINE = /^###\s*¶(\d+)\s*$/;

/** Sections written paragraph-by-paragraph (not Title/Abstract or References). */
export const PARAGRAPH_SECTIONS: ReadonlySet<JournalSectionId> = new Set([
  'movement_1_human_opening',
  'movement_2_achievement',
  'movement_3_honest_wall',
  'movement_4_quran',
  'movement_5_alamtologi',
  'movement_6_application',
  'movement_7_invitation',
]);

export function sectionUsesParagraphStructure(sectionId: JournalSectionId): boolean {
  return PARAGRAPH_SECTIONS.has(sectionId);
}

export type SectionParagraphMap = Map<number, string>;

/** Split body into numbered paragraphs; unmarked prose becomes ¶1. */
export function parseSectionParagraphs(body: string): SectionParagraphMap {
  const text = body.trim();
  const out: SectionParagraphMap = new Map();
  if (!text) return out;

  const parts = text.split(/\n(?=###\s*¶\d+\s*$)/m);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lines = trimmed.split('\n');
    const first = lines[0]?.trim() ?? '';
    const match = first.match(/^###\s*¶(\d+)\s*$/);
    if (match?.[1]) {
      const idx = Number.parseInt(match[1], 10);
      const prose = lines.slice(1).join('\n').trim();
      if (prose) out.set(idx, prose);
    } else if (out.size === 0) {
      out.set(1, trimmed);
    }
  }

  if (out.size === 0 && text) out.set(1, text);
  return out;
}

export function formatSectionParagraphs(paragraphs: SectionParagraphMap): string {
  const indices = [...paragraphs.keys()].sort((a, b) => a - b);
  return indices
    .map((idx) => {
      const prose = paragraphs.get(idx)?.trim() ?? '';
      if (!prose) return '';
      return `### ¶${idx}\n\n${prose}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

export function normalizeSectionParagraphBody(
  sectionId: JournalSectionId,
  body: string,
): string {
  if (!sectionUsesParagraphStructure(sectionId)) return body.trim();
  const parsed = parseSectionParagraphs(body);
  if (parsed.size === 0) return body.trim();
  return formatSectionParagraphs(parsed);
}

export function countSectionParagraphs(body: string): number {
  return parseSectionParagraphs(body).size;
}

/** Minimum ¶ block before **continue** advances to the next movement. */
export function sectionParagraphBlockComplete(body: string): boolean {
  const count = countSectionParagraphs(body);
  if (count >= 3) return true;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return count >= 1 && words >= 180;
}

export function nextParagraphIndex(body: string): number {
  const parsed = parseSectionParagraphs(body);
  if (parsed.size === 0) return 1;
  return Math.max(...parsed.keys()) + 1;
}

/** Infer ¶ number from P.alt command or ADAM reply heading. */
export function inferParagraphIndexFromText(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const explicit =
    t.match(/\b(?:perenggan|paragraph|para|¶)\s*(\d+)\b/i)
    ?? t.match(/\b¶(\d+)\b/)
    ?? t.match(/^###\s*¶(\d+)\s*$/m);
  if (explicit?.[1]) {
    const n = Number.parseInt(explicit[1], 10);
    if (n >= 1 && n <= 12) return n;
  }
  return null;
}

export function founderWantsJournalParagraphContinue(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/^\s*(?:teruskan|sambung)\s+perenggan\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (/^\s*continue\s+paragraph\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (/^\s*next\s+paragraph\s*[!?.…,]*\s*$/i.test(t)) return true;
  return /\b(teruskan|sambung)\s+perenggan\b/i.test(t);
}

export function founderWantsJournalParagraphSave(message: string): boolean {
  const t = message.trim();
  if (!t || !/\b(simpan|save|masukkan|gabungkan)\b/i.test(t)) return false;
  return inferParagraphIndexFromText(t) !== null;
}

export function founderWantsJournalParagraphEdit(message: string): boolean {
  const t = message.trim();
  if (!t || !inferParagraphIndexFromText(t)) return false;
  if (founderWantsJournalParagraphSave(t)) return true;
  return /\b(edit|kemas\s+kini|perbaiki|tulis\s+semula|ganti|replace)\b/i.test(t);
}

/** Replace or append one ¶; preserve all other ¶ numbers. */
export function mergeParagraphIntoSection(
  existingBody: string,
  paragraphIndex: number,
  newProse: string,
  mode: 'replace' | 'append',
): string {
  const prose = newProse.trim();
  if (!prose) return existingBody.trim();

  const paragraphs = parseSectionParagraphs(existingBody);
  const idx = Math.max(1, paragraphIndex);

  if (mode === 'append' && paragraphs.has(idx)) {
    paragraphs.set(idx, `${paragraphs.get(idx)!.trim()}\n\n${prose}`.trim());
  } else {
    paragraphs.set(idx, prose);
  }

  return formatSectionParagraphs(paragraphs);
}

/** Strip ¶ heading from extracted save body when persisting a single paragraph. */
export function stripParagraphMarkerFromProse(text: string): string {
  return text
    .replace(/^###\s*¶\d+\s*\n+/m, '')
    .trim();
}
