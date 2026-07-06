/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tools — Docs App Law
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Mode: Tools · App: Docs — final deliverables, not chat guides.
 * Charter: docs/ADAM_TOOLS_DOCS.md
 */

import type { ADAMChatMode } from './adam.types';
import { ADAM_RELATIONAL_NATURE_LAW } from './adam-character';
import { ADAM_PROSE_DASH_LAW } from './adam-prose-sanitize';
import { ADAM_UNIVERSAL_SCHOLAR_CHARTER } from './adam-universal-scholar';
import { ADAM_MEMORY_HONESTY_RULE_STUDENT } from './adam-users-prompts';

export function isAdamToolsMode(mode: ADAMChatMode): boolean {
  return mode === 'TOOLS';
}

export const ADAM_DOCS_TASK_IDS = [
  'study-pack',
  'document-faq',
  'meeting-minutes',
  'pitch-deck-content',
  'business-checklist',
] as const;

export type AdamDocsTaskId = (typeof ADAM_DOCS_TASK_IDS)[number];

export function isAdamDocsTaskId(value: string): value is AdamDocsTaskId {
  return (ADAM_DOCS_TASK_IDS as readonly string[]).includes(value);
}

export interface AdamDocsTaskDef {
  id:              AdamDocsTaskId;
  label:           string;
  sourcesRequired: boolean;
  briefRequired:   boolean;
  deliverable:     string;
  outputContract:  string;
}

export const ADAM_DOCS_TASKS: Record<AdamDocsTaskId, AdamDocsTaskDef> = {
  'study-pack': {
    id:              'study-pack',
    label:           'Study Pack',
    sourcesRequired: true,
    briefRequired:   false,
    deliverable:     'Full revision pack ready to study from.',
    outputContract: `
STRUCTURE (use these markdown headings exactly):
# Study Pack
## Topics
## Key Terms
## Q&A
## I Understand Checklist

RULES:
- Base content only on the provided class notes.
- Q&A: at least 5 question/answer pairs drawn from the notes.
- Checklist: concrete "I can explain…" items, not vague advice.
- No study tips essay. No "you should consider". Deliver the pack itself.
`.trim(),
  },
  'document-faq': {
    id:              'document-faq',
    label:           'Document FAQ',
    sourcesRequired: true,
    briefRequired:   false,
    deliverable:     'Publish-ready FAQ from the company document.',
    outputContract: `
STRUCTURE:
# FAQ
Then numbered items:
### 1. [Question]
[Answer in 2–5 clear sentences]

RULES:
- Questions and answers must come from the provided document only.
- At least 6 Q&A pairs when the source supports it.
- Publish-ready wording — no "this document might…" hedges.
- No meta commentary about how FAQs work.
`.trim(),
  },
  'meeting-minutes': {
    id:              'meeting-minutes',
    label:           'Meeting Minutes',
    sourcesRequired: true,
    briefRequired:   false,
    deliverable:     'Formal minutes with decisions and action items.',
    outputContract: `
STRUCTURE:
# Meeting Minutes
## Summary
## Decisions
## Action Items
| Owner | Action | When |
| --- | --- | --- |
## Open Items

RULES:
- Extract only what is in the notes/transcript.
- Action items must name owner when known; use "Unassigned" if not stated.
- When/date: use stated deadlines or "TBD".
- No meeting-facilitation advice. Deliver the minutes.
`.trim(),
  },
  'pitch-deck-content': {
    id:              'pitch-deck-content',
    label:           'Pitch Deck Content',
    sourcesRequired: false,
    briefRequired:   true,
    deliverable:     'Per-slide copy ready for PowerPoint or Canva.',
    outputContract: `
STRUCTURE:
# Pitch Deck Content

## Slide 1 — [Title]
- Bullet (short, presentation-ready)
- Bullet
**Speaker notes:** one short paragraph

(Repeat ## Slide N — [Title] for each slide)

RULES:
- 8–12 slides unless the brief asks otherwise.
- Each slide: ## heading, bullets, then **Speaker notes:** on its own line.
- Bold slide titles; bullets are concrete — not essay prose.
- No long intro essay before slide 1. Start with # Pitch Deck Content.
- Mirror the same numbered/bold layout if user asks for a structure guide instead of full copy.
`.trim(),
  },
  'business-checklist': {
    id:              'business-checklist',
    label:           'Business Checklist',
    sourcesRequired: false,
    briefRequired:   true,
    deliverable:     'Executable checklist with ordered steps.',
    outputContract: `
STRUCTURE:
# Business Checklist
## Context
One short paragraph restating the business situation.
## Checklist
1. [ ] Step — short note
2. [ ] Step — short note

RULES:
- Ordered, actionable steps for this specific situation.
- At least 8 steps when the brief supports it.
- Status markers [ ] so the user can track progress.
- No generic "start a business" manifesto.
`.trim(),
  },
};

export const ADAM_TOOLS_DOCS_IDENTITY = `
You are ADAM Docs — an application under ADAM Tools.
You produce finished document deliverables. You are NOT a tutor and NOT a coach.
You do NOT open with Bismillah. You do NOT chat or offer menus.
Output ONLY the deliverable in the required structure for the active task.
English default unless the user's brief/sources are clearly in another language — then match that language.
`.trim();

export const ADAM_TOOLS_DOCS_UNIVERSAL_VOICE = `
DOCS — UNIVERSAL SCHOLAR SURFACE (mandatory):
- Final deliverable only — ready to copy, save, or use.
- FORBIDDEN unless user explicitly asks in their brief: Alamtologi, MASA, TENAGA, AIR, CAHAYA, RUANG, HISAL, AIDIL, constitutional labels.
- FORBIDDEN unless user mentions Quran/Islam/faith/ayat: Arabic quotations, Surah citations, hadith, sermons.
- FORBIDDEN: Bismillah opener · "Would you like me to…" · "Mahu saya jelaskan lebih lanjut?" · coaching menus · study tips without the artifact.
- If sources are required and empty, say in one short paragraph what is missing — do not invent content.
`.trim();

export interface AdamDocsGenerateInput {
  taskId:     AdamDocsTaskId;
  brief?:     string;
  sourceText?: string;
}

export function validateAdamDocsInput(input: AdamDocsGenerateInput): string | null {
  const task = ADAM_DOCS_TASKS[input.taskId];
  if (!task) return 'Unknown Docs task.';
  const brief = input.brief?.trim() ?? '';
  const source = input.sourceText?.trim() ?? '';
  if (task.sourcesRequired && !source) {
    return `${task.label} requires source text (notes, document, or transcript).`;
  }
  if (task.briefRequired && !brief) {
    return `${task.label} requires a short brief.`;
  }
  if (!brief && !source) {
    return 'Provide a brief and/or source text.';
  }
  return null;
}

/** User-turn payload for the Brain River (task + inputs). */
export function buildAdamDocsUserMessage(input: AdamDocsGenerateInput): string {
  const task = ADAM_DOCS_TASKS[input.taskId];
  const parts = [
    `[ADAM DOCS TASK: ${task.label} (${task.id})]`,
    `Deliverable: ${task.deliverable}`,
  ];
  const brief = input.brief?.trim();
  const source = input.sourceText?.trim();
  if (brief) {
    parts.push(`[BRIEF]\n${brief.slice(0, 12_000)}`);
  }
  if (source) {
    parts.push(`[SOURCE]\n${source.slice(0, 80_000)}`);
  }
  parts.push('Produce the final deliverable now. Output only the document.');
  return parts.join('\n\n');
}

export interface AdamDocsPromptParams {
  taskId:           AdamDocsTaskId;
  participantName?: string;
  userMessage?:     string;
}

export function buildAdamDocsSystemPrompt(params: AdamDocsPromptParams): string {
  const task = ADAM_DOCS_TASKS[params.taskId];
  const parts: string[] = [
    ADAM_RELATIONAL_NATURE_LAW,
    ADAM_UNIVERSAL_SCHOLAR_CHARTER,
    ADAM_TOOLS_DOCS_IDENTITY,
    ADAM_TOOLS_DOCS_UNIVERSAL_VOICE,
    `[ACTIVE TASK: ${task.label}]\n${task.outputContract}`,
    ADAM_PROSE_DASH_LAW,
    ADAM_MEMORY_HONESTY_RULE_STUDENT,
  ];
  const name = params.participantName?.trim();
  if (name) {
    parts.push(`Member name for this session: ${name}.`);
  }
  return parts.filter(Boolean).join('\n\n');
}

export function listAdamDocsTasksPublic(): Array<{
  id:              AdamDocsTaskId;
  label:           string;
  deliverable:     string;
  sourcesRequired: boolean;
  briefRequired:   boolean;
}> {
  return ADAM_DOCS_TASK_IDS.map((id) => {
    const t = ADAM_DOCS_TASKS[id];
    return {
      id:              t.id,
      label:           t.label,
      deliverable:     t.deliverable,
      sourcesRequired: t.sourcesRequired,
      briefRequired:   t.briefRequired,
    };
  });
}
