/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Commission Export
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { NiagaLedgerType } from './niaga-payment-ledger.schema';
import { NiagaPaymentLedgerModel } from './niaga-payment-ledger.schema';

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportNiagaCommissionCsv(options?: {
  channelCode?: string;
  monthKey?:    string;
}): Promise<string> {
  const filter: Record<string, unknown> = {
    type: NiagaLedgerType.PARTNER_COMMISSION,
  };
  if (options?.channelCode) {
    filter.channelCode = options.channelCode.trim().toUpperCase();
  }

  const rows = await NiagaPaymentLedgerModel.find(filter)
    .sort({ recordedAt: -1 })
    .limit(5000)
    .lean();

  const monthKey = options?.monthKey?.trim();
  const filtered = monthKey
    ? rows.filter((r) => {
        const mk = r.recordedAt.toISOString().slice(0, 7);
        return mk === monthKey;
      })
    : rows;

  const header = 'ledgerId,channelCode,userId,amountMyr,recordedAt,note';
  const lines = filtered.map((r) => [
    csvEscape(r.ledgerId),
    csvEscape(r.channelCode),
    csvEscape(r.userId),
    csvEscape(r.amountMyr),
    csvEscape(r.recordedAt.toISOString()),
    csvEscape(r.note),
  ].join(','));

  return [header, ...lines].join('\n');
}

export async function exportNiagaAdminLedgerCsv(): Promise<string> {
  const rows = await NiagaPaymentLedgerModel.find()
    .sort({ recordedAt: -1 })
    .limit(5000)
    .lean();

  const header = 'ledgerId,type,channelCode,userId,amountMyr,recordedAt,note';
  const lines = rows.map((r) => [
    csvEscape(r.ledgerId),
    csvEscape(r.type),
    csvEscape(r.channelCode),
    csvEscape(r.userId),
    csvEscape(r.amountMyr),
    csvEscape(r.recordedAt.toISOString()),
    csvEscape(r.note),
  ].join(','));

  return [header, ...lines].join('\n');
}
