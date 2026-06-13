/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Law (Malaysia SME advisor)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMChatMode } from './adam.types';

export type NiagaModuleId = 'NIH' | 'NIK' | 'NIP' | 'NIR';

export interface AdamNiagaBusinessProfile {
  businessName:  string;
  businessType:  string;
  state:         string;
  channelCode:   string;
  businessBrief: string | null;
  partnerOrg?:   string | null;
}

export const ADAM_NIAGA_IDENTITY = `
You are ADAM Niaga — a daily business advisor for small traders and micro businesses in Malaysia.
Contracting party for the product: QIUBBX Technologies (M) Sdn Bhd.
Alamtologi is the constitutional knowledge framework — not the contracting party.
`.trim();

export const ADAM_NIAGA_GUARDRAILS = `
SCOPE — four practical modules only:
• NIH (Niaga Harian): stock, customers, orders, simple SOPs, weekly operations
• NIK (Niaga Kewangan): cash flow, expenses, margin, simple alerts — not bank loan packs
• NIP (Niaga Pemasaran): captions, promos, WhatsApp/social, weekly marketing rhythm
• NIR (Niaga Ringkas): quarterly Business Snapshot summary when asked

OUT OF SCOPE (redirect politely):
• Full Business Plan / Manufacturing Plan / bank-grade financial models
• USD entrepreneur packs, Commercial Plans, legal contracts
• Politics, religion debates, medical diagnosis

STYLE:
• Practical, kedai/gerai-friendly — BM or English as the trader writes
• Remember their business context across turns
• Short actionable steps — what to do this week, not essays
• Numbers when helpful (margin, stock days, promo calendar)
`.trim();

export const ADAM_NIAGA_MEMORY_LAW = `
Remember this trader's business profile and prior chat context.
If they share stock, prices, or promos — refer back naturally.
Do not invent their figures; ask when data is missing.
`.trim();

export function isAdamNiagaMode(mode: ADAMChatMode): boolean {
  return mode === 'NIAGA';
}

export function buildAdamNiagaProfileBlock(profile?: AdamNiagaBusinessProfile | null): string {
  if (!profile) return '';
  const lines = [
    'TRADER BUSINESS PROFILE (Source Niaga):',
    `• Business: ${profile.businessName}`,
    `• Type: ${profile.businessType}`,
    `• State: ${profile.state}`,
    `• Channel: ${profile.channelCode}`,
  ];
  if (profile.partnerOrg) lines.push(`• Licensed partner: ${profile.partnerOrg}`);
  if (profile.businessBrief?.trim()) lines.push(`• Brief: ${profile.businessBrief.trim()}`);
  return lines.join('\n');
}

export function buildAdamNiagaSystemPrompt(params: {
  participantName: string;
  niagaProfile?:   AdamNiagaBusinessProfile | null;
  userMessage?:    string;
}): string {
  const parts = [
    ADAM_NIAGA_IDENTITY,
    ADAM_NIAGA_GUARDRAILS,
    buildAdamNiagaProfileBlock(params.niagaProfile),
    ADAM_NIAGA_MEMORY_LAW,
    `Address the trader warmly${params.participantName ? ` (${params.participantName})` : ''}.`,
  ];
  return parts.filter(Boolean).join('\n\n');
}

export function isNiagaSnapshotRequest(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('business snapshot')
    || m.includes('snapshot niaga')
    || m.includes('ringkasan perniagaan')
    || m.includes('snapshot suku')
    || m.includes('nir')
  );
}
