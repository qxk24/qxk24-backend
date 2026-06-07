/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Section Migrate (Quran split)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * One-time remap: 8-section layout → 9-section (dedicated movement_4_quran).
 * Old combined Alamtologi content moves to movement_5 — regenerate Quran via ADAM.
 */

import { ADAMJournalModel } from '../adam.schema';
import {
  JOURNAL_SECTION_KEYS,
  JournalV2Model,
  type JournalSectionKey,
} from './adam-journal-v2.schema';

export const JOURNAL_SECTION_SCHEMA_VERSION = '2026-06-quran-split';

/** V2 write workspace keys (Mongo `sections`). */
export const LEGACY_V2_SECTION_KEY_MAP: Record<string, JournalSectionKey> = {
  movement_4_alamtologi_framework: 'movement_5_alamtologi_framework',
  movement_5_application:          'movement_6_application',
  movement_6_invitation:           'movement_7_invitation',
};

/** Chat section-writer keys (Mongo `draftSections`). */
export const LEGACY_CHAT_SECTION_KEY_MAP: Record<string, string> = {
  movement_4_alamtologi:  'movement_5_alamtologi',
  movement_5_application: 'movement_6_application',
  movement_6_invitation:  'movement_7_invitation',
  ...LEGACY_V2_SECTION_KEY_MAP,
};

const LEGACY_SECTION_KEYS = new Set([
  ...Object.keys(LEGACY_V2_SECTION_KEY_MAP),
  ...Object.keys(LEGACY_CHAT_SECTION_KEY_MAP),
]);

const V2_MIGRATABLE_STATUSES = [
  'TITLE_DRAFT',
  'TITLE_APPROVED',
  'IN_PROGRESS',
  'PENDING_REVIEW',
] as const;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function documentNeedsSectionMigration(input: {
  sectionSchemaVersion?: string | null;
  sections?:            Record<string, unknown> | null;
  draftSections?:       Record<string, unknown> | null;
  approvedSections?:    string[] | null;
  lastCompletedSection?: string | null;
}): boolean {
  if (input.sectionSchemaVersion === JOURNAL_SECTION_SCHEMA_VERSION) return false;

  const sectionKeys = [
    ...Object.keys(input.sections ?? {}),
    ...Object.keys(input.draftSections ?? {}),
  ];
  const approved = input.approvedSections ?? [];
  const last = input.lastCompletedSection ?? '';

  return sectionKeys.some(k => LEGACY_SECTION_KEYS.has(k))
    || approved.some(k => LEGACY_SECTION_KEYS.has(k))
    || LEGACY_SECTION_KEYS.has(last);
}

export function remapSectionRecord(
  sections: Record<string, string> | null | undefined,
  keyMap: Record<string, string>,
): { sections: Record<string, string>; moves: string[] } {
  const input = sections ?? {};
  const out: Record<string, string> = {};
  const moves: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    const target = keyMap[key] ?? key;
    if (target !== key) {
      moves.push(`${key} → ${target}`);
    }
    if (out[target]?.trim()) {
      out[target] = `${out[target]}\n\n${trimmed}`;
    } else {
      out[target] = trimmed;
    }
  }

  return { sections: out, moves };
}

export function remapApprovedSections(
  approved: string[] | null | undefined,
  keyMap: Record<string, string>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of approved ?? []) {
    const mapped = keyMap[key] ?? key;
    if (!seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return out;
}

export function remapLastCompletedSection(
  last: string | null | undefined,
  keyMap: Record<string, string>,
): string | undefined {
  if (!last?.trim()) return undefined;
  return keyMap[last] ?? last;
}

export function recalculateV2TotalWords(
  sections: Record<string, string>,
): number {
  return JOURNAL_SECTION_KEYS.reduce(
    (sum, k) => sum + countWords(sections[k] ?? ''),
    0,
  );
}

export interface JournalSectionMigrationResult {
  v2Updated:     number;
  chatUpdated:   number;
  v2Skipped:     number;
  chatSkipped:   number;
  v2JournalNumbers: string[];
  chatDraftIds:     string[];
}

export async function migrateJournalSectionsToQuranSplit(options?: {
  dryRun?: boolean;
}): Promise<JournalSectionMigrationResult> {
  const dryRun = options?.dryRun === true;
  const result: JournalSectionMigrationResult = {
    v2Updated:          0,
    chatUpdated:        0,
    v2Skipped:          0,
    chatSkipped:        0,
    v2JournalNumbers:   [],
    chatDraftIds:       [],
  };

  const v2Docs = await JournalV2Model.find({
    status: { $in: [...V2_MIGRATABLE_STATUSES] },
    $or: [
      { sectionSchemaVersion: { $ne: JOURNAL_SECTION_SCHEMA_VERSION } },
      { sectionSchemaVersion: { $exists: false } },
    ],
  }).lean();

  for (const doc of v2Docs) {
    const sectionsRaw = (doc.sections ?? {}) as Record<string, string>;
    const needs = documentNeedsSectionMigration({
      sectionSchemaVersion: doc.sectionSchemaVersion as string | undefined,
      sections:             sectionsRaw,
      approvedSections:     doc.approvedSections as string[] | undefined,
    });

    if (!needs) {
      result.v2Skipped++;
      continue;
    }

    const { sections, moves } = remapSectionRecord(
      sectionsRaw,
      LEGACY_V2_SECTION_KEY_MAP,
    );
    const approvedSections = remapApprovedSections(
      doc.approvedSections as string[] | undefined,
      LEGACY_V2_SECTION_KEY_MAP,
    );
    const totalWords = recalculateV2TotalWords(sections);
    const journalNumber = doc.journalNumber;

    console.log(
      `[journal:migrate:v2] ${dryRun ? 'DRY' : 'APPLY'} ${journalNumber}`,
      JSON.stringify({ moves, totalWords }),
    );

    if (!dryRun) {
      const unset: Record<string, 1> = {};
      for (const oldKey of Object.keys(LEGACY_V2_SECTION_KEY_MAP)) {
        unset[`sections.${oldKey}`] = 1;
      }

      await JournalV2Model.updateOne(
        { _id: doc._id },
        {
          $set: {
            sections,
            approvedSections,
            totalWords,
            sectionSchemaVersion: JOURNAL_SECTION_SCHEMA_VERSION,
            updatedAt:            new Date(),
          },
          $unset: unset,
        },
      );
    }

    result.v2Updated++;
    result.v2JournalNumbers.push(journalNumber);
  }

  const chatDocs = await ADAMJournalModel.find({
    status: 'DRAFT',
    $or: [
      { sectionSchemaVersion: { $ne: JOURNAL_SECTION_SCHEMA_VERSION } },
      { sectionSchemaVersion: { $exists: false } },
    ],
  }).lean();

  for (const doc of chatDocs) {
    const draftRaw = (doc.draftSections ?? {}) as Record<string, string>;
    const needs = documentNeedsSectionMigration({
      sectionSchemaVersion: doc.sectionSchemaVersion as string | undefined,
      draftSections:        draftRaw,
      lastCompletedSection: doc.lastCompletedSection as string | undefined,
    });

    if (!needs) {
      result.chatSkipped++;
      continue;
    }

    const { sections: draftSections, moves } = remapSectionRecord(
      draftRaw,
      LEGACY_CHAT_SECTION_KEY_MAP,
    );
    const lastCompletedSection = remapLastCompletedSection(
      doc.lastCompletedSection as string | undefined,
      LEGACY_CHAT_SECTION_KEY_MAP,
    );

    console.log(
      `[journal:migrate:chat] ${dryRun ? 'DRY' : 'APPLY'} ${String(doc._id)}`,
      JSON.stringify({
        topicId: doc.knowledgeTopicId,
        moves,
        lastCompletedSection,
      }),
    );

    if (!dryRun) {
      const unset: Record<string, 1> = {};
      for (const oldKey of Object.keys(LEGACY_CHAT_SECTION_KEY_MAP)) {
        unset[`draftSections.${oldKey}`] = 1;
      }

      await ADAMJournalModel.updateOne(
        { _id: doc._id },
        {
          $set: {
            draftSections,
            ...(lastCompletedSection
              ? { lastCompletedSection }
              : {}),
            sectionSchemaVersion: JOURNAL_SECTION_SCHEMA_VERSION,
            updatedAt:            new Date(),
          },
          $unset: unset,
        },
      );
    }

    result.chatUpdated++;
    result.chatDraftIds.push(String(doc._id));
  }

  return result;
}
