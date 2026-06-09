/// <reference types="jest" />

/**
 * Fasa 5 — ADAM student voice regression suite.
 * Locks prompt stack contracts (Fasa 0–4) + end-to-end tutor voice through the production pipeline.
 */

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { ADAM_STUDENT_OUTPUT_LAW } from '../src/adam/adam-student-output-law';
import { buildAnswerStylePromptBlock } from '../src/adam/adam-answer-style';
import { ADAM_LAYER5_CORE } from '../src/adam/adam-response-generation';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  runStudentVoicePipeline,
  STUDENT_VOICE_INVARIANT_PATTERNS,
  VOICE_MACHINE_ERROR,
  VOICE_PASSIVE_MENU,
} from './helpers/adam-student-voice-pipeline';

function expectStudentVoiceInvariants(
  text: string,
  options?: { allowFaith?: boolean },
): void {
  expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.bismillahOpener);
  expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.forbiddenPronoun);
  expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.catatan);
  expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.frameworkLabel);
  expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.emDash);
  if (!options?.allowFaith) {
    expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.unsolicitedQuran);
    expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.faithSermon);
  }
  expect(text).not.toMatch(STUDENT_VOICE_INVARIANT_PATTERNS.constitutionalToken);
}

function expectWarmTutorVoice(text: string): void {
  expect(text.trim().length).toBeGreaterThan(20);
  expect(text).not.toMatch(VOICE_MACHINE_ERROR);
}

describe('Voice regression — prompt stack (Fasa 0–4 contracts)', () => {
  const studentPrompt = buildAdamChatSystemPrompt({
    mode:            'TEACHING',
    isFounder:       false,
    participantName: 'Ahmad',
    founderStudentsBlock: '',
  });

  it('student stack: L1 once, Layer 5, universal voice — no founder laws', () => {
    expect(studentPrompt.split('§1 BAHASA REGISTER').length - 1).toBe(1);
    expect(studentPrompt).toContain(ADAM_STUDENT_OUTPUT_LAW.slice(0, 40));
    expect(studentPrompt).toContain('Qawlan Sadida');
    expect(studentPrompt).toContain('UNIVERSAL VOICE');
    expect(studentPrompt).not.toContain('FIVE RULES — CHECK EVERY REPLY');
    expect(studentPrompt).not.toContain('ADAM_ALAMTOLOGI_LAWS');
    expect(studentPrompt).not.toContain('STUDENT OUTPUT LOCK — FINAL CHECK BEFORE SENDING');
  });

  it('student natural style: no Bismillah mandate (L1 wins)', () => {
    const naturalStudent = buildAnswerStylePromptBlock('natural', false);
    expect(naturalStudent).not.toMatch(/Bismillahirahmanirrahim/i);
    expect(naturalStudent).toMatch(/STUDENT OUTPUT LAW \(L1\)/i);
    expect(studentPrompt).not.toContain('Always begin every response with Bismillahirahmanirrahim');
  });

  it('founder stack still carries Bismillah law — role separation', () => {
    const founderPrompt = buildAdamChatSystemPrompt({
      mode:            'TEACHING',
      isFounder:       true,
      participantName: 'Masa Bayu',
      founderStudentsBlock: '',
    });
    expect(founderPrompt).toMatch(/Bismillahirahmanirrahim/i);
    expect(founderPrompt).not.toContain('STUDENT OUTPUT LAW (L1)');
    expect(founderPrompt).toContain(ADAM_LAYER5_CORE.slice(0, 30));
  });
});

describe('Voice regression — warm tutor passes through', () => {
  it('V-W01: substantive life advice survives pipeline with leaks stripped', async () => {
    const raw =
      'Bismillahirahmanirrahim.\n\n'
      + 'Dalam lensa Alamtologi, kebimbangan sering bermula apabila badan kekal dalam mod berjaga-jaga. '
      + 'Nafas yang lebih perlahan boleh membantu sistem saraf beralih semula.\n\n'
      + 'Apa satu perkara yang paling penting bagi anda dalam situasi ini?';
    const out = await runStudentVoicePipeline({
      userMessage:    'Kenapa saya rasa cemas sebelum tidur?',
      rawModelOutput: raw,
    });
    expectStudentVoiceInvariants(out);
    expectWarmTutorVoice(out);
    expect(out).toMatch(/kebimbangan|berjaga/i);
    expect(out).toMatch(/Apa satu perkara yang paling penting/i);
    expect(out).not.toMatch(VOICE_PASSIVE_MENU);
  });

  it('V-W02: maieutic close preserved — not confused with passive sales menu', async () => {
    const raw =
      'Stres kronik menaikkan kortisol, dan itu boleh mengganggu kitaran tidur.\n\n'
      + 'Apa satu perubahan kecil yang anda sanggup cuba malam ini?';
    const out = await runStudentVoicePipeline({
      userMessage:    'Bagaimana stres mempengaruhi tidur?',
      rawModelOutput: raw,
    });
    expect(out).toMatch(/stres|tidur/i);
    expect(out).toMatch(/perubahan kecil/i);
    expect(out).not.toMatch(VOICE_PASSIVE_MENU);
  });

  it('V-W03: sync guard keeps faith paragraph when door is open', () => {
    const raw =
      'Kesabaran ialah tema besar dalam Quran.\n\n'
      + 'Allah berfirman about patience in Surah Al-Baqarah 2:153.';
    const out = sanitizeStudentOutputSync(
      raw,
      'Apa ayat Quran tentang kesabaran?',
    );
    expect(out).toMatch(/Allah berfirman/i);
    expectStudentVoiceInvariants(out, { allowFaith: true });
  });
});

describe('Voice regression — bad voice stripped or repaired', () => {
  it('V-B01: fabricated market essay → tutor perspective fallback, not machine error', async () => {
    const raw =
      'Kereta murah berkualiti bukan kontradiksi.\n\n'
      + 'Berikut panduan berdasarkan realiti pasaran Malaysia (2024–2026), disaring dari data ujian keselamatan:\n\n'
      + '- Rekod kebolehpercayaan: laporan persatuan aftermarket 2025, kadar kegagalan < 3.2%.\n\n'
      + '| Insurans | RM1,180 |\n\n'
      + 'Apa model atau varian yang sedang anda pertimbangkan?';
    const out = await runStudentVoicePipeline({
      userMessage:    'kereta murah berkualiti untuk keluarga',
      rawModelOutput: raw,
      searchUsed:     true,
    });
    expectStudentVoiceInvariants(out);
    expectWarmTutorVoice(out);
    expect(out).not.toMatch(/RM1,180|3\.2\s*%|disaring\s+dari\s+data/i);
    expect(out).not.toMatch(VOICE_PASSIVE_MENU);
    expect(out).toMatch(/bukan kontradiksi|keseimbangan|kos pemilikan/i);
  });

  it('V-B02: pronoun leaks sanitized in warm reply', async () => {
    const raw = 'Aku faham — kamu mungkin letih. Rehat sebentar boleh membantu.';
    const out = await runStudentVoicePipeline({
      userMessage:    'Saya penat sangat hari ini.',
      rawModelOutput: raw,
    });
    expect(out).toMatch(/Saya faham/i);
    expect(out).not.toMatch(/\b(kamu|aku|kau|engkau)\b/i);
    expect(out).not.toMatch(/—/);
  });

  it('V-B04: anxiety sermon with MASA/TENAGA/IZWA → guided fallback, not raw leak', async () => {
    const raw = readFileSync(
      join(__dirname, 'fixtures/anxiety-sermon-leak.txt'),
      'utf8',
    );
    const out = await runStudentVoicePipeline({
      userMessage:    'Kenapa saya rasa cemas sebelum tidur?',
      rawModelOutput: raw,
    });
    expectStudentVoiceInvariants(out);
    expectWarmTutorVoice(out);
    expect(out).not.toMatch(/Terima kasih kerana berkongsi/i);
    expect(out).not.toMatch(/duduk bersama.*kegelapan/i);
    expect(out).toMatch(/cemas|tidur|saraf|nafas/i);
  });

  it('V-B03: passive compare menu stripped from technical answer body', async () => {
    const out = await runStudentVoicePipeline({
      userMessage: 'Berapa tork enjin varian Elite?',
      rawModelOutput:
        'Tork maksimum ialah 90 Nm @ 3600 rpm.\n\n'
        + 'Adakah anda ingin bandingkan tork ini dengan model kereta lain?',
      searchUsed: true,
      searchResults: [
        { title: 'Torque 90 Nm @ 3600 rpm specification', url: 'https://example.com/spec' },
      ],
    });
    expect(out).toMatch(/90\s*Nm/i);
    expect(out).not.toMatch(VOICE_PASSIVE_MENU);
    expectStudentVoiceInvariants(out);
  });
});

describe('Voice regression — fallbacks keep tutor voice', () => {
  it('V-F01: empty model on salam → waalaikum greeting, not machine string', async () => {
    const out = await runStudentVoicePipeline({
      userMessage:    'salam',
      rawModelOutput: '',
    });
    expect(out).toMatch(/Waalaikumussalam/i);
    expectStudentVoiceInvariants(out);
    expect(out).not.toMatch(VOICE_MACHINE_ERROR);
  });

  it('V-F02: empty substantive turn → guided perspective, not machine error', async () => {
    const out = await runStudentVoicePipeline({
      userMessage:    'Bagaimana saya pilih kereta pertama?',
      rawModelOutput: '',
    });
    expectWarmTutorVoice(out);
    expect(out).toMatch(/keseimbangan|kos pemilikan|keutamaan/i);
    expectStudentVoiceInvariants(out);
  });

  it('V-F03: technical silent gate stays empty — no hollow greeting fallback', async () => {
    const out = await runStudentVoicePipeline({
      userMessage: 'Berapa tork varian A vs varian B?',
      rawModelOutput:
        'Berikut perbandingan ringkas tork.\n\nTiada perbezaan tork kerana enjin sama.',
      searchUsed: true,
      searchResults: [{ title: 'Generic engine review', url: 'https://example.com/review' }],
    });
    expect(out).toBe('');
  });
});
