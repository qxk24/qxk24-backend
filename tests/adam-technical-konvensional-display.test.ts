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
  isAdamTechnicalKonvensionalDisplayTurn,
} from '../src/adam/adam-response-generation';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import { extractMediaFromSearchHits } from '../src/adam/adam-media-search';
import { repairAdamMediaOutput } from '../src/adam/adam-media-guard';
import { repairTechnicalDiagramOutput } from '../src/adam/adam-technical-diagram-guard';

const PHOTOSYNTHESIS_ASK = 'Apa itu fotosintesis?';

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
  '### Hasil fotosintesis',
  '* **Glukosa** – tenaga tumbuhan.',
  '* **Oksigen** – untuk pernafasan.',
  '**Ringkasnya:** Tumbuhan menukar cahaya, air, dan CO₂ kepada glukosa dan oksigen.',
].join('\n\n');

describe('technical konvensional display — photosynthesis shape', () => {
  it('detects photosynthesis as technical display turn', () => {
    expect(isAdamTechnicalKonvensionalDisplayTurn(PHOTOSYNTHESIS_ASK)).toBe(true);
  });

  it('injects technical science generation law', () => {
    const law = buildAdamAlphaGenerationLaw(PHOTOSYNTHESIS_ASK);
    expect(law).toMatch(/PAPARAN TEKNIKAL/i);
    expect(law).toMatch(/### Bahan-bahan/i);
    expect(law).toMatch(/\*\*Ringkasnya:\*\*/i);
  });

  it('preserves GFM lists and bold through student guard', () => {
    const out = sanitizeStudentOutputSync(PHOTOSYNTHESIS_TECHNICAL, PHOTOSYNTHESIS_ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).toMatch(/### Bahan-bahan/i);
    expect(out).toMatch(/\*\*Cahaya matahari\*\*/);
    expect(out).toMatch(/1\.\s+\*\*Cahaya matahari\*\*/);
    expect(out).toMatch(/\*\*Glukosa\*\*/);
    expect(out).toMatch(/\*\*Ringkasnya:\*\*/);
    expect(out).not.toMatch(/Alamtologi|MASA\s*→\s*TENAGA/i);
  });

  it('injects fallback Mermaid diagram on science process turn without diagram', () => {
    const out = sanitizeStudentOutputSync(PHOTOSYNTHESIS_TECHNICAL, PHOTOSYNTHESIS_ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).toMatch(/<adam-technical-diagram>[\s\S]*flowchart/i);
    expect(out).toMatch(/Klorofil|Glukosa/i);
  });
});

const ACID_BASE_ASK = 'Apa itu asid dan bes?';

const ACID_BASE_PROSE = [
  'Hai QA, Asid dan bes ialah dua kumpulan bahan kimia yang berbeza dari segi sifat kimia dan tindak balasnya dalam larutan.',
  'Asid menghasilkan ion hidrogen (H⁺) dalam air; bes menghasilkan ion hidroksida (OH⁻).',
  'Asid mempunyai pH kurang daripada 7, bes lebih daripada 7, dan larutan neutral pH 7.',
  'Contoh asid: asid hidroklorik (HCl). Contoh bes: natrium hidroksida (NaOH).',
  'Tindak balas asid dan bes dipanggil peneutralan — hasilnya garam dan air.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

describe('technical konvensional display — acid and base', () => {
  it('detects acid/base as technical display turn', () => {
    expect(isAdamTechnicalKonvensionalDisplayTurn(ACID_BASE_ASK)).toBe(true);
  });

  it('injects diagram and search-derived media on acid/base prose', () => {
    const searchHits = extractMediaFromSearchHits([
      {
        title: 'Asid dan bes',
        url: 'https://en.wikipedia.org/wiki/Acid',
        snippet: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/PH_Scale.png https://www.youtube.com/watch?v=ivRczDkilAI',
      },
    ]);
    expect(searchHits.some((h) => h.kind === 'image')).toBe(true);
    expect(searchHits.some((h) => h.kind === 'video')).toBe(true);
    let out = sanitizeStudentOutputSync(ACID_BASE_PROSE, ACID_BASE_ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    out = repairTechnicalDiagramOutput(out, ACID_BASE_ASK);
    out = repairAdamMediaOutput(out, ACID_BASE_ASK, searchHits);
    expect(out).toMatch(/<adam-technical-diagram>/i);
    expect(out).toMatch(/<adam-chat-image\b/i);
    expect(out).toMatch(/<adam-chat-video\b/i);
    expect(out).toMatch(/PH_Scale|ivRczDkilAI/);
  });
});
