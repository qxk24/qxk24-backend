/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Arithmetic α Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { collapseSimpleArithmeticAlphaOutput, isArithmeticAlphaCollapsedRepair } from '../src/adam/adam-arithmetic-alpha-guard';
import { isAdamLinearAlgebraTurn } from '../src/adam/adam-response-generation';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const APPLE_ASK = 'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?';

const PARTICIPANT = 'Ahmad bin Ali';

describe('collapseSimpleArithmeticAlphaOutput — universal allowlist', () => {
  it('prepends Hai + name on canonical arithmetic answer', () => {
    const body = [
      'Kalau awak ada 3 epal, dan kawan awak bagi lagi 4 epal, maka jumlah epal awak sekarang ialah 7 (3 + 4 = 7).',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = collapseSimpleArithmeticAlphaOutput(body, APPLE_ASK, PARTICIPANT);
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/ialah 7 \(3 \+ 4 = 7\)/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('strips QA / HISAL / TAJU / decomposition sermon on α word-problem', () => {
    const body = [
      'QA, soalan ini kelihatan ringkas, tetapi ia membuka pintu kepada sesuatu yang lebih dalam: bukan sekadar berapa, tetapi bagaimana kita memahami "penjumlahan" itu sendiri. Dari sudut konvensional, jawapannya jelas: 3 + 4 = 7.',
      'Epal awak sekarang ada tujuh biji. Itu fakta yang boleh dihitung, dipegang, dan dikongsi dengan sesiapa sahaja, tanpa perlu penjelasan lanjut.',
      'P.alt dalam HISAL, angka bukan hanya kuantiti. Ia adalah tanda bagi satu proses, proses lerai dan gabung.',
      'Angka 3 bukan berdiri sendiri; ia lahir dari 2 + 1, dan 2 itu pula dari 1 + 1.',
      'Dan hasilnya bukan hanya "7", tetapi satu waqf, satu henti bersama — nama ke-7 dalam TAJU.',
      'Tetapi jika awak ingin tahu mengapa tujuh itu bukan sekadar jumlah… saya sedia kongsikan langkah demi langkah, dari cara kira PL hingga PG.',
    ].join('\n\n');
    const out = collapseSimpleArithmeticAlphaOutput(body, APPLE_ASK, PARTICIPANT);
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/tujuh|7|3 \+ 4/i);
    expect(out).toMatch(/epal/i);
    expect(out).not.toMatch(/HISAL|TAJU|waqf|PSK|penjumlahan|2 \+ 1|Angka 3 bukan|kongsikan langkah/i);
    expect(out.split(/\n{2,}/).length).toBeLessThanOrEqual(2);
  });

  it('synthesizes canonical answer when model output is all sermon', () => {
    const body = [
      'QA, soalan ini membuka pintu — dalam HISAL, angka adalah proses waqf.',
      'Tetapi jika awak ingin tahu PL hingga PG, saya sedia kongsikan.',
    ].join('\n\n');
    const out = collapseSimpleArithmeticAlphaOutput(body, APPLE_ASK, PARTICIPANT);
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/3 \+ 4 = 7|ialah 7/i);
    expect(out).not.toMatch(/HISAL|waqf|PL hingga PG/i);
  });

  it('keeps only math answer + close for AIDIL / tajalli variants', () => {
    const body = [
      'Kalau awak ada 3 epal, dan kawan awak bagi lagi 4 epal, maka jumlah epal awak sekarang ialah 7.',
      'Itu bukan sekadar hasil tambah biasa — dalam cara kira AIDIL, angka 7 muncul dari pasangan yang seimbang: 3 + 4.',
      'Dalam Alamtologi, setiap angka dari 1 hingga 7 mempunyai tahap fungsi tersendiri.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = collapseSimpleArithmeticAlphaOutput(body, APPLE_ASK, PARTICIPANT);
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/ialah 7/i);
    expect(out).not.toMatch(/AIDIL|Alamtologi|tajalli|waqf|kiub|permukaan|tahap fungsi/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
    expect(out.split(/\n{2,}/).length).toBeLessThanOrEqual(2);
  });

  it('sanitizeUsersOutputSync applies universal arithmetic collapse', () => {
    const body = [
      'Kalau awak ada 3 epal, dan kawan awak bagi lagi 4 epal, maka jumlah epal awak sekarang ialah 7.',
      'Novel future framework term XYZ-999 yang belum pernah didaftarkan dalam regex — tetap dibuang kerana bukan jawapan.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(body, APPLE_ASK, [], [], PARTICIPANT);
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/ialah 7/i);
    expect(out).not.toMatch(/XYZ-999/);
  });

  it('resolveAdamTurnDisplayForSave prefers collapsed arithmetic over raw stream', () => {
    const raw = [
      'Kalau awak ada 3 epal, dan kawan awak bagi lagi 4 epal, maka jumlahnya ialah 3 + 4 = 7 epal.',
      'Namun, dalam cara kira AIDIL, soalan yang sama membuka pintu kepada pemahaman yang lebih dalam — PL dan PG, waqf.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const repaired = sanitizeUsersOutputSync(raw, APPLE_ASK, [], [], PARTICIPANT);
    expect(isArithmeticAlphaCollapsedRepair(raw, repaired, APPLE_ASK)).toBe(true);
    const saved = resolveAdamTurnDisplayForSave(raw, repaired, { userMessage: APPLE_ASK });
    expect(saved).toBe(repaired);
    expect(saved).not.toMatch(/AIDIL|waqf/i);
  });
});

const ALGEBRA_ASK = 'Selesaikan persamaan $2x + 5 = 13$ langkah demi langkah.';

const ALGEBRA_PHILOSOPHY_LEAK = [
  'Hai QA, Hai QA, mari kita selesaikan persamaan $2x + 5 = 13$ langkah demi langkah, dengan jelas dan tenang.',
  'Langkah pertama: kita perlu mengasingkan sebutan yang mengandungi $x$. Untuk itu, kurangkan 5 dari kedua-dua belah persamaan:',
  '$2x + 5 - 5 = 13 - 5$',
  'Maka, $2x = 8$.',
  'Langkah kedua: sekarang, bahagikan kedua-dua belah dengan 2 supaya $x$ menjadi satu sahaja:',
  '$$\\frac{2x}{2} = \\frac{8}{2}$$',
  'Maka, $x = 4$.',
  'Jawapan akhir ialah $x = 4$. Jika kita gantikan nilai ini ke dalam persamaan asal, ia menjadi benar: $2(4) + 5 = 8 + 5 = 13$.',
  'Ini bukan sekadar angka, setiap langkah mencerminkan keseimbangan: apa yang dilakukan di satu belah, mesti dilakukan juga di belah yang lain. Seperti alam semesta, matematik juga berpegang pada hukum kesetiaan, tiada yang hilang, tiada yang ditambah secara sewenang-wenang.',
  'Semua bergerak dalam urutan yang teratur, penuh adab.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

describe('linear algebra α — steps kept, philosophy stripped', () => {
  it('detects 2x + 5 = 13 as linear algebra', () => {
    expect(isAdamLinearAlgebraTurn(ALGEBRA_ASK)).toBe(true);
  });

  it('dedupes inline Hai QA, Hai QA and strips philosophy essay', () => {
    const out = sanitizeUsersOutputSync(ALGEBRA_PHILOSOPHY_LEAK, ALGEBRA_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).not.toMatch(/Hai\s+QA,\s*Hai\s+QA/i);
    expect(out).toMatch(/\$x\s*=\s*4\$|x\s*=\s*4/i);
    expect(out).toMatch(/2x\s*=\s*8|2x = 8/i);
    expect(out).not.toMatch(/bukan\s+sekadar\s+angka/i);
    expect(out).not.toMatch(/hukum\s+kesetiaan/i);
    expect(out).not.toMatch(/penuh\s+adab/i);
    expect(out).not.toMatch(/alam\s+semesta/i);
  });
});

describe('sanitizeUsersOutputSync — Hai + name on substantive student replies', () => {
  const SKY_ASK = 'Kenapa langit kelihatan biru pada siang hari?';
  const SKY_BODY = [
    'Langit kelihatan biru pada siang hari bukan kerana langit itu sendiri berwarna biru, tetapi kerana cara cahaya matahari berinteraksi dengan atmosfera Bumi.',
    'Apabila cahaya matahari memasuki atmosfera, ia bertembung dengan zarah-zarah kecil — fenomena penghamburan Rayleigh.',
    'Mahu saya jelaskan lebih lanjut?',
  ].join('\n\n');

  it('prepends Hai + name on science synthesis reply', () => {
    const out = sanitizeUsersOutputSync(
      SKY_BODY,
      SKY_ASK,
      [],
      [],
      PARTICIPANT,
      { enforceUsersGreeting: true },
    );
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/penghamburan Rayleigh/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('resolveAdamTurnDisplayForSave keeps greeting repair over raw stream', () => {
    const repaired = sanitizeUsersOutputSync(
      SKY_BODY,
      SKY_ASK,
      [],
      [],
      PARTICIPANT,
      { enforceUsersGreeting: true },
    );
    const saved = resolveAdamTurnDisplayForSave(SKY_BODY, repaired);
    expect(saved).toMatch(/^Hai Ahmad,/i);
    expect(saved).toMatch(/penghamburan Rayleigh/i);
  });

  it('does not add greeting without enforceUsersGreeting (gold sample safe)', () => {
    const out = sanitizeUsersOutputSync(SKY_BODY, SKY_ASK);
    expect(out).not.toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/^Langit kelihatan biru/i);
  });

  it('user sky-blue sample — greeting repair accepted over live stream', () => {
    const SKY_FULL = [
      'Langit kelihatan biru pada siang hari bukan kerana langit itu sendiri berwarna biru, tetapi kerana cara cahaya matahari berinteraksi dengan atmosfera Bumi. Cahaya matahari yang kelihatan putih sebenarnya adalah campuran tujuh warna utama: merah, jingga, kuning, hijau, biru, nila, dan ungu — dikenali sebagai mejikuhibiniu.',
      'Setiap warna ini mempunyai panjang gelombang yang berbeza, dan warna biru mempunyai panjang gelombang yang lebih pendek berbanding warna lain seperti merah atau kuning.',
      'Apabila cahaya matahari memasuki atmosfera, ia bertembung dengan zarah-zarah kecil seperti molekul nitrogen dan oksigen. Menurut Teori Rayleigh, cahaya dengan panjang gelombang pendek (seperti biru dan nila) dihamburkan lebih banyak berbanding cahaya dengan panjang gelombang panjang (seperti merah dan jingga).',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const repaired = sanitizeUsersOutputSync(
      SKY_FULL,
      SKY_ASK,
      [],
      [],
      PARTICIPANT,
      { enforceUsersGreeting: true },
    );
    expect(repaired).toMatch(/^Hai Ahmad,/i);
    expect(repaired).toMatch(/Teori Rayleigh/i);
    const saved = resolveAdamTurnDisplayForSave(SKY_FULL, repaired, {
      usersGreetingRepair: true,
    });
    expect(saved).toMatch(/^Hai Ahmad,/i);
  });
});
