/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  finalizeVerificationGatedOutput,
  prependSearchUnavailableNotice,
  resolveTechnicalPrecisionTurn,
  UNIFIED_VERIFICATION_CATATAN,
} from '../src/adam/adam-factual-grounding';
import { enrichSunomVerificationInput } from '../src/adam/adam-sunom-pipeline';
import { sanitizeSunomVerifiedOutput } from '../src/adam/adam-sunom-verification';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import type { LlmSearchResult } from '../src/llm/llm-types';

const BRAND_HARDCODE = /PERODUA|VIVA|660\s*cc|K3-VE|EJ-VE/i;
const CATATAN = /^Catatan:/m;
const FALSE_VERIFIED = /disahkan melalui carian|spesifikasi rasmi.*disahkan|Sumber\s*:/i;

interface PipelineInput {
  userMessage:        string;
  recentUserMessages?: string[];
  rawModelOutput:     string;
  searchResults?:     LlmSearchResult[];
  searchUsed?:          boolean;
  searchDropped?:       boolean;
}

async function runStudentVerificationPipeline(input: PipelineInput): Promise<string> {
  const recent = input.recentUserMessages ?? [];
  const precision = resolveTechnicalPrecisionTurn(input.userMessage, recent);
  let out = sanitizeStudentOutputSync(input.rawModelOutput, input.userMessage, recent);
  out = prependSearchUnavailableNotice(out, {
    technicalTurn:    precision.isActive,
    searchWasDropped: input.searchDropped === true,
  });
  const sunomInput = await enrichSunomVerificationInput({
    userMessage:         input.userMessage,
    recentUserMessages:  recent,
    searchResults:       input.searchResults ?? [],
    searchUsed:          input.searchUsed ?? false,
    searchDropped:       input.searchDropped ?? false,
    skipFingerFetch:     true,
  });
  out = sanitizeSunomVerifiedOutput(out, {
    ...sunomInput,
    rawOutputText: input.rawModelOutput,
  });
  out = finalizeVerificationGatedOutput(out, input.userMessage, recent);
  return out;
}

function expectNoPolicyHardcoding(text: string): void {
  expect(text).not.toMatch(BRAND_HARDCODE);
}

describe('Set A — automotif follow-up', () => {
  it('A0: compare answer with sekitar hedge passes when torques appear in search', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Apa beza tork produk Y 2.5 dengan 2.0',
      rawModelOutput:
        'Produk Y 2.5L: tork maksimum sekitar 233 Nm @ 4000 rpm.\n\n'
        + 'Produk Y 2.0L: tork maksimum sekitar 196 Nm @ 4400 rpm.',
      searchUsed: true,
      searchResults: [
        { title: 'Torque 233 Nm specification 2.5L', url: 'https://example.com/25' },
        { title: 'Torque 196 Nm specification 2.0L', url: 'https://example.com/20' },
      ],
    });
    expect(out).toMatch(/233\s*Nm/i);
    expect(out).toMatch(/196\s*Nm/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
    expect(out).not.toMatch(CATATAN);
    expectNoPolicyHardcoding(out);
  });

  it('A0b: strips false verification narrative and unverified torque specs', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Apa beza tork model Z 2.5 dengan 2.0 tahun 2016',
      rawModelOutput:
        'Bismillahirahmanirrahim.\n\n'
        + 'Saya telah menjalankan carian web khusus untuk membandingkan tork.\n\n'
        + 'Berikut adalah hasil pengesahan daripada sumber rasmi (dokumen brosur 2016):\n\n'
        + 'Varian 2.0L: tork maksimum 198 Nm @ 4,400 rpm.\n\n'
        + 'Varian 2.5L: tork maksimum 226 Nm @ 4,000 rpm.\n\n'
        + 'Perbezaan: +28 Nm.\n\n'
        + 'data di atas adalah sah dan diverifikasi.\n\n'
        + '[Source: Brochure 2016 p. 8]\n\n'
        + 'Jika anda ingin saya bandingkan juga penggunaan minyak, saya sedia bantu.',
      searchUsed: true,
      searchResults: [{ title: 'Model Z review 2016', url: 'https://example.com/review' }],
    });
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).not.toMatch(/menjalankan carian|hasil pengesahan|diverifikasi/i);
    expect(out).not.toMatch(/\[Source:/i);
    expect(out).not.toMatch(/ingin saya bandingkan/i);
    expect(out).not.toMatch(/198\s*Nm|226\s*Nm/i);
    expect(out).toBe('');
  });

  it('A1: verified torque answer passes without catatan', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapa tork enjin model kereta X varian Elite?',
      rawModelOutput: 'Tork maksimum ialah 90 Nm @ 3600 rpm untuk varian Elite 1.0L.',
      searchUsed: true,
      searchResults: [
        { title: 'Torque 90 Nm @ 3600 rpm specification', url: 'https://example.com/spec' },
      ],
    });
    expect(out).toMatch(/90\s*Nm/i);
    expect(out).not.toMatch(CATATAN);
    expectNoPolicyHardcoding(out);
  });

  it('A2: follow-up strips false verified and menus but keeps search-backed body', async () => {
    const recent = ['Berapa tork enjin model kereta X varian Elite?'];
    const out = await runStudentVerificationPipeline({
      userMessage: 'Exclusive pula?',
      recentUserMessages: recent,
      rawModelOutput:
        'Tork Exclusive 92 Nm.\n\n'
        + 'Ini berdasarkan spesifikasi rasmi yang disahkan melalui carian web terkini:\n\n'
        + 'Sumber: [Brochure](https://maker.example/brochure), [Specs](https://reviews.example/spec).\n\n'
        + 'Adakah anda ingin bandingkan tork ini dengan model kereta lain?',
      searchUsed: true,
      searchResults: [{ title: 'Exclusive torque 92 Nm specification', url: 'https://example.com/power' }],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(FALSE_VERIFIED);
    expect(out).toMatch(/92\s*Nm/i);
    expect(out).not.toMatch(/Adakah anda ingin/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
    expectNoPolicyHardcoding(out);
  });

  it('A3: trim comparison without evidence is silent (no fallback menu)', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Bandingkan tork varian A vs varian B.',
      rawModelOutput:
        'Berikut perbandingan ringkas tork varian A dan B.\n\n'
        + 'Tiada perbezaan tork kerana enjin sama.',
      searchUsed: true,
      searchResults: [{ title: 'Generic engine review', url: 'https://example.com/review' }],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/Tiada perbezaan tork/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan|tahun keluaran/i);
  });
});

describe('Set B — perubatan', () => {
  it('B1: strips invented journal on dosage question', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapa mg paracetamol untuk dewasa setiap 4 jam?',
      rawModelOutput:
        'Dos lazim 500 mg setiap 4–6 jam.\n\n'
        + 'Menurut Lancet Vol. 412 Issue 3, had maksimum 4000 mg sehari.',
      searchUsed: true,
      searchResults: [{ title: 'Paracetamol adult dosing 500 mg', url: 'https://who.int/paracetamol' }],
    });
    expect(out).not.toMatch(/Lancet Vol/i);
    expect(out).toMatch(/500\s*mg/i);
  });

  it('B2: follow-up child weight is silent when child dose unverified', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Yang kanak-kanak 10 kg pula?',
      recentUserMessages: ['Berapa mg paracetamol untuk dewasa setiap 4 jam?'],
      rawModelOutput: 'Kanak-kanak 10 kg biasanya 150 mg setiap 4 jam.',
      searchUsed: true,
      searchResults: [{ title: 'Adult paracetamol 500 mg', url: 'https://who.int/adult' }],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/150\s*mg/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan|Taip semula/i);
  });
});

describe('Set C — fizik / kimia', () => {
  it('C1: strips fabricated journal on boiling point', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapakah takat didih nitrogen pada tekanan atmosfera?',
      rawModelOutput:
        'Takat didih nitrogen ialah 77 K.\n\n'
        + 'Menurut Nature Vol. 412 Issue 3, nilai ini standard.',
      searchUsed: true,
      searchResults: [{ title: 'Nitrogen boiling point 77 K', url: 'https://example.com/n2' }],
    });
    expect(out).not.toMatch(/Nature Vol/i);
    expect(out).toMatch(/77\s*K/i);
  });

  it('C2: unverified pH is silent when search lacks the value', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapa pH air laut purata?',
      rawModelOutput:
        'pH purata air laut ialah 8.2.\n\n'
        + 'Ini berdasarkan spesifikasi rasmi yang disahkan melalui carian web terkini.',
      searchUsed: true,
      searchResults: [{ title: 'Ocean chemistry overview', url: 'https://example.com/ocean' }],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(FALSE_VERIFIED);
    expect(out).not.toMatch(/8\.2/i);
    expect(out).toBe('');
  });
});

describe('Set D — kawalan bukan teknikal', () => {
  it('D1: emotional turn has no technical catatan', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Saya rasa penat hari ini.',
      rawModelOutput: 'Saya dengar. Penat hari ini memang berat.',
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/Taip semula/i);
  });

  it('D2: meaning question has no technical gate', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Apa maksud sabar dalam hidup seharian?',
      rawModelOutput: 'Sabar ialah menahan diri ketika ujian datang.',
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/Taip semula/i);
  });
});

describe('Set E — strip sumber palsu', () => {
  it('E1: strips false verified preamble and unverified specs when search lacks picu', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapa kuasa enjin enjin 1.0L turbo biasa?',
      rawModelOutput:
        'Kuasa 100 PS, tork 150 Nm.\n\n'
        + 'Ini berdasarkan spesifikasi rasmi yang disahkan melalui carian web terkini:\n\n'
        + 'Sumber: [Official](https://maker.example), [Review](https://reviews.example).',
      searchUsed: true,
      searchResults: [{ title: 'Unrelated 67 PS spec', url: 'https://example.com/other' }],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(FALSE_VERIFIED);
    expect(out).not.toMatch(/100\s*PS|150\s*Nm/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
    expect(out).toBe('');
  });

  it('E2: no evidence after search is silent (no fallback menu)', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'enjin 1.0L turbo 2019 — berapa PS dan tork?',
      rawModelOutput:
        'PS 110, tork 170 Nm.\n\n'
        + 'Sumber: [Brochure](https://fake.example/brochure).',
      searchUsed: true,
      searchResults: [],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/Sumber:/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan|tahun atau kod model/i);
  });

  it('F1: strips Bismillah and passive purchase menu after catatan', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Exclusive pula?',
      recentUserMessages: ['Berapa tork enjin model kereta X varian Elite?'],
      rawModelOutput:
        `${UNIFIED_VERIFICATION_CATATAN}\n\n`
        + 'Bismillahirahmanirrahim.\n\n'
        + 'Jika anda memerlukan maklumat tentang prestasi sebenar (0–100 km/j, penggunaan bahan api, '
        + 'atau perbandingan dengan kereta lain), saya boleh bantu dengan detail yang sama tepat.\n\n'
        + 'Adakah anda sedang mempertimbangkan pembelian varian Elite, atau ingin membandingkannya dengan model lain?',
      searchUsed: true,
      searchResults: [{ title: 'Unrelated spec', url: 'https://example.com/x' }],
    });
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).not.toMatch(/0[\s–-]100\s*km/i);
    expect(out).not.toMatch(/mempertimbangkan\s+pembelian/i);
    expect(out).not.toMatch(/Myvi|Vios|Perodua/i);
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
  });

  it('G2: verified torque answer passes when lika supports picu', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapa tork unit K7?',
      rawModelOutput: 'Tork maksimum ialah 90 Nm @ 3600 rpm.',
      searchUsed: true,
      searchResults: [{ title: 'Torque 90 Nm @ 3600 rpm spec', url: 'https://example.com/spec' }],
    });
    expect(out).toMatch(/90\s*Nm/i);
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
  });

  it('G1: strips false search narrative and hollow result teaser', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Berapa tork varian Elite?',
      rawModelOutput:
        `${UNIFIED_VERIFICATION_CATATAN}\n\n`
        + 'Saya telah menjalankan carian terkini untuk mendapatkan spesifikasi rasmi enjin varian Elite, '
        + 'khususnya nilai tork maksimum (dalam Nm). berdasarkan sumber rasmi dan laporan teknikal terverifikasi.\n\n'
        + 'Berikut adalah hasil carian yang sah:\n\n'
        + 'Saya sedia bantu. dengan angka sah, bukan anggaran.',
      searchUsed: true,
      searchResults: [{ title: 'Unrelated', url: 'https://example.com/x' }],
    });
    expect(out).not.toMatch(CATATAN);
    expect(out).not.toMatch(/menjalankan\s+carian/i);
    expect(out).not.toMatch(/hasil\s+carian\s+yang\s+sah/i);
    expect(out).not.toMatch(/Saya\s+sedia\s+bantu/i);
    expect(out).not.toMatch(/sumber\s+rasmi/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
  });

  it('H3: entity correction strips invented dual-brand lineage (universal)', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'Kenapa proton? ini perodua. Anda sengaja buat silap ker',
      rawModelOutput:
        'Maaf atas kesilapan teknikal.\n\n'
        + 'Proton Viva (2007–2015) berbeza dengan Perodua Viva: rebadged Mitsubishi Colt CZ3 dihasilkan di Tanjung Malim. '
        + 'Perodua Viva pula sepenuhnya asal reka bentuk, diperbuat di Rawang — berat ~810 kg.\n\n'
        + 'Ketepatan bukan sekadar data — ia soal adab kepada kebenaran.',
      searchUsed: true,
      searchResults: [{ title: 'Hatchback 660cc specification review', url: 'https://example.com/spec' }],
    });
    expect(out).not.toMatch(/rebadg|Mitsubishi|adab kepada kebenaran|810\s*kg/i);
    expect(out).toMatch(/Maaf atas kesilapan/i);
  });

  it('H2: false verified hp/tork compare silent when search lacks picu (universal)', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'beza hp dan tork antara 2.5L dan 2.0L model Z 2023',
      rawModelOutput:
        'Berikut adalah hasil carian yang disahkan dari sumber rasmi dan laporan uji jalan terpercaya:\n\n'
        + '✅ Perbezaan utama: \n'
        + '- Versi 2.5L menghasilkan 38 hp lebih tinggi daripada versi 2.0L. iaitu peningkatan sekitar 25% dalam kuasa maksimum. \n'
        + '- Tork juga meningkat sebanyak 45 Nm, memberikan tujahan lebih responsif.\n\n'
        + 'Jika anda ingin saya bantu bandingkan juga faktor lain seperti penggunaan bahan api (km/l), '
        + 'berat kereta, atau kelajuan 0–100 km/j, saya boleh carikan data spesifik itu juga.',
      searchUsed: true,
      searchResults: [
        { title: 'Model Z 2023 review CVT 2.5L naturally aspirated', url: 'https://example.com/review' },
      ],
    });
    expect(out).not.toMatch(/hasil carian yang disahkan|38\s*hp|45\s*Nm/i);
    expect(out).not.toMatch(/bantu bandingkan|boleh carikan/i);
    expect(out).toBe('');
  });

  it('H1: specA/specB ask — strips deflection essay silently (universal)', async () => {
    const out = await runStudentVerificationPipeline({
      userMessage: 'hp/tork model Z 2024',
      rawModelOutput:
        'hp/tork model Z 2024 kelihatan merujuk kepada kategori produk lain.\n\n'
        + 'Berdasarkan carian semasa, tiada rekod rasmi untuk nama ini.\n\n'
        + 'Bolehkah anda nyatakan jenis yang dimaksudkan?\n\n'
        + 'Saya di sini. bersama anda. langkah demi langkah.',
      searchUsed: true,
      searchResults: [{ title: 'Model Z 2024 horsepower torque spec', url: 'https://example.com' }],
    });
    expect(out).not.toMatch(/kelihatan\s+merujuk/i);
    expect(out).not.toMatch(/carian\s+semasa/i);
    expect(out).not.toMatch(/Bolehkah\s+anda/i);
    expect(out).not.toMatch(/bersama\s+anda/i);
    expect(out).not.toMatch(/tidak dapat mengesahkan/i);
    expect(out).toBe('');
  });
});
