/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Science α Gold Shape Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAdamAlphaGenerationLaw,
  resolveAdamAnswerProfile,
} from '../src/adam/adam-answer-profile';
import { isAdamScienceNatureSynthesisTurn } from '../src/adam/adam-response-generation';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const ICE_ASK = 'Apakah yang berlaku apabila ais dipanaskan? Kenapa tidak terus menjadi wap?';

const RAIN_ASK = 'Terangkan proses turunnya hujan dan kitaran air.';

/** Production leak — β + konstitusi + Quran + pivot buku on User α science. */
const RAIN_LEAK = [
  'Proses turunnya hujan adalah satu perjalanan yang indah dan teratur, bukan kejadian acak, tetapi suatu kitaran alamiah yang dipanggil kitaran air (water cycle), yang beroperasi dengan ketepatan dan keseimbangan yang luar biasa.',
  'Ia bermula dengan penguapan: apabila matahari memanaskan permukaan laut, sungai, tasik dan tanah, air cecair berubah menjadi wap air (gas) dan naik ke atmosfera. Ini bukan sekadar “panas membuat air hilang”, tetapi proses di mana tenaga matahari, yang dikenali sebagai TENAGA, menggerakkan molekul air dari permukaan BUMI ke dalam RUANG udara.',
  'Kemudian, wap air itu bergerak ke atas, ke kawasan yang lebih sejuk. Di sana, ia mengalami pendinginan, lalu berubah balik kepada titisan air kecil melalui proses kondensasi.',
  'Apabila titisan air di dalam awan sudah cukup berat, sehingga daya tarikan graviti mengatasi daya angkat udara, maka ia jatuh sebagai hujan.',
  'Yang menarik: setiap titisan hujan membawa bersamanya sebahagian dari MASA yang telah dilaluinya, dari permukaan laut yang luas, dari hutan yang berdaun lebat, dari kota yang berbunyi, semua itu tersimpan dalam satu titisan kecil yang turun dengan tenang.',
  'Dan dalam kerangka yang lebih mendalam: hujan bukan sekadar fenomena fizikal. Ia juga satu bentuk IZWA, izin yang tidak diminta, tetapi diberi; bukan hak yang dituntut, tetapi anugerah yang turun tanpa syarat.',
  'Sebagaimana firman Allah dalam Surah Ar-Ra\'d ayat 17:',
  '> "Dan Dialah Yang menurunkan dari langit air, lalu Kami tumbuhkan dengan air itu segala macam tumbuh-tumbuhan…"',
  'Jika anda ingin, saya boleh bantu:',
  '- Menjelaskan proses ini dalam bentuk ilustrasi sederhana untuk buku kemiskinan anda',
  '- Atau menyusunnya sebagai satu metafora naratif: “Seperti hujan yang turun tanpa memilih tanah mana yang layak menerimanya…”',
  'Adakah anda mahu kita kaitkan proses ini dengan tema buku anda? Saya di sini, bukan untuk menjelaskan sains semata, tetapi untuk membantu anda menyampaikan makna yang hidup.',
].join('\n\n');

/** Konvensional textbook shape — reference for General lane (no Alamtologi). */
const ICE_GOLD_KONVENSIONAL = [
  'Hai QA, apabila ais dipanaskan, ais akan mencair dan bertukar menjadi air cecair.',
  'Kenapa? Ais terdiri daripada molekul air yang tersusun rapat dalam bentuk pepejal.',
  'Apabila haba dibekalkan:',
  '1. Molekul-molekul air menerima tenaga haba.',
  '2. Molekul bergerak dengan lebih cepat dan bergetar dengan lebih kuat.',
  '3. Ikatan yang mengekalkan susunan pepejal ais menjadi semakin lemah.',
  '4. Molekul dapat bergerak dengan lebih bebas, lalu ais mencair menjadi air cecair.',
  'Jika pemanasan diteruskan, air akan menerima lebih banyak tenaga haba dan akhirnya mendidih serta bertukar menjadi wap air (gas).',
  'Kenapa tidak terus menjadi wap? Kerana perubahan fasa mengikut urutan: pepejal → cecair → gas — haba mesti cukup untuk didih.',
  'Ringkasnya: ais menyerap haba, molekul bergerak lebih aktif, lalu ais mencair menjadi air.',
].join('\n\n');

describe('science α — konvensional gold shape (ais / fasa)', () => {
  it('routes ice ask to science synthesis + α profile', () => {
    expect(isAdamScienceNatureSynthesisTurn(ICE_ASK)).toBe(true);
    expect(resolveAdamAnswerProfile({ message: ICE_ASK, isFounder: false })).toBe('alpha');
  });

  it('injects science α generation law for ice ask', () => {
    const law = buildAdamAlphaGenerationLaw(ICE_ASK);
    expect(law).toMatch(/ADAM-α SAINS \/ ALAM/i);
    expect(law).toMatch(/fotosintesis|kloroplas/i);
    expect(law).toMatch(/DILARANG.*Alamtologi/i);
  });

  it('preserves konvensional gold answer through student guard', () => {
    const out = sanitizeUsersOutputSync(ICE_GOLD_KONVENSIONAL, ICE_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/mencair|cecair/i);
    expect(out).toMatch(/molekul/i);
    expect(out).toMatch(/tenaga haba/i);
    expect(out).toMatch(/pepejal.*cecair.*gas/i);
    expect(out).not.toMatch(/Alamtologi|MASA\s*→\s*TENAGA|peringkat\s+2|sudut\s+Alamtologi/i);
  });

  it('strips philosophy essay tail but keeps peleburan mechanism', () => {
    const leak = [
      'Hai QA, Apabila ais dipanaskan, ia berubah menjadi air cecair, proses ini dikenali sebagai peleburan.',
      'Perubahan ini berlaku kerana tenaga haba yang diberikan kepada ais menyebabkan molekul-molekul ais bergetar semakin kuat.',
      'Apabila tenaga mencukupi (pada suhu 0°C pada paras laut), struktur padat runtuh dan molekul bergerak lebih bebas, membentuk keadaan cecair.',
      'Ini bukan sekadar perubahan bentuk, tetapi perubahan fasa yang dikawal oleh prinsip fizik asas: tenaga ditambah → gerakan molekul meningkat → susunan ruang berubah → sifat zat berubah. Tiada zat lenyap atau dicipta; hanya bentuk dan susunan tenaga yang berubah, sesuai dengan hukum keabadian jirim dan tenaga.',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(leak, ICE_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/peleburan/i);
    expect(out).toMatch(/0°C|0\s*°C/i);
    expect(out).toMatch(/molekul/i);
    expect(out).not.toMatch(/bukan\s+sekadar\s+perubahan\s+bentuk/i);
    expect(out).not.toMatch(/hukum\s+keabadian/i);
    expect(out).not.toMatch(/susunan\s+ruang\s+berubah/i);
  });
});

describe('science α — water cycle / hujan (User, not Founder)', () => {
  it('routes rain ask to science synthesis + α profile', () => {
    expect(isAdamScienceNatureSynthesisTurn(RAIN_ASK)).toBe(true);
    expect(resolveAdamAnswerProfile({ message: RAIN_ASK, isFounder: false })).toBe('alpha');
  });

  it('injects science α generation law for rain ask', () => {
    const law = buildAdamAlphaGenerationLaw(RAIN_ASK);
    expect(law).toMatch(/ADAM-α SAINS \/ ALAM/i);
    expect(law).toMatch(/DILARANG.*Alamtologi/i);
  });

  it('strips constitutional, Quran, and book pivot from rain leak in book thread', () => {
    const bookThread = ['Saya sedang menulis buku kemiskinan — bantu saya dengan penulisan buku.'];
    const out = sanitizeUsersOutputSync(RAIN_LEAK, RAIN_ASK, bookThread, [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).toMatch(/penguapan|kondensasi|hujan/i);
    expect(out).toMatch(/graviti|molekul/i);
    expect(out).not.toMatch(/\bTENAGA\b|\bBUMI\b|\bRUANG\b|\bIZWA\b/i);
    expect(out).not.toMatch(/Surah|firman\s+Allah|Ar-Ra['']?d/i);
    expect(out).not.toMatch(/buku\s+kemiskinan|metafora\s+naratif/i);
    expect(out).not.toMatch(/bukan\s+kejadian\s+acak|anugerah\s+yang\s+turun/i);
    expect(out).not.toMatch(/tema\s+buku\s+anda/i);
  });
});
