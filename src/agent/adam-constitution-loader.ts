/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Constitution Loader
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { ENV } from '../config/environments';

const ADAMRULES_CANDIDATES = [
  'qxk24-mcp/.adamrules',
  '.adamrules',
] as const;

export const STICKY_CONTEXT_MARKER = 'STICKY CONTEXT — CODE LAWS';

export async function loadAdamRulesFromDisk(): Promise<string | null> {
  const root = ENV.QXK24_ROOT?.replace(/\/$/, '');
  if (!root) return null;

  for (const relPath of ADAMRULES_CANDIDATES) {
    try {
      const content = await fs.readFile(path.join(root, relPath), 'utf-8');
      const lineCount = content.split('\n').length;
      const hasLaw10 = /\bLAW 10\b/i.test(content);

      return [
        `ADAM Constitutional Rules (canonical .adamrules)`,
        `SOURCE: ${relPath}`,
        `LINES: ${lineCount}`,
        hasLaw10 ? 'CODE LAWS: LAW 1–10 present ✅' : 'CODE LAWS: INCOMPLETE ⚠️',
        '',
        content,
        hasLaw10
          ? ''
          : '\n⚠️ INCOMPLETE: LAW 10 not found — constitution may be truncated.',
      ].join('\n');
    } catch {
      continue;
    }
  }

  return null;
}

export function buildStickyConstitutionBlock(constitutionText: string): string {
  return [
    `═══ ${STICKY_CONTEXT_MARKER} (loaded at session start — always binding) ═══`,
    constitutionText,
    '═══ END STICKY CONTEXT — obey ALL CODE LAWS (LAW 1–10) on every proposal ═══',
  ].join('\n\n');
}

export function hasStickyConstitution(messages: Array<{ role: string; content: string | null }>): boolean {
  return messages.some(
    (m) =>
      m.role === 'user'
      && typeof m.content === 'string'
      && m.content.includes(STICKY_CONTEXT_MARKER),
  );
}
