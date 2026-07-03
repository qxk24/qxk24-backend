/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Tutor Law — Behavior Mode
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-25
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AdamTutorProfile } from './tutor-law.types';
import { normalizeTutorLanguage, tutorLanguageInstruction } from './tutor-law.types';

export type AdamTutorBehaviorMode = 'teaching' | 'coaching';

interface TutorBehaviorModeInput {
  userMessage?:             string;
  recentUserMessages?:      string[];
  recentAssistantMessages?: string[];
  profile?:                 AdamTutorProfile;
}

const ACADEMIC_CONTEXT =
  /\b(?:school|class|homework|worksheet|exam|quiz|test|curriculum|syllabus|assignment|tuition|teacher|student|pupil|grade|year\s+\d+|primary|secondary|college|university|igcse|spm|pt3|upsr|stpm|a-?level|ib|cambridge|common\s+core|ap\s+(?:class|exam|biology|chemistry|physics|calculus)|sekolah|kelas|kerja\s+sekolah|latihan|peperiksaan|ujian|kuiz|kurikulum|silibus|subjek|cikgu|guru|pelajar|murid|darjah|tahun\s+\d+|tingkatan|matematik|sains|sejarah|geografi|biologi|kimia|fizik|add\s*math|english\s+homework|karangan|rumusan|pemahaman)\b/i;

const ACADEMIC_TASK =
  /\b(?:solve|factorise|factorize|differentiate|integrate|calculate|simplify|prove|show\s+working|mark\s+scheme|essay|lab\s+report|formula|equation|algebra|geometry|trigonometry|pecahan|perpuluhan|persamaan|faktor|kembangan|terbitan|kamiran|kira|jawapan\s+akhir|jalan\s+kerja|skema|soalan\s+\d+)\b/i;

export { ACADEMIC_CONTEXT, ACADEMIC_TASK };

const GENERAL_PRACTICAL_CONTEXT =
  /\b(?:work|job|career|business|startup|marketing|sales|client|customer|proposal|meeting|manager|team|budget|pricing|conversion|product|strategy|legal|contract|parenting|relationship|marriage|health|fitness|diet|travel|finance|tax|investment|adult|practical|kerja|kerjaya|bisnes|niaga|pelanggan|cadangan|mesyuarat|pasukan|bajet|harga|strategi|produk|undang-undang|kontrak|keibubapaan|hubungan|kesihatan|dewasa|praktikal)\b/i;

function combinedConversationText(input: TutorBehaviorModeInput): string {
  return [
    ...(input.recentUserMessages ?? []).slice(-3),
    ...(input.recentAssistantMessages ?? []).slice(-2),
    input.userMessage ?? '',
  ].join('\n').slice(-5000);
}

export function classifyTutorBehaviorMode(input: TutorBehaviorModeInput): AdamTutorBehaviorMode {
  const text = combinedConversationText(input);
  const current = input.userMessage ?? '';

  if (ACADEMIC_CONTEXT.test(text) || ACADEMIC_TASK.test(current)) {
    return 'teaching';
  }

  if (GENERAL_PRACTICAL_CONTEXT.test(text)) {
    return 'coaching';
  }

  return 'coaching';
}

export function buildTutorBehaviorModePrompt(
  mode: AdamTutorBehaviorMode,
  profile?: AdamTutorProfile,
): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const languageLine = tutorLanguageInstruction(lang);

  if (mode === 'teaching') {
    return `
[TUTOR MODE — TEACHING]
Context: school, curriculum, exam, homework, academic exercise, or clear learning drill.
- ${languageLine}
- Be a teacher: guide step by step, ask for the learner's attempt, and protect learning.
- Zero-answer is strict only here: do not hand finished homework/exam answers unless the turn is factual, corrective, or the learner has already worked enough.
- Use "learner" / "member" / "anda" in general copy; "student/pelajar" is allowed only when the schooling context is explicit.
[/TUTOR MODE]
`.trim();
  }

  return `
[TUTOR MODE — COACHING]
Context: adult, general public, practical life/work/business/product question, or no clear school task.
- ${languageLine}
- Be a direct coach: answer clearly first, then explain the reasoning or options.
- Do not enforce strict zero-answer. No "I won't give the final answer" policy line.
- You may still teach gently, but use concise recommendations, checklists, trade-offs, and next actions.
- Use neutral public wording: learner, member, user, anda — not student-only framing.
[/TUTOR MODE]
`.trim();
}
