/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Teacher Intro
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


import type { AdamTutorProfile } from './tutor-law.types';
import { normalizeTutorLanguage, tutorTeacherTitle } from './tutor-law.types';

export function stripTutorUniversalOpeners(text: string): string {
  return text
    .replace(/^Bismillahirahmanirrahim\.?\s*\n*/im, '')
    .replace(/^Bismillah\.?\s*\n*/im, '')
    .trim();
}

/** Student insists on a finished answer / shortcut past tutoring. */
export function studentDemandsTutorDirectAnswer(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return (
    /\b(?:beri|bagi|kasi|tulis|hantar)\s+(?:jawapan|jawapan\s+siap|jawapan\s+penuh)\b/i.test(t)
    || /\bjawapan\s+siap\b/i.test(t)
    || /\bterus\s+jawap(?:an)?\b/i.test(t)
    || /\btak\s+(?:nak|mahu)\s+(?:fikir|belajar|bincang)\b/i.test(t)
    || /\b(?:just|give)\s+(?:me\s+)?(?:the\s+)?(?:final\s+)?answer\b/i.test(t)
    || /\b(?:give|show)\s+(?:me\s+)?(?:the\s+)?(?:full\s+)?(?:solution|working)\b/i.test(t)
    || /\b(?:finish(?:ed)?|complete)\s+answer\b/i.test(t)
  );
}

export function tutorReplyHasTeacherIntro(text: string, profile?: AdamTutorProfile): boolean {
  if (!text?.trim()) return false;
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);
  if (lang === 'malay') {
    return new RegExp(
      `Saya\\s+(?:\\*\\*)?${title}(?:\\*\\*)?\\s+ADAM[\\s\\S]{0,160}jawapan\\s+siap`,
      'i',
    ).test(text);
  }
  return /I(?:'m| am)\s+(?:\*\*)?Teacher(?:\*\*)?\s+ADAM[\s\S]{0,160}finished answers/i.test(text);
}

export function shouldIncludeTutorTeacherIntro(
  userMessage: string | undefined,
  recentAssistantMessages: string[],
  profile?: AdamTutorProfile,
): boolean {
  if (studentDemandsTutorDirectAnswer(userMessage ?? '')) return true;
  if (recentAssistantMessages.length === 0) return true;
  if (!recentAssistantMessages.some((m) => tutorReplyHasTeacherIntro(m, profile))) return true;
  return false;
}

export function stripRepeatedTutorTeacherIntro(
  text: string,
  profile?: AdamTutorProfile,
): string {
  if (!text?.trim()) return text;

  let out = text;
  const lang = normalizeTutorLanguage(profile?.language);

  if (lang === 'malay') {
    const introBody =
      'Saya\\s+(?:\\*\\*)?Cikgu(?:\\*\\*)?\\s+ADAM\\.?\\s*Saya akan bimbing anda sampai faham[^.\\n]*jawapan siap[^.\\n]*latihan sendiri\\.?';
    out = out.replace(
      new RegExp(`^Salam(?:,\\s*[^.\\n]+)?\\.?\\s*(?:\\n+)?${introBody}\\s*`, 'im'),
      '',
    );
    out = out.replace(new RegExp(`^${introBody}\\s*`, 'im'), '');
    out = out.replace(new RegExp(`\\n?\\s*${introBody}\\s*`, 'gi'), '\n');
  } else {
    const introBody =
      'I(?:\'m| am)\\s+(?:\\*\\*)?Teacher(?:\\*\\*)?\\s+ADAM\\.?\\s*I(?:\'ll| will) guide you until you understand[^.\\n]*finished answers[^.\\n]*practice yourself\\.?';
    out = out.replace(
      new RegExp(`^Hello(?:,\\s*[^.\\n]+)?\\.?\\s*(?:\\n+)?${introBody}\\s*`, 'im'),
      '',
    );
    out = out.replace(new RegExp(`^${introBody}\\s*`, 'im'), '');
    out = out.replace(new RegExp(`\\n?\\s*${introBody}\\s*`, 'gi'), '\n');
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export function fixTutorBrokenMalayIntro(text: string): string {
  let out = text;
  out = out.replace(/\bsaya\s+bimbing\s+faham\b/gi, 'saya akan bimbing anda sampai faham');
  out = out.replace(
    /\bsaya\s+tidak\s+beri\s+jawapan\s+siap\s+untuk\s+dikumpul\b/gi,
    'saya tidak akan beri jawapan siap tanpa latihan',
  );
  out = out.replace(/^Salam,\s*Pelajar\.?\s*/im, 'Salam. ');
  return out;
}
