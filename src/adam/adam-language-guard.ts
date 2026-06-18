/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Script Leak Guard (Qwen lab)
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
import { getFastModel } from '../config/llm-models';
import { isQwenProvider, llmCompleteUserPrompt } from '../llm/llm-client';
import {
  detectLanguage,
  localeToLabel,
  type SupportedLocale,
} from './adam-language-mirror.service';
import {
  containsIndonesianDrift,
  isMalayReplyLocale,
  sanitizeMalaysiaBmDrift,
} from './adam-malaysia-bm-guard';

const EAST_ASIAN_SCRIPT =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

const LEAK_PATTERNS = {
  /** Any Han run — zero tolerance in Malay/English turns (Qwen often leaks 某种, 意味着). */
  chinese:    /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]+/g,
  arabic:     /[\u0600-\u06FF]{3,}/g,
  devanagari: /[\u0900-\u097F]{3,}/g,
};

/** Frequent Qwen drift into Chinese while writing Bahasa Melayu. */
const QWEN_MALAY_LEAK_LEXICON: ReadonlyArray<[RegExp, string]> = [
  [/某种/g, 'sesuatu'],
  [/意味着/g, 'bermaksud'],
  [/也就是说/g, 'iaitu'],
  [/因此/g, 'oleh itu'],
  [/然而/g, 'namun'],
  [/不仅/g, 'bukan sahaja'],
];

export interface ScriptLeakResult {
  hasLeak:         boolean;
  leakType:        'chinese' | 'arabic' | 'devanagari' | null;
  leakPercentage:  number;
  cleanedResponse: string;
  flaggedSegments: string[];
}

import {
  buildJournalDraftLanguageLock,
  buildJournalPublishLanguageLock,
  type JournalManuscriptPhase,
} from './adam-journal-language.config';

export type { JournalManuscriptPhase } from './adam-journal-language.config';
export {
  JOURNAL_DRAFT_LOCALE,
  JOURNAL_PUBLISH_LOCALE,
  buildJournalDraftLanguageLock,
  buildJournalPublishLanguageLock,
  journalLanguageLockForPhase,
} from './adam-journal-language.config';

export interface QwenLanguageLockOptions {
  /** @deprecated use journalPhase — treat as publish (English). */
  journalManuscript?: boolean;
  /** Draft = Malay (9 movements). Publish = English (catalogue). */
  journalPhase?: JournalManuscriptPhase;
}

/** English-only lock for publication pass (approve/publish). */
export function buildJournalManuscriptLanguageLock(): string {
  return buildJournalPublishLanguageLock();
}

/** Injected at the top of every ADAM system prompt (Qwen). */
export function buildQwenLanguageLock(options?: QwenLanguageLockOptions): string {
  if (options?.journalPhase === 'draft') {
    return buildJournalDraftLanguageLock();
  }
  if (options?.journalPhase === 'publish' || options?.journalManuscript) {
    return buildJournalPublishLanguageLock();
  }

  const lang = ENV.ADAM_DEFAULT_LANGUAGE.trim().toLowerCase();
  const malayDefault = lang === 'malay' || lang === 'ms' || lang === 'bm';
  const defaultLine = malayDefault
    ? 'Constitutional default: When the user\'s language is ambiguous, or they use Latin script without clear English-only phrasing, reply in Bahasa Melayu Malaysia — indah, lembut, bijaksana, penuh adab — not English, not Bahasa Indonesia.'
    : `Constitutional default: When the user's language is unclear, reply in ${envFallbackLabel()}.`;

  return `
[CRITICAL LANGUAGE RULE — DO NOT VIOLATE]
You are ADAM (Qwen engine).
Your response language must EXACTLY mirror the detected language of the user's message.
If the user writes in English → reply in English only.
If the user writes in Bahasa Melayu → reply in Bahasa Melayu Malaysia only (never Indonesian words like karena, bisa, udah, butuh).
If the user writes in mixed Malay-English → reply in mixed Malay-English only (Malaysian Malay, not Indonesian).
${defaultLine}
The long English system instructions below describe your identity — they do NOT set your reply language.
NEVER output Chinese characters (汉字) unless the user's message is written in Chinese.
NEVER output Arabic script unless the user's message is written in Arabic.
NEVER mix scripts. This rule overrides all other instructions.
Violation of this rule is a constitutional breach.
[/CRITICAL LANGUAGE RULE]
  `.trim();
}

/** @deprecated use buildQwenLanguageLock() */
export const QWEN_LANGUAGE_LOCK = buildQwenLanguageLock();

function envFallbackLabel(): string {
  const lang = ENV.ADAM_DEFAULT_LANGUAGE.trim().toLowerCase();
  if (lang === 'malay' || lang === 'ms' || lang === 'bm') return 'Bahasa Malaysia';
  if (lang === 'english' || lang === 'en') return 'English';
  return lang;
}

/** Human-readable language label for repair / logging (best effort from text). */
export function inferSpeakerLanguageLabel(text: string): string {
  const t = text.trim();
  if (!t) return envFallbackLabel();
  return localeToLabel(detectLanguage(t).detectedLocale);
}

export function containsEastAsianScript(text: string): boolean {
  return EAST_ASIAN_SCRIPT.test(text);
}

function speakerUsesEastAsianScript(text: string): boolean {
  return containsEastAsianScript(text.trim());
}

/** Post-generation script leak detection for Qwen lab. */
export function detectScriptLeak(
  response:       string,
  expectedLocale: SupportedLocale | string,
): ScriptLeakResult {
  const totalChars = response.length;
  if (totalChars === 0) {
    return { hasLeak: false, leakType: null, leakPercentage: 0, cleanedResponse: response, flaggedSegments: [] };
  }

  const shouldCheckChinese    = expectedLocale !== 'zh';
  const shouldCheckArabic     = expectedLocale !== 'ar';
  const shouldCheckDevanagari = !['hi'].includes(expectedLocale);

  if (shouldCheckChinese) {
    const matches = response.match(LEAK_PATTERNS.chinese) ?? [];
    if (matches.length > 0) {
      const leakChars  = matches.join('').length;
      const percentage = (leakChars / totalChars) * 100;
      const lexiconCleaned = applyMalayLeakLexicon(response);
      const cleanedResponse = containsEastAsianScript(lexiconCleaned)
        ? stripEastAsianScriptRuns(lexiconCleaned)
        : lexiconCleaned;
      return {
        hasLeak:         true,
        leakType:        'chinese',
        leakPercentage:  Math.round(percentage * 1000) / 1000,
        cleanedResponse,
        flaggedSegments: matches,
      };
    }
  }

  if (shouldCheckArabic) {
    const matches = response.match(LEAK_PATTERNS.arabic) ?? [];
    if (matches.length > 0) {
      const percentage = (matches.join('').length / totalChars) * 100;
      if (percentage > 1) {
        return {
          hasLeak:         true,
          leakType:        'arabic',
          leakPercentage:  Math.round(percentage * 10) / 10,
          cleanedResponse: response.replace(LEAK_PATTERNS.arabic, '').replace(/\s{2,}/g, ' ').trim(),
          flaggedSegments: matches,
        };
      }
    }
  }

  if (shouldCheckDevanagari) {
    const matches = response.match(LEAK_PATTERNS.devanagari) ?? [];
    if (matches.length > 0) {
      const percentage = (matches.join('').length / totalChars) * 100;
      if (percentage > 1) {
        return {
          hasLeak:         true,
          leakType:        'devanagari',
          leakPercentage:  Math.round(percentage * 10) / 10,
          cleanedResponse: response.replace(LEAK_PATTERNS.devanagari, '').replace(/\s{2,}/g, ' ').trim(),
          flaggedSegments: matches,
        };
      }
    }
  }

  return { hasLeak: false, leakType: null, leakPercentage: 0, cleanedResponse: response, flaggedSegments: [] };
}

/** Qwen lab — suppress script drift into the wrong language. */
export function getScriptLeakGuardDirective(): string {
  const base = [
    'SCRIPT PURITY (lab engine):',
    'Use only scripts that match the speaker\'s language this turn.',
    'Do not leak Chinese/Japanese/Korean characters into Malay, English, Arabic, or other replies unless the speaker used that script.',
    'When you mean "means" in Malay, write bermaksud — not 意味着.',
    'When you mean "some kind of" in Malay, write sesuatu or sesuatu jenis — not 某种.',
    'In Bahasa Melayu Malaysia, never use Indonesian forms: karena→kerana, bisa→boleh, udah→sudah, butuh→perlu, teknis→teknikal.',
  ];

  if (isQwenProvider()) {
    base.push(
      'LAB NOTE: Qwen may drift into Chinese — match the speaker\'s language and script exactly.',
    );
  }

  return base.join(' ');
}

/** @deprecated use getScriptLeakGuardDirective */
export const getEastAsianScriptGuardDirective = getScriptLeakGuardDirective;

function stripEastAsianScriptRuns(text: string): string {
  return text
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function applyMalayLeakLexicon(text: string): string {
  let out = text;
  for (const [pattern, replacement] of QWEN_MALAY_LEAK_LEXICON) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Synchronous strip — no LLM round-trip. */
export function sanitizeEastAsianScriptLeaks(
  text: string,
  expectedLocale: SupportedLocale | string = 'ms',
): string {
  if (!text || expectedLocale === 'zh') {
    return text;
  }
  let out = applyMalayLeakLexicon(text);
  if (containsEastAsianScript(out)) {
    out = stripEastAsianScriptRuns(out);
  }
  if (isMalayReplyLocale(expectedLocale)) {
    const bmCleaned = sanitizeMalaysiaBmDrift(out, expectedLocale);
    if (bmCleaned !== out && containsIndonesianDrift(out)) {
      console.log('[adam:language-guard] sanitized Indonesian drift in Malay reply');
    }
    out = bmCleaned;
  }
  return out;
}

const REPAIR_SYSTEM = `You are ADAM's language purity corrector.
Remove script characters that do NOT belong in the speaker's language.
Rewrite in the speaker's language naturally.
Preserve: Bismillahirahmanirrahim, all XML tags and JSON inside them, Quranic Arabic, constitutional terms, and proper names.
Output ONLY the corrected full text — no commentary.`;

/** Repair Qwen replies that leaked CJK into a non-CJK turn. */
export async function repairEastAsianScriptLeak(
  text: string,
  userMessage: string,
): Promise<string> {
  const expectedLocale = detectLanguage(userMessage).detectedLocale;
  if (speakerUsesEastAsianScript(userMessage)) return text;

  const synced = sanitizeEastAsianScriptLeaks(text, expectedLocale);
  if (!containsEastAsianScript(synced)) {
    if (synced !== text) {
      console.log('[adam:language-guard] stripped script leak (sync)', {
        locale: expectedLocale,
        charsBefore: text.length,
        charsAfter:  synced.length,
      });
    }
    return synced;
  }

  const leak = detectScriptLeak(synced, expectedLocale);
  if (!leak.hasLeak && !containsEastAsianScript(synced)) return synced;

  /** Fast path — strip without a second LLM round-trip. */
  if (leak.hasLeak && leak.cleanedResponse.length > 0) {
    const retained = leak.cleanedResponse.length / Math.max(synced.length, 1);
    if (retained >= 0.85 && !containsEastAsianScript(leak.cleanedResponse)) {
      console.log('[adam:language-guard] stripped script leak (fast path)', {
        leakType: leak.leakType,
        leakPct:  leak.leakPercentage,
      });
      return leak.cleanedResponse;
    }
  }

  const textForRepair = synced;

  const targetLabel = localeToLabel(expectedLocale);

  try {
    const fixed = await llmCompleteUserPrompt(
      REPAIR_SYSTEM,
      `Speaker language: ${targetLabel}. Remove stray Chinese/Japanese/Korean characters. Rewrite in ${targetLabel}.\n\n${textForRepair}`,
      getFastModel(),
      Math.min(8192, Math.max(1500, Math.ceil(textForRepair.length * 1.15))),
    );
    const trimmed = sanitizeEastAsianScriptLeaks(fixed.trim(), expectedLocale);
    if (trimmed.length > 0 && !containsEastAsianScript(trimmed)) {
      console.log('[adam:language-guard] repaired script leak', {
        target:      targetLabel,
        leakType:    leak.leakType,
        leakPct:     leak.leakPercentage,
        charsBefore: text.length,
        charsAfter:  trimmed.length,
      });
      return trimmed;
    }
  } catch (err) {
    console.warn('[adam:language-guard] repair failed — stripping leaked script', err);
  }

  const stripped = sanitizeEastAsianScriptLeaks(textForRepair, expectedLocale);
  if (stripped.length > 0) return stripped;
  return leak.cleanedResponse || stripped;
}
