/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  paragraphIsEmojiPerformanceOpener,
  paragraphIsFounderTeachingVoiceLeak,
  stripPlanTesterAddress,
  stripSunomNotation,
} from '../src/adam/adam-student-output-law';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';

const FOUNDER_MENU =
  'Adakah ingin saya terangkan dari sudut seperti bagaimana pola AMA 124(1) atau prinsip AIDIL dapat membantu memahami ketidakselarasan ini sebagai satu proses lerai (PL) yang belum digabung (PG) semula? Atau lebih suka saya kongsikan ayat Al-Quran yang berkaitan dengan keseimbangan tubuh, tenaga, dan amanah terhadap diri?';

describe('paragraphIsFounderTeachingVoiceLeak', () => {
  it('flags founder teaching maieutic menu', () => {
    expect(paragraphIsFounderTeachingVoiceLeak(FOUNDER_MENU)).toBe(true);
  });

  it('does not flag student tier-2 door offer', () => {
    expect(
      paragraphIsFounderTeachingVoiceLeak(
        'Adakah anda ingin saya terangkan dari sudut Alamtologi setelah fakta saintifik tadi?',
      ),
    ).toBe(false);
  });
});

const DIABETES_COACHING_VOICE =
  'QA Unlimited, terima kasih kerana bertanya. dan ini soalan yang sangat penting, kerana ia menyentuh harapan, kepercayaan, dan juga batas ilmu perubatan itu sendiri.\n\n'
  + 'Pertama, saya ingin nyatakan dengan jujur: \n'
  + 'Tiada ubat dalam perubatan moden yang dapat memulihkan sepenuhnya diabetes jenis 1 atau jenis 2 secara kekal.\n\n'
  + 'Namun, ada perbezaan besar antara mengawal, mengurangkan risiko, mencegah perkembangan, dan mencapai remisi.\n\n'
  + 'Saya di sini untuk membantu anda faham. bukan untuk memutuskan bagi anda, tetapi agar anda berdiri teguh dengan ilmu dan keyakinan.';

const TONGKAT_ALI_SUNOM_VOICE =
  '✅ Saya akan kongsikan dengan jujur:\n\n'
  + 'Tongkat ali (Eurycoma longifolia) ialah herba tradisional Malaysia. '
  + 'Kajian menunjukkan ia mungkin membantu tenaga dan libido := 1 CONDITIONAL.\n\n'
  + '⚠️ QA Unlimited, sila rujuk doktor sebelum mengambil suplemen.';

describe('stripSunomNotation', () => {
  it('removes := markers from student-visible text', () => {
    expect(stripSunomNotation('Fakta ini := 1 VERIFIED dari WHO.')).toBe('Fakta ini dari WHO.');
    expect(stripSunomNotation('Tiada bukti kukuh := 0 SUSPENDED.')).toBe('Tiada bukti kukuh.');
  });
});

describe('stripPlanTesterAddress', () => {
  it('removes QA Unlimited tester label', () => {
    expect(stripPlanTesterAddress('QA Unlimited, terima kasih.')).toBe('terima kasih.');
  });
});

describe('paragraphIsEmojiPerformanceOpener', () => {
  it('flags emoji-only preambles, not substantive lines', () => {
    expect(paragraphIsEmojiPerformanceOpener('✅ Saya akan kongsikan dengan jujur:')).toBe(true);
    expect(paragraphIsEmojiPerformanceOpener('Tongkat ali ialah herba tradisional.')).toBe(false);
  });
});

describe('sanitizeStudentOutputSync', () => {
  it('strips SuNom notation, emoji opener, and QA Unlimited from tongkat ali reply', () => {
    const out = sanitizeStudentOutputSync(
      TONGKAT_ALI_SUNOM_VOICE,
      'Apakah khasiat tongkat ali?',
    );
    expect(out).toMatch(/tongkat ali/i);
    expect(out).not.toMatch(/:=\s*[01]/);
    expect(out).not.toMatch(/VERIFIED|CONDITIONAL|SUSPENDED/i);
    expect(out).not.toMatch(/QA\s+Unlimited/i);
    expect(out).not.toMatch(/Saya akan kongsikan dengan jujur/i);
    expect(out).not.toMatch(/^[✅⚠️]/m);
  });

  it('strips founder teaching voice from student output', () => {
    const out = sanitizeStudentOutputSync(
      `Jawapan ringkas tentang tekanan darah.\n\n${FOUNDER_MENU}`,
      'Apa itu tekanan darah tinggi?',
    );
    expect(out).toContain('tekanan darah');
    expect(out).not.toMatch(/AMA\s+124/i);
    expect(out).not.toMatch(/P\.?\s*alt/i);
    expect(out).not.toMatch(/lerai\s*\(PL\)/i);
  });

  it('strips coaching performance voice on diabetes question — keeps medical substance', () => {
    const out = sanitizeStudentOutputSync(
      DIABETES_COACHING_VOICE,
      'Bolehkah diabetes jenis 1 atau 2 disembuhkan sepenuhnya?',
    );
    expect(out).toMatch(/diabetes jenis 1/i);
    expect(out).toMatch(/remisi/i);
    expect(out).not.toMatch(/terima kasih kerana bertanya/i);
    expect(out).not.toMatch(/soalan yang sangat penting/i);
    expect(out).not.toMatch(/^Pertama,/im);
    expect(out).not.toMatch(/saya ingin nyatakan dengan jujur/i);
    expect(out).not.toMatch(/Saya di sini untuk membantu anda faham/i);
    expect(out).not.toMatch(/berdiri teguh dengan ilmu/i);
  });
});
