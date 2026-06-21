/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law Test
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

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import {
  buildAdamTutorProfileBlock,
  buildAdamTutorTeacherIntroLaw,
  enforceTutorPlainLanguageGuard,
  enforceTutorReplyGuards,
  enforceTutorZeroAnswerGuard,
  fixTutorMalayPlaceValueTerms,
  isAdamTutorMode,
  isAdamTutorOffTopicMessage,
  tutorReplyLeakedFinalAnswer,
  tutorTeacherTitle,
} from '../src/adam/adam-tutor-law';

describe('ADAM Tutor Law', () => {
  it('isAdamTutorMode recognises TUTOR', () => {
    expect(isAdamTutorMode('TUTOR')).toBe(true);
    expect(isAdamTutorMode('TEACHING')).toBe(false);
  });

  it('flags Alamtologi and meta off-topic messages', () => {
    expect(isAdamTutorOffTopicMessage('cerita tentang alamtologi')).toBe(true);
    expect(isAdamTutorOffTopicMessage('who built you?')).toBe(true);
    expect(isAdamTutorOffTopicMessage('2/3 + 1/4 macam mana')).toBe(false);
  });

  it('buildAdamTutorProfileBlock includes level and curriculum', () => {
    const block = buildAdamTutorProfileBlock({
      level:      'secondary',
      curriculum: 'national',
      language:   'malay',
      localeNote: 'Malaysia KSSM',
      yearLabel:  'Form 4',
    });
    expect(block).toContain('Secondary / high school');
    expect(block).toContain('National / local');
    expect(block).toContain('Malaysia KSSM');
    expect(block).toContain('Form 4');
    expect(block).toContain('Global tutor');
    expect(block).toContain('Bahasa Malaysia');
  });

  it('migrates legacy kpm curriculum in profile block', () => {
    const block = buildAdamTutorProfileBlock({
      level:      'primary',
      curriculum: 'kpm',
      yearLabel:  'Year 5',
    });
    expect(block).toContain('National / local');
    expect(block).not.toContain('KPM');
  });

  it('TUTOR prompt excludes Alamtologi constitutional stack', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:            'TUTOR',
      isFounder:       false,
      participantName: 'Ahmad',
      founderStudentsBlock: '',
      tutorProfile: {
        level:      'primary',
        curriculum: 'international',
        language:   'english',
        localeNote: 'IGCSE',
        yearLabel:  'Year 5',
      },
      userMessage: '2/3 + 1/4 jawapan apa?',
    });
    expect(prompt).toContain('ADAM TUTOR LAW');
    expect(prompt).toContain('ZERO-ANSWER RULE');
    expect(prompt).toContain('PLAIN LANGUAGE');
    expect(prompt).toContain('BENTUK LAZIM');
    expect(prompt).toContain('→ ______');
    expect(prompt).toContain('Sa');
    expect(prompt).toContain('BUKAN "Saat"');
    expect(prompt).toContain('Teacher ADAM');
    expect(prompt).not.toContain('TEORI MASABAYU');
    expect(prompt).not.toContain('ADAM EXPLAIN-BACK LAW');
    expect(prompt).not.toContain('LAYER 5 — RESPONSE GENERATION');
    expect(prompt).not.toContain('END CORE ▓▓▓');
    expect(prompt).not.toContain('ADAM CONSTITUTIONAL HOLD');
  });

  it('buildAdamTutorTeacherIntroLaw uses Cikgu for Malay', () => {
    const block = buildAdamTutorTeacherIntroLaw({ level: 'secondary', curriculum: 'national', language: 'malay' });
    expect(block).toContain('Cikgu ADAM');
    expect(block).toContain('no Bismillah');
  });

  it('buildAdamTutorTeacherIntroLaw uses Teacher for English', () => {
    const block = buildAdamTutorTeacherIntroLaw({ level: 'secondary', curriculum: 'national', language: 'english' });
    expect(block).toContain('Teacher ADAM');
  });

  it('tutorTeacherTitle maps Malay to Cikgu', () => {
    expect(tutorTeacherTitle('malay')).toBe('Cikgu');
    expect(tutorTeacherTitle('english')).toBe('Teacher');
  });

  it('enforceTutorPlainLanguageGuard strips Alamtologi poetic bleed', () => {
    const raw = [
      'Bismillah. Soalan ini, a - 4 = 2.',
      'Ia adalah nafas masuk dalam niche kehadiran ilmu.',
      'Apa operasi lawan tolak 4?',
      'seperti cahaya dalam kelengkungan Mishkāt.',
    ].join('\n');
    const scrubbed = enforceTutorPlainLanguageGuard(raw, {
      level: 'secondary', curriculum: 'national', language: 'malay',
    });
    expect(scrubbed).not.toMatch(/nafas masuk/i);
    expect(scrubbed).not.toMatch(/Mishk/i);
    expect(scrubbed).toContain('Apa operasi lawan tolak 4?');
    expect(scrubbed).toContain('Cikgu');
  });

  it('enforceTutorReplyGuards uses Malay closing when reply is Malay', () => {
    const raw = 'Langkah…\n\nJawapan akhirnya ialah **6**.\n\nJika A = 6, maka 6 - 4 = 2 → betul.';
    const scrubbed = enforceTutorReplyGuards(raw, {
      level: 'secondary', curriculum: 'national', language: 'english',
    });
    expect(scrubbed).toContain('Cikgu');
    expect(scrubbed).not.toMatch(/Teacher won't give/i);
  });

  it('fixTutorMalayPlaceValueTerms replaces Saat with Sa for ones column', () => {
    const raw = 'Mulakan dari Saat — berapa 5 + 7?';
    const fixed = fixTutorMalayPlaceValueTerms(raw, {
      level: 'primary', curriculum: 'national', language: 'malay',
    });
    expect(fixed).toContain('Mulakan dari Sa');
    expect(fixed).not.toMatch(/\bSaat\b/);
  });

  it('gold conventional layout for guli addition passes zero-answer guards', () => {
    const gold = [
      'Ali ada **2,385** biji guli.',
      'Dia beli lagi **1,427** biji guli.',
      '',
      'Kita nak cari **jumlah keseluruhan**, jadi kita *tambah*:',
      '**2,385 + 1,427**',
      '',
      '| Ribu | Ratus | Puluh | Sa |',
      '|:---:|:---:|:---:|:---:|',
      '| 2 | 3 | 8 | 5 |',
      '| 1 | 4 | 2 | 7 |',
      '| + | | | |',
      '',
      'Mulakan dari kanan, di tempat **Sa** (satuan):',
      'Berapa **5 + 7**?',
      '',
      'Tulis jawapan di sini:',
      '→ ______',
      '',
      'Saya tunggu, kemudian kita terus ke tempat **Puluh**.',
    ].join('\n');
    expect(tutorReplyLeakedFinalAnswer(gold)).toBe(false);
    const scrubbed = enforceTutorReplyGuards(gold, {
      level: 'primary', curriculum: 'national', language: 'malay',
    });
    expect(scrubbed).toContain('→ ______');
    expect(scrubbed).toContain('| Ribu |');
    expect(scrubbed).not.toContain('Cikgu tidak beri');
  });

  it('enforceTutorReplyGuards strips full column-addition walkthrough', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      'Ali ada 2,385 guli, beli 1,427 lagi.',
      '2,385 + 1,427 =?',
      'Saat: 5 + 7 = 12 → tulis **2**, bawa **1**.',
      'Puluh: 8 + 2 = 10, tambah 1 = **11** → tulis **1**, bawa **1**.',
      'Jadi, hasilnya ialah **3,812**',
      'Jumlah guli Ali sekarang ialah …',
    ].join('\n');
    expect(tutorReplyLeakedFinalAnswer(raw)).toBe(true);
    const scrubbed = enforceTutorReplyGuards(raw, {
      level: 'primary', curriculum: 'national', language: 'malay',
    });
    expect(scrubbed).not.toMatch(/3,812/);
    expect(scrubbed).not.toMatch(/Saat:/i);
    expect(scrubbed).not.toMatch(/Puluh:/i);
    expect(scrubbed).toContain('2,385 + 1,427');
    expect(scrubbed).toContain('satu langkah');
  });

  it('enforceTutorZeroAnswerGuard strips jawapan akhir leaks', () => {
    const raw = 'Langkah…\n\nJawapan akhirnya ialah **6**.\n\nJika A = 6, maka 6 - 4 = 2 → betul.';
    expect(tutorReplyLeakedFinalAnswer(raw)).toBe(true);
    const scrubbed = enforceTutorZeroAnswerGuard(raw, { level: 'secondary', curriculum: 'national', language: 'malay' });
    expect(scrubbed).not.toMatch(/jawapan akhirnya/i);
    expect(scrubbed).not.toContain('**6**');
    expect(scrubbed).not.toMatch(/Jika A = 6/);
    expect(scrubbed).toContain('Cikgu');
  });

  it('TUTOR prompt adds off-topic overlay when needed', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:            'TUTOR',
      isFounder:       false,
      participantName: 'Ali',
      founderStudentsBlock: '',
      userMessage:     'cerita tentang alamtologi',
    });
    expect(prompt).toContain('OFF-TOPIC TURN');
  });
});
