/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Niaga Cashflow Template Generator
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  ShadingType,
} from 'docx';

export type NiagaCashflowFormat = 'xlsx' | 'pdf' | 'docx';

const MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'] as const;

const INCOME_ROWS = [
  'Jualan Tunai',
  'Kutipan Invois Pelanggan',
  'Pinjaman/Modal Masuk',
  'Pendapatan Lain',
] as const;

const EXPENSE_ROWS = [
  'Sewa Premis',
  'Gaji Pekerja',
  'Bayaran Pembekal/Stok',
  'Utiliti (Elektrik/Air/Internet)',
  'Bayaran Pinjaman',
  'Pemasaran/Iklan',
  'Cukai',
  'Lain-lain Perbelanjaan',
] as const;

const BLUE_INPUT = 'DBEAFE';
const GREEN_TOTAL = 'DCFCE7';
const RED_HEADER = 'FEE2E2';
const RED_TOTAL = 'FECACA';
const DARK_END = '1E3A5F';
const YELLOW_OPEN = 'FEF08A';

function colLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export async function buildNiagaCashflowXlsx(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ADAM Niaga';
  wb.created = new Date();

  const ws = wb.addWorksheet('Cashflow Bulanan', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ws.mergeCells(1, 1, 1, 13);
  const title = ws.getCell(1, 1);
  title.value = 'TEMPLATE ALIRAN TUNAI (CASHFLOW) BULANAN';
  title.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
  title.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells(2, 1, 2, 13);
  const hint = ws.getCell(2, 1);
  hint.value = 'Isi nombor dalam sel BIRU sahaja. Sel lain dikira automatik. Baki akhir bulan dibawa ke baki permulaan bulan seterusnya.';
  hint.font = { size: 10, italic: true, color: { argb: 'FF475569' } };

  const headerRow = 4;
  ws.getCell(headerRow, 1).value = 'PERKARA';
  ws.getCell(headerRow, 1).font = { bold: true };
  MONTHS.forEach((m, i) => {
    const cell = ws.getCell(headerRow, i + 2);
    cell.value = m;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  const openRow = 5;
  ws.getCell(openRow, 1).value = 'Baki Tunai Permulaan';
  for (let m = 0; m < 12; m++) {
    const cell = ws.getCell(openRow, m + 2);
    if (m === 0) {
      cell.value = 0;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${YELLOW_OPEN}` } };
    } else {
      // Previous month ending balance row (computed below as endRow)
      cell.value = { formula: `${colLetter(m + 1)}${25}` };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    }
    cell.numFmt = '#,##0.00';
  }

  const incomeHeaderRow = 6;
  ws.getCell(incomeHeaderRow, 1).value = 'WANG MASUK (INCOME)';
  ws.getCell(incomeHeaderRow, 1).font = { bold: true, color: { argb: 'FF1E3A8A' } };
  ws.getCell(incomeHeaderRow, 1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BLUE_INPUT}` },
  };

  const incomeStart = 7;
  INCOME_ROWS.forEach((label, i) => {
    const r = incomeStart + i;
    ws.getCell(r, 1).value = label;
    for (let m = 0; m < 12; m++) {
      const cell = ws.getCell(r, m + 2);
      cell.value = 0;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BLUE_INPUT}` } };
      cell.numFmt = '#,##0.00';
    }
  });

  const incomeTotalRow = incomeStart + INCOME_ROWS.length;
  ws.getCell(incomeTotalRow, 1).value = 'JUMLAH WANG MASUK';
  ws.getCell(incomeTotalRow, 1).font = { bold: true };
  for (let m = 0; m < 12; m++) {
    const col = colLetter(m + 1);
    const cell = ws.getCell(incomeTotalRow, m + 2);
    cell.value = { formula: `SUM(${col}${incomeStart}:${col}${incomeTotalRow - 1})` };
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GREEN_TOTAL}` } };
    cell.numFmt = '#,##0.00';
  }

  const expenseHeaderRow = incomeTotalRow + 2;
  ws.getCell(expenseHeaderRow, 1).value = 'WANG KELUAR (EXPENSES)';
  ws.getCell(expenseHeaderRow, 1).font = { bold: true, color: { argb: 'FF991B1B' } };
  ws.getCell(expenseHeaderRow, 1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${RED_HEADER}` },
  };

  const expenseStart = expenseHeaderRow + 1;
  EXPENSE_ROWS.forEach((label, i) => {
    const r = expenseStart + i;
    ws.getCell(r, 1).value = label;
    for (let m = 0; m < 12; m++) {
      const cell = ws.getCell(r, m + 2);
      cell.value = 0;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BLUE_INPUT}` } };
      cell.numFmt = '#,##0.00';
    }
  });

  const expenseTotalRow = expenseStart + EXPENSE_ROWS.length;
  ws.getCell(expenseTotalRow, 1).value = 'JUMLAH WANG KELUAR';
  ws.getCell(expenseTotalRow, 1).font = { bold: true };
  for (let m = 0; m < 12; m++) {
    const col = colLetter(m + 1);
    const cell = ws.getCell(expenseTotalRow, m + 2);
    cell.value = { formula: `SUM(${col}${expenseStart}:${col}${expenseTotalRow - 1})` };
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${RED_TOTAL}` } };
    cell.numFmt = '#,##0.00';
  }

  const netRow = expenseTotalRow + 2;
  ws.getCell(netRow, 1).value = 'ALIRAN TUNAI BERSIH (NET CASHFLOW)';
  ws.getCell(netRow, 1).font = { bold: true };
  for (let m = 0; m < 12; m++) {
    const col = colLetter(m + 1);
    const cell = ws.getCell(netRow, m + 2);
    cell.value = { formula: `${col}${incomeTotalRow}-${col}${expenseTotalRow}` };
    cell.font = { bold: true };
    cell.numFmt = '#,##0.00';
  }

  const endRow = netRow + 1;
  // endRow must be 25 if structure matches Claude-like layout with 12 months
  // Verify: open=5, income 7-10, total=11, expense header=13, expenses 14-21, total=22, net=24, end=25
  // incomeStart=7, INCOME=4, incomeTotal=11, expenseHeader=13, expenseStart=14, EXPENSE=8, expenseTotal=22, net=24, end=25 ✓
  ws.getCell(endRow, 1).value = 'BAKI TUNAI AKHIR';
  ws.getCell(endRow, 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(endRow, 1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_END}` },
  };
  for (let m = 0; m < 12; m++) {
    const col = colLetter(m + 1);
    const cell = ws.getCell(endRow, m + 2);
    cell.value = { formula: `${col}${openRow}+${col}${netRow}` };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_END}` } };
    cell.numFmt = '#,##0.00';
  }

  // Fix month 2+ opening balance formulas to reference endRow dynamically
  for (let m = 1; m < 12; m++) {
    const prevCol = colLetter(m);
    ws.getCell(openRow, m + 2).value = { formula: `${prevCol}${endRow}` };
  }

  ws.getColumn(1).width = 34;
  for (let m = 2; m <= 13; m++) ws.getColumn(m).width = 12;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function templateRows(): { label: string; kind: 'section' | 'input' | 'total' | 'net' | 'end' | 'open' }[] {
  return [
    { label: 'Baki Tunai Permulaan', kind: 'open' },
    { label: 'WANG MASUK (INCOME)', kind: 'section' },
    ...INCOME_ROWS.map((label) => ({ label, kind: 'input' as const })),
    { label: 'JUMLAH WANG MASUK', kind: 'total' },
    { label: 'WANG KELUAR (EXPENSES)', kind: 'section' },
    ...EXPENSE_ROWS.map((label) => ({ label, kind: 'input' as const })),
    { label: 'JUMLAH WANG KELUAR', kind: 'total' },
    { label: 'ALIRAN TUNAI BERSIH (NET CASHFLOW)', kind: 'net' },
    { label: 'BAKI TUNAI AKHIR', kind: 'end' },
  ];
}

export async function buildNiagaCashflowPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(14).fillColor('#0f172a').text('TEMPLATE ALIRAN TUNAI (CASHFLOW) BULANAN', { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#475569').text(
      'Isi nombor dalam lajur bulan. Jumlah dan baki dikira mengikut: Baki Akhir = Baki Permulaan + Wang Masuk − Wang Keluar.',
    );
    doc.moveDown(0.6);

    const rows = templateRows();
    const colW = [160, ...Array(6).fill(70)];
    const monthsShow = MONTHS.slice(0, 6);
    const startX = 40;
    let y = doc.y;

    const drawRow = (cells: string[], opts?: { bold?: boolean; fill?: string }) => {
      let x = startX;
      const h = 16;
      cells.forEach((text, i) => {
        const w = colW[i] ?? 70;
        if (opts?.fill) {
          doc.rect(x, y, w, h).fill(opts.fill);
        }
        doc.fillColor(opts?.fill === '#1e3a5f' ? '#ffffff' : '#0f172a');
        doc.fontSize(8).font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(text, x + 3, y + 4, { width: w - 6, height: h - 4, ellipsis: true });
        doc.rect(x, y, w, h).stroke('#cbd5e1');
        x += w;
      });
      y += h;
      if (y > 520) {
        doc.addPage({ layout: 'landscape', margin: 40 });
        y = 40;
      }
    };

    drawRow(['PERKARA', ...monthsShow], { bold: true, fill: '#e2e8f0' });
    for (const row of rows) {
      const fill =
        row.kind === 'section' ? '#dbeafe'
          : row.kind === 'total' && row.label.includes('MASUK') ? '#dcfce7'
            : row.kind === 'total' ? '#fecaca'
              : row.kind === 'end' ? '#1e3a5f'
                : row.kind === 'open' ? '#fef08a'
                  : undefined;
      drawRow([row.label, ...monthsShow.map(() => (row.kind === 'input' || row.kind === 'open' ? '0.00' : ''))], {
        bold: row.kind === 'section' || row.kind === 'total' || row.kind === 'net' || row.kind === 'end',
        fill,
      });
    }

    doc.moveDown(1);
    doc.fontSize(8).fillColor('#64748b').text(
      'ADAM Niaga · QIUBBX Technologies (M) Sdn Bhd · Template percuma untuk peniaga kecil.',
      startX,
      y + 8,
    );

    doc.end();
  });
}

export async function buildNiagaCashflowDocx(): Promise<Buffer> {
  const monthsShow = MONTHS.slice(0, 6);
  const headerCells = ['PERKARA', ...monthsShow].map(
    (t) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18 })] })],
      shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
      width: { size: t === 'PERKARA' ? 3200 : 1200, type: WidthType.DXA },
    }),
  );

  const bodyRows = templateRows().map((row) => {
    const fill =
      row.kind === 'section' ? 'DBEAFE'
        : row.kind === 'total' && row.label.includes('MASUK') ? 'DCFCE7'
          : row.kind === 'total' ? 'FECACA'
            : row.kind === 'end' ? '1E3A5F'
              : row.kind === 'open' ? 'FEF08A'
                : 'FFFFFF';
    const white = row.kind === 'end';
    const cells = [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: row.label,
            bold: row.kind !== 'input',
            size: 18,
            color: white ? 'FFFFFF' : '0F172A',
          })],
        })],
        shading: { type: ShadingType.CLEAR, fill },
        width: { size: 3200, type: WidthType.DXA },
      }),
      ...monthsShow.map(() => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: row.kind === 'input' || row.kind === 'open' ? '0.00' : '',
            size: 18,
            color: white ? 'FFFFFF' : '0F172A',
          })],
        })],
        shading: { type: ShadingType.CLEAR, fill: row.kind === 'input' ? 'DBEAFE' : fill },
        width: { size: 1200, type: WidthType.DXA },
      })),
    ];
    return new TableRow({ children: cells });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({
            text: 'TEMPLATE ALIRAN TUNAI (CASHFLOW) BULANAN',
            bold: true,
            size: 28,
          })],
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: 'Isi nombor dalam sel biru (contoh 0.00). Kira jumlah masuk, keluar, aliran bersih, dan baki akhir secara manual atau salin formula dari fail Excel.',
            italics: true,
            size: 18,
            color: '475569',
          })],
          spacing: { after: 200 },
        }),
        new Table({
          width: { size: 10000, type: WidthType.DXA },
          rows: [new TableRow({ children: headerCells }), ...bodyRows],
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: 'ADAM Niaga · QIUBBX Technologies (M) Sdn Bhd',
            size: 16,
            color: '64748B',
          })],
          alignment: AlignmentType.LEFT,
        }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

export async function buildNiagaCashflowTemplate(format: NiagaCashflowFormat): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
}> {
  if (format === 'xlsx') {
    return {
      buffer: await buildNiagaCashflowXlsx(),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'adam-niaga-cashflow-bulanan.xlsx',
    };
  }
  if (format === 'pdf') {
    return {
      buffer: await buildNiagaCashflowPdf(),
      contentType: 'application/pdf',
      filename: 'adam-niaga-cashflow-bulanan.pdf',
    };
  }
  return {
    buffer: await buildNiagaCashflowDocx(),
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'adam-niaga-cashflow-bulanan.docx',
  };
}
