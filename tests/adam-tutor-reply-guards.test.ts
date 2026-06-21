/**
 * ADAM Tutor — post-stream language + Alamtologi guards.
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorAmbiguousInputReply,
  buildTutorMalayFollowUpRecovery,
  enforceTutorMathPedagogyGuard,
  enforceTutorReplyGuards,
  enforceTutorSessionLanguage,
  shouldIncludeTutorTeacherIntro,
  stripRepeatedTutorTeacherIntro,
  studentDemandsTutorDirectAnswer,
  tutorReplyHasTeacherIntro,
  tutorReplyIsPredominantlyEnglish,
} from '../src/adam/adam-tutor-law';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { AdamTutorProfile } from '../src/adam/adam-tutor-law';

const malayProfile: AdamTutorProfile = {
  level: 'secondary',
  curriculum: 'national',
  language: 'malay',
  countryCode: 'MY',
};

const englishBleed =
  `Pelajar, you've written just the number 6.

Would you like to:
* Explore what 6 means in mathematics?
* Or relate it to Alamtologi concepts you're studying, like AMA 124(1), TAJU, or the cube (6 faces)?

Let me know, and I'll guide you step by step. You do the thinking; I hold the light.`;

const malayIntroReply =
  `Salam, Ali. Saya Cikgu ADAM. Saya akan bimbing anda sampai faham — saya tidak akan beri jawapan siap; anda perlu buat latihan sendiri.

Berapa **5 + 7** di tempat Sa?
→ ______`;

const malayTeachingOnly =
  `Bagus, Ali. Mari kita semak tempat **Sa** sahaja.
Berapa **5 + 7**? Tulis digit di baris:
→ ______`;

describe('tutor teacher intro repetition', () => {
  it('detects student demanding a finished answer', () => {
    expect(studentDemandsTutorDirectAnswer('Beri jawapan siap terus')).toBe(true);
    expect(studentDemandsTutorDirectAnswer('just give me the answer')).toBe(true);
    expect(studentDemandsTutorDirectAnswer('5 + 7 = ?')).toBe(false);
  });

  it('allows intro on first assistant turn only', () => {
    expect(shouldIncludeTutorTeacherIntro('5 + 7 = ?', [], malayProfile)).toBe(true);
    expect(
      shouldIncludeTutorTeacherIntro(
        '5 + 7 = ?',
        [malayIntroReply],
        malayProfile,
      ),
    ).toBe(false);
    expect(
      shouldIncludeTutorTeacherIntro(
        'Beri jawapan siap',
        [malayTeachingOnly],
        malayProfile,
      ),
    ).toBe(true);
  });

  it('strips repeated full intro from later teaching turns', () => {
    const stripped = stripRepeatedTutorTeacherIntro(malayIntroReply, malayProfile);
    expect(stripped).not.toMatch(/Saya Cikgu ADAM/i);
    expect(stripped).toMatch(/5 \+ 7/);
    expect(tutorReplyHasTeacherIntro(malayIntroReply, malayProfile)).toBe(true);
  });

  it('enforceTutorReplyGuards removes intro when session already started', () => {
    const out = enforceTutorReplyGuards(
      malayIntroReply,
      malayProfile,
      '12',
      'Ali Ahmad',
      [malayIntroReply],
    );
    expect(out).not.toMatch(/Saya Cikgu ADAM/i);
    expect(out).toMatch(/5 \+ 7/);
  });
});

describe('enforceTutorSessionLanguage', () => {
  it('replaces English + Alamtologi menu with Malay recovery for numeric input', () => {
    const out = enforceTutorSessionLanguage(
      englishBleed,
      malayProfile,
      '6',
      'Ali Ahmad',
    );
    expect(out).toMatch(/nombor \*\*6\*\*/i);
    expect(out).not.toMatch(/Alamtologi/i);
    expect(out).not.toMatch(/Would you like to/i);
    expect(out).toMatch(/Salam, Ali/i);
  });

  it('fixes Pelajar opener to student first name', () => {
    const out = enforceTutorSessionLanguage(
      'Pelajar, mari kita mula.',
      malayProfile,
      'hi',
      'Ali Ahmad',
    );
    expect(out.startsWith('Ali,')).toBe(true);
  });
});

describe('enforceTutorReplyGuards', () => {
  it('scrubs Alamtologi lines and English bleed end-to-end', () => {
    const out = enforceTutorReplyGuards(
      englishBleed,
      malayProfile,
      '6',
      'Ali Ahmad',
    );
    expect(out).not.toMatch(/Alamtologi|AMA 124|TAJU/i);
    expect(out).not.toMatch(/Would you like to/i);
    expect(out).toMatch(/Cikgu|Ali|nombor/i);
  });
});

describe('buildTutorAmbiguousInputReply', () => {
  it('returns Malay guidance for bare number', () => {
    const out = buildTutorAmbiguousInputReply('6', malayProfile, 'Ali');
    expect(out).toMatch(/nombor \*\*6\*\*/);
    expect(out).not.toMatch(/Alamtologi/i);
  });
});

const englishReexplain =
  `Good try! You wrote 12.

Let me explain the ones column step by step.
5 + 7 = 12, so you carry 1 to the tens place.

Write the digit for the ones place here:
→ ______

Keep going — you do the thinking; I hold the light.`;

describe('tutorReplyIsPredominantlyEnglish', () => {
  it('detects English re-explanation after student numeric answer', () => {
    expect(tutorReplyIsPredominantlyEnglish(englishReexplain)).toBe(true);
  });

  it('does not flag proper Malay tutoring reply', () => {
    const malayReply =
      `Bagus! Anda tulis **12**.

Mari kita semak tempat **Sa** (satuan) sahaja.
Berapa **5 + 7**? Tulis digit di baris:
→ ______

**Cikgu** tunggu — anda fikir; saya bimbing langkah demi langkah.`;
    expect(tutorReplyIsPredominantlyEnglish(malayReply)).toBe(false);
  });
});

describe('buildTutorMalayFollowUpRecovery', () => {
  it('returns Malay recovery after student numeric answer', () => {
    const out = buildTutorMalayFollowUpRecovery('12', malayProfile, 'Ali Ahmad');
    expect(out).toMatch(/Salam, Ali/i);
    expect(out).toMatch(/jawapan \*\*12\*\*/i);
    expect(out).not.toMatch(/Let me explain/i);
    expect(out).toMatch(/Cikgu/i);
  });
});

describe('enforceTutorSessionLanguage — English re-explain', () => {
  it('replaces English re-explanation with Malay follow-up recovery', () => {
    const out = enforceTutorSessionLanguage(
      englishReexplain,
      malayProfile,
      '12',
      'Ali Ahmad',
    );
    expect(out).not.toMatch(/Let me explain|Good try/i);
    expect(out).toMatch(/Salam, Ali|jawapan \*\*12\*\*|Cikgu/i);
  });
});

describe('enforceTutorMathPedagogyGuard — tester library regression', () => {
  it('V-T-M01: strips off-topic "tambah nombor 4" reflection during arithmetic', () => {
    const raw = readFileSync(
      join(__dirname, 'fixtures/tutor-math-reflection-leak.txt'),
      'utf8',
    );
    const out = enforceTutorReplyGuards(
      `Betul, Pelajar.\n\n${raw}\n\nBerapa **1 − 2** di tempat **Puluh**?\n→ ______\n\nSaya tunggu.`,
      malayProfile,
      '1+2+3 = 6',
      'Pelajar',
      [malayTeachingOnly],
    );
    expect(out).not.toMatch(/tambah nombor 4|empat arah|AMA\b/i);
    expect(out).toMatch(/Betul|Puluh|→ ______/i);
    expect((out.match(/Saya tunggu/gi) ?? []).length).toBeLessThanOrEqual(1);
  });

  it('V-T-M02: strips MASA/TENAGA reflection when student rejects philosophical framing', () => {
    const raw = readFileSync(
      join(__dirname, 'fixtures/tutor-masa-tenaga-leak.txt'),
      'utf8',
    );
    const out = enforceTutorMathPedagogyGuard(
      raw,
      malayProfile,
      'tidak faham soalan cikgu adam . apa kaitan masa dengan tenaga dalam soalan matematik yang saya tanya',
    );
    expect(out).not.toMatch(/MASA\s*→\s*TENAGA|perkara kecil yang anda lakukan|→ _{5,}/i);
    expect(out).toMatch(/tiada kaitan langsung/i);
  });

  it('V-T-M03: strips AMA / four-directions digression on "dari mana datang no. 4"', () => {
    const digression =
      'Nombor 4 bukan muncul secara tiba-tiba. Ia lahir dari proses tambah.\n\n'
      + 'Utara, Selatan, Timur, Barat → Atas, Bawah, Depan, Belakang\n\n'
      + 'Apakah contoh harian yang menunjukkan empat arah dalam kehidupan anda?';
    const out = enforceTutorReplyGuards(
      digression,
      malayProfile,
      'Dari mana datang no. 4',
      'Pelajar',
      [malayTeachingOnly],
    );
    expect(out).not.toMatch(/Utara|empat arah|contoh harian/i);
    expect(out).toMatch(/langkah matematik|satu langkah/i);
  });
});
