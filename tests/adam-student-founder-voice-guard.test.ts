/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  paragraphIsFounderTeachingVoiceLeak,
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

describe('sanitizeStudentOutputSync', () => {
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
});
