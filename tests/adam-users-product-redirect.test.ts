/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Users Product Redirect Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { outputHasAdamProductRedirectLeak } from '../src/adam/adam-response-generation';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const LAYER2_REDIRECT_LEAK = [
  'QA Unlimited, permintaan anda memerlukan ADAM Buku — server output profesional ADAM.',
  'Server ini sedang dalam ujian dalaman dan akan dibuka selepas ujian penuh selesai.',
  'Buat masa ini, pada Lapisan 1 saya hanya boleh berbincang dan menjawab soalan dengan anda. Lihat pelan di /plans.',
].join('\n\n');

describe('Users channel — Layer 2 product redirect', () => {
  it('detects single-newline redirect block', () => {
    const singleLine = LAYER2_REDIRECT_LEAK.replace(/\n\n/g, '\n');
    expect(outputHasAdamProductRedirectLeak(singleLine)).toBe(true);
  });

  it('sanitize strips redirect for Users channel', () => {
    const out = sanitizeUsersOutputSync(
      LAYER2_REDIRECT_LEAK,
      'Boleh bantu penulisan buku Mencari Damai?',
      ['Boleh bantu penulisan buku Mencari Damai?'],
    );
    expect(outputHasAdamProductRedirectLeak(out)).toBe(false);
    expect(out).toMatch(/merancang buku|tema|bab/i);
  });

  it('display merge prefers repaired surface over streamed redirect', () => {
    const repaired = sanitizeUsersOutputSync(
      LAYER2_REDIRECT_LEAK,
      'Boleh bantu penulisan buku?',
      [],
    );
    const saved = resolveAdamTurnDisplayForSave(LAYER2_REDIRECT_LEAK, repaired, {
      adamProductRedirectRepair: true,
    });
    expect(outputHasAdamProductRedirectLeak(saved)).toBe(false);
    expect(saved).toBe(repaired);
  });

  it('display merge auto-accepts when raw has leak and repaired does not', () => {
    const repaired = sanitizeUsersOutputSync(LAYER2_REDIRECT_LEAK, 'Apa itu fotosintesis?', []);
    const saved = resolveAdamTurnDisplayForSave(LAYER2_REDIRECT_LEAK, repaired);
    expect(outputHasAdamProductRedirectLeak(saved)).toBe(false);
  });
});
