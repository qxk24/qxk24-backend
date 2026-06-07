/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Plas-B Growth Signal Processor (Direction B)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Reads unprocessed zpd_advancement signals from adam_plas_growth_signals
 * and formats bridge lines for the student's next chat turn.
 */

export const PLAS_GROWTH_SIGNALS_COLLECTION = 'adam_plas_growth_signals';

export const PLAS_COLLECTIONS = {
  growthSignals: PLAS_GROWTH_SIGNALS_COLLECTION,
} as const;

export const ZPD_ADVANCEMENT_SIGNAL = 'zpd_advancement' as const;

export interface GrowthSignalRecord {
  _id?: unknown;
  studentId: string;
  signalType: string;
  currentLevel?: number;
  topicKey?: string;
  masteredCount?: number;
  recordedAt?: Date;
  payload?: {
    currentLevel?: number;
    topicKey?: string;
    masteredCount?: number;
  };
}

export interface GrowthSignalCollection {
  findUnprocessed(studentId: string, limit: number): Promise<GrowthSignalRecord[]>;
  markProcessed(ids: unknown[]): Promise<void>;
}

export function resolveSignalLevel(signal: GrowthSignalRecord): number {
  return signal.currentLevel ?? signal.payload?.currentLevel ?? 1;
}

export function resolveSignalTopicKey(signal: GrowthSignalRecord): string {
  return (signal.topicKey ?? signal.payload?.topicKey ?? '').trim();
}

export function resolveSignalMasteredCount(signal: GrowthSignalRecord): number {
  return signal.masteredCount ?? signal.payload?.masteredCount ?? 0;
}

/** fitra_iman__fitra → Fitra Iman → Fitra */
export function humanizeTopicKey(topicKey: string): string {
  const key = topicKey.trim();
  if (!key) return 'New constitutional topic';

  const [familySlug, nodeSlug] = key.split('__');
  const title = (s: string) =>
    s
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  if (nodeSlug) return `${title(familySlug)} → ${title(nodeSlug)}`;
  return title(key);
}

export function formatZpdAdvancementBridgeLines(signals: GrowthSignalRecord[]): string[] {
  if (!signals.length) return [];

  const lines: string[] = [
    'Plas-B ZPD Advancement (founder-confirmed knowledge — guide this turn):',
    'P.alt has confirmed new constitutional units since the student last spoke.',
    'Follow ZPD GUIDANCE RULE: name what they consolidated; introduce the next concept naturally.',
    '',
  ];

  for (const signal of signals) {
    const topicKey = resolveSignalTopicKey(signal);
    const level = resolveSignalLevel(signal);
    const masteredCount = resolveSignalMasteredCount(signal);
    const label = humanizeTopicKey(topicKey);

    lines.push(`- Topic ready to deepen: ${label}`);
    if (topicKey) lines.push(`  Key: ${topicKey}`);
    lines.push(`  Constitutional level: ${level} of 6`);
    lines.push(`  Mastered topics after confirm: ${masteredCount}`);
    lines.push('');
  }

  lines.push(
    'Do not announce "level up" or "certificate". Let advancement emerge inside the conversation.',
  );

  return lines;
}

export async function consumePendingZpdSignals(
  studentId: string,
  collection: GrowthSignalCollection,
  maxSignals = 3,
): Promise<string[]> {
  const pending = await collection.findUnprocessed(studentId, maxSignals);
  if (!pending.length) return [];

  const ids = pending.map((s) => s._id).filter(Boolean);
  if (ids.length) await collection.markProcessed(ids);

  return formatZpdAdvancementBridgeLines(pending);
}
