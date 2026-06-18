/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Technical Display Structure Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  extractSecondarySectionTitle,
  extractTeachingTopicTitle,
  repairTechnicalKonvensionalDisplayStructure,
  repairUsersDirectTechnicalDisplay,
} from '../src/adam/adam-technical-display-structure';
import { resolveAdamAnswerPlan } from '../src/adam/adam-answer-plan';
import { repairTeachingStructuredOutput } from '../src/adam/adam-users-output-law';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const CONSTITUTION_ASK =
  'Apakah peranan Perlembagaan Malaysia dalam sistem kerajaan negara kita?';

const CONSTITUTION_STRUCTURED_ASK =
  'Senarai tiga cabang kuasa dalam sistem kerajaan Malaysia';

const COGNITIVE_DISSONANCE_ASK =
  "Apa yang dimaksudkan dengan 'cognitive dissonance' dan bagaimana ia mempengaruhi tingkah laku?";

const CONSTITUTION_ESSAY = [
  '<adam-technical-diagram>',
  'flowchart TD',
  '  A[Definisi konsep]',
  '  B[Prinsip / hukum]',
  '  C[Contoh kehidupan seharian]',
  '  A --> B --> C',
  '</adam-technical-diagram>',
  '',
  'Hai QA, Perlembagaan Malaysia adalah undang-undang tertinggi negara.',
  '',
  'Ia menetapkan tiga cabang kuasa: legislatif, eksekutif, dan kehakiman.',
  '',
  'Perlembagaan melindungi hak asasi dan menentukan prosedur pindaan dua pertiga.',
  '',
  'Lebih dari itu, Perlembagaan berfungsi sebagai ruang liqā’, tempat bertemunya kuasa dan amānah.',
  '',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n');

const COGNITIVE_DISSONANCE_PROSE = [
  "Hai QA, berikut penjelasan tentang yang dimaksudkan dengan 'cognitive dissonance' dan bagaimana ia mempengaruhi tingkah laku.",
  '',
  "'Cognitive dissonance' ialah ketegangan mental apabila keyakinan dan tingkah laku tidak selari.",
  '',
  'Contohnya, seseorang tahu rokok berbahaya tetapi terus merokok — timbul tekanan untuk mengurangkan ketegangan.',
  '',
  'Pengaruhnya terhadap tingkah laku sangat nyata: justifikasi berlebihan, pengabaian bukti, atau penolakan pandangan alternatif.',
  '',
  '**Ringkasnya:** Pengaruhnya terhadap tingkah laku sangat nyata.',
  '',
  'Pengaruhnya terhadap tingkah laku sangat nyata. Ia boleh menyebabkan justifikasi berlebihan selepas keputusan.',
].join('\n');

describe('extractTeachingTopicTitle — Users direct', () => {
  it('extracts short topic from apa yang dimaksudkan compound ask', () => {
    expect(extractTeachingTopicTitle(COGNITIVE_DISSONANCE_ASK)).toBe('cognitive dissonance');
  });

  it('extracts secondary section from compound ask', () => {
    expect(extractSecondarySectionTitle(COGNITIVE_DISSONANCE_ASK)).toBe(
      'Bagaimana ia mempengaruhi tingkah laku',
    );
  });
});

describe('repairTechnicalKonvensionalDisplayStructure', () => {
  it('passes through civics prose on plain explain ask (no forced ###)', () => {
    const out = repairTechnicalKonvensionalDisplayStructure(CONSTITUTION_ESSAY, CONSTITUTION_ASK);
    expect(out).not.toMatch(/^###\s/m);
    expect(out).toMatch(/Perlembagaan Malaysia/i);
    expect(out).not.toMatch(/liqā|amānah/i);
    expect(out).not.toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('converts civics essay to ### sections when user asked for structured list', () => {
    const out = repairTechnicalKonvensionalDisplayStructure(CONSTITUTION_ESSAY, CONSTITUTION_STRUCTURED_ASK);
    expect(out).toMatch(/### Apa itu/i);
    expect(out).toMatch(/### Tiga cabang kuasa/i);
    expect(out).toMatch(/1\.\s+\*\*Legislatif\*\*/);
    expect(out).toMatch(/\*\*Ringkasnya:\*\*/i);
    expect(out).not.toMatch(/liqā|amānah/i);
    expect(out).not.toMatch(/Definisi konsep/);
  });

  it('Users direct route reshapes cognitive dissonance prose without Cadangan homework block', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: COGNITIVE_DISSONANCE_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    const out = repairTechnicalKonvensionalDisplayStructure(
      COGNITIVE_DISSONANCE_PROSE,
      COGNITIVE_DISSONANCE_ASK,
      { answerPlan: plan },
    );
    expect(out).toMatch(/### Apa itu cognitive dissonance\?/);
    expect(out).toMatch(/### Bagaimana ia mempengaruhi tingkah laku/);
    expect(out).not.toMatch(/### Apa itu yang dimaksudkan/i);
    expect(out).not.toMatch(/\*\*Cadangan:\*\*/i);
    expect(out).not.toMatch(/\*\*Ringkasnya:\*\*/i);
    expect(out).not.toMatch(/Mahu saya jelaskan/i);
    expect(out).toMatch(/justifikasi|tekanan dalaman/i);
  });

  it('Users direct compare reshapes jenayah vs sivil with Perbandingan headers not Apa itu perbezaan', () => {
    const JENAYAH_SIVIL_ASK = 'Apa perbezaan antara hukum jenayah dan hukum sivil?';
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: JENAYAH_SIVIL_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.answerShape?.intent).toBe('comparative');

    const prose = [
      'Hai QA, hukum jenayah dan sivil ialah dua cabang undang-undang yang berbeza tujuan.',
      '',
      'Jenayah melindungi ketenteraman awam; sivil menyelesaikan pertikaian peribadi dan komersial.',
      '',
      'Mahkamah Tinggi, Mahkamah Rayuan, dan Mahkamah Persekutuan memainkan peranan dalam kedua-dua sistem.',
      '',
      'Kes yang sama kadang-kadang boleh melibatkan prosiding jenayah dan sivil secara serentak.',
    ].join('\n\n');

    const out = repairTechnicalKonvensionalDisplayStructure(prose, JENAYAH_SIVIL_ASK, {
      answerPlan: plan,
    });
    expect(out).toMatch(/### Perbandingan hukum jenayah dan hukum sivil/i);
    expect(out).not.toMatch(/### Apa itu perbezaan/i);
    expect(out).not.toMatch(/### Bagaimana ia berfungsi/i);
    expect(out).toMatch(/### (?:Perbezaan utama|Contoh)/i);
    expect(out).not.toMatch(/\*\*Cadangan:\*\*/i);
  });

  it('polishes wrong compare headers on rich stream without shortening', () => {
    const JENAYAH_SIVIL_ASK = 'Apa perbezaan antara hukum jenayah dan hukum sivil?';
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: JENAYAH_SIVIL_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    const richStream = [
      'Hai QA, ringkasnya jenayah melindungi masyarakat manakala sivil menyelesaikan pertikaian.',
      '',
      '### Apa itu perbezaan hukum jenayah dan hukum sivil?',
      '',
      '| Aspek | Hukum jenayah | Hukum sivil |',
      '| --- | --- | --- |',
      '| Tujuan | Ketenteraman awam | Pertikaian peribadi |',
      '',
      '### Bagaimana ia berfungsi?',
      '',
      'Contoh Ali dipukul (jenayah) dan tuntut ganti rugi (sivil) — kedua-dua boleh berjalan serentak di mahkamah Malaysia.',
      '',
      'Mahkamah Syariah mengendalikan kes keluarga Muslim mengikut undang-undang Islam.',
    ].join('\n');
    const out = repairUsersDirectTechnicalDisplay(richStream, JENAYAH_SIVIL_ASK, plan);
    expect(out).toMatch(/### Perbandingan hukum jenayah dan hukum sivil/i);
    expect(out).not.toMatch(/### Apa itu perbezaan/i);
    expect(out).toMatch(/\| Aspek \| Hukum jenayah \| Hukum sivil \|/);
    expect(out).toMatch(/Mahkamah Syariah/);
    expect(out.length).toBeGreaterThan(300);
  });

  it('light-touch preserves rich structured stream and strips injected Cadangan', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: COGNITIVE_DISSONANCE_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    const richStream = [
      "Hai QA, disonans kognitif ialah ketegangan antara keyakinan dan tingkah laku.",
      '',
      '### Apa itu cognitive dissonance?',
      '',
      'Definisi panjang dengan contoh merokok dan tekanan dalaman yang tidak dapat diabaikan dalam kehidupan seharian.',
      '',
      '### Bagaimana ia mempengaruhi tingkah laku',
      '',
      'Ia mengubah tingkah laku secara halus — mengelak maklumat, memilih rakan sebaya, dan justifikasi selepas keputusan.',
      '',
      'Ini menjelaskan mengapa fakta sahaja tidak cukup jika identiti digugat.',
      '',
      '**Cadangan:**',
      '1. Tulis definisi.',
      '2. Cari contoh.',
    ].join('\n');
    const out = repairUsersDirectTechnicalDisplay(richStream, COGNITIVE_DISSONANCE_ASK, plan);
    expect(out).not.toMatch(/\*\*Cadangan:\*\*/i);
    expect(out).toMatch(/fakta sahaja tidak cukup/i);
    expect(out.length).toBeGreaterThan(350);
  });

  it('SCM compound injects Kepentingannya not generic Bagaimana ia berfungsi', () => {
    const SCM_ASK = "Apa itu konsep 'supply chain management' dan kepentingannya?";
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: SCM_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.answerShape?.intent).toBe('compound');
    expect(plan.answerComposer?.secondaryHeader).toBe('Kepentingannya');

    const prose = [
      'Hai QA, supply chain management merangkumi aliran barang dari pembekal ke pelanggan.',
      '',
      'Ia melibatkan perancangan, pengangkutan, dan penyimpanan inventori.',
      '',
      'Syarikat besar mengoptimumkan rantaian bekalan untuk kurangkan kos dan masa penghantaran.',
    ].join('\n\n');

    const out = repairTechnicalKonvensionalDisplayStructure(prose, SCM_ASK, { answerPlan: plan });
    expect(out).toMatch(/### Apa itu supply chain management\?/i);
    expect(out).toMatch(/### Kepentingannya/i);
    expect(out).not.toMatch(/### Bagaimana ia berfungsi/i);
    expect(out).not.toMatch(/dan kepentingannya/i);
  });
});

describe('guard — compare usersTechnicalDirect preserves full answer', () => {
  const JENAYAH_SIVIL_ASK = 'Apa perbezaan antara hukum jenayah dan hukum sivil?';

  it('does not corrupt Kedua-dua synthesis closing', () => {
    const synthesis =
      'Kedua-dua cabang ini beroperasi dalam sistem mahkamah yang sama, tetapi dengan prosedur berbeza.';
    expect(repairTeachingStructuredOutput(synthesis)).toBe(synthesis);
  });

  it('sanitizeUsersOutputSync preserves table and synthesis on usersTechnicalDirect', () => {
    const raw = [
      'Hai QA, hukum jenayah dan sivil ialah dua cabang utama dalam sistem perundangan Malaysia.',
      '',
      '### Perbandingan hukum jenayah dan hukum sivil',
      '',
      '| Aspek | Hukum jenayah | Hukum sivil |',
      '| --- | --- | --- |',
      '| Tujuan | Ketenteraman awam | Pertikaian peribadi |',
      '',
      '### Perbezaan utama',
      '',
      'Jenayah dikendalikan oleh pendakwa raya; sivil dibawa oleh plaintif sendiri.',
      '',
      '### Contoh',
      '',
      'Ali dipukul (jenayah) dan menuntut ganti rugi (sivil) — kedua-dua boleh berjalan serentak.',
      '',
      'Kedua-dua cabang ini beroperasi dalam sistem mahkamah yang sama, tetapi dengan prosedur berbeza. Kefahaman tentang perbezaan ini penting untuk setiap warganegara.',
    ].join('\n');
    const out = sanitizeUsersOutputSync(raw, JENAYAH_SIVIL_ASK, [], [], 'QA', {
      usersTechnicalDirect: true,
    });
    expect(out).toMatch(/\| Aspek \| Hukum jenayah \| Hukum sivil \|/);
    expect(out).toMatch(/Kedua-dua cabang ini beroperasi/);
    expect(out).not.toMatch(/2\.\s+-dua cabang/);
    expect(out.length).toBeGreaterThan(raw.length * 0.85);
  });

  it('repairs long Perbandingan header and strips question echo from production-shaped compare', () => {
    const DEPTH_ASK =
      'Terangkan perbezaan antara hukum jenayah dan hukum sivil dalam sistem perundangan Malaysia. Lebih perinci dan perangkaan';
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: DEPTH_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    const broken = [
      'Hai QA,',
      '',
      '### Perbandingan hukum jenayah dan hukum sivil dalam sistem perundangan Malaysia. Lebih perinci dan perangkaan',
      '',
      '### Perbezaan utama',
      '',
      `${DEPTH_ASK}: (verified via web search, natasha-co.com).`,
      '',
      '### Contoh',
      '',
      'Hukum jenayah dan sivil beroperasi di bawah satu sistem mahkamah dengan beban pembuktian berbeza.',
      '',
      'Dari segi beban pembuktian, jenayah memerlukan di luar sebarang ragu-ragu manakala sivil hanya kemungkinan lebih besar daripada tidak.',
      '',
      'Kedua-dua cabang ini penting untuk setiap warganegara memahami hak dan tanggungjawab dalam sistem keadilan.',
    ].join('\n');
    const out = repairUsersDirectTechnicalDisplay(broken, DEPTH_ASK, plan);
    expect(out).toMatch(/### Perbandingan hukum jenayah dan hukum sivil$/m);
    expect(out).not.toMatch(/Lebih perinci dan perangkaan/);
    expect(out).not.toMatch(/verified via web search/i);
    expect(out).not.toMatch(/Terangkan perbezaan antara hukum jenayah/);
    expect(out).toMatch(/beban pembuktian/i);
    expect(out).toMatch(/Kedua-dua cabang ini penting/);
  });

  it('repairs economics essay-only stream into formal jadual + numbered sections', () => {
    const ECON_ASK =
      'Apakah kesan campur tangan kerajaan dalam mengawal harga barangan keperluan?';
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ECON_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    const essay = [
      '### Apa itu topik ini?',
      '',
      'Campur tangan kerajaan, seperti subsidi langsung dan kawalan harga, memberi kesan segera. Indeks harga pengguna (IHP) kekal stabil pada paras rendah, walaupun harga minyak dunia mendekati USD100 setong.',
      '',
      'Kesannya terhad dari segi jangka panjang. Subsidi menambah beban fiskal kerajaan.',
      '',
      'Lebih penting lagi: ia tidak menyentuh akar ketidakadilan mikro.',
      '',
      'w. dan para Khalifah menunjukkan alternatif yang lebih mendalam.',
      '',
      'Khalifah Umar ibn al-Khattab tidak menetapkan harga apabila didatangi wanita mengadu kenaikan harga daging.',
      '',
      'Campur tangan berkesan bukanlah yang menggantikan pasaran, tetapi yang memperkuatnya melalui pengawalseliaan ketat.',
    ].join('\n');
    const out = repairUsersDirectTechnicalDisplay(essay, ECON_ASK, plan);
    expect(out).toMatch(/### Apa itu campur tangan kerajaan/i);
    expect(out).not.toMatch(/topik ini/i);
    expect(out).toMatch(/### Data dan statistik/i);
    expect(out).toMatch(/\| Petunjuk \| Nilai \| Tahun\/sumber \|/);
    expect(out).toMatch(/### Mekanisme \/ saluran kesan/i);
    expect(out).toMatch(/^\s*1\.\s+/m);
    expect(out).not.toMatch(/Khalifah Umar/i);
    expect(out).not.toMatch(/^\s*w\.\s/m);
    expect(out).toMatch(/Campur tangan berkesan/i);
  });
});
