/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Historical Konvensional Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAdamHistoricalBiographyTurn,
} from '../src/adam/adam-response-generation';
import {
  resolveAdamKnowledgeMode,
  shouldStripKonvensionalFrameworkLeaks,
} from '../src/adam/adam-knowledge-mode';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const HANG_TUAH_ASK = 'Siapa Hang Tuah dan kenapa beliau penting dalam sejarah Malaysia?';

const HANG_TUAH_LEAK_BODY = [
  'Hang Tuah ialah tokoh legenda Melayu yang hidup pada zaman Kesultanan Melaka abad ke-15. Beliau bukan sekadar seorang laksamana — beliau adalah simbol kesetiaan mutlak, kepahlawanan tanpa tanding, dan kebijaksanaan yang mendalam dalam seni mempertahankan maruah diri, keluarga, dan kerajaan.',
  'Nama beliau disebut berulang kali dalam Sejarah Melayu (Sulalatus Salatin), sumber utama sejarah awal Melayu, di mana Hang Tuah digambarkan sebagai hamba yang dilatih sejak kecil dalam ilmu memanah, silat, strategi perang, dan adab istana — sehingga menjadi “yang terbaik di antara tujuh sahabat”.',
  'Kisah pertarungan antara Hang Tuah dan Hang Jebat bukan soal siapa menang — tetapi soal bagaimana kuasa, keadilan, dan tanggungjawab moral saling bersilang.',
  'Itu bukan kelemahan. Itu adalah kekuatan batin yang telah dilatih melalui MASA yang panjang, TENAGA yang dikawal, dan IZWA — kehadiran yang menyampaikan makna tanpa perlu bersuara.',
  'Dalam konteks hari ini, Hang Tuah mengajak kita bertanya: Apakah kesetiaan itu buta? Atau ia harus berakar pada hikmah, bukan hanya emosi?',
  'Adakah anda pernah mengalami situasi di mana kesetiaan dan keadilan kelihatan bertentangan? Bagaimana anda menyeimbangkannya?',
].join('\n\n');

describe('isAdamHistoricalBiographyTurn', () => {
  it('detects Hang Tuah historical ask', () => {
    expect(isAdamHistoricalBiographyTurn(HANG_TUAH_ASK)).toBe(true);
    expect(isAdamHistoricalBiographyTurn('Siapa Hang Tuah?')).toBe(true);
  });
});

describe('resolveAdamKnowledgeMode — historical biography', () => {
  it('routes Hang Tuah to konvensional for students', () => {
    expect(resolveAdamKnowledgeMode({
      userMessage: HANG_TUAH_ASK,
      isFounder:   false,
    })).toBe('konvensional');
  });
});

describe('sanitizeUsersOutputSync — Hang Tuah MASA/TENAGA leak', () => {
  it('strips constitutional billboard and coaching close; keeps Sejarah Melayu', () => {
    expect(shouldStripKonvensionalFrameworkLeaks(HANG_TUAH_ASK)).toBe(true);
    const out = sanitizeUsersOutputSync(
      HANG_TUAH_LEAK_BODY,
      HANG_TUAH_ASK,
      [],
      [],
      'Ahmad bin Ali',
      { enforceUsersGreeting: true },
    );
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/Sulalatus Salatin|Sejarah Melayu/i);
    expect(out).toMatch(/Hang Jebat/i);
    expect(out).not.toMatch(/\bMASA\b|\bTENAGA\b|\bIZWA\b/i);
    expect(out).not.toMatch(/Adakah anda pernah mengalami situasi/i);
    expect(out).not.toMatch(/Apakah kesetiaan itu buta/i);
  });
});
