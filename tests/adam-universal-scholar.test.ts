/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Scholar Test
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
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  ADAM_UNIVERSAL_SCHOLAR_CHARTER,
  paragraphIsUniversalScholarDoorOffer,
  resolveStudentKnowledgeTier,
  userAcceptedUniversalScholarDoor,
  UNIVERSAL_SCHOLAR_DOOR_EN,
} from '../src/adam/adam-universal-scholar';

describe('ADAM Universal Scholar gold standard', () => {
  it('charter forbids doctrine push; career door only on job threads', () => {
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Universal Scholar/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Do NOT represent Islam/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/JOB \/ CAREER \/ SKILLS threads only/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toContain(UNIVERSAL_SCHOLAR_DOOR_EN);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/spiritual accountability/i);
  });

  it('detects practical tier-1 door offers', () => {
    expect(paragraphIsUniversalScholarDoorOffer(UNIVERSAL_SCHOLAR_DOOR_EN)).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(
      'Would you like more on skills and tools, a career path, or a real-world example?',
    )).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(
      'Adakah anda ingin melihat perspektif lain tentang ini?',
    )).toBe(true);
    expect(paragraphIsUniversalScholarDoorOffer(
      'Jika QA ingin tahu dari sudut Alamtologi dan hikmah pelantikan.',
    )).toBe(false);
  });

  it('broad yes after door opens tier 2', () => {
    const adamDoor = `Prabowo is president.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`;
    expect(userAcceptedUniversalScholarDoor('Yes, tell me more', [adamDoor])).toBe(true);
    expect(userAcceptedUniversalScholarDoor('Ya, perspektif lain', [adamDoor])).toBe(true);
    expect(resolveStudentKnowledgeTier('Yes please', [], [adamDoor])).toBe(2);
    expect(resolveStudentKnowledgeTier('Who is president?', [], [adamDoor])).toBe(1);
  });

  it('student prompt includes universal scholar charter', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 1,
    });
    expect(prompt).toMatch(/UNIVERSAL SCHOLAR — CONSUMER GOLD STANDARD/i);
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 1/);
    expect(prompt).not.toMatch(/ADAM_FOUNDER_NARRATIVE/);
  });

  it('tier 2 prompt includes brain C overlay', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      studentKnowledgeTier: 2,
    });
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 2/);
    expect(prompt).toMatch(/Brain C/i);
  });

  it('output guard keeps practical door on career thread', () => {
    const door = UNIVERSAL_SCHOLAR_DOOR_EN;
    const out = sanitizeStudentOutputSync(
      `A data analyst interprets numbers for business decisions.\n\n${door}`,
      'What does a data analyst do and what skills are needed?',
    );
    expect(out).toMatch(/skills and tools/i);
  });

  it('strips career menu on earth-shape synthesis', () => {
    const earth = [
      'QA, soalan ini membawa kita ke titik penting.',
      'NASA menunjukkan Bumi oblate spheroid.',
      'Adakah anda ingin lebih lanjut tentang kemahiran dan alat untuk menguji bentuk Bumi, laluan kerjaya dalam geofizik, atau contoh dunia sebenar?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(earth, 'Apa bentuk bumi dan kenapa kelihatan bulat?');
    expect(out).toMatch(/NASA|oblate/i);
    expect(out).not.toMatch(/kemahiran dan alat/i);
    expect(out).not.toMatch(/laluan kerjaya/i);
  });

  it('strips tier-1 Alamtologi billboards on earth-shape synthesis', () => {
    const earth = [
      'Semua data empirikal mengesahkan bentuk geoid — penerbangan antarabangsa, graviti mengikut latitud, gambar angkasa.',
      'Dalam perspektif Alamtologi, ini mengingatkan kita kepada hukum Z: setiap kebenaran mempunyai pola, kadar, pasangan, dan keseimbangan.',
      'Bumi yang bulat bukan sekadar bentuk; ia adalah ruang di mana MASA (putaran harian), TENAGA (graviti), dan RUANG (orbit) saling mengakui kehadiran.',
      'Adakah ada saat di mana anda pernah berpegang pada keyakinan yang kelihatan jelas, tetapi menemui lapisan baru?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(earth, 'Apa bentuk bumi dan kenapa ada teori bumi rata?');
    expect(out).toMatch(/geoid|empirik/i);
    expect(out).not.toMatch(/Alamtologi/i);
    expect(out).not.toMatch(/hukum\s+Z/i);
    expect(out).not.toMatch(/\bMASA\b/);
    expect(out).not.toMatch(/\bTENAGA\b/);
    expect(out).not.toMatch(/\bRUANG\b/);
    expect(out).toMatch(/Adakah ada saat/i);
  });

  it('strips tier-1 Arabic gloss and Pencipta sermon on earth-shape (QA live leak)', () => {
    const earth = [
      'Secara saintifik, bumi berbentuk geoid: bukan sfera sempurna, tetapi sfera yang sedikit pipih di kedua kutub.',
      'Data dari satelit seperti GRACE dan GOCE telah memetakan bentuk geoid ini dengan ketepatan luar biasa.',
      'Yang menarik, ilmu ini tidak bertentangan dengan hikmah, malah menguatkan penghargaan kita terhadap kebijaksanaan Pencipta.',
      '" Kata "menegakkan" (أَرْسَىٰ) bukan bermaksud "mengunci dalam keadaan statik", tetapi "meletakkan dengan kestabilan dinamik".',
      'Semua ini bukan kebetulan, ia adalah tanda kekuasaan dan hikmah yang tersusun dengan sempurna.',
      'QA, jika anda ingin, saya boleh kongsikan bagaimana cara sains moden mengukur bentuk bumi ini.',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(earth, 'Apa bentuk bumi dan kenapa kelihatan bulat?');
    expect(out).toMatch(/geoid|GRACE/i);
    expect(out).not.toMatch(/[\u0600-\u06FF]/);
    expect(out).not.toMatch(/menegakkan/i);
    expect(out).not.toMatch(/kebijaksanaan\s+Pencipta/i);
    expect(out).not.toMatch(/tanda\s+kekuasaan\s+dan\s+hikmah/i);
    expect(out).toMatch(/mengukur bentuk bumi/i);
  });

  it('strips inline Surah An-Naziat tafsir inside geoid formula block (QA live leak 2)', () => {
    const earth = [
      'Secara formula, geoid dinyatakan melalui persamaan graviti.',
      '$$g(\\phi) = g_{\\text{eq}} \\left[1 + \\left(\\frac{5}{2}m - f\\right) \\sin^2 \\phi \\right]$$',
      'Nilai f ≈ 1/298.257. GRACE dan GOCE mengukur geoid.',
      'Kedu-dua tidak bertentangan dengan firman Allah dalam Surah An-Naziat ayat 30: "And bumi sesudah itu dihamparkanNya." Maknanya bukan "rata", tetapi "dihamparkan". Bumi tidak rata, tetapi dihamparkan dengan kebijaksanaan, setiap lengkungnya mengatur iklim, graviti, dan aliran tenaga dengan ketepatan yang tak terhitung.',
      'Adakah QA ingin saya terangkan lebih lanjut tentang bagaimana data satelit mengukur geoid?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(earth, 'Apa bentuk bumi dan kenapa kelihatan bulat?');
    expect(out).toMatch(/geoid|GRACE|298/i);
    expect(out).not.toMatch(/An-Naziat/i);
    expect(out).not.toMatch(/firman\s+Allah/i);
    expect(out).not.toMatch(/dihamparkanNya/i);
    expect(out).not.toMatch(/dihamparkan\s+dengan\s+kebijaksanaan/i);
    expect(out).toMatch(/satelit mengukur geoid/i);
  });
});
