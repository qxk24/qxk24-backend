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
  paragraphIsCoachingScriptClosing,
  paragraphIsFounderTeachingVoiceLeak,
  polishStudentOutputSurface,
  rewriteDualLaneEssayLabels,
  rewriteEmojiPerformanceOpeners,
  sanitizeStudentForbiddenPronouns,
  stripPlanTesterAddress,
  stripSunomNotation,
  studentForbiddenPronounAlternation,
} from './adam-student-output-law';
import { paragraphIsThreeTierDoorOffer } from './adam-three-tier-knowledge';
import { isAdamLightChatTurn } from './adam-response-generation';
import {
  isTechnicalPrecisionQuestion,
} from './adam-universal-voice';

/** Strip billboard framework labels on tier 1 — not ADAM's narrative voice. */
const FRAMEWORK_LEAK =
  /\b(?:Dalam\s+lensa\s+Alamtologi|Dari\s+perspektif\s+Alamtologi|Alamtologi\s+menyatakan|framework\s+Alamtologi)\b/i;

function stripFrameworkBillboards(text: string, userMessage: string): string {
  if (userMessage && /\b(?:alamtologi|peringkat\s+2|sudut\s+konstitusi)\b/i.test(userMessage)) {
    return text;
  }
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed || paragraphIsThreeTierDoorOffer(trimmed)) return para;
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

/** Sync hygiene only — unified ADAM voice must not be flattened post-stream. */
export function sanitizeStudentOutputSync(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
): string {
  const { text: stashed, slots } = stashStudentMathBlocks(text);
  const lightChat = isAdamLightChatTurn(userMessage);

  let out = stashed
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    .replace(/^\[Source:[^\]]*\]\s*$/gim, '')
    .replace(/^---+$/gm, '')
    .replace(/\bmemperkuat\b/gi, 'menguatkan')
    .replace(/\bistirehat\b/gi, 'rehat');

  out = restoreStudentMathBlocks(out, slots);
  out = inlineQuranAyat(out);
  out = rewriteDualLaneEssayLabels(out);
  out = rewriteEmojiPerformanceOpeners(out);
  out = stripSunomNotation(out);
  out = stripPlanTesterAddress(out);
  out = sanitizeTechnicalPrecisionOutput(out, userMessage, recentUserMessages);
  out = sanitizeStudentForbiddenPronouns(out);
  if (!lightChat) {
    out = stripFrameworkBillboards(out, userMessage);
  }

  const paragraphs = out.split(/\n{2,}/);
  const kept: string[] = [];

  const technicalOk = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive
    || isTechnicalPrecisionQuestion(userMessage.trim());

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (paragraphIsFounderTeachingVoiceLeak(trimmed)) continue;
    if (!paragraphIsThreeTierDoorOffer(trimmed)
      && SCRIPTED_CLOSINGS.some((re) => re.test(trimmed))) continue;
    if (paragraphIsCoachingScriptClosing(trimmed)) continue;
    if (/^\[Source:/i.test(trimmed)) continue;
    if (/^Maksudnya\s*:/i.test(trimmed)) continue;
    kept.push(trimmed);
  }

  return polishStudentOutputSurface(kept.join('\n\n').trim(), technicalOk);
}

/** Post-stream hook — sync sanitize only. Layer 5 governs voice at generation. */
export async function repairStudentOutputLeak(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
): Promise<string> {
  return sanitizeStudentOutputSync(text, studentMessage, recentUserMessages);
}

/** Founder-style student default — surface leak strip only, no LLM rewrite. */
export function applyStudentSurfaceOutputRepair(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
): string {
  return sanitizeStudentOutputSync(text, studentMessage, recentUserMessages);
}

/** Min fraction of streamed chars guards must keep before replacing the live stream. */
export const STUDENT_SURFACE_MIN_RETAIN_RATIO = 0.35;

/**
 * When sync guards strip too aggressively, keep the streamed prose — do not
 * emit adam_stream_done replace or persist a gutted stub.
 */
export function resolveStudentStreamSurface(
  rawModelStream: string,
  surface: string,
): { fullResponse: string; streamReplace: string | null } {
  const raw = rawModelStream.trim();
  const surf = surface.trim();
  if (!surf || surf === raw) {
    return { fullResponse: raw, streamReplace: null };
  }
  const rawLen = raw.length;
  if (rawLen > 280 && surf.length / rawLen < STUDENT_SURFACE_MIN_RETAIN_RATIO) {
    return { fullResponse: raw, streamReplace: null };
  }
  return { fullResponse: surf, streamReplace: surf };
}
