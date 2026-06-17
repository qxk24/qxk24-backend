/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Market Pricing Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildGoldStandardFollowUpQuestion,
  normalizeGoldStandardFollowUpClosing,
} from '../src/adam/adam-gold-standard';
import {
  buildMarketPricingSynthesisInstruction,
  isAdamMarketPricingTurn,
  userMessagePrefersBahasaMalaysia,
} from '../src/adam/adam-market-pricing';

const BOOK_PRICING_ASK =
  'boleh berikan standard harga terkini untuk servis editing reka bentuk teks buku?';

describe('adam-market-pricing', () => {
  it('detects Malaysian book editing market pricing asks', () => {
    expect(isAdamMarketPricingTurn(BOOK_PRICING_ASK)).toBe(true);
    expect(isAdamMarketPricingTurn('Berapa pelajar KPTM?')).toBe(false);
  });

  it('prefers BM closing for boleh/berikan/harga questions', () => {
    expect(userMessagePrefersBahasaMalaysia(BOOK_PRICING_ASK)).toBe(true);
    expect(buildGoldStandardFollowUpQuestion(BOOK_PRICING_ASK)).toBe(
      'Mahu saya jelaskan lebih lanjut?',
    );
  });

  it('rewrites English closing to BM when user wrote BM', () => {
    const raw = 'Some answer.\n\nWould you like me to explain further?';
    const fixed = normalizeGoldStandardFollowUpClosing(raw, BOOK_PRICING_ASK);
    expect(fixed).toContain('Mahu saya jelaskan lebih lanjut?');
    expect(fixed).not.toContain('Would you like me to explain further?');
  });

  it('market pricing synthesis forbids verified-opener template', () => {
    const block = buildMarketPricingSynthesisInstruction(BOOK_PRICING_ASK, [], '');
    expect(block).toMatch(/MARKET PRICING — MALAYSIA/i);
    expect(block).toMatch(/NOT "\(verified via web search/i);
    expect(block).toMatch(/RM range TABLE/i);
  });
});
