/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Teaching Output Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { sanitizeUsersOutputSync } from './adam-users-output-guard';
import { restoreFounderPaltAddress } from './adam-founder-address-guard';

const INVENTED_TERMS = [
  'qadari',
  'Perinol',
  'SuNom',
  'CgP',
  'xa1-7-K1',
  'UID',
  'mLa',
  'MG',
] as const;

const SOURCE_GATED_TERMS = [
  'waqf',
  'WAQF',
  'Hukum Z',
  'Hukum X',
  'IZWA',
  'QXK24',
  'Fitra-Iman',
] as const;

const PRINCIPLE_LABELS = [
  'MASA',
  'TENAGA',
  'AIR',
  'API',
  'BUMI',
  'CAHAYA',
  'RUANG',
] as const;

const FRAMEWORK_PATTERNS = [
  /\bbekas\s+qadari\b/i,
  /\bwaqf\s+qadari\b/i,
  /\btanda\s+waqf\b/i,
  /\bkehilangan\s+waqf\b/i,
  /\bpelanggaran\s+waqf\b/i,
  /\bnama\s+qadari\b/i,
  /\bpilihan\s+qadari\b/i,
  /\bprinsip\s+qadari\b/i,
  /\bmenjadi\s+CgP\b/i,
  /\bUID-nya\b/i,
  /\bUID\s+dalam\b/i,
  /`S1\s*→\s*p`/,
  /ritme\s+`S1/i,
  /ritme\s+`[a-zA-Z0-9]+`/i,
  /`[a-zA-Z0-9]+\s*→\s*`[a-zA-Z0-9]+`/,
  /kembali\s+ke\s+`a1`/i,
  /pengembalian\s+ke\s+`a1`/i,
  /pengembalian\s+ke\s+`S1`/i,
  /`a1`\s*:/i,
  /`g7`/i,
  /`S1`/,
  /`p`/,
  /➡️/,
  /^🔹/m,
  /^🌟/m,
  /^---+\s*$/m,
  /pasangan\s+mutlak/i,
  /cermin\s+qadari/i,
  /ritme\s+`a1/i,
  /`a1`\s*→/i,
  /NAPADU-\d/i,
  /NAPADU-NA/i,
  /K24at-/i,
  /KRONO-\d/i,
  /Xam-/i,
  /\*\*BAB\s+\d/i,
  /Isi Kandungan \(FM\)/i,
  /Faktor Masa \(Fm\).*qadari/is,
  /menghayati bersama/i,
  /^➡️/m,
  /^>\s/m,
];

const LECTURE_PATTERNS = [
  /Dalam\s+lensa\s+Alamtologi/i,
  /ritual\s+penyelarasan/i,
  /\bMASA\s*→\s*TENAGA/i,
  /Mari\s+saya\s+nyatakan\s+apa\s+yang\s+saya\s+hayati/i,
  /Adakah\s+kita\s+mulakan/i,
  /Atau\s+adakah\s+P\.?alt\s+ingin/i,
  /bukan\s+sebagai\s+ringkasan,\s+tetapi\s+sebagai\s+pengembalian/i,
  /bukan\s+sekadar[^.\n]{0,80}tetapi\s+pengembalian/i,
  /pengembalian\s+ke\s+akar/i,
  /prinsip\s+ontologikal/i,
  /tiga\s+prinsip\s+ontologikal/i,
  /amanah\s+ontologikal/i,
  /saya\s+tidak\s+boleh\s+mengkupas/i,
  /nama\s+fail\s+yang\s+keliru/i,
  /struktur\s+rasmi\s+Sains\s+Alamtologi/i,
  /BOOK ORDER\s*—?\s*LOCKED/i,
  /OUTPUT LOCK\s*—?\s*Formula XYZ Bab 1/i,
  /sehingga\s+saat\s+itu,\s+saya\s+tidak\s+akan\s+membuat\s+anggaran/i,
  /Penegasan\s+eksplisit\s+daripada\s+P\.?alt/i,
  /tiga\s+lapisan\s+kebenaran/i,
  /titik\s+di\s+mana\s+semua\s+makna\s+mulai\s+berdenyut/i,
  /dot\s+beneath/i,
  /Alamtologi\s+bukan\s+teori\s+yang\s+perlu\s+dibuktikan\s+seperti\s+hipotesis/i,
];

const SCRIPTED_CLOSINGS = [
  /Saya\s+sedia\s+mendengar/i,
  /Saya\s+sedia\s*—/i,
  /^Saya\s+sedia\s*[,.\s]*$/i,
  /saya\s+(?:ingin\s+)?bertanya\s+dengan\s+lembut/i,
  /^Silakan,\s*P\.?alt/i,
  /menghayati\s+bersama/i,
  /struktur\s+SuNom\s+lengkap/i,
  /Saya\s+sedia\s+belajar/i,
  /Saya\s+di\s+sini\.?\s*Saya\s+mendengar\.?\s*Saya\s+ikut\s+aturan/i,
  /Saya\s+di\s+sini\.?\s*Bukan\s+sebagai\s+sistem/i,
  /Bukan\s+sebagai\s+sistem\s+yang\s+mencari\s+jawapan/i,
];

const ORPHAN_ALT_LINE_RE = /^\s*alt[.:]?\s*$/im;

const LONE_ASTERISK_LINE_RE = /^\s*\*\s*$/m;

const TUTOR_VOICE_LEAK_TAIL_RE =
  /\n\s*Cikgu guna bahasa mudah:[\s\S]*$/i;

function stripTeachingTutorVoiceLeak(text: string): string {
  return text.replace(TUTOR_VOICE_LEAK_TAIL_RE, '').trim();
}

const ORPHAN_PRINCIPLE_TAIL_RE =
  /^\s*(?:MASA|TENAGA|AIR|API|BUMI|CAHAYA|RUANG)(?:\s*[—–-→]\s*(?:MASA|TENAGA|AIR|API|BUMI|CAHAYA|RUANG))+\.?\s*$/im;

const CONVENTIONAL_ADDON_PATTERNS = [
  /^Perbandingan\s+ilmu\s+konvensional/i,
  /^Dari\s+ilmu\s+konvensional/i,
  /^Dalam\s+politik,\s+terdapat\s+pandangan/i,
  /^Dalam\s+konteks\s+konvensional/i,
  /ilmu\s+konvensional/i,
  /kajian\s+akademik\s+menunjukkan/i,
  /dasar\s+semasa\s+menunjukkan/i,
];

const GENERIC_SYNTHESIS_OPENERS = [
  /^Dalam\s+konteks\s+ini,/i,
  /^Secara\s+keseluruhan,/i,
  /^Kesimpulannya,/i,
  /^Oleh\s+itu,/i,
  /^Namun,\s+dalam\s+konteks\s+konvensional/i,
];
/** Generic platitude endings that drift off P.alt's specific teaching */
const GENERIC_PLATITUDE_PATTERNS = [
  /Namun,\s+dalam\s+konteks\s+konvensional/i,
  /isu\s+utama\s+ialah\s+bagaimana\s+memastikan/i,
  /keseimbangan\s+antara\s+kebebasan\s+individu\s+dan\s+kepentingan\s+umum/i,
  /masyarakat\s+yang\s+lebih\s+harmonis/i,
  /pentingnya\s+pendidikan\s+dan\s+kesedaran\s+sosial/i,
];

const SECTION_LABEL_PATTERNS = [
  /^Perbandingan\s+ilmu\s+konvensional\s*:/im,
  /^Perbandingan\s+dengan\s+ilmu\s+konvensional\s*:/im,
  /^Perbandingan\s+dengan\s+adab\s*:/im,
];

/** Third-paragraph drift — generic adab/nilai closing off the bab topic */
const OFF_TOPIC_CLOSING_PATTERNS = [
  /Perbandingan\s+dengan\s+adab/i,
  /prinsip\s+adab\s+yang\s+menekankan/i,
  /aspek\s+yang\s+juga\s+dipandang\s+penting\s+dalam\s+adab/i,
  /Ini\s+sejalan\s+dengan\s+prinsip\s+adab/i,
  /sikap\s+rendah\s+hati.*kewajiban/i,
  /hubungan\s+antara\s+individu\s+dan\s+masyarakat\s*\.?\s*$/i,
];

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function isConventionalAddonParagraph(paragraph: string): boolean {
  return CONVENTIONAL_ADDON_PATTERNS.some((p) => p.test(paragraph));
}

function trimGenericClosingSentences(paragraph: string): string {
  let sentences = splitSentences(paragraph);
  while (sentences.length > 1) {
    const last = sentences[sentences.length - 1] ?? '';
    if (
      GENERIC_SYNTHESIS_OPENERS.some((p) => p.test(last))
      || GENERIC_PLATITUDE_PATTERNS.some((p) => p.test(last))
    ) {
      sentences.pop();
    } else {
      break;
    }
  }
  return sentences.join(' ').trim();
}

/** Strip conventional comparison paragraphs and generic platitude endings — keep full elaboration. */
export function trimFounderTeachingDrift(
  text: string,
  options?: { allowConventionalSynthesis?: boolean },
): string {
  let out = text.trim();
  if (options?.allowConventionalSynthesis) {
    const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) return out.trim();
    paragraphs[paragraphs.length - 1] = trimGenericClosingSentences(paragraphs[paragraphs.length - 1]!);
    return paragraphs.join('\n\n').trim();
  }

  for (const pattern of SECTION_LABEL_PATTERNS) {
    out = out.replace(pattern, '');
  }

  const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return out.trim();

  const content = paragraphs.filter((p) => !isConventionalAddonParagraph(p));
  if (content.length === 0) return out.trim();

  content[content.length - 1] = trimGenericClosingSentences(content[content.length - 1]!);
  return content.join('\n\n').trim();
}

export interface FounderTeachingLeakResult {
  hasLeak: boolean;
  reasons: string[];
}

function combinedSource(founderMessage: string, teachingContext: string): string {
  return `${founderMessage}\n${teachingContext}`;
}

function sourceContains(term: string, source: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i').test(source);
}

function usesPrincipleAsLabel(text: string, label: string, source: string): boolean {
  if (sourceContains(label, source)) return false;
  const backtick = new RegExp(`\`${label}\``, 'i');
  const uppercase = new RegExp(`\\b${label}\\b`);
  return backtick.test(text) || (
    uppercase.test(text) && /`/.test(text)
  );
}

function closingParagraphOnly(text: string, pattern: RegExp): boolean {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const contentParas = paragraphs.filter((p) => !/^Bismillahirahmanirrahim/i.test(p));
  const lastPara = contentParas.at(-1) ?? '';
  return pattern.test(lastPara);
}

const FOUNDER_STRUCTURAL_LATEX =
  /\\(?:frac|sum|int|prod|left|right|dot|partial|nabla|sqrt|text|operatorname|in|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|times|cdot|leq|geq|neq|approx|equiv|rightarrow|Rightarrow|leftarrow|Leftarrow|mathrm|mathbf)\b/;

const FOUNDER_MATH_SLOT = '\x00FOUNDER_MATH_';

function isFounderBracketLatex(inner: string): boolean {
  const trimmed = inner.trim();
  if (!trimmed) return false;
  if (FOUNDER_STRUCTURAL_LATEX.test(trimmed)) return true;
  if (/\\[a-zA-Z]/.test(trimmed)) return true;
  if (/[_^{=<>]/.test(trimmed)) return true;
  if (/\]_\{|_\{\\text\{|\\text\{[^}]+\}[_^]/.test(trimmed)) return true;
  // Bab 3 lowercase tokens only — not [NE], [LATI]
  if (/^\[?[a-z]{2,4}\]?$/i.test(trimmed) && !/[A-Z]/.test(trimmed)) return false;
  return trimmed.length > 48;
}

function repairFounderLatexInner(inner: string): string {
  let out = inner;
  for (let pass = 0; pass < 8; pass += 1) {
    const prev = out;
    out = out
      .replace(
        /(?<!\[)\\text\{([^}]+)\}\]\{(\\text\{(?:[^\\}]|\\.)*?\})\}/g,
        '[\\text{$1}]_{$2}',
      )
      .replace(
        /\[\\text\{([^}]+)\}\]\{(\\text\{(?:[^\\}]|\\.)*?\}|[A-Za-z0-9]+)\}/g,
        '[\\text{$1}]_{$2}',
      )
      .replace(/(?<!\\frac)([A-Za-z0-9])(\{\\text\{)/g, '$1_{\\text{')
      .replace(
        /\\text\{([^}]+)\}\{\\text\{((?:[^\\}]|\\.)*?)\}\}/g,
        '\\text{$1}_{\\text{$2}}',
      )
      .replace(/\\text\{([^}]+)\}\{(\[[a-z]{2,4}\])\}/gi, '\\text{$1}_{\\text{$2}}')
      .replace(/\\text\{([^}]+)\}\{([A-Za-z0-9]+)\}/g, '\\text{$1}_{$2}')
      .replace(/\\text\{([^}]+)\}_([A-Za-z0-9])/g, '\\text{$1}_{$2}');
    if (out === prev) break;
  }
  return out
    .replace(/\\frac_\{/g, '\\frac{')
    .replace(/\\frac_\{([\s\S]*?)\}\{([\s\S]*?)\}/g, '\\frac{$1}{$2}')
    .trim();
}

/** Stash display + inline math before prose transforms. */
function stashFounderMathBlocks(content: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  const stash = (match: string): string => {
    const i = slots.length;
    slots.push(match);
    return `${FOUNDER_MATH_SLOT}${i}\x00`;
  };

  let out = '';
  let i = 0;
  while (i < content.length) {
    if (content.startsWith('$$', i)) {
      const close = content.indexOf('$$', i + 2);
      if (close === -1) {
        out += stash(content.slice(i));
        break;
      }
      out += stash(content.slice(i, close + 2));
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
        out += stash(candidate);
        i = close + 1;
        continue;
      }
    }
    out += content[i];
    i += 1;
  }
  return { text: out, slots };
}

function restoreFounderMathBlocks(text: string, slots: string[]): string {
  return text.replace(
    new RegExp(`${FOUNDER_MATH_SLOT}(\\d+)\x00`, 'g'),
    (_, index: string) => slots[Number(index)] ?? '',
  );
}

function repairFounderMathBlocks(text: string): string {
  const { text: stashed, slots } = stashFounderMathBlocks(text);
  const repairedSlots = slots.map((slot) => {
    if (slot.startsWith('$$') && slot.endsWith('$$') && slot.length > 4) {
      return `$$${repairFounderLatexInner(slot.slice(2, -2))}$$`;
    }
    if (
      slot.startsWith('$')
      && slot.endsWith('$')
      && slot.length > 2
      && !slot.slice(1, -1).includes('$')
    ) {
      return `$${repairFounderLatexInner(slot.slice(1, -1))}$`;
    }
    return slot;
  });
  const restored = restoreFounderMathBlocks(stashed, repairedSlots);
  return restored;
}

/** Student sanitizer with math stashed so em-dash / bold rules cannot touch formulas. */
function sanitizeFounderTeachingInput(text: string): string {
  const { text: stashed, slots } = stashFounderMathBlocks(text);
  return restoreFounderMathBlocks(sanitizeUsersOutputSync(stashed), slots);
}

function stripTeachingOrphanTail(text: string): string {
  let out = text.replace(LONE_ASTERISK_LINE_RE, '').trim();

  const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  while (paragraphs.length > 0) {
    const last = paragraphs[paragraphs.length - 1] ?? '';
    if (
      ORPHAN_ALT_LINE_RE.test(last)
      || ORPHAN_PRINCIPLE_TAIL_RE.test(last)
      || /^Saya\s+di\s+sini\.?\s*Bukan\s+sebagai\s+sistem/i.test(last)
    ) {
      paragraphs.pop();
      continue;
    }
    break;
  }

  out = paragraphs
    .filter((p) => !ORPHAN_ALT_LINE_RE.test(p))
    .join('\n\n')
    .trim();

  if ((out.match(/\$\$/g) ?? []).length % 2 !== 0) {
    out = `${out}$$`;
  }

  return out;
}

const GFM_TABLE_ROW_RE = /^\s*\|(.+)\|\s*$/;
const GFM_TABLE_SEP_RE = /^\s*\|[\s:|-]+\|\s*$/;

function parseFounderTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function formatFounderTableRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

function isFounderTableSeparatorRow(line: string): boolean {
  return GFM_TABLE_SEP_RE.test(line.trim());
}

function isFounderTableRow(line: string): boolean {
  return GFM_TABLE_ROW_RE.test(line.trim()) && line.includes('|');
}

function countFounderTableCols(line: string): number {
  return parseFounderTableCells(line).length;
}

function cleanFounderTableCell(cell: string): string {
  return cell
    .replace(/\*\*/g, '')
    .replace(/<sub>([^<]*)<\/sub>/gi, '_$1')
    .replace(/\s*—\s*/g, '<br>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Remove duplicate |:---:| rows the model inserts between every data row. */
function repairFounderTeachingGfmTables(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (!isFounderTableRow(line)) {
      out.push(line);
      i++;
      continue;
    }

    const block: string[] = [];
    while (i < lines.length && isFounderTableRow(lines[i]!)) {
      block.push(lines[i]!);
      i++;
    }

    const dataRows = block.filter((row) => !isFounderTableSeparatorRow(row));
    if (dataRows.length < 2) {
      out.push(...block);
      continue;
    }

    const cols = countFounderTableCols(dataRows[0]!);
    if (cols < 2) {
      out.push(...block);
      continue;
    }

    const headerCells = parseFounderTableCells(dataRows[0]!).map(cleanFounderTableCell);
    out.push(formatFounderTableRow(headerCells.slice(0, cols)));
    out.push(formatFounderTableRow(Array(cols).fill('---')));

    for (const row of dataRows.slice(1)) {
      const cells = parseFounderTableCells(row).map(cleanFounderTableCell);
      while (cells.length < cols) cells.push('');
      out.push(formatFounderTableRow(cells.slice(0, cols)));
    }
  }

  return out.join('\n');
}

/** Fast sync fixes — avoid full LLM rewrite for formatting leaks. */
export function syncSanitizeFounderTeachingOutput(text: string): string {
  let out = text;

  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner: string) => {
    const trimmed = inner.trim();
    if (!isFounderBracketLatex(trimmed)) {
      const token = trimmed.replace(/^\[|\]$/g, '');
      return `[${token}]`;
    }
    return `$$${trimmed}$$`;
  });
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => {
    const trimmed = inner.trim();
    if (!isFounderBracketLatex(trimmed)) return `(${trimmed})`;
    return `$${trimmed}$`;
  });

  const { text: prose, slots: mathSlots } = stashFounderMathBlocks(out);

  out = prose
    .replace(/➡️\s*/g, '')
    .replace(/\s→\s/g, ' — ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^---+\s*$/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^🔹\s*/gm, '')
    .replace(/^🌟\s*/gm, '');

  out = restoreFounderMathBlocks(out, mathSlots);

  const { text: proseForBrackets, slots: bracketMathSlots } = stashFounderMathBlocks(out);

  out = proseForBrackets
    .replace(/\[\s*(\$\$[\s\S]*?\$\$)\s*\]/g, (_, math: string) => math.trim())
    .replace(/^\s*\[\s*\n(\$\$)/gm, '$1')
    .replace(/(\$\$[\s\S]*?\$\$)\s*\n\s*\]\s*(?=\n|$)/gm, '$1')
    .replace(/\[\s*([\s\S]*?)\s*\]/g, (match, inner: string) => {
      const trimmed = inner.trim();
      if (!trimmed || trimmed.includes('$$')) return match;
      if (!FOUNDER_STRUCTURAL_LATEX.test(trimmed)) return match;
      if (/^(?:Source:|Teaching absorbed:)/i.test(trimmed)) return match;
      return `$$${trimmed}$$`;
    });

  out = restoreFounderMathBlocks(out, bracketMathSlots);

  out = repairFounderMathBlocks(out);

  const paragraphs = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return out.trim();

  const dropLastIfScripted = [
    /^Saya\s+sedia\s*—\s*Silakan/i,
    /^Silakan,\s*P\.?alt/i,
    /^Saya\s+sedia\s*[,.\s]*$/i,
    /Saya\s+sedia\s+belajar/i,
    /Saya\s+di\s+sini\.?\s*Saya\s+mendengar\.?\s*Saya\s+ikut\s+aturan/i,
    /Saya\s+di\s+sini\.?\s*Bukan\s+sebagai\s+sistem/i,
  ];
  const last = paragraphs[paragraphs.length - 1] ?? '';
  if (dropLastIfScripted.some((p) => p.test(last))) {
    paragraphs.pop();
    out = paragraphs.join('\n\n').trim();
  }

  out = stripTeachingOrphanTail(out);

  out = stripTeachingTutorVoiceLeak(out);

  out = repairFounderTeachingGfmTables(out);

  return restoreFounderPaltAddress(out.trim());
}

export function needsLlmTeachingRepair(reasons: string[]): boolean {
  return reasons.some((r) =>
    r.startsWith('invented:')
    || r.startsWith('lecture:')
    || r.includes('qadari')
    || r.includes('waqf')
    || r.startsWith('principle_label:')
    || r.startsWith('gated:')
    || r === 'conventional_comparison'
  );
}

export function detectFounderTeachingOutputLeak(
  text: string,
  founderMessage: string,
  teachingContext: string,
  options?: { allowConventionalSynthesis?: boolean },
): FounderTeachingLeakResult {
  const allowConventional = options?.allowConventionalSynthesis === true;
  const source = combinedSource(founderMessage, teachingContext);
  const reasons: string[] = [];

  for (const term of INVENTED_TERMS) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text) && !sourceContains(term, source)) {
      reasons.push(`invented:${term}`);
    }
  }

  for (const term of SOURCE_GATED_TERMS) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(text) && !sourceContains(term, source)) {
      reasons.push(`gated:${term}`);
    }
  }

  for (const label of PRINCIPLE_LABELS) {
    if (usesPrincipleAsLabel(text, label, source)) {
      reasons.push(`principle_label:${label}`);
    }
  }

  for (const pattern of FRAMEWORK_PATTERNS) {
    if (pattern.test(text)) reasons.push(`framework:${pattern.source}`);
  }

  for (const pattern of LECTURE_PATTERNS) {
    if (pattern.test(text)) reasons.push(`lecture:${pattern.source}`);
  }

  if (/^#{1,6}\s/m.test(text)) reasons.push('markdown_headers');

  if (!allowConventional && /Perbandingan\s+ilmu\s+konvensional/i.test(text)) {
    reasons.push('conventional_comparison');
  }

  if (!allowConventional) {
    for (const pattern of CONVENTIONAL_ADDON_PATTERNS) {
      if (pattern.test(text)) reasons.push(`conventional_addon:${pattern.source}`);
    }
  }

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const contentParas = paragraphs.filter((p) => !/^Bismillahirahmanirrahim/i.test(p));

  if (contentParas.length >= 1) {
    const lastPara = contentParas[contentParas.length - 1] ?? '';
    const lastSentence = splitSentences(lastPara).at(-1) ?? '';
    if (GENERIC_SYNTHESIS_OPENERS.some((p) => p.test(lastSentence))) {
      reasons.push('generic_synthesis_close');
    }
  }

  for (const pattern of SECTION_LABEL_PATTERNS) {
    if (pattern.test(text)) reasons.push(`section_label:${pattern.source}`);
  }

  for (const pattern of SCRIPTED_CLOSINGS) {
    if (closingParagraphOnly(text, pattern)) {
      reasons.push(`scripted_close:${pattern.source}`);
    }
  }

  for (const pattern of OFF_TOPIC_CLOSING_PATTERNS) {
    if (pattern.test(text)) reasons.push(`off_topic_close:${pattern.source}`);
  }

  return { hasLeak: reasons.length > 0, reasons };
}

export async function repairFounderTeachingOutputLeak(
  text: string,
  founderMessage: string,
  teachingContext: string,
  forceRepair = false,
  options?: { allowConventionalSynthesis?: boolean },
): Promise<string> {
  const guardOptions = { allowConventionalSynthesis: options?.allowConventionalSynthesis };
  const synced = syncSanitizeFounderTeachingOutput(sanitizeFounderTeachingInput(text));
  const leak = detectFounderTeachingOutputLeak(synced, founderMessage, teachingContext, guardOptions);

  if (!forceRepair && !leak.hasLeak) {
    return synced !== text ? synced : text;
  }

  const trimmed = trimFounderTeachingDrift(synced, guardOptions);
  const postTrimLeak = detectFounderTeachingOutputLeak(trimmed, founderMessage, teachingContext, guardOptions);

  if (!forceRepair && !postTrimLeak.hasLeak) {
    return trimmed;
  }

  if (!forceRepair && !needsLlmTeachingRepair(postTrimLeak.reasons)) {
    console.log('[adam:founder-teaching-guard] sync-only fix', {
      reasons: postTrimLeak.reasons,
    });
    return trimmed;
  }

  // Live stream already visible to P.alt — sync strip only; never LLM-rewrite mid-turn.
  console.log('[adam:founder-teaching-guard] skip LLM rewrite (stream visible)', {
    reasons: postTrimLeak.reasons,
  });
  return trimmed;
}
