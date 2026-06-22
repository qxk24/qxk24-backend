/**
 * ADAM Tutor — post-stream language + Alamtologi guards.
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorAmbiguousInputReply,
  buildTutorGreetingFallback,
  buildTutorMalayFollowUpRecovery,
  enforceTutorMathPedagogyGuard,
  enforceTutorQuantityReplyGuard,
  enforceTutorAlgebraStuckGuard,
  enforceTutorAlgebraMicroCorrectionGuard,
  enforceTutorPlaceValueColumnGuard,
  enforceTutorCarryPlacementGuard,
  enforceTutorReplyGuards,
  enforceTutorScienceFactualGuard,
  enforceTutorSessionLanguage,
  shouldIncludeTutorTeacherIntro,
  shouldSkipTutorZeroAnswerGuard,
  stripRepeatedTutorTeacherIntro,
  studentDemandsTutorDirectAnswer,
  studentMessageLooksLikeFinalAnswer,
  tutorQuestionIsPercentageWordProblem,
  tutorQuestionIsMultiStepFractionWordProblem,
  tutorThreadIsQuantityWordProblem,
  tutorQuestionIsScienceFactual,
  tutorThreadIsPercentageWordProblem,
  tutorTurnWarrantsAutoClosingSummary,
  tutorReplyHasCompleteWorkingSummary,
  tutorReplySummaryLooksIncomplete,
  tutorReplyHasTeacherIntro,
  tutorSessionIdentityEstablished,
  tutorSessionTeachingStarted,
  tutorParagraphIsPolicyIntroBlock,
  tutorReplyIsPredominantlyEnglish,
  tutorQuestionIsQuadraticEquation,
  tutorAlgebraFullExampleWarranted,
  tutorReplyHasAlgebraFactoringExample,
  tutorTurnNeedsAlgebraWorkedExampleLaw,
  tutorTurnNeedsFactorPairMicroLaw,
  tutorStudentGaveFactorPairAttempt,
  tutorThreadIsPlaceValueAddition,
  tutorReplyMisalignsPlaceValueColumn,
  tutorColumnDigit,
  tutorReplyMisplacesCarry,
  tutorStudentFlagsTeacherMathError,
  tutorInferArithmeticProficiency,
  tutorThreadWarrantsCompactArithmetic,
  tutorInferFurthestColumnInThread,
  tutorReplyRegressesColumnPhase,
  tutorAdditionPhaseComplete,
  tutorStudentFlagsTeachingLoopError,
  parseAddThenSubtractProblem,
  enforceTutorPlaceValuePhaseGuard,
} from '../src/adam/adam-tutor-law';
import { studentStatesFinalArithmeticAnswer } from '../src/adam/tutor-law/tutor-law.arithmetic-closure';
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

const malayPolicyIntroReply =
  `Salam, Ali. Saya Cikgu ADAM. Saya akan bimbing anda sampai faham — saya tidak akan beri jawapan siap; anda perlu buat latihan sendiri.

Berapa **5 + 7** di tempat Sa?
→ ______`;

const malayNaturalFirstTurn =
  `Baik Ali. Apabila f(x) = 0, persamaan apa kita tulis?
→ ______`;

const malayIntroReply = malayPolicyIntroReply;

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

  it('V-T-V01: natural first turn establishes session without policy speech', () => {
    expect(tutorSessionTeachingStarted(malayNaturalFirstTurn)).toBe(true);
    expect(tutorSessionIdentityEstablished(malayNaturalFirstTurn, malayProfile)).toBe(true);
    expect(tutorReplyHasTeacherIntro(malayNaturalFirstTurn, malayProfile)).toBe(false);
    expect(
      shouldIncludeTutorTeacherIntro('12', [malayNaturalFirstTurn], malayProfile),
    ).toBe(false);
  });

  it('V-T-V02: greeting fallback is warm without policy lecture', () => {
    const out = buildTutorGreetingFallback('salam', 'Ali Ahmad', malayProfile);
    expect(out).toMatch(/Salam, Ali|Saya Cikgu ADAM/i);
    expect(out).toMatch(/belajar|subjek|soalan/i);
    expect(out).not.toMatch(/jawapan siap|latihan sendiri/i);
  });

  it('V-T-V03: strips legacy policy intro block on repeat turns', () => {
    const repeated =
      `${malayPolicyIntroReply}\n\nSalam, Ali. Saya Cikgu ADAM. Saya tidak beri jawapan siap.\n\nBerapa **1 + 2**?\n→ ______`;
    const out = stripRepeatedTutorTeacherIntro(repeated, malayProfile);
    expect(out).not.toMatch(/jawapan siap|latihan sendiri/i);
    expect(out).toMatch(/1 \+ 2|→ ______/i);
    expect(tutorParagraphIsPolicyIntroBlock(
      'Saya Cikgu ADAM. Saya tidak beri jawapan siap; anda buat latihan sendiri.',
      malayProfile,
    )).toBe(true);
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

  it('V-TL-LANG-01: place-value Puluh step stays Malay after student answers 1', () => {
    const englishPuluh =
      `So far, our addition looks like this:
  560
+ 1001
------
    1
Now let's move to the next column to the left: the Puluh (tens) place.
From 560 → 6
From 1001 → 0
So: 6 + 0 = ? at the Puluh place.
→ ______
Take your time, I'll wait for your answer, then we'll continue to the Ratus, and so on.`;

    const out = enforceTutorReplyGuards(
      englishPuluh,
      malayProfile,
      '1',
      'Pelajar',
      [malayTeachingOnly],
      ['Penny mempunyai 560 biji bola pingpong.'],
    );
    expect(out).not.toMatch(/Take your time|Now let's move|Teacher won't work/i);
    expect(out).toMatch(/Puluh|6 \+ 0|jawapan anda \*\*1\*\*|Cikgu/i);
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

describe('tutor science factual routing — sunlight / physics Q&A', () => {
  const sunlightQ =
    'Berapa masa yang diambil oleh cahaya matahari untuk sampai ke bumi?';

  it('V-T-S01: detects factual science question (not math exercise)', () => {
    expect(tutorQuestionIsScienceFactual(sunlightQ)).toBe(true);
    expect(tutorQuestionIsScienceFactual('Ali ada 2,385 biji guli. Dia beli lagi 1,427.')).toBe(false);
    expect(tutorQuestionIsScienceFactual('a − 4 = 2')).toBe(false);
  });

  it('V-T-S02: strips gatekeeping, blank lines, and "Saya tunggu arahan" from old-style reply', () => {
    const raw = readFileSync(
      join(__dirname, 'fixtures/tutor-science-factual-bad-close.txt'),
      'utf8',
    );
    const out = enforceTutorScienceFactualGuard(raw, sunlightQ);
    expect(out).not.toMatch(/bukan soalan matematik|soalan sains tinggi|→ _{5,}/i);
    expect(out).not.toMatch(/Saya tunggu|Apakah yang membuat cahaya|Tulis di sini/i);
    expect(out).toMatch(/8 minit dan 20 saat|149\.6 juta km|299,792 km\/s/i);
  });

  it('V-T-S03: preserves factual answer and skips zero-answer guard', () => {
    const good =
      'Cahaya matahari mengambil **lebih kurang 8 minit dan 20 saat** untuk sampai ke Bumi.\n\n'
      + '**Masa = Jarak ÷ Kelajuan**\n\n'
      + '149,600,000 km ÷ 299,792 km/s ≈ 499 saat ≈ 8 minit 19 saat';
    const out = enforceTutorReplyGuards(
      good,
      malayProfile,
      sunlightQ,
      'Pelajar',
      [malayTeachingOnly],
    );
    expect(out).toMatch(/8 minit dan 20 saat|Masa = Jarak/i);
    expect(out).not.toMatch(/tidak siapkan kiraan penuh|→ ______/i);
  });
});

describe('tutor percentage word problems — Year 6 pedagogy', () => {
  const percentQ =
    'Daripada 240 orang murid, 35% ialah murid lelaki. Berapakah bilangan murid perempuan?';

  it('V-T-P01: detects percentage word problem thread', () => {
    expect(tutorQuestionIsPercentageWordProblem(percentQ)).toBe(true);
    expect(tutorThreadIsPercentageWordProblem('156', [], ['35% daripada 240'])).toBe(true);
  });

  it('V-T-P02: strips 10%+30%+5% decomposition chain', () => {
    const raw = readFileSync(
      join(__dirname, 'fixtures/tutor-percentage-decomposition-leak.txt'),
      'utf8',
    );
    const out = enforceTutorQuantityReplyGuard(raw, percentQ, [percentQ]);
    expect(out).not.toMatch(/10% daripada|30% = 3|5% = ½|Saya di sini, bersama anda/i);
    expect(out).toMatch(/35\/100 × 240|35% daripada 240/i);
  });

  it('V-T-P03: skips zero-answer nudge when full working summary present', () => {
    const summary =
      'Susunan cara kira keseluruhan (seperti di buku latihan):\n\n'
      + 'Murid lelaki (35%) = 35/100 × 240\n'
      + ' = (35 × 240) ÷ 100\n'
      + ' = 8400 ÷ 100\n'
      + ' = 84 orang\n\n'
      + 'Murid perempuan = 240 − 84\n'
      + ' = 156 orang\n\n'
      + 'Jawapan: 156 orang';
    expect(shouldSkipTutorZeroAnswerGuard(summary, 'Boleh tunjukkan susunan cara kira keseluruhan?', [])).toBe(true);
    const out = enforceTutorReplyGuards(
      summary,
      malayProfile,
      'Boleh tunjukkan susunan cara kira keseluruhan?',
      'Pelajar',
      [malayTeachingOnly],
    );
    expect(out).not.toMatch(/tidak siapkan kiraan penuh|→ ______/i);
    expect(out).toMatch(/Susunan cara kira keseluruhan|156 orang/i);
  });
});

describe('tutor fraction remainder multi-step — lorry / baki', () => {
  const lorryQ =
    'Sebuah lori membawa 480 kotak minuman. Pada hari pertama, 3/8 daripada jumlah kotak dihantar ke Kedai A. '
    + 'Pada hari kedua, 1/4 daripada baki kotak dihantar ke Kedai B. '
    + 'Berapakah bilangan kotak minuman yang masih berada di dalam lori selepas hari kedua?';

  it('V-T-F01: detects multi-step fraction + baki word problem', () => {
    expect(tutorQuestionIsMultiStepFractionWordProblem(lorryQ)).toBe(true);
    expect(tutorThreadIsQuantityWordProblem('225', [], ['3/8 × 480', lorryQ])).toBe(true);
  });

  it('V-T-F02: strips MASA/nombor hidup philosophy after full working', () => {
    const raw = readFileSync(
      join(__dirname, 'fixtures/tutor-fraction-remainder-philosophy-leak.txt'),
      'utf8',
    );
    const summary =
      'Susunan cara kira keseluruhan:\n'
      + '3/8 × 480 = 180\n'
      + 'Baki = 480 − 180 = 300\n'
      + '1/4 × 300 = 75\n'
      + '300 − 75 = 225\n'
      + 'Jawapan: 225 kotak\n\n'
      + raw;
    const out = enforceTutorQuantityReplyGuard(summary, lorryQ, [lorryQ]);
    expect(out).not.toMatch(/MASA baru|Setiap angka itu hidup|✅ Baki bukan|Saya di sini, bersama anda/i);
    expect(out).toMatch(/225 kotak|Susunan cara kira/i);
  });

  it('V-T-F03: auto-summary turn skips zero-answer nudge', () => {
    const summary =
      'Susunan cara kira keseluruhan (seperti di buku latihan):\n\n'
      + 'Bilangan kotak dihantar ke Kedai A\n'
      + '= 3/8 × 480\n'
      + '= 180 kotak\n\n'
      + 'Baki kotak\n'
      + '= 480 − 180\n'
      + '= 300 kotak\n\n'
      + 'Bilangan kotak yang masih tinggal\n'
      + '= 300 − 75\n'
      + '= 225 kotak\n\n'
      + 'Jawapan: 225 kotak';
    const out = enforceTutorReplyGuards(
      summary,
      malayProfile,
      'Boleh berikan susunan cara kira keseluruhan',
      'Pelajar',
      [lorryQ],
    );
    expect(out).not.toMatch(/tidak siapkan kiraan penuh|→ ______/i);
    expect(out).toMatch(/225 kotak/i);
  });
});

describe('tutor session auto-closure — full summary without student request', () => {
  const percentQ =
    'Daripada 240 orang murid, 35% ialah murid lelaki. Berapakah bilangan murid perempuan?';

  it('V-T-C01: detects final numeric answer after micro-teaching thread', () => {
    expect(studentMessageLooksLikeFinalAnswer('156')).toBe(true);
    expect(studentMessageLooksLikeFinalAnswer('156 orang')).toBe(true);
    expect(studentMessageLooksLikeFinalAnswer('Boleh tunjukkan susunan?')).toBe(false);
    expect(
      tutorTurnWarrantsAutoClosingSummary(
        '156',
        [percentQ],
        ['Berapa 35 × 240?\n→ ______\n\nSaya tunggu.'],
      ),
    ).toBe(true);
  });

  it('V-T-C02: skips zero-answer nudge when closure turn warranted', () => {
    const partialGood =
      'Betul!\n\nSusunan cara kira keseluruhan:\n\n'
      + 'Murid lelaki (35%) = 35/100 × 240\n'
      + ' = 8400 ÷ 100\n'
      + ' = 84 orang\n\n'
      + 'Murid perempuan = 240 − 84\n'
      + ' = 156 orang\n\n'
      + 'Jawapan: 156 orang';
    expect(
      shouldSkipTutorZeroAnswerGuard(
        partialGood,
        '156',
        ['Berapa 35 × 240?\n→ ______'],
        [percentQ],
      ),
    ).toBe(true);
    const out = enforceTutorReplyGuards(
      partialGood,
      malayProfile,
      '156',
      'Pelajar',
      ['Berapa 35 × 240?\n→ ______'],
      [percentQ],
    );
    expect(out).not.toMatch(/tidak siapkan kiraan penuh|→ ______/i);
    expect(out).toMatch(/Susunan cara kira keseluruhan|156 orang/i);
  });

  it('V-T-W01: rejects prose-only closure without intermediate = steps', () => {
    const incomplete = 'Betul! Jawapan akhirnya 156 orang murid perempuan.';
    expect(tutorReplyHasCompleteWorkingSummary(incomplete)).toBe(false);
    expect(tutorReplySummaryLooksIncomplete(incomplete)).toBe(true);
    const complete =
      'Murid lelaki = 35/100 × 240\n = 8400 ÷ 100\n = 84 orang\n'
      + 'Murid perempuan = 240 − 84\n = 156 orang\nJawapan: 156 orang';
    expect(tutorReplyHasCompleteWorkingSummary(complete)).toBe(true);
    expect(tutorReplySummaryLooksIncomplete(complete)).toBe(false);
  });
});

describe('tutor quadratic stuck escalation — factoring / tak faham', () => {
  const quadQ =
    'Fungsi f(x) = x² − 5x + 6. Cari nilai x apabila f(x) = 0.';

  const microTeachingTurn =
    'Baik. Cuba cari dua nombor (pasangan nombor) yang darabnya 6 dan tolaknya 5.\n'
    + '→ ______\n\nSaya tunggu, dan kita teruskan bersama.';

  it('V-T-Q01: detects repeated tak faham on quadratic thread', () => {
    expect(tutorQuestionIsQuadraticEquation(quadQ)).toBe(true);
    expect(
      tutorAlgebraFullExampleWarranted(
        'Saya tak faham',
        [quadQ, 'Saya tak faham'],
        [microTeachingTurn],
      ),
    ).toBe(true);
    expect(
      tutorTurnNeedsAlgebraWorkedExampleLaw(
        'Saya tak faham',
        [quadQ, 'Saya tak faham'],
        [microTeachingTurn],
      ),
    ).toBe(true);
  });

  it('V-T-Q02: strips philosophy + micro-teaching when escalation warranted', () => {
    const raw =
      'Ambang pemahaman anda sudah hampir sampai.\n\n'
      + 'Saya di sini, bersama anda.\n\n'
      + microTeachingTurn;
    const out = enforceTutorAlgebraStuckGuard(
      raw,
      'Saya tak faham',
      [microTeachingTurn],
      [quadQ, 'Saya tak faham'],
    );
    expect(out).not.toMatch(/ambang pemahaman|Saya di sini, bersama anda|→ ______|pasangan nombor/i);
  });

  it('V-T-Q03: preserves full factoring example and skips zero-answer nudge', () => {
    const good =
      'Baik, kita tengok contoh lengkap dulu.\n\n'
      + 'Diberi: f(x) = x² − 5x + 6, cari x apabila f(x) = 0.\n\n'
      + 'x² − 5x + 6 = 0\n'
      + '= (x − 2)(x − 3) = 0\n\n'
      + 'Jika hasil darab = 0, maka x − 2 = 0 atau x − 3 = 0\n'
      + '→ x = 2 atau x = 3\n\n'
      + 'Semak (x = 2): f(2) = 2² − 5(2) + 6 = 4 − 10 + 6 = 0 ✓\n\n'
      + 'Jawapan: x = 2 atau x = 3\n\n'
      + '**Latihan isomorfik**: Selesaikan x² − 7x + 12 = 0.';
    expect(tutorReplyHasAlgebraFactoringExample(good)).toBe(true);
    expect(
      shouldSkipTutorZeroAnswerGuard(
        good,
        'Saya tak faham',
        [microTeachingTurn],
        [quadQ, 'Saya tak faham'],
      ),
    ).toBe(true);
    const out = enforceTutorReplyGuards(
      good,
      malayProfile,
      'Saya tak faham',
      'Pelajar',
      [microTeachingTurn],
      [quadQ, 'Saya tak faham'],
    );
    expect(out).not.toMatch(/tidak siapkan kiraan penuh|→ ______/i);
    expect(out).toMatch(/\(x − 2\)\(x − 3\)|x = 2 atau x = 3|Latihan isomorfik/i);
  });
});

describe('tutor place value columns — Sa/Puluh alignment', () => {
  const problem1250 = '1250 + 375';

  const wrongSaReply =
    'Betul, Pelajar. 5 + 7 = 12\n\n'
    + 'Sekarang, kita bawa nilai 12 ke langkah seterusnya, iaitu tempat Puluh.\n\n'
    + 'Mari kita isi dalam susunan menegak:\n\n'
    + 'Digit **Sa**: berapa **5 + 7**?\n\n'
    + '→ ______\n\n'
    + 'Saya tunggu, kemudian kita terus ke tempat **Puluh**.';

  it('V-T-PV01: detects misaligned Sa step for 1,250 + 375', () => {
    expect(tutorThreadIsPlaceValueAddition(problem1250, [], [])).toBe(true);
    expect(tutorReplyMisalignsPlaceValueColumn(wrongSaReply, [1250, 375], 'sa')).toBe(true);
    expect(tutorColumnDigit(1250, 'sa')).toBe(0);
    expect(tutorColumnDigit(375, 'sa')).toBe(5);
    expect(tutorColumnDigit(1250, 'puluh')).toBe(5);
    expect(tutorColumnDigit(375, 'puluh')).toBe(7);
  });

  it('V-T-PV02: guard replaces wrong Sa digits with 0 + 5 recovery', () => {
    const out = enforceTutorPlaceValueColumnGuard(wrongSaReply, problem1250, []);
    expect(out).not.toMatch(/5\s*\+\s*7.*tempat\s+\*?\*?Sa/i);
    expect(out).toMatch(/0\s*\+\s*5|0 \+ 5/);
    expect(out).toMatch(/→ ______/);
  });

  it('V-T-PV03: allows correct Sa step for 2,385 + 1,427', () => {
    const good =
      'Mulakan dari kanan, tempat **Sa** (satuan):\nBerapa **5 + 7**?\n→ ______';
    expect(tutorReplyMisalignsPlaceValueColumn(good, [2385, 1427], 'sa')).toBe(false);
    const out = enforceTutorPlaceValueColumnGuard(good, '2385 + 1427', []);
    expect(out).toMatch(/5 \+ 7/);
  });
});

describe('tutor carry placement — bawaan after Puluh sum ≥10', () => {
  const problem1250 = '1250 + 375';
  const operands = [1250, 375];

  const wrongCarryReply =
    'Betul, Pelajar.\n**5 + 7 = 12**\n\n'
    + 'Kita gunakan digit **2** untuk lajur **Sa**, dan **1** sebagai bawaan ke lajur **Puluh**.\n\n'
    + '```\n  1 250\n+   375\n-------\n    ? 2\n```\n\n'
    + 'Berapa **5 + 7 + 1 (bawaan)** di tempat **Puluh**?\n→ ______';

  it('V-T-CV01: detects misplaced carry (?32 pattern) for 1,250 + 375', () => {
    expect(tutorReplyMisplacesCarry(wrongCarryReply, operands)).toBe(true);
  });

  it('V-T-CV02: guard replaces wrong carry with ?25 recovery and Ratus prompt', () => {
    const out = enforceTutorCarryPlacementGuard(wrongCarryReply, problem1250, ['5', '12']);
    expect(out).not.toMatch(/\?\s*3\s*2|digit\s+\*?\*?2\*?\*?\s+untuk\s+lajur\s+\*?\*?Sa/i);
    expect(out).toMatch(/\?\s*25|25/);
    expect(out).toMatch(/2\s*\+\s*3\s*\+\s*1.*Ratus/i);
    expect(out).toMatch(/→ ______/);
    expect(out).not.toMatch(/\b1[,.]?625\b|\b1625\b/);
  });
});

describe('tutor student correction — no full answer leak after fix', () => {
  const libraryQ =
    'Perpustakaan 1,250 buku. Beli 375. Lupus 128. Berapa jumlah sekarang?';
  const studentFix =
    'saya rasa awak jelaskan tidak tepat sepatutnya ?25 bukan ?32';

  const leakedReply =
    'Terima kasih, Pelajar, anda betul.\n\n'
    + '```\n1250\n+ 375\n-------\n1625\n```\n\n'
    + '→ **1,625** buku sebelum lupus.\n\n'
    + 'Adakah anda mahu kita sambung dari sini?';

  it('V-T-SC01: detects student flags teacher error', () => {
    expect(tutorStudentFlagsTeacherMathError(studentFix)).toBe(true);
  });

  it('V-T-SC02: guard strips 1625 leak and resumes Ratus micro-step', () => {
    const out = enforceTutorReplyGuards(
      leakedReply,
      malayProfile,
      studentFix,
      'Pelajar',
      ['Berapa 5 + 7?', '→ ______'],
      [libraryQ],
    );
    expect(out).not.toMatch(/\b1[,.]?625\b|\b1625\b/);
    expect(out).not.toMatch(/Adakah anda mahu|Mahu kita sambung/i);
    expect(out).toMatch(/2\s*\+\s*3\s*\+\s*1|Ratus/i);
  });
});

describe('tutor arithmetic proficiency — adaptive tier', () => {
  it('V-T-PR01: fluent student explaining borrow skips micro tier', () => {
    const msg =
      'tidak boleh tolak kerana 2 lebih kecil dari 8. Hendaklah dipinjam dari rumah puluh maka 12 - 8 = 4';
    expect(tutorInferArithmeticProficiency(msg)).toBe('fluent');
    expect(tutorThreadWarrantsCompactArithmetic(msg, [])).toBe(true);
  });

  it('V-T-PR02: numeric-only answers infer compact after repeated digits', () => {
    expect(tutorInferArithmeticProficiency('5', '12', '6')).toBe('compact');
  });

  it('V-T-PR03: multi-step library problem triggers auto-closure on final answer', () => {
    const libraryQ =
      'Perpustakaan 1,250 buku. Beli 375. Lupus 128. Berapa jumlah sekarang?';
    expect(
      tutorTurnWarrantsAutoClosingSummary(
        '1497 buku',
        [libraryQ],
        ['Berapa 1625 − 128?\n→ ______'],
      ),
    ).toBe(true);
  });
});

describe('tutor algebra micro correction — factor pair attempt', () => {
  const quadThread = ['f(x) = x² − 5x + 6, cari x apabila f(x) = 0'];
  const studentPair = 'Maksudnya 2x3=6 dan -1+(-4)=5';

  const verboseLeak =
    'Saya faham, Pelajar.\n\n'
    + '✅ Bahagian pertama: 2 × 3 = 6 → Betul.\n\n'
    + 'x² − 5x + 6 = (x − 2)(x − 3)\n\n'
    + '→ x = 2 atau x = 3\n\n'
    + 'Saya faham, Pelajar.\n\n'
    + '✅ Bahagian pertama: 2 × 3 = 6 → Betul.';

  it('V-T-A01: detects student factor-pair attempt (not tak faham)', () => {
    expect(tutorTurnNeedsFactorPairMicroLaw(studentPair, quadThread, [])).toBe(true);
    expect(tutorStudentGaveFactorPairAttempt('Saya tak faham')).toBe(false);
  });

  it('V-T-A02: guard replaces verbose leak with compact micro-teach', () => {
    const out = enforceTutorAlgebraMicroCorrectionGuard(
      verboseLeak,
      studentPair,
      quadThread,
      [],
    );
    expect(out).not.toMatch(/\(x\s*[−-]\s*2\)\s*\(x\s*[−-]\s*3\)/);
    expect(out).not.toMatch(/x\s*=\s*2/);
    expect(out).toMatch(/→ ______/);
    expect(out).toMatch(/darab.*6.*tambah.*−5/i);
  });

  it('V-T-A03: pipeline no longer skips zero-answer when model leaked factor form', () => {
    const out = enforceTutorReplyGuards(
      verboseLeak,
      malayProfile,
      studentPair,
      'Pelajar',
      quadThread,
      [],
    );
    expect(out).not.toMatch(/\(x\s*[−-]\s*2\)\s*\(x\s*[−-]\s*3\)/);
  });
});

describe('tutor guli sequential — spurious 0+0 recovery + concise closure', () => {
  const guliQ =
    'Aiman mempunyai 1934 biji guli. Dia memberikan 366 biji guli kepada Kasim. '
    + 'Keesokan harinya Pak Abu memberikan 455 biji guli yang baru dibeli kepada Aiman. '
    + 'Berapakah bilangan guli yang dimiliki Aiman?';

  const studentFinal =
    'di rumah ribu sepatutnya 1+1=2, maka jawapan akhir adalah 2023 biji guli';

  const studentRumus = 'Tidak perlu, mohon buatkan rumus keseluruhan kaedah penyelesaian.';

  const brokenAckReply =
    'Terima kasih — anda betul.\n\n'
    + 'Digit Puluh: **6 + 5 + 1 = 12** → tulis **2** di Puluh.\n\n'
    + 'Mari betulkan langkah **Puluh** (digit lajur Puluh — bukan lajur lain):\n\n'
    + 'Digit **Puluh**: **0** + **0**\n\n'
    + 'Berapa **0 + 0** di tempat **Puluh**?\n'
    + '→ ______\n\n'
    + 'Cikgu tidak siapkan kiraan penuh. Lihat kotak nombor, satu langkah Sa sahaja.';

  const verboseRumusReply =
    'Terima kasih, Pelajar, permintaan anda jelas.\n\n'
    + 'Langkah 1: Tulis operasi penuh...\n'
    + '1,934 − 366 + 455\n\n'
    + 'Mari betulkan langkah **Sa** (digit lajur Sa — bukan lajur lain):\n'
    + 'Digit **Sa**: **8** + **5**\n'
    + '→ ______';

  it('V-T-GULI01: strips spurious 0+0 Mari betulkan after teacher ack', () => {
    const out = enforceTutorReplyGuards(
      brokenAckReply,
      malayProfile,
      '6 + 5 + 1 = 12. Nilai 2 ditulis pada rumah puluh',
      'Pelajar',
      ['Berapa 8 + 5?', '1 568\n+ 455'],
      [guliQ],
    );
    expect(out).not.toMatch(/0\s*\+\s*0/);
    expect(out).not.toMatch(/Mari betulkan langkah/);
    expect(out).not.toMatch(/tidak siapkan kiraan penuh/);
    expect(out).not.toMatch(/→ ______/);
  });

  it('V-T-GULI02: auto concise closure when student states final answer', () => {
    const out = enforceTutorReplyGuards(
      'Betul!\n\nAdakah pelajar mahu saya terangkan makna setiap langkah?',
      malayProfile,
      studentFinal,
      'Pelajar',
      ['1 568\n+ 455', 'Berapa 8 + 5?'],
      [guliQ],
    );
    expect(out).toMatch(/Jawapan akhir.*2\s*023|2\s*023.*biji/i);
    expect(out).toMatch(/1\s*934[\s\S]*366|1934[\s\S]*366/);
    expect(out).toMatch(/1\s*568[\s\S]*455|1568[\s\S]*455/);
    expect(out).not.toMatch(/→ ______/);
    expect(out).not.toMatch(/Mari betulkan langkah/);
  });

  it('V-T-GULI03: replaces verbose rumus with compact working when student asks', () => {
    const out = enforceTutorReplyGuards(
      verboseRumusReply,
      malayProfile,
      studentRumus,
      'Pelajar',
      ['jawapan akhir 2023'],
      [guliQ, studentFinal],
    );
    expect(out).toMatch(/Kaedah penyelesaian/);
    expect(out).toMatch(/Jawapan akhir/);
    expect(out.length).toBeLessThan(900);
    expect(out).not.toMatch(/Mari betulkan langkah.*0\s*\+\s*0/);
  });

  it('V-T-GULI04: detects final answer phrase for auto-closure turn', () => {
    expect(
      tutorTurnWarrantsAutoClosingSummary(
        studentFinal,
        [guliQ],
        ['1 568 + 455'],
      ),
    ).toBe(true);
  });
});

describe('tutor Penny ping pong — column phase + no cross-problem bleed', () => {
  const pennyQ =
    'Penny mempunyai 560 biji bola pingpong. Ibunya membeli 1001 biji bola pingpong '
    + 'dan diserahkan kepada Penny. Keesokannya Penny memberi Ah Moi 478 biji bola pingpong. '
    + 'Berapakah biji bola pingpong yang ada pada Penny sekarang?';

  const guliQ =
    'Aiman mempunyai 1934 biji guli. Dia memberikan 366 biji guli kepada Kasim. '
    + 'Keesokan harinya Pak Abu memberikan 455 biji guli yang baru dibeli kepada Aiman.';

  const assistantSteps = [
    'Digit **Sa**: **0 + 1**\nBerapa **0 + 1** di tempat **Sa**?\n→ ______',
    'Digit **Puluh**: **6 + 0 = ?**\n→ ______',
    'Digit **Ratus**: **5 + 0 = ?**\n→ ______',
    'Langkah seterusnya: tempat **Ribu**: **0 + 1 = ?**\n→ ______',
  ];

  const studentSteps = ['0+1 = 1', '6 + 0 = 6', '5 + 0 = 5', '0 + 1 = 1'];

  const loopCorrection =
    'Cikgu Adam, saya rasa ada kesilapan dalam penerangan. Saya lihat cikgu Adam '
    + 'kembali mengulang semula proses 560 + 1001. Seharusnya selepas 0 + 1 (rumah ribu) '
    + 'jawapan tambah 560 + 1001 = 1561. Langkah seterusnya 1561 - 478.';

  const regressionReply =
    'Terima kasih, Pelajar, jawapan anda betul.\n\n'
    + '```\n   0 560\n+ 1 001\n-------\n         1\n```\n\n'
    + '→ 1 ditulis di bawah lajur Sa\n\n'
    + 'Langkah seterusnya:\n→ Digit **Puluh**: **6 + 0 = ?**\n\n'
    + '→ ______\n\n'
    + 'Cikgu tidak siapkan kiraan penuh. Lihat kotak nombor, satu langkah Sa sahaja.';

  it('V-T-PENNY01: parses add-then-subtract word problem', () => {
    const p = parseAddThenSubtractProblem(pennyQ);
    expect(p).not.toBeNull();
    expect(p!.start).toBe(560);
    expect(p!.add).toBe(1001);
    expect(p!.subtract).toBe(478);
  });

  it('V-T-PENNY02: infers furthest column from paired micro-teaching turns', () => {
    expect(tutorInferFurthestColumnInThread(studentSteps, assistantSteps)).toBe('ribu');
    expect(tutorReplyRegressesColumnPhase(regressionReply, 'ribu')).toBe(true);
  });

  it('V-T-PENNY03: phase guard advances to subtraction after addition complete', () => {
    const out = enforceTutorPlaceValuePhaseGuard(
      regressionReply,
      studentSteps[3]!,
      [pennyQ, ...studentSteps.slice(0, 3)],
      assistantSteps,
    );
    expect(out).toMatch(/1\s*561|1561/);
    expect(out).toMatch(/478/);
    expect(out).toMatch(/1\s*−\s*8|1 - 8|pinjam/i);
    expect(out).not.toMatch(/Digit\s+\*\*Sa\*\*:\s*\*\*0\s*\+\s*1\*\*/i);
    expect(out).not.toMatch(/tidak siapkan kiraan penuh/i);
  });

  it('V-T-PENNY04: loop correction does not trigger guli auto-closure', () => {
    expect(tutorStudentFlagsTeachingLoopError(loopCorrection)).toBe(true);
    expect(studentStatesFinalArithmeticAnswer(loopCorrection)).toBe(false);
    expect(tutorTurnWarrantsAutoClosingSummary(loopCorrection, [pennyQ, guliQ], assistantSteps)).toBe(false);

    const wrongAimanClosure =
      'Terima kasih, ringkasan padat:\n**Operasi:** 934 − 366 + 455\n**Jawapan akhir:** 1 023 kotak.';
    const out = enforceTutorReplyGuards(
      wrongAimanClosure,
      malayProfile,
      loopCorrection,
      'Pelajar',
      assistantSteps,
      [pennyQ, guliQ],
    );
    expect(out).not.toMatch(/934[\s\S]*366|1\s*023\s+kotak/i);
    expect(out).toMatch(/1561|1\s*561/);
    expect(out).toMatch(/478/);
  });

  it('V-T-PENNY05: addition phase complete after ribu answered', () => {
    expect(
      tutorAdditionPhaseComplete([560, 1001], studentSteps, assistantSteps, studentSteps[3]!),
    ).toBe(true);
  });
});
