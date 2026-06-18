/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Greeting
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export function usersDisplayFirstName(fullName: string): string {
  const raw = fullName.trim();
  if (!raw) return '';
  const word = raw.replace(/-/g, ' ').split(/\s+/).filter(Boolean)[0] ?? raw;
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Warm opener — "Hai Ahmad," only when user addressed ADAM by name this turn. */
export function formatUsersHaiGreeting(participantName?: string): string {
  const first = participantName?.trim()
    ? usersDisplayFirstName(participantName.trim())
    : '';
  return first ? `Hai ${first},` : 'Hai,';
}

/** True when the user explicitly called ADAM by name this turn. */
export function userAddressedAdamByName(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (/^(?:hai|hi|hello|hey|salam|assalamu(?:\s*alaikum)?|waalaikum)\s+adam\b/i.test(t)) {
    return true;
  }
  if (/\b(?:hai|hi|hello|hey|salam)\s+adam\b/i.test(t)) return true;
  if (/^adam[,:\s—-]/i.test(t)) return true;
  if (/\b(?:terima kasih|thanks|thank you|ok|okay)\s+adam\b/i.test(t)) return true;
  return /\badam\s*[,?!.]/i.test(t);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove leading "Hai {name}," when user did not address ADAM by name. */
export function stripLeadingUsersHaiGreeting(answer: string, participantName?: string): string {
  let out = answer.trim();
  if (!out || !/^Hai\b/i.test(out)) return out;

  const first = participantName?.trim() ? usersDisplayFirstName(participantName.trim()) : '';
  const patterns: RegExp[] = [];
  if (first) {
    patterns.push(new RegExp(`^Hai\\s+${escapeRegExp(first)},\\s*`, 'i'));
  }
  patterns.push(/^Hai\s+QA,\s*/i, /^Hai,\s*/i);

  for (const re of patterns) {
    if (re.test(out)) {
      out = out.replace(re, '').trim();
      if (out && /^[a-z]/.test(out)) {
        out = out.charAt(0).toUpperCase() + out.slice(1);
      }
      break;
    }
  }
  return out;
}
