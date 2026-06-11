/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Markdown Export Blocks
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 */

export type ExportBlock =
  | { type: 'heading'; text: string; level: number }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'answer'; text: string };

const TABLE_ROW = /^\s*\|(.+)\|\s*$/;

function isTableRow(line: string): boolean {
  return TABLE_ROW.test(line.trim());
}

function isTableSeparatorRow(line: string): boolean {
  const cells = parseTableRow(line);
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c.trim()));
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

export function stripAdamExportMetadata(text: string): string {
  return text
    .replace(/<adam_[^>]+>[\s\S]*?<\/adam_[^>]+>/gi, '')
    .replace(/═══ FOUNDER TEACHING DATA[\s\S]*?═══ END FOUNDER TEACHING DATA ═══/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

export function parseMarkdownExportBlocks(raw: string): ExportBlock[] {
  const lines = stripAdamExportMetadata(raw).split('\n');
  const blocks: ExportBlock[] = [];
  let paragraphBuffer: string[] = [];
  let i = 0;

  const flushParagraph = (): void => {
    const text = paragraphBuffer.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraphBuffer = [];
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      flushParagraph();
      i++;
      continue;
    }

    if (isTableRow(line)) {
      flushParagraph();
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const parsed = tableLines
        .filter((row) => !isTableSeparatorRow(row))
        .map(parseTableRow);
      if (parsed.length > 0) {
        blocks.push({
          type:    'table',
          headers: parsed[0],
          rows:    parsed.slice(1),
        });
      }
      continue;
    }

    if (/^→|^->/.test(line)) {
      flushParagraph();
      blocks.push({ type: 'answer', text: line });
      i++;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        blocks.push({ type: 'heading', level: match[1].length, text: match[2].trim() });
      }
      i++;
      continue;
    }

    paragraphBuffer.push(line);
    i++;
  }

  flushParagraph();
  return blocks;
}

/** Split **bold** segments for rich text export. */
export function parseInlineBoldSegments(text: string): Array<{ text: string; bold: boolean }> {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  if (parts.length === 0) return [{ text, bold: false }];

  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return { text: part.slice(2, -2), bold: true };
    }
    return { text: part, bold: false };
  });
}
