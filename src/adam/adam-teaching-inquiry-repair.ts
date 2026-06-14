/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Inquiry Close Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Phase A (absorption) must close with a detectable inquiry block so
 * the Teaching State Machine can auto-advance to Phase C after P.alt
 * answers situasi nyata. Sync-only — no LLM rewrite.
 */

import { adamTeachingMessageHasInquirySection } from './adam-teaching-state-machine';

const INQUIRY_HEADER = '**[TEACHING INQUIRY — SITUASI NYATA]**';

function splitSentences(text: string): string[] {
  const protectedText = text.replace(/\bP\.alt\b/gi, 'P_ALT_TOKEN');
  const raw = protectedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean)
    ?? [protectedText];
  return raw.map((s) => s.replace(/P_ALT_TOKEN/g, 'P.alt'));
}

/** Topic hint from founder turn — no per-subject hardcode. */
export function extractTeachingTopicHint(
  founderMessage: string,
  teachingContext: string,
): string {
  const bab = founderMessage.match(/\bBab\s+[^.:;\n]{3,80}/i)?.[0]?.trim();
  if (bab) return bab;

  const first = founderMessage.trim().split(/[.!?]/)[0]?.trim();
  if (first && first.length >= 12 && first.length <= 120) return first;

  const ctxLine = teachingContext
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length >= 12 && !/^═/.test(l));
  if (ctxLine) return ctxLine.slice(0, 100);

  return 'bab yang P.alt ajar pada giliran ini';
}

export function buildDefaultTeachingInquiryClose(topicHint: string): string {
  return [
    INQUIRY_HEADER,
    '',
    `P.alt, berkenaan ${topicHint} — saya perlu contoh di lapangan yang P.alt mahu saya pegang:`,
    '',
    '1. Situasi nyata manakah (tempat, orang, atau fenomena) yang P.alt mahu jadi sauh contoh?',
    '2. Data semasa apa — statistik, pemerhatian, atau laporan — yang P.alt mahu saya kaitkan dengan bab ini?',
    '3. Di mana ilmu konvensional masih terbuka atau belum muktamad menurut P.alt, supaya saya boleh hayati dengan betul sebelum sintesis?',
  ].join('\n');
}

function trailingQuestionParagraphStart(paragraphs: string[]): number {
  if (paragraphs.length === 0) return -1;
  let start = paragraphs.length;
  while (start > 0 && paragraphs[start - 1].includes('?')) {
    start--;
  }
  return start < paragraphs.length ? start : -1;
}

function splitTrailingQuestionsFromParagraph(
  para: string,
): { body: string; questions: string } | null {
  const sentences = splitSentences(para);
  const questionTail: string[] = [];
  let i = sentences.length - 1;
  while (i >= 0 && sentences[i].includes('?')) {
    questionTail.unshift(sentences[i]);
    i--;
  }
  if (questionTail.length === 0) return null;

  const body = sentences.slice(0, i + 1).join(' ').trim();
  if (body.length < 80) return null;

  return { body, questions: questionTail.join(' ') };
}

/**
 * Ensure Phase A output carries a state-machine-detectable inquiry close.
 * Idempotent when marker already present.
 */
export function ensureFounderTeachingInquiryClose(
  text: string,
  founderMessage: string,
  teachingContext: string,
): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (adamTeachingMessageHasInquirySection(trimmed)) return trimmed;

  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const trailStart = trailingQuestionParagraphStart(paragraphs);

  if (trailStart >= 0 && trailStart < paragraphs.length) {
    const before = paragraphs.slice(0, trailStart).join('\n\n');
    const inquiryBody = paragraphs.slice(trailStart).join('\n\n');
    return [before, INQUIRY_HEADER, inquiryBody].filter(Boolean).join('\n\n').trim();
  }

  const lastPara = paragraphs[paragraphs.length - 1] ?? '';
  const split = splitTrailingQuestionsFromParagraph(lastPara);
  if (split) {
    const before = [...paragraphs.slice(0, -1), split.body].filter(Boolean).join('\n\n');
    return [before, INQUIRY_HEADER, split.questions].filter(Boolean).join('\n\n').trim();
  }

  const topicHint = extractTeachingTopicHint(founderMessage, teachingContext);
  return `${trimmed}\n\n${buildDefaultTeachingInquiryClose(topicHint)}`.trim();
}
