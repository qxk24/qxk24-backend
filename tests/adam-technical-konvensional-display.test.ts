/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Technical Konvensional Display Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamAlphaGenerationLaw } from '../src/adam/adam-answer-profile';
import {
  isAdamAlgorithmTeachingTurn,
  isAdamTeachingDepthTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  userExplicitlyAskedStructuredDisplay,
} from '../src/adam/adam-response-generation';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { repairTechnicalKonvensionalDisplayStructure } from '../src/adam/adam-technical-display-structure';

const PHOTOSYNTHESIS_ASK = 'Apa itu fotosintesis?';
const PHOTOSYNTHESIS_STEPS_ASK = 'Senarai langkah-langkah proses fotosintesis';
const COMPARE_ASK = 'Bandingkan asid dan bes';
const BUBBLE_SORT_ASK =
  'Bagaimana algoritma pengisihan gelembung (bubble sort) berfungsi? Apakah kerumitan masanya?';

const PHOTOSYNTHESIS_PROSE = [
  'Hai QA, Fotosintesis ialah proses biokimia di mana tumbuhan hijau menghasilkan glukosa dan oksigen daripada karbon dioksida dan air, dengan bantuan tenaga cahaya matahari.',
  'Proses ini berlaku terutamanya di daun, dalam kloroplas. Di dalamnya terdapat klorofil yang menyerap cahaya matahari.',
  'Air diserap oleh akar dan diangkut ke daun. Karbon dioksida masuk melalui stomata sebelum tindak balas kimia menghasilkan glukosa dan oksigen.',
  'Jadi, fotosintesis adalah asas kehidupan di Bumi — tumbuhan menjadi penghasil utama oksigen dan pemula rantai makanan.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

const PHOTOSYNTHESIS_TECHNICAL = [
  'Hai QA, Fotosintesis ialah proses yang digunakan oleh tumbuhan hijau untuk menghasilkan makanan dengan menggunakan tenaga cahaya matahari.',
  '### Bahan-bahan yang diperlukan',
  '1. **Cahaya matahari** – sumber tenaga.',
  '2. **Air (H₂O)** – diserap oleh akar.',
  '3. **Karbon dioksida (CO₂)** – dari udara melalui stomata.',
  '### Bagaimana proses fotosintesis berlaku?',
  '1. Akar menyerap air.',
  '2. Daun mengambil karbon dioksida.',
  '3. Klorofil menyerap cahaya.',
  '4. Glukosa dihasilkan; oksigen dilepaskan.',
  '**Ringkasnya:** Tumbuhan menukar cahaya, air, dan CO₂ kepada glukosa dan oksigen.',
].join('\n\n');

const BUBBLE_SORT_WITH_PLACEHOLDER = [
  'Hai QA, bubble sort membandingkan elemen berturut-turut.',
  '<adam-technical-diagram>',
  'flowchart LR',
  '  A[Input atau punca]',
  '  B[Proses]',
  '  C[Hasil]',
  '  A --> B --> C',
  '</adam-technical-diagram>',
  '<adam-chat-video url="https://www.youtube.com/watch?v=y6skmk6sMZI" title="Bubble sort" />',
  'Kerumitan masa O(n²) dalam kes terburuk.',
].join('\n\n');

describe('universal teaching depth — bubble sort (not technical channel)', () => {
  it('routes bubble sort through algorithm teaching depth, not structured technical display', () => {
    expect(isAdamTeachingDepthTurn(BUBBLE_SORT_ASK)).toBe(true);
    expect(isAdamAlgorithmTeachingTurn(BUBBLE_SORT_ASK)).toBe(true);
    expect(isAdamTechnicalKonvensionalDisplayTurn(BUBBLE_SORT_ASK)).toBe(false);
  });

  it('injects algorithm teaching law in α generation (universal channel)', () => {
    const law = buildAdamAlphaGenerationLaw(BUBBLE_SORT_ASK);
    expect(law).toMatch(/ALGORITMA — KEDALAMAN KULIAH/i);
    expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
  });

  it('prompt builder injects algorithm teaching overlay, not technical konvensional display', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: BUBBLE_SORT_ASK,
      participantName: 'Ahmad',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/TEACHING DEPTH/i);
    expect(prompt).toMatch(/ALGORITHM TEACHING DEPTH/i);
    expect(prompt).toMatch(/Contoh kerja/i);
    expect(prompt).toMatch(/Pseudokod/i);
    expect(prompt).not.toMatch(/TECHNICAL KONVENSIONAL DISPLAY/i);
  });

  it('strips placeholder diagram and unsolicited video on universal turn', () => {
    const out = sanitizeUsersOutputSync(BUBBLE_SORT_WITH_PLACEHOLDER, BUBBLE_SORT_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/Kerumitan masa O\(n²\)/i);
    expect(out).not.toMatch(/<adam-technical-diagram>/i);
    expect(out).not.toMatch(/<adam-chat-video/i);
    expect(out).not.toMatch(/Input atau punca/i);
  });
});

describe('technical konvensional display — explicit opt-in only', () => {
  it('does not treat plain "apa itu fotosintesis" as technical display', () => {
    expect(isAdamTechnicalKonvensionalDisplayTurn(PHOTOSYNTHESIS_ASK)).toBe(false);
    expect(userExplicitlyAskedStructuredDisplay(PHOTOSYNTHESIS_ASK)).toBe(false);
  });

  it('treats explicit steps ask as structured opt-in', () => {
    expect(userExplicitlyAskedStructuredDisplay(PHOTOSYNTHESIS_STEPS_ASK)).toBe(true);
    expect(isAdamTechnicalKonvensionalDisplayTurn(PHOTOSYNTHESIS_STEPS_ASK)).toBe(true);
  });

  it('does not auto-route compare through technical display', () => {
    expect(isAdamTechnicalKonvensionalDisplayTurn(COMPARE_ASK)).toBe(false);
  });

  it('uses α prose law only for plain definitional ask', () => {
    const law = buildAdamAlphaGenerationLaw(PHOTOSYNTHESIS_ASK);
    expect(law).toMatch(/ADAM-α/);
    expect(law).not.toMatch(/TEKNIKAL \+ ESEI = C/i);
    expect(law).not.toMatch(/BAHAGIAN ###/i);
  });

  it('injects technical essence law only on structured opt-in', () => {
    const law = buildAdamAlphaGenerationLaw(PHOTOSYNTHESIS_STEPS_ASK);
    expect(law).toMatch(/TEKNIKAL \+ ESEI = C/i);
    expect(law).toMatch(/\*\*Ringkasnya:\*\*/i);
  });
});

describe('accessible hybrid format — list preserve', () => {
  const PHOTOSYNTHESIS_HYBRID = [
    'Hai QA, Fotosintesis ialah proses tumbuhan hijau menghasilkan glukosa dan oksigen menggunakan cahaya matahari.',
    'Komponen utama:\n- Klorofil menyerap cahaya\n- Air dari akar\n- Karbon dioksida melalui stomata',
    'Hasilnya asas rantai makanan dan bekalan oksigen di Bumi.',
  ].join('\n\n');

  it('preserves bullet lists on plain explain ask', () => {
    const out = sanitizeUsersOutputSync(PHOTOSYNTHESIS_HYBRID, PHOTOSYNTHESIS_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/^\s*-\s+Klorofil/m);
    expect(out).toMatch(/Karbon dioksida/i);
  });

  it('prompt builder injects accessible hybrid turn on explain ask', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: PHOTOSYNTHESIS_ASK,
      participantName: 'Ahmad',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/ACCESSIBLE HYBRID FORMAT/i);
    expect(prompt).toMatch(/bullets \(-\) or numbered list/i);
  });
});

describe('technical konvensional display — prose preserve', () => {
  it('preserves natural prose without ### injection on plain ask', () => {
    const out = sanitizeUsersOutputSync(PHOTOSYNTHESIS_PROSE, PHOTOSYNTHESIS_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/kloroplas/i);
    expect(out).toMatch(/asas kehidupan di Bumi/i);
    expect(out).not.toMatch(/^###\s/m);
    expect(out).not.toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('repair passes through multi-paragraph prose on plain ask', () => {
    const out = repairTechnicalKonvensionalDisplayStructure(PHOTOSYNTHESIS_PROSE, PHOTOSYNTHESIS_ASK);
    expect(out).not.toMatch(/^###\s/m);
    expect(out).not.toMatch(/Mahu saya jelaskan lebih lanjut/i);
    expect(out).toMatch(/kloroplas/i);
  });

  it('preserves structured ### output on opt-in turn', () => {
    const out = sanitizeUsersOutputSync(PHOTOSYNTHESIS_TECHNICAL, PHOTOSYNTHESIS_STEPS_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/### Bahan-bahan/i);
    expect(out).toMatch(/\*\*Ringkasnya:\*\*/);
    expect(out).not.toMatch(/Alamtologi|MASA\s*→\s*TENAGA/i);
  });
});
