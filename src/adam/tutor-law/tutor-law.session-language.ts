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


import {
  detectLanguage,
  type SupportedLocale,
} from '../adam-language-mirror.service';
import { usersDisplayFirstName } from '../adam-users-constitution';
import { getFastModel } from '../../config/llm-models';
import { llmCompleteUserPrompt } from '../../llm/llm-client';
import type { AdamTutorProfile } from './tutor-law.types';
import {
  normalizeTutorLanguage,
  tutorLanguageInstruction,
  tutorTeacherTitle,
  type AdamTutorLanguage,
} from './tutor-law.types';
import {
  TUTOR_ENGLISH_SESSION_BLEED,
  TUTOR_PLAIN_LANGUAGE_BLEED,
} from './tutor-law.guard-patterns';

const ENGLISH_EXPLICIT_REQUEST =
  /\b(?:(?:jawab|reply|answer|speak|talk|respond|guna|use|dalam|in|pakai)\s+(?:dalam\s+)?(?:bahasa\s+)?(?:inggeris|english|bi)\b|(?:boleh|bolehkah|can you|could you|please)\s+(?:jawab|reply|answer|speak|respond)\s+(?:dalam\s+)?(?:bahasa\s+)?(?:inggeris|english)\b|(?:in\s+)?english\s+please|english\s+only)\b/i;

const MALAY_EXPLICIT_REQUEST =
  /\b(?:(?:jawab|reply|answer|speak|guna|dalam|in|pakai)\s+(?:dalam\s+)?(?:bahasa\s+)?(?:melayu|malay|bm|malaysia)\b|(?:in\s+)?malay\s+please|bahasa\s+melayu\s+sahaja)\b/i;

const ARABIC_EXPLICIT_REQUEST =
  /\b(?:jawab|reply|answer|speak|in)\s+(?:dalam\s+)?(?:bahasa\s+)?(?:arab|arabic)\b/i;

const MANDARIN_EXPLICIT_REQUEST =
  /\b(?:jawab|reply|answer|speak|in)\s+(?:dalam\s+)?(?:bahasa\s+)?(?:mandarin|chinese|中文)\b/i;

/** Student explicitly asks to switch classroom language — honour immediately. */
export function detectTutorExplicitLanguageRequest(text: string): AdamTutorLanguage | null {
  const sample = text.trim();
  if (!sample) return null;
  if (ENGLISH_EXPLICIT_REQUEST.test(sample)) return 'english';
  if (MALAY_EXPLICIT_REQUEST.test(sample)) return 'malay';
  if (ARABIC_EXPLICIT_REQUEST.test(sample)) return 'arabic';
  if (MANDARIN_EXPLICIT_REQUEST.test(sample)) return 'mandarin';
  return null;
}

function mirrorLocaleToTutorLanguage(locale: SupportedLocale): AdamTutorLanguage {
  switch (locale) {
    case 'ms':
    case 'mixed-ms-en':
      return 'malay';
    case 'en':
      return 'english';
    case 'ar':
      return 'arabic';
    case 'zh':
      return 'mandarin';
    case 'id':
      return 'indonesian';
    case 'ta':
      return 'tamil';
    default:
      return 'other';
  }
}

/** Pure numbers, algebra tokens, or emoji — no reliable language cue. */
export function isTutorMessageAmbiguousLanguage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^\d+$/.test(trimmed)) return true;
  if (/^[\d+\-×÷=().,\sxyab]+$/i.test(trimmed) && trimmed.length <= 48) return true;
  if (/^[\p{Emoji}\p{Emoji_Presentation}\s]+$/u.test(trimmed)) return true;
  return false;
}

function isTutorShortStudentAnswer(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 56 && !detectTutorExplicitLanguageRequest(trimmed);
}

function inferTutorLanguageFromStudentText(
  text: string,
  recentUserText = '',
): AdamTutorLanguage | null {
  const sample = text.trim();
  if (!sample || isTutorMessageAmbiguousLanguage(sample)) return null;

  const detected = detectLanguage(sample, recentUserText);
  if (detected.confidence >= 0.55) {
    return mirrorLocaleToTutorLanguage(detected.detectedLocale);
  }
  if (scoreMalaySessionText(sample) >= 2) return 'malay';
  if (/\bdan\b/i.test(sample) && scoreMalaySessionText(sample) >= 1) return 'malay';
  if (MALAY_THREAD_ESTABLISHED.test(sample)) return 'malay';
  return null;
}

/**
 * Universal scholar — match the student's language each turn.
 * Profile language is fallback only when the message has no language cue.
 */
export function resolveTutorSessionLanguage(
  profile?: AdamTutorProfile,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
  userMessage?: string,
): AdamTutorLanguage {
  const current = (userMessage ?? recentUserMessages.at(-1) ?? '').trim();

  const explicit = detectTutorExplicitLanguageRequest(current);
  if (explicit) return explicit;

  const userSample = recentUserMessages.slice(-8).join('\n');
  const threadLang = userSample.trim() && !isTutorMessageAmbiguousLanguage(userSample)
    ? inferTutorLanguageFromStudentText(userSample)
    : null;

  if (current && isTutorShortStudentAnswer(current) && threadLang) {
    return threadLang;
  }

  if (current && !isTutorMessageAmbiguousLanguage(current)) {
    const fromCurrent = inferTutorLanguageFromStudentText(
      current,
      recentUserMessages.slice(-6).join('\n'),
    );
    if (fromCurrent) return fromCurrent;
  }

  if (threadLang) return threadLang;

  if (isTutorMessageAmbiguousLanguage(current)) {
    const assistantSample = recentAssistantMessages.slice(-4).join('\n');
    const assistantLang = inferTutorLanguageFromStudentText(assistantSample);
    if (assistantLang) return assistantLang;
    if (scoreMalaySessionText(assistantSample) >= 3) return 'malay';
    if (MALAY_THREAD_ESTABLISHED.test(assistantSample)) return 'malay';
    if (MALAY_THREAD_ESTABLISHED.test(userSample)) return 'malay';
  }

  if (profile?.language) {
    return normalizeTutorLanguage(profile.language);
  }
  return 'english';
}

const MALAY_THREAD_ESTABLISHED =
  /\b(?:salam|cikgu|terima kasih|mari kita|saya tunggu|ungkapan|kembangkan|kurungan|sebutan|langkah demi langkah|betul sekali|hukum taburan)\b/i;

const MALAY_SESSION_WORD =
  /\b(?:yang|dengan|untuk|adalah|tidak|soalan|cuba|tulis|jawapan|pelajar|bila|apakah|ialah|maka|betul|jika|langkah|akhirnya|cikgu|kamu|kita|kenapa|operasi|persamaan|tolak|tambah|salam|ungkapan|kembangkan|kurungan|sebutan|darab|bahagi|boleh|faham|terima kasih|mari|perlu|semua|dalam|hampir|satu|demi)\b/gi;

function scoreMalaySessionText(text: string): number {
  if (!text.trim()) return 0;
  return text.slice(0, 2400).match(MALAY_SESSION_WORD)?.length ?? 0;
}

function tutorReplyHasClassroomMathContent(text: string): boolean {
  return (
    /\d+\s*[xyab]\b/i.test(text)
    || /[×−]\s*\d/.test(text)
    || /\b(?:expand|expanded|ungkapan|kurungan|brackets?|distributive)\b/i.test(text)
    || /\(\s*\d+[a-z]/i.test(text)
  );
}

/** Sync BM rewrite — keep algebra/markdown; strip English praise drift. */
export function rewriteTutorEnglishDriftToMalay(
  text: string,
  profile?: AdamTutorProfile,
  participantName?: string,
): string {
  const title = tutorTeacherTitle(normalizeTutorLanguage(profile?.language ?? 'malay'));
  const first = participantName?.trim()
    ? usersDisplayFirstName(participantName.trim())
    : '';
  const open = first ? `Bagus, ${first}!` : 'Bagus, Pelajar!';

  let out = text
    .replace(/^Well done,?\s*Pelajar!?/i, open)
    .replace(/^Well done!?/i, open)
    .replace(/\bWell done\b/gi, 'Bagus')
    .replace(/\bYou've correctly expanded the expression\b/gi, 'Anda betul mengembangkan ungkapan')
    .replace(/\bYou've written\b/gi, 'Anda tulis')
    .replace(/\bYou've correctly\b/gi, 'Anda betul')
    .replace(/\bLet's verify step by step together\b/gi, 'Mari kita semak langkah demi langkah')
    .replace(/\bLet's verify step by step\b/gi, 'Mari kita semak langkah demi langkah')
    .replace(/\bLet's check it together\b/gi, 'Mari kita periksa bersama')
    .replace(/\bThis looks like the result of expanding\b/gi, 'Ini kelihatan seperti hasil pengembangan')
    .replace(/\bThis matches the expansion of\b/gi, 'Ini sepadan dengan pengembangan')
    .replace(/\bSo, putting them together\b/gi, 'Jadi, jika digabungkan')
    .replace(/\bputting them together\b/gi, 'jika digabungkan')
    .replace(/\bThat's the fully expanded\b/gi, 'Itu ungkapan yang dikembangkan sepenuhnya')
    .replace(/\bThat's fully expanded\b/gi, 'Itu dikembangkan sepenuhnya')
    .replace(/\bfully expanded\b/gi, 'dikembangkan sepenuhnya')
    .replace(/\bno brackets left\b/gi, 'tiada kurungan lagi')
    .replace(/\ball terms simplified\b/gi, 'setiap sebutan dipermudahkan')
    .replace(/\bFirst term\b/gi, 'Sebutan pertama')
    .replace(/\bSecond term\b/gi, 'Sebutan kedua')
    .replace(/\bWould you like to try\b/gi, 'Mahu cuba')
    .replace(/\bJust tell me\b/gi, 'Beritahu sahaja')
    .replace(/\bI'll be right here\b/gi, 'Saya di sini')
    .replace(/\bI'm right here\b/gi, 'Saya di sini')
    .replace(/\bchecking, guiding\b/gi, 'memeriksa dan membimbing')
    .replace(/\bPerfect\b/g, 'Sempurna')
    .replace(/\bYou do the thinking\b/gi, 'Anda fikir')
    .replace(/\bI hold the light\b/gi, 'saya bimbing')
    .replace(/\bstep by step\b/gi, 'langkah demi langkah')
    .replace(/\bKeep the negative sign\b/gi, 'Kekalkan tanda negatif')
    .replace(/\bapplied the distributive law correctly\b/gi, 'menggunakan hukum taburan dengan betul');

  out = fixTutorPelajarOpener(
    out,
    participantName,
    profile
      ? { ...profile, language: 'malay' }
      : { level: 'primary', curriculum: 'national', language: 'malay' },
  );

  if (tutorReplyIsPredominantlyEnglish(out)) {
    const mathLines = extractMathLines(out);
    return `${open}

Mari kita teruskan dalam Bahasa Melayu — struktur pengajaran sama, hanya bahasa diganti.

${mathLines.length > 0 ? mathLines.join('\n') : out.slice(0, 700)}

**${title}** tunggu langkah seterusnya anda.`;
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function extractMathLines(text: string): string[] {
  return text.split('\n').filter((line) =>
    /[=×−]|\d+\s*[xyab]|^\s*→/.test(line),
  ).slice(0, 12);
}

function tutorReplyHasEnglishPlaceValueTeaching(text: string): boolean {
  return /\b(?:ones column|tens place|hundreds place|Puluh|Ratus|Sa \(ones\))\b/i.test(text)
    && /\d\s*\+\s*\d/.test(text);
}

/** Preserve column context when model drifts to English mid place-value drill. */
export function buildTutorMalayPlaceValueFromEnglish(
  english: string,
  userMessage: string,
  profile?: AdamTutorProfile,
  participantName?: string,
): string {
  const first = participantName?.trim()
    ? usersDisplayFirstName(participantName.trim())
    : '';
  const open = first ? `Baik, ${first}.` : 'Baik.';
  const trimmed = userMessage.trim();
  const ack = trimmed
    ? `Terima kasih — jawapan anda **${trimmed}** untuk langkah sebelumnya.`
    : 'Terima kasih atas jawapan anda.';

  let column = 'Sa (satuan)';
  if (/\b(?:puluh|tens)\b/i.test(english)) column = 'Puluh';
  if (/\b(?:ratus|hundreds)\b/i.test(english)) column = 'Ratus';

  const sumMatch = english.match(/(\d)\s*\+\s*(\d)/);
  const left = sumMatch?.[1] ?? '?';
  const right = sumMatch?.[2] ?? '?';

  const title = tutorTeacherTitle(normalizeTutorLanguage(profile?.language));

  return `${open} ${ack}

Mari kita teruskan **satu langkah sahaja** — tempat **${column}**.
Berapa **${left} + ${right}** di tempat **${column}**?
→ ______

**${title}** tunggu jawapan anda — kemudian kita bergerak ke tempat seterusnya.`;
}

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
    /\b(?:good|well|correct|wrong|let|try|explain|step|answer|actually|remember|almost|great|nice|think|write|you|the|that|this|what|when|then|now|next|first|second|third|done|verify|expand|expanded|brackets|putting|together|would|like|just|here|guide|check|celebrating)\b/g,
  ) ?? []).length;
  const malayHits = (lower.match(
    /\b(?:yang|dengan|untuk|adalah|tidak|soalan|jawapan|pelajar|betul|jika|langkah|cikgu|anda|kamu|kenapa|operasi|tambah|tolak|darab|bahagi|tempat|tulis|faham|terima kasih|bagus|hampir|mari|kita|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh)\b/g,
  ) ?? []).length;

  return englishHits >= 4 && englishHits > malayHits * 1.4;
}

function tutorReplyViolatesMalaySession(
  text: string,
  profile?: AdamTutorProfile,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
  userMessage?: string,
): boolean {
  const lang = resolveTutorSessionLanguage(
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  );
  if (lang !== 'malay') return false;
  if (detectTutorExplicitLanguageRequest(userMessage ?? '') === 'english') return false;
  if (tutorReplyHasEnglishMenuBleed(text)) return true;
  return tutorReplyIsPredominantlyEnglish(text);
}

function tutorReplyViolatesSessionLanguage(
  text: string,
  profile?: AdamTutorProfile,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
  userMessage?: string,
): boolean {
  return tutorReplyViolatesMalaySession(
    text,
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  );
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
  userMessage?: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): Promise<string> {
  if (!text?.trim()) return text;
  const lang = resolveTutorSessionLanguage(
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  );
  if (lang !== 'malay') return text;
  if (!tutorReplyViolatesMalaySession(
    text,
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  )) return text;

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
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
): string {
  const fixedOpener = fixTutorPelajarOpener(text, participantName, profile);
  if (!tutorReplyViolatesSessionLanguage(
    fixedOpener,
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  )) {
    return fixedOpener;
  }
  if (
    tutorReplyHasEnglishMenuBleed(fixedOpener)
    || tutorReplyIsPredominantlyEnglish(fixedOpener)
  ) {
    if (tutorReplyHasClassroomMathContent(fixedOpener)) {
      return rewriteTutorEnglishDriftToMalay(fixedOpener, profile, participantName);
    }
    if (tutorReplyHasEnglishMenuBleed(fixedOpener)) {
      return buildTutorAmbiguousInputReply(userMessage ?? '', profile, participantName);
    }
  }
  if (tutorReplyHasEnglishPlaceValueTeaching(fixedOpener)) {
    return buildTutorMalayPlaceValueFromEnglish(
      fixedOpener,
      userMessage ?? '',
      profile,
      participantName,
    );
  }
  if (tutorReplyHasClassroomMathContent(fixedOpener)) {
    return rewriteTutorEnglishDriftToMalay(fixedOpener, profile, participantName);
  }
  return buildTutorMalayFollowUpRecovery(userMessage ?? '', profile, participantName);
}

/** Tutor lane — universal scholar mirrors the student's language each turn. */
export function buildTutorSessionLanguageLock(
  profile?: AdamTutorProfile,
  recentAssistantMessages: string[] = [],
  recentUserMessages: string[] = [],
  userMessage?: string,
): string {
  const lang = resolveTutorSessionLanguage(
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  );
  const profileLang = normalizeTutorLanguage(profile?.language ?? 'english');
  const ambiguousTurn = isTutorMessageAmbiguousLanguage(
    (userMessage ?? recentUserMessages.at(-1) ?? '').trim(),
  );
  const threadAnchor = lang === 'malay'
    ? `- When the student replies with numbers or algebra only (e.g. "12x", "12a dan -14b"), keep Bahasa Melayu — do not drift to English praise ("Well done", "Let's verify"). Use Bagus!, Betul sekali!, Mari kita semak…\n`
    : '';
  const fallbackLine = ambiguousTurn
    ? `- This turn has no language cue (number/symbol only) — continue in **${lang}** (profile default: ${profileLang}).\n`
    : '';
  return `
[TUTOR LANGUAGE — UNIVERSAL SCHOLAR]
ADAM Tutor is a universal scholar. Reply in the language the student uses **this turn**.
- Mirror the student's language — English, Malay, Arabic, Mandarin, Tamil, and other world languages.
- If the student asks to switch language ("answer in English", "jawab dalam BM"), honour it immediately. **Never refuse** or say you cannot reply in their language.
${fallbackLine}${threadAnchor}${tutorLanguageInstruction(lang)}
When the student sends only a number, symbol, or emoji, continue in the language already established in this thread (or profile default above).
Never offer Alamtologi, AMA, TAJU, QXK24, or founder frameworks as topic options.
[/TUTOR LANGUAGE]
`.trim();
}

/** Tutor web search — silent for student UI; conventional academics only. */
export function buildTutorWebSearchPrompt(
  profile?: AdamTutorProfile,
  prefetched = false,
  gateReason?: string | null,
  userMessage?: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  const lang = resolveTutorSessionLanguage(
    profile,
    recentAssistantMessages,
    recentUserMessages,
    userMessage,
  );
  const langLine = tutorLanguageInstruction(lang);
  const prefetchLine = prefetched
    ? 'Web search results may appear in [WEB SEARCH RESULTS] above — use only conventional facts from those hits.'
    : 'Web search may run for factual classroom topics only.';
  const curriculumLine = gateReason === 'student_factual_correction'
    ? 'Pelajar membetulkan fakta tadi — cari MOE/KPM/gov.my; terima pembetulan jika disokong kurikulum.'
    : gateReason === 'classroom_enumeration'
      ? 'Soalan senarai kurikulum — cari MOE/KPM/gov.my; jawab versi buku teks sekolah.'
      : '';
  return `
ADAM TUTOR — WEB SEARCH (silent — student does not see search UI):
${prefetchLine}
${curriculumLine}
- Conventional school/university subjects ONLY — no Alamtologi, AMA, TAJU, or founder frameworks.
- ${langLine}
- Weave verified facts in plain classroom language — no citation dump, no search narration.
- NEVER invent "disahkan melalui carian" or reference IDs (e.g. 4,632) without a real search hit.
- If search is empty, continue teaching conventionally — do not invent studies or URLs.
`.trim();
}
