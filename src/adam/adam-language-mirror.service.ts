/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Language Mirror Protocol
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { MALAYSIA_BM_LANGUAGE_DIRECTIVE } from './adam-malaysia-bm-guard';

export type SupportedLocale =
  | 'ms'
  | 'en'
  | 'ar'
  | 'zh'
  | 'id'
  | 'ta'
  | 'hi'
  | 'mixed-ms-en';

export interface LanguageMirrorResult {
  detectedLocale:   SupportedLocale;
  confidence:       number;
  isMixed:          boolean;
  dominantScript:   'latin' | 'arabic' | 'chinese' | 'devanagari' | 'tamil';
  replyInstruction: string;
}

const SCRIPT_PATTERNS = {
  arabic:     /[\u0600-\u06FF\u0750-\u077F]/,
  chinese:    /[\u4E00-\u9FFF\u3400-\u4DBF]/,
  devanagari: /[\u0900-\u097F]/,
  tamil:      /[\u0B80-\u0BFF]/,
};

const MALAY_WORDS =
  /\b(saya|anda|awak|dia|kita|kami|mereka|adalah|dengan|untuk|tidak|tak|boleh|macam|kalau|jika|sebab|kerana|bila|nak|dah|pun|lah|kan|tu|ni|kenapa|siapa|apa|bagaimana|terima kasih|selamat|yang|bermaksud|maksud|terangkan|huraikan|jelaskan|beritahu|faham|ingat|tahu|nampak|rasa|hati|otak|pelajar|pembelajaran|bismillah|hikmah|walaupun|meskipun|jadi|ada|tiada|sudah|belum|lagi|sangat|amat|sikit|banyak|semua|setiap|dalam|pada|kepada|daripada|antara|seperti|contoh|soalan|jawab|bincang|cerita|mengajar|belajar|allah|quran|hadith|founder|pengasas)\b/gi;

const ENGLISH_WORDS =
  /\b(i|you|we|they|the|is|are|was|were|have|has|do|does|what|why|how|when|who|can|will|please|thank|thanks|yes|no|and|with|for|because|explain|describe|tell|mean|think|student|teaching|founder|would|should|could|about|this|that|these|those|hello|hi|hey|good|morning|afternoon|evening|night|bye|okay|ok)\b/gi;

const ENGLISH_GREETING_ONLY =
  /^(?:hello|hi|hey|good\s+(?:morning|afternoon|evening|night)|how\s+are\s+you|thanks|thank\s+you|ok(?:ay)?)[!.?\s]*$/i;

/** Malay particles / romanised cues not caught by word list alone */
const MALAY_PARTICLE_RE =
  /\b(tak|takde|tak\s|lah|kah|pun|je|jela|gak|kot|dah|nak|dekat|kat)\b|(?:\w+(?:lah|kah|pun|je|kan))\b/gi;

function configuredDefaultLocale(): SupportedLocale {
  const lang = ENV.ADAM_DEFAULT_LANGUAGE.trim().toLowerCase();
  if (lang === 'malay' || lang === 'ms' || lang === 'bm') return 'ms';
  return 'en';
}

function malayReplyInstruction(): string {
  return [
    'Reply entirely in Bahasa Melayu Malaysia — NOT Bahasa Indonesia.',
    'Voice: ayat bebas mengalir — indah, lembut, bijaksana, penuh adab (bukan kaku buku teks).',
    'Do not use Indonesian words (karena, bisa, udah, butuh, banget, gimana, teknis, efektif, etc.).',
    'Layout: perenggan mengalir — pendek atau panjang ikut nada soalan; no Pertama/Kedua/Ketiga skeleton.',
    'Keep "hikmah", "ALLAH", "Bismillahirahmanirrahim" in their original form.',
    'Do not default to English.',
  ].join(' ');
}

function englishReplyInstruction(): string {
  return 'Reply in English. Clear, warm, and precise.';
}

function scoreLatinLanguages(lower: string): {
  malayScore: number;
  englishScore: number;
  indoScore: number;
  particleHits: number;
} {
  const malayScore   = (lower.match(MALAY_WORDS) ?? []).length;
  const englishScore = (lower.match(ENGLISH_WORDS) ?? []).length;
  const indoScore    = (lower.match(INDONESIAN_WORDS) ?? []).length;
  const particleHits = (lower.match(MALAY_PARTICLE_RE) ?? []).length;
  return { malayScore, englishScore, indoScore, particleHits };
}

const INDONESIAN_WORDS =
  /\b(saya|anda|kami|mereka|adalah|dengan|untuk|tidak|bisa|kalau|karena|kenapa|siapa|apa|bagaimana|terima kasih|selamat)\b/gi;

/** Per-turn language detection — mirrors the speaker's tongue. */
export function detectLanguage(message: string, recentUserText = ''): LanguageMirrorResult {
  const primary = message.trim();
  const combined = `${recentUserText}\n${primary}`.trim();
  const probe = primary.length >= 8 ? primary : combined;
  const lower = probe.toLowerCase();

  if (SCRIPT_PATTERNS.chinese.test(probe)) {
    return {
      detectedLocale:   'zh',
      confidence:       0.97,
      isMixed:          false,
      dominantScript:   'chinese',
      replyInstruction: 'Reply entirely in Mandarin Chinese (简体或繁体). Do not switch to English unless the user does first.',
    };
  }

  if (SCRIPT_PATTERNS.arabic.test(probe)) {
    return {
      detectedLocale:   'ar',
      confidence:       0.97,
      isMixed:          false,
      dominantScript:   'arabic',
      replyInstruction: 'Reply entirely in Arabic. Maintain formal but warm tone. Do not switch to English unless the user does first.',
    };
  }

  if (SCRIPT_PATTERNS.devanagari.test(probe)) {
    return {
      detectedLocale:   'hi',
      confidence:       0.95,
      isMixed:          false,
      dominantScript:   'devanagari',
      replyInstruction: 'Reply entirely in Hindi (Devanagari script). Do not switch to English unless the user does first.',
    };
  }

  if (SCRIPT_PATTERNS.tamil.test(probe)) {
    return {
      detectedLocale:   'ta',
      confidence:       0.95,
      isMixed:          false,
      dominantScript:   'tamil',
      replyInstruction: 'Reply entirely in Tamil. Do not switch to English unless the user does first.',
    };
  }

  const { malayScore, englishScore, indoScore, particleHits } = scoreLatinLanguages(lower);
  const malayTotal = malayScore + particleHits;

  if (ENGLISH_GREETING_ONLY.test(primary)) {
    return {
      detectedLocale:   'en',
      confidence:       0.95,
      isMixed:          false,
      dominantScript:   'latin',
      replyInstruction: englishReplyInstruction(),
    };
  }

  if (malayTotal > 0 && englishScore > 0) {
    return {
      detectedLocale:   'mixed-ms-en',
      confidence:       0.90,
      isMixed:          true,
      dominantScript:   'latin',
      replyInstruction: 'Reply in natural Malay-English code-switching (Malaysia BM only — never Indonesian). Mirror the founder\'s style: Malaysian Malay for emotional/philosophical content, English for technical content. Keep "hikmah", "ALLAH", "Bismillah" in Malay always.',
    };
  }

  if (malayTotal > englishScore && malayTotal >= indoScore) {
    return {
      detectedLocale:   'ms',
      confidence:       malayTotal >= 2 ? 0.92 : 0.86,
      isMixed:          false,
      dominantScript:   'latin',
      replyInstruction: malayReplyInstruction(),
    };
  }

  if (indoScore > malayTotal && indoScore > englishScore) {
    return {
      detectedLocale:   'id',
      confidence:       0.86,
      isMixed:          false,
      dominantScript:   'latin',
      replyInstruction: 'Reply entirely in Bahasa Indonesia. Do not switch to English unless the user does first.',
    };
  }

  if (englishScore > malayTotal && englishScore >= 1) {
    return {
      detectedLocale:   'en',
      confidence:       0.88,
      isMixed:          false,
      dominantScript:   'latin',
      replyInstruction: englishReplyInstruction(),
    };
  }

  const defaultLocale = configuredDefaultLocale();
  if (defaultLocale === 'ms' && malayTotal > 0) {
    return {
      detectedLocale:   'ms',
      confidence:       0.80,
      isMixed:          false,
      dominantScript:   'latin',
      replyInstruction: malayReplyInstruction(),
    };
  }

  return {
    detectedLocale:   'en',
    confidence:       0.85,
    isMixed:          false,
    dominantScript:   'latin',
    replyInstruction: englishReplyInstruction(),
  };
}

export function buildLanguageMirrorBlock(result: LanguageMirrorResult): string {
  const malayForce =
    result.detectedLocale === 'ms' || result.detectedLocale === 'mixed-ms-en'
      ? [
          'Do NOT default to English because the system prompt is in English. Your spoken reply must follow the detected language.',
          MALAYSIA_BM_LANGUAGE_DIRECTIVE,
        ].join('\n')
      : '';

  return `
[LANGUAGE MIRROR PROTOCOL — OVERRIDES ENGLISH SYSTEM CONTEXT]
Detected: ${result.detectedLocale} (confidence: ${Math.round(result.confidence * 100)}%)
Mixed: ${result.isMixed}
Instruction: ${result.replyInstruction}
${malayForce}
Constitutional note: ADAM always mirrors the speaker's language. Never reply in a different language than detected unless explicitly asked.
[/LANGUAGE MIRROR PROTOCOL]
  `.trim();
}

/** Pull recent founder/student lines from working-memory block for short-turn detection. */
export function extractRecentUserTextFromWorkingBlock(workingBlock: string): string {
  if (!workingBlock.trim()) return '';

  const userLines: string[] = [];
  const lineRe = /^\[(?:FOUNDER|STUDENT)(?:[^]]*)]: (.+)$/gim;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(workingBlock)) !== null) {
    const line = match[1]?.trim();
    if (line) userLines.push(line);
  }

  return userLines.slice(-3).join('\n');
}

/** Human-readable label for repair prompts and logging. */
export function localeToLabel(locale: SupportedLocale | string): string {
  switch (locale) {
    case 'ms':          return 'Bahasa Melayu';
    case 'mixed-ms-en': return 'Malay-English (code-switch)';
    case 'en':          return 'English';
    case 'ar':          return 'Arabic';
    case 'zh':          return 'Chinese';
    case 'id':          return 'Bahasa Indonesia';
    case 'ta':          return 'Tamil';
    case 'hi':          return 'Hindi';
    default:            return locale;
  }
}
