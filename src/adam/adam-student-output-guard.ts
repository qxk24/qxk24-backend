/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * Updated     : 2026-06-09 — Fasa 4 pronoun sync from L1
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

import { sanitizeTechnicalPrecisionOutput } from './adam-factual-grounding';
import {
  sanitizeStudentForbiddenPronouns,
  studentForbiddenPronounAlternation,
} from './adam-student-output-law';
import {
  userAskedForAlamtologi,
  userOpenedFaithDoor,
} from './adam-universal-voice';

const FRAMEWORK_LEAK =
  /\b(?:Dalam\s+lensa\s+Alamtologi|Dari\s+perspektif\s+Alamtologi|Alamtologi\s+menyatakan|framework\s+Alamtologi)\b/i;

const BISMILLAH_OPENER = /^\s*Bismillah(?:irahmanirrahim)?\.?\s*\n?/i;

const BISMILLAH_ONLY_PARAGRAPH = /^\s*Bismillah(?:irahmanirrahim)?\.?\s*$/i;

const QURAN_LEAK =
  /\b(?:Allah\s+(?:SWT\s+)?berfirman|Surah\s+[A-Za-z'-]+(?:\s+\d+:\d+)?|\(Surah[^)]+\))\b/i;

function stripUniversalVoiceLeaks(text: string, userMessage: string): string {
  const faithOk = userOpenedFaithDoor(userMessage);
  const alamtologiOk = userAskedForAlamtologi(userMessage);

  let out = text.replace(BISMILLAH_OPENER, '');

  if (!faithOk) {
    const paragraphs = out.split(/\n{2,}/);
    out = paragraphs
      .filter((para) => !QURAN_LEAK.test(para) && !BISMILLAH_ONLY_PARAGRAPH.test(para.trim()))
      .join('\n\n');
  }

  if (!alamtologiOk) {
    out = out.replace(FRAMEWORK_LEAK, '');
    out = out.replace(/\bAlamtologi\b/gi, (match, offset, whole) => {
      const before = whole.slice(Math.max(0, offset - 40), offset);
      if (/what\s+is\s+$/i.test(before)) return match;
      return '';
    });
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
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

/** Sync format hygiene — no LLM, no TRAA surgery. */
export function sanitizeStudentOutputSync(
  text: string,
  userMessage = '',
  recentUserMessages: string[] = [],
): string {
  const { text: stashed, slots } = stashStudentMathBlocks(text);

  let out = stashed
    .replace(/\s—\s/g, '. ')
    .replace(/—/g, ', ')
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    .replace(/^\[Source:[^\]]*\]\s*$/gim, '')
    .replace(/^---+$/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\bmemperkuat\b/gi, 'menguatkan')
    .replace(/\bistirehat\b/gi, 'rehat')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');

  out = restoreStudentMathBlocks(out, slots);
  out = inlineQuranAyat(out);
  out = sanitizeTechnicalPrecisionOutput(out, userMessage, recentUserMessages);
  out = sanitizeStudentForbiddenPronouns(out);
  out = stripUniversalVoiceLeaks(out, userMessage);

  const paragraphs = out.split(/\n{2,}/);
  const kept: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (SCRIPTED_CLOSINGS.some((re) => re.test(trimmed))) continue;
    if (/^\[Source:/i.test(trimmed)) continue;
    if (/^Maksudnya\s*:/i.test(trimmed)) continue;
    kept.push(trimmed);
  }

  return kept.join('\n\n').trim();
}

/** Post-stream hook — sync sanitize only. Layer 5 governs voice at generation. */
export async function repairStudentOutputLeak(
  text: string,
  studentMessage: string,
  recentUserMessages: string[] = [],
): Promise<string> {
  const synced = sanitizeStudentOutputSync(text, studentMessage, recentUserMessages);
  return synced.length > 0 ? synced : text.trim();
}
