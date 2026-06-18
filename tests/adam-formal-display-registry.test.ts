/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Formal Display Registry Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamAnswerPlan } from '../src/adam/adam-answer-plan';
import {
  buildFormalDisplaySections,
  formalDisplayStructureAdequate,
  repairScienceFormalDisplay,
  scienceFormalStructureAdequate,
  scienceFormalTableBroken,
} from '../src/adam/adam-formal-display-registry';
import { repairUsersDirectTechnicalDisplay } from '../src/adam/adam-technical-display-structure';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

describe('adam-formal-display-registry', () => {
  it('builds science-formal sections distinct from economics template', () => {
    const paragraphs = [
      'Fotosintesis ialah proses tumbuhan menukar cahaya kepada tenaga kimia.',
      'Klorofil menyerap cahaya merah dan biru dalam kloroplas.',
      'Air dipecahkan dan oksigen dilepaskan sebagai sisa.',
      'Glukosa dihasilkan untuk pertumbuhan tumbuhan.',
    ];
    const out = buildFormalDisplaySections('science-formal', paragraphs, {
      topicTitle: 'fotosintesis',
    });
    expect(out).toMatch(/### Prinsip dan definisi/i);
    expect(out).toMatch(/### Langkah \/ fasa/i);
    expect(out).not.toMatch(/### Data dan jadual/i);
    expect(out).not.toMatch(/### Data dan statistik/i);
    expect(out).not.toMatch(/### Mekanisme \/ saluran kesan/i);
    expect(scienceFormalStructureAdequate(out)).toBe(true);
  });

  it('adequacy routes per displayChannel', () => {
    const econ = '### Apa itu inflasi?\n\n| a | b | c |\n| --- | --- | --- |\n| x | y | z |\n### Data dan statistik\n\n| a | b | c |\n| --- | --- | --- |\n| x | y | z |\n### Mekanisme\n\n1. a\n2. b\n3. c';
    expect(formalDisplayStructureAdequate('economics-formal', econ)).toBe(true);
    expect(formalDisplayStructureAdequate('science-formal', econ)).toBe(false);
  });
});

describe('repair — science uses science-formal not economics template', () => {
  it('repairs fotosintesis essay into science formal layout', () => {
    const ask = 'Apa itu fotosintesis?';
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.displayChannel).toBe('science-formal');

    const essay = [
      'Fotosintesis ialah proses penting dalam tumbuhan hijau.',
      'Ia berlaku di kloroplas dan memerlukan cahaya matahari.',
      'Hasilnya glukosa dan oksigen untuk sokongan hidupan di Bumi.',
    ].join('\n\n');

    const out = repairUsersDirectTechnicalDisplay(essay, ask, plan);
    expect(out).toMatch(/### Prinsip dan definisi/i);
    expect(out).toMatch(/### Langkah \/ fasa/i);
    expect(out).not.toMatch(/### Mekanisme \/ saluran kesan/i);
    expect(out).not.toMatch(/### Contoh Malaysia/i);
    expect(scienceFormalStructureAdequate(out)).toBe(true);
  });

  it('builds bioethics science-formal without jadual — perubatan + etika sections', () => {
    const paragraphs = [
      'CRISPR-Cas9 membolehkan suntingan gen dengan ketepatan tinggi pada DNA manusia.',
      'Dari sudut perubatan, terapi somatik boleh merawat talasemia dan cystic fibrosis.',
      'Risiko off-target dan mosaikisme masih wujud dalam ujian klinikal.',
      'Dari sudut etika, penyuntingan germline diharamkan kerana mengubah keturunan tanpa persetujuan.',
      'Jurang akses boleh mencipta ketidakadilan antara golongan kaya dan miskin.',
      'Malaysia mengikut panduan Majlis Fatwa Kebangsaan dan WHO untuk terapi somatik sahaja.',
    ];
    const out = buildFormalDisplaySections('science-formal', paragraphs, {
      topicTitle: 'implikasi etika dan perubatan CRISPR-Cas9',
      userMessage: 'Apakah implikasi etika dan perubatan terhadap penyuntingan gen manusia menggunakan teknologi CRISPR-Cas9?',
    });
    expect(out).toMatch(/### Implikasi perubatan/i);
    expect(out).toMatch(/### Implikasi etika/i);
    expect(out).not.toMatch(/### Data dan jadual/i);
    expect(out).not.toMatch(/\| Petunjuk \|/i);
    expect(scienceFormalStructureAdequate(out)).toBe(true);
  });

  it('rejects broken placeholder science jadual in adequacy check', () => {
    const broken = [
      '### Prinsip dan definisi',
      '',
      'Teks.',
      '',
      '### Data dan jadual',
      '',
      '| Petunjuk | Nilai | Tahun/sumber |',
      '| --- | --- | --- |',
      '|, | Rujuk sumber saintifik, |, |',
      '',
      '### Langkah / fasa',
      '',
      '1. Satu.',
      '2. Dua.',
    ].join('\n');
    expect(scienceFormalTableBroken(broken)).toBe(true);
    expect(scienceFormalStructureAdequate(broken)).toBe(false);
    expect(repairScienceFormalDisplay(broken)).not.toMatch(/Data dan jadual/i);
  });
});
