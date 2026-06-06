/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Segment Zod Schemas
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { z } from 'zod';
import type { AmaSegment } from '../ama/ama.types';

const isoTimestamp = z.string().min(1);
const sourceId = z.string().min(1);

export const KrEntrySchema = z.object({
  formula:   z.string().optional(),
  usul:      z.string().optional(),
  algoritma: z.string().optional(),
  timestamp: isoTimestamp,
  sourceId,
});

export const KnEntrySchema = z.object({
  episodeId:    z.string().min(1),
  timestamp:    isoTimestamp,
  emotionTag:   z.string().optional(),
  location:     z.string().optional(),
  audioHash:    z.string().optional(),
  rasaWeight:   z.number().int().min(1).max(10).optional(),
  sourceId,
  evidenceText: z.string().optional(),
});

export const DnEntrySchema = z.object({
  wmLoad:           z.number().min(0).optional(),
  decisionPoint:    z.string().optional(),
  responseLatency:  z.number().min(0).optional(),
  layer5OutputHash: z.string().optional(),
  timestamp:        isoTimestamp,
  sourceId,
});

export const BgEntrySchema = z.object({
  visualScene:   z.string().optional(),
  spatialMap:    z.string().optional(),
  quranImagery:  z.string().optional(),
  latiModuleRef: z.string().optional(),
  timestamp:     isoTimestamp,
  sourceId,
});

export const AsEntrySchema = z.object({
  thetaAlphaCoherence: z.number().min(0).max(1).optional(),
  rsaGain:             z.number().min(0).max(1).optional(),
  hrvSdnn:             z.number().min(0).optional(),
  attentionDuration:   z.number().min(0).optional(),
  timestamp:           isoTimestamp,
  sourceId,
});

export const BhEntrySchema = z.object({
  breathDepthCm:   z.number().min(0).optional(),
  hrvRmssdMs:      z.number().min(0).optional(),
  vagalTone:       z.number().optional(),
  microbiotaScore: z.number().optional(),
  timestamp:       isoTimestamp,
  sourceId,
});

export type KrEntry = z.infer<typeof KrEntrySchema>;
export type KnEntry = z.infer<typeof KnEntrySchema>;
export type DnEntry = z.infer<typeof DnEntrySchema>;
export type BgEntry = z.infer<typeof BgEntrySchema>;
export type AsEntry = z.infer<typeof AsEntrySchema>;
export type BhEntry = z.infer<typeof BhEntrySchema>;

export type SegmentEntry =
  | KrEntry
  | KnEntry
  | DnEntry
  | BgEntry
  | AsEntry
  | BhEntry;

const SCHEMA_MAP = {
  Kr: KrEntrySchema,
  Kn: KnEntrySchema,
  Dn: DnEntrySchema,
  Bg: BgEntrySchema,
  As: AsEntrySchema,
  Bh: BhEntrySchema,
} as const;

export function parseSegmentEntry<S extends AmaSegment>(
  segment: S,
  raw: unknown,
): z.infer<(typeof SCHEMA_MAP)[S]> {
  return SCHEMA_MAP[segment].parse(raw) as z.infer<(typeof SCHEMA_MAP)[S]>;
}

export function safeParseSegmentEntry<S extends AmaSegment>(
  segment: S,
  raw: unknown,
): z.SafeParseReturnType<unknown, z.infer<(typeof SCHEMA_MAP)[S]>> {
  return SCHEMA_MAP[segment].safeParse(raw) as z.SafeParseReturnType<
    unknown,
    z.infer<(typeof SCHEMA_MAP)[S]>
  >;
}
