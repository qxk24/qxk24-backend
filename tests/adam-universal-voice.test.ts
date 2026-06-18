/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Voice Test
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
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import {
  isExplanatoryScienceQuestion,
  isLifeEmotionTurn,
  isTechnicalPrecisionQuestion,
  outputLooksLikeStructuredSpec,
  userAskedForConstitutionalStructure,
  userAskedForStructuredSpecification,
  userOpenedFaithDoor,
} from '../src/adam/adam-universal-voice';
import { getWebSearchGateReason } from '../src/adam/adam-web-search';

describe('ADAM universal voice output guard', () => {
  it('strips Bismillah opener on Users substantive turns', () => {
    const raw =
      'Bismillahirahmanirrahim.\n\nHello. Anxiety often starts when the body stays on alert.';
    const out = sanitizeUsersOutputSync(raw, 'Why do I feel anxious?');
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).toContain('Anxiety often starts');
  });

  it('removes unsolicited Quran paragraphs when faith door closed', () => {
    const raw =
      'Stress affects sleep cycles in measurable ways.\n\n'
      + 'Allah berfirman: "Verily, in the remembrance of Allah do hearts find rest." (Surah Ar-Ra\'d 13:28).';
    const out = sanitizeUsersOutputSync(raw, 'How does stress affect sleep?');
    expect(out).not.toMatch(/Allah berfirman/i);
    expect(out).toContain('Stress affects sleep');
  });

  it('keeps Quran when user opened the faith door', () => {
    const msg = 'What ayat in Quran speaks about patience?';
    expect(userOpenedFaithDoor(msg)).toBe(true);
    const raw = 'Allah berfirman about patience in Surah Al-Baqarah 2:153.';
    const out = sanitizeUsersOutputSync(raw, msg);
    expect(out).toMatch(/Allah berfirman/i);
  });

  it('strips Alamtologi billboard phrases', () => {
    const raw = 'Dalam lensa Alamtologi, rest is a rhythm of trust and release.';
    const out = sanitizeUsersOutputSync(raw, 'I cannot sleep well.');
    expect(out).not.toMatch(/Alamtologi/i);
  });
});

describe('Life emotion turns — delivery overlay', () => {
  it('detects anxiety and sleep questions', () => {
    expect(isLifeEmotionTurn('Kenapa saya rasa cemas sebelum tidur?')).toBe(true);
    expect(isLifeEmotionTurn('Bagaimana stres mempengaruhi tidur?')).toBe(true);
  });

  it('does not flag technical spec questions', () => {
    expect(isLifeEmotionTurn('Berapa tork Viva Elite?')).toBe(false);
  });

  it('founder still runs search gate for life emotion substantive turns', () => {
    expect(getWebSearchGateReason('Kenapa saya rasa cemas sebelum tidur?')).toBe('factual_question');
  });

  it('user umum channel searches on factual teaching — skips life wellbeing coaching', () => {
    expect(
      getWebSearchGateReason('Kenapa saya rasa cemas sebelum tidur?', { userUmumChannelGate: true }),
    ).toBeNull();
    expect(
      getWebSearchGateReason('Apa itu komunikasi?', { userUmumChannelGate: true }),
    ).toBe('factual_question');
    expect(
      getWebSearchGateReason('Kenapa langit kelihatan biru pada waktu petang?', { userUmumChannelGate: true }),
    ).toBe('factual_question');
  });

  it('student still searches for specs, corrections, and explicit ask', () => {
    expect(
      getWebSearchGateReason('Berapa km/l enjin 1.3?', { usersFounderParity: true }),
    ).toBe('technical_precision');
    expect(
      getWebSearchGateReason('Anda salah sebut — ini Perodua Viva, bukan Proton', { usersFounderParity: true }),
    ).toBe('entity_correction');
    expect(
      getWebSearchGateReason('Cuba search tentang Viva Elite', { usersFounderParity: true }),
    ).toBe('explicit_search');
    expect(
      getWebSearchGateReason('850cc?', { usersFounderParity: true, technicalFollowUp: true }),
    ).toBe('technical_follow_up');
  });
});

describe('Explanatory science detection', () => {
  it('flags apa punca health questions', () => {
    expect(isExplanatoryScienceQuestion('Apa punca manusia mengidap diabetes?')).toBe(true);
    expect(isExplanatoryScienceQuestion('Kenapa jantung berdenyut lebih laju bila cemas?')).toBe(true);
  });

  it('does not flag dosage or spec questions', () => {
    expect(isExplanatoryScienceQuestion('Berapa mg paracetamol untuk kanak-kanak?')).toBe(false);
    expect(isExplanatoryScienceQuestion('dos insulin type 1 diabetes')).toBe(false);
  });
});

describe('Technical precision detection', () => {
  it('detects fuel consumption and trim comparison questions', () => {
    expect(isTechnicalPrecisionQuestion('elite vs exclusive fuel consumption')).toBe(true);
    expect(isTechnicalPrecisionQuestion('berapa km/l enjin 1.3?')).toBe(true);
    expect(isTechnicalPrecisionQuestion('varian premium fuel consumption')).toBe(true);
  });

  it('detects non-automotive technical questions', () => {
    expect(isTechnicalPrecisionQuestion('Berapa volt output charger 65W?')).toBe(true);
    expect(isTechnicalPrecisionQuestion('dos insulin type 1 diabetes')).toBe(true);
  });

  it('does not flag pure greetings', () => {
    expect(isTechnicalPrecisionQuestion('salam')).toBe(false);
  });
});

describe('Constitutional structure turns', () => {
  it('detects Hukum Z / Hukum X questions', () => {
    expect(userAskedForConstitutionalStructure('Apa perbezaan Hukum X dan Hukum Z?')).toBe(true);
    expect(userAskedForConstitutionalStructure('Terangkan empat ciri Hukum Z')).toBe(true);
  });

  it('preserves numbered lists and section breaks for framework answers', () => {
    const raw =
      'Pengenalan ringkas.\n\n'
      + '1. **Pola** — Setiap yang wujud ada corak.\n\n'
      + '2. **Kadar** — Tiada yang tanpa had.\n\n'
      + '### Ringkasan\n\n'
      + 'Hukum Z dan X saling melengkapi.';
    const msg = 'Apa perbezaan Hukum X dan Hukum Z?';
    const out = sanitizeUsersOutputSync(raw, msg);
    expect(out).toMatch(/^1\.\s+\*\*Pola\*\*/m);
    expect(out).toMatch(/^2\.\s+\*\*Kadar\*\*/m);
    expect(out).toContain('### Ringkasan');
  });
});

describe('Structured specification turns', () => {
  it('detects hardware / infrastructure spec questions', () => {
    expect(
      userAskedForStructuredSpecification(
        'Berikan spesifikasi hardware sahaja untuk ADAM skala produksi 50,000 pengguna',
      ),
    ).toBe(true);
    expect(userAskedForStructuredSpecification('Apa perbezaan Hukum X dan Hukum Z?')).toBe(false);
  });

  it('detects mashed multi-component spec output', () => {
    const mashed =
      'Intro. --- ### 1. Router - CPU: 16 core - RAM: 64 GB - GPU: none --- ### 2. Database - CPU: 8 core - RAM: 32 GB - Penyimpanan: 4 TB';
    expect(outputLooksLikeStructuredSpec(mashed)).toBe(true);
  });

  it('preserves headings, rules, and spec bullets for hardware answers', () => {
    const raw =
      'Bismillahirahmanirrahim. Spesifikasi hardware.\n\n'
      + '---\n\n'
      + '### 1. Router Agen\n\n'
      + '- CPU: AMD EPYC 16-core\n'
      + '- RAM: 64 GB DDR5\n\n'
      + '---\n\n'
      + '### 2. Database Cluster\n\n'
      + '- CPU: 8-core\n'
      + '- Penyimpanan: 4 TB SSD';
    const msg = 'Senarai spesifikasi hardware untuk production cluster ADAM';
    const out = sanitizeUsersOutputSync(raw, msg);
    expect(out).toContain('### 1. Router Agen');
    expect(out).toContain('- CPU: AMD EPYC 16-core');
    expect(out).toMatch(/^---$/m);
  });
});
