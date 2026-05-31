/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Chat Response Parser
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { CONSULT_PHRASE } from './adam-system-prompts';
import type {
  AlamtologiPrinciple,
  ConstitutionalJudgment,
  ContributionValue,
  HukumZResult,
  JournalCategory,
  JournalContent,
  TahapAkal,
} from './adam.types';
import { normalizeJournalContent, normalizePrinciplesFocus } from './adam-principle-normalize';

export interface AdamJournalSeal {
  title:              string;
  abstract:           string;
  category?:          JournalCategory;
  principlesFocus?:   AlamtologiPrinciple[];
  authorName?:        string;
  content:            JournalContent;
  hukumZAnalysis?:    HukumZResult;
  tahapAkalAchieved?: TahapAkal;
  cVLevel?:           ContributionValue;
  judgment?:          ConstitutionalJudgment;
  reviewNotes?:       string;
}

export interface FounderBroadcast {
  message: string;
  target:  string;
}

export interface StudentToFounderRelay {
  message: string;
}

export function parseConsultBlock(fullResponse: string): {
  reason:        string;
  cleanResponse: string;
  needsConsult:  boolean;
} {
  let reason = '';
  const consultMatch = fullResponse.match(/<adam_consult>(.*?)<\/adam_consult>/s);
  if (consultMatch) {
    try {
      const parsed = JSON.parse(consultMatch[1]);
      reason = parsed.reason ?? '';
    } catch {
      reason = 'Student question requires Founder guidance.';
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_consult>.*?<\/adam_consult>/s, '')
    .trim();

  const needsConsult =
    Boolean(reason) ||
    cleanResponse.includes(CONSULT_PHRASE) ||
    fullResponse.includes(CONSULT_PHRASE);

  return { reason, cleanResponse, needsConsult };
}

export function parseBroadcastBlocks(fullResponse: string): {
  broadcasts:    FounderBroadcast[];
  cleanResponse: string;
} {
  const broadcasts: FounderBroadcast[] = [];
  const regex = /<adam_broadcast>([\s\S]*?)<\/adam_broadcast>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fullResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: string; target?: string };
      const text = parsed.message?.trim();
      if (!text) continue;
      broadcasts.push({
        message: text,
        target:  (parsed.target?.trim().toLowerCase() || 'all'),
      });
    } catch {
      // skip malformed block
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_broadcast>[\s\S]*?<\/adam_broadcast>/g, '')
    .trim();

  return { broadcasts, cleanResponse };
}

export function parseToFounderBlocks(fullResponse: string): {
  relays:        StudentToFounderRelay[];
  cleanResponse: string;
} {
  const relays: StudentToFounderRelay[] = [];
  const regex = /<adam_to_founder>([\s\S]*?)<\/adam_to_founder>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fullResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: string };
      const text = parsed.message?.trim();
      if (text) relays.push({ message: text });
    } catch {
      // skip malformed block
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_to_founder>[\s\S]*?<\/adam_to_founder>/g, '')
    .trim();

  return { relays, cleanResponse };
}

export function founderWantsJournalSeal(message: string): boolean {
  const sealIntent = /\b(seal|simpan|save|submit|semak|review|hantar|kirim|laksanakan|disimpan|kunci draf|kelulusan|publish queue)\b/i.test(
    message,
  );
  const journalRef = /\b(jurnal|journal|manuscript|manuskrip|draf|mak-xz|kesejahteraan)\b/i.test(
    message,
  );
  const reviewPath = /\/adam\/lab\/journals\/review|\/journals\/review/i.test(message);
  return (sealIntent && journalRef) || reviewPath;
}

/** ADAM sometimes claims a save in prose without emitting <adam_journal_seal>. */
export function adamClaimsJournalSaved(adamText: string): boolean {
  if (adamDeclinesJournalSeal(adamText)) return false;
  return /sudah berjaya disimpan|saved to \/journals\/review|saved to \/adam\/lab\/journals\/review|folder semakan|sedia untuk p\.alt|JNL-\d{4}|jurnal telah dihantar|telah dihantar untuk review|dihantar ke[^.\n]*journals\/review|melaksanakan proses seal|proses seal sekarang|saya simpan jurnal|simpan jurnal penuh|menyimpan jurnal|jurnal penuh ini untuk review|untuk review p\.alt|sudah siap.*(?:review|semak)|await(?:s|ing) (?:your|p\.alt'?s?) approval/i.test(
    adamText,
  );
}

export function shouldAttemptFounderJournalSeal(
  userMessage: string,
  adamText: string,
): boolean {
  return founderWantsJournalSeal(userMessage) || adamClaimsJournalSaved(adamText);
}

/** ADAM explains it cannot seal — never run prose fallback. */
export function adamDeclinesJournalSeal(adamText: string): boolean {
  return /tidak dapat|tidak boleh|cannot seal|can't seal|tiada teks manuskrip|tiada manuskrip penuh|tiada manuskrip|tidak hadir|tidak tersedia|tidak pernah dibuka|tag tersebut tidak|tidak wujud|tidak membenarkan|reka.?reka|halusinasi|menyegel "kosong"|menyegel 'kosong'|seal yang tidak wujud|tiada blok json|tiada sebarang blok|memohon maaf/i.test(
    adamText,
  );
}

const IMRAD_MARKERS = [
  'introduction', 'background', 'methodology', 'findings', 'discussion', 'conclusion',
  'pengenalan', 'latar belakang', 'kaedah', 'dapatan', 'perbincangan', 'kesimpulan', 'rujukan',
];

/** Prose looks like a real manuscript, not a meta-refusal chat. */
export function hasSubstantiveManuscriptProse(text: string): boolean {
  const lower = text.toLowerCase();
  const hits = IMRAD_MARKERS.filter((k) => lower.includes(k)).length;
  if (hits >= 2) return true;
  if (text.length >= 4500 && hits >= 1) return true;
  return false;
}

export function isPlaceholderJournalTitle(title: string): boolean {
  const t = title.trim().toLowerCase().replace(/\.$/, '');
  if (t.length < 12) return true;
  if (/^bismillah/i.test(t)) return true;
  if (/^p\.alt,|^saya memohon maaf/i.test(t)) return true;
  return false;
}

export function validateAdamJournalSeal(seal: AdamJournalSeal): string | null {
  if (isPlaceholderJournalTitle(seal.title)) {
    return 'Journal title is not valid (placeholder or missing).';
  }
  if (seal.abstract.trim().length < 80) {
    return 'Journal abstract too short to seal.';
  }
  const intro = seal.content.introduction?.trim() ?? '';
  if (intro.length < 120) {
    return 'Journal introduction too short — manuscript not complete.';
  }
  if (adamDeclinesJournalSeal(intro)) {
    return 'Journal content looks like a refusal, not a manuscript.';
  }
  return null;
}

export function founderWantsJournalDraft(message: string): boolean {
  return /\b(tulis draf|write draft|draf penuh|full draft|imrad draft|tulis jurnal penuh|write full journal|write the full)\b/i.test(
    message,
  ) && /\b(jurnal|journal|imrad|manuskrip|manuscript)\b/i.test(message);
}

export function founderWantsStudentRelay(message: string): boolean {
  return /\b(tell them|tell the students|convey|sampaikan|send to|hantar kepada|all students|semua pelajar|to the group|kepada pelajar|pass to)\b/i.test(
    message,
  );
}

export function studentWantsFounderRelay(message: string): boolean {
  return /\b(founder|pengasas|masa\s*bayu|convey|sampaikan|pass\s+to|tell\s+the\s+founder|tanya\s+(?:ke\s+)?pengasas|hantar\s+(?:ke\s+)?pengasas)\b/i.test(
    message,
  );
}

/** True when a journal turn stopped before a complete seal or mid-manuscript. */
export function journalTurnNeedsContinuation(
  fullResponse: string,
  userMessage: string,
): boolean {
  const text = fullResponse.trim();
  if (!text) return false;
  if (adamDeclinesJournalSeal(text)) return false;

  const openSeal = text.includes('<adam_journal_seal>');
  const closedSeal = /<\/adam_journal_seal>/.test(text);
  if (openSeal && !closedSeal) return true;

  const writingLongForm =
    /\b(jurnal|journal|manuscript|artikel|article|draf|draft|tulis|write|lengkap|complete|imrad|seal|simpan|semak)\b/i.test(
      userMessage,
    ) || founderWantsJournalDraft(userMessage);
  if (!writingLongForm) return false;

  if (founderWantsJournalSeal(userMessage) && !openSeal && text.length > 1800) {
    return true;
  }

  const endsMidFlow = !/[.!?…”"'\)]\s*$/.test(text) && text.length > 2200;
  return endsMidFlow;
}

export function parseJournalSealBlocks(fullResponse: string): {
  seals:         AdamJournalSeal[];
  cleanResponse: string;
} {
  const seals: AdamJournalSeal[] = [];
  const regex = /<adam_journal_seal>([\s\S]*?)<\/adam_journal_seal>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fullResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as Partial<AdamJournalSeal>;
      const title = parsed.title?.trim();
      const abstract = parsed.abstract?.trim();
      const content = parsed.content;
      if (!title || !abstract || !content?.introduction) continue;
      const candidate: AdamJournalSeal = {
        title,
        abstract,
        category:          parsed.category ?? 'RESEARCH',
        principlesFocus:   parsed.principlesFocus?.length
          ? normalizePrinciplesFocus(parsed.principlesFocus)
          : ['CAHAYA'],
        authorName:        parsed.authorName?.trim() || 'Masa Bayu',
        content:           normalizeJournalContent(content),
        hukumZAnalysis:    parsed.hukumZAnalysis,
        tahapAkalAchieved: parsed.tahapAkalAchieved,
        cVLevel:           parsed.cVLevel,
        judgment:          parsed.judgment,
        reviewNotes:       parsed.reviewNotes,
      };
      if (validateAdamJournalSeal(candidate)) continue;
      seals.push(candidate);
    } catch {
      // skip malformed seal
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_journal_seal>[\s\S]*?<\/adam_journal_seal>/g, '')
    .trim();

  return { seals, cleanResponse };
}

export function parseJudgmentBlock(fullResponse: string): {
  judgment: ConstitutionalJudgment;
  tahapAkal: TahapAkal;
  healthScore: number;
  principleApplied: AlamtologiPrinciple;
  cleanResponse: string;
} {
  let judgment: ConstitutionalJudgment = 'ISLAH';
  let tahapAkal: TahapAkal = 3;
  let healthScore = 75;
  let principleApplied: AlamtologiPrinciple = 'CAHAYA';

  const judgmentMatch = fullResponse.match(
    /<adam_judgment>(.*?)<\/adam_judgment>/s,
  );

  if (judgmentMatch) {
    try {
      const parsed = JSON.parse(judgmentMatch[1]);
      judgment = parsed.judgment ?? 'ISLAH';
      tahapAkal = parsed.tahapAkal ?? 3;
      healthScore = parsed.healthScore ?? 75;
      principleApplied = parsed.principle ?? 'CAHAYA';
    } catch {
      judgment = 'ISLAH';
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_judgment>.*?<\/adam_judgment>/s, '')
    .trim();

  return { judgment, tahapAkal, healthScore, principleApplied, cleanResponse };
}
