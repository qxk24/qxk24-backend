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

function tutorReplyMentionsAdamTeacher(text: string, profile?: AdamTutorProfile): boolean {
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);
  if (lang === 'malay') {
    return new RegExp(`(?:Saya\\s+)?(?:\\*\\*)?${title}(?:\\*\\*)?\\s+ADAM`, 'i').test(text);
  }
  return /I(?:'m| am)\s+(?:\*\*)?(?:Teacher|Cikgu)(?:\*\*)?\s+ADAM/i.test(text);
}

function tutorReplyHasZeroAnswerPolicySpeech(text: string, profile?: AdamTutorProfile): boolean {
  const lang = normalizeTutorLanguage(profile?.language);
  if (lang === 'malay') {
    return (
      /\bjawapan\s+siap\b/i.test(text)
      || /\blatihan\s+sendiri\b/i.test(text)
      || /\bbimbing\s+anda\s+sampai\s+faham\b/i.test(text)
      || /\btidak\s+(?:akan\s+)?beri\s+jawapan\b/i.test(text)
      || /\banda\s+perlu\s+buat\s+latihan\b/i.test(text)
    );
  }
  return (
    /\bfinished answers\b/i.test(text)
    || /\bpractice yourself\b/i.test(text)
    || /\bguide you until you understand\b/i.test(text)
    || /\bwon't give\b/i.test(text)
  );
}

/** Teaching already underway — identity/policy speech not needed again. */
export function tutorSessionTeachingStarted(text: string): boolean {
  if (!text?.trim()) return false;
  return (
    /→\s*_{3,}/.test(text)
    || /\*\*[^*]+\*\*\s*[?？]/.test(text)
    || /\b(?:Berapa|Mari|Cuba|Tulis|Selesaikan|Apabila|What|Try|Write|Solve)\b/i.test(text)
  );
}

export function tutorSessionIdentityEstablished(text: string, profile?: AdamTutorProfile): boolean {
  if (!text?.trim()) return false;
  return tutorReplyHasTeacherIntro(text, profile) || tutorSessionTeachingStarted(text);
}

/** Semantic intro — identity and/or explicit zero-answer policy (any natural wording). */
export function tutorReplyHasTeacherIntro(text: string, profile?: AdamTutorProfile): boolean {
  if (!text?.trim()) return false;
  const hasAdam = tutorReplyMentionsAdamTeacher(text, profile);
  const hasPolicy = tutorReplyHasZeroAnswerPolicySpeech(text, profile);
  if (hasAdam && hasPolicy) return true;
  if (hasAdam && text.trim().length < 220 && !tutorSessionTeachingStarted(text)) return true;
  return false;
}

/** Paragraph that is only greeting / identity / policy — safe to strip on repeat turns. */
export function tutorParagraphIsPolicyIntroBlock(
  paragraph: string,
  profile?: AdamTutorProfile,
): boolean {
  const t = paragraph.trim();
  if (!t || /^#{1,6}\s/.test(t)) return false;

  const hasAdam = tutorReplyMentionsAdamTeacher(t, profile);
  const hasPolicy = tutorReplyHasZeroAnswerPolicySpeech(t, profile);
  const teaching = tutorSessionTeachingStarted(t);

  if (teaching && !hasPolicy) return false;
  if (hasAdam && hasPolicy) return true;
  if (hasPolicy && !teaching) return true;
  if (hasAdam && !teaching && t.split(/[.!?]+/).filter((s) => s.trim()).length <= 2) return true;

  return false;
}

export function shouldIncludeTutorTeacherIntro(
  userMessage: string | undefined,
  recentAssistantMessages: string[],
  profile?: AdamTutorProfile,
): boolean {
  if (studentDemandsTutorDirectAnswer(userMessage ?? '')) return true;
  if (recentAssistantMessages.length === 0) return true;
  if (!recentAssistantMessages.some((m) => tutorSessionIdentityEstablished(m, profile))) return true;
  return false;
}

export function stripRepeatedTutorTeacherIntro(
  text: string,
  profile?: AdamTutorProfile,
): string {
  if (!text?.trim()) return text;

  let out = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      return !tutorParagraphIsPolicyIntroBlock(p, profile);
    })
    .join('\n\n')
    .trim();

  const lang = normalizeTutorLanguage(profile?.language);
  if (lang === 'malay') {
    out = out.replace(
      /^Salam(?:,?\s*[^.\n]+)?\.?\s*\n+(?=Saya\s+(?:\*\*)?Cikgu)/im,
      '',
    );
  } else {
    out = out.replace(
      /^Hello(?:,?\s*[^.\n]+)?\.?\s*\n+(?=I(?:'m| am)\s+(?:\*\*)?Teacher)/im,
      '',
    );
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
