/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * Updated     : 2026-06-09 — constitutional/faith/performance leak strip
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Light post-stream sync — format hygiene only. No LLM rewrite.
 * Voice and form come from Layer 5 prompts at generation time.
 */

import { resolveTechnicalPrecisionTurn, sanitizeTechnicalPrecisionOutput } from './adam-factual-grounding';
import {
  repairStaleOfficeHolderOutput,
  stripCurrentAffairsCoachingTail,
} from './adam-current-affairs';
import {
  paragraphIsCoachingScriptClosing,
  paragraphIsFounderTeachingVoiceLeak,
  paragraphIsCareerTimelineBlock,
  paragraphIsLabeledSkillLine,
  paragraphIsEmojiSkillChecklist,
  paragraphIsTier1EssayLeak,
  paragraphIsMarkdownBulletForest,
  paragraphIsNumberedSyllabusLeak,
  paragraphShouldStripForUniversalVoice,
  outputHasScannableListStructure,
  polishStudentOutputSurface,
  rewriteDualLaneEssayLabels,
  rewriteEmojiPerformanceOpeners,
  sanitizeStudentForbiddenPronouns,
  stripPlanTesterAddress,
  stripBmPracticalEssayInline,
  paragraphIsBmPracticalEssayLeak,
  stripSciencePoeticInline,
  stripLifeStressFaithInline,
  stripSunomNotation,
  stripConsumerMarkdownEmphasis,
  studentForbiddenPronounAlternation,
  paragraphIsBismillahOpenerOnly,
  stripStudentBismillahOpener,
} from './adam-student-output-law';
import { userOpenedFaithDoor } from './adam-universal-voice';
import {
  paragraphIsUniversalScholarDoorOffer,
  countRecentUniversalScholarDoors,
  userRequestedPracticalDepth,
  paragraphIsPracticalCareerDoorOffer,
  paragraphIsHealthAdaptedDoorOffer,
  paragraphIsCompareDoorOffer,
  paragraphIsLifeWellbeingAdaptedDoorOffer,
  appendUniversalScholarTier1DoorIfMissing,
  UNIVERSAL_SCHOLAR_DOOR_EN,
} from './adam-universal-scholar';
import {
  isAdamConsumerPlainTurn,
  isAdamContinuationDepthTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamSubstantiveTurn,
  isAdamCompareTurn,
  isAdamLifeWellbeingTurn,
  threadRootIsPracticalAdvisory,
} from './adam-response-generation';
import { isAdamCurrentAffairsTurn } from './adam-web-search';
import {
  isTechnicalPrecisionQuestion,
  outputLooksLikeStructuredSpec,
  userAskedForConstitutionalStructure,
  userAskedForStructuredSpecification,
} from './adam-universal-voice';

/** Strip billboard framework labels on tier 1 — inline only, never drop paragraphs. */
const FRAMEWORK_LEAK =
  /\b(?:Dalam\s+lensa\s+Alamtologi|Dari\s+perspektif\s+Alamtologi|From\s+an\s+Alamtologi\s+perspective|Alamtologi\s+menyatakan|framework\s+Alamtologi)\b/i;

function stripFrameworkBillboards(text: string, userMessage: string): string {
  if (userMessage && userAskedForConstitutionalStructure(userMessage)) {
    return text;
  }
  if (userMessage && userAskedForStructuredSpecification(userMessage)) {
    return text;
  }
  if (userMessage && /\b(?:alamtologi|peringkat\s+2|sudut\s+konstitusi)\b/i.test(userMessage)) {
    return text;
  }
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed || paragraphIsUniversalScholarDoorOffer(trimmed)) return para;
      return para.replace(FRAMEWORK_LEAK, '');
    })
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SCRIPTED_CLOSINGS: RegExp[] = [
  /Saya\s+sedia\s+mendengar/i,
  /saya\s+boleh\s+bertanya\s+dengan\s+lembut/i,
  /Saya\s+ingin\s+bertanya\s+dengan\s+lembut/i,
  /Adakah\s+ada\s+saat-saat\s+di\s+mana/i,
  /Saya\s+sedia\s+duduk/i,
  /dalam\s+diam\s+yang\s+penuh\s+makna/i,
  new RegExp(
    `Apa\\s+yang\\s+paling\\s+ingin\\s+(?:${studentForbiddenPronounAlternation(false)}|anda)\\s+`,
    'i',
  ),
  new RegExp(`Apa[kk]ah\\s+yang\\s+ingin\\s+(?:${studentForbiddenPronounAlternation(false)})\\b`, 'i'),
  /kembangkan\s+daripada\s+jawapan/i,
  /Adakah\s+anda\s+sedang\s+mempertimbangkan/i,
  /ingin\s+membandingkannya\s+dengan\s+model\s+lain/i,
  /Jika\s+anda\s+ingin\s+saya\s+(?:bantu\s+)?bandingkan/i,
  /saya\s+boleh\s+carikan/i,
  /Bolehkah\s+anda\s+nyatakan/i,
  /Saya\s+di\s+sini\.?\s*bersama\s+anda/i,
  /langkah\s+demi\s+langkah/i,
  /saya\s+sedia\s+bantu\.?\s*$/i,
  /Saya\s+di\s+sini\.?\s*Bukan\s+untuk\s+mempercepat/i,
  /duduk\s+bersama.*kegelapan/i,
  /bukan\s+untuk\s+mempercepat\s+jawapan/i,
  /Apa\s+yang\s+paling\s+ingin\s+dikongsikan/i,
  /paling\s+ingin\s+(?:anda\s+)?dikongsikan/i,
  /Saya\s+di\s+sini\s+untuk\s+membantu\s+anda\s+faham/i,
  /bukan\s+untuk\s+memutuskan\s+bagi\s+anda/i,
  /berdiri\s+teguh\s+dengan\s+ilmu/i,
  /agar\s+anda\s+berdiri\s+teguh/i,
  /Ada\s+aspek\s+mana.*ingin\s+anda\s+gali/i,
  /Atau\s+mungkin,?\s*ada\s+satu\s+kenangan/i,
  /Saya\s+di\s+sini\.?\s*duduk/i,
  /mendengar,?\s*dan\s+bersama/i,
  /Would you like me to:/i,
  /I['']?m here\.?\s*not to lecture/i,
  /walk with you,?\s*step by thoughtful step/i,
  /Just say the word/i,
  /walk there together/i,
  /Jika\s+QA\s+ingin/i,
  /saya\s+boleh\s+bantu\s+jelaskan/i,
  /hikmah\s+di\s+balik/i,
  /dengan\s+adab,?\s*kejelasan/i,
  /Jika\s+Guest\s+ingin/i,
  /saya\s+sedia\s+kongsikan,?\s*bukan\s+sebagai\s+fakta/i,
  /bukan\s+sebagai\s+fakta\s+semata/i,
  /kepimpinan\s+sebagai\s+am/i,
  /Mengapa\s+sistem\s+presidensi\s+memerlukan/i,
  /Saya\s+sedia\s+duduk\s+bersama/i,
  /Apakah\s+ada\s+satu\s+situasi\s+spesifik/i,
  /bukan\s+untuk\s+memberi\s+jawapan\s+cepat/i,
  /apa\s+yang\s+sedang\s+bergerak\s+di\s+dalam\s+hatimu/i,
];

const STUDENT_MATH_SLOT = '\x00STUDENT_MATH_';

function stashStudentMathBlocks(content: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  let out = '';
  let i = 0;
  while (i < content.length) {
    if (content.startsWith('$$', i)) {
      const close = content.indexOf('$$', i + 2);
      if (close === -1) {
        slots.push(content.slice(i));
        out += `${STUDENT_MATH_SLOT}${slots.length - 1}\x00`;
        break;
      }
      slots.push(content.slice(i, close + 2));
      out += `${STUDENT_MATH_SLOT}${slots.length - 1}\x00`;
      i = close + 2;
      continue;
    }
    if (content[i] === '$') {
      const close = content.indexOf('$', i + 1);
      if (close === -1) {
        out += content[i];
        i += 1;
        continue;
      }
      const candidate = content.slice(i, close + 1);
      if (!candidate.includes('\n')) {
        slots.push(candidate);
        out += `${STUDENT_MATH_SLOT}${slots.length - 1}\x00`;
        i = close + 1;
        continue;
      }
    }
    out += content[i];
    i += 1;
  }
  return { text: out, slots };
}

function restoreStudentMathBlocks(text: string, slots: string[]): string {
  return text.replace(
    new RegExp(`${STUDENT_MATH_SLOT}(\\d+)\x00`, 'g'),
    (_, index: string) => slots[Number(index)] ?? '',
  );
}

function inlineQuranAyat(text: string): string {
  const quote = `[""\\u201C\\u201D「''\\u2018\\u2019『]`;
  return text
    .replace(
      new RegExp(
        `Allah\\s+(?:SWT\\s+)?berfirman\\s*:\\s*\\n+\\s*${quote}([^""」''\\u201C\\u201D\\u2018\\u2019\\n]+)${quote}\\s*\\n+\\s*\\((Surah[^)]+)\\)`,
        'gi',
      ),
      'Allah SWT berfirman $1 ($2).',
    )
    .replace(
      new RegExp(
        `Allah\\s+(?:SWT\\s+)?berfirman\\s*:\\s*${quote}([^""」''\\u201C\\u201D\\u2018\\u2019\\n]+)${quote}\\s*\\n*\\((Surah[^)]+)\\)`,
        'gi',
      ),
      'Allah SWT berfirman $1 ($2).',
    );
}

/** Sync hygiene only — ADAM voice must not be gutted post-stream. */
export function sanitizeStudentOutputSync(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  const { text: stashed, slots } = stashStudentMathBlocks(text);
  const lightChat = isAdamLightChatTurn(userMessage);
  const practicalThread = threadRootIsPracticalAdvisory(recentUserMessages, userMessage);
  const preserveCareerStructure = practicalThread && (
    isAdamContinuationDepthTurn(userMessage)
    || /\b(?:career path|real-world example|skills and tools|laluan kerjaya|contoh sebenar|kemahiran dan alat|90-day|transitioning into)\b/i.test(userMessage)
  );
  const strictPlainConsumer = isAdamConsumerPlainTurn(userMessage)
    || isAdamCurrentAffairsTurn(userMessage)
    || isAdamPracticalAdvisoryTurn(userMessage)
    || practicalThread;
  const constitutionalStructureOk = userAskedForConstitutionalStructure(userMessage);
  const structuredSpecOk =
    userAskedForStructuredSpecification(userMessage)
    || outputLooksLikeStructuredSpec(stashed);
  const tier1BriefEssayStrip = !preserveCareerStructure
    && !isAdamContinuationDepthTurn(userMessage)
    && !userRequestedPracticalDepth(userMessage)
    && !isAdamLightChatTurn(userMessage)
    && (strictPlainConsumer || isAdamSubstantiveTurn(userMessage));
  const preservePracticalSkillsStructure = isAdamPracticalAdvisoryTurn(userMessage)
    && !isAdamContinuationDepthTurn(userMessage)
    && !userRequestedPracticalDepth(userMessage);

  const runUniversalVoiceStrip = !lightChat && (
    strictPlainConsumer
    || isAdamCurrentAffairsTurn(userMessage)
    || practicalThread
    || isAdamLifeWellbeingTurn(userMessage)
    || isAdamCompareTurn(userMessage)
    || /\b(?:diabetes|remission|photosynthesis|fotosintesis|type\s+[12]\s+diabetes|insulin)\b/i.test(userMessage)
  );

  const preserveStructuredMarkdown = constitutionalStructureOk || structuredSpecOk;

  let out = stripStudentBismillahOpener(stashed)
    .replace(/\bmemperkuat\b/gi, 'menguatkan')
    .replace(/\bistirehat\b/gi, 'rehat');

  if (!preserveStructuredMarkdown) {
    out = out
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      .replace(/^---+$/gm, '');
  }

  out = out
    .replace(/^\[Source:[^\]]*\]\s*$/gim, '');

  out = restoreStudentMathBlocks(out, slots);
  out = inlineQuranAyat(out);
  out = rewriteDualLaneEssayLabels(out);
  out = rewriteEmojiPerformanceOpeners(out);
  out = stripSunomNotation(out);
  out = stripPlanTesterAddress(out);
  if (
    tier1BriefEssayStrip
    && isAdamPracticalAdvisoryTurn(userMessage)
    && /\b(?:guru|sekolah|peranan|kemahiran|murid|pelajar|jawatan|kerjaya)\b/i.test(userMessage)
  ) {
    out = stripBmPracticalEssayInline(out);
  }
  if (tier1BriefEssayStrip && !practicalThread) {
    out = stripSciencePoeticInline(out);
  }
  if (tier1BriefEssayStrip && isAdamLifeWellbeingTurn(userMessage)) {
    out = stripLifeStressFaithInline(out);
  }
  out = sanitizeTechnicalPrecisionOutput(out, userMessage, recentUserMessages);
  out = repairStaleOfficeHolderOutput(out, userMessage);
  out = stripCurrentAffairsCoachingTail(out, userMessage);
  out = sanitizeStudentForbiddenPronouns(out);
  if (!lightChat) {
    out = stripFrameworkBillboards(out, userMessage);
  }

  const paragraphs = out.split(/\n{2,}/);
  const kept: string[] = [];

  const technicalOk = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive
    || isTechnicalPrecisionQuestion(userMessage.trim());

  const faithOk = practicalThread
    ? userOpenedFaithDoor(userMessage)
    : userOpenedFaithDoor(userMessage)
      || recentUserMessages.some((m) => userOpenedFaithDoor(m));

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (paragraphIsBismillahOpenerOnly(trimmed)) continue;
    if (paragraphIsFounderTeachingVoiceLeak(trimmed)) continue;
    if (tier1BriefEssayStrip && (paragraphIsTier1EssayLeak(trimmed) || paragraphIsBmPracticalEssayLeak(trimmed))) {
      continue;
    }
    if (
      (preserveCareerStructure || preservePracticalSkillsStructure)
      && (
        paragraphIsMarkdownBulletForest(trimmed)
        || paragraphIsNumberedSyllabusLeak(trimmed)
        || paragraphIsCareerTimelineBlock(trimmed)
        || paragraphIsLabeledSkillLine(trimmed)
        || paragraphIsEmojiSkillChecklist(trimmed)
        || (/^The skills you need fall into/i.test(trimmed) && trimmed.length >= 90)
        || /^\s*\d+[.)]\s+/.test(trimmed)
      )
    ) {
      kept.push(trimmed);
      continue;
    }
    if (runUniversalVoiceStrip && paragraphShouldStripForUniversalVoice(trimmed, {
      faithOk,
      alamtologiOk: userAskedForConstitutionalStructure(userMessage)
        || /\b(?:alamtologi|MASA|TENAGA|RUANG|prinsip)\b/i.test(userMessage),
    })) continue;
    if (!paragraphIsUniversalScholarDoorOffer(trimmed)
      && SCRIPTED_CLOSINGS.some((re) => re.test(trimmed))) continue;
    if (paragraphIsCoachingScriptClosing(trimmed) && !paragraphIsUniversalScholarDoorOffer(trimmed)) continue;
    if (/^\[Source:/i.test(trimmed)) continue;
    if (/^Maksudnya\s*:/i.test(trimmed)) continue;
    kept.push(trimmed);
  }

  if (
    countRecentUniversalScholarDoors(recentAssistantMessages) >= 1
    || (practicalThread && userRequestedPracticalDepth(userMessage))
  ) {
    for (let i = kept.length - 1; i >= 0; i -= 1) {
      if (paragraphIsUniversalScholarDoorOffer(kept[i] ?? '')) {
        kept.splice(i, 1);
      }
    }
  }

  const usePracticalCareerDoor = threadRootIsPracticalAdvisory(recentUserMessages, userMessage)
    && !isAdamCompareTurn(userMessage);
  if (!usePracticalCareerDoor) {
    for (let i = kept.length - 1; i >= 0; i -= 1) {
      const para = kept[i] ?? '';
      if (paragraphIsPracticalCareerDoorOffer(para)
        && !paragraphIsHealthAdaptedDoorOffer(para)
        && !paragraphIsCompareDoorOffer(para)
        && !paragraphIsLifeWellbeingAdaptedDoorOffer(para)) {
        kept.splice(i, 1);
      }
    }
  }

  let polished = polishStudentOutputSurface(
    kept.join('\n\n').trim(),
    technicalOk,
    preserveStructuredMarkdown || preservePracticalSkillsStructure,
  );
  if (!preserveStructuredMarkdown && !preservePracticalSkillsStructure) {
    polished = stripConsumerMarkdownEmphasis(polished);
  }
  if (tier1BriefEssayStrip && polished.includes('Would you like more on skills and tools')) {
    polished = polished.replace(
      /Would you like more on skills and tools, a career path[\s\S]*?\?/i,
      UNIVERSAL_SCHOLAR_DOOR_EN,
    );
  }
  if (
    tier1BriefEssayStrip
    && !userRequestedPracticalDepth(userMessage)
    && countRecentUniversalScholarDoors(recentAssistantMessages) === 0
  ) {
    polished = appendUniversalScholarTier1DoorIfMissing(
      polished,
      userMessage,
      recentAssistantMessages,
    );
  }
  return stripStudentBismillahOpener(polished);
}

/** Post-stream hook — sync sanitize only. Layer 5 governs voice at generation. */
export async function repairStudentOutputLeak(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): Promise<string> {
  return sanitizeStudentOutputSync(text, studentMessage, recentUserMessages, recentAssistantMessages);
}

/** Founder-style student default — surface leak strip only, no LLM rewrite. */
export function applyStudentSurfaceOutputRepair(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  return sanitizeStudentOutputSync(text, studentMessage, recentUserMessages, recentAssistantMessages);
}

/** Min fraction of streamed chars guards must keep before replacing the live stream. */
export const STUDENT_SURFACE_MIN_RETAIN_RATIO = 0.35;

/** Min fraction retained for tier-1 essay repairs (role ask stripped to brief + door). */
export const STUDENT_BRIEF_TIER1_MIN_RETAIN_RATIO = 0.06;

export interface ResolveStudentStreamSurfaceOptions {
  /**
   * Current-affairs repair may shorten stale model output dramatically — always persist
   * and stream-replace with the sanitized surface.
   */
  preferSanitized?: boolean;
  /** Tier-1 role/skills ask — accept brief guard repair over long streamed essay. */
  allowBriefTier1Repair?: boolean;
}

/** @deprecated Tier-1 role answers keep streamed structure — only strip poetic leaks, never force brief replace. */
export function shouldBriefTier1StreamReplace(
  _rawModelStream: string,
  _surface: string,
  _userMessage: string,
): boolean {
  return false;
}

/**
 * When sync guards strip too aggressively, keep the streamed prose — do not
 * emit adam_stream_done replace or persist a gutted stub.
 */
export function resolveStudentStreamSurface(
  rawModelStream: string,
  surface: string,
  options?: ResolveStudentStreamSurfaceOptions,
): { fullResponse: string; streamReplace: string | null } {
  const raw = stripStudentBismillahOpener(rawModelStream.trim());
  const surf = stripStudentBismillahOpener(surface.trim());
  if (!surf || surf === raw) {
    return { fullResponse: raw, streamReplace: null };
  }
  const rawLen = raw.length;
  const retainRatio = rawLen > 0 ? surf.length / rawLen : 1;

  if (options?.preferSanitized) {
    // Current-affairs repair may shorten stale essays — but never swap for a near-empty stub.
    if (rawLen > 280 && retainRatio < 0.15) {
      return { fullResponse: raw, streamReplace: null };
    }
    return { fullResponse: surf, streamReplace: surf };
  }
  if (options?.allowBriefTier1Repair) {
    if (rawLen > 280 && surf.length >= 100 && retainRatio >= STUDENT_BRIEF_TIER1_MIN_RETAIN_RATIO) {
      return { fullResponse: surf, streamReplace: surf };
    }
  }
  if (rawLen > 280 && retainRatio < STUDENT_SURFACE_MIN_RETAIN_RATIO) {
    return { fullResponse: raw, streamReplace: null };
  }
  // Never swap a structured stream for a flattened prose repair.
  if (outputHasScannableListStructure(raw) && !outputHasScannableListStructure(surf)) {
    return { fullResponse: raw, streamReplace: null };
  }
  return { fullResponse: surf, streamReplace: surf };
}
