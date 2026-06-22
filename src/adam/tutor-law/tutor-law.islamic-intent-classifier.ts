/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Education Intent Classifier
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Source hierarchy: Quran → Hadith → Ijmak/Qiyas → Academic.
 * Never fabricate Quranic verses or Hadith text.
 */

import { isAdamIslamicStudiesTurn } from '../adam-domain-detectors';
import { userOpenedFaithDoor } from '../adam-universal-voice';
import { inferTutorLanguageFromText } from './tutor-law.types';
import type { AdamTutorProfile } from './tutor-law.types';
import {
  IMAN_SIGNALS,
  AKHLAQ_SIGNALS,
  COMPARE_SIGNALS,
  countSignalHits,
  FABRICATION_SIGNALS,
  FIQH_SIGNALS,
  HADITH_SIGNALS,
  HISTORY_SIGNALS,
  ISLAMIC_DOMAIN_MARKERS,
  QURAN_SIGNALS,
} from './tutor-law.islamic-intent-signals';
import {
  FabricationRisk,
  IslamicClassifierInput,
  IslamicClassifierOutput,
  IslamicIntent,
  IslamicIntentResult,
  IslamicSessionState,
  IslamicStudentLevel,
  IslamicTurnContext,
  SourceTier,
} from './tutor-law.islamic-intent.types';
import {
  applyIslamicSessionToOutput,
  applyLockedIntentToOutput,
  buildIslamicIntentResult,
  deriveIslamicSessionState,
  mergeIslamicSessionState,
} from './tutor-law.islamic-mode';
import { sanitizeIslamicUserMessage } from './tutor-law.quran-translation';

const FABRICATION_GUARD_MS =
  'ADAM tidak akan menulis teks ayat Al-Quran atau Hadith dari ingatan — '
  + 'risiko salah petik sangat serius. Untuk teks tepat: Al-Quran → quran.com atau mushaf diperakui; '
  + 'Hadith → sunnah.com (Sahih Bukhari, Muslim, dll). '
  + 'ADAM boleh bantu kamu faham MAKSUD dan KONTEKS — bukan petik verbatim dari ingatan.';

const FABRICATION_GUARD_EN =
  'ADAM will not reproduce Quranic verses or Hadith text from memory — '
  + 'misquotation risk is too serious. For accurate text: Quran → quran.com or a certified mushaf; '
  + 'Hadith → sunnah.com (Sahih Bukhari, Muslim, etc). '
  + 'ADAM can help with MEANING and CONTEXT — not verbatim recall from memory.';

const VERIFICATION_REMINDER_MS =
  '[Nota: ADAM menyatakan makna dan konteks — untuk teks dan terjemahan tepat, '
  + 'sila sahkan dengan quran.com atau sunnah.com]';

const VERIFICATION_REMINDER_EN =
  '[Note: ADAM states meaning and context only — for exact text and translation, '
  + 'please verify at quran.com or sunnah.com]';

const PEDAGOGY_PROBES: Partial<Record<IslamicIntent, string>> = {
  [IslamicIntent.Q_QURAN]:
    'Sebelum kita bincang maksud ayat ni — kamu tahu tak dalam surah apa ia turun, dan apa konteks masa ia diwahyukan?',
  [IslamicIntent.Q_HADITH]:
    'Sebelum kita teruskan — kamu ada maklumat dari mana hadis ni? Siapa yang meriwayatkannya?',
  [IslamicIntent.Q_FIQH]:
    'Soalan hukum yang baik. Sebelum ADAM terangkan — apakah pandangan kamu sendiri tentang soalan ni, dan dari mana kamu dapat maklumat awal?',
  [IslamicIntent.Q_IMAN]:
    'Soalan iman yang penting. Apa yang kamu sudah faham tentang perkara ini? Kita mula dari situ.',
  [IslamicIntent.Q_AKHLAQ]:
    'Soalan akhlak selalu lebih mudah difahami melalui contoh. Boleh kamu cerita situasi apa yang buat kamu tanya soalan ni?',
  [IslamicIntent.Q_HISTORY]:
    'Tentang sejarah Islam ni — kamu dah baca atau dengar apa tentangnya sebelum ni?',
  [IslamicIntent.Q_COMPARE]:
    'Soalan perbandingan agama memerlukan sikap adil dan ilmu yang tepat. Apa yang mendorong kamu ingin tahu tentang perbandingan ini?',
};

function isMalayIslamicTurn(
  rawText: string,
  profile?: AdamTutorProfile,
): boolean {
  return inferTutorLanguageFromText(rawText, profile) === 'malay';
}

function mapStudentLevel(profile?: AdamTutorProfile): IslamicStudentLevel {
  switch (profile?.level) {
    case 'primary':    return 'PRIMARY';
    case 'secondary':  return 'SECONDARY';
    case 'university': return 'UNIVERSITY';
    default:           return 'UNKNOWN';
  }
}

function isGrammarOnlyAyatTurn(normText: string): boolean {
  return (
    /\b(?:ayat|sentence)\s+(?:ni\s+)?(?:betul|ok|salah)\b/i.test(normText)
    || /\b(?:betul|ok)\s+tak\s+ayat\b/i.test(normText)
  ) && !/\b(?:quran|surah|wahyu|hadis|tafsir|firman)\b/i.test(normText);
}

function assessFabricationRisk(
  normText: string,
  intent: IslamicIntent,
): FabricationRisk {
  if (countSignalHits(normText, FABRICATION_SIGNALS) >= 1) {
    return FabricationRisk.HIGH;
  }
  if (intent === IslamicIntent.Q_QURAN || intent === IslamicIntent.Q_HADITH) {
    return FabricationRisk.MEDIUM;
  }
  return FabricationRisk.LOW;
}

function determineSourceTier(intent: IslamicIntent): SourceTier {
  switch (intent) {
    case IslamicIntent.Q_QURAN:   return SourceTier.QURAN;
    case IslamicIntent.Q_HADITH:  return SourceTier.HADITH;
    case IslamicIntent.Q_FIQH:    return SourceTier.IJMAK;
    case IslamicIntent.Q_IMAN:    return SourceTier.QURAN;
    case IslamicIntent.Q_AKHLAQ:  return SourceTier.HADITH;
    case IslamicIntent.Q_HISTORY:
    case IslamicIntent.Q_COMPARE: return SourceTier.ACADEMIC;
    default:                      return SourceTier.UNKNOWN;
  }
}

export function isTutorIslamicDomainMessage(
  message: string,
  recentUserMessages: string[] = [],
): boolean {
  const raw = message.trim();
  if (!raw || raw.length < 6) return false;
  if (isGrammarOnlyAyatTurn(raw.toLowerCase())) return false;
  if (userOpenedFaithDoor(raw)) return true;
  if (isAdamIslamicStudiesTurn(raw)) return true;
  const blob = [raw, ...recentUserMessages].join('\n').toLowerCase().trim();
  return countSignalHits(blob, ISLAMIC_DOMAIN_MARKERS) >= 1;
}

export function buildIslamicClassifierInput(input: {
  userMessage: string;
  profile?:     AdamTutorProfile;
  stuckCount?:  number;
}): IslamicClassifierInput {
  const rawText = input.userMessage ?? '';
  return {
    rawText,
    normText:     rawText.trim().toLowerCase(),
    stuckCount:   input.stuckCount ?? 0,
    studentLevel: mapStudentLevel(input.profile),
    profile:      input.profile,
  };
}

function deriveLockedIntentFromThread(ctx: IslamicTurnContext): IslamicIntent | null {
  const prior = ctx.recentUserMessages ?? [];
  for (let i = prior.length - 1; i >= 0; i--) {
    const msg = prior[i];
    if (!msg?.trim() || msg.trim().length < 6) continue;
    if (!isTutorIslamicDomainMessage(msg, prior.slice(0, i))) continue;
    const out = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: msg,
      profile:     ctx.profile,
    }));
    if (
      out.intent !== IslamicIntent.AMBIGUOUS
      && out.intent !== IslamicIntent.FABRICATION_RISK
    ) {
      return out.intent;
    }
  }
  return null;
}

export function buildTutorIslamicTurnContext(input: {
  userMessage:             string;
  recentUserMessages?:     string[];
  recentAssistantMessages?: string[];
  profile?:                AdamTutorProfile;
  stuckCount?:             number;
  sessionState?:           Partial<IslamicSessionState>;
}): IslamicTurnContext {
  const recentUserMessages = (input.recentUserMessages ?? [])
    .map(sanitizeIslamicUserMessage);
  return {
    userMessage:             sanitizeIslamicUserMessage(input.userMessage ?? ''),
    recentUserMessages,
    recentAssistantMessages: input.recentAssistantMessages ?? [],
    profile:                 input.profile,
    stuckCount:              input.stuckCount,
    sessionState:            input.sessionState,
  };
}

export function classifyIslamicIntent(
  input: IslamicClassifierInput,
): IslamicClassifierOutput {
  const { rawText, normText, profile } = input;
  const trace: string[] = [];
  const isMs = isMalayIslamicTurn(rawText, profile);

  const fabricHits = countSignalHits(normText, FABRICATION_SIGNALS);
  if (fabricHits >= 1) {
    trace.push(`intent=FABRICATION_RISK hits=${fabricHits}`);
    return {
      intent:               IslamicIntent.FABRICATION_RISK,
      sourceTier:           SourceTier.UNKNOWN,
      fabricationRisk:      FabricationRisk.HIGH,
      confidence:           'HIGH',
      fabricationGuard:     isMs ? FABRICATION_GUARD_MS : FABRICATION_GUARD_EN,
      verificationReminder: null,
      pedagogyProbe:        null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const quranHits = countSignalHits(normText, QURAN_SIGNALS);
  if (quranHits >= 1) {
    trace.push(`intent=Q_QURAN hits=${quranHits}`);
    const intent = IslamicIntent.Q_QURAN;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      assessFabricationRisk(normText, intent),
      confidence:           quranHits >= 2 ? 'HIGH' : 'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: isMs ? VERIFICATION_REMINDER_MS : VERIFICATION_REMINDER_EN,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const hadithHits = countSignalHits(normText, HADITH_SIGNALS);
  if (hadithHits >= 1) {
    trace.push(`intent=Q_HADITH hits=${hadithHits}`);
    const intent = IslamicIntent.Q_HADITH;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      assessFabricationRisk(normText, intent),
      confidence:           hadithHits >= 2 ? 'HIGH' : 'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: isMs ? VERIFICATION_REMINDER_MS : VERIFICATION_REMINDER_EN,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const fiqhHits = countSignalHits(normText, FIQH_SIGNALS);
  if (fiqhHits >= 1) {
    trace.push(`intent=Q_FIQH hits=${fiqhHits}`);
    const intent = IslamicIntent.Q_FIQH;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      FabricationRisk.LOW,
      confidence:           fiqhHits >= 2 ? 'HIGH' : 'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: null,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const imanHits = countSignalHits(normText, IMAN_SIGNALS);
  if (imanHits >= 1) {
    trace.push(`intent=Q_IMAN hits=${imanHits}`);
    const intent = IslamicIntent.Q_IMAN;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      FabricationRisk.LOW,
      confidence:           imanHits >= 2 ? 'HIGH' : 'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: null,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const akhlaqHits = countSignalHits(normText, AKHLAQ_SIGNALS);
  if (akhlaqHits >= 1) {
    trace.push(`intent=Q_AKHLAQ hits=${akhlaqHits}`);
    const intent = IslamicIntent.Q_AKHLAQ;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      FabricationRisk.LOW,
      confidence:           akhlaqHits >= 2 ? 'HIGH' : 'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: null,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const historyHits = countSignalHits(normText, HISTORY_SIGNALS);
  if (historyHits >= 1) {
    trace.push(`intent=Q_HISTORY hits=${historyHits}`);
    const intent = IslamicIntent.Q_HISTORY;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      FabricationRisk.LOW,
      confidence:           historyHits >= 2 ? 'HIGH' : 'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: null,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  const compareHits = countSignalHits(normText, COMPARE_SIGNALS);
  if (compareHits >= 1) {
    trace.push(`intent=Q_COMPARE hits=${compareHits}`);
    const intent = IslamicIntent.Q_COMPARE;
    return {
      intent,
      sourceTier:           determineSourceTier(intent),
      fabricationRisk:      FabricationRisk.LOW,
      confidence:           'MEDIUM',
      fabricationGuard:     null,
      verificationReminder: null,
      pedagogyProbe:        PEDAGOGY_PROBES[intent] ?? null,
      probeQuestion:        null,
      decisionTrace:        trace,
    };
  }

  trace.push('intent=AMBIGUOUS');
  return {
    intent:               IslamicIntent.AMBIGUOUS,
    sourceTier:           SourceTier.UNKNOWN,
    fabricationRisk:      FabricationRisk.LOW,
    confidence:           'LOW',
    fabricationGuard:     null,
    verificationReminder: null,
    pedagogyProbe:        null,
    probeQuestion:        isMs
      ? 'Boleh cerita lebih lanjut — adakah ini soalan tentang Al-Quran, Hadith, hukum fekah, iman, sejarah Islam, atau akhlak?'
      : 'Can you share more — is this a question about the Quran, Hadith, Islamic law, iman (faith), history, or ethics?',
    decisionTrace: trace,
  };
}

export function classifyTutorIslamicIntent(
  ctx: IslamicTurnContext,
): IslamicIntentResult | null {
  if (!isTutorIslamicDomainMessage(ctx.userMessage, ctx.recentUserMessages)) {
    return null;
  }

  const derived = deriveIslamicSessionState(ctx);
  const threadLock = deriveLockedIntentFromThread(ctx);
  const merged = mergeIslamicSessionState(ctx.sessionState, derived);
  const sessionState: IslamicSessionState = {
    ...merged,
    lockedIntent: merged.lockedIntent ?? threadLock,
  };
  const classified = classifyIslamicIntent(buildIslamicClassifierInput({
    userMessage: ctx.userMessage,
    profile:     ctx.profile,
    stuckCount:  sessionState.stuckCount,
  }));
  const rawOutput = applyLockedIntentToOutput(classified, sessionState.lockedIntent);
  const { output, pedagogyProbeSkipped } = applyIslamicSessionToOutput(
    rawOutput,
    sessionState,
  );

  return buildIslamicIntentResult(output, sessionState, pedagogyProbeSkipped);
}

/** Classifier output only — for prompt laws and guards. */
export function classifyTutorIslamicIntentOutput(
  ctx: IslamicTurnContext,
): IslamicClassifierOutput | null {
  return classifyTutorIslamicIntent(ctx)?.output ?? null;
}

export function islamicIntentSkipsZeroAnswer(intent: IslamicClassifierOutput): boolean {
  return (
    intent.intent === IslamicIntent.FABRICATION_RISK
    || intent.intent === IslamicIntent.Q_QURAN
    || intent.intent === IslamicIntent.Q_HADITH
    || intent.intent === IslamicIntent.Q_FIQH
    || intent.intent === IslamicIntent.Q_IMAN
    || intent.intent === IslamicIntent.Q_AKHLAQ
    || intent.intent === IslamicIntent.Q_HISTORY
    || intent.intent === IslamicIntent.Q_COMPARE
    || intent.intent === IslamicIntent.AMBIGUOUS
  );
}
