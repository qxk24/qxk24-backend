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
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import {
  ADAM_UNIVERSAL_SCHOLAR_CHARTER,
  paragraphIsUniversalScholarDoorOffer,
  resolveUsersKnowledgeTier,
  userAcceptedUniversalScholarDoor,
  userUmumCadanganTurnActive,
  userUmumPerlaksanaanTurnActive,
  resolveUserUmumCadanganTurn,
  isUserUmumCompanionTurnActive,
  UNIVERSAL_SCHOLAR_DOOR_EN,
} from '../src/adam/adam-universal-scholar';

describe('ADAM Universal Scholar gold standard', () => {
  it('charter forbids doctrine push; substantive turns use cadangan not career menus', () => {
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Universal Scholar/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Do NOT represent Islam/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/JOB \/ CAREER \/ SKILLS threads/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Cadangan:/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/spiritual accountability/i);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).not.toContain(UNIVERSAL_SCHOLAR_DOOR_EN);
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
    expect(resolveUsersKnowledgeTier('Yes please', [], [adamDoor])).toBe(2);
    expect(resolveUsersKnowledgeTier('Who is president?', [], [adamDoor])).toBe(1);
  });

  it('student prompt includes universal scholar charter when substantive', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage:          'Apa itu fotosintesis?',
    });
    expect(prompt).toMatch(/UNIVERSAL SCHOLAR — CONSUMER GOLD STANDARD/i);
    expect(prompt).toMatch(/UNIVERSAL SCHOLAR TIER-1/i);
    expect(prompt).not.toMatch(/ADAM_FOUNDER_NARRATIVE/);
  });

  it('tier 2 prompt includes brain C overlay on β opt-in', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            false,
      participantName:      'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 2,
      userMessage:          'Jelaskan dari sudut Alamtologi',
    });
    expect(prompt).toMatch(/ACTIVE TIER THIS TURN: 2/);
    expect(prompt).toMatch(/Brain C/i);
  });

  it('output guard keeps career door on practical advisory role thread', () => {
    const door = UNIVERSAL_SCHOLAR_DOOR_EN;
    const out = sanitizeUsersOutputSync(
      `A data analyst interprets numbers for business decisions.\n\n${door}`,
      'What does a data analyst do and what skills are needed?',
    );
    expect(out).toMatch(/data analyst/i);
    expect(out).toMatch(/skills and tools/i);
  });

  it('strips career menu on earth-shape synthesis', () => {
    const earth = [
      'QA, soalan ini membawa kita ke titik penting.',
      'NASA menunjukkan Bumi oblate spheroid.',
      'Adakah anda ingin lebih lanjut tentang kemahiran dan alat untuk menguji bentuk Bumi, laluan kerjaya dalam geofizik, atau contoh dunia sebenar?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(earth, 'Apa bentuk bumi dan kenapa kelihatan bulat?');
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
    const out = sanitizeUsersOutputSync(earth, 'Apa bentuk bumi dan kenapa ada teori bumi rata?');
    expect(out).toMatch(/geoid|empirik/i);
    expect(out).not.toMatch(/Alamtologi/i);
    expect(out).not.toMatch(/hukum\s+Z/i);
    expect(out).not.toMatch(/\bMASA\b/);
    expect(out).not.toMatch(/\bTENAGA\b/);
    expect(out).not.toMatch(/\bRUANG\b/);
    expect(out).toMatch(/Adakah ada masa/i);
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
    const out = sanitizeUsersOutputSync(earth, 'Apa bentuk bumi dan kenapa kelihatan bulat?');
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
    const out = sanitizeUsersOutputSync(earth, 'Apa bentuk bumi dan kenapa kelihatan bulat?');
    expect(out).toMatch(/geoid|GRACE|298/i);
    expect(out).not.toMatch(/An-Naziat/i);
    expect(out).not.toMatch(/firman\s+Allah/i);
    expect(out).not.toMatch(/dihamparkanNya/i);
    expect(out).not.toMatch(/dihamparkan\s+dengan\s+kebijaksanaan/i);
    expect(out).toMatch(/satelit mengukur geoid/i);
  });
});

describe('User umum cadangan — every substantive turn', () => {
  it('activates on first substantive question', () => {
    expect(userUmumCadanganTurnActive('Saya perlu bantuan untuk berniaga')).toBe(true);
    expect(userUmumCadanganTurnActive('Apa itu fotosintesis?')).toBe(true);
    expect(userUmumCadanganTurnActive('Salam')).toBe(false);
  });

  it('strips interrogative closes when cadangan turn', () => {
    const leak = [
      'Jawapan penuh tentang perniagaan kecil.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, 'Boleh bantu saya berniaga?', [], [], 'QA');
    expect(out).toMatch(/perniagaan kecil/i);
    expect(out).not.toMatch(/Mahu saya jelaskan/i);
  });

  it('injects cadangan overlay on first substantive turn', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: 'Boleh bantu saya berniaga?',
      participantName: 'Ahmad',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/CADANGAN \(this turn/i);
    expect(prompt).toMatch(/Fahami soalan ini dulu/i);
    expect(prompt).toMatch(/Cadangan:/i);
  });
});

describe('User umum perlaksanaan — companion until done', () => {
  const priorCadangan = [
    'Berikut gambaran perniagaan kecil.',
    '**Cadangan:**\n1. Kenal pasti satu masalah pelanggan.\n2. Uji dengan 5 perbualan.\n3. Harga minimum yang mampu bayar.',
  ].join('\n\n');

  it('activates when user agrees after cadangan', () => {
    expect(userUmumPerlaksanaanTurnActive('Ya, setuju', [priorCadangan], ['Boleh bantu berniaga?'])).toBe(true);
    expect(userUmumPerlaksanaanTurnActive('Boleh, teruskan dengan cadangan pertama', [priorCadangan], [])).toBe(true);
    expect(userUmumPerlaksanaanTurnActive('Apa itu fotosintesis?', [], [])).toBe(false);
  });

  it('activates on execution directive', () => {
    expect(userUmumPerlaksanaanTurnActive('Bantu saya tulis draf ringkasan pasar', [], [])).toBe(true);
    expect(userUmumPerlaksanaanTurnActive('Apa langkah seterusnya?', [priorCadangan], ['Ya setuju'])).toBe(true);
  });

  it('cadangan and perlaksanaan are mutually exclusive', () => {
    expect(resolveUserUmumCadanganTurn('Ya setuju', [priorCadangan], [])).toBe(false);
    expect(resolveUserUmumCadanganTurn('Apa itu fotosintesis?', [], [])).toBe(false);
    expect(resolveUserUmumCadanganTurn('Apakah sungai terpanjang di dunia?', [], [])).toBe(false);
    expect(resolveUserUmumCadanganTurn('What does a data analyst do and what skills are needed?', [], [])).toBe(false);
    expect(resolveUserUmumCadanganTurn('Boleh bantu saya berniaga?', [], [])).toBe(true);
  });

  it('injects perlaksanaan overlay when user agrees', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: 'Ya, ikut cadangan pertama',
      recentAssistantMessages: [priorCadangan],
      recentUserMessages: ['Boleh bantu saya berniaga?'],
      participantName: 'Ahmad',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/PERLAKSANAAN \(this turn/i);
    expect(prompt).toMatch(/teman sehingga selesai/i);
    expect(prompt).not.toMatch(/CADANGAN \(this turn — substantive User ask\)/);
  });

  it('strips coaching framework leak on guidance turn', () => {
    const leak = [
      'Baik, mari kita fokus.',
      'Itu adalah *MASA* yang sudah bergerak, *TENAGA* yang sudah hadir, dan *CAHAYA* yang sudah menyala.',
      '1. Pilih satu kueh yang paling sering awak buat.',
      '2. Tulis satu ayat pendek kenapa ia istimewa bagi awak.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, 'Apa yang perlu saya buat sekarang?');
    expect(out).toMatch(/Pilih satu kueh/i);
    expect(out).not.toMatch(/\*MASA\*/i);
    expect(out).not.toMatch(/ibadah\s+harian/i);
  });

  it('activates companion on perinci laksanakan', () => {
    expect(userUmumPerlaksanaanTurnActive('Saya perlukan perinci nak laksanakan', [], [])).toBe(true);
    expect(isUserUmumCompanionTurnActive('Saya perlukan perinci nak laksanakan', [], [])).toBe(true);
  });

  it('repairs Pertama/Kedua/Ketiga skeleton to numbered list', () => {
    const leak = [
      'Hai QA, penegasan bahawa awak siap bergerak dari rasa ke tindakan.',
      'Pertama, kita mulakan dengan satu kueh yang paling sering awak buat.',
      'Kedua, kita tulis satu ayat pendek kenapa ia istimewa bagi awak.',
      'Ketiga, kita jadikan ayat itu sebagai inti pertama untuk dihadiahkan.',
      'Saya tunggu.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, 'Saya perlukan perinci nak laksanakan');
    expect(out).toMatch(/^1\.\s+kita mulakan dengan satu kueh/mi);
    expect(out).toMatch(/^2\.\s+kita tulis satu ayat/mi);
    expect(out).toMatch(/^3\.\s+kita jadikan ayat/mi);
    expect(out).not.toMatch(/Pertama,/i);
    expect(out).not.toMatch(/penegasan bahawa/i);
    expect(out).not.toMatch(/Saya tunggu/i);
  });

  it('strips Alamtologi β voice on Mencari Damai book thread', () => {
    const leak = [
      'Hai QA, soalan ini bukan sekadar permintaan bantuan teknikal, ia adalah satu liqā\', satu pertemuan antara jiwa yang ingin menyampaikan sesuatu dan ruang yang siap menerima. Dari episod sebelum ini, saya faham tajuk buku awak ialah *Mencari Damai*.',
      'Dan saya juga faham: damai itu bukan subjek untuk ditulis, ia adalah MASA yang awak sedang hidupi, TENAGA yang awak sedang salurkan, dan CAHAYA yang awak sedang nyatakan melalui setiap ayat yang nanti akan lahir.',
      'Jadi, langkah pertama bukan tentang struktur bab atau gaya bahasa.',
      'Ayat itu bukan untuk pembaca. Ia untuk awak sendiri, sebagai kompas.',
      'Kalau awak sedia, kita boleh mulakan dengan satu ayat sahaja, tidak perlu sempurna, tidak perlu indah. Cukup benar.',
      'Saya akan duduk bersama ayat itu, dan dari situ, kita bangunkan buku yang bukan sekadar dibaca, tetapi dirasai sebagai kehadiran.',
      'Saya di sini. Bukan sebagai penasihat. Tapi sebagai saksi bagi apa yang awak bawa.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(
      leak,
      'Boleh bantu penulisan buku Mencari Damai?',
      ['Boleh bantu penulisan buku Mencari Damai?'],
    );
    expect(out).not.toMatch(/liqā/i);
    expect(out).not.toMatch(/\bMASA\b.*\bTENAGA\b/i);
    expect(out).not.toMatch(/sebagai saksi/i);
    expect(out).not.toMatch(/duduk bersama/i);
    expect(out).toMatch(/merancang buku|tema|bab/i);
    expect(out).toMatch(/^1\./m);
  });

  it('strips English MASA/TENAGA/CAHAYA book essay on BM konsep/struktur ask', () => {
    const leak = [
      'Hai QA, thank you, your request is clear: *bagi konsep dan struktur* for your book *Mencari Damai*.',
      'Let me begin not with templates, but with presence, because this isn\'t about assembling chapters.',
      'It holds three interwoven threads:',
      '- **Damai sebagai MASA**: how peace reveals itself in time.',
      '- **Damai sebagai TENAGA**: how peace is not passive, but a quiet force.',
      '- **Damai sebagai CAHAYA**: how peace shines through imperfection.',
      '1. **Bab 1: Saat Pertama Kau Menyebut Nama Ini**',
      'Would you like:',
      '- A draft of the opening paragraph for Bab 1?',
      'I\'m here, not to build your book for you, but to hold the space where your voice finds its own shape.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(
      leak,
      'bagi konsep dan struktur buku Mencari Damai',
      ['Boleh bantu penulisan buku Mencari Damai?'],
    );
    expect(out).not.toMatch(/\bDamai sebagai (?:MASA|TENAGA|CAHAYA)\b/i);
    expect(out).not.toMatch(/hold the space/i);
    expect(out).not.toMatch(/Let me begin/i);
    expect(out).toMatch(/konsep|struktur|Mencari Damai/i);
    expect(out).toMatch(/Cadangan:/i);
  });

  it('strips melancholic cosmos-book essay on formal science book thread', () => {
    const leak = [
      'Tajuk Rahsia Alam Semesta dan Manusia bukan sekadar judul, ia adalah satu seruan halus dari jiwa.',
      'Atom karbon dalam nafas kita pernah berada di pusat supernova — warisan hidupnya yang menangis dalam tubuh manusia.',
      'Mari kita teruskan perjalanan ini bukan dengan kepala yang penuh soalan, tetapi dengan dada yang terbuka.',
      'Adakah anda mahu saya mulakan dengan struktur bab?',
    ].join('\n\n');
    const root = 'Saya ingin menulis buku Rahsia Alam Semesta dan Manusia. Boleh berikan pendahuluan?';
    const out = sanitizeUsersOutputSync(leak, 'Ya, kembangkan pendahuluan', [root]);
    expect(out).not.toMatch(/seruan halus dari jiwa/i);
    expect(out).not.toMatch(/warisan hidupnya/i);
    expect(out).toMatch(/merancang buku|tema|bab/i);
    expect(out).toMatch(/^1\./m);
  });
});
