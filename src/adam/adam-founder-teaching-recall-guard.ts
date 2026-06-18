/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Teaching Recall Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Post-stream: replace invented teaching essays with backbone scaffold
 * when Formula XYZ thread ignores loaded teaching.
 */

import { HUKUM_ALAMTOLOGI_PDF } from './book-aware-recall/pdf-meterai';
import {
  isFounderFormulaXyzThreadCorpus,
  resolveFounderFormulaXyzChapterId,
} from './adam-founder-teaching-recall-law';

const TECHNICAL_LABEL_RE = /\b(?:Bidang|Definisi|Meterai|Hubungan Formula|Sintesis)\s*:/i;

const INVENTED_TEACHING_ESSAY_RE =
  /hukum kehadiran|bukan hukum fizik|bukan teori yang dibina|hukum yang kita\s+akui|akui dengan akal|substansi yang berdenyut|hikmah turun|medium di mana hikmah|ritme kewujudan|bukan sekadar\s+berfungsi/i;

function buildBab3HukumZScaffold(): string {
  return [
    'Hai Masa, P.alt,',
    '',
    'Tentang Hukum Z (Bab 3 Formula XYZ) —',
    'Bidang: Hukum Alamtologi — undang-undang kehadiran ilmu dalam medan Z, arah X, destinasi Y',
    'Definisi/Meterai: Pola · Kadar · Pasangan · Keseimbangan — empat pilar Hukum Z (Alam Semesta)',
    'Hubungan Formula: ABA = Asas Bentuk Alam — segi empat sama sisi (2D) · kiub (3D); inti operasi Hukum Z',
    'Sintesis: Saya jawab dari CONSTITUTIONAL BACKBONE Bab 3 + meterai P.alt — bukan ontologi ciptaan model.',
    '',
    'Tentang Pola —',
    'Bidang: Hukum Z · pilar 1',
    'Definisi/Meterai: Pola Aktif · Pola Pasif · Ruang Mula & Tamat · Gerakan Asas · Perbezaan (meterai PDF)',
    'Sintesis: Pola = struktur asali yang menyusun segala yang wujud — dari meterai, bukan metafora kosong.',
    '',
    'Tentang Kadar —',
    'Bidang: Hukum Z · pilar 2',
    'Definisi/Meterai: Keperluan · Kapasiti · Persamaan · Masa · Posisi · Tenaga (pecahan Hukum Z, PDF)',
    'Sintesis: Kadar = kadar kehadiran dalam Teori MASABAYU — dari pengajaran P.alt, bukan kelajuan abstrak model.',
    '',
    'Tentang Pasangan —',
    'Bidang: Hukum Z · pilar 3',
    'Definisi/Meterai: Pasangan sebagai syarat kewujudan proses — tiada mutlak tanpa pasangan (meterai Bab 3)',
    'Sintesis: Dari backbone Bab 3 — bukan pasangan sebagai hiasan bersebelahan sahaja.',
    '',
    'Tentang Keseimbangan —',
    'Bidang: Hukum Z · pilar 4',
    'Definisi/Meterai: Hukum Peleraian — laluan kembali ke keseimbangan di bawah Q (meterai Bab 3)',
    'Sintesis: Keseimbangan = keharmonian dinamik dalam Teori MASABAYU — dari meterai P.alt.',
    '',
    HUKUM_ALAMTOLOGI_PDF.split('\n').slice(0, 6).join('\n'),
    '',
    '*(Jika P.alt mahu mendalami satu pilar — beritahu; saya kembangkan dari episod pengajaran indeks.)*',
  ].join('\n');
}

function buildGenericFormulaXyzScaffold(chapterId: string): string {
  return [
    'Hai Masa, P.alt,',
    '',
    `Pada giliran ini jawapan saya mel drift dari meterai ${chapterId} — saya betulkan ke backbone pengajaran P.alt.`,
    '',
    'Saya tidak akan mengganti CONSTITUTIONAL BACKBONE dengan esei model.',
    'Beritahu P.alt konsep mana untuk saya kembangkan dari episod indeks dan meterai bab ini.',
  ].join('\n');
}

/** True when output invents teaching essay instead of backbone-labeled structure. */
export function detectFounderInventedTeachingEssay(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  if (!text?.trim()) return false;
  const corpus = [userMessage, ...recentUserMessages.slice(-4), ...recentAssistantMessages.slice(-2)].join('\n');
  if (!isFounderFormulaXyzThreadCorpus(corpus) && !resolveFounderFormulaXyzChapterId(userMessage, recentUserMessages, recentAssistantMessages)) {
    return false;
  }
  if (TECHNICAL_LABEL_RE.test(text) && !INVENTED_TEACHING_ESSAY_RE.test(text)) return false;
  return INVENTED_TEACHING_ESSAY_RE.test(text)
    || (/\bhukum\s+z\b/i.test(text) && !TECHNICAL_LABEL_RE.test(text) && text.length > 400);
}

/** Replace invented Formula XYZ essays with backbone scaffold. */
export function repairFounderTeachingRecallEssay(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!detectFounderInventedTeachingEssay(text, userMessage, recentUserMessages, recentAssistantMessages)) {
    return text;
  }

  const chapterId = resolveFounderFormulaXyzChapterId(
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );

  if (chapterId === 'bab-3-hukum' || /\bhukum\s+z\b/i.test(text)) {
    return buildBab3HukumZScaffold();
  }

  if (chapterId) {
    return buildGenericFormulaXyzScaffold(chapterId);
  }

  if (/\bhukum\s+z\b/i.test(text)) {
    return buildBab3HukumZScaffold();
  }

  return text;
}
