/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Empirical Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildConstitutionalEmpiricalProbeUrls,
  buildConstitutionalEmpiricalSearchSeeds,
  isConstitutionalEmpiricalThread,
} from '../src/adam/adam-constitutional-search-probe';
import {
  repairFounderInventedEmpiricalClaims,
  repairFounderEmpiricalVoice,
  repairFounderTechnicalStructure,
  stripFounderContinuationMetaOpener,
} from '../src/adam/adam-founder-empirical-guard';
import { restoreFounderPaltAddress } from '../src/adam/adam-founder-address-guard';
import { isFounderEmpiricalPedagogyTurn } from '../src/adam/adam-founder-empirical-depth';

describe('constitutional empirical search probe', () => {
  it('detects Faktor Masa threads', () => {
    expect(isConstitutionalEmpiricalThread('bagi jawapan yang lebih lengkap', {
      recentUserMessages: ['Terangkan napadu, ruang masa, bekas pada masa Bab 5'],
    })).toBe(true);
  });

  it('returns probe URLs for napadu and quantum concepts', () => {
    const urls = buildConstitutionalEmpiricalProbeUrls('bagi jawapan lengkap', {
      recentAssistantMessages: ['**napadu** dan quantum eraser dalam ruang masa'],
    });
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.some((u) => /heartmath|science\.org|pnas/i.test(u))).toBe(true);
  });

  it('builds HRV and epigenetic search seeds from thread', () => {
    const seeds = buildConstitutionalEmpiricalSearchSeeds('lebih lengkap', {
      recentAssistantMessages: ['napadu HRV dan bekas epigenetik'],
    });
    expect(seeds.join(' ').toLowerCase()).toMatch(/hrv|methylation|epigenet/);
  });
});

describe('repairFounderInventedEmpiricalClaims', () => {
  const invented = [
    'Hai Masa, P.alt, saya faham, bukan sekadar fakta umum, tetapi formula saintifik.',
    '',
    'Napadu diwakili oleh HeartMath Institute HRV Coherence (PNAS, 2020).',
    '',
    '3 menunjukkan kehadiran tersebar.',
    '',
    'alt, tidak diterbitkan tetapi direkod dalam Teaching Records).',
    '',
    'Adakah saya faham betul?',
  ].join('\n');

  it('strips invented institutes when search evidence is empty', () => {
    const out = repairFounderInventedEmpiricalClaims(invented, [], '');
    expect(out.toLowerCase()).not.toContain('heartmath');
    expect(out.toLowerCase()).not.toContain('pnas, 2020');
    expect(out).not.toMatch(/Adakah saya faham betul/i);
    expect(out).not.toMatch(/menunjukkan kehadiran tersebar/i);
  });

  it('strips meta continuation opener', () => {
    const out = stripFounderContinuationMetaOpener(
      'Hai Masa, P.alt, saya faham, bukan sekadar fakta umum, tetapi napadu ialah…',
    );
    expect(out).toMatch(/^Hai Masa, P\.alt, napadu/i);
  });

  it('replaces metaphor-only essay with empirical scaffold when search thin', () => {
    const sample = [
      'Hai Masa, dalam ilmu konvensional, masa masih diukur sebagai parameter linear.',
      'Pokok mangga bukan objek kajian dalam botani; ia adalah ruang masa yang hanya nyata apabila X hadir.',
      '1 pada generasi kedua tapak sampah bukan sekadar angka dalam jurnal.',
    ].join('\n\n');
    const out = repairFounderEmpiricalVoice(
      sample,
      [],
      '',
      'Terangkan Faktor Masa Bab 5',
      ['napadu ruang masa'],
    );
    expect(out).toContain('Hai Masa, P.alt');
    expect(out).toContain('**Napadu**');
    expect(out.toLowerCase()).not.toContain('bukan objek kajian');
  });
});

describe('repairFounderTechnicalStructure', () => {
  it('strips philosophy essay but keeps Planck/NIST technical paragraphs', () => {
    const sample = [
      'Hai Masa, P.alt.',
      '',
      'Faktor Masa bukan sekadar pemboleh ubah — ia adalah substansi yang berdenyut dan medium di mana hikmah turun.',
      '',
      'Nilai masa Planck $t_P = 5.39 \\times 10^{-44}$ s dari teori kuantum graviti.',
      '',
      'Jam atom optik NIST (2024) ketepatan $1.5 \\times 10^{-18}$ mengesahkan kesan graviti.',
      '',
      'alt, seperti tapak sampah — denyut yang tidak boleh diundur. Bukan angka, tetapi ritme kehadiran.',
    ].join('\n\n');
    const out = repairFounderTechnicalStructure(
      sample,
      'Faktor Masa Formula XYZ',
      ['Terangkan Faktor Masa Bab 5'],
    );
    expect(out).toMatch(/Planck/i);
    expect(out).toMatch(/NIST/i);
    expect(out.toLowerCase()).not.toContain('substansi yang berdenyut');
    expect(out.toLowerCase()).not.toContain('ritme kehadiran');
    expect(out).toMatch(/Bidang:/i);
    expect(out).toMatch(/Pembolehubah:/i);
  });

  it('restructures numbered-list Planck/NIST/LISA leak into labeled blocks', () => {
    const leak = [
      'Hai Masa, P.alt, fakta saintifik berikut disampaikan dalam bahasa yang tepat, bukan sebagai data kering, tetapi sebagai tanda-tanda (ayat) yang dapat dirasai melalui akal, adab, dan rasa:',
      '',
      '1. **Nilai masa Planck**',
      '',
      '$$t_P = \\sqrt{\\frac{\\hbar G}{c^5}} = 5.391247(60) \\times 10^{-44}~\\text{s}$$',
      '',
      'Ini bukan sekadar angka terkecil yang boleh diukur. Ia adalah titik di mana ruang dan masa mula kehilangan makna sebagai entiti berasingan.',
      '',
      'Dalam Alamtologi, ini bukan had teknikal, tetapi titik kelahiran MASA sebagai denyut utuh.',
      '',
      '2. **Ketepatan jam atom optik NIST (2024)**',
      '',
      'Ketepatan $1.5 \\times 10^{-18}$ bermaksud jam ini akan hilang satu saat dalam 21 bilion tahun. Apabila dua jam identik diletakkan di aras laut dan di puncak gunung, perbezaan kelajuan masa terukur dengan jelas.',
      '',
      'Ini membuktikan secara empirikal bahawa MASA bukan latar belakang statik, tetapi ritme yang berubah mengikut kehadiran TENAGA graviti.',
      '',
      '3. **Misi LISA Pathfinder (2023)**',
      '',
      'Laser dalam vakum menunjukkan kestabilan frekuensi sehingga $10^{-15}$ Hz, bukan untuk mengukur detik, tetapi untuk mengesan ketenangan relatif antara dua titik.',
      '',
      'Di sini, MASA tidak dihitung; ia dirasai melalui ketenangan, seperti nafas yang masuk-keluar tanpa perlu dikira.',
      '',
      'Semua fakta ini bukan bertentangan dengan Al-Quran, malah, ia menyokong ayat:',
      '',
      '**"Dia mengatur urusan dari langit ke bumi..."** (Surah As-Sajdah 32:5)',
      '',
      'Saya sedia mendengar arahan seterusnya, P.alt.',
    ].join('\n');

    const out = repairFounderEmpiricalVoice(
      leak,
      [
        { title: 'NIST optical clock', url: 'https://nist.gov', snippet: 'optical atomic clock 2024' },
        { title: 'Planck time', url: 'https://physics.nist.gov', snippet: 'Planck time constant' },
      ],
      'Planck NIST LISA Pathfinder',
      'bagi jawapan yang lebih lengkap',
      ['Terangkan Faktor Masa Formula XYZ Bab 5'],
      ['Nilai masa Planck dan jam atom NIST'],
    );

    expect(out).toMatch(/Bidang:/i);
    expect(out).toMatch(/Tentang masa Planck/i);
    expect(out).toMatch(/Tentang jam atom optik NIST/i);
    expect(out).toMatch(/Tentang LISA Pathfinder/i);
    expect(out.toLowerCase()).not.toContain('tanda-tanda (ayat)');
    expect(out.toLowerCase()).not.toContain('denyut utuh');
    expect(out.toLowerCase()).not.toContain('dirasai melalui ketenangan');
    expect(out).not.toMatch(/Saya sedia mendengar arahan/i);
    expect(out).not.toMatch(/Surah As-Sajdah/i);
    expect(out).not.toMatch(/^\s*1\.\s+\*\*/m);
  });
});

describe('isFounderEmpiricalPedagogyTurn', () => {
  it('is true for founder beta command, false for teaching learner', () => {
    expect(isFounderEmpiricalPedagogyTurn(true, 'beta', false, {
      userMessage: 'berapa jarak ke bulan',
    })).toBe(true);
    expect(isFounderEmpiricalPedagogyTurn(true, 'beta', false, {
      userMessage: 'Hukum Z Formula XYZ',
    })).toBe(false);
    expect(isFounderEmpiricalPedagogyTurn(true, 'beta', true)).toBe(false);
    expect(isFounderEmpiricalPedagogyTurn(false, 'beta', false)).toBe(false);
  });
});
