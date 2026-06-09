/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  isExplanatoryScienceQuestion,
  isLifeEmotionTurn,
  isTechnicalPrecisionQuestion,
  userOpenedFaithDoor,
} from '../src/adam/adam-universal-voice';
import { getWebSearchGateReason } from '../src/adam/adam-web-search';

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

describe('Life emotion turns — delivery overlay', () => {
  it('detects anxiety and sleep questions', () => {
    expect(isLifeEmotionTurn('Kenapa saya rasa cemas sebelum tidur?')).toBe(true);
    expect(isLifeEmotionTurn('Bagaimana stres mempengaruhi tidur?')).toBe(true);
  });

  it('does not flag technical spec questions', () => {
    expect(isLifeEmotionTurn('Berapa tork Viva Elite?')).toBe(false);
  });

  it('still runs search gate for life emotion substantive turns', () => {
    expect(getWebSearchGateReason('Kenapa saya rasa cemas sebelum tidur?')).toBe('factual_question');
  });
});

describe('Explanatory science detection', () => {
  it('flags apa punca health questions', () => {
    expect(isExplanatoryScienceQuestion('Apa punca manusia mengidap diabetes?')).toBe(true);
    expect(isExplanatoryScienceQuestion('Kenapa jantung berdenyut lebih laju bila cemas?')).toBe(true);
  });

  it('does not flag dosage or spec questions', () => {
    expect(isExplanatoryScienceQuestion('Berapa mg paracetamol untuk kanak-kanak?')).toBe(false);
    expect(isExplanatoryScienceQuestion('dos insulin type 1 diabetes')).toBe(false);
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
