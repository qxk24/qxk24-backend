/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge — Record Mapper
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { VerificationAuthority } from './types/verification.types';
import type { TeachingRecord } from './crystalliser';

const QURAN_REF_RE = /Quran\s+(\d{1,3}:\d{1,3})/i;

export function stageToKnowledgeLevel(stage: number): number {
  const clamped = Math.max(1, Math.min(7, stage || 1));
  return Math.min(6, Math.max(1, Math.ceil((clamped / 7) * 6)));
}

export function inferSubRegion(family: string, principle: string): string {
  const f = family.toLowerCase();
  if (/aqidah|iman|tawhid|fitra/i.test(f)) return 'aqidah';
  if (/ibadah|solat|puasa/i.test(f)) return 'ibadah';
  if (/fiqh|hukum/i.test(f)) return 'fiqh';
  if (/alamtologi|aidil|constitutional/i.test(f)) return 'alamtologi';
  if (/nafs|psych|soul/i.test(f)) return 'psychology';
  if (/mal|econom|rizq/i.test(f)) return 'economics';
  if (/nasl|family|marriage/i.test(f)) return 'family';
  if (/health|nafs/i.test(principle.toLowerCase())) return 'health';
  return 'general';
}

export function extractQuranReference(...texts: string[]): string {
  for (const t of texts) {
    const m = t.match(QURAN_REF_RE);
    if (m) return `Quran ${m[1]}`;
  }
  return '';
}

export function inferPrimaryAuthority(
  quranReference: string,
  principle: string,
): VerificationAuthority {
  if (quranReference) return 'quran';
  if (/alamtologi|aidil|constitutional|quran/i.test(principle)) return 'alamtologi';
  return 'alamtologi';
}

/** Map live adam_teaching_records row → crystalliser input */
export function mapAdamTeachingRecord(input: {
  _id: string | { toString(): string };
  recordId: string;
  transformationId: string;
  sessionId?: string;
  founderMessageId?: string;
  principle: string;
  family: string;
  stage: number;
  teachingIntent: string;
  outcomeSummary: string;
  relationalTags?: string[];
  entity_C_uid: string;
  createdAt?: Date;
}): TeachingRecord {
  const teachingIntent = input.teachingIntent.trim();
  const outcomeSummary = input.outcomeSummary.trim();
  const quranReference = extractQuranReference(teachingIntent, outcomeSummary);
  const primaryAuthority = inferPrimaryAuthority(quranReference, input.principle);
  const level = stageToKnowledgeLevel(input.stage);
  const subRegion = inferSubRegion(input.family, input.principle);

  const confidence =
    primaryAuthority === 'quran'
      ? 1.0
      : quranReference
        ? 0.9
        : 0.85;

  return {
    _id: typeof input._id === 'string' ? input._id : input._id.toString(),
    recordId: input.recordId,
    transformationId: input.transformationId,
    sessionId: input.sessionId ?? '',
    founderMessageId: input.founderMessageId ?? '',
    entity_A: `${input.principle} — ${input.family}`,
    entity_B: teachingIntent.slice(0, 2000),
    entity_C: outcomeSummary,
    relationship: 'A + B = C',
    family: input.family,
    subRegion,
    level,
    relationalTags: input.relationalTags ?? [],
    quranReference,
    quranRootTrace: {
      ayah: quranReference.replace(/^Quran\s+/i, '') || '6:38',
      text: outcomeSummary.slice(0, 280) || teachingIntent.slice(0, 280),
      principle: input.principle,
      traceReason: `Founder teaching transformation ${input.transformationId}`,
      tracedBy: primaryAuthority === 'quran' ? 'quran' : 'alamtologi',
      confidence,
    },
    confidenceScore: confidence,
    primaryAuthority,
    entity_C_uid: input.entity_C_uid,
    createdAt: input.createdAt ?? new Date(),
  };
}
