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
  paragraphIsDashSummaryLeak,
  paragraphIsNumberedSyllabusLeak,
  paragraphIsOrdinalSyllabusLeak,
  paragraphShouldStripForUniversalVoice,
  sanitizeStudentForbiddenPronouns,
  studentForbiddenPronounAlternation,
} from './adam-student-output-law';
import { paragraphIsThreeTierDoorOffer } from './adam-three-tier-knowledge';
import {
  isTechnicalPrecisionQuestion,
  userAskedForAlamtologi,
  userOpenedFaithDoor,
} from './adam-universal-voice';

/** Collapse textbook numbered lists / dash summaries on explanatory turns (not spec sheets). */
export function repairStudentTextbookFormat(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  if (resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive) return text;
  if (isTechnicalPrecisionQuestion(userMessage.trim())) return text;

  let out = text;
  const numberedCount = (out.match(/^\s*\d+[.)]\s+/gm) ?? []).length;
  if (numberedCount >= 2) {
    out = out.replace(/^\s*\d+[.)]\s+/gm, '\n\n');
  }

  if (/(?:^|\n)\s*(?:Pertama|Kedua|Ketiga|Keempat),/im.test(out)) {
    out = out.replace(/^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),?\s*/gim, '\n\n');
  }

  out = out.replace(
    /\nSecara ringkas:\s*\n((?:\s*[-•*]\s+.+\n?)+)/gi,
    (_match, bullets: string) => {
      const items = bullets
        .split('\n')
        .map((l: string) => l.replace(/^\s*[-•*]\s+/, '').trim())
        .filter(Boolean);
      return items.length ? `\n\n${items.join(' ')}` : '';
    },
  );

  const lines = out.split('\n');
  const bulletLineCount = lines.filter((l) => /^\s*[-•*]\s+/.test(l)).length;
  if (bulletLineCount >= 2 && !/\|/.test(out)) {
    out = lines
      .map((line) => {
        const m = line.match(/^\s*[-•*]\s+(.+)$/);
        return m ? m[1].trim() : line;
      })
      .join('\n');
  }

  const lead = out.trim();
  if (/^[\p{L}][\p{L}\s]{0,40} adalah keadaan\b/iu.test(lead)) {
    out = `Mari kita lihat soalan ini dengan jelas.\n\n${out}`;
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

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

  const paragraphs = out.split(/\n{2,}/);
  out = paragraphs
    .filter((para) => {
      const trimmed = para.trim();
      if (!trimmed) return false;
      if (!faithOk && (QURAN_LEAK.test(trimmed) || BISMILLAH_ONLY_PARAGRAPH.test(trimmed))) {
        return false;
      }
      if (
        paragraphShouldStripForUniversalVoice(trimmed, { faithOk, alamtologiOk })
      ) {
        return false;
      }
      return true;
    })
    .join('\n\n');

  if (!alamtologiOk) {
    out = out
      .split(/\n{2,}/)
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed || paragraphIsThreeTierDoorOffer(trimmed)) return para;
        let p = para.replace(FRAMEWORK_LEAK, '');
        p = p.replace(/\bAlamtologi\b/gi, (match, offset, whole) => {
          const before = whole.slice(Math.max(0, offset - 40), offset);
          if (/what\s+is\s+$/i.test(before)) return match;
          return '';
        });
        return p;
      })
      .join('\n\n');
  }

  if (!faithOk) {
    out = out.replace(/\bBismillah(?:irahmanirrahim)?\.?/gi, '');
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
  /Saya\s+di\s+sini\.?\s*Bukan\s+untuk\s+mempercepat/i,
  /duduk\s+bersama.*kegelapan/i,
  /bukan\s+untuk\s+mempercepat\s+jawapan/i,
  /Apa\s+yang\s+paling\s+ingin\s+dikongsikan/i,
  /paling\s+ingin\s+(?:anda\s+)?dikongsikan/i,
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
  out = repairStudentTextbookFormat(out, userMessage, recentUserMessages);
  out = sanitizeTechnicalPrecisionOutput(out, userMessage, recentUserMessages);
  out = sanitizeStudentForbiddenPronouns(out);
  out = stripUniversalVoiceLeaks(out, userMessage);

  const paragraphs = out.split(/\n{2,}/);
  const kept: string[] = [];

  const faithOk = userOpenedFaithDoor(userMessage);
  const alamtologiOk = userAskedForAlamtologi(userMessage);
  const technicalOk = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive
    || isTechnicalPrecisionQuestion(userMessage.trim());

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (!paragraphIsThreeTierDoorOffer(trimmed)
      && SCRIPTED_CLOSINGS.some((re) => re.test(trimmed))) continue;
    if (paragraphIsCoachingScriptClosing(trimmed)) continue;
    if (!technicalOk && (
      paragraphIsNumberedSyllabusLeak(trimmed)
      || paragraphIsOrdinalSyllabusLeak(trimmed)
      || paragraphIsDashSummaryLeak(trimmed)
    )) {
      continue;
    }
    if (paragraphShouldStripForUniversalVoice(trimmed, { faithOk, alamtologiOk })) continue;
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
  return sanitizeStudentOutputSync(text, studentMessage, recentUserMessages);
}
