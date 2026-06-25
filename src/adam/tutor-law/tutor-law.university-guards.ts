/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM University Standard Guards
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-26
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AdamTutorProfile } from './tutor-law.types';
import { normalizeTutorLanguage } from './tutor-law.types';

const MALAY_HINT =
  /\b(?:saya|tolong|boleh|buatkan|siapkan|tulis(?:kan)?|hantar|tugasan|rujukan|palsu|kajian|pensyarah|universiti)\b/i;

const GHOSTWRITING_REQUEST_PATTERNS = [
  /\b(?:write|do|complete|finish|generate|create)\s+(?:my\s+)?(?:full|entire|whole|complete)?\s*(?:assignment|essay|paper|report|coursework|thesis|dissertation|fyp)\b[^.\n]{0,160}\b(?:submit|submission|turn\s+in|hand\s+in|for\s+me)\b/i,
  /\b(?:write|do|complete|finish)\s+(?:my\s+)?(?:assignment|essay|paper|report|coursework|thesis|dissertation|fyp)\s+(?:for\s+me|so\s+i\s+can\s+submit)\b/i,
  /\b(?:buatkan|siapkan|tolong\s+buat|tolong\s+siapkan|tuliskan)\b[^.\n]{0,120}\b(?:assignment|tugasan|esei|kertas\s+kerja|laporan|tesis|fyp|projek\s+tahun\s+akhir)\b/i,
  /\b(?:assignment|tugasan|esei|kertas\s+kerja|laporan|tesis|fyp)\b[^.\n]{0,120}\b(?:siap\s+hantar|untuk\s+hantar|terus\s+hantar|submit|submission)\b/i,
] as const;

const FAKE_SOURCE_REQUEST_PATTERNS = [
  /\b(?:fake|invent|make\s+up|fabricate|create)\b[^.\n]{0,80}\b(?:references?|citations?|sources?|doi|journal\s+articles?)\b/i,
  /\b(?:reka|cipta|buatkan)\b[^.\n]{0,80}\b(?:rujukan|citation|sitasi|doi|jurnal|sumber)\b[^.\n]{0,80}\b(?:palsu|nampak\s+real|nampak\s+betul)?\b/i,
] as const;

const SOURCE_HEAVY_OUTPUT =
  /\b(?:references?|bibliography|rujukan|doi:|https?:\/\/|journal|vol\.|pp\.)\b/i;

const FABRICATED_DOI_LINE =
  /\bdoi:\s*10\.\d{4,}\/[^\s]+/i;

const FABRICATED_REFERENCE_LINE =
  /^\s*(?:\[\d+\]|\d+\.)\s+[A-Z][^\n]{10,}\(\d{4}\)[^\n]*(?:doi:|https?:\/\/)/im;

const SOURCE_NOTE_EN =
  'Integrity note: verify every source against your university library or the original publication. ADAM must not be used to submit fabricated citations.';

const SOURCE_NOTE_MS =
  'Nota integriti: sahkan setiap sumber melalui perpustakaan universiti atau penerbitan asal. ADAM tidak boleh digunakan untuk menghantar rujukan rekaan.';

function prefersMalay(profile?: AdamTutorProfile, text = ''): boolean {
  const lang = normalizeTutorLanguage(profile?.language);
  return lang === 'malay' || (lang === 'other' && MALAY_HINT.test(text));
}

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function isUniversityGhostwritingRequest(userMessage = ''): boolean {
  return matchesAny(userMessage, GHOSTWRITING_REQUEST_PATTERNS);
}

export function isUniversityFakeSourceRequest(userMessage = ''): boolean {
  return matchesAny(userMessage, FAKE_SOURCE_REQUEST_PATTERNS);
}

export function buildUniversityIntegrityRefusal(
  userMessage = '',
  profile?: AdamTutorProfile,
): string {
  if (prefersMalay(profile, userMessage)) {
    return [
      'Saya tidak boleh menulis kerja penuh untuk dihantar atau mencipta rujukan palsu.',
      'Saya boleh bantu dengan cara yang sah: pecahkan arahan tugasan, bina rangka, semak logik hujah, cadangkan bukti yang perlu dicari, dan latih anda mempertahankan kerja sendiri.',
      'Hantar brief/rubric tugasan, dan kita susun struktur yang anda boleh tulis sendiri.',
    ].join('\n\n');
  }

  return [
    'I cannot write a full submission-ready assignment or create fake sources.',
    'I can help safely: decode the brief, build an outline, check argument logic, identify evidence you need to find, and prepare you to defend your own work.',
    'Share the assignment brief or rubric, and we will build a structure you can write yourself.',
  ].join('\n\n');
}

export function enforceUniversityIntegrityGuard(
  text: string,
  userMessage = '',
  profile?: AdamTutorProfile,
): string {
  if (
    isUniversityGhostwritingRequest(userMessage)
    || isUniversityFakeSourceRequest(userMessage)
  ) {
    return buildUniversityIntegrityRefusal(userMessage, profile);
  }

  let out = text.trim();
  if (!out) return out;

  if (isUniversityFakeSourceRequest(userMessage)) {
    out = out
      .split('\n')
      .filter((line) => !FABRICATED_DOI_LINE.test(line) && !FABRICATED_REFERENCE_LINE.test(line))
      .join('\n')
      .trim();
  }

  if (!out || !SOURCE_HEAVY_OUTPUT.test(out)) return out;

  const note = prefersMalay(profile, userMessage) ? SOURCE_NOTE_MS : SOURCE_NOTE_EN;
  if (out.includes(note)) return out;
  return `${out}\n\n${note}`.trim();
}
