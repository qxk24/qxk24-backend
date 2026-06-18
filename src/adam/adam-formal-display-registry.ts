/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Formal Display Registry (Turn Gate Fasa 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Per displayChannel repair — economics ≠ science ≠ civics templates.
 * Read displayChannel from gate / answerPlan only; do not re-resolve domain here.
 */

import {
  compareFormalStructureAdequate,
  economicsFormalStructureAdequate,
  extractEconomicsDataRows,
  hasMarkdownTable,
} from './adam-compare-formal-display';
import { paragraphIsUnsolicitedFaithSermon } from './adam-users-output-law.paragraph-detectors';
import type { AdamDisplayChannel } from './turn-gate/adam-turn-gate.types';

export interface FormalDisplayBuildContext {
  topicTitle: string;
  userMessage?: string;
}

function paragraphIsHaiOpener(p: string): boolean {
  return /^hai\s+/i.test(p.trim());
}

function paragraphIsClosingInvite(p: string): boolean {
  return /^mahu\s+saya\s+jelaskan/i.test(p.trim())
    || /^would you like me to explain further/i.test(p.trim())
    || /^adakah\s+/i.test(p.trim())
    || /\b(?:ingin saya bantu|sedia bantu|nota kuliah|perbincangan kelas)\b/i.test(p);
}

function paragraphIsAlamtologiScienceLeak(p: string): boolean {
  return /\bIZWA\b/i.test(p)
    || /\bFitrah bukan sekadar\b/i.test(p)
    || /\bmu[ḥh]ī[ṭt]\s+ekonomi\b/i.test(p);
}

function paragraphIsRingkasan(p: string): boolean {
  return /^\*\*Ringkasnya:\*\*/i.test(p.trim());
}

function paragraphIsCadangan(p: string): boolean {
  return /^\*\*Cadangan:\*\*/i.test(p.trim()) || /^Cadangan:/im.test(p.trim());
}

function paragraphIsStructuredHeader(p: string): boolean {
  return /^#{1,6}\s+/m.test(p.trim());
}

function filterFormalBody(paragraphs: string[]): string[] {
  return paragraphs.filter(
    (p) => !paragraphIsHaiOpener(p)
      && !paragraphIsClosingInvite(p)
      && !paragraphIsRingkasan(p)
      && !paragraphIsCadangan(p)
      && !paragraphIsStructuredHeader(p)
      && !paragraphIsUnsolicitedFaithSermon(p)
      && !paragraphIsAlamtologiScienceLeak(p),
  );
}

function numberedLines(paragraphs: string[], max = 4): string {
  return paragraphs.slice(0, max).map((p, i) => {
    const line = p.replace(/^\s*\d+[.)]\s*/, '').trim();
    return `${i + 1}. ${line}`;
  }).join('\n');
}

function placeholderDataTable(label: string): string[] {
  return [
    '| Petunjuk | Nilai | Tahun/sumber |',
    '| --- | --- | --- |',
    `| — | Rujuk ${label} — | — |`,
  ];
}

/** Formal display channels that use registry builders (not compare / none). */
export function isRegistryFormalDisplayChannel(
  channel: AdamDisplayChannel | undefined,
): channel is Exclude<AdamDisplayChannel, 'none' | 'compare-formal'> {
  return Boolean(channel)
    && channel !== 'none'
    && channel !== 'compare-formal';
}

export function formalDisplayStructureAdequate(
  displayChannel: AdamDisplayChannel,
  text: string,
  options?: { formalDataLayout?: boolean },
): boolean {
  switch (displayChannel) {
    case 'economics-formal':
      return economicsFormalStructureAdequate(text);
    case 'science-formal':
      return scienceFormalStructureAdequate(text);
    case 'civics-formal':
      return civicsFormalStructureAdequate(text);
    case 'technology-formal':
      return technologyFormalStructureAdequate(text);
    case 'academic-formal':
      return academicFormalStructureAdequate(text);
    case 'mathematics-formal':
    case 'business-formal':
    case 'accounting-formal':
    case 'health-formal':
    case 'environment-formal':
      return genericFormalStructureAdequate(text);
    case 'compare-formal':
      return compareFormalStructureAdequate(text, options);
  }
  return false;
}

export function scienceFormalTableBroken(text: string): boolean {
  if (!/###\s+Data dan jadual/im.test(text)) return false;
  if (/\|\s*,\s*\|/i.test(text)) return true;
  if (/\|\s*,\s*\|\s*Rujuk sumber/i.test(text)) return true;
  if (/\|\s*—\s*\|\s*Rujuk[^|\n]+\|\s*—\s*\|/i.test(text)) return true;
  const tableBody = text.match(/###\s+Data dan jadual[\s\S]*?(?=###|$)/i)?.[0] ?? '';
  if (tableBody && !/\d/.test(tableBody) && /Rujuk sumber/i.test(tableBody)) return true;
  return false;
}

export function scienceFormalStructureAdequate(text: string): boolean {
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  if (headers < 3) return false;
  if (/###\s+Apa itu topik ini\b/i.test(text)) return false;
  if (/###\s+Data dan statistik/im.test(text)) return false;
  if (/###\s+Mekanisme \/ saluran kesan/im.test(text)) return false;
  if (scienceFormalTableBroken(text)) return false;
  const hasPrinciple = /^###\s+Prinsip/im.test(text);
  const hasBioethics = /^###\s+Implikasi perubatan/im.test(text)
    && /^###\s+Implikasi etika/im.test(text);
  const hasSteps = /^###\s+(?:Langkah|Fasa)/im.test(text);
  const hasNumbered = /^\s*\d+\.\s+/m.test(text);
  if (hasBioethics && hasNumbered) return true;
  if (!hasPrinciple || (!hasSteps && !hasNumbered)) return false;
  return true;
}

export function civicsFormalStructureAdequate(text: string): boolean {
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  if (headers < 3) return false;
  if (/###\s+Apa itu topik ini\b/i.test(text)) return false;
  const hasCabang = /^###\s+(?:Tiga cabang|Cabang kuasa|Peranan)/im.test(text);
  const hasDef = /^###\s+Apa itu/im.test(text);
  return hasDef && (hasCabang || hasMarkdownTable(text) || /^\s*\d+\.\s+/m.test(text));
}

export function technologyFormalStructureAdequate(text: string): boolean {
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  if (headers < 3) return false;
  if (/###\s+Apa itu topik ini\b/i.test(text)) return false;
  const hasConcept = /^###\s+(?:Konsep|Apa itu)/im.test(text);
  const hasSteps = /^###\s+(?:Langkah|Spesifikasi|Cara)/im.test(text);
  const hasNumbered = /^\s*\d+\.\s+/m.test(text);
  return hasConcept && (hasSteps || hasNumbered || hasMarkdownTable(text));
}

export function academicFormalStructureAdequate(text: string): boolean {
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  if (headers < 2) return false;
  if (/###\s+Apa itu topik ini\b/i.test(text)) return false;
  const hasPurpose = /^###\s+(?:Tujuan|Persoalan|Apa itu)/im.test(text);
  const hasMethod = /^###\s+(?:Langkah|Metodologi|Kaedah)/im.test(text);
  const hasNumbered = /^\s*\d+\.\s+/m.test(text);
  return hasPurpose && (hasMethod || hasNumbered);
}

/** Shared adequacy for mathematics, business, accounting, health, environment formal channels. */
export function genericFormalStructureAdequate(text: string): boolean {
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  if (headers < 3) return false;
  if (/###\s+Apa itu topik ini\b/i.test(text)) return false;
  const hasDef = /^###\s+(?:Definisi|Prinsip|Apa itu|Konsep)/im.test(text);
  const hasBody = /^###\s+(?:Langkah|Fakta|Contoh|Data)/im.test(text);
  const hasNumbered = /^\s*\d+\.\s+/m.test(text);
  return hasDef && (hasBody || hasNumbered);
}

function buildEconomicsFormalSections(paragraphs: string[], topicTitle: string): string {
  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const middle = body.slice(1, -1);
  const synthesis = body.length > 1 ? body[body.length - 1]! : '';

  const mechanismLines = numberedLines(middle.slice(0, 4));

  const corpus = [intro, ...middle, synthesis].join(' ');
  const dataRows = extractEconomicsDataRows(corpus);

  const chunks: string[] = [
    `### Apa itu ${topicTitle}?`,
    intro,
    '### Data dan statistik',
    '| Petunjuk | Nilai | Tahun/sumber |',
    '| --- | --- | --- |',
    ...dataRows,
    '### Mekanisme / saluran kesan',
    mechanismLines.length > 0
      ? mechanismLines
      : [
        '1. Subsidi langsung menekan harga segera di pasaran.',
        '2. Kawalan harga boleh menimbulkan kelangkaan terselindung.',
        '3. Beban fiskal kerajaan meningkat jangka panjang.',
      ].join('\n'),
    '### Contoh Malaysia',
    middle.slice(4).join('\n\n') || middle.join('\n\n') || intro,
    '### Kesimpulan',
    synthesis || intro,
  ];

  return chunks.filter(Boolean).join('\n\n');
}

function isBioethicsCorpus(corpus: string, userMessage?: string): boolean {
  const t = `${corpus} ${userMessage ?? ''}`;
  return /\b(?:etika|bioetika|CRISPR|germline|penyuntingan\s+gen|embrio\s+manusia|designer\s+baby|bayi\s+rekaan|implikasi\s+etika)\b/i.test(t);
}

function partitionScienceBody(paragraphs: string[]): {
  medical: string[];
  ethics: string[];
  other: string[];
} {
  const medical: string[] = [];
  const ethics: string[] = [];
  const other: string[] = [];
  for (const p of paragraphs) {
    const t = p.trim();
    if (!t) continue;
    if (/\b(?:etika|ethical|moral|germline|designer|maruah|hifz|fatwa|haram|patut|keturunan|persetujuan)\b/i.test(t)) {
      ethics.push(t);
    } else if (/\b(?:perubatan|klinikal|off-target|mosaic|mosaik|terapi|penyakit|imunoterapi|sel\s+somatik|rawatan|mutasi|DNA)\b/i.test(t)) {
      medical.push(t);
    } else {
      other.push(t);
    }
  }
  return { medical, ethics, other };
}

function buildScienceBioethicsSections(
  paragraphs: string[],
  topicTitle: string,
  userMessage?: string,
): string {
  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const rest = body.slice(1);
  const { medical, ethics, other } = partitionScienceBody(rest);
  const synthesis = body.length > 1 ? body[body.length - 1]! : intro;
  const examplePool = other.length > 0 ? other.slice(0, -1) : other;
  const example = examplePool.join('\n\n')
    || ethics.find((p) => /\b(?:Malaysia|WHO|Fatwa|Majlis)\b/i.test(p))
    || '';

  const chunks: string[] = [
    `### Prinsip dan definisi — ${topicTitle}`,
    intro,
    '### Implikasi perubatan',
    numberedLines(
      medical.length > 0 ? medical : [rest[0] ?? 'CRISPR-Cas9 membolehkan suntingan gen pada sel somatik untuk terapi penyakit bawaan.'],
      4,
    ),
    '### Implikasi etika',
    numberedLines(
      ethics.length > 0 ? ethics : rest.slice(1, 5),
      4,
    ),
    '### Contoh dan konteks',
    example || medical.slice(0, 2).join('\n\n') || ethics.slice(0, 2).join('\n\n') || intro,
    '### Kesimpulan',
    synthesis,
  ];

  return chunks.filter(Boolean).join('\n\n');
}

function buildScienceFormalSections(
  paragraphs: string[],
  topicTitle: string,
  userMessage?: string,
): string {
  const corpus = paragraphs.join(' ');
  if (isBioethicsCorpus(corpus, userMessage)) {
    return buildScienceBioethicsSections(paragraphs, topicTitle, userMessage);
  }

  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const middle = body.slice(1, -1);
  const synthesis = body.length > 1 ? body[body.length - 1]! : '';
  const steps = numberedLines(middle.slice(0, 4));

  const measure = corpus.match(/\b\d+(?:\.\d+)?\s*(?:°C|K|km\/h|pH|mol\/L|Hz|nm|μm|%)\b/i);
  const dataLine = measure
    ? `**Data ringkas:** ${measure[0].trim()} (rujuk sumber saintifik).`
    : '';

  const chunks: string[] = [
    `### Prinsip dan definisi — ${topicTitle}`,
    intro,
    dataLine,
    '### Langkah / fasa',
    steps.length > 0
      ? steps
      : [
        '1. Kenal pasti input dan output proses.',
        '2. Terangkan perubahan tenaga atau bahan.',
        '3. Beri contoh pengamatan atau eksperimen ringkas.',
      ].join('\n'),
    '### Contoh',
    middle.slice(4).join('\n\n') || middle[0] || intro,
    '### Kesimpulan',
    synthesis || intro,
  ];

  return chunks.filter(Boolean).join('\n\n');
}

/** Strip placeholder / corrupted science jadual blocks from streamed output. */
export function repairScienceFormalDisplay(text: string): string {
  let out = text
    .replace(/###\s+Data dan jadual\s*\n+(?:\|[^\n]+\n?)+/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  out = out
    .replace(/\n*\s*Adakah\s+[^?\n]+\?\s*Saya sedia bantu[^\n]*/gi, '')
    .replace(/\n*\s*Mahu saya jelaskan lebih lanjut\?\s*/gi, '\n\n')
    .trim();
  return out;
}

function buildCivicsFormalSections(paragraphs: string[], topicTitle: string): string {
  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const middle = body.slice(1, -1);
  const synthesis = body.length > 1 ? body[body.length - 1]! : '';

  const chunks: string[] = [
    `### Apa itu ${topicTitle}?`,
    intro,
    '### Tiga cabang kuasa',
    [
      '1. **Legislatif** — Parlimen membuat undang-undang.',
      '2. **Eksekutif** — Kabinet melaksanakan dasar.',
      '3. **Kehakiman** — Mahkamah mentafsir undang-undang.',
      middle[0] ?? '',
    ].filter(Boolean).join('\n'),
    '### Hak asasi dan contoh Malaysia',
    middle.slice(1).join('\n\n') || intro,
    '### Kesimpulan',
    synthesis || intro,
  ];

  return chunks.filter(Boolean).join('\n\n');
}

function buildTechnologyFormalSections(paragraphs: string[], topicTitle: string): string {
  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const middle = body.slice(1, -1);
  const synthesis = body.length > 1 ? body[body.length - 1]! : '';
  const steps = numberedLines(middle.slice(0, 4));

  const chunks: string[] = [
    `### Konsep — ${topicTitle}`,
    intro,
    '### Spesifikasi / perbandingan',
    ...placeholderDataTable('dokumentasi rasmi'),
    '### Langkah atau cara kerja',
    steps.length > 0
      ? steps
      : [
        '1. Kenal pasti komponen utama sistem.',
        '2. Terangkan aliran data atau proses.',
        '3. Nyatakan had atau risiko praktikal.',
      ].join('\n'),
    '### Contoh',
    middle.slice(4).join('\n\n') || middle.join('\n\n') || intro,
    '### Kesimpulan',
    synthesis || intro,
  ];

  return chunks.filter(Boolean).join('\n\n');
}

function buildAcademicFormalSections(paragraphs: string[], topicTitle: string): string {
  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const middle = body.slice(1, -1);
  const synthesis = body.length > 1 ? body[body.length - 1]! : '';
  const steps = numberedLines(middle.slice(0, 4));

  const chunks: string[] = [
    `### Tujuan dan persoalan — ${topicTitle}`,
    intro,
    '### Langkah metodologi',
    steps.length > 0
      ? steps
      : [
        '1. Kenal pasti persoalan kajian.',
        '2. Pilih kaedah dan sumber data.',
        '3. Analisis dan rumuskan dapatan.',
      ].join('\n'),
    '### Jadual / perbandingan (jika ada)',
    ...placeholderDataTable('literatur atau data'),
    '### Kesimpulan',
    synthesis || intro,
  ];

  return chunks.filter(Boolean).join('\n\n');
}

function buildGenericFormalSections(paragraphs: string[], topicTitle: string): string {
  const body = filterFormalBody(paragraphs);
  const intro = body[0] ?? '';
  const middle = body.slice(1, -1);
  const synthesis = body.length > 1 ? body[body.length - 1]! : '';
  const steps = numberedLines(middle.slice(0, 4));

  return [
    `### Definisi — ${topicTitle}`,
    intro,
    '### Langkah / fakta utama',
    steps.length > 0
      ? steps
      : [
        '1. Nyatakan prinsip atau definisi inti.',
        '2. Terangkan mekanisme atau langkah utama.',
        '3. Beri contoh konteks nyata.',
      ].join('\n'),
    '### Contoh',
    middle.slice(4).join('\n\n') || middle.join('\n\n') || intro,
    '### Kesimpulan',
    synthesis || intro,
  ].filter(Boolean).join('\n\n');
}

/** Build formal sections for a gate displayChannel. */
export function buildFormalDisplaySections(
  displayChannel: AdamDisplayChannel,
  paragraphs: string[],
  context: FormalDisplayBuildContext,
): string {
  const { topicTitle } = context;
  switch (displayChannel) {
    case 'economics-formal':
      return buildEconomicsFormalSections(paragraphs, topicTitle);
    case 'science-formal':
      return buildScienceFormalSections(paragraphs, topicTitle, context.userMessage);
    case 'civics-formal':
      return buildCivicsFormalSections(paragraphs, topicTitle);
    case 'technology-formal':
      return buildTechnologyFormalSections(paragraphs, topicTitle);
    case 'academic-formal':
      return buildAcademicFormalSections(paragraphs, topicTitle);
    case 'mathematics-formal':
    case 'business-formal':
    case 'accounting-formal':
    case 'health-formal':
    case 'environment-formal':
      return buildGenericFormalSections(paragraphs, topicTitle);
    default:
      return buildEconomicsFormalSections(paragraphs, topicTitle);
  }
}
