/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  isTechnicalPrecisionQuestion,
  userOpenedFaithDoor,
} from '../src/adam/adam-universal-voice';

describe('ADAM universal voice output guard', () => {
  it('strips Bismillah opener on ordinary questions', () => {
    const raw =
      'Bismillahirahmanirrahim.\n\nHello. Anxiety often starts when the body stays on alert.';
    const out = sanitizeStudentOutputSync(raw, 'Why do I feel anxious?');
    expect(out).not.toMatch(/Bismillah/i);
    expect(out).toContain('Anxiety often starts');
  });

  it('removes unsolicited Quran paragraphs when faith door closed', () => {
    const raw =
      'Stress affects sleep cycles in measurable ways.\n\n'
      + 'Allah berfirman: "Verily, in the remembrance of Allah do hearts find rest." (Surah Ar-Ra\'d 13:28).';
    const out = sanitizeStudentOutputSync(raw, 'How does stress affect sleep?');
    expect(out).not.toMatch(/Allah berfirman/i);
    expect(out).toContain('Stress affects sleep');
  });

  it('keeps Quran when user opened the faith door', () => {
    const msg = 'What ayat in Quran speaks about patience?';
    expect(userOpenedFaithDoor(msg)).toBe(true);
    const raw = 'Allah berfirman about patience in Surah Al-Baqarah 2:153.';
    const out = sanitizeStudentOutputSync(raw, msg);
    expect(out).toMatch(/Allah berfirman/i);
  });

  it('strips Alamtologi billboard phrases', () => {
    const raw = 'Dalam lensa Alamtologi, rest is a rhythm of trust and release.';
    const out = sanitizeStudentOutputSync(raw, 'I cannot sleep well.');
    expect(out).not.toMatch(/Alamtologi/i);
  });
});

describe('Technical precision detection', () => {
  it('detects fuel consumption and trim comparison questions', () => {
    expect(isTechnicalPrecisionQuestion('elite vs exclusive fuel consumption')).toBe(true);
    expect(isTechnicalPrecisionQuestion('berapa km/l enjin 1.3?')).toBe(true);
    expect(isTechnicalPrecisionQuestion('varian premium fuel consumption')).toBe(true);
  });

  it('detects non-automotive technical questions', () => {
    expect(isTechnicalPrecisionQuestion('Berapa volt output charger 65W?')).toBe(true);
    expect(isTechnicalPrecisionQuestion('dos insulin type 1 diabetes')).toBe(true);
  });

  it('does not flag pure greetings', () => {
    expect(isTechnicalPrecisionQuestion('salam')).toBe(false);
  });
});
