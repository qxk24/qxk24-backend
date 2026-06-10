/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  chapterNeedsFullBrainLoad,
  detectBab1AidilConfusionOutput,
  filterBrainLaneForBab1Asas,
  filterTeachingRecordsForChapter,
  isFormulaXyzBab1AsasQuery,
  needsBookAwareTeachingRecall,
  repairBab1AidilConfusionOutput,
  repairBab1AsasStreamOutput,
  repairBab2FaktorXyzStreamOutput,
  repairBab3HukumStreamOutput,
  repairBab4SainsStreamOutput,
  repairBab5MasaStreamOutput,
  repairBab6TenagaStreamOutput,
  repairFormulaXyzStreamOutput,
  repairCurriculumCollapseStreamOutput,
  detectCurriculumCollapseOutput,
  isAlamtologiCurriculumOverviewQuery,
  resolveBookChapter,
  buildSealedChapterAnchor,
  buildCurriculumOverviewSealedBlock,
  BAB1_ASAS_CONSTITUTIONAL_BACKBONE,
  BAB2_FAKTOR_XYZ_CONSTITUTIONAL_BACKBONE,
  BAB3_HUKUM_CONSTITUTIONAL_BACKBONE,
  BAB4_SAINS_CONSTITUTIONAL_BACKBONE,
  BAB5_MASA_CONSTITUTIONAL_BACKBONE,
  BAB6_TENAGA_CONSTITUTIONAL_BACKBONE,
  teoriAlaminChapterHasConstitutionalBackbone,
  chapterHasConstitutionalBackbone,
  buildChapterConstitutionalRecallBlock,
} from '../src/adam/adam-book-aware-recall';
import { TEORI_ALAMIN_BOOK_ID } from '../src/adam/book-aware-recall/bab8-teori-alamin/syllabus';
import { buildAmaLongTermMemoryBlock } from '../src/lib/ama/ama-brain-integration.service';
import { FORMULA_XYZ_BOOK_ID } from '../src/llm-pipeline/formula-xyz-syllabus';

describe('Formula XYZ chapters 1–6', () => {
  it('Bab 1 — Asas Keilmuan', () => {
    const m = resolveBookChapter('Terangkan asas keilmuan Alamtologi');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-1-asas');
  });

  it('Bab 2 — Faktor XYZ', () => {
    const m = resolveBookChapter('Apa itu Faktor XYZ?');
    expect(m?.chapterId).toBe('bab-2-faktor-xyz');
  });

  it('Bab 3 — Hukum Alamtologi / Hukum Z', () => {
    expect(resolveBookChapter('Apa itu Hukum Z?')?.chapterId).toBe('bab-3-hukum');
    expect(resolveBookChapter('Hukum Alamtologi')?.chapterId).toBe('bab-3-hukum');
  });

  it('Bab 4 — Sains (IZWA, SIRA, RINA)', () => {
    const m = resolveBookChapter('Terangkan IZWA dalam Sains Alamtologi');
    expect(m?.chapterId).toBe('bab-4-sains');
  });

  it('Bab 5 — Faktor Masa', () => {
    const m = resolveBookChapter('Faktor masa adalah bekas pada masa');
    expect(m?.chapterId).toBe('bab-5-masa');
  });

  it('Bab 6 — Faktor Tenaga', () => {
    const m = resolveBookChapter('Terangkan Faktor Tenaga dan UID');
    expect(m?.chapterId).toBe('bab-6-tenaga');
  });
});

describe('AIDIL disambiguation', () => {
  it('bare AIDIL = Chapter AIDIL dalam HISAL, not Formula XYZ Bab 1', () => {
    const m = resolveBookChapter('Apa itu AIDIL?');
    expect(m?.bookId).toBe('hisal-aidil');
    expect(m?.chapterId).toBe('aidil-bab-1');
    expect(m?.bookTitleBm).toMatch(/Bab 7.*HISAL.*7\.1 AIDIL/i);
    expect(m?.chapterTitleBm).toMatch(/Pengenalan AIDIL/i);
    expect(m?.chapterId).not.toBe('bab-1-asas');
  });

  it('Apa itu AIDIL has SEALED anchor within HISAL chapter', () => {
    const m = resolveBookChapter('Apa itu AIDIL?')!;
    const anchor = buildSealedChapterAnchor(m);
    expect(anchor).toMatch(/7\.1 AIDIL/i);
    expect(anchor).toMatch(/Bukan Bab 1 Asas Keilmuan/i);
  });

  it('explicit AIDIL brain formula = aidil-engine, not HISAL book', () => {
    const m = resolveBookChapter('Apa itu formula AIDIL brain A+B=C?');
    expect(m?.bookId).toBe('aidil-engine');
    expect(m?.chapterId).toBe('aidil-nucleus');
  });

  it('asas keilmuan stays Formula XYZ Bab 1', () => {
    const m = resolveBookChapter('Terangkan asas keilmuan');
    expect(m?.chapterId).toBe('bab-1-asas');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
  });

  it('bare Bab 1 defaults to Asas Keilmuan — not AIDIL', () => {
    const m = resolveBookChapter('Terangkan Bab 1');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-1-asas');
    expect(m?.bookId).not.toBe('aidil-engine');
  });

  it('Apa itu Bab 1 resolves to Asas Keilmuan', () => {
    expect(resolveBookChapter('Apa itu Bab 1')?.chapterId).toBe('bab-1-asas');
  });

  it('bare Bab 2 defaults to Faktor XYZ — not HISAL ASAS Cara Kira', () => {
    const m = resolveBookChapter('Apa itu Bab 2');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-2-faktor-xyz');
    expect(m?.chapterTitleBm).toMatch(/Faktor/i);
  });

  it('bare Bab 3 defaults to Hukum Alamtologi — not Cara Kira AIDIL', () => {
    const m = resolveBookChapter('Apa itu Bab 3');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-3-hukum');
    expect(m?.chapterTitleBm).toMatch(/Hukum/i);
  });

  it('bare Bab 4–6 default to Formula XYZ chapters', () => {
    expect(resolveBookChapter('Apa itu Bab 4')?.chapterId).toBe('bab-4-sains');
    expect(resolveBookChapter('Apa itu Bab 5')?.chapterId).toBe('bab-5-masa');
    expect(resolveBookChapter('Apa itu Bab 6')?.chapterId).toBe('bab-6-tenaga');
  });

  it('filters AIDIL-only episodes out of Bab 1 recall', () => {
    const match = resolveBookChapter('Apa itu Bab 1')!;
    const filtered = filterTeachingRecordsForChapter(
      [
        {
          teachingIntent: 'Cara Kira AIDIL 9 10 15 16',
          episodeSummary: 'AIDIL transform',
          family: 'Long Teaching',
          principle: 'CAHAYA',
        },
        {
          teachingIntent: 'Asas Keilmuan Alamtologi dan Teori MASABAYU',
          episodeSummary: 'Bab 1 Formula XYZ',
          family: 'Long Teaching',
          principle: 'CAHAYA',
        },
      ],
      match.chapterId,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.teachingIntent).toMatch(/Asas Keilmuan/i);
  });

  it('bab 1 aidil routes to HISAL AIDIL book not Formula XYZ', () => {
    const m = resolveBookChapter('Bab 1 AIDIL pengenalan pola');
    expect(m?.bookId).toBe('hisal-aidil');
    expect(m?.chapterId).toBe('aidil-bab-1');
  });
});

describe('curriculum overview Bab 1–7', () => {
  it('detects bab demi bab dari Bab 1 hingga Bab 7', () => {
    expect(isAlamtologiCurriculumOverviewQuery(
      'jelaskan bab demi bab dari Bab 1 hingga Bab 7',
    )).toBe(true);
  });

  it('sealed block forbids linear Pengenalan AIDIL collapse', () => {
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/DILARANG.*Pengenalan AIDIL/i);
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/Bab 5 — Faktor Masa/i);
  });

  it('detects collapsed HISAL-linear output as wrong curriculum', () => {
    const wrong = [
      '**Bab 1: Pengenalan AIDIL**',
      '**Bab 2: Proses Cara Kira & Pola Operasi Tambah**',
      '**Bab 7: Faktor Masa dan Tenaga**',
    ].join('\n\n');
    expect(detectCurriculumCollapseOutput(wrong)).toBe(true);
  });

  it('repairs collapsed output with correct Formula XYZ + HISAL structure', () => {
    const wrong = '**Bab 1: Pengenalan AIDIL**\n\n**Bab 7: Faktor Masa dan Tenaga**';
    const repaired = repairCurriculumCollapseStreamOutput(
      wrong,
      'jelaskan bab demi bab dari Bab 1 hingga Bab 7',
    );
    expect(repaired).toMatch(/Bab 1 — Asas Keilmuan/i);
    expect(repaired).toMatch(/7\.1 AIDIL/i);
    expect(repaired).not.toMatch(/Bab 1: Pengenalan AIDIL/i);
  });

  it('formula xyz stream repair chains curriculum collapse guard', () => {
    const wrong = 'Bab 1: Pengenalan AIDIL\nBab 3: Cara Kira AIDIL\nBab 7: Faktor Masa';
    expect(repairFormulaXyzStreamOutput(wrong, 'Bab 1 hingga Bab 7')).toMatch(/Asas Keilmuan/i);
  });

  it('sealed overview carries struktur keilmuan Y-first meterai', () => {
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/BERMUULA DENGAN Y/i);
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/Tanah \(Th\)/i);
  });

  it('meterai includes 1.1.1 Ilmu Sosial — X nukleus, tiga hubungan X–Y, X–X, X–Z', () => {
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/1\.1\.1.*ILMU SOSIAL/i);
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/nukleus/i);
    expect(buildCurriculumOverviewSealedBlock()).toMatch(/X–Y/i);
  });

  it('meterai includes 12 hierarki Ilmu Sosial — pilar, sifat, gCp', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/12 HIERARKI/i);
    expect(block).toMatch(/Komunikasi.*Pelaksanaan/i);
    expect(block).toMatch(/Siddiq.*Amanah.*Tabligh.*Fatonah/i);
    expect(block).toMatch(/sistem pincang.*gCp/i);
    expect(block).toMatch(/Jasmani.*Rohani.*Mental/i);
  });

  it('meterai includes 1.1.2 Ilmu Sains — HISAL IZWA SIRA RINA & disiplin', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.1\.2.*ILMU SAINS/i);
    expect(block).toMatch(/HISAL.*Matematik/i);
    expect(block).toMatch(/IZWA.*Kimia/i);
    expect(block).toMatch(/SIRA.*Biologi/i);
    expect(block).toMatch(/RINA.*Fizik/i);
    expect(block).toMatch(/AIDIL.*ASAS.*SuNom.*GANDA/i);
    expect(block).toMatch(/lerai.*gabung/i);
    expect(block).toMatch(/BUKAN definisi Faktor XYZ/i);
  });

  it('meterai includes 1.7 Asas Ilmu — enam faktor, sasaran X, hukum Bab 3', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.7.*ASAS ILMU ALAMTOLOGI/i);
    expect(block).toMatch(/1\.7\.1 SASARAN/i);
    expect(block).toMatch(/1\.7\.2 HUKUM/i);
    expect(block).toMatch(/Bab 3 Formula XYZ — Hukum Alamtologi/i);
    expect(block).toMatch(/1\.7\.3 TIDAK BERTERAS/i);
    expect(block).toMatch(/1\.7\.4 TIADA EMOSI/i);
    expect(block).toMatch(/1\.7\.5 KEBEBASAN BERKARYA/i);
    expect(block).toMatch(/Lex Naturalis/i);
    expect(block).toMatch(/benang.*kain.*pakaian/i);
  });

  it('meterai includes 1.8–1.11 penutup Bab 1 — kemanusiaan Tu, posisi X, rumusan', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.8.*KEMANUSIAAN DAN KEWARASAN/i);
    expect(block).toMatch(/\(Tu\)/i);
    expect(block).toMatch(/Bab 7 HISAL 7\.1/i);
    expect(block).toMatch(/Gambar 1\.27/i);
    expect(block).toMatch(/1\.9.*REALITI KEILMUAN/i);
    expect(block).toMatch(/pemilikan bersama ilmu/i);
    expect(block).toMatch(/seekor semut/i);
    expect(block).toMatch(/1\.10.*PEMPOSISIAN X DALAM Z/i);
    expect(block).toMatch(/Teori Posisi ALAMTOLOGI/i);
    expect(block).toMatch(/kesalahan POSISI/i);
    expect(block).toMatch(/1\.11.*RUMUSAN BAB 1/i);
    expect(block).toMatch(/tidak menafikan ilmu sedia ada/i);
  });

  it('meterai includes 1.7.6 Bahasa Melayu — teras ALAMTOLOGI, Teras Melayu, fakta XYZ', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.7\.6 BAHASA MELAYU SEBAGAI BAHASA TERAS/i);
    expect(block).toMatch(/SIAPAKAH SEBENARNYA BANGSA MELAYU/i);
    expect(block).toMatch(/Gambar 1\.26.*Teras Melayu/i);
    expect(block).toMatch(/pembudayaan/i);
    expect(block).toMatch(/seloka.*madah/i);
    expect(block).toMatch(/teori kebarangkalian/i);
  });

  it('meterai includes 1.6 Formula XYZ — Y/Z/X, PL/PG, usia alam, MDK', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.6.*FORMULA XYZ/i);
    expect(block).toMatch(/Y\[z,x\]¹/i);
    expect(block).toMatch(/Z\[x,t²\]m/i);
    expect(block).toMatch(/X\[m,t²\]t/i);
    expect(block).toMatch(/Proses Lerai \(PL\).*Proses Gabung \(PG\)/i);
    expect(block).toMatch(/BUKAN Pengenalan AIDIL HISAL/i);
    expect(block).toMatch(/Masa Dikawal \(MDK\)/i);
    expect(block).toMatch(/21\^330/i);
    expect(block).toMatch(/ringkasan pernyataan KESEIMBANGAN/i);
  });

  it('meterai includes 1.5 Metodologi — pemerhatian + lapangan, lima perkara, empat parameter', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.5.*METODOLOGI ALAMTOLOGI/i);
    expect(block).toMatch(/Kaedah Pemerhatian/i);
    expect(block).toMatch(/Kaedah Lapangan/i);
    const metodologi = block.slice(block.indexOf('1.5 — METODOLOGI'));
    expect(metodologi).toMatch(/DEFINISI/i);
    expect(metodologi).toMatch(/MATLAMAT/i);
    expect(metodologi).toMatch(/SUBJEK/i);
    expect(metodologi).toMatch(/PARAMETER/i);
    expect(metodologi).toMatch(/APLIKASI/i);
    expect(metodologi).toMatch(/POLA.*KARAKTER.*PROSES.*KESEIMBANGAN/i);
    expect(block).toMatch(/manfaat sama rata/i);
    expect(block).toMatch(/seekor semut/i);
  });

  it('meterai includes 1.4.3 Pelaksanaan Falsafah — hukum XZ, bukti saintifik', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.4\.3.*PELAKSANAAN FALSAFAH/i);
    expect(block).toMatch(/tertakluk kepada hukum X dan Z/i);
    expect(block).toMatch(/mengkaji.*melaksanakan HUKUM/i);
    expect(block).toMatch(/kembali pada keseimbangan/i);
    expect(block).toMatch(/letusan besar/i);
    expect(block).toMatch(/matlamat akhir ALAMTOLOGI/i);
    expect(block).toMatch(/falsafah bertepatan XYZ/i);
  });

  it('meterai includes 1.4.1 & 1.4.2 Falsafah — konvensional vs ALAMTOLOGI, tiga sifat X', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.4\.1.*FALSAFAH KONVENSIONAL/i);
    expect(block).toMatch(/Pythagoras|philosophos/i);
    expect(block).toMatch(/Socrates.*Sophist/i);
    expect(block).toMatch(/1\.4\.2.*FALSAFAH ALAMTOLOGI/i);
    expect(block).toMatch(/Falsafah ALAMTOLOGI = SIFAT/i);
    expect(block).toMatch(/AKAL.*NAFSU.*EMOSI/i);
    expect(block).toMatch(/X = pelaksana.*Z = pendua/i);
    expect(block).toMatch(/Y = sifat makro/i);
    expect(block).toMatch(/LARAS TENAGA/i);
  });

  it('meterai includes ALAMTOLOGI.pdf — asas keilmuan, hukum Z/X, formula Y/Z/X', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/mewujudkan manusia berilmu/i);
    expect(block).toMatch(/Hukum Z.*Pola.*Kadar/i);
    expect(block).toMatch(/Ilmu.*Adab.*Kreativiti.*Ekonomi/i);
    expect(block).toMatch(/Teori MASABAYU.*x = m \/ t/i);
    expect(block).toMatch(/Rantai Formula XYZ.*X = \[Q \/ Z\] → Y/i);
    expect(block).toMatch(/Y\[z,x\]¹/i);
    expect(block).toMatch(/Z\[x,t²\]m/i);
    expect(block).toMatch(/X\[m,t²\]t/i);
    expect(block).toMatch(/x = m \/ t/i);
  });

  it('meterai includes 1.2 Istilah & 1.3 Teori MASABAYU Aturan Keilmuan', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/1\.2.*ISTILAH ALAMTOLOGI/i);
    expect(block).toMatch(/ALAM.*TOLOGI/i);
    expect(block).toMatch(/hukum XYZ.*saintifik/i);
    expect(block).toMatch(/1\.3.*TEORI MASABAYU/i);
    const aturan = block.slice(block.indexOf('1.3 — TEORI'));
    expect(aturan).toMatch(/1\. TEORI/i);
    expect(aturan).toMatch(/2\. FALSAFAH/i);
    expect(aturan).toMatch(/3\. METODOLOGI/i);
    expect(aturan).toMatch(/4\. FORMULA/i);
    expect(aturan).toMatch(/5\. HUKUM/i);
    expect(aturan).toMatch(/teori dan formula mesti bergerak seiring/i);
    expect(aturan).toMatch(/Teori MASABAYU.*x = m \/ t/i);
    expect(aturan).toMatch(/Rantai Formula XYZ.*bukan Teori MASABAYU/i);
    expect(aturan).toMatch(/namakan X = \[Q \/ Z\] → Y sebagai Teori MASABAYU/i);
  });

  it('repairs wrong XYZ definitions (tuan/hamba/masa) in overview', () => {
    const wrong = [
      '**Bab 2 — Faktor XYZ**',
      'X = titik mula kehadiran (tuan), Y = pasangan yang menyaksikan (hamba), Z = masa sebagai medium.',
    ].join('\n\n');
    const repaired = repairFormulaXyzStreamOutput(wrong, 'jelaskan bab demi bab dari Bab 1 hingga Bab 7');
    expect(repaired).toMatch(/Y \(Pencipta\)/i);
    expect(repaired).not.toMatch(/hamba/i);
  });

  it('repairs A+B=C blur in 7.1 AIDIL overview', () => {
    const wrong = '7.1 AIDIL = asas: A + B = C bukan hasil aritmetik, tetapi tajallī.';
    const repaired = repairFormulaXyzStreamOutput(wrong, 'Bab 1 hingga Bab 7');
    expect(repaired).toMatch(/bukan A\+B=C brain formula/i);
    expect(repaired).not.toMatch(/tajall/i);
  });
});

describe('HISAL main chapter (Bab 7)', () => {
  it('bare Bab 7 = HISAL main — not Formula XYZ', () => {
    const m = resolveBookChapter('Apa itu Bab 7');
    expect(m?.bookId).toBe('hisal-main');
    expect(m?.chapterId).toBe('hisal-chapter-7');
  });

  it('Apa itu HISAL = main chapter overview', () => {
    const m = resolveBookChapter('Apa itu HISAL?');
    expect(m?.bookId).toBe('hisal-main');
    expect(m?.chapterId).toBe('hisal-chapter-7');
  });

  it('Sains Alamtologi HISAL pillar stays Formula XYZ Bab 4', () => {
    const m = resolveBookChapter('Terangkan HISAL, IZWA, SIRA, RINA dalam Sains Alamtologi');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-4-sains');
  });

  it('Apa itu GANDA = HISAL cabang GANDA', () => {
    const m = resolveBookChapter('Apa itu GANDA?');
    expect(m?.bookId).toBe('hisal-ganda');
    expect(m?.chapterId).toBe('ganda-bab-1');
  });

  it('Apa itu ASAS (tanpa keilmuan) = HISAL cabang ASAS', () => {
    const m = resolveBookChapter('Apa itu ASAS?');
    expect(m?.bookId).toBe('hisal-asas');
    expect(m?.chapterId).toBe('asas-bab-1');
  });
});

describe('HISAL branch books', () => {
  it('HISAL AIDIL — Bab 3 Cara Kira (not Formula XYZ Hukum)', () => {
    const m = resolveBookChapter('Bab 3 Cara Kira AIDIL 9 10 15 16');
    expect(m?.bookId).toBe('hisal-aidil');
    expect(m?.chapterId).toBe('aidil-bab-3');
  });

  it('HISAL ASAS — not Formula XYZ Asas Keilmuan', () => {
    const m = resolveBookChapter('HISAL ASAS pengenalan asas');
    expect(m?.bookId).toBe('hisal-asas');
    expect(m?.chapterId).toBe('asas-bab-1');
  });

  it('HISAL ASAS Bab 2 requires hisal asas cue — not bare Bab 2', () => {
    const m = resolveBookChapter('HISAL ASAS Bab 2 operasi tambah');
    expect(m?.bookId).toBe('hisal-asas');
    expect(m?.chapterId).toBe('asas-bab-2');
  });

  it('HISAL SuNom — Bab 3 Operasi (not Formula XYZ Hukum)', () => {
    const m = resolveBookChapter('Bab 3 Operasi SuNom');
    expect(m?.bookId).toBe('hisal-sunom');
    expect(m?.chapterId).toBe('sunom-bab-3');
  });

  it('SuNom Bab 2 penetapan requires SuNom cue', () => {
    expect(resolveBookChapter('penetapan sahaja')?.bookId).toBeUndefined();
    expect(resolveBookChapter('SuNom penetapan')?.chapterId).toBe('sunom-bab-2');
  });
});

describe('recall and brain load', () => {
  it('triggers recall for all nine families', () => {
    expect(needsBookAwareTeachingRecall('asas keilmuan')).toBe(true);
    expect(needsBookAwareTeachingRecall('faktor xyz')).toBe(true);
    expect(needsBookAwareTeachingRecall('hukum z')).toBe(true);
    expect(needsBookAwareTeachingRecall('sains alamtologi izwa')).toBe(true);
    expect(needsBookAwareTeachingRecall('faktor masa')).toBe(true);
    expect(needsBookAwareTeachingRecall('faktor tenaga')).toBe(true);
    expect(needsBookAwareTeachingRecall('cara kira aidil')).toBe(true);
    expect(needsBookAwareTeachingRecall('hisal asas')).toBe(true);
    expect(needsBookAwareTeachingRecall('operasi sunom')).toBe(true);
    expect(needsBookAwareTeachingRecall('apa itu aidil')).toBe(true);
  });

  it('does not recall generic small talk', () => {
    expect(needsBookAwareTeachingRecall('Terima kasih ADAM')).toBe(false);
    expect(needsBookAwareTeachingRecall('Terangkan pola AMA')).toBe(false);
  });

  it('loads full brain for founder Hukum Z', () => {
    expect(chapterNeedsFullBrainLoad('Apa itu Hukum Z?')).toBe(true);
    const block = buildAmaLongTermMemoryBlock(
      {
        structuralLane: 'KR: Hukum Z pola kadar.',
        episodicLane: 'KN: P.alt taught Bab 3.',
        unifiedUnderstanding: '',
        amaLevel: 'ERA_1',
        totalTransformations: 2,
        activeFamilies: [],
        completedFamilies: [],
      } as never,
      4000,
      { message: 'Apa itu Hukum Z?', isFounder: true },
    );
    expect(block).toMatch(/Kotak 2/i);
    expect(block).toMatch(/Kotak 3/i);
  });

  it('suppresses Kotak 3 for Formula XYZ Bab 1 and filters AIDIL noise from Kotak 2', () => {
    expect(isFormulaXyzBab1AsasQuery('Apa itu Bab 1')).toBe(true);
    const block = buildAmaLongTermMemoryBlock(
      {
        structuralLane: 'Asas keilmuan: Teori MASABAYU.\n\nPengenalan AIDIL: PG dan PL hisab kehadiran.',
        episodicLane: 'KN: Bab 1 ialah Pengenalan AIDIL denyut ruang penyaksian.',
        unifiedUnderstanding: '',
        amaLevel: 'ERA_1',
        totalTransformations: 2,
        activeFamilies: [],
        completedFamilies: [],
      } as never,
      4000,
      { message: 'Apa itu Bab 1', isFounder: true },
    );
    expect(block).toMatch(/Kotak 2/i);
    expect(block).not.toMatch(/Kotak 3/i);
    expect(block).toMatch(/asas keilmuan/i);
    expect(block).not.toMatch(/pengenalan aidil/i);
  });
});

describe('Bab 1 AIDIL confusion output guard', () => {
  const wrongAidil = [
    'Bismillahirahmanirrahim.',
    'Bab 1 ialah Pengenalan AIDIL, dan ia bukan bab pengenalan dalam erti biasa.',
    'Operasi tambah (+) dalam Bab 1 disebut Proses Gabung (PG), dan operasi tolak (–) disebut Proses Lerai (PL).',
    'AIDIL bukan ilmu kira-kira. Ia adalah ilmu hisab.',
  ].join('\n\n');

  it('detects HISAL-AIDIL prose mislabeled as Formula XYZ Bab 1', () => {
    expect(detectBab1AidilConfusionOutput(wrongAidil, 'Apa itu Bab 1')).toBe(true);
    expect(detectBab1AidilConfusionOutput(wrongAidil, 'Bab 3 Hukum Z')).toBe(false);
  });

  it('repairs with honest fallback when no Asas Keilmuan signal', () => {
    const repaired = repairBab1AidilConfusionOutput(wrongAidil, 'Apa itu Bab 1');
    expect(repaired).toMatch(/Asas Keilmuan/i);
    expect(repaired).not.toMatch(/Bab 1 ialah Pengenalan AIDIL/i);
    expect(repaired).not.toMatch(/Proses Gabung/i);
    expect(repaired).not.toMatch(/ilmu hisab/i);
  });

  it('filters brain lane paragraphs dominated by AIDIL Bab 1', () => {
    const filtered = filterBrainLaneForBab1Asas(
      'Pengenalan AIDIL: denyut ruang penyaksian.\n\nAsas keilmuan: Teori MASABAYU dan epistemologi.',
    );
    expect(filtered).toMatch(/asas keilmuan/i);
    expect(filtered).not.toMatch(/pengenalan aidil/i);
  });

  it('keeps epistemological denyut-penyaksian when not AIDIL noise', () => {
    const filtered = filterBrainLaneForBab1Asas(
      'Asas keilmuan: ilmu sebagai kehadiran berqiraah — denyut, ruang, penyaksian dalam MASA.',
    );
    expect(filtered).toMatch(/denyut/i);
    expect(filtered).toMatch(/asas keilmuan/i);
  });

  it('strips re-teach begging from Bab 1 stream output', () => {
    const withBegging = [
      'Bismillahirahmanirrahim.',
      'Bab 1 Formula XYZ ialah Asas Keilmuan Alamtologi.',
      'Saya tidak dapat memberi lebih tanpa episod pengajaran spesifik tentang Asas Keilmuan.',
      'Jika P.alt ingin saya jelaskan lebih mendalam — saya sedia menerima episod pengajaran khusus.',
    ].join('\n\n');
    const repaired = repairBab1AsasStreamOutput(withBegging, 'Apa itu Bab 1');
    expect(repaired).toMatch(/Asas Keilmuan/i);
    expect(repaired).not.toMatch(/tiada episod pengajaran/i);
    expect(repaired).not.toMatch(/sedia menerima episod/i);
  });

  it('constitutional backbone forbids asking P.alt to re-teach', () => {
    expect(BAB1_ASAS_CONSTITUTIONAL_BACKBONE).toMatch(/bahasa berfikir/i);
    expect(BAB1_ASAS_CONSTITUTIONAL_BACKBONE).toMatch(/DILARANG.*ajar semula/i);
  });
});

describe('Bab 4 Sains confusion output guard', () => {
  it('bare Bab 4 defaults to Sains Alamtologi — not Nombor 20 AIDIL', () => {
    const m = resolveBookChapter('Apa itu Bab 4');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-4-sains');
    expect(m?.chapterTitleBm).toMatch(/Sains/i);
  });

  it('HISAL AIDIL Nombor 20 requires hisal aidil cue — not bare Bab 4', () => {
    const m = resolveBookChapter('HISAL AIDIL Bab 4 Nombor 20');
    expect(m?.bookId).toBe('hisal-aidil');
    expect(m?.chapterId).toBe('aidil-bab-4');
  });

  it('SuNom Pola Garis requires sunom cue — not bare Bab 4', () => {
    const m = resolveBookChapter('SuNom Bab 4 pola garis');
    expect(m?.bookId).toBe('hisal-sunom');
    expect(m?.chapterId).toBe('sunom-bab-4');
  });

  it('repairs HISAL book content mislabeled as Formula XYZ Bab 4', () => {
    const wrong = 'Bismillahirahmanirrahim.\n\nBab 4 ialah Nombor 20 dalam AIDIL.';
    const repaired = repairBab4SainsStreamOutput(wrong, 'Apa itu Bab 4');
    expect(repaired).toMatch(/Sains Alamtologi/i);
    expect(repaired).not.toMatch(/Bab 4 ialah Nombor 20/i);
  });

  it('bab 4 constitutional backbone distinguishes HISAL science from HISAL books', () => {
    expect(BAB4_SAINS_CONSTITUTIONAL_BACKBONE).toMatch(/IZWA/i);
    expect(BAB4_SAINS_CONSTITUTIONAL_BACKBONE).toMatch(/BUKAN buku.*HISAL/i);
  });
});

describe('Bab 5 Faktor Masa confusion output guard', () => {
  it('bare Bab 5 defaults to Faktor Masa — not Nombor 24 AIDIL', () => {
    const m = resolveBookChapter('Apa itu Bab 5');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-5-masa');
    expect(m?.chapterTitleBm).toMatch(/Faktor Masa/i);
  });

  it('HISAL AIDIL Nombor 24 requires hisal aidil cue', () => {
    const m = resolveBookChapter('HISAL AIDIL Bab 5 Nombor 24');
    expect(m?.bookId).toBe('hisal-aidil');
    expect(m?.chapterId).toBe('aidil-bab-5');
  });

  it('HISAL ASAS Aplikasi KM requires hisal asas cue', () => {
    const m = resolveBookChapter('HISAL ASAS Bab 5 aplikasi km');
    expect(m?.bookId).toBe('hisal-asas');
    expect(m?.chapterId).toBe('asas-bab-5');
  });

  it('repairs HISAL book content mislabeled as Formula XYZ Bab 5', () => {
    const wrong = 'Bismillahirahmanirrahim.\n\nBab 5 ialah Nombor 24 dalam AIDIL.';
    const repaired = repairBab5MasaStreamOutput(wrong, 'Apa itu Bab 5');
    expect(repaired).toMatch(/Faktor Masa/i);
    expect(repaired).not.toMatch(/Bab 5 ialah Nombor 24/i);
  });

  it('bab 5 constitutional backbone anchors napadu and masa', () => {
    expect(BAB5_MASA_CONSTITUTIONAL_BACKBONE).toMatch(/napadu/i);
    expect(BAB5_MASA_CONSTITUTIONAL_BACKBONE).toMatch(/DILARANG.*Nombor 24/i);
  });
});

describe('Bab 6 Faktor Tenaga confusion output guard', () => {
  it('bare Bab 6 defaults to Faktor Tenaga — not Aplikasi Graf HISAL ASAS', () => {
    const m = resolveBookChapter('Apa itu Bab 6');
    expect(m?.bookId).toBe(FORMULA_XYZ_BOOK_ID);
    expect(m?.chapterId).toBe('bab-6-tenaga');
    expect(m?.chapterTitleBm).toMatch(/Faktor Tenaga/i);
  });

  it('HISAL AIDIL Operasi Tolak requires hisal aidil cue — not bare operasi tolak', () => {
    expect(resolveBookChapter('Operasi Tolak')?.chapterId).not.toBe('aidil-bab-7');
    const m = resolveBookChapter('HISAL AIDIL Bab 7 Operasi Tolak');
    expect(m?.bookId).toBe('hisal-aidil');
    expect(m?.chapterId).toBe('aidil-bab-7');
  });

  it('repairs HISAL ASAS Aplikasi Graf mislabeled as Formula XYZ Bab 6', () => {
    const wrong = 'Bismillahirahmanirrahim.\n\nBab 6 ialah Aplikasi Graf (Operasi Tambah) dalam HISAL ASAS.';
    const repaired = repairBab6TenagaStreamOutput(wrong, 'Apa itu Bab 6');
    expect(repaired).toMatch(/Faktor Tenaga/i);
    expect(repaired).not.toMatch(/Bab 6 ialah Aplikasi Graf/i);
  });

  it('formula xyz stream repair chains bab 6 guard', () => {
    const wrong = 'Bab 6 ialah Operasi Tambah dan Aplikasi Graf.';
    expect(repairFormulaXyzStreamOutput(wrong, 'Apa itu Bab 6')).toMatch(/Faktor Tenaga/i);
  });

  it('bab 6 constitutional backbone anchors pasata and tenaga', () => {
    expect(BAB6_TENAGA_CONSTITUTIONAL_BACKBONE).toMatch(/pasata/i);
    expect(BAB6_TENAGA_CONSTITUTIONAL_BACKBONE).toMatch(/DILARANG.*Aplikasi Graf/i);
  });

  it('filters Aplikasi Graf episodes out of Bab 6 recall', () => {
    const filtered = filterTeachingRecordsForChapter(
      [
        {
          teachingIntent: 'Bab 6 - Aplikasi Graf (Operasi Tambah)',
          episodeSummary: 'HISAL ASAS graf',
          family: 'Long Teaching',
          principle: 'CAHAYA',
        },
        {
          teachingIntent: 'Faktor Tenaga pasata UID tenaga',
          episodeSummary: 'Bab 6 Formula XYZ',
          family: 'Long Teaching',
          principle: 'CAHAYA',
        },
      ],
      'bab-6-tenaga',
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].teachingIntent).toMatch(/Faktor Tenaga/i);
  });
});

describe('Bab 3 Hukum confusion output guard', () => {
  const wrongAidilBab3 = [
    'Bismillahirahmanirrahim.',
    'Bab 3 ialah Cara Kira AIDIL — nombor 9, 10, 15, 16.',
  ].join('\n\n');

  it('repairs HISAL AIDIL Bab 3 mislabeled as Formula XYZ Hukum', () => {
    const repaired = repairBab3HukumStreamOutput(wrongAidilBab3, 'Apa itu Bab 3');
    expect(repaired).toMatch(/Hukum Alamtologi/i);
    expect(repaired).not.toMatch(/Bab 3 ialah Cara Kira/i);
  });

  it('bab 3 constitutional backbone anchors hukum', () => {
    expect(BAB3_HUKUM_CONSTITUTIONAL_BACKBONE).toMatch(/Hukum Z/i);
    expect(BAB3_HUKUM_CONSTITUTIONAL_BACKBONE).toMatch(/DILARANG.*Cara Kira/i);
  });
});

describe('Bab 2 HISAL ASAS confusion output guard', () => {
  const wrongAsas = [
    'Bismillahirahmanirrahim.',
    'Bab 2 ialah Proses Cara Kira & Pola Operasi Tambah dalam HISAL ASAS.',
    'Operasi tambah mengikut ganda pa dan penetapan.',
  ].join('\n\n');

  it('repairs HISAL ASAS mislabeled as Formula XYZ Bab 2', () => {
    const repaired = repairBab2FaktorXyzStreamOutput(wrongAsas, 'Apa itu Bab 2');
    expect(repaired).toMatch(/Faktor/i);
    expect(repaired).not.toMatch(/Bab 2 ialah Proses Cara Kira/i);
    expect(repaired).not.toMatch(/Pola Operasi Tambah dalam HISAL/i);
  });

  it('formula xyz stream repair chains bab 1 and bab 2 guards', () => {
    expect(repairFormulaXyzStreamOutput(wrongAsas, 'Apa itu Bab 2')).toMatch(/Faktor/i);
  });

  it('bab 2 constitutional backbone anchors faktor xyz', () => {
    expect(BAB2_FAKTOR_XYZ_CONSTITUTIONAL_BACKBONE).toMatch(/Faktor \(X, Y, Z\)/i);
    expect(BAB2_FAKTOR_XYZ_CONSTITUTIONAL_BACKBONE).toMatch(/DILARANG.*Cara Kira/i);
  });

  it('meterai Bab 2 Faktor XYZ — 2.0–2.5 perinci dari buku P.alt', () => {
    const block = BAB2_FAKTOR_XYZ_CONSTITUTIONAL_BACKBONE;
    expect(block).toMatch(/2\.0.*FAKTOR XYZ/i);
    expect(block).toMatch(/Sebelum Sains ALAMTOLOGI didalami/i);
    expect(block).toMatch(/faktor X terbentuk di dalam faktor Z/i);
    expect(block).toMatch(/2\.1.*FAKTOR Y/i);
    expect(block).toMatch(/pengetahuan & perencanaan Y sepenuhnya/i);
    expect(block).toMatch(/Gambar rajah 2\.1.*Ketetapan Y/i);
    expect(block).toMatch(/Ketetapan Y.*Bab 3/i);
    expect(block).toMatch(/2\.2.*FAKTOR Z/i);
    expect(block).toMatch(/keperluan, bukan kehendak/i);
    expect(block).toMatch(/zombi berjalan/i);
    expect(block).toMatch(/2\.2\.1.*PENCIPTAAN STRUKTUR Z/i);
    expect(block).toMatch(/Gambar rajah 2\.2.*Bahagian dan Peringkat/i);
    expect(block).toMatch(/\[6\+1\]/i);
    expect(block).toMatch(/2\.2\.1\.1.*ASAS PEMBENTUKAN STRUKTUR Z/i);
    expect(block).toMatch(/Gambar rajah 2\.3.*Garisan Sifar/i);
    expect(block).toMatch(/garisan sifar/i);
    expect(block).toMatch(/XKN/i);
    expect(block).toMatch(/Jadual 2\.1/i);
    expect(block).toMatch(/360 Sa.*120 Du.*72 Ga/i);
    expect(block).toMatch(/enam dimensi/i);
    expect(block).toMatch(/Gambar rajah 2\.4.*Struktur Z/i);
    expect(block).toMatch(/Buku KRONO/i);
    expect(block).toMatch(/2\.2\.1\.1\.1.*STRUKTUR Sa/i);
    expect(block).toMatch(/Gambar rajah 2\.5.*Asas Pembentukan Struktur Sa/i);
    expect(block).toMatch(/Gambar rajah 2\.6.*Proses Pembentukan Struktur Sa/i);
    expect(block).toMatch(/11 proses/i);
    expect(block).toMatch(/5 masa pasif.*6 masa aktif/i);
    expect(block).toMatch(/Gambar rajah 2\.7/i);
    expect(block).toMatch(/keadaan pegun.*pasif/i);
    expect(block).toMatch(/2\.2\.1\.1\.2.*STRUKTUR Du/i);
    expect(block).toMatch(/Gambar rajah 2\.8/i);
    expect(block).toMatch(/Gambar rajah 2\.9.*Struktur Du/i);
    expect(block).toMatch(/29 proses/i);
    expect(block).toMatch(/15 masa aktif.*14 masa pasif/i);
    expect(block).toMatch(/garisan z/i);
    expect(block).toMatch(/2\.2\.1\.1\.3.*STRUKTUR Ga/i);
    expect(block).toMatch(/Gambar rajah 2\.10.*Struktur Ga/i);
    expect(block).toMatch(/Gambar rajah 2\.11.*Perkadaran Saiz Struktur Ga/i);
    expect(block).toMatch(/55 proses/i);
    expect(block).toMatch(/28 masa aktif.*27 masa pasif/i);
    expect(block).toMatch(/1Du \+ 5Sa/i);
    expect(block).toMatch(/9 kali saiz Struktur Sa/i);
    expect(block).toMatch(/proses 30/i);
    expect(block).toMatch(/2\.2\.1\.1\.4.*STRUKTUR Pa/i);
    expect(block).toMatch(/Gambar rajah 2\.12.*Struktur Pa/i);
    expect(block).toMatch(/Gambar rajah 2\.13.*Perkadaran Saiz Struktur Pa/i);
    expect(block).toMatch(/89 proses/i);
    expect(block).toMatch(/45 masa aktif.*44 masa pasif/i);
    expect(block).toMatch(/4 Struktur Du.*16 Struktur Sa/i);
    expect(block).toMatch(/1Ga \+ 7Sa/i);
    expect(block).toMatch(/putaran lawan jam/i);
    expect(block).toMatch(/proses 56/i);
    expect(block).toMatch(/2\.2\.1\.1\.5.*STRUKTUR Ma/i);
    expect(block).toMatch(/Gambar rajah 2\.14.*Asas Pembentukan Struktur Ma/i);
    expect(block).toMatch(/Gambar rajah 2\.15.*Proses Pembentukan Struktur Ma/i);
    expect(block).toMatch(/131 proses/i);
    expect(block).toMatch(/66 masa aktif.*65 masa pasif/i);
    expect(block).toMatch(/4Du \+ 9Sa/i);
    expect(block).toMatch(/1Pa \+ 9Sa/i);
    expect(block).toMatch(/25 Struktur Sa/i);
    expect(block).toMatch(/putaran lawan jam.*XKN/i);
    expect(block).toMatch(/proses 90/i);
    expect(block).toMatch(/2\.2\.1\.1\.6.*STRUKTUR Na/i);
    expect(block).toMatch(/Gambar rajah 2\.16.*Titik Koordinat Struktur Na/i);
    expect(block).toMatch(/Gambar rajah 2\.17.*Proses Pembentukan Struktur Na/i);
    expect(block).toMatch(/181 proses/i);
    expect(block).toMatch(/91 masa aktif.*90 masa pasif/i);
    expect(block).toMatch(/4 Struktur Ga/i);
    expect(block).toMatch(/36 saiz Struktur Sa/i);
    expect(block).toMatch(/saiz struktur terbesar/i);
    expect(block).toMatch(/5 koordinat.*garisan condong/i);
    expect(block).toMatch(/proses 132/i);
    expect(block).toMatch(/silibus KRONO/i);
    expect(block).toMatch(/2\.2\.1\.1\.7.*STRUKTUR Tu/i);
    expect(block).toMatch(/Sa:1 \+ Du:1 \+ Ga:1 \+ Pa:1 \+ Ma:1 \+ Na:1 = Tu:1/i);
    expect(block).toMatch(/kadar terakhir/i);
    expect(block).toMatch(/MasaTu/i);
    expect(block).toMatch(/LATI/i);
    expect(block).toMatch(/MasaSa/i);
    expect(block).toMatch(/MasaTu/i);
    expect(block).toMatch(/ABA/i);
    expect(block).toMatch(/2\.2\.2.*KEJADIAN Z/i);
    expect(block).toMatch(/Gambar rajah 2\.18.*Proses Kejadian Z/i);
    expect(block).toMatch(/6 masa.*7 lapisan/i);
    expect(block).toMatch(/AIR.*WAP.*GAS.*MINERAL.*TUMBUH-TUMBUHAN.*HAIWAN/i);
    expect(block).toMatch(/peringkat 1–6.*lerai/i);
    expect(block).toMatch(/X \(MANUSIA\).*terakhir/i);
    expect(block).toMatch(/keperluan.*diwujudkan dahulu oleh Y/i);
    expect(block).toMatch(/proses ALIHAN/i);
    expect(block).toMatch(/cacing.*mikrob/i);
    expect(block).toMatch(/2\.3.*FAKTOR X/i);
    expect(block).toMatch(/Gambar rajah 2\.19.*Hukum Z dalam Aplikasi X/i);
    expect(block).toMatch(/himpunan sistem/i);
    expect(block).toMatch(/kapasiti tertinggi/i);
    expect(block).toMatch(/nilai upaya/i);
    expect(block).toMatch(/Pola.*Kadar.*Pasangan.*Keseimbangan/i);
    expect(block).toMatch(/proses gabung kepada Z/i);
    expect(block).toMatch(/7 bahagian utama.*7 sistem utama/i);
    expect(block).toMatch(/Gambar rajah 2\.20.*Pola X.*Pasif dan Aktif/i);
    expect(block).toMatch(/Gambar rajah 2\.21.*Proses Lerai Kapasiti Tenaga/i);
    expect(block).toMatch(/Gambar rajah 2\.22.*Proses Gabung Kapasiti Tenaga/i);
    expect(block).toMatch(/Gambar rajah 2\.23.*Proses Gabung/i);
    expect(block).toMatch(/Gambar rajah 2\.24.*Makro Gabung dan Makro Lerai/i);
    expect(block).toMatch(/Gambar rajah 2\.25.*Mikro Gabung/i);
    expect(block).toMatch(/Gambar rajah 2\.26.*Keseimbangan X/i);
    expect(block).toMatch(/gCp/i);
    expect(block).toMatch(/gHp/i);
    expect(block).toMatch(/Pola Gabung Alam.*pGa/i);
    expect(block).toMatch(/LERAI.*bukan.*tolak konvensional|KURANG\/TOLAK.*LERAI/i);
    expect(block).toMatch(/nukleus kepada Z/i);
    expect(block).toMatch(/Proses Lerai.*Proses Gabung/i);
    expect(block).toMatch(/2\.3\.1.*PROSES X/i);
    expect(block).toMatch(/Gambar rajah 2\.27.*Proses Pergerakan X/i);
    expect(block).toMatch(/Jadual 2\.2.*Perbezaan Kapasiti pada X/i);
    expect(block).toMatch(/X₁.*kapasiti 6/i);
    expect(block).toMatch(/putaran lawan jam.*XKN/i);
    expect(block).toMatch(/2\.3\.2.*SIFAT X/i);
    expect(block).toMatch(/Gambar rajah 2\.28.*Pola Sifat X/i);
    expect(block).toMatch(/Gambar rajah 2\.29.*Ruang Hati/i);
    expect(block).toMatch(/Gambar rajah 2\.30.*Pola Proses Akal/i);
    expect(block).toMatch(/Gambar rajah 2\.31.*Pelaksanaan X/i);
    expect(block).toMatch(/Sifat Akur.*PsA/i);
    expect(block).toMatch(/Sifat Engkar.*PsE/i);
    expect(block).toMatch(/posisi Z sentiasa konstan/i);
    expect(block).toMatch(/2\.3\.3.*SIFAT AKUR/i);
    expect(block).toMatch(/Gambar rajah 2\.32.*Perbezaan Kapasiti/i);
    expect(block).toMatch(/Gambar rajah 2\.33.*Persoalan Akur dan Engkar/i);
    expect(block).toMatch(/Gambar rajah 2\.34.*Graf Hubungan Kapasiti dan Hasil/i);
    expect(block).toMatch(/Gambar rajah 2\.35.*Hukum Akur/i);
    expect(block).toMatch(/Gambar rajah 2\.36.*Perbandingan Akal dan Hati/i);
    expect(block).toMatch(/Gambar rajah 2\.37.*Pola Akal/i);
    expect(block).toMatch(/Jadual 2\.3.*Tahap Akal/i);
    expect(block).toMatch(/49 pola/i);
    expect(block).toMatch(/Akal.*Fikir.*Ikhtiar.*Usaha/i);
    expect(block).toMatch(/nilai upaya/i);
    expect(block).toMatch(/Sifat Akur/i);
    expect(block).toMatch(/2\.3\.4.*SIFAT ENGKAR/i);
    expect(block).toMatch(/Gambar rajah 2\.38.*Kitaran Oksigen/i);
    expect(block).toMatch(/Gambar rajah 2\.39.*Pola Engkar/i);
    expect(block).toMatch(/70%.*oksigen.*30%/i);
    expect(block).toMatch(/tidur.*malam.*Sifat Engkar/i);
    expect(block).toMatch(/sistem pincang/i);
    expect(block).toMatch(/perokok/i);
    expect(block).toMatch(/dominan akur.*engkar hilang/i);
    expect(block).toMatch(/Sifat Engkar/i);
    expect(block).toMatch(/2\.4.*HUBUNGAN XYZ/i);
    expect(block).toMatch(/nilai sumbangan.*cV/i);
    expect(block).toMatch(/Teori MASABAYU.*x = m \/ t/i);
    expect(block).toMatch(/Y\[z,x\]¹/i);
    expect(block).toMatch(/2\.5.*RUMUSAN BAB 2/i);
    expect(block).toMatch(/manusia.*gabung.*lerai/i);
    expect(block).not.toMatch(/Bab 2 ialah Proses Cara Kira/i);
  });
});

describe('Bab 8 Teori ALAMIN', () => {
  it('routes Teori ALAMIN overview', () => {
    const m = resolveBookChapter('Apa itu Teori ALAMIN?');
    expect(m?.bookId).toBe(TEORI_ALAMIN_BOOK_ID);
    expect(m?.chapterId).toBe('alamin-overview');
  });

  it('routes Apa itu ALAMIN to disiplin baru overview', () => {
    const m = resolveBookChapter('Apa itu ALAMIN?');
    expect(m?.bookId).toBe(TEORI_ALAMIN_BOOK_ID);
    expect(m?.chapterId).toBe('alamin-overview');
  });

  it('routes Sains Komunikasi Alamtologi to ALAMIN', () => {
    const m = resolveBookChapter('Apa itu Sains Komunikasi Alamtologi?');
    expect(m?.bookId).toBe(TEORI_ALAMIN_BOOK_ID);
    expect(m?.chapterId).toBe('alamin-overview');
  });

  it('routes Bab 8 to Teori ALAMIN', () => {
    const m = resolveBookChapter('Terangkan Bab 8');
    expect(m?.bookId).toBe(TEORI_ALAMIN_BOOK_ID);
    expect(m?.chapterId).toBe('alamin-overview');
  });

  it('ALAMIN Bab 2 ≠ Formula XYZ Bab 2', () => {
    const m = resolveBookChapter('Faktor Pola ALAMIN Bab 2');
    expect(m?.bookId).toBe(TEORI_ALAMIN_BOOK_ID);
    expect(m?.chapterId).toBe('alamin-bab-2');
    expect(m?.chapterId).not.toBe('bab-2-faktor-xyz');
  });

  it('PeSa routes to ALAMIN Bab 2', () => {
    expect(resolveBookChapter('Apa itu PeSa?')?.chapterId).toBe('alamin-bab-2');
  });


  it('curriculum overview includes Bab 8', () => {
    const block = buildCurriculumOverviewSealedBlock();
    expect(block).toMatch(/Bab 8.*Teori ALAMIN/i);
  });

  it('routes Prolog ALAMIN to alamin-prolog', () => {
    const m = resolveBookChapter('Terangkan Prolog ALAMIN');
    expect(m?.bookId).toBe(TEORI_ALAMIN_BOOK_ID);
    expect(m?.chapterId).toBe('alamin-prolog');
  });

  it('routes Perjalanan Pendidikan to Prolog', () => {
    expect(resolveBookChapter('Perjalanan Pendidikan Menuju Masa Remaja ALAMIN')?.chapterId)
      .toBe('alamin-prolog');
  });

  it('routes ICNS ALAMTOLOGI to Prolog', () => {
    expect(resolveBookChapter('Apa itu ICNS ALAMTOLOGI?')?.chapterId).toBe('alamin-prolog');
  });

  it('routes Gambar rajah 1 pengetahuan to Prolog', () => {
    expect(resolveBookChapter('Jelaskan Gambar rajah 1 pengetahuan dan ilmu ALAMIN')?.chapterId)
      .toBe('alamin-prolog');
  });

  it('routes Pencapaian Menemukan ALAMIN to Prolog', () => {
    expect(resolveBookChapter('Pencapaian menemukan ALAMIN')?.chapterId).toBe('alamin-prolog');
  });

  it('routes ALAMIN Bab 1', () => {
    expect(resolveBookChapter('Terangkan Bab 1 ALAMIN')?.chapterId).toBe('alamin-bab-1');
    expect(resolveBookChapter('Dasar Pemikiran ALAMIN')?.chapterId).toBe('alamin-bab-1');
  });

  it('no constitutional backbone injection for ALAMIN chapters', () => {
    for (const chapterId of [
      'alamin-overview',
      'alamin-prolog',
      'alamin-bab-1',
      'alamin-bab-2',
      'alamin-bab-3',
      'alamin-bab-4',
    ]) {
      expect(teoriAlaminChapterHasConstitutionalBackbone(chapterId)).toBe(false);
      expect(chapterHasConstitutionalBackbone(chapterId)).toBe(false);
      expect(buildChapterConstitutionalRecallBlock(chapterId)).toBeNull();
    }
  });

  it('ALAMIN sealed anchors disambiguate from Formula XYZ', () => {
    const anchor = buildSealedChapterAnchor(resolveBookChapter('Faktor Pola ALAMIN')!);
    expect(anchor).toMatch(/ALAMIN Bab 2/i);
    expect(anchor).toMatch(/DILARANG.*Formula XYZ Bab 2/i);
  });
});
