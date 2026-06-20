/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Web Search Gate Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAdamBookWritingDiscussionTurn,
  isAdamLayer1ManuscriptExportTurn,
  isAdamLayer1WritingChatTurn,
  isAdamUserCoachingHelpTurn,
} from '../src/adam/adam-response-generation';
import { getWebSearchGateReason } from '../src/adam/adam-web-search';
import { shouldUsersUseSearchFirstFlow } from '../src/adam/adam-search-first';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const BOOK_WRITING_ASK =
  'Boleh bantu saya untuk penulisan buku? Tajuk buku "Mencari Damai"';

const BUSINESS_HELP_ASK = 'Saya perlu bantuan anda untuk berniaga';

const MANUSCRIPT_EXPORT_ASK = 'Tuliskan bab 1 manuskrip buku saya penuh';

const USER_UMUM = { userUmumChannelGate: true as const };

describe('Layer 1 book writing routing', () => {
  it('detects business coaching help', () => {
    expect(isAdamUserCoachingHelpTurn(BUSINESS_HELP_ASK)).toBe(true);
  });

  it('classifies brainstorming ask as discussion, not manuscript export', () => {
    expect(isAdamBookWritingDiscussionTurn(BOOK_WRITING_ASK)).toBe(true);
    expect(isAdamLayer1ManuscriptExportTurn(BOOK_WRITING_ASK)).toBe(false);
    expect(isAdamLayer1WritingChatTurn(BOOK_WRITING_ASK)).toBe(true);
  });

  it('classifies explicit chapter draft as manuscript export', () => {
    expect(isAdamLayer1ManuscriptExportTurn(MANUSCRIPT_EXPORT_ASK)).toBe(true);
    expect(isAdamBookWritingDiscussionTurn(MANUSCRIPT_EXPORT_ASK)).toBe(false);
  });

  it('does not flag general science explain asks as layer-1 writing', () => {
    expect(isAdamLayer1WritingChatTurn('Apa itu fotosintesis?')).toBe(false);
  });
});

describe('getWebSearchGateReason — User umum channel', () => {
  it('skips web search on book writing brainstorm', () => {
    expect(getWebSearchGateReason(BOOK_WRITING_ASK, USER_UMUM)).toBeNull();
    expect(
      shouldUsersUseSearchFirstFlow(false, getWebSearchGateReason(BOOK_WRITING_ASK, USER_UMUM)),
    ).toBe(false);
  });

  it('skips web search on business coaching help', () => {
    expect(getWebSearchGateReason(BUSINESS_HELP_ASK, USER_UMUM)).toBeNull();
    expect(
      shouldUsersUseSearchFirstFlow(false, getWebSearchGateReason(BUSINESS_HELP_ASK, USER_UMUM)),
    ).toBe(false);
  });

  it('skips web search on personal guidance coaching (sekarang is not current affairs)', () => {
    const guidance = 'Apa yang perlu saya buat sekarang?';
    expect(getWebSearchGateReason(guidance, USER_UMUM)).toBeNull();
    expect(
      shouldUsersUseSearchFirstFlow(false, getWebSearchGateReason(guidance, USER_UMUM)),
    ).toBe(false);
  });

  it('skips web search on perinci laksanakan coaching', () => {
    const msg = 'Saya perlukan perinci nak laksanakan';
    expect(getWebSearchGateReason(msg, USER_UMUM)).toBeNull();
  });

  it('still searches on real current affairs ask', () => {
    expect(getWebSearchGateReason('Siapa presiden sekarang?', USER_UMUM)).toBe('current_affairs');
  });

  it('skips web search on pedagogy and curriculum concepts', () => {
    expect(getWebSearchGateReason('Apa itu KBAT?', USER_UMUM)).toBeNull();
    expect(getWebSearchGateReason('Terangkan taksonomi Bloom.', USER_UMUM)).toBeNull();
    expect(
      shouldUsersUseSearchFirstFlow(false, getWebSearchGateReason('Apa itu KBAT?', USER_UMUM)),
    ).toBe(false);
  });

  it('skips web search on stable textbook explain asks', () => {
    expect(getWebSearchGateReason('Apa itu fotosintesis?', USER_UMUM)).toBeNull();
    expect(
      shouldUsersUseSearchFirstFlow(
        false,
        getWebSearchGateReason('Apa itu fotosintesis?', USER_UMUM),
      ),
    ).toBe(false);
  });

  it('legacy path without userUmumChannelGate skips blanket substantive search', () => {
    expect(getWebSearchGateReason('Apa itu fotosintesis?')).toBeNull();
    expect(getWebSearchGateReason('Terangkan kenapa manusia perlu tidur setiap malam')).toBeNull();
  });

  it('Fasa 1: skips search on single-token curriculum topics (V-M02a, V-GEO02a, V-X01)', () => {
    for (const msg of ['Algebra', 'Laut Mati', 'straight', 'Fibonacci', 'AI']) {
      expect(getWebSearchGateReason(msg, USER_UMUM)).toBeNull();
      expect(shouldUsersUseSearchFirstFlow(false, getWebSearchGateReason(msg, USER_UMUM))).toBe(false);
    }
  });

  it('Fasa 1: still searches on explicit freshness override', () => {
    expect(getWebSearchGateReason('Algebra latest study 2025', USER_UMUM)).toBe('explicit_search');
  });
});

describe('prompt builder — book writing discussion overlay', () => {
  it('injects book discussion turn, not manuscript export redirect', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: BOOK_WRITING_ASK,
      participantName: 'QA Unlimited',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain('BOOK WRITING (this turn)');
    expect(prompt).toContain('FORMAL / ILMIAH');
    expect(prompt).toContain('FORBIDDEN: ADAM Jurnal');
    expect(prompt).not.toContain('MANUSCRIPT EXPORT (this turn)');
  });

  it('injects book discussion on thread follow-up (perinci laksanakan)', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: 'Saya perlukan perinci nak laksanakan',
      recentUserMessages: ['Boleh bantu saya untuk penulisan buku? Tajuk "Mencari Damai"'],
      participantName: 'QA Unlimited',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain('BOOK WRITING (this turn)');
    expect(prompt).not.toContain('MANUSCRIPT EXPORT (this turn)');
  });

  it('strips Layer 2 product redirect leak on any Users turn', () => {
    const leak = [
      'QA Unlimited, permintaan anda memerlukan ADAM Buku — server output profesional ADAM.',
      'Server ini sedang dalam ujian dalaman dan akan dibuka selepas ujian penuh selesai.',
      'Buat masa ini, pada Lapisan 1 saya hanya boleh berbincang dan menjawab soalan dengan anda. Lihat pelan di /plans.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, 'Apa itu fotosintesis?', []);
    expect(out).not.toMatch(/permintaan anda memerlukan/i);
    expect(out).not.toMatch(/ujian dalaman/i);
    expect(out).not.toMatch(/\/plans/i);
    expect(out).toMatch(/matlamat|langkah|bantu/i);
  });

  it('strips Layer 2 product redirect leak on book thread', () => {
    const leak = [
      'QA Unlimited, permintaan anda memerlukan ADAM Buku — server output profesional ADAM.',
      'Server ini sedang dalam ujian dalaman dan akan dibuka selepas ujian penuh selesai.',
      'Buat masa ini, pada Lapisan 1 saya hanya boleh berbincang dan menjawab soalan dengan anda. Lihat pelan di /plans.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(
      leak,
      'Saya perlukan perinci nak laksanakan',
      ['Boleh bantu penulisan buku Mencari Damai'],
    );
    expect(out).not.toMatch(/permintaan anda memerlukan/i);
    expect(out).not.toMatch(/ujian dalaman/i);
    expect(out).toMatch(/merancang buku|tema|bab/i);
  });

  it('injects book discussion on explicit chapter draft ask (no product redirect)', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: MANUSCRIPT_EXPORT_ASK,
      participantName: 'QA Unlimited',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain('BOOK WRITING (this turn)');
    expect(prompt).not.toContain('MANUSCRIPT EXPORT (this turn)');
    expect(prompt).not.toMatch(/memerlukan ADAM (?:Jurnal|Kod)/i);
  });
});
