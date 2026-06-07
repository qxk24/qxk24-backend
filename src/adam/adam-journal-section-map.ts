/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Journal Section → IMRaD Map
 * Platform : Backend (TypeScript)
 * ALAMTOLOGI : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { normalizeJournalContent } from './adam-principle-normalize';
import type { JournalContent } from './adam.types';
import {
  JOURNAL_SECTION_ORDER,
  type JournalSectionId,
} from './adam-journal-section.types';

function parseReferenceLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^\s*[\d*•\-]+[\.)]\s*/, '').trim())
    .filter((line) => line.length > 8);
}

/** Map nine movement sections → IMRaD content store. */
export function draftSectionsToJournalContent(
  sections: Partial<Record<JournalSectionId, string>>,
): JournalContent {
  const m1 = sections.movement_1_human_opening?.trim() ?? '';
  const m2 = sections.movement_2_achievement?.trim() ?? '';
  const m3 = sections.movement_3_honest_wall?.trim() ?? '';
  const m4 = sections.movement_4_quran?.trim() ?? '';
  const m5 = sections.movement_5_alamtologi?.trim() ?? '';
  const m6 = sections.movement_6_application?.trim() ?? '';
  const m7 = sections.movement_7_invitation?.trim() ?? '';
  const refsText = sections.references?.trim() ?? '';

  return normalizeJournalContent({
    introduction: m1,
    background:   [m2, m3].filter(Boolean).join('\n\n'),
    methodology:  m6
      ? `Applied Alamtologi constitutional methodology.\n\n${m6.slice(0, 2500)}`
      : 'Alamtologi constitutional analysis methodology.',
    findings:     [m2, m3, m4].filter(Boolean).join('\n\n') || m5.slice(0, 4000),
    discussion:   [m4, m5, m6].filter(Boolean).join('\n\n'),
    conclusion:   m7,
    references:   parseReferenceLines(refsText),
    alamtologiAnalysis: [],
  });
}

export function draftSectionsFromDoc(
  raw: unknown,
): Partial<Record<JournalSectionId, string>> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Partial<Record<JournalSectionId, string>> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof val === 'string') out[key as JournalSectionId] = val;
  }
  return out;
}

/** One movement section — prefers `draftSections`, falls back to legacy `sections`. */
export function sectionTextFromJournalDoc(
  doc: { draftSections?: unknown; sections?: unknown } | null | undefined,
  sectionKey: string,
): string {
  if (!doc) return '';
  const draft = doc.draftSections as Record<string, unknown> | undefined;
  const legacy = doc.sections as Record<string, unknown> | undefined;
  const raw = draft?.[sectionKey] ?? legacy?.[sectionKey] ?? '';
  return typeof raw === 'string' ? raw.trim() : '';
}

/** All movement sections from a MongoDB `adam_journals` DRAFT document. */
export function sectionsFromJournalMongoDoc(
  doc: { draftSections?: unknown; sections?: unknown } | null | undefined,
): Partial<Record<JournalSectionId, string>> {
  if (!doc) return {};
  const out: Partial<Record<JournalSectionId, string>> = {};
  for (const sectionKey of JOURNAL_SECTION_ORDER) {
    const text = sectionTextFromJournalDoc(doc, sectionKey);
    if (text) out[sectionKey] = text;
  }
  return out;
}
