/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Founder Unified Chat Mode
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMChatMode } from './adam.types';

const BUILD_PREFIX = /^\/build\b[:\s]*/i;
const BUILD_KEYWORD = /^Build(?:[:\s]+|$)/i;

const JOURNAL_SYSTEM_MARKERS =
  /adam_journal_seal|JOURNAL GEN — write then seal|IMRaD manuscript exists in this session yet/i;

function hasExplicitBuildActivation(message: string): boolean {
  const t = message.trim();
  return BUILD_PREFIX.test(t) || BUILD_KEYWORD.test(t);
}

function matchesJournalIntent(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/^\s*tulis\s+jurnal\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (/\btulis\s+jurnal\b/i.test(t)) return true;
  if (/^\s*write\s+(?:the\s+)?journal\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (JOURNAL_SYSTEM_MARKERS.test(t)) return true;
  if (/\b(seal|meterai|simpan).{0,48}(jurnal|journal)\b/i.test(t)) return true;
  if (/\b(tulis|write|cipta|create|jana|hasilkan).{0,48}(draf|draft).{0,48}(jurnal|journal)\b/i.test(t)) {
    return true;
  }
  if (/\b(jurnal hari ini|today'?s journal|daily journal)\b/i.test(t)) return true;
  if (/\b(minta|buat|prepare).{0,32}(jurnal|journal)\b/i.test(t) && /\b(imrad|draf|draft|seal|meterai)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** Founder: one teaching screen — resolve special modes per message only. */
export function resolveFounderApiMode(
  message: string,
  clientMode: ADAMChatMode,
): ADAMChatMode {
  if (clientMode === 'JOURNAL_GEN' || clientMode === 'BUILDER' || clientMode === 'AUDIT') {
    return clientMode;
  }
  if (hasExplicitBuildActivation(message)) return 'BUILDER';
  if (matchesJournalIntent(message)) return 'JOURNAL_GEN';
  return 'TEACHING';
}
