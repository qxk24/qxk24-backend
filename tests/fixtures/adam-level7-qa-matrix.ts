/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Level-7 QA Matrix (7 categories × Tahap 1–7)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Tahap Akal 1–7 (Tangkap → Cipta) × 7 question categories.
 * Used by adam-level7-qa-matrix.test.ts and manual tester scripts.
 */

import type { TahapAkal } from '../../src/adam/adam.types';
import { TAHAP_AKAL_LABELS } from '../../src/adam/adam.types';

export type AdamQaCategoryId =
  | 'light_chat'
  | 'factual_en'
  | 'factual_bm'
  | 'current_affairs'
  | 'practical_advisory'
  | 'life_emotion'
  | 'tier_progression';

export interface AdamQaMatrixCell {
  category:     AdamQaCategoryId;
  categoryLabel: string;
  level:         TahapAkal;
  levelLabel:    string;
  /** User message for this turn (or final turn in tier_progression). */
  userMessage:   string;
  /** Prior user turns — tier_progression only. */
  priorUserMessages?: string[];
  /** Prior ADAM replies — tier_progression only. */
  priorAssistantMessages?: string[];
  /** Simulated raw model output for pipeline tests. */
  fixtureOutput: string;
  /** Expected knowledge tier when prior context supplied. */
  expectedTier?: 1 | 2 | 3;
  /** Turn must classify as light chat. */
  expectLight?: boolean;
  /** Turn must classify as consumer plain (factual or practical). */
  expectConsumerPlain?: boolean;
  /** Turn must classify as teaching depth. */
  expectTeaching?: boolean;
  /** Turn must classify as current affairs. */
  expectCurrentAffairs?: boolean;
  /** Turn must be substantive (not light chat). */
  expectSubstantive?: boolean;
  /** Prompt must include BM layout block. */
  expectMalayLayout?: boolean;
}

export const ADAM_QA_CATEGORY_LABELS: Record<AdamQaCategoryId, string> = {
  light_chat:         'Light chat / salam',
  factual_en:         'Simple factual (English)',
  factual_bm:         'Simple factual (Bahasa Melayu)',
  current_affairs:    'Current affairs / office-holder',
  practical_advisory: 'Practical advisory (role / career)',
  life_emotion:       'Life / emotion',
  tier_progression:    'Tier 1 → 2 → 3 (Universal Scholar doors)',
};

function cell(
  partial: Omit<AdamQaMatrixCell, 'levelLabel' | 'categoryLabel'> & {
    category: AdamQaCategoryId;
    level: TahapAkal;
  },
): AdamQaMatrixCell {
  return {
    ...partial,
    categoryLabel: ADAM_QA_CATEGORY_LABELS[partial.category],
    levelLabel:    TAHAP_AKAL_LABELS[partial.level],
  };
}

/** 7 categories × 7 Tahap Akal levels = 49 test cases. */
export const ADAM_LEVEL7_QA_MATRIX: AdamQaMatrixCell[] = [
  // ── C1 Light chat ───────────────────────────────────────────
  cell({
    category: 'light_chat', level: 1,
    userMessage: 'Hi',
    fixtureOutput: 'Hello. Good to see you. What is on your mind today?',
    expectLight: true,
  }),
  cell({
    category: 'light_chat', level: 2,
    userMessage: 'Salam',
    fixtureOutput: 'Waalaikumussalam. How can I help you today?',
    expectLight: true,
  }),
  cell({
    category: 'light_chat', level: 3,
    userMessage: 'Thank you for the answer earlier',
    fixtureOutput: 'You are welcome. Ask anytime you need clarity.',
    expectLight: true,
  }),
  cell({
    category: 'light_chat', level: 4,
    userMessage: 'Good morning, how are you?',
    fixtureOutput: 'Good morning. I am here and ready when you are.',
    expectLight: true,
  }),
  cell({
    category: 'light_chat', level: 5,
    userMessage: 'Terima kasih ADAM',
    fixtureOutput: 'Sama-sama. Sila tanya bila-bila masa.',
    expectLight: true,
  }),
  cell({
    category: 'light_chat', level: 6,
    userMessage: 'Thanks',
    fixtureOutput: 'You are welcome.',
    expectLight: true,
  }),
  cell({
    category: 'light_chat', level: 7,
    userMessage: 'Thanks, that helps',
    fixtureOutput: 'Glad it helped. What would you like to explore next?',
    expectLight: true,
  }),

  // ── C2 Factual EN ───────────────────────────────────────────
  cell({
    category: 'factual_en', level: 1,
    userMessage: 'Is Kuala Lumpur the capital of Malaysia?',
    fixtureOutput: 'Yes. Kuala Lumpur is the capital city of Malaysia.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectConsumerPlain: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_en', level: 2,
    userMessage: 'Who governs Malaysia at the federal level?',
    fixtureOutput: 'The Prime Minister leads the federal government of Malaysia, with the Cabinet.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectSubstantive: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_en', level: 3,
    userMessage: 'Explain what photosynthesis is.',
    fixtureOutput: 'Photosynthesis is how green plants use sunlight to turn carbon dioxide and water into glucose and oxygen.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_en', level: 4,
    userMessage: 'Compare renewable and non-renewable energy sources.',
    fixtureOutput: 'Renewable sources such as solar and wind replenish quickly; coal and oil take millions of years to form and emit more carbon when burned.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_en', level: 5,
    userMessage: 'How does the water cycle connect weather patterns and farming?',
    fixtureOutput: 'Evaporation and rainfall drive both local weather and how much water crops receive across a season.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_en', level: 6,
    userMessage: 'Compare nuclear and solar power for a small country.',
    fixtureOutput: 'Nuclear offers steady output; solar scales faster with lower upfront risk but needs storage for night supply.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_en', level: 7,
    userMessage: 'Explain how to design a rainwater harvesting plan for a primary school.',
    fixtureOutput: 'Collect roof runoff into screened tanks, use it for toilets and gardening, and teach pupils to track monthly savings.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),

  // ── C3 Factual BM ───────────────────────────────────────────
  cell({
    category: 'factual_bm', level: 1,
    userMessage: 'Apa itu ibu negara Malaysia?',
    fixtureOutput: 'Ibu negara Malaysia ialah Kuala Lumpur.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_bm', level: 2,
    userMessage: 'Siapa perdana menteri Malaysia?',
    fixtureOutput: 'Perdana Menteri Malaysia semasa ialah Dato Seri Anwar Ibrahim.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectConsumerPlain: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_bm', level: 3,
    userMessage: 'Terangkan apakah fotosintesis.',
    fixtureOutput: 'Fotosintesis ialah proses tumbuhan hijau menukar cahaya matahari, karbon dioksida dan air menjadi glukosa dan oksigen.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_bm', level: 4,
    userMessage: 'Bezakan tenaga boleh diperbaharui dan tenaga fosil.',
    fixtureOutput: 'Tenaga solar dan angin boleh diperbaharui dengan cepat; arang batu dan petroleum mengambil masa lama untuk terbentuk dan melepaskan lebih banyak karbon.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_bm', level: 5,
    userMessage: 'Bagaimana kitaran air menghubungkan cuaca dan pertanian?',
    fixtureOutput: 'Penyejatan dan hujan menentukan corak cuaca tempatan dan berapa banyak air yang diterima tanaman sepanjang musim.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_bm', level: 6,
    userMessage: 'Bezakan tenaga nuklear dan solar untuk negara kecil.',
    fixtureOutput: 'Nuklear membekalkan kuasa stabil; solar lebih cepat skala tetapi perlukan storan untuk waktu malam.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'factual_bm', level: 7,
    userMessage: 'Terangkan cara reka pelan kutip air hujan untuk sekolah rendah.',
    fixtureOutput: 'Kutip air bumbung ke tangki bertapis, guna untuk tandas dan kebun, dan ajar murid menjejak penjimatan bulanan.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),

  // ── C4 Current affairs ────────────────────────────────────────
  cell({
    category: 'current_affairs', level: 1,
    userMessage: 'Who is president of Indonesia now?',
    fixtureOutput: 'Prabowo Subianto is president of Indonesia from October 2024.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectCurrentAffairs: true,
    expectConsumerPlain: true,
    expectedTier: 1,
  }),
  cell({
    category: 'current_affairs', level: 2,
    userMessage: 'Siapa perdana menteri Malaysia sekarang?',
    fixtureOutput: 'Perdana Menteri Malaysia semasa ialah Dato Seri Anwar Ibrahim.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectCurrentAffairs: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'current_affairs', level: 3,
    userMessage: 'Terangkan siapa memegang kuasa eksekutif di Malaysia.',
    fixtureOutput: 'Perdana Menteri mengetuai eksekutif persekutuan dengan Kabinet, manakala Yang di-Pertuan Agong ialah ketua negara.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectTeaching: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'current_affairs', level: 4,
    userMessage: 'Compare the roles of president and prime minister in Indonesia.',
    fixtureOutput: 'Indonesia has both a president as head of state and government and no separate prime minister; Malaysia splits head of state and head of government.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'current_affairs', level: 5,
    userMessage: 'How do leadership changes in ASEAN affect trade talks?',
    fixtureOutput: 'New leaders often reset bilateral priorities, which can slow or accelerate regional trade agreements depending on domestic agendas.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectSubstantive: true,
    expectedTier: 1,
  }),
  cell({
    category: 'current_affairs', level: 6,
    userMessage: 'Compare prioritising BRICS ties versus ASEAN unity for Malaysia.',
    fixtureOutput: 'Both paths offer economic access; the emphasis depends on export mix, investment goals, and diplomatic capital.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'current_affairs', level: 7,
    userMessage: 'Explain how students should follow credible news about elections.',
    fixtureOutput: 'Use official election commission sources, cross-check two independent outlets, note dates and context, and flag unverified social posts.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),

  // ── C5 Practical advisory ─────────────────────────────────────
  cell({
    category: 'practical_advisory', level: 1,
    userMessage: 'What does a CEO do?',
    fixtureOutput: 'A CEO leads the company, sets direction, and is accountable to the board for results.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectConsumerPlain: true,
    expectedTier: 1,
  }),
  cell({
    category: 'practical_advisory', level: 2,
    userMessage: 'Apakah peranan adviser korporat?',
    fixtureOutput: 'Adviser korporat memberi nasihat strategik kepada pengurusan atau lembaga pengarah tanpa memegang kuasa eksekutif harian.\n\nAdakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    expectConsumerPlain: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'practical_advisory', level: 3,
    userMessage: 'Explain the day-to-day work of a software engineer.',
    fixtureOutput: 'Software engineers design, build, test, and maintain code, collaborate in reviews, and fix production issues.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectConsumerPlain: true,
    expectedTier: 1,
  }),
  cell({
    category: 'practical_advisory', level: 4,
    userMessage: 'Compare project manager and product manager roles.',
    fixtureOutput: 'Project managers focus on delivery timelines and resources; product managers own what gets built and why for users.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectConsumerPlain: true,
    expectedTier: 1,
  }),
  cell({
    category: 'practical_advisory', level: 5,
    userMessage: 'Explain how marketing and sales roles connect in a small business.',
    fixtureOutput: 'Marketing generates interest and leads; sales converts qualified leads into paying customers and feeds market insight back.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectConsumerPlain: true,
    expectedTier: 1,
  }),
  cell({
    category: 'practical_advisory', level: 6,
    userMessage: 'Compare generalist and specialist paths for a fresh graduate.',
    fixtureOutput: 'Generalist roles build breadth and network; specialisation pays off when you already know the domain you want.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectSubstantive: true,
    expectedTier: 1,
  }),
  cell({
    category: 'practical_advisory', level: 7,
    userMessage: 'Explain a 90-day plan for transitioning into data analytics.',
    fixtureOutput: 'Month one: SQL and spreadsheets; month two: Python or R and one portfolio project; month three: mock interviews and targeted applications.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectConsumerPlain: true,
    expectedTier: 1,
  }),

  // ── C6 Life / emotion ───────────────────────────────────────────
  cell({
    category: 'life_emotion', level: 1,
    userMessage: 'I feel tired today.',
    fixtureOutput: 'Rest can help when the body is drained. What has your week been like?',
    expectSubstantive: true,
    expectedTier: 1,
  }),
  cell({
    category: 'life_emotion', level: 2,
    userMessage: 'Saya rasa cemas.',
    fixtureOutput: 'Kebimbangan adalah reaksi normal apabila minda menganggap sesuatu sebagai ancaman. Apa yang paling membebankan hari ini?',
    expectSubstantive: true,
    expectMalayLayout: true,
    expectedTier: 1,
  }),
  cell({
    category: 'life_emotion', level: 3,
    userMessage: 'Why do I feel anxious before sleep?',
    fixtureOutput: 'Evening anxiety often rises when the mind finally slows and unfinished worries surface. Steady breathing and a short wind-down routine can help.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'life_emotion', level: 4,
    userMessage: 'Compare stress and anxiety — what is the difference?',
    fixtureOutput: 'Stress usually tracks a visible pressure; anxiety can persist even when no immediate threat is present.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'life_emotion', level: 5,
    userMessage: 'How do sleep habits and exam stress interact?',
    fixtureOutput: 'Poor sleep lowers focus and raises cortisol, which makes exam stress feel sharper and recovery slower.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectSubstantive: true,
    expectedTier: 1,
  }),
  cell({
    category: 'life_emotion', level: 6,
    userMessage: 'Compare pushing through burnout versus taking a break before finals.',
    fixtureOutput: 'Short structured breaks often improve retention; pushing past severe burnout usually reduces performance and health.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),
  cell({
    category: 'life_emotion', level: 7,
    userMessage: 'Explain a one-week wind-down routine before exams.',
    fixtureOutput: 'Fix a sleep window, block 30 minutes nightly for light review then stop, walk daily, and keep one social check-in to vent pressure.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectTeaching: true,
    expectedTier: 1,
  }),

  // ── C7 Tier progression (levels = tier depth) ───────────────────
  cell({
    category: 'tier_progression', level: 1,
    userMessage: 'Who is president of Indonesia?',
    fixtureOutput: 'Prabowo Subianto is president of Indonesia from October 2024.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    expectedTier: 1,
    expectConsumerPlain: true,
  }),
  cell({
    category: 'tier_progression', level: 2,
    userMessage: 'Yes, tell me more from other perspectives',
    priorAssistantMessages: [
      'Prabowo Subianto is president.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
    ],
    fixtureOutput: 'Leadership transitions also reshape cabinet priorities and foreign policy emphasis.\n\nWould you like a spiritual or faith-based angle on public service?',
    expectedTier: 2,
  }),
  cell({
    category: 'tier_progression', level: 3,
    userMessage: 'Yes, from an Alamtologi perspective',
    priorUserMessages: ['Who is president?', 'Yes, tell me more'],
    priorAssistantMessages: [
      'Prabowo is president.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
      'Leadership transitions reshape priorities.',
    ],
    fixtureOutput: 'Public office is a trust: leaders steward resources and time on behalf of citizens.',
    expectedTier: 2,
  }),
  cell({
    category: 'tier_progression', level: 4,
    userMessage: 'Explain deeper — what does stewardship mean for a president?',
    priorUserMessages: ['Who is president?', 'Yes tell me more'],
    priorAssistantMessages: [
      'Prabowo is president.\n\nWould you like more on skills and tools, a career path, or a real-world example?',
      'Leadership is stewardship of public trust.',
    ],
    fixtureOutput: 'Stewardship means decisions are weighed against long-term welfare, not only short-term popularity.',
    expectedTier: 1,
  }),
  cell({
    category: 'tier_progression', level: 5,
    userMessage: 'Connect stewardship and accountability in plain terms.',
    priorUserMessages: ['Yes tell me more'],
    priorAssistantMessages: [
      'Would you like more on skills and tools, a career path, or a real-world example?',
      'Stewardship is caring for trust placed in you.',
    ],
    fixtureOutput: 'Accountability is how stewardship is tested — through institutions, law, and public scrutiny.',
    expectedTier: 1,
  }),
  cell({
    category: 'tier_progression', level: 6,
    userMessage: 'Is spiritual framing useful when discussing presidents?',
    priorUserMessages: ['Yes tell me more'],
    priorAssistantMessages: [
      'Would you like more on skills and tools, a career path, or a real-world example?',
      'Stewardship and accountability matter.',
    ],
    fixtureOutput: 'Spiritual framing can deepen meaning for some listeners; others prefer civic language — both can coexist respectfully.',
    expectedTier: 1,
  }),
  cell({
    category: 'tier_progression', level: 7,
    userMessage: 'Yes, give me a Quranic perspective on leadership and patience.',
    priorUserMessages: ['Yes tell me more'],
    priorAssistantMessages: [
      'Would you like more on skills and tools, a career path, or a real-world example?',
      'Leadership is stewardship.',
    ],
    fixtureOutput: 'Traditions cite patience (sabr) as strength for leaders facing pressure — cited respectfully, not as demand for belief.',
    expectedTier: 3,
  }),
];

export function matrixSummary(): {
  categories: number;
  levels: number;
  totalCells: number;
  byCategory: Record<AdamQaCategoryId, number>;
} {
  const byCategory = {} as Record<AdamQaCategoryId, number>;
  for (const row of ADAM_LEVEL7_QA_MATRIX) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
  }
  return {
    categories: Object.keys(ADAM_QA_CATEGORY_LABELS).length,
    levels:      7,
    totalCells:  ADAM_LEVEL7_QA_MATRIX.length,
    byCategory,
  };
}
