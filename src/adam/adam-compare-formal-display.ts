/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Compare Formal Display
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
 * Formal scientific compare layout — tables + numbers, not essay-only.
 */

import { stripLeadingAdamSalutation } from './adam-response-generation';

const FORMAL_DATA_ASK =
  /\b(?:perinci(?:kan)?|perangkaan|statistik|data\b|nombor|angka|jadual|forecast|ramalan|trend|peratus|kuantitatif|empirical|laporan\s+tahunan)\b/i;

/** User asked for figures, tables, or quantitative depth. */
export function isAdamFormalDataShapeTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t) return false;
  return FORMAL_DATA_ASK.test(t);
}

export function hasMarkdownTable(text: string): boolean {
  return /^\|.+\|$/m.test(text) && /^\|[\s:|-]+\|$/m.test(text);
}

export function countStructuredDataSignals(text: string): number {
  const nums = text.match(/\b\d{1,3}(?:,\d{3})+\b/g) ?? [];
  const years = text.match(/\b20\d{2}\b/g) ?? [];
  const percents = text.match(/\b\d{1,3}(?:\.\d+)?\s*%/g) ?? [];
  return nums.length + years.length + percents.length;
}

/** Repair stream fragments — orphan ratios, broken RM tails, split stats. */
export function repairCompareFragmentCorruption(text: string): string {
  let out = text.trim();
  if (!out) return out;

  out = out.replace(
    /\n{2,}(\d{1,3}(?:\.\d+)?\s*%)\)\.\s*/g,
    '\n\n($1). ',
  );

  out = out.replace(
    /\n{2,}(\d{1,2}:\d{1,2})\s+(setiap tahun[^\n.]*)/gi,
    '\n\nNisbah $1 $2',
  );

  out = out.replace(
    /(\d{4})\.\s+00\s+bagi/gi,
    '$1 — contoh tuntutan ganti rugi bagi',
  );

  out = out.replace(
    /\*([^*\n]{2,60}v\.)\s+[\d,.]+\s+juta/gi,
    '$1 [Nama pihak dan mahkamah — lengkapkan petikan kes]',
  );

  const paras = out.split(/\n{2,}/);
  const merged: string[] = [];
  for (const para of paras) {
    const t = para.trim();
    if (!t) continue;
    if (/^\d{1,2}:\d{1,2}\s+setiap tahun/i.test(t) && merged.length > 0) {
      const prev = merged[merged.length - 1]!;
      merged[merged.length - 1] = `${prev.replace(/\.\s*$/, '')} (Nisbah ${t}).`;
      continue;
    }
    if (/^00\s+bagi\b/i.test(t)) continue;
    merged.push(t);
  }
  return merged.join('\n\n').trim();
}

export function compareFormalStructureAdequate(
  text: string,
  options?: { formalDataLayout?: boolean },
): boolean {
  const formal = options?.formalDataLayout === true;
  const hasCompareHeader = /^###\s+Perbandingan/im.test(text);
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  const hasTable = hasMarkdownTable(text);
  const hasDataSection = /^###\s+Data dan statistik/im.test(text);

  if (!hasCompareHeader || headers < 2) return false;
  if (!hasTable) return false;
  if (formal && countStructuredDataSignals(text) >= 4 && !hasDataSection) {
    return false;
  }
  return true;
}

export function economicsFormalStructureAdequate(text: string): boolean {
  const headers = (text.match(/^###\s+.+$/gm) ?? []).length;
  if (headers < 3) return false;
  if (/###\s+Apa itu topik ini\b/i.test(text)) return false;
  if (!hasMarkdownTable(text)) return false;
  if (!/^###\s+Data dan statistik/im.test(text)) return false;
  const hasNumbered = /^\s*\d+\.\s+/m.test(text);
  const hasMechanism = /^###\s+(?:Mekanisme|Saluran)/im.test(text);
  if (!hasNumbered && !hasMechanism) return false;
  return economicsFormalTableAdequate(text);
}

const ECONOMICS_TABLE_CELL_MAX = 96;

/** Compact stat rows for economics formal jadual — not essay cells. */
export function extractEconomicsDataRows(corpus: string): string[] {
  const rows: string[] = [];
  const push = (label: string, value: string, source: string) => {
    const v = value.replace(/\|/g, '/').trim().slice(0, ECONOMICS_TABLE_CELL_MAX);
    if (v) rows.push(`| ${label} | ${v} | ${source} |`);
  };

  const infl = corpus.match(/\binflasi[^.!?]{0,100}?(\d{1,2}(?:\.\d+)?)\s*(?:peratus|%)/i);
  if (infl) {
    const yr = infl[0].match(/20\d{2}/)?.[0] ?? 'DOSM';
    push('Inflasi Malaysia', `${infl[1]}%`, yr);
  }

  const bnm = corpus.match(/BNM[^.!?]{0,80}?(\d+(?:\.\d+)?)\s*(?:hingga|ke|–|-)\s*(\d+(?:\.\d+)?)\s*peratus/i);
  if (bnm) push('Sasaran inflasi BNM', `${bnm[1]}–${bnm[2]}%`, 'BNM');

  const kdnk = corpus.match(/\bKDNK\b[^.!?]{0,50}?(\d{1,2}(?:\.\d+)?)\s*(?:peratus|%)/i);
  if (kdnk) {
    const yr = kdnk[0].match(/20\d{2}/)?.[0] ?? 'DOSM';
    push('Pertumbuhan KDNK', `${kdnk[1]}%`, yr);
  }

  const oil = corpus.match(/USD\s*(\d+)/i);
  if (oil) push('Harga minyak dunia', `~USD${oil[1]}/barel`, 'Pasaran');

  const ihpPct = corpus.match(/\bIHP\b[^.!?]{0,60}?(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (ihpPct) push('Indeks harga pengguna (IHP)', `${ihpPct[1]}%`, 'DOSM');
  else if (/\bIHP\b/i.test(corpus)) push('Indeks harga pengguna (IHP)', 'rujuk DOSM', 'DOSM');

  if (rows.length === 0) {
    rows.push('| — | Rujuk DOSM/BNM — | — |');
  }
  return rows;
}

function economicsDataTableBlock(rows: string[]): string {
  return [
    '| Petunjuk | Nilai | Tahun/sumber |',
    '| --- | --- | --- |',
    ...rows,
  ].join('\n');
}

/** Reject essay-length cells or broken alignment rows in Data dan statistik. */
export function economicsFormalTableAdequate(text: string): boolean {
  const match = text.match(/### Data dan statistik\s*\n([\s\S]*?)(?=\n### |\s*$)/i);
  if (!match) return false;
  const block = match[1] ?? '';
  if (/^\|:+[-:]+:+\|/m.test(block)) return false;
  const dataRows = block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && !/^\|[\s:|-]+\|/.test(l));
  if (dataRows.length === 0) return false;
  for (const row of dataRows) {
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    const value = cells[1] ?? '';
    if (value.length > ECONOMICS_TABLE_CELL_MAX) return false;
    if (/IHP\)\s+negara/i.test(value)) return false;
    if (/walaupun harga minyak/i.test(value)) return false;
  }
  return true;
}

/** Repair economics jadual — compact stats, drop bad align rows, strip muḥīṭ inline. */
export function repairEconomicsFormalTables(text: string): string {
  if (!/^###\s+Data dan statistik/im.test(text)) {
    return text.replace(/\*?\bmu[ḥh]ī[ṭt]\s+ekonomi\*?/gi, 'sistem ekonomi');
  }

  let out = text.replace(/\*?\bmu[ḥh]ī[ṭt]\s+ekonomi\*?/gi, 'sistem ekonomi');
  out = out.replace(/^\|:?-{3,}:?\|[^\n]*$/gm, '');

  const rows = extractEconomicsDataRows(out);
  const tableBlock = economicsDataTableBlock(rows);
  const sectionRe = /(### Data dan statistik\s*\n)(?:[^\n#][\s\S]*?)(?=\n### |\s*$)/i;
  if (sectionRe.test(out)) {
    out = out.replace(sectionRe, `$1${tableBlock}\n\n`);
  }

  return repairEconomicsMechanismBullets(out.trim());
}

/** Truncate mechanism numbered items to first sentence when model writes essays. */
export function repairEconomicsMechanismBullets(text: string): string {
  const match = text.match(/(### Mekanisme[^\n]*\n)([\s\S]*?)(?=\n### |\s*$)/i);
  if (!match) return text;
  const prefix = match[1] ?? '';
  const body = match[2] ?? '';
  const fixed = body.replace(
    /^(\s*\d+\.\s+)([\s\S]*?)(?=\n\s*\d+\.\s+|$)/gm,
    (_full, num: string, content: string) => {
      const t = content.trim();
      if (t.length <= 280) return `${num}${t}\n`;
      const first = t.match(/^[^.!?]+[.!?]/)?.[0]?.trim() ?? t.slice(0, 220).trim();
      return `${num}${first}\n`;
    },
  );
  return text.replace(match[0], `${prefix}${fixed}`);
}

/** Orphan fragments after faith/Rasulullah inline strip — e.g. "w. dan para Khalifah". */
export function repairEconomicsStreamFragments(text: string): string {
  let out = text.trim();
  if (!out) return out;

  out = out.replace(/(?:^|\n{2,})\s*w\.\s+(?=dan\s+para\s+Khalifah)/gi, '\n\n');
  out = out.replace(/(?:^|\n{2,})\s*w\.\s+/gm, '');
  out = repairCompareFragmentCorruption(out);
  return out.trim();
}
