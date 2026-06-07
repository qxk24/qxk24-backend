/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Response Parser
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
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
  knowledgeTopicId?:  string;
  knowledgeMajor?:    string;
  knowledgeDiscipline?: string;
  knowledgeSubfield?: string;
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
    const parsed = parseLooseAdamJson(consultMatch[1]) as { reason?: string } | null;
    reason = parsed?.reason ?? 'Student question requires Founder guidance.';
  }

  const cleanResponse = stripAdamProtocolBlocks(fullResponse);

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
    const parsed = parseLooseAdamJson(match[1]) as { message?: string; target?: string } | null;
    if (!parsed) continue;
    const text = parsed.message?.trim();
    if (!text) continue;
    broadcasts.push({
      message: text,
      target:  (parsed.target?.trim().toLowerCase() || 'all'),
    });
  }

  const cleanResponse = stripAdamProtocolBlocks(fullResponse);

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
    const parsed = parseLooseAdamJson(match[1]) as { message?: string } | null;
    if (!parsed) continue;
    const text = parsed.message?.trim();
    if (text) relays.push({ message: text });
  }

  const cleanResponse = stripAdamProtocolBlocks(fullResponse);

  return { relays, cleanResponse };
}

export function founderWantsJournalSeal(message: string): boolean {
  if (/JOURNAL GEN — write then seal|adam_journal_seal|📚\s*Simpan jurnal untuk semak/i.test(message)) {
    return true;
  }
  const sealIntent = /\b(seal|simpan|save|submit|semak|review|hantar|kirim|laksanakan|disimpan|kunci draf|kelulusan|publish queue)\b/i.test(
    message,
  );
  const journalRef = /\b(jurnal|journal|manuscript|manuskrip|draf|imrad|mak-xz|kesejahteraan)\b/i.test(
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
  'abstract', 'references', 'application',
  'convention knowledge', 'alamtologi framework', 'unsolved issue',
  'human opening', 'honest wall', 'invitation',
  'pengenalan', 'latar belakang', 'kaedah', 'dapatan', 'perbincangan', 'kesimpulan', 'rujukan',
  'abstrak', 'aplikasi', 'pengetahuan konvensional', 'rangka kerja alamtologi',
  'menulis sekarang',
];

/** Best-effort JSON parse for LLM-emitted protocol blocks (trailing commas, fences). */
export function parseLooseAdamJson(raw: string): unknown | null {
  let cleaned = raw.trim().replace(/^\uFEFF/, '');
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(cleaned.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

/** Remove ADAM protocol XML blocks — including unclosed tags mid-stream. */
export function stripAdamProtocolBlocks(text: string): string {
  let out = text
    .replace(/<adam_journal_seal>[\s\S]*?<\/adam_journal_seal>/gi, '')
    .replace(/<adam_judgment>[\s\S]*?<\/adam_judgment>/gi, '')
    .replace(/<adam_consult>[\s\S]*?<\/adam_consult>/gi, '')
    .replace(/<adam_broadcast>[\s\S]*?<\/adam_broadcast>/gi, '')
    .replace(/<adam_to_founder>[\s\S]*?<\/adam_to_founder>/gi, '');
  out = out
    .replace(/<adam_journal_seal>[\s\S]*$/i, '')
    .replace(/<adam_judgment>[\s\S]*$/i, '')
    .replace(/<adam_consult>[\s\S]*$/i, '')
    .replace(/<adam_broadcast>[\s\S]*$/i, '')
    .replace(/<adam_to_founder>[\s\S]*$/i, '');
  return out.trim();
}

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

import { JOURNAL_MIN_MANUSCRIPT_CHARS, meetsJournalLengthMinimum } from './adam-journal.constants';

export { JOURNAL_MIN_MANUSCRIPT_CHARS, JOURNAL_MIN_PAGES, JOURNAL_MIN_REFERENCES, JOURNAL_TARGET_WORD_MIN, JOURNAL_TARGET_WORD_MAX, countJournalWords, meetsJournalLengthMinimum } from './adam-journal.constants';

/** P.alt ordered ADAM to stop writing — do not continue or restart journal passes. */
export function founderWantsJournalStop(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return /\bberhenti\s+sekarang\b/i.test(t)
    || /\bjangan\s+sambung\s+menulis\b/i.test(t)
    || /\bjangan\s+tambah\s+perkataan\b/i.test(t)
    || /\bstop\s+writing\b/i.test(t)
    || /\bstop\s+now\b/i.test(t)
    || /\bhentikan\b/i.test(t);
}

/** P.alt asked ADAM to write a journal (one-shot — system auto-saves when long enough). */
export function founderWantsJournalWrite(message: string): boolean {
  const t = message.trim();
  if (/^\s*tulis\s+jurnal\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (/\btulis\s+jurnal\b/i.test(t)) return true;
  if (/^\s*write\s+(?:the\s+)?journal\s*[!?.…,]*\s*$/i.test(t)) return true;
  if (founderWantsJournalDraft(message)) return true;
  if (/tulis\s+jurnal|write\s+(?:a\s+)?journal|buatkan\s+jurnal|cipta\s+jurnal/i.test(message)) {
    return true;
  }
  return /\b(jurnal|journal)\b/i.test(message)
    && /\b(tulis|write|cipta|buat|hasilkan)\b/i.test(message);
}

export function founderWantsJournalDraft(message: string): boolean {
  if (
    /jangan\s+seal\s+dulu|tulis\s+jurnal\s+akademik\s+penuh|minimum\s+7\s+muka\s+surat|7\+\s*muka\s+surat|sistem\s+simpan\s+automatik/i.test(
      message,
    )
  ) {
    return true;
  }
  const hasJournalRef = /\b(jurnal|journal|imrad|manuskrip|manuscript|artikel)\b/i.test(message);
  const hasWriteIntent = /\b(tulis|write|draf|draft|penuh|full|lengkap|siapkan)\b/i.test(message);
  if (hasJournalRef && hasWriteIntent) return true;
  return /\b(tulis draf|write draft|draf penuh|full draft|imrad draft|tulis jurnal penuh|write full journal|write the full)\b/i.test(
    message,
  );
}

/** ADAM promised a draft but did not output IMRaD sections (common failure mode). */
export function adamMetaOnlyJournalReply(text: string): boolean {
  if (hasSubstantiveManuscriptProse(text)) return false;
  return /akan\s+tulis|saya\s+akan|saya\s+mulakan|mulakan\s+sekarang|adakah\s+p\.?\s*alt\s+mahukan|versi\s+pdf|versi\s+word|versi\s+web|dalam\s+masa\s+kurang|kurang\s+dari\s+dua\s+minit|sedia\s+melaksanakan|i\s+will\s+(?:write|start)|starting\s+now|less\s+than\s+two\s+minutes/i.test(
    text,
  );
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

  const wantsJournal =
    founderWantsJournalDraft(userMessage) || founderWantsJournalWrite(userMessage);

  if (wantsJournal && !meetsJournalLengthMinimum(text) && text.length > 800) {
    return true;
  }

  if (wantsJournal && adamMetaOnlyJournalReply(text)) {
    return true;
  }

  if (wantsJournal && !hasSubstantiveManuscriptProse(text) && text.length > 400) {
    return true;
  }

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
    const parsed = parseLooseAdamJson(match[1]) as Partial<AdamJournalSeal> | null;
    if (!parsed) {
      console.warn('[Journal] seal JSON parse failed — skipping block');
      continue;
    }
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
      knowledgeTopicId:  parsed.knowledgeTopicId?.trim(),
      knowledgeMajor:    parsed.knowledgeMajor?.trim(),
      knowledgeDiscipline: parsed.knowledgeDiscipline?.trim(),
      knowledgeSubfield: parsed.knowledgeSubfield?.trim(),
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
  }

  const cleanResponse = stripAdamProtocolBlocks(fullResponse);

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
    const parsed = parseLooseAdamJson(judgmentMatch[1]) as {
      judgment?: ConstitutionalJudgment;
      tahapAkal?: TahapAkal;
      healthScore?: number;
      principle?: AlamtologiPrinciple;
    } | null;
    if (parsed) {
      judgment = parsed.judgment ?? 'ISLAH';
      tahapAkal = parsed.tahapAkal ?? 3;
      healthScore = parsed.healthScore ?? 75;
      principleApplied = parsed.principle ?? 'CAHAYA';
    }
  }

  const cleanResponse = stripAdamProtocolBlocks(fullResponse);

  return { judgment, tahapAkal, healthScore, principleApplied, cleanResponse };
}
