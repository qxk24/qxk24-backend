/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Compare Formal Display Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  compareFormalStructureAdequate,
  economicsFormalTableAdequate,
  isAdamFormalDataShapeTurn,
  repairCompareFragmentCorruption,
  repairEconomicsFormalTables,
} from '../src/adam/adam-compare-formal-display';
import { resolveAdamAnswerShape } from '../src/adam/adam-answer-shape';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { repairUsersDirectTechnicalDisplay } from '../src/adam/adam-technical-display-structure';
import { resolveAdamAnswerPlan } from '../src/adam/adam-answer-plan';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const DEPTH_COMPARE =
  'Terangkan perbezaan antara hukum jenayah dan hukum sivil dalam sistem perundangan Malaysia. Lebih perinci dan perangkaan';

describe('isAdamFormalDataShapeTurn', () => {
  it('detects perinci dan perangkaan', () => {
    expect(isAdamFormalDataShapeTurn(DEPTH_COMPARE)).toBe(true);
  });

  it('does not flag simple compare', () => {
    expect(isAdamFormalDataShapeTurn('Apa perbezaan UX dan UI?')).toBe(false);
  });
});

describe('repairCompareFragmentCorruption', () => {
  it('merges orphan nisbah line and fixes 1957. 00 bagi', () => {
    const raw = [
      'Mahkamah Sesyen menerima 42,316 kes jenayah dan 68,944 kes sivil.',
      '',
      '6:1 setiap tahun, satu petunjuk dominasi sivil.',
      '',
      'Akta Tuntutan Kerugian 1957. 00 bagi pihak JMB melalui tuntutan sivil.',
    ].join('\n\n');
    const out = repairCompareFragmentCorruption(raw);
    expect(out).toMatch(/Nisbah 6:1|42,316/);
    expect(out).not.toMatch(/1957\. 00 bagi/);
    expect(out).toMatch(/contoh tuntutan ganti rugi bagi/);
  });
});

describe('compare formal prompt + shape', () => {
  it('injects COMPARATIVE FORMAL DATA for perinci/perangkaan ask', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: DEPTH_COMPARE,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.answerShape?.formalDataLayout).toBe(true);
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      participantName: 'QA',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage: DEPTH_COMPARE,
      answerPlan: plan,
    });
    expect(prompt).toContain('COMPARATIVE FORMAL DATA');
    expect(prompt).toContain('### Data dan statistik');
  });

  it('formal adequacy requires markdown table', () => {
    const essayOnly = '### Perbandingan A dan B\n\nProsa tanpa jadual.';
    expect(compareFormalStructureAdequate(essayOnly, { formalDataLayout: true })).toBe(false);
    const withTable = [
      '### Perbandingan A dan B',
      '',
      '| Aspek | A | B |',
      '| --- | --- | --- |',
      '| Tujuan | x | y |',
      '',
      '### Perbezaan utama',
      '',
      'Prosa merujuk jadual.',
    ].join('\n');
    expect(compareFormalStructureAdequate(withTable, { formalDataLayout: false })).toBe(true);
  });
});

describe('repair — essay compare with stats gets fragment hygiene', () => {
  it('repairs orphan ratio without stripping substantive stats prose', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: DEPTH_COMPARE,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    const stream = [
      'Hai QA,',
      '',
      '### Perbandingan hukum jenayah dan hukum sivil',
      '',
      '### Perbezaan utama',
      '',
      'Pada 2023, Mahkamah Tinggi menerima 14,827 kes jenayah berbanding 29,561 kes sivil.',
      '',
      '6:1 setiap tahun menunjukkan dominasi sivil.',
      '',
      '### Contoh',
      '',
      'Beban pembuktian jenayah: di luar sebarang ragu-ragu munasabah.',
    ].join('\n');
    const out = repairUsersDirectTechnicalDisplay(stream, DEPTH_COMPARE, plan);
    expect(out).toMatch(/14,827/);
    expect(out).not.toMatch(/\n6:1 setiap tahun/);
    expect(out).toMatch(/Nisbah 6:1|6:1 setiap tahun/);
  });
});

describe('repairEconomicsFormalTables — live drift', () => {
  it('replaces essay-length jadual cells with compact stats', () => {
    const drifted = [
      '### Apa itu campur tangan kerajaan?',
      '',
      '### Data dan statistik',
      '',
      '| Petunjuk | Nilai | Tahun/sumber |',
      '| --- | --- | --- |',
      '| Indeks harga pengguna (IHP) | IHP) negara kekal stabil pada paras rendah, walaupun harga minyak dunia mendekati USD100 setong. | DOSM |',
      '|:---:|:---:|:---:|',
      '| Harga minyak dunia | USD100 setong dan harga makanan terus meningkat. | Pasaran |',
      '',
      '### Mekanisme / saluran kesan',
      '',
      '1. Campur tangan kerajaan memberi kesan segera. Pada April 2026, inflasi Malaysia berada pada 1.9 peratus, angka yang masih berada dalam zon sasaran Bank Negara Malaysia (BNM), iaitu antara 2.0 hingga 3.0 peratus. Ia juga bergantung kepada *muḥīṭ ekonomi* yang seimbang.',
      '',
      '### Kesimpulan',
      '',
      'Keberkesanan sebenar muncul dari pemulihan rasa aman dalam ekonomi.',
    ].join('\n');

    const out = repairEconomicsFormalTables(drifted);
    expect(out).not.toMatch(/IHP\) negara kekal stabil/);
    expect(out).not.toMatch(/\|:---:/);
    expect(out).not.toMatch(/muḥīṭ ekonomi/i);
    expect(out).toMatch(/1\.9%/);
    expect(out).toMatch(/USD100/);
    expect(economicsFormalTableAdequate(out)).toBe(true);
    expect(out).toMatch(/sistem ekonomi/);
  });
});
