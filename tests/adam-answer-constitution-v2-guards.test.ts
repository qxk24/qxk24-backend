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
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import {
  RN_FULL_VOICE_REGRESSION_SAMPLE,
  RN_PRACTICAL_ADVISORY_ASK,
  isRnPracticalAdvisoryFullVoiceBody,
  repairPracticalAdvisoryGoldShape,
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

describe('repairPracticalAdvisoryGoldShape', () => {
  const PRODUCTION_STUB = [
    'What does a registered nurse do, and what skills do I need?: (verified via web search, healthcareers.nhs.uk).',
    'A registered nurse is responsible for the care of multiple patients.',
    'Would you like me to explain another part in more detail?',
  ].join('\n\n');

  it('inserts official skills label when synthesis omitted it', () => {
    const out = repairPracticalAdvisoryGoldShape(PRODUCTION_STUB, RN_PRACTICAL_ADVISORY_ASK);
    expect(out).toMatch(/Skills you'?ll need \(from official nursing guidance\)/i);
    expect(out).toMatch(/clinical assessment and safe care/i);
    expect(out).toMatch(/explain further/i);
  });

  it('does not duplicate skills label when already present', () => {
    const out = repairPracticalAdvisoryGoldShape(RN_FULL_VOICE_REGRESSION_SAMPLE, RN_PRACTICAL_ADVISORY_ASK);
    expect(out).toBe(RN_FULL_VOICE_REGRESSION_SAMPLE);
  });
});

describe('sanitizeUsersOutputSync — profile-aware (P4)', () => {
  it('strips β lived pictures on tier-1 α fotosintesis (no door opt-in)', () => {
    const out = sanitizeUsersOutputSync(BETA_LIVED, 'Apa itu fotosintesis?');
    expect(out).not.toMatch(/daun di pokok limau/i);
    expect(out).not.toMatch(/Bayi yang sedang tidur/i);
    expect(out).toMatch(/Secara ilmu konvensional/i);
    expect(out).not.toMatch(/Pernahkah anda/i);
  });

  it('keeps β lived pictures after user accepted universal scholar door', () => {
    const assistant = [
      'Fotosintesis menukar cahaya kepada gula.',
      'Adakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(BETA_LIVED, 'Ya, terangkan lagi', [], [assistant]);
    expect(out).toMatch(/daun di pokok limau/i);
    expect(out).toMatch(/Secara ilmu konvensional/i);
  });

  it('does not append career door on α simple factual', () => {
    const body = 'Presiden Republik Indonesia sekarang ialah Prabowo Subianto, dilantik 20 Oktober 2024.';
    const out = sanitizeUsersOutputSync(body, 'Siapa presiden Indonesia sekarang?');
    expect(out).not.toMatch(/skills and tools/i);
    expect(out).not.toMatch(/kemahiran dan alat/i);
    expect(out).toContain('Prabowo');
  });

  it('keeps practical advisory career door on job thread', () => {
    const door = 'Would you like more on skills and tools, a career path, or a real-world example?';
    const out = sanitizeUsersOutputSync(
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
    const out = sanitizeUsersOutputSync(
      RN_ESSAY,
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(out).toMatch(/holistic care of patients/i);
    expect(out).toMatch(/ways of being in relationship/i);
    expect(out).toMatch(/explain further/i);
    expect(out.length).toBeGreaterThan(RN_ESSAY.length * 0.85);
  });

  it('preserves official RN gold sample — Founder seal v2.1', () => {
    const out = sanitizeUsersOutputSync(RN_FULL_VOICE_REGRESSION_SAMPLE, RN_PRACTICAL_ADVISORY_ASK);
    expect(out).toMatch(/verified via web search, healthcareers\.nhs\.uk/i);
    expect(out).toMatch(/holding space with clarity/i);
    expect(out).toMatch(/Skills you'?ll need \(from official nursing guidance\)/i);
    expect(out).toMatch(/explain further/i);
    expect(out).toBe(RN_FULL_VOICE_REGRESSION_SAMPLE);
  });

  const SPIDER_SIMPLE_FACTUAL_ASK =
    'Berapa banyak kaki yang ada pada seekor labah-labah? Macam mana awak tahu?';

  /** Founder gold — lively α factual voice after framework guard (v2, 2026-06). */
  const SPIDER_SIMPLE_FACTUAL_GOLD_V2 = [
    'Seekor labah-labah mempunyai lapan kaki, tanpa pengecualian. Ini bukan angka yang berubah mengikut spesies atau keadaan — ia adalah ciri taksonomi muktamad: semua ahli kelas Arachnida, termasuk labah-labah, ketam pasir, dan tungau, mempunyai tepat lapan kaki.',
    'Perbezaan ini jelas membezakannya daripada serangga (enam kaki) dan krustasea (sepuluh atau lebih kaki).',
    'Saya tahu ini bukan dari hafalan semata-mata, tetapi dari prinsip biologi yang diuji dan disahkan secara berulang — melalui pemerhatian mikroskopik, kajian morfologi komparatif, dan rekod taksonomi global seperti Integrated Taxonomic Information System (ITIS) dan World Spider Catalog. Setiap kaki labah-labah juga mempunyai fungsi khusus: dua kaki depan berperanan sebagai alat sentuh dan pengikat mangsa, empat kaki tengah untuk pergerakan stabil, dan dua kaki belakang untuk menenun jaring atau mengawal keseimbangan — satu reka bentuk fungsional yang padat dan tepat.',
    'Jawapan ini tidak bergantung pada teori atau pendapat. Ia boleh dilihat dengan mata kasar pada sebarang spesimen hidup atau kering, diuji dalam makmal zoologi, atau disahkan dalam mana-mana buku teks biologi tingkatan empat hingga universiti.',
    'Angka lapan bukan sekadar bilangan — ia adalah tanda kestabilan struktur, kecukupan fungsi, dan konsistensi hukum alam yang tidak pernah gagal dalam pemerhatian ilmiah.',
    'Adakah anda ingin saya terangkan bagaimana sistem saraf teragih labah-labah membolehkan lapan kaki bergerak secara koordinat tanpa otak pusat?',
  ].join('\n\n');

  it('preserves lively α spider gold v2 — guards must not flatten ADAM voice', () => {
    const out = sanitizeUsersOutputSync(SPIDER_SIMPLE_FACTUAL_GOLD_V2, SPIDER_SIMPLE_FACTUAL_ASK);
    expect(out).toBe(SPIDER_SIMPLE_FACTUAL_GOLD_V2);
    expect(out).toMatch(/tanpa pengecualian/i);
    expect(out).toMatch(/ITIS/i);
    expect(out).toMatch(/reka bentuk fungsional/i);
    expect(out).toMatch(/hukum alam/i);
    expect(out).toMatch(/sistem saraf teragih/i);
  });

  it('strips Alamtologi RUANG/MASA paragraph on α simple factual (spider legs)', () => {
    const leak = [
      'Dalam konteks Alamtologi, angka lapan ini bukan sekadar bilangan,',
      'ia mencerminkan keseimbangan antara RUANG dan MASA dalam pergerakan yang terus-menerus.',
    ].join(' ');
    const body = [
      'Seekor labah-labah mempunyai lapan kaki — kelas Arachnida, bukan serangga enam kaki.',
      'Saya tahu ini dari klasifikasi zoologi dan pemerhatian saintifik yang didokumentasikan.',
      leak,
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(body, SPIDER_SIMPLE_FACTUAL_ASK);
    expect(out).toMatch(/lapan kaki/i);
    expect(out).toMatch(/Arachnida|zoologi/i);
    expect(out).not.toMatch(/RUANG|MASA|Alamtologi/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('strips HISAL arithmetic sermon on α word-problem (3 epal + 4)', () => {
    const APPLE_ASK = 'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?';
    const body = [
      'Kalau awak ada 3 epal, dan kawan awak bagi 4 lagi, maka jumlah epal awak sekarang ialah 7. Cara kira mudahnya: 3 + 4 = 7.',
      'Ia bukan sekadar angka — ia adalah proses gabungan yang nyata: tiga benda yang sudah ada, disatukan dengan empat benda baru, menghasilkan satu keseluruhan yang utuh — tujuh.',
      'Dalam ilmu HISAL Alamtologi, angka 7 ini mempunyai makna khusus: ia adalah angka kesempurnaan proses, kerana ia melibatkan gabungan enam permukaan kiub menjadi satu bentuk lengkap.',
      'Tetapi untuk soalan ini, jawapannya tetap jelas dan praktikal: 7 epal, dan itu boleh dikira dengan jari — selagi akal dan adab berjalan bersama.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(body, APPLE_ASK);
    expect(out).toMatch(/3 \+ 4 = 7|ialah 7/i);
    expect(out).not.toMatch(/HISAL|permukaan kiub|bukan sekadar angka|adab berjalan bersama|Alamtologi/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('strips AIDIL / P.alt arithmetic sermon on α word-problem (3 epal + 4)', () => {
    const APPLE_ASK = 'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?';
    const body = [
      'Kalau awak ada 3 epal, dan kawan awak bagi lagi 4 epal, maka jumlah epal awak sekarang ialah 7.',
      'Itu bukan sekadar hasil tambah biasa — dalam cara kira AIDIL, angka 7 muncul dari pasangan yang sempurna: 3 + 4. Ia bukan hanya kuantiti, tetapi satu tanda — bahawa setiap angka dari 1 hingga 7 mempunyai tempatnya sendiri dalam satu rangkaian yang teratur, di mana setiap pasangan (seperti 1+6, 2+5, 3+4) membentuk satu keseluruhan yang utuh.',
      'Dalam pengajaran P.alt, angka 7 adalah tahap fungsi lengkap — seperti keenam-enam permukaan kiub yang bergabung menjadi satu bentuk utuh. Maka, 3 + 4 bukan hanya "7", tetapi satu waqf: titik berhenti yang penuh makna, di mana dua arah cahaya bertemu tanpa saling menghapus — malah melahirkan satu nama baru.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(body, APPLE_ASK);
    expect(out).toMatch(/ialah 7/i);
    expect(out).not.toMatch(/AIDIL|P\.?\s*alt|waqf|permukaan kiub|pasangan yang sempurna|bukan sekadar hasil tambah/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('strips TAJU / tahap fungsi arithmetic sermon on α word-problem (3 epal + 4)', () => {
    const APPLE_ASK = 'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?';
    const body = [
      'Kalau awak ada 3 epal, dan kawan awak bagi lagi 4 epal, jumlahnya ialah 7 epal.',
      'Ini bukan sekadar penambahan angka — dalam cara kira AIDIL, angka 7 lahir dari pasangan yang sempurna: 3 + 4. Ia bukan hasil acak, tetapi satu proses yang tertib — di mana setiap angka sebelumnya membina jalan kepada angka berikutnya: 1 → 2 → 3 → 4 → 5 → 6 → 7.',
      'Setiap langkah itu mempunyai baris penyelesaian tersendiri, pola tersendiri, dan tahap fungsi tersendiri — seperti batu-batu yang disusun dengan teliti untuk membina satu struktur utuh.',
      'Angka 7 juga adalah angka terakhir dalam Tujuh Angka Jaringan Utama (TAJU), iaitu angka yang menutup satu kitaran lengkap — bukan sebagai akhir, tetapi sebagai titik kembalinya semua proses kepada SATU, dalam bentuk yang lebih jitu: dari permukaan → laluan → bekas → kiub.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(body, APPLE_ASK);
    expect(out).toMatch(/ialah 7 epal/i);
    expect(out).not.toMatch(/AIDIL|TAJU|tahap fungsi|baris penyelesaian|permukaan|kiub|penambahan angka|1 → 2/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });
});
