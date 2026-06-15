/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Answer Constitution v2 Guards Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { repairAlphaStatSurface } from '../src/adam/adam-alpha-output-guard';
import {
  KPTM_FULL_VOICE_REGRESSION_SAMPLE,
  isAlphaStatFullVoiceBody,
} from '../src/adam/adam-stat-stream-preserve';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  RN_FULL_VOICE_REGRESSION_SAMPLE,
  RN_PRACTICAL_ADVISORY_ASK,
  isRnPracticalAdvisoryFullVoiceBody,
} from '../src/adam/adam-practical-advisory-gold';

const BETA_LIVED = [
  'Pagi tadi, daun di pokok limau di halaman anda menangkap cahaya — tanpa bunyi, tanpa gerakan yang anda perasan.',
  'Bayi yang sedang tidur di rumah seterusnya menarik nafas; udara itu sebahagiannya datang dari tumbuhan di sekeliling.',
  'Roti di meja sarapan anda membawa tenaga yang bermula dari gandum yang pernah berdiri di ladang di bawah matahari.',
  'Secara ilmu konvensional, fotosintesis ialah proses tumbuhan menukar cahaya kepada gula dan oksigen.',
  'Pernahkah anda, tanpa sengaja, menghirup udara dalam-dalam di taman — dan terfikir daun yang tidak anda kenali namanya?',
].join('\n\n');

describe('isAlphaStatFullVoiceBody', () => {
  it('detects canonical KPTM essay', () => {
    expect(isAlphaStatFullVoiceBody(KPTM_FULL_VOICE_REGRESSION_SAMPLE)).toBe(true);
  });

  it('rejects short stub', () => {
    expect(isAlphaStatFullVoiceBody('KPTM: 18,000 (verified via web search, kptm.edu.my).')).toBe(false);
  });
});

describe('repairAlphaStatSurface — full voice preserve (P4)', () => {
  it('keeps MASA/TENAGA synthesis paragraph on canonical KPTM', () => {
    const out = repairAlphaStatSurface(
      KPTM_FULL_VOICE_REGRESSION_SAMPLE,
      'Berapa ramai pelajar KPTM?',
    );
    expect(out).toMatch(/MASA yang sedang bergerak/i);
    expect(out).toMatch(/62,000.*graduan/i);
    expect(out.length).toBeGreaterThan(KPTM_FULL_VOICE_REGRESSION_SAMPLE.length * 0.85);
  });
});

describe('isRnPracticalAdvisoryFullVoiceBody', () => {
  it('detects canonical RN practical advisory gold body', () => {
    expect(isRnPracticalAdvisoryFullVoiceBody(RN_FULL_VOICE_REGRESSION_SAMPLE)).toBe(true);
    expect(isRnPracticalAdvisoryFullVoiceBody('An electrician installs wiring.')).toBe(false);
  });
});

describe('sanitizeStudentOutputSync — profile-aware (P4)', () => {
  it('does not strip β lived pictures from fotosintesis turn', () => {
    const out = sanitizeStudentOutputSync(BETA_LIVED, 'Apa itu fotosintesis?');
    expect(out).toMatch(/daun di pokok limau/i);
    expect(out).toMatch(/Bayi yang sedang tidur/i);
    expect(out).toMatch(/Secara ilmu konvensional/i);
    expect(out).toMatch(/Pernahkah anda/i);
  });

  it('does not append career door on α simple factual', () => {
    const body = 'Presiden Republik Indonesia sekarang ialah Prabowo Subianto, dilantik 20 Oktober 2024.';
    const out = sanitizeStudentOutputSync(body, 'Siapa presiden Indonesia sekarang?');
    expect(out).not.toMatch(/skills and tools/i);
    expect(out).not.toMatch(/kemahiran dan alat/i);
    expect(out).toContain('Prabowo');
  });

  it('keeps practical advisory career door on job thread', () => {
    const door = 'Would you like more on skills and tools, a career path, or a real-world example?';
    const out = sanitizeStudentOutputSync(
      `An electrician installs wiring safely.\n\n${door}`,
      'What does an electrician do day to day?',
    );
    expect(out).toMatch(/skills and tools/i);
  });

  it('preserves full-voice RN essay and Gold Standard follow-up (v2.1)', () => {
    const RN_ESSAY = [
      'A registered nurse is responsible for the holistic care of patients, assessing their physical, emotional, and social needs; planning and delivering evidence-based nursing interventions.',
      'You\'ll need to be highly observant, noticing subtle changes in vital signs, behaviour, or mood that may signal deterioration or improvement.',
      'Communication and interpersonal skills are central — whether speaking with a patient who\'s anxious before surgery or a family member receiving difficult news.',
      'These aren\'t just competencies to acquire — they\'re ways of being in relationship with life, suffering, healing, and human dignity.',
      'Would you like me to explain another part in more detail?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      RN_ESSAY,
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(out).toMatch(/holistic care of patients/i);
    expect(out).toMatch(/ways of being in relationship/i);
    expect(out).toMatch(/explain another part in more detail/i);
    expect(out.length).toBeGreaterThan(RN_ESSAY.length * 0.85);
  });

  it('preserves official RN gold sample — Founder seal v2.1', () => {
    const out = sanitizeStudentOutputSync(RN_FULL_VOICE_REGRESSION_SAMPLE, RN_PRACTICAL_ADVISORY_ASK);
    expect(out).toMatch(/verified via web search, healthcareers\.nhs\.uk/i);
    expect(out).toMatch(/holding space with clarity/i);
    expect(out).toMatch(/Skills you'?ll need \(from official nursing guidance\)/i);
    expect(out).toMatch(/explain another part in more detail/i);
    expect(out).toBe(RN_FULL_VOICE_REGRESSION_SAMPLE);
  });
});
