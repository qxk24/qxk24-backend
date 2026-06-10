/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  paragraphIsEmojiPerformanceOpener,
  paragraphIsFounderTeachingVoiceLeak,
  stripPlanTesterAddress,
  stripSunomNotation,
} from '../src/adam/adam-student-output-law';
import {
  resolveStudentStreamSurface,
  sanitizeStudentOutputSync,
} from '../src/adam/adam-student-output-guard';

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

const BERAS_FRAMEWORK_VOICE =
  '. secara zahir (ilmu konvensional): \n'
  + 'Beras ialah biji pokok padi (Oryza sativa), tanaman utama di Asia Tenggara. '
  + 'Ia sumber karbohidrat kompleks, serat, vitamin B1, dan mineral seperti magnesium.\n\n'
  + '. secara syar\'i dan maknawi: \n'
  + 'Dalam hadis sahih, Rasulullah ﷺ bersabda: "Makanlah beras…" (HR. Ibnu Majah, sanad hasan)\n\n'
  + 'Dan dalam AMA, beras juga adalah contoh nyata Leraian 2: \n'
  + '- unsur aktif: padi yang tumbuh, \n'
  + '- unsur pasif: tanah yang menampung. \n'
  + 'Tanpa keduanya, tiada izwa.\n\n'
  + 'Ada aspek mana tentang beras yang ingin anda gali lebih dalam? \n'
  + 'Atau mungkin, ada satu kenangan yang muncul? Saya di sini. duduk, mendengar, dan bersama.';

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

describe('resolveStudentStreamSurface', () => {
  it('emits replace when founder-menu leaks are stripped but substance remains', () => {
    const good =
      'Beras ialah biji padi (Oryza sativa), sumber karbohidrat penting di Asia Tenggara. '
      + 'Ia menjadi makanan ruji berbilion manusia dan membekalkan tenaga harian melalui karbohidrat kompleks, serat, dan vitamin B.';
    const raw = `${good}\n\n${FOUNDER_MENU}`;
    const surface = sanitizeStudentOutputSync(raw, 'Terangkan beras.');
    const resolved = resolveStudentStreamSurface(raw, surface);
    expect(surface).toMatch(/Oryza sativa/i);
    expect(surface).not.toMatch(/AMA\s+124/i);
    expect(resolved.fullResponse).toBe(surface);
  });

  it('emits replace when guards keep most substance', () => {
    const raw =
      'Beras ialah biji padi. Ia kaya karbohidrat.\n\n'
      + 'Adakah ingin saya terangkan pola AMA 124?';
    const surface = sanitizeStudentOutputSync(raw, 'Terangkan beras.');
    const resolved = resolveStudentStreamSurface(raw, surface);
    expect(resolved.streamReplace).toBe(surface);
    expect(resolved.fullResponse).toBe(surface);
  });
});

describe('sanitizeStudentOutputSync', () => {
  it('rewrites dual-lane labels and strips coaching close from beras reply', () => {
    const out = sanitizeStudentOutputSync(
      BERAS_FRAMEWORK_VOICE,
      'Boleh terangkan tentang beras?',
    );
    expect(out).toMatch(/Oryza sativa/i);
    expect(out).toMatch(/karbohidrat/i);
    expect(out).not.toMatch(/Secara\s+zahir/i);
    expect(out).not.toMatch(/Secara\s+syar/i);
    expect(out).not.toMatch(/Leraian/i);
    expect(out).not.toMatch(/gali lebih dalam/i);
    expect(out).not.toMatch(/duduk,\s*mendengar/i);
  });

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

  it('strips English coaching menus and polishes numbered outline', () => {
    const englishCoaching =
      '. thank you for this important question. It opens a doorway not just to science.\n\n'
      + 'Let me answer clearly. grounded in verified science first.\n\n'
      + 'Common Minerals That Can Harm the Human Body\n\n'
      + '3. Mercury (Hg)\n'
      + '- Why harmful: Targets the nervous system.\n\n'
      + 'A Deeper Truth. From Science and\n\n'
      + 'Lead does not poison because it is evil.\n\n'
      + 'Would you like me to:\n'
      + 'Focus on one mineral in more depth?\n\n'
      + "I'm here. not to lecture, but to walk with you, step by thoughtful step.";
    const out = sanitizeStudentOutputSync(
      englishCoaching,
      'What minerals harm the human body?',
    );
    expect(out.charAt(0)).toMatch(/[A-Z]/);
    expect(out).toMatch(/\*\*Mercury \(Hg\)\*\*/);
    expect(out).not.toMatch(/Would you like me to/i);
    expect(out).not.toMatch(/walk with you/i);
    expect(out).toMatch(/Mercury/i);
  });

  it('strips tell-me-more coaching close and keeps substantive section', () => {
    const tellMeMore =
      'Thank you for saying "Tell me more about it."\n\n'
      + 'That simple phrase carries weight. It\'s not just curiosity.\n\n'
      + '**The Biological Threshold. Where Benefit Ends and Harm Begins**\n'
      + 'Minerals are dose-dependent. Iron is vital for haemoglobin.\n'
      + '- Example: 200 mg/kg in a child can cause shock.\n\n'
      + 'Just say the word. And we\'ll walk there together.';
    const out = sanitizeStudentOutputSync(tellMeMore, 'Tell me more about it');
    expect(out).not.toMatch(/Just say the word/i);
    expect(out).toMatch(/Biological Threshold/i);
    expect(out).toMatch(/haemoglobin/i);
    expect(out).toMatch(/200 mg\/kg/i);
  });

  it('preserves long warm natural tutor prose without framework leaks', () => {
    const warmNatural =
      'Soalan yang baik — mari kita lihat dengan tenang.\n\n'
      + 'Dari sudut ilmu konvensional, mekanisme utamanya boleh dijelaskan dalam perenggan yang mengalir, '
      + 'dengan fakta yang boleh disandarkan, bukan senarai ringkas.\n\n'
      + 'Dalam kehidupan harian, perkara ini sering menyentuh orang biasa — bukan teori di atas kertas sahaja.\n\n'
      + 'Jika ada satu aspek yang paling relevan bagi anda, itu boleh menjadi titik fokus seterusnya.';
    const out = sanitizeStudentOutputSync(warmNatural, 'Boleh terangkan bagaimana ini berfungsi?');
    expect(out).toMatch(/mekanisme/i);
    expect(out).toMatch(/kehidupan harian/i);
    expect(out.split(/\n\n+/).length).toBeGreaterThanOrEqual(3);
  });

  it('strips coaching close on diabetes question — keeps medical substance', () => {
    const out = sanitizeStudentOutputSync(
      DIABETES_COACHING_VOICE,
      'Bolehkah diabetes jenis 1 atau 2 disembuhkan sepenuhnya?',
    );
    expect(out).toMatch(/diabetes jenis 1/i);
    expect(out).toMatch(/remisi/i);
    expect(out).not.toMatch(/Saya di sini untuk membantu anda faham/i);
    expect(out).not.toMatch(/berdiri teguh dengan ilmu/i);
  });
});
