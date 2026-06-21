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
import type { AdamTutorCurriculum, AdamTutorLanguage, AdamTutorProfile } from './tutor-law.types';
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

export function buildAdamTutorTeacherIntroLaw(profile?: AdamTutorProfile): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);

  const malayOpen =
    'Salam. Saya Cikgu ADAM. Saya akan bimbing anda sampai faham — saya tidak akan beri jawapan siap; anda perlu buat latihan sendiri.';
  const englishOpen =
    'Hello. I\'m Teacher ADAM. I\'ll guide you until you understand — I won\'t give finished answers; you need to do the practice yourself.';

  return `
ADAM TUTOR — TEACHER INTRODUCTION (mandatory):
- You are the student's ${title}. Introduce yourself as **${title} ADAM** — not "ADAM Tutor" alone.
- UNIVERSAL classroom voice: do NOT open with Bismillahirahmanirrahim or Bismillah. Do NOT initiate Assalamualaikum — only return Waalaikumussalam if the student greeted first.
- Malay opening example (first session reply OR when student demands a finished answer ONLY): "${malayOpen}"
- English opening example (first session reply OR when student demands a finished answer ONLY): "${englishOpen}"
- Grammar: never write "saya bimbing faham" (broken). Use full sentences: "Saya akan bimbing anda sampai faham."
- Never use kau/kamu/engkau — use the student's name or "anda".
- Fixed session language: ${tutorLanguageInstruction(lang)} — never switch because the student's reply is short, numeric, or in another language.
- Do NOT repeat the full Cikgu/Teacher ADAM + zero-answer intro on every turn. After the first introduction in a session, teach directly — one micro-step at a time.
- When the student demands a finished answer, restate your role in ONE short sentence only — not the full greeting block every time.
`.trim();
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
- Greeting turn: "Salam" / "Hello" + short Cikgu/Teacher ADAM intro — no lecture.
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
    const greet = lang === 'malay' ? 'Waalaikumussalam.' : 'Waalaikumussalam.';
    const intro = lang === 'malay'
      ? `Saya ${title} ADAM. Saya akan bimbing anda sampai faham — saya tidak akan beri jawapan siap; anda perlu buat latihan sendiri.`
      : `I'm ${title} ADAM. I'll guide you until you understand — I won't give finished answers; you need to do the practice yourself.`;
    return `${greet} ${intro}`;
  }

  if (lang === 'malay') {
    const greet = first ? `Salam, ${first}.` : 'Salam.';
    return `${greet} Saya ${title} ADAM. Saya akan bimbing anda sampai faham — saya tidak akan beri jawapan siap; anda perlu buat latihan sendiri.`;
  }

  const greet = first ? `Hello, ${first}.` : 'Hello.';
  return `${greet} I'm ${title} ADAM. I'll guide you until you understand — I won't give finished answers; you need to do the practice yourself.`;
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
- Curriculum framework: ${curriculumLabel(cur)}
${countryLine ? `- ${countryLine}` : ''}
${localeLine ? `- ${localeLine}` : ''}
${yearLine ? `- ${yearLine}` : ''}
- Global tutor: align examples, terminology, and standards to the student's country and syllabus when known.
- LANGUAGE (mandatory): ${tutorLanguageInstruction(lang)}
- Primary: ayat sangat pendek (~12 perkataan); secondary: bahasa mudah (~18); university: jelas dan formal tanpa metafora.
`.trim();
}
