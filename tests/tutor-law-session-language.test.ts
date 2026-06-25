import { describe, expect, it } from '@jest/globals';
import {
  detectTutorExplicitLanguageRequest,
  enforceTutorSessionLanguage,
  resolveTutorSessionLanguage,
  rewriteTutorEnglishDriftToMalay,
} from '../src/adam/tutor-law/tutor-law.session-language';
import type { AdamTutorProfile } from '../src/adam/adam-tutor-law';

const malayProfile: AdamTutorProfile = {
  level:       'primary',
  curriculum:  'national',
  language:    'malay',
  countryCode: 'MY',
};

const englishProfile: AdamTutorProfile = {
  level:       'primary',
  curriculum:  'national',
  language:    'english',
  countryCode: 'MY',
};

describe('detectTutorExplicitLanguageRequest', () => {
  it('detects English switch requests in Malay phrasing', () => {
    expect(detectTutorExplicitLanguageRequest('Boleh jawab dalam english tak')).toBe('english');
    expect(detectTutorExplicitLanguageRequest('Can you answer in English please?')).toBe('english');
  });

  it('detects Malay switch requests', () => {
    expect(detectTutorExplicitLanguageRequest('Please reply in Malay')).toBe('malay');
  });
});

describe('resolveTutorSessionLanguage', () => {
  it('honours explicit English request even when profile is Malay', () => {
    const lang = resolveTutorSessionLanguage(
      malayProfile,
      ['Salam, mari kita mulakan.'],
      ['Salam, boleh bantu saya'],
      'Boleh jawab dalam english tak',
    );
    expect(lang).toBe('english');
  });

  it('locks BM when pelajar writes in Malay even if Cikgu drifted English', () => {
    const lang = resolveTutorSessionLanguage(
      englishProfile,
      [`Well done! You've correctly expanded the expression.`],
      ['Salam, boleh bantu saya kembangkan ungkapan algebra berikut: 4(3x - 2y)'],
      'Salam, boleh bantu saya kembangkan ungkapan algebra berikut: 4(3x - 2y)',
    );
    expect(lang).toBe('malay');
  });

  it('uses profile language only as fallback for ambiguous input', () => {
    expect(resolveTutorSessionLanguage(malayProfile, [], [], '12x')).toBe('malay');
    expect(resolveTutorSessionLanguage(englishProfile, [], [], '12x')).toBe('english');
  });

  it('prefers English when student writes in English', () => {
    const lang = resolveTutorSessionLanguage(
      malayProfile,
      [],
      [],
      'Can you help me expand this expression: 4(3x - 2y)?',
    );
    expect(lang).toBe('english');
  });
});

describe('rewriteTutorEnglishDriftToMalay', () => {
  it('rewrites Well done algebra praise to BM', () => {
    const english = `Well done, Pelajar! ✅
You've correctly expanded the expression:

4 × 3x = 12x
4 × (−2y) = −8y

So, putting them together:
4(3x − 2y) = 12x − 8y`;

    const out = rewriteTutorEnglishDriftToMalay(english, malayProfile, 'Ali');
    expect(out).toMatch(/Bagus/i);
    expect(out).not.toMatch(/Well done/i);
    expect(out).toMatch(/12x/);
  });
});

describe('enforceTutorSessionLanguage', () => {
  it('keeps English replies when student uses English (no BM rewrite)', () => {
    const english = `Well done, Pelajar! ✅
You've written: **12a and −14b**
Let's verify step by step:
→ **2 × 6a = 12a** ✅`;

    const out = enforceTutorSessionLanguage(
      english,
      malayProfile,
      '12a dan -14b',
      'Siti',
      ['Mari kita teruskan satu langkah sahaja.'],
      ['Salam, boleh bantu saya selesaikan soalan berikut', '12a dan -14b'],
    );

    expect(out).toMatch(/Well done|Let's verify/i);
    expect(out).toMatch(/12a/i);
  });

  it('does not force BM when student explicitly asks for English', () => {
    const english = `Of course! Let's work through this step by step in English.
What would you like to explore first?`;

    const out = enforceTutorSessionLanguage(
      english,
      malayProfile,
      'Boleh jawab dalam english tak',
      'Ali',
      ['Salam, mari kita mulakan.'],
      ['Salam'],
    );

    expect(out).toMatch(/English/i);
    expect(out).not.toMatch(/Tidak.*tidak boleh/i);
  });
});
