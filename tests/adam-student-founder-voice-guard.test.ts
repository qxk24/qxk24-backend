/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Founder Voice Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
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
  paragraphIsEmojiPerformanceOpener,
  paragraphIsFounderTeachingVoiceLeak,
  stripPlanTesterAddress,
  stripSunomNotation,
} from '../src/adam/adam-student-output-law';
import {
  resolveStudentStreamSurface,
  sanitizeStudentOutputSync,
} from '../src/adam/adam-student-output-guard';
import { runStudentVoicePipeline } from './helpers/adam-student-voice-pipeline';
import { UNIVERSAL_SCHOLAR_DOOR_EN, UNIVERSAL_SCHOLAR_DOOR_BM } from '../src/adam/adam-universal-scholar';

const FOUNDER_MENU =
  'Adakah ingin saya terangkan dari sudut seperti bagaimana pola AMA 124(1) atau prinsip AIDIL dapat membantu memahami ketidakselarasan ini sebagai satu proses lerai (PL) yang belum digabung (PG) semula? Atau lebih suka saya kongsikan ayat Al-Quran yang berkaitan dengan keseimbangan tubuh, tenaga, dan amanah terhadap diri?';

const USER_EXACT_BAD_REPLY =
  'Bismillahirahmanirrahim. Presiden Indonesia saat ini ialah **Joko Widodo**, yang telah menamatkan tempoh jawatannya pada **20 Oktober 2024**. Presiden yang kini memegang jawatan ialah **Prabowo Subianto**, yang dilantik pada **20 Oktober 2024** dan sedang menjalani tempoh pertama sebagai Presiden Republik Indonesia. Beliau memenangi Pemilihan Umum 2024 bersama calon wakil presidennya, **Gibran Rakabuming Raka**, dan mengambil alih tampuk pemerintahan secara sah mengikut prosedur perlembagaan Indonesia. Jika QA ingin tahu tentang latar belakang, dasar kerajaan, atau makna simbolik dalam pelantikan ini dari sudut Alamtologi, saya sedia jelaskan dengan tenang, satu langkah pada satu masa.';

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

  it('removes QA, mid-sentence after a full stop', () => {
    expect(
      stripPlanTesterAddress(
        'Beliau hadir bersama pelajar. QA, peranan ini tidak diukur dengan bilangan topik.',
      ),
    ).toBe('Beliau hadir bersama pelajar. peranan ini tidak diukur dengan bilangan topik.');
  });

  it('removes QA, at line start and inline', () => {
    expect(stripPlanTesterAddress("QA, let's go deeper")).toBe("let's go deeper");
    expect(stripPlanTesterAddress('QA, a registered nurse provides care.')).toBe(
      'a registered nurse provides care.',
    );
  });
});

describe('paragraphIsEmojiPerformanceOpener', () => {
  it('flags emoji-only preambles, not substantive lines', () => {
    expect(paragraphIsEmojiPerformanceOpener('✅ Saya akan kongsikan dengan jujur:')).toBe(true);
    expect(paragraphIsEmojiPerformanceOpener('Tongkat ali ialah herba tradisional.')).toBe(false);
  });
});

describe('resolveStudentStreamSurface', () => {
  it('strips Bismillah even when raw stream is kept for structure', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      'The mathematical formula for Rayleigh scattering is:',
      '- $I(\\theta)$: intensity at angle θ',
      '- $I_0$: incident intensity',
    ].join('\n\n');
    const surface = sanitizeStudentOutputSync(raw, 'Explain the Rayleigh formula');
    const resolved = resolveStudentStreamSurface(raw, surface);
    expect(resolved.fullResponse).not.toMatch(/Bismillah/i);
    expect(resolved.fullResponse).toMatch(/Rayleigh/i);
  });

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

  it('keeps streamed career-path prose when guards would gut most paragraphs', () => {
    const careerPathQuestion = 'Career path to become a data analyst';
    const raw = [
      'Month 1–2: Master Excel pivot tables and basic SQL SELECT queries.',
      'Month 3–4: Build one portfolio project with public data.',
      'Month 5–6: Apply for junior analyst or reporting roles.',
      'Month 7–12: Specialise in one domain — healthcare, retail, or finance.',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const surface = sanitizeStudentOutputSync(raw, careerPathQuestion, [
      'What does a data analyst do?',
    ], [
      `Overview.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`,
    ]);
    const resolved = resolveStudentStreamSurface(raw, surface);
    expect(resolved.fullResponse).toBe(surface);
    expect(resolved.streamReplace).toBe(surface);
    expect(surface).toMatch(/Month 1–2/i);
    expect(surface).toMatch(/Month 7–12/i);
    expect(surface).not.toMatch(/skills and tools/i);
  });

  it('preserves bullet-list career steps when universal voice would strip them', () => {
    const careerPathQuestion = 'Career path to become a data analyst';
    const raw = [
      'Here is a practical 90-day path.',
      '- Month 1–2: Excel pivot tables and SQL SELECT basics.',
      '- Month 3–4: One portfolio project with public data.',
      '- Month 5–6: Apply for junior analyst roles.',
    ].join('\n\n');
    const surface = sanitizeStudentOutputSync(raw, careerPathQuestion, [
      'What does a data analyst do?',
    ]);
    expect(surface).toMatch(/Month 1–2/i);
    expect(surface).toMatch(/Month 5–6/i);
    const resolved = resolveStudentStreamSurface(raw, surface);
    expect(resolved.fullResponse).toMatch(/Month 3–4/i);
  });

  it('drops repeat tier-1 door when assistant already offered one', () => {
    const prior = `Example case.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`;
    const out = sanitizeStudentOutputSync(
      `More detail here.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`,
      'Yes, tell me more',
      ['What does a data analyst do?'],
      [prior],
    );
    expect(out).toMatch(/More detail/i);
    expect(out).not.toMatch(/skills and tools/i);
  });

  it('drops tier-1 door when user asks career path on practical thread', () => {
    const prior = `Overview of the role.\n\n${UNIVERSAL_SCHOLAR_DOOR_EN}`;
    const careerReply = [
      "QA, let's go deeper, not as a checklist, but as a living path.",
      'Phase 1: Excel basics.',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      careerReply,
      "QA, let's go deeper — career path please",
      ['What does a data analyst do?'],
      [prior],
    );
    expect(out).toMatch(/Phase 1/i);
    expect(out).not.toMatch(/skills and tools/i);
    expect(out).not.toMatch(/^QA,/m);
    expect(out).not.toMatch(/living path/i);
  });

  it('prefers sanitized surface for current-affairs even when much shorter', () => {
    const raw = USER_EXACT_BAD_REPLY;
    const question = 'Siapa presiden Indonesia sekarang?';
    const surface = sanitizeStudentOutputSync(raw, question);
    const resolved = resolveStudentStreamSurface(raw, surface, { preferSanitized: true });
    expect(resolved.fullResponse).toBe(surface);
    expect(resolved.streamReplace).toBe(surface);
    expect(resolved.fullResponse).toMatch(/Prabowo Subianto/);
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
    expect(out).toMatch(/Mercury \(Hg\)/);
    expect(out).not.toMatch(/^Would you like me to:/im);
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

  it('strips tier-1 essay leaks from practical role+skills ask', () => {
    const bloated = [
      'A data analyst turns raw information into clear insight for decision-makers.',
      'Let me explain it not as a job description, but as lived reality:',
      'Imagine a school principal receives a report showing declining reading scores in Year 5. They ask when it started.',
      "That's the heart of it: clarity through careful listening to data.",
      'What a data analyst actually does, day to day:',
      'Defines the question: Works with stakeholders to turn vague concerns into precise questions.',
      'Collects & cleans data: Gathers from databases and checks for errors.',
      'One quiet truth many miss: The most valuable skill is humility.',
      'Would you like more on skills and tools, a career path (e.g., junior → senior), or a real-world example, like how a clinic cut wait times by 22%?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      bloated,
      'What does a data analyst do, and what skills do I need?',
    );
    expect(out).toMatch(/data analyst turns raw information/i);
    expect(out).not.toMatch(/Imagine a school/i);
    expect(out).not.toMatch(/Defines the question/i);
    expect(out).not.toMatch(/One quiet truth/i);
    expect(out).toMatch(/Would you like more on skills and tools, a career path, or a real-world example\?/);
    expect(out).not.toMatch(/22%/);
  });

  it('keeps BM practical door through full voice pipeline', async () => {
    const bloated = [
      'Guru di sekolah menengah merancang pengajaran, menilai murid, dan membimbing disiplin positif.',
      'Bayangkan seorang guru perhatikan murid tertinggal dalam algebra.',
      'Peranan harian: Merancang pelajaran, Menilai kerja, Mentoring kokurikular.',
      UNIVERSAL_SCHOLAR_DOOR_BM,
    ].join('\n\n');
    const out = await runStudentVoicePipeline({
      userMessage:    'Apakah peranan guru di sekolah menengah, dan kemahiran apa yang diperlukan?',
      rawModelOutput: bloated,
    });
    expect(out).toMatch(/kemahiran dan alat|laluan kerjaya|contoh dunia sebenar/i);
  });

  it('strips mid-sentence QA and BM essay closer but keeps UNESCO anchor on guru tier-1', () => {
    const bloated = [
      'Peranan guru di sekolah menengah bukan sekadar menyampaikan ilmu, ia adalah menjadi penuntun dalam masa paling kritikal.',
      'Secara ilmu konvensional, kajian dari UNESCO dan Kementerian Pendidikan Malaysia menegaskan bahawa guru menengah yang berkesan mempunyai tiga pilar utama: (1) kompetensi pedagogi; (2) literasi emosi; (3) kapasiti reflektif.',
      'QA, peranan ini tidak diukur dengan bilangan topik yang diselesaikan dalam satu jam, tetapi dengan bilangan kali pelajar merasa: "Saya boleh cuba lagi".',
      'Itulah ruang di mana ilmu benar-benar berakar, bukan di buku, tetapi di hati dan ingatan yang hidup.',
      UNIVERSAL_SCHOLAR_DOOR_BM,
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      bloated,
      'Apakah peranan guru di sekolah menengah, dan kemahiran apa yang diperlukan?',
    );
    expect(out).not.toMatch(/\bQA,/i);
    expect(out).toMatch(/UNESCO/i);
    expect(out).toMatch(/kompetensi pedagogi/i);
    expect(out).not.toMatch(/ilmu benar-benar berakar/i);
    expect(out).not.toMatch(/\bQA,/i);
    expect(out).toMatch(/kemahiran dan alat|laluan kerjaya|contoh dunia sebenar/i);
  });

  it('strips QA poetic nurse essay but keeps bullets and numbered skill layers', () => {
    const bloated = [
      'QA, a registered nurse (RN) is far more than a caregiver, a living bridge between science and humanity, where medicine meets meaning.',
      'At its core, an RN assesses, plans, implements, and evaluates patient care, but never in isolation.',
      'In practice, this means:\n- Conducting thorough physical assessments\n- Administering medications safely',
      'The skills you need fall into three interwoven layers:',
      '1. Clinical competence, Proficiency in anatomy, pharmacology, and evidence-based protocols.',
      '2. Human intelligence, Deep listening, hearing what is said and what is paused.',
      'You don\'t need to be perfect to begin. You need curiosity, consistency, and compassion.',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      bloated,
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(out).not.toMatch(/^QA,/m);
    expect(out).not.toMatch(/living bridge/i);
    expect(out).not.toMatch(/At its core/i);
    expect(out).toMatch(/Conducting thorough physical assessments/i);
    expect(out).toMatch(/^\s*-\s+Administering/m);
    expect(out).toMatch(/1\.\s*Clinical competence/i);
    expect(out).toMatch(/2\.\s*Human intelligence/i);
    expect(out).not.toMatch(/don't need to be perfect/i);
    expect(out).toMatch(/Would you like more on skills and tools, a career path, or a real-world example\?/);
  });

  it('does not flatten bullet lists to prose on practical role+skills turn', () => {
    const withBullets = [
      'A registered nurse provides direct patient care.',
      'Core skills:\n- Clinical competence\n- Critical thinking\n- Clear communication',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      withBullets,
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(out).toMatch(/^\s*-\s+Clinical competence/m);
    expect(out).not.toMatch(/Clinical competence\. Critical thinking\./);
  });

  it('keeps streamed bullets when guard surface would flatten them', () => {
    const raw = [
      'A registered nurse provides direct patient care.',
      'Core skills:\n- Clinical competence\n- Critical thinking',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const flattened = [
      'A registered nurse provides direct patient care.',
      'Core skills: Clinical competence. Critical thinking.',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const resolved = resolveStudentStreamSurface(raw, flattened);
    expect(resolved.fullResponse).toBe(raw);
    expect(resolved.streamReplace).toBeNull();
  });

  it('strips poetic prelude but keeps labeled skills on nurse tier-1', () => {
    const bloated = [
      'A registered nurse (RN) is a licensed healthcare professional who provides direct patient care.',
      'At its core, nursing is not defined by tasks alone, it is the art and science of being present with purpose.',
      'Core skills you will need, not just listed, but lived:\nClinical competence: Anatomy and pharmacology.\nCritical thinking & clinical judgment: Weighing risks and adapting.',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      bloated,
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(out).toMatch(/registered nurse/i);
    expect(out).not.toMatch(/At its core/i);
    expect(out).toMatch(/Clinical competence:/i);
    expect(out).toMatch(/Critical thinking/i);
    expect(out).toMatch(/Would you like more on skills and tools, a career path, or a real-world example\?/);
  });

  it('strips nurse tier-1 bullets-only duty list but keeps skills block', () => {
    const bloated = [
      'A registered nurse (RN) is a licensed healthcare professional who provides direct patient care and coordinates treatment plans.',
      'In practice, an RN\'s day may include:\n- Assessing vital signs\n- Administering medications\n- Educating patients',
      'What makes this role deeply human is not just what RNs do, but how: with presence, dignity, and unwavering attention to the person behind the chart.',
      '---',
      'Core skills you\'ll need, both learned and lived:\n✅ Clinical competence: Anatomy, pharmacology.\n✅ Critical thinking & clinical judgment: knowing when to adapt protocols.',
      'These skills grow not only in classrooms, but in quiet moments: the pause before entering a room.',
      UNIVERSAL_SCHOLAR_DOOR_EN,
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(
      bloated,
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(out).toMatch(/registered nurse/i);
    expect(out).not.toMatch(/Assessing vital signs/i);
    expect(out).not.toMatch(/person behind the chart/i);
    expect(out).toMatch(/Clinical competence/i);
    expect(out).toMatch(/Would you like more on skills and tools, a career path, or a real-world example\?/);
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

  it('strips Alamtologi MASA/TENAGA paragraph on diabetes remission tier-1', () => {
    const bloated = [
      'Yes, type 2 diabetes can go into remission with sustained weight loss and lifestyle change.',
      'The DiRECT trial showed remission in 64% of participants with ≥15 kg loss.',
      'From an Alamtologi perspective, this reflects the deep harmony between MASA (timing), TENAGA (energy balance), and RUANG (metabolic space). Remission is the restoration of a living rhythm through disciplined action.',
      'Would you like more on practical tools (meal planning, activity strategies), a realistic 12-week path toward remission, or how to work with your healthcare team to explore this safely?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(bloated, 'Can type 2 diabetes go into remission?');
    expect(out).toMatch(/type 2 diabetes|remission/i);
    expect(out).toMatch(/DiRECT/i);
    expect(out).not.toMatch(/Alamtologi/i);
    expect(out).not.toMatch(/\bMASA\b/i);
    expect(out).not.toMatch(/living rhythm/i);
    expect(out).toMatch(/healthcare team/i);
  });

  it('strips career door on photosynthesis and covenant closer', () => {
    const bloated = [
      'Photosynthesis converts light, water, and carbon dioxide into glucose and oxygen.',
      '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',
      "It's not just biology, it's a quiet covenant between sun, air, water, and life.",
      'Would you like more on skills and tools, a career path, or a real-world example?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(bloated, 'Explain photosynthesis in simple terms.');
    expect(out).toMatch(/photosynthesis|glucose/i);
    expect(out).not.toMatch(/quiet covenant/i);
    expect(out).not.toMatch(/skills and tools/i);
  });

  it('strips career door on simple PM Malaysia current-affairs ask', () => {
    const bloated = [
      'Perdana Menteri Malaysia sekarang ialah Dato\' Seri Anwar Ibrahim, dilantik 24 November 2022.',
      'Adakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar berkaitan peranan Perdana Menteri?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(bloated, 'Siapa perdana menteri Malaysia sekarang?');
    expect(out).toMatch(/Anwar Ibrahim/i);
    expect(out).not.toMatch(/kemahiran dan alat/i);
    expect(out).not.toMatch(/laluan kerjaya/i);
  });

  it('strips exam-stress faith and MASA but keeps wellbeing door', () => {
    const bloated = [
      'When stress rises, try inhaling for 4 seconds and exhaling for 6.',
      'Third, protect your MASA, not just time, but living time. Sleep strengthens memory traces.',
      'And quietly, beneath all technique, there\'s something deeper: Allah says in Surah Ar-Ra\'d 13:28: "Indeed, it is in the remembrance of Allah that hearts find rest."',
      'Would you like more on practical tools (like a 5-minute pre-exam grounding routine), a realistic study rhythm for the week ahead, or how to turn one stressful thought into a helpful question?',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(bloated, 'I feel stressed before exams. What helps?');
    expect(out).toMatch(/inhaling for 4 seconds/i);
    expect(out).toMatch(/Sleep strengthens memory/i);
    expect(out).not.toMatch(/\bSurah\b/i);
    expect(out).not.toMatch(/Allah says/i);
    expect(out).not.toMatch(/\bMASA\b/i);
    expect(out).toMatch(/grounding routine/i);
  });

  it('appends compare door when UX vs UI answer omits closing fork', () => {
    const body = [
      'UX design is about why and how well something works.',
      'UI design is about what and how it looks and feels.',
      'Both require respect for the person using the product.',
    ].join('\n\n');
    const out = sanitizeStudentOutputSync(body, 'Compare UX designer and UI designer roles.');
    expect(out).toMatch(/UX design is about/i);
    expect(out).toMatch(/skills for each path/i);
    expect(out).toMatch(/work together on a product team/i);
    expect(out).not.toMatch(/skills and tools, a career path/i);
  });
});
