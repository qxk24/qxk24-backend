/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Salam Reply Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * If the user opens with Islamic salam, ADAM must answer the salam first.
 * It must not merely give a fresh "Salam, {name}" opener.
 */

import { usersDisplayFirstName } from './adam-users-greeting';

const ISLAMIC_SALAM_OPEN_RE =
  /^(?:assalamualaikum|assalammualaikum|assalamualaykum|assalamu\s*alaikum|salamualaikum|salam\s*alaikum|salam(?!\s+sejahtera\b)|السلام\s+عليكم)\b/i;

const WAALAIKUM_OPEN_RE =
  /^(?:wa['’]?\s*alaikum(?:us?salam)?|waalaikum(?:us?salam)?|walaikum(?:us?salam)?|وعليكم)\b/i;

const FRESH_GREETING_OPEN_RE =
  /^(?:salam(?:\s+sejahtera)?|ass?alam(?:u|ualaikum|ualaykum|ualaikum)?|hai|hi|hello)\b/i;

function stripLeadingFreshGreeting(answer: string, firstName: string): string {
  let out = answer.trim();
  if (!out) return out;

  const name = firstName ? firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '[A-ZÀ-ÿ][^.!?\n,]{0,40}';
  const greetingLine = new RegExp(
    `^(?:salam(?:\\s+sejahtera)?|assalamualaikum|assalammualaikum|assalamualaykum|assalamu\\s*alaikum|salamualaikum|salam\\s*alaikum|hai|hi|hello)[,\\s]*(?:${name})?[,\\s]*(?:[.!?]|[–—-])?\\s*`,
    'i',
  );
  out = out.replace(greetingLine, '').trim();
  if (out && /^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

export function userOpenedWithIslamicSalam(message: string): boolean {
  const t = message.trim();
  if (!t || WAALAIKUM_OPEN_RE.test(t)) return false;
  return ISLAMIC_SALAM_OPEN_RE.test(t);
}

export function ensureIslamicSalamReply(
  answer: string,
  userMessage: string,
  participantName?: string,
): string {
  const t = answer.trim();
  if (!t || !userOpenedWithIslamicSalam(userMessage)) return t;
  if (WAALAIKUM_OPEN_RE.test(t)) return t;

  const first = participantName?.trim() ? usersDisplayFirstName(participantName.trim()) : '';
  const opener = first ? `Waalaikumussalam, ${first}.` : 'Waalaikumussalam.';
  const body = FRESH_GREETING_OPEN_RE.test(t)
    ? stripLeadingFreshGreeting(t, first)
    : t;

  return [opener, body].filter(Boolean).join(' ').trim();
}
