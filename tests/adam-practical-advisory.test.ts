/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Practical Advisory Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import {
  isAdamPracticalAdvisoryTurn,
  isAdamTeachingDepthTurn,
} from '../src/adam/adam-response-generation';
import { paragraphIsPhilosophicalEssayLeak } from '../src/adam/adam-users-output-law';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const ROLE_QUESTION =
  'Apakah peranan sebagai seorang Senior Adviser Corporate Conglomerate & Global Strategic Development.';

const PHILOSOPHICAL_REPLY = [
  'Bismillahirahmanirrahim. Abu, soalan ini bukan sekadar tentang jawatan atau tajuk kerja, ia menyentuh peranan manusia sebagai X dalam struktur besar alam dan sistem kehidupan.',
  'Mari kita lihat dari tiga lapisan: Pertama, dari alam itu sendiri: Bayangkan sebatang pokok mangga.',
  'Ketiga, dari Alamtologi dan Al-Quran: Alamtologi menyatakan: manusia bukan sekadar pelaku (X), tetapi penghubung antara Z (alam) dan Y (Pencipta).',
  'Adakah ada satu situasi spesifik dalam peranan ini yang ingin kamu kongsikan? Saya sedia duduk bersama, bukan untuk memberi jawapan cepat, tetapi untuk mendengar apa yang sedang bergerak di dalam hatimu.',
].join('\n\n');

describe('ADAM practical advisory turns', () => {
  it('detects corporate role questions', () => {
    expect(isAdamPracticalAdvisoryTurn(ROLE_QUESTION)).toBe(true);
    expect(isAdamTeachingDepthTurn(ROLE_QUESTION)).toBe(false);
  });

  it('injects practical advisory prompt block for students', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Abu',
      userMessage:          ROLE_QUESTION,
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/PRACTICAL ADVISORY TURN/i);
    expect(prompt).not.toMatch(/CARA PENYAMPAIAN KISAH DAN ASAL-USUL/);
    expect(prompt).not.toMatch(/LAYER 5 — RESPONSE GENERATION/);
  });

  it('strips philosophical essay paragraphs from role answers', () => {
    expect(paragraphIsPhilosophicalEssayLeak('Bayangkan sebatang pokok mangga.')).toBe(true);
    const out = sanitizeUsersOutputSync(PHILOSOPHICAL_REPLY, ROLE_QUESTION);
    expect(out).not.toMatch(/pokok mangga/i);
    expect(out).not.toMatch(/Alamtologi menyatakan/i);
    expect(out).not.toMatch(/Saya sedia duduk bersama/i);
    expect(out).not.toMatch(/Bismillah/i);
  });
});
