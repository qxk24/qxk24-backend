/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Context Weaver (Prompt Assembly)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Principle } from './ontology';
import { inferPrincipleFromKeywords } from './parse-teaching-principles';

export interface MemoryTier {
  working:   string[];
  shortTerm: string;
  longTerm:  string;
}

export function parseWorkingTierLines(workingBlock: string | undefined): string[] {
  if (!workingBlock?.trim()) return [];
  const stripped = workingBlock.replace(/^\[[^\]]+\]\s*/i, '').trim();
  if (!stripped) return [];
  return stripped.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

export function stripTierTag(block: string | undefined): string {
  if (!block?.trim()) return '';
  return block.replace(/^\[[^\]]+\]\s*/i, '').trim();
}

export function inferFocusPrinciple(message: string): Principle | undefined {
  if (!message.trim()) return undefined;
  return inferPrincipleFromKeywords(message);
}

export function weaveContext(tiers: MemoryTier, focusPrinciple?: Principle): string {
  let context = '<adam_context>\n';

  context += `[LONG_TERM] ${tiers.longTerm}\n`;
  context += `[SHORT_TERM] ${tiers.shortTerm}\n`;
  context += `[WORKING] ${tiers.working.join(' | ')}\n`;

  if (focusPrinciple) {
    context += `[FOCUS] Current interaction is governed by the ${focusPrinciple} principle.\n`;
  }

  context += '</adam_context>';
  return context;
}

export function weaveContextFromBlocks(
  workingBlock: string | undefined,
  shortTermBlock: string | undefined,
  longTermBlock: string | undefined,
  newMessage: string,
): string {
  return weaveContext(
    {
      working:   parseWorkingTierLines(workingBlock),
      shortTerm: stripTierTag(shortTermBlock),
      longTerm:  stripTierTag(longTermBlock),
    },
    inferFocusPrinciple(newMessage),
  );
}
