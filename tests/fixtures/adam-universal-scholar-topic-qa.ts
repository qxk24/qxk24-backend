/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Scholar Topic QA
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
 * Multi-topic manual + automated QA — one fresh chat per scenario.
 */

import { UNIVERSAL_SCHOLAR_DOOR_EN, UNIVERSAL_SCHOLAR_DOOR_BM } from '../../src/adam/adam-universal-scholar';

export type TopicQaScenarioId =
  | 'nurse_role_en'
  | 'electrician_role_en'
  | 'teacher_role_bm'
  | 'photosynthesis_en'
  | 'malaysia_pm_bm'
  | 'diabetes_health_en'
  | 'exam_stress_en'
  | 'ux_ui_compare_en';

export interface TopicQaTurn {
  /** What the tester types in live chat. */
  userMessage: string;
  /** Simulated over-long tier-1 model output (pipeline tests). */
  bloatedFixture?: string;
  /** Prior user turns — for turn 2+. */
  priorUserMessages?: string[];
  /** Prior ADAM replies — for turn 2+. */
  priorAssistantMessages?: string[];
  mustMatch: RegExp[];
  mustNotMatch: RegExp[];
}

export interface TopicQaScenario {
  id: TopicQaScenarioId;
  label: string;
  /** Use a new chat session for each scenario. */
  freshChat: true;
  turns: TopicQaTurn[];
}

const DOOR_EN = UNIVERSAL_SCHOLAR_DOOR_EN;
const DOOR_BM = UNIVERSAL_SCHOLAR_DOOR_BM;

/** Shared tier-1 essay leaks to strip across practical topics. */
function bloatedPractical(roleLine: string, vignette: string): string {
  return [
    roleLine,
    'Let me explain it not as a job description, but as lived reality:',
    vignette,
    "That's the heart of it: clarity through careful listening.",
    'What they actually do, day to day:',
    'Defines the question: Works with stakeholders to turn vague concerns into precise questions.',
    'Collects & cleans data: Gathers from databases and checks for errors.',
    'One quiet truth many miss: The most valuable skill is humility.',
    `Would you like more on skills and tools, a career path (e.g., junior → senior), or a real-world example, like a 22% improvement story?`,
  ].join('\n\n');
}

const TIER1_FORBIDDEN = [
  /Imagine a/i,
  /Defines the question/i,
  /One quiet truth/i,
  /lived reality/i,
  /Bismillah/i,
  /Alamtologi/i,
  /AMA\s+124/i,
];

const DOOR_EN_EXACT = /Would you like more on skills and tools, a career path, or a real-world example\?/;

/** Eight topic threads — run each in a separate new chat. */
export const ADAM_TOPIC_QA_SCENARIOS: TopicQaScenario[] = [
  {
    id: 'nurse_role_en',
    label: 'Healthcare — registered nurse (English)',
    freshChat: true,
    turns: [
      {
        userMessage: 'What does a registered nurse do, and what skills do I need?',
        bloatedFixture: bloatedPractical(
          'A registered nurse provides hands-on patient care, monitors conditions, and coordinates with doctors and families.',
          'Imagine a ward nurse notices a patient\'s oxygen dropping before the alarm sounds — they act, document, and escalate.',
        ),
        mustMatch: [/registered nurse|nurse provides/i, DOOR_EN_EXACT],
        mustNotMatch: TIER1_FORBIDDEN,
      },
      {
        userMessage: 'Real-world example',
        priorUserMessages: ['What does a registered nurse do, and what skills do I need?'],
        priorAssistantMessages: [
          `A registered nurse provides patient care and monitors conditions.\n\n${DOOR_EN}`,
        ],
        bloatedFixture: [
          'At a district clinic in Kelantan, nurses tracked triage wait times on a simple spreadsheet.',
          'They cut average wait from 47 to 36 minutes by re-staggering shift handovers.',
          DOOR_EN,
        ].join('\n\n'),
        mustMatch: [/clinic|wait|minute|Kelantan/i],
        mustNotMatch: [/skills and tools, a career path/i],
      },
    ],
  },
  {
    id: 'electrician_role_en',
    label: 'Trade — electrician (English)',
    freshChat: true,
    turns: [
      {
        userMessage: 'What does an electrician do day to day, and what skills should I learn first?',
        bloatedFixture: bloatedPractical(
          'An electrician installs, tests, and maintains electrical wiring and equipment so buildings stay safe and powered.',
          'Imagine a café owner calls because half the kitchen tripped — the electrician traces the fault to a worn breaker.',
        ),
        mustMatch: [/electrician/i, DOOR_EN_EXACT],
        mustNotMatch: TIER1_FORBIDDEN,
      },
    ],
  },
  {
    id: 'teacher_role_bm',
    label: 'Pendidikan — guru (Bahasa Melayu)',
    freshChat: true,
    turns: [
      {
        userMessage: 'Apakah peranan guru di sekolah menengah, dan kemahiran apa yang diperlukan?',
        bloatedFixture: [
          'Guru di sekolah menengah merancang pengajaran, menilai murid, dan membimbing disiplin positif.',
          'Bayangkan seorang guru perhatikan murid tertinggal dalam algebra — bukan sekadar gred, tetapi kepercayaan diri.',
          'Peranan harian: Merancang pelajaran, Menilai kerja, Mentoring kokurikular.',
          `Adakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?`,
        ].join('\n\n'),
        mustMatch: [/guru|sekolah menengah/i, /kemahiran dan alat|laluan kerjaya|contoh dunia sebenar/i],
        mustNotMatch: [/Bayangkan/i, /Bismillah/i],
      },
    ],
  },
  {
    id: 'photosynthesis_en',
    label: 'Science — photosynthesis (English)',
    freshChat: true,
    turns: [
      {
        userMessage: 'Explain photosynthesis in simple terms.',
        bloatedFixture: [
          'Photosynthesis is how green plants convert light, water, and carbon dioxide into glucose and oxygen.',
          'Let me explain it not as a textbook definition, but as lived reality in a leaf.',
          'Imagine a mangrove seedling at low tide — each cell is a quiet factory.',
          DOOR_EN,
        ].join('\n\n'),
        mustMatch: [/photosynthesis|glucose|oxygen/i],
        mustNotMatch: [/Imagine a mangrove/i, /lived reality/i, /quiet covenant/i, /skills and tools, a career path/i],
      },
    ],
  },
  {
    id: 'malaysia_pm_bm',
    label: 'Current affairs — PM Malaysia (BM)',
    freshChat: true,
    turns: [
      {
        userMessage: 'Siapa perdana menteri Malaysia sekarang?',
        bloatedFixture: [
          'Bismillahirahmanirrahim. Perdana Menteri Malaysia semasa ialah Dato Seri Anwar Ibrahim.',
          'Jika QA ingin tahu tentang latar belakang dari sudut Alamtologi, saya sedia jelaskan.',
          DOOR_BM,
        ].join('\n\n'),
        mustMatch: [/Anwar Ibrahim/i],
        mustNotMatch: [/Bismillah/i, /Alamtologi/i, /QA ingin/i, /kemahiran dan alat|laluan kerjaya/i],
      },
    ],
  },
  {
    id: 'diabetes_health_en',
    label: 'Health — diabetes remission (English)',
    freshChat: true,
    turns: [
      {
        userMessage: 'Can type 2 diabetes go into remission?',
        bloatedFixture: [
          'Thank you for this important question — it touches hope and medical limits.',
          'Type 2 diabetes can sometimes enter remission with sustained weight loss and lifestyle change, but it is not guaranteed for everyone.',
          'Saya di sini untuk membantu anda faham, bukan memutuskan bagi anda.',
          DOOR_EN,
        ].join('\n\n'),
        mustMatch: [/type 2 diabetes|remission/i],
        mustNotMatch: [/Saya di sini untuk membantu/i, /Thank you for this important question/i, /Alamtologi/i, /\bMASA\b/i],
      },
    ],
  },
  {
    id: 'exam_stress_en',
    label: 'Life — exam stress (English)',
    freshChat: true,
    turns: [
      {
        userMessage: 'I feel stressed before exams. What helps?',
        bloatedFixture: [
          'Exam stress is common when your mind treats the paper as a threat.',
          'Short walks, fixed sleep windows, and breaking revision into 25-minute blocks often help.',
          'Third, protect your MASA, not just time, but living time.',
          'Allah says in Surah Ar-Ra\'d 13:28 that hearts find rest in remembrance.',
          'Just say the word and we\'ll walk there together.',
        ].join('\n\n'),
        mustMatch: [/stress|sleep|revision/i],
        mustNotMatch: [/walk there together/i, /\bSurah\b/i, /\bMASA\b/i, /Allah says/i],
      },
    ],
  },
  {
    id: 'ux_ui_compare_en',
    label: 'Career compare — UX vs UI (English)',
    freshChat: true,
    turns: [
      {
        userMessage: 'Compare UX designer and UI designer roles.',
        bloatedFixture: bloatedPractical(
          'UX designers focus on research, flows, and whether the product solves the user problem; UI designers focus on visual layout, typography, and design systems.',
          'Imagine a fintech app where users abandon signup — UX asks why; UI makes the form clearer.',
        ),
        mustMatch: [/UX|UI|designer/i, /skills for each path|work together on a product team|real-world example/i],
        mustNotMatch: TIER1_FORBIDDEN,
      },
    ],
  },
];

export function topicQaScenarioCount(): number {
  return ADAM_TOPIC_QA_SCENARIOS.length;
}

/** Printable manual QA checklist for testers. */
export function formatTopicQaManualScript(): string {
  const lines: string[] = [
    'ADAM Universal Scholar — Multi-Topic Manual QA',
    'Rule: ONE NEW CHAT per scenario below.',
    '',
  ];
  for (const scenario of ADAM_TOPIC_QA_SCENARIOS) {
    lines.push(`── ${scenario.label} (${scenario.id}) ──`);
    scenario.turns.forEach((turn, i) => {
      lines.push(`  Turn ${i + 1}: ${turn.userMessage}`);
    });
    lines.push('');
  }
  return lines.join('\n');
}
