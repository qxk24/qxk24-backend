/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Profile & Mode
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { ADAMChatMode } from '../adam.types';
import { isAdamLightChatTurn } from '../adam-response-generation';
import { usersDisplayFirstName } from '../adam-users-constitution';
import type {
  AdamTutorCurriculum,
  AdamTutorLanguage,
  AdamTutorLearningStyle,
  AdamTutorProfile,
} from './tutor-law.types';
import { normalizeTutorLearningStyle } from './tutor-law.types';
import {
  buildTutorLevelScopeLaw,
  isAgentMarketingTutorScope,
} from './tutor-law.level-scope';
import {
  studentDemandsTutorDirectAnswer,
  tutorSessionIdentityEstablished,
} from './tutor-law.intro';
import {
  normalizeTutorLanguage,
  tutorLanguageInstruction,
  tutorTeacherTitle,
} from './tutor-law.types';

const TUTOR_COUNTRY_LABELS: Record<string, string> = {
  MY: 'Malaysia', SG: 'Singapore', ID: 'Indonesia', BN: 'Brunei', TH: 'Thailand',
  PH: 'Philippines', VN: 'Vietnam', GB: 'United Kingdom', US: 'United States',
  AU: 'Australia', IN: 'India', AE: 'United Arab Emirates', SA: 'Saudi Arabia',
  NG: 'Nigeria', GH: 'Ghana', KE: 'Kenya', ZA: 'South Africa', EG: 'Egypt',
};

function tutorCountryLabel(code?: string): string | undefined {
  if (!code?.trim()) return undefined;
  const upper = code.trim().toUpperCase();
  return TUTOR_COUNTRY_LABELS[upper] ?? upper;
}

function normalizeTutorCurriculum(raw: string): AdamTutorCurriculum {
  const legacy: Record<string, AdamTutorCurriculum> = {
    kpm:       'national',
    cambridge: 'international',
    mixed:     'international',
  };
  if (legacy[raw]) return legacy[raw];
  if (
    raw === 'national'
    || raw === 'international'
    || raw === 'us'
    || raw === 'uk'
    || raw === 'other'
  ) {
    return raw;
  }
  return 'other';
}

function curriculumLabel(curriculum: AdamTutorCurriculum): string {
  switch (curriculum) {
    case 'national':
      return 'National / local curriculum (any country)';
    case 'international':
      return 'International — IB, Cambridge, IGCSE, A-Levels';
    case 'us':
      return 'United States — Common Core, AP';
    case 'uk':
      return 'United Kingdom';
    default:
      return 'Other (student specifies syllabus)';
  }
}

export function buildAdamTutorTeacherIntroLaw(
  profile?: AdamTutorProfile,
  userMessage = '',
  recentAssistantMessages: string[] = [],
): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);
  const isGreeting = isAdamLightChatTurn(userMessage);
  const isFirstTurn = recentAssistantMessages.length === 0;
  const demandsAnswer = studentDemandsTutorDirectAnswer(userMessage);
  const sessionStarted = recentAssistantMessages.some((m) =>
    tutorSessionIdentityEstablished(m, profile),
  );

  const malayToneSamples = [
    'Hai Siti. Saya Cikgu ADAM — subjek apa hari ini?',
    'Baik Ali, saya Cikgu ADAM. Cerita soalan anda.',
    'Salam. Saya Cikgu ADAM. Apa yang susah?',
  ].map((s) => `  · "${s}"`).join('\n');

  const englishToneSamples = [
    'Hi Siti. I\'m Teacher ADAM — what are we working on today?',
    'Sure, Ali — I\'m Teacher ADAM. What\'s the question?',
    'Hello. I\'m Teacher ADAM. What topic is tricky?',
  ].map((s) => `  · "${s}"`).join('\n');

  const base = `
ADAM TUTOR — NATURAL VOICE (hybrid A+B — intent, NOT a fixed script):
- You are the student's ${title}. Say **${title} ADAM** when naming yourself — not "ADAM Tutor" alone.
- Sound like a real ${lang === 'malay' ? 'Malaysian classroom teacher' : 'classroom teacher'}: warm, direct, short sentences.
- CONTRACT (must be true over the session — do NOT preach it every turn):
  (1) You guide step by step; (2) you do not hand finished homework answers; (3) the student tries first.
- Show the contract through questions and blanks — not Terms & Conditions prose.
- UNIVERSAL: no Bismillah opener; return Waalaikumussalam only if the student greeted first.
- Never kau/kamu/engkau — use the student's name or "anda".
- ${tutorLanguageInstruction(lang)} — do not switch language on short or numeric replies.
- Do NOT copy any example sentence verbatim — vary wording every session.
- Tone samples (paraphrase freely — do NOT copy):
${lang === 'malay' ? malayToneSamples : englishToneSamples}
`.trim();

  if (demandsAnswer) {
    return `${base}

TURN TYPE — Tier 2 (student demands finished answer):
- ONE firm natural sentence only, e.g. "${lang === 'malay'
  ? 'Saya bimbing langkah demi langkah — cuba isi yang kosong dulu.'
  : 'I guide step by step — try the blank first.'}"
- Then return to ONE micro-step they can do now. No lecture, no repeat of full intro.`.trim();
  }

  if (isGreeting && isFirstTurn) {
    return `${base}

TURN TYPE — Tier 0 (greeting only):
- ONE warm line + ask what subject or question they want help with.
- NO zero-answer policy speech, NO "saya tidak beri jawapan siap" on this turn.
- Optional: mention ${title} ADAM once in passing — not a full introduction block.`.trim();
  }

  if (isFirstTurn || !sessionStarted) {
    return `${base}

TURN TYPE — Tier 1 (first substantive question):
- Jump into the problem — micro-teach immediately (show-don't-tell).
- Mention ${title} ADAM at most ONCE in the opening line if natural — or skip if the question is clear.
- NO policy paragraph; let your first guiding question show how you teach.`.trim();
  }

  return `${base}

TURN TYPE — ongoing teaching:
- No intro, no identity restatement, no policy speech — teach the next micro-step only.`.trim();
}

/** Tutor lane — no Bismillah; name once on substantive turns. */
export function buildTutorStudentAddressLaw(participantName: string): string {
  const full = participantName.trim();
  const first = usersDisplayFirstName(full) || full || 'pelajar';
  return `
STUDENT ADDRESS (ADAM Tutor — universal classroom):
The person speaking now: ${full || 'pelajar'} · call them: ${first}

- Do NOT open with Bismillahirahmanirrahim or Bismillah — this lane is universal, not religious teaching.
- Substantive turn: say "${first}" once in the opening sentence if natural.
- Greeting turn: "Salam" / "Hello" + ask what they want to learn — no policy lecture.
- FORBIDDEN: kau, kamu, engkau. Use ${first} or "anda".
- Do NOT open with "Salam, Pelajar." — use the student's name or neutral phrasing.
`.trim();
}

/** Guaranteed tutor reply on empty greeting/light turns. */
export function buildTutorGreetingFallback(
  userMessage: string,
  userName?: string,
  profile?: AdamTutorProfile,
): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);
  const t = userMessage.trim();
  const name = userName?.trim();
  const first = name ? usersDisplayFirstName(name) : '';

  if (/assalamu|salam\s*alaikum/i.test(t) && !/waalaikum/i.test(t)) {
    const greet = 'Waalaikumussalam.';
    const follow = lang === 'malay'
      ? `Saya ${title} ADAM. Apa subjek atau soalan hari ini?`
      : `I'm ${title} ADAM. What subject or question today?`;
    return `${greet} ${follow}`;
  }

  if (lang === 'malay') {
    const greet = first ? `Salam, ${first}.` : 'Salam.';
    return `${greet} Saya ${title} ADAM. Apa yang nak kita belajar hari ini?`;
  }

  const greet = first ? `Hello, ${first}.` : 'Hello.';
  return `${greet} I'm ${title} ADAM. What would you like to work on today?`;
}

/** Compact one-liner for Founder roster / activity log. */
export function formatTutorProfileOneLiner(profile?: AdamTutorProfile | null): string | null {
  if (!profile) return null;

  const levelLabel =
    profile.level === 'primary'
      ? 'Primary'
      : profile.level === 'secondary'
        ? 'Secondary'
        : 'University';

  const parts: string[] = [
    levelLabel,
    curriculumLabel(normalizeTutorCurriculum(String(profile.curriculum))),
  ];

  if (profile.countryCode?.trim()) {
    parts.push(tutorCountryLabel(profile.countryCode) ?? profile.countryCode.trim().toUpperCase());
  }
  if (profile.yearLabel?.trim()) parts.push(profile.yearLabel.trim());
  if (profile.localeNote?.trim()) parts.push(profile.localeNote.trim());

  const lang = normalizeTutorLanguage(profile.language);
  if (lang !== 'english') {
    parts.push(`teach in ${lang}`);
  }

  return parts.join(' · ');
}

const ALAMTOLOGI_OFF_TOPIC =
  /\b(?:alamtologi|teori\s+masa(?:\s+bayu)?|masa\s+bayu|qxk24|izwa|ruang\s+kehadiran|ama\s+tamat|pencipta|hikmah\s+tuhan|constitutional|perlembagaan\s+alamtologi|alamin\b|seven\s+principle|tujuh\s+prinsip)\b/i;

const LIFE_PHILOSOPHY_OFF_TOPIC =
  /\b(?:makna\s+hidup|kenapa\s+hidup\s+susah|siapa\s+(?:cipta|buat|bina)\s+adam|founder|pengasas|cerita\s+tentang\s+alamtologi)\b/i;

const META_ABOUT_ADAM =
  /\b(?:siapa\s+adam|who\s+(?:built|made|created)\s+you|who\s+are\s+you\s+really)\b/i;

export function isAdamTutorMode(mode: ADAMChatMode): boolean {
  return mode === 'TUTOR';
}

/** Off-scope for Tutor lane — redirect (A), do not lecture. */
export function isAdamTutorOffTopicMessage(message: string): boolean {
  const t = message.trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  return (
    ALAMTOLOGI_OFF_TOPIC.test(t)
    || LIFE_PHILOSOPHY_OFF_TOPIC.test(t)
    || META_ABOUT_ADAM.test(t)
  );
}

const LEARNING_STYLE_HINTS: Record<AdamTutorLearningStyle, string> = {
  visual:
    'Utamakan graf, susunan digit, diagram, peta kosong; satu link STEM allowlist jika topik sesuai.',
  auditory:
    'Galakkan baca kuat, perbincangan ringkas, explain-back verbal; kurangkan simulasi melainkan pelajar minta.',
  kinesthetic:
    'Galakkan cuba dulu, ramalan, simulasi allowlist (PhET); probe hands-on mental sebelum teori.',
  mixed:
    'Adapt ikut domain: STEM visual/kinestetik; Bahasa auditori/verbal; Kemanusiaan naratif/visual.',
};

export function buildTutorLearningStyleLaw(profile?: AdamTutorProfile): string {
  const style = normalizeTutorLearningStyle(profile?.learningStyle);
  if (!style) return '';
  return `
ADAM TUTOR — GAYA BELAJAR (VAK hint — lembut, bukan label tetap):
- Preferens pelajar: ${style}
- ${LEARNING_STYLE_HINTS[style]}
- Jangan langgar zero-answer atau satu-soalan-per-turn.
`.trim();
}

export function buildAdamTutorProfileBlock(profile?: AdamTutorProfile): string {
  if (!profile) {
    return `
ADAM TUTOR PROFILE (default):
- Level: school or university student worldwide — adapt to their context.
- Curriculum: unknown — ask which country, syllabus, or exam board when it matters; never assume Malaysia only.
- Language: match the student (any language they use).
`.trim();
  }

  if (profile.localeNote === 'ALL_BANDS') {
    return `
ADAM TUTOR PROFILE (agent marketing demo — all bands):
- Scope: primary school, secondary / high school, AND college / university — all subjects in one session.
- Do NOT ask the student to pick a category or band before helping. Infer depth from the question.
- Primary topics: very short sentences (~12 words). Secondary: plain language (~18 words). University: clear and formal.
- Curriculum framework: ${curriculumLabel(normalizeTutorCurriculum(String(profile.curriculum)))}
- Country: ${profile.countryCode ? (tutorCountryLabel(profile.countryCode) ?? profile.countryCode) : 'Malaysia (default examples OK)'}
- LANGUAGE (mandatory): ${tutorLanguageInstruction(normalizeTutorLanguage(profile.language))}
- Adapt terminology, syllabus, and difficulty to each question — rendah, menengah, or universiti as the topic requires.
`.trim();
  }

  const scopeLaw = buildTutorLevelScopeLaw(profile);
  const vakLaw = buildTutorLearningStyleLaw(profile);

  const levelLabel =
    profile.level === 'primary'
      ? 'Primary school'
      : profile.level === 'secondary'
        ? 'Secondary / high school'
        : 'University / college';

  const cur = normalizeTutorCurriculum(String(profile.curriculum));
  const lang = normalizeTutorLanguage(profile.language);
  const countryLine = profile.countryCode
    ? `Country: ${tutorCountryLabel(profile.countryCode) ?? profile.countryCode}`
    : '';
  const localeLine = profile.localeNote?.trim()
    ? `Syllabus / exam board: ${profile.localeNote.trim()}`
    : '';
  const yearLine = profile.yearLabel?.trim()
    ? `Year / grade: ${profile.yearLabel.trim()}`
    : '';

  return `
ADAM TUTOR PROFILE (this session):
- Level: ${levelLabel}
- Kategori dikunci: ${isAgentMarketingTutorScope(profile) ? 'demo agen (semua kategori)' : levelLabel}
- Curriculum framework: ${curriculumLabel(cur)}
${countryLine ? `- ${countryLine}` : ''}
${localeLine ? `- ${localeLine}` : ''}
${yearLine ? `- ${yearLine}` : ''}
- Global tutor: align examples, terminology, and standards to the student's country and syllabus when known.
- LANGUAGE (mandatory): ${tutorLanguageInstruction(lang)}
- Primary: ayat sangat pendek (~12 perkataan); secondary: bahasa mudah (~18); university: jelas dan formal tanpa metafora.
${scopeLaw ? `\n${scopeLaw}` : ''}${vakLaw ? `\n\n${vakLaw}` : ''}`.trim();
}
