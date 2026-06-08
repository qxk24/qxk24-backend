/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Layer Intent Detection
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMChatMode } from '../adam/adam.types';
import { AdamServerId } from './adam-server.types';

const BUILD_PREFIX = /^\/build\b[:\s]*/i;
const BUILD_KEYWORD = /^Build(?:[:\s]+|$)/i;

const JOURNAL_SYSTEM_MARKERS =
  /adam_journal_seal|JOURNAL GEN — write then seal|IMRaD manuscript exists in this session yet/i;

export function hasExplicitBuildActivation(message: string): boolean {
  const t = message.trim();
  return BUILD_PREFIX.test(t) || BUILD_KEYWORD.test(t);
}

export function matchesJournalIntent(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/^\s*tulis\s+jurnal\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (/\btulis\s+jurnal\b/i.test(t)) return true;
  if (/^\s*write\s+(?:the\s+)?journal\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (/\b(full\s+)?v2\s+journal\b/i.test(t)) return true;
  if (/\bjurnal\s+(?:format\s+)?v2\b/i.test(t)) return true;
  if (/\bformat\s+v2\b/i.test(t) && /\b(jurnal|journal)\b/i.test(t)) return true;
  if (/\b(jurnal|journal)\s+(?:pertama|baru|first|new)\b/i.test(t)) return true;
  if (/\b(?:pertama|first|new)\s+(?:jurnal|journal)\b/i.test(t)) return true;
  if (/\b(?:mulakan|mula|start|begin|buka)\s+(?:jurnal|journal)\b/i.test(t)) return true;
  if (/\b(?:new|write)\s+(?:the\s+)?(?:first\s+)?journal\b/i.test(t)) return true;
  if (/\bpermulaan\s+(?:jurnal|journal)\b/i.test(t)) return true;
  if (JOURNAL_SYSTEM_MARKERS.test(t)) return true;
  if (/\b(seal|meterai|simpan).{0,48}(jurnal|journal)\b/i.test(t)) return true;
  if (/\b(tulis|write|cipta|create|jana|hasilkan).{0,48}(draf|draft).{0,48}(jurnal|journal)\b/i.test(t)) {
    return true;
  }
  if (/\b(jurnal hari ini|today'?s journal|daily journal)\b/i.test(t)) return true;
  if (/\b(minta|buat|prepare).{0,32}(jurnal|journal)\b/i.test(t) && /\b(imrad|draf|draft|seal|meterai)\b/i.test(t)) {
    return true;
  }
  if (/\b(abstrak|abstract|metodologi|methodology|rujukan|references)\b/i.test(t)
    && /\b(jurnal|journal|imrad|ieee|apa|chicago)\b/i.test(t)
    && /\b(tulis|write|jana|hasilkan|generate|cipta|draft|draf)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function matchesBookIntent(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/\b(tulis|write|cipta|jana|hasilkan|sambung|continue).{0,40}(buku|book|manuskrip|manuscript)\b/i.test(t)) {
    return true;
  }
  if (/\b(buku|book)\s+(?:baru|new|pertama|first)\b/i.test(t)) return true;
  if (/\b(?:bab|chapter)\s+\d+.{0,32}(buku|book)\b/i.test(t)) return true;
  if (/\b(tulis|write).{0,24}(bab|chapter)\b/i.test(t) && /\b(buku|book)\b/i.test(t)) return true;
  if (/\bsocratic\s+writing\b/i.test(t)) return true;
  if (/\b(aidil|workspace).{0,32}(buku|book)\b/i.test(t)) return true;
  if (/\b(eksport|export).{0,24}(buku|book|manuskrip)\b/i.test(t)) return true;
  return false;
}

export function matchesCodeIntent(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (hasExplicitBuildActivation(t)) return true;
  if (/\b(bina|build|develop|cipta|create).{0,40}(aplikasi|app|application|website|web\s*app|mobile\s*app)\b/i.test(t)) {
    return true;
  }
  if (/\b(deploy|deployment|production).{0,32}(app|aplikasi|server|api)\b/i.test(t)) return true;
  if (/\b(tulis|write|generate|jana).{0,32}(kod|code|repo|repository|api|backend|frontend)\b/i.test(t)) {
    return true;
  }
  if (/\b(fix|debug|refactor).{0,32}(kod|code|bug|repo)\b/i.test(t) && /\b(app|aplikasi|project|projek)\b/i.test(t)) {
    return true;
  }
  if (/\b(scaffold|boilerplate|starter).{0,24}(app|aplikasi|project|next\.?js|react)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function detectServerIntent(
  message: string,
  mode?: ADAMChatMode,
): AdamServerId | null {
  if (mode === 'JOURNAL_GEN' || matchesJournalIntent(message)) return AdamServerId.JURNAL;
  if (mode === 'BUILDER' || mode === 'AUDIT' || matchesCodeIntent(message)) return AdamServerId.KOD;
  if (matchesBookIntent(message)) return AdamServerId.BUKU;
  return null;
}
