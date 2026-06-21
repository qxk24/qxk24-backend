/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Session Language
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


import { detectLanguage } from '../adam-language-mirror.service';
import { usersDisplayFirstName } from '../adam-users-constitution';
import { getFastModel } from '../../config/llm-models';
import { llmCompleteUserPrompt } from '../../llm/llm-client';
import type { AdamTutorProfile } from './tutor-law.types';
import {
  normalizeTutorLanguage,
  tutorLanguageInstruction,
  tutorTeacherTitle,
} from './tutor-law.types';
import {
  TUTOR_ENGLISH_SESSION_BLEED,
  TUTOR_PLAIN_LANGUAGE_BLEED,
} from './tutor-law.guard-patterns';

function fixTutorPelajarOpener(
  text: string,
  participantName?: string,
  profile?: AdamTutorProfile,
): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const first = participantName?.trim()
    ? usersDisplayFirstName(participantName.trim())
    : '';
  if (!first) return text;

  if (lang === 'malay') {
    return text
      .replace(/^Pelajar,\s*/i, `${first}, `)
      .replace(/^Salam,\s*Pelajar\.?\s*/im, `Salam, ${first}. `);
  }
  return text
    .replace(/^Student,\s*/i, `${first}, `)
    .replace(/^Hello,\s*Student\.?\s*/im, `Hello, ${first}. `);
}

function tutorReplyHasEnglishMenuBleed(text: string): boolean {
  if (TUTOR_ENGLISH_SESSION_BLEED.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  })) {
    return true;
  }
  return TUTOR_PLAIN_LANGUAGE_BLEED.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

/** True when a Malay-session reply is mostly English prose (common after numeric student answers). */
export function tutorReplyIsPredominantlyEnglish(text: string): boolean {
  const sample = text.replace(/```[\s\S]*?```/g, ' ')
    .replace(/\|[^|\n]+\|/g, ' ')
    .trim();
  if (sample.length < 48) return false;

  const detected = detectLanguage(sample);
  if (detected.detectedLocale === 'en' && detected.confidence >= 0.82) {
    return true;
  }

  const lower = sample.toLowerCase();
  const englishHits = (lower.match(
    /\b(?:good|well|correct|wrong|let|try|explain|step|answer|actually|remember|almost|great|nice|think|write|you|the|that|this|what|when|then|now|next|first|second|third)\b/g,
  ) ?? []).length;
  const malayHits = (lower.match(
    /\b(?:yang|dengan|untuk|adalah|tidak|soalan|jawapan|pelajar|betul|jika|langkah|cikgu|anda|kamu|kenapa|operasi|tambah|tolak|darab|bahagi|tempat|tulis|faham|terima kasih|bagus|hampir|mari|kita|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh)\b/g,
  ) ?? []).length;

  return englishHits >= 4 && englishHits > malayHits * 1.4;
}

function tutorReplyViolatesMalaySession(
  text: string,
  profile?: AdamTutorProfile,
): boolean {
  const lang = normalizeTutorLanguage(profile?.language);
  if (lang !== 'malay') return false;
  if (tutorReplyHasEnglishMenuBleed(text)) return true;
  return tutorReplyIsPredominantlyEnglish(text);
}

function tutorReplyViolatesSessionLanguage(
  text: string,
  profile?: AdamTutorProfile,
): boolean {
  return tutorReplyViolatesMalaySession(text, profile);
}

/** Malay recovery when model replies in English or offers Alamtologi menus. */
export function buildTutorAmbiguousInputReply(
  userMessage: string,
  profile?: AdamTutorProfile,
  participantName?: string,
): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);
  const first = participantName?.trim()
    ? usersDisplayFirstName(participantName.trim())
    : '';
  const trimmed = userMessage.trim();

  if (lang === 'malay') {
    const open = first ? `Salam, ${first}.` : 'Salam.';
    if (/^\d+$/.test(trimmed)) {
      return `${open} Anda tulis nombor **${trimmed}** sahaja.

Nak explore maksud nombor **${trimmed}** dalam matematik (contoh: faktor, gandaan)?
Atau ada persamaan / soalan sekolah yang berkaitan nombor ini?

Pilih satu arah — saya pandu langkah demi langkah. **Anda** fikir; saya **${title}** bimbing.`;
    }
    return `${open} Saya **${title} ADAM**. Tulis soalan pelajaran anda — matematik, sains, atau subjek sekolah/universiti — dan saya bimbing langkah demi langkah tanpa beri jawapan siap.`;
  }

  const open = first ? `Hello, ${first}.` : 'Hello.';
  if (/^\d+$/.test(trimmed)) {
    return `${open} You wrote just the number **${trimmed}**.

Would you like to explore what **${trimmed}** means in maths (factors, multiples)?
Or is there a school equation or question tied to this number?

Pick one direction — **${title} ADAM** will guide step by step. You think; I hold the light.`;
  }
  return `${open} I'm **${title} ADAM**. Share your school or university question — I'll guide step by step without giving finished answers.`;
}

/** Malay fallback when model re-explains in English after the student answered. */
export function buildTutorMalayFollowUpRecovery(
  userMessage: string,
  profile?: AdamTutorProfile,
  participantName?: string,
): string {
  const title = tutorTeacherTitle(normalizeTutorLanguage(profile?.language));
  const first = participantName?.trim()
    ? usersDisplayFirstName(participantName.trim())
    : '';
  const open = first ? `Salam, ${first}.` : 'Salam.';
  const trimmed = userMessage.trim();
  const answerLine = trimmed
    ? `Terima kasih atas jawapan **${trimmed}**.`
    : 'Terima kasih atas jawapan anda.';

  return `${open} ${answerLine}

Mari kita teruskan **satu langkah sahaja** — fokus tempat **Sa** (satuan) dulu, bukan keseluruhan penyelesaian.
Tulis digit atau operasi untuk langkah itu di baris:
→ ______

Kemudian terangkan dalam **satu ayat** kenapa operasi itu betul. **${title}** tunggu — anda fikir; saya bimbing.`;
}

const TUTOR_MALAY_REPAIR_SYSTEM = `
You rewrite ADAM Tutor (Cikgu) classroom replies into Bahasa Melayu Malaysia —
indah, lembut, bijaksana, penuh adab; jelas untuk pelajar; bukan drift Indonesia.
Preserve markdown tables, monospace blocks, bold, and structure exactly.
Keep one micro-step teaching — never reveal final answers the student must find.
Malaysian vocabulary only — not Indonesian.
Output the rewritten reply only — no preamble.
`.trim();

/** Post-stream — rewrite English tutor drift back to BM while keeping teaching structure. */
export async function repairTutorMalaySessionLanguage(
  text: string,
  profile?: AdamTutorProfile,
): Promise<string> {
  if (!text?.trim()) return text;
  if (normalizeTutorLanguage(profile?.language) !== 'malay') return text;
  if (!tutorReplyViolatesMalaySession(text, profile)) return text;

  try {
    const repaired = await llmCompleteUserPrompt(
      TUTOR_MALAY_REPAIR_SYSTEM,
      `Rewrite this Cikgu ADAM teaching reply entirely in Bahasa Melayu Malaysia. Keep tables and layout.\n\n${text}`,
      getFastModel(),
      Math.min(4096, Math.max(1200, Math.ceil(text.length * 1.2))),
    );
    const trimmed = repaired.trim();
    if (
      trimmed.length >= text.length * 0.35
      && !tutorReplyIsPredominantlyEnglish(trimmed)
    ) {
      console.log('[adam:tutor-language] repaired English drift to BM', {
        charsBefore: text.length,
        charsAfter:  trimmed.length,
      });
      return trimmed;
    }
  } catch (err) {
    console.warn('[adam:tutor-language] BM repair failed', err);
  }
  return text;
}

export function enforceTutorSessionLanguage(
  text: string,
  profile?: AdamTutorProfile,
  userMessage?: string,
  participantName?: string,
): string {
  const fixedOpener = fixTutorPelajarOpener(text, participantName, profile);
  if (!tutorReplyViolatesMalaySession(fixedOpener, profile)) {
    return fixedOpener;
  }
  if (tutorReplyHasEnglishMenuBleed(fixedOpener)) {
    return buildTutorAmbiguousInputReply(userMessage ?? '', profile, participantName);
  }
  return buildTutorMalayFollowUpRecovery(userMessage ?? '', profile, participantName);
}

/** Tutor lane — profile language overrides ambiguous numeric/symbol input. */
export function buildTutorSessionLanguageLock(profile?: AdamTutorProfile): string {
  const lang = normalizeTutorLanguage(profile?.language);
  return `
[TUTOR LANGUAGE LOCK — SESSION FIXED FOR ENTIRE CONVERSATION]
Session profile language: ${lang} (FIXED — do not switch mid-session).
${tutorLanguageInstruction(lang)}
Every turn must use the session profile language — including when the student answers your question with a number, equation, symbol, or short phrase in another language.
Do NOT mirror the student's reply language on follow-up turns. If you opened in Malay, keep explaining in Malay.
If the student sends only a number, symbol, or emoji with no language cue, reply in the session profile language — NOT English by default.
Never offer Alamtologi, AMA, TAJU, QXK24, or founder frameworks as topic options.
Never mix English option menus into a Malay session.
[/TUTOR LANGUAGE LOCK]
`.trim();
}

/** Tutor web search — silent for student UI; conventional academics only. */
export function buildTutorWebSearchPrompt(
  profile?: AdamTutorProfile,
  prefetched = false,
): string {
  const langLine = tutorLanguageInstruction(normalizeTutorLanguage(profile?.language));
  const prefetchLine = prefetched
    ? 'Web search results may appear in [WEB SEARCH RESULTS] above — use only conventional facts from those hits.'
    : 'Web search may run for factual classroom topics only.';
  return `
ADAM TUTOR — WEB SEARCH (silent — student does not see search UI):
${prefetchLine}
- Conventional school/university subjects ONLY — no Alamtologi, AMA, TAJU, or founder frameworks.
- ${langLine}
- Weave verified facts in plain classroom language — no citation dump, no search narration.
- If search is empty, continue teaching conventionally — do not invent studies or URLs.
`.trim();
}
