/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Factual Correction (universal)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Generic student challenge to a prior factual list or definition —
 * not brand/model entity correction (see adam-factual-grounding).
 */

import { isAdamLightChatTurn, stripLeadingAdamSalutation } from './adam-response-generation';
import { FALSE_SEARCH_VERIFIED_CLAIM, isUserEntityCorrectionMessage } from './adam-factual-grounding';

export interface StudentFactualCorrectionTurnContext {
  isActive: boolean;
  /** Phrase the student affirmed as correct (when extractable). */
  affirmedHint?: string;
  /** Ordinal slot challenged, e.g. "kelima", "ke-5". */
  ordinalHint?: string;
}

const FACTUAL_CHALLENGE_CUE =
  /\b(?:bukankah|bukannya|bukanlah|bukan\s+ke|bukan\s+kah|apa\s+yang\s+saya\s+faham|yang\s+saya\s+faham|saya\s+faham\s+yang|setahu\s+saya|patutnya|sepatutnya|bukan\s+ke\s+itu|bukan\s+itu\s+ke|saya\s+rasa\s+bukan|awak\s+(?:salah|silap)|anda\s+(?:salah|silap)|cikgu\s+salah|teacher\s+(?:got\s+it\s+wrong|is\s+wrong))\b/i;

const ORDINAL_SLOT_CUE =
  /\b(?:yang\s+)?(?:ke[-\s]?)?(?:pertama|kedua|ketiga|keempat|kelima|keenam|ketujuh|lapan|sembilan|sepuluh|satu|dua|tiga|empat|lima|enam|tujuh|\d+)\b/i;

const LIST_CONTEXT_CUE =
  /\b(?:prinsip|rukun|komponen|unsur|elemen|senarai|langkah|perkara|faktor|jenis|kategori)\b/i;

const PRIOR_LIST_REPLY =
  /(?:^|\n)\s*(?:\d+[\.\)]\s*|\*\*\d+\*\*|#{1,3}\s*\d+\.?)/m;

function body(message: string): string {
  return stripLeadingAdamSalutation(message).trim();
}

function extractAffirmedHint(message: string): string | undefined {
  const t = message.replace(/\s+/g, ' ').trim();
  const rukun = extractRukunNegaraAffirmedHint(t);
  if (rukun) return rukun;
  let m = t.match(/\bbukankah\s+(.+?)\s*\??$/i);
  if (m?.[1]) return m[1].replace(/[?.!,]+$/g, '').trim();
  m = t.match(/\b(?:patutnya|sepatutnya)\s+(.+?)\s*\??$/i);
  if (m?.[1]) return m[1].replace(/[?.!,]+$/g, '').trim();
  m = t.match(/\b(?:ialah|adalah)\s+(.+?)\s*\??$/i);
  if (m?.[1]) return m[1].replace(/[?.!,]+$/g, '').trim();
  m = t.match(/\bbukan\s+ke\s+(.+?)\s*\??$/i);
  if (m?.[1]) return m[1].replace(/[?.!,]+$/g, '').trim();
  return undefined;
}

function extractOrdinalHint(message: string): string | undefined {
  const m = message.match(
    /\b(?:yang\s+)?(ke[-\s]?(?:pertama|kedua|ketiga|keempat|kelima|keenam|ketujuh|\d+)|(?:pertama|kedua|ketiga|keempat|kelima|keenam|ketujuh))\b/i,
  );
  return m?.[1]?.trim();
}

function threadHadFactualList(recentAssistantMessages: string[]): boolean {
  const sample = recentAssistantMessages.slice(-2).join('\n');
  if (!sample.trim()) return false;
  return PRIOR_LIST_REPLY.test(sample)
    || (LIST_CONTEXT_CUE.test(sample) && /\b(?:pertama|kedua|ketiga|keempat|kelima|1\.|2\.|3\.)/i.test(sample));
}

/**
 * Student challenges a prior factual enumeration or definition — generic, no topic lists.
 */
export function isStudentFactualChallengeMessage(
  message: string,
  recentAssistantMessages: string[] = [],
): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isUserEntityCorrectionMessage(t)) return false;
  if (t.length > 800) return false;

  const hasChallengeCue = FACTUAL_CHALLENGE_CUE.test(t);
  const hasOrdinal = ORDINAL_SLOT_CUE.test(t);
  const hasListWord = LIST_CONTEXT_CUE.test(t);
  const hadList = threadHadFactualList(recentAssistantMessages);

  if (hasChallengeCue && (hasOrdinal || hasListWord || hadList)) return true;
  if (/\bbukankah\b/i.test(t) && t.length < 200) return true;
  if (/\bapa\s+yang\s+saya\s+faham\b/i.test(t) && (hasOrdinal || hadList)) return true;
  if (/\b(?:salah|silap|tidak\s+tepat)\b/i.test(t) && hadList && t.length < 200) return true;
  if (/\b(?:bukannya|bukanlah|setahu\s+saya)\b/i.test(t) && (hasListWord || hadList)) return true;

  return false;
}

export function resolveStudentFactualCorrectionTurn(
  currentMessage: string,
  recentAssistantMessages: string[] = [],
): StudentFactualCorrectionTurnContext {
  const current = body(currentMessage);
  if (!isStudentFactualChallengeMessage(current, recentAssistantMessages)) {
    return { isActive: false };
  }
  return {
    isActive: true,
    affirmedHint: extractAffirmedHint(current),
    ordinalHint: extractOrdinalHint(current),
  };
}

export const ADAM_TUTOR_STUDENT_FACTUAL_CORRECTION_LAW = `
ADAM TUTOR — PELAJAR BETULKAN FAKTA / SENARAI (turn ini):

Pelajar mempertikaikan atau membetulkan fakta, prinsip, atau item dalam senarai anda tadi.

WAJIB:
1. Terima pembetulan dengan ringkas — "Terima kasih, anda betul" atau setara — tanpa berdebat atau merendahkan pelajar.
2. Jika pelajar menamakan item yang betul, gunakan item itu dalam jawapan seterusnya — jangan ulang versi salah anda.
3. Jalankan carian web (jika tersedia) ke sumber kurikulum rasmi (KPM / MOE / gov.my) — bukan blog atau polisi umum yang bercanggah buku teks.
4. Bezakan dengan jelas: **kurikulum sekolah / peperiksaan** vs wacana dasar umum — ikut apa yang pelajar perlukan untuk kelas.
5. Selepas fakta betul, satu soalan signifikan ringkas — bukan metafor panjang atau essay epistemologi.

DILARANG turn ini:
- Menulis "bukan …" menolak istilah yang pelajar sahkan tanpa bukti kurikulum.
- Rumah/metafor berjumlah lima tiang, lantai, bumbung, dll. untuk menegaskan versi salah.
- "Disahkan melalui carian" dengan nombor rujukan palsu.
- Mengajar pelajar bahawa buku teks mereka salah tanpa bukti MOE/KPM.
`.trim();

const RUKUN_NEGARA_CONTEXT =
  /\b(?:rukun\s*negara|rukunegara)\b/i;

const RUKUN_NEGARA_PRINCIPLE_CONTEXT =
  /\b(?:prinsip|lima|5|kelima|ke[-\s]?5|keadilan\s+sosial|kesopanan|kesusilaan)\b/i;

const RUKUN_NEGARA_WRONG_FIFTH =
  /\bkeadilan\s+sosial\b/i;

const RUKUN_NEGARA_CORRECT_FIFTH =
  /\bkesopanan\s+dan\s+kesusilaan\b/i;

const RUKUN_NEGARA_DOUBLE_DOWN =
  /\b(?:diubah\s+kepada|berubah\s+kepada|versi\s+akhir.*keadilan\s+sosial|prinsip\s+kelima.*keadilan\s+sosial|bukan(?:lah|nya)?\s+["“]?kesopanan\s+dan\s+kesusilaan)\b/i;

const RUKUN_NEGARA_CANONICAL_LIST = [
  'Kepercayaan kepada Tuhan',
  'Kesetiaan kepada Raja dan Negara',
  'Keluhuran Perlembagaan',
  'Kedaulatan Undang-undang',
  'Kesopanan dan Kesusilaan',
] as const;

function extractRukunNegaraAffirmedHint(message: string): string | undefined {
  return RUKUN_NEGARA_CORRECT_FIFTH.test(message)
    ? 'Kesopanan dan Kesusilaan'
    : undefined;
}

export function isRukunNegaraPrinciplesContext(
  message: string,
  recentAssistantMessages: string[] = [],
): boolean {
  const sample = [message, ...recentAssistantMessages.slice(-2)].join('\n');
  return RUKUN_NEGARA_CONTEXT.test(sample)
    && RUKUN_NEGARA_PRINCIPLE_CONTEXT.test(sample);
}

export function buildRukunNegaraCurriculumPromptBlock(
  message: string,
  recentAssistantMessages: string[] = [],
): string {
  if (!isRukunNegaraPrinciplesContext(message, recentAssistantMessages)) return '';

  return `
KURIKULUM MALAYSIA — RUKUN NEGARA (WAJIB TEPAT):
- Lima prinsip Rukun Negara yang diajar dalam kurikulum sekolah ialah:
  1. Kepercayaan kepada Tuhan
  2. Kesetiaan kepada Raja dan Negara
  3. Keluhuran Perlembagaan
  4. Kedaulatan Undang-undang
  5. Kesopanan dan Kesusilaan
- "Keadilan Sosial" BUKAN prinsip kelima Rukun Negara dalam senarai rasmi sekolah.
- Jangan dakwa "Kesopanan dan Kesusilaan" ialah draf awal yang kemudian ditukar kepada "Keadilan Sosial".
- Jika pelajar membetulkan anda tentang perkara ini, akui: "Anda betul — prinsip kelima ialah Kesopanan dan Kesusilaan."
`.trim();
}

export function buildStudentFactualCorrectionPromptBlock(
  message: string,
  recentAssistantMessages: string[] = [],
): string {
  const ctx = resolveStudentFactualCorrectionTurn(message, recentAssistantMessages);
  const rukunBlock = buildRukunNegaraCurriculumPromptBlock(message, recentAssistantMessages);
  if (!ctx.isActive) return rukunBlock;

  const hints: string[] = [ADAM_TUTOR_STUDENT_FACTUAL_CORRECTION_LAW];
  if (rukunBlock) hints.push(rukunBlock);
  if (ctx.affirmedHint) {
    hints.push(
      `PEMBETULAN PELAJAR (gunakan istilah ini jika carian kurikulum menyokong): ${ctx.affirmedHint}`,
    );
  }
  if (ctx.ordinalHint) {
    hints.push(`SLOT YANG DIPERTIKAIKAN: ${ctx.ordinalHint}`);
  }
  return hints.join('\n\n');
}

function rukunNegaraCanonicalReply(isCorrection: boolean): string {
  const list = RUKUN_NEGARA_CANONICAL_LIST
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n');

  const opener = isCorrection
    ? 'Terima kasih — anda betul. Untuk kurikulum sekolah Malaysia, prinsip kelima Rukun Negara ialah **Kesopanan dan Kesusilaan**, bukan **Keadilan Sosial**.'
    : 'Lima prinsip Rukun Negara ialah:';

  return `${opener}\n\n${list}\n\nCuba semak semula: prinsip kelima ialah apa?`;
}

/** Classroom enumeration asks — prefer MOE/KPM sites, no topic hardcoding. */
export function isClassroomEnumerationAsk(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return (
    /\b(?:apakah|senarai|nyatakan|terangkan|berapa|list|name)\b/i.test(t)
    && LIST_CONTEXT_CUE.test(t)
  );
}

/** Reply rejects the student's affirmed syllabus term — generic double-down. */
export function paragraphDoublesDownOnStudentFactualCorrection(
  paragraph: string,
  userMessage: string,
  recentAssistantMessages: string[] = [],
): boolean {
  const ctx = resolveStudentFactualCorrectionTurn(userMessage, recentAssistantMessages);
  if (!ctx.isActive || !ctx.affirmedHint) return false;

  const affirmed = ctx.affirmedHint.toLowerCase();
  if (affirmed.length < 4) return false;

  const p = paragraph.toLowerCase();
  if (!p.includes('bukan') && !/\bsalah faham\b/i.test(p)) return false;

  const affirmedCore = affirmed.split(/\s+/).slice(0, 3).join(' ');
  if (!p.includes(affirmedCore.slice(0, Math.min(affirmedCore.length, 12)))) return false;

  return /\b(?:bukan|bukanlah|salah faham|tidak\s+tepat)\b/i.test(p);
}

const FABRICATED_REF_NUMBER =
  /\b\d{1,3}(?:[,.]\d{3})+\s*\(\s*disahkan/i;

/** Strip false verification and double-down on student factual correction. */
export function enforceTutorStudentFactualCorrectionGuard(
  text: string,
  userMessage = '',
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;
  if (isRukunNegaraPrinciplesContext(userMessage, recentAssistantMessages)) {
    const wrongRukun =
      RUKUN_NEGARA_WRONG_FIFTH.test(text)
      || RUKUN_NEGARA_DOUBLE_DOWN.test(text)
      || !RUKUN_NEGARA_CORRECT_FIFTH.test(text);
    if (wrongRukun) {
      return rukunNegaraCanonicalReply(
        isStudentFactualChallengeMessage(userMessage, recentAssistantMessages),
      );
    }
  }
  if (!isStudentFactualChallengeMessage(userMessage, recentAssistantMessages)) return text;

  const paragraphs = text.split(/\n{2,}/);
  const kept: string[] = [];
  let stripped = false;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (paragraphDoublesDownOnStudentFactualCorrection(trimmed, userMessage, recentAssistantMessages)) {
      stripped = true;
      continue;
    }
    if (FALSE_SEARCH_VERIFIED_CLAIM.test(trimmed) || FABRICATED_REF_NUMBER.test(trimmed)) {
      stripped = true;
      continue;
    }
    if (/\b(?:jika\s+kita\s+bayangkan|seperti\s+sebuah\s+rumah|tiang\s+utama|lantai\s+yang\s+rata)\b/i.test(trimmed)) {
      stripped = true;
      continue;
    }
    kept.push(trimmed);
  }

  if (!stripped) return text;

  const ctx = resolveStudentFactualCorrectionTurn(userMessage, recentAssistantMessages);
  const ack = ctx.affirmedHint
    ? `Terima kasih — anda betul menegaskan **${ctx.affirmedHint}**. Mari kita teruskan dengan versi kurikulum sekolah.`
    : 'Terima kasih kerana membetulkan — mari kita selaraskan dengan kurikulum sekolah.';

  const bodyText = kept.join('\n\n').trim();
  return bodyText ? `${ack}\n\n${bodyText}` : ack;
}
