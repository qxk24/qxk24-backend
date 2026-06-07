/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Episodic Lane Purge (Founder-approved)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 */

export interface EpisodicLaneEntry {
  timestamp: string;
  family:    string;
  id:        string;
  body:      string;
}

const HEADER_RE = /(?:^|\n\n?)── MASA ([^·]+) · ([^·]+) · ([^\n─]+) ──\n/gm;

export function parseEpisodicLane(text: string): EpisodicLaneEntry[] {
  if (!text?.trim()) return [];

  const markers: Array<{ timestamp: string; family: string; id: string; bodyStart: number; blockStart: number }> = [];
  let match: RegExpExecArray | null;
  HEADER_RE.lastIndex = 0;

  while ((match = HEADER_RE.exec(text)) !== null) {
    markers.push({
      timestamp:  match[1].trim(),
      family:     match[2].trim(),
      id:         match[3].trim(),
      bodyStart:  match.index + match[0].length,
      blockStart: match.index,
    });
  }

  if (markers.length === 0) {
    return [{
      timestamp: '',
      family:    'legacy',
      id:        'pre-ama',
      body:      text.trim(),
    }];
  }

  const entries: EpisodicLaneEntry[] = [];
  for (let i = 0; i < markers.length; i++) {
    const end = i + 1 < markers.length ? markers[i + 1].blockStart : text.length;
    entries.push({
      timestamp: markers[i].timestamp,
      family:    markers[i].family,
      id:        markers[i].id,
      body:      text.slice(markers[i].bodyStart, end).trim(),
    });
  }
  return entries;
}

export function rebuildEpisodicLane(entries: EpisodicLaneEntry[]): string {
  if (!entries.length) return '';
  return entries.map((e) => {
    const header = `── MASA ${e.timestamp} · ${e.family} · ${e.id} ──`;
    return `\n\n${header}\n${e.body}`;
  }).join('').trim();
}

export interface PurgeWindow {
  startIso: string;
  endIso:   string;
}

export function shouldPurgeTestEntry(
  entry: EpisodicLaneEntry,
  window: PurgeWindow,
): boolean {
  if (!entry.id.startsWith('K24B-LOG-')) return false;
  if (!entry.timestamp) return false;
  const ts = Date.parse(entry.timestamp);
  if (Number.isNaN(ts)) return false;
  const start = Date.parse(window.startIso);
  const end = Date.parse(window.endIso);
  return ts >= start && ts <= end;
}

export function purgeEpisodicLaneEntries(
  text: string,
  window: PurgeWindow,
): { kept: EpisodicLaneEntry[]; removed: EpisodicLaneEntry[]; rebuilt: string } {
  const entries = parseEpisodicLane(text);
  const kept: EpisodicLaneEntry[] = [];
  const removed: EpisodicLaneEntry[] = [];

  for (const entry of entries) {
    if (shouldPurgeTestEntry(entry, window)) {
      removed.push(entry);
    } else {
      kept.push(entry);
    }
  }

  return {
    kept,
    removed,
    rebuilt: rebuildEpisodicLane(kept),
  };
}

/** Default purge window — AMA uat chat 2026-06-06 UTC */
export const AMA_UAT_PURGE_WINDOW: PurgeWindow = {
  startIso: '2026-06-06T23:37:00.000Z',
  endIso:   '2026-06-06T23:59:00.000Z',
};
