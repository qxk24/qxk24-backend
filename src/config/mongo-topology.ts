/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : MongoDB Stale Topology Detection
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
 */

/** Atlas migration / election — driver topology out of sync with server. */
export function isStaleTopologyError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const name = error instanceof Error ? error.name.toLowerCase() : '';

  return (
    msg.includes('primary marked stale')
    || msg.includes('electionid')
    || msg.includes('setversion')
    || (msg.includes('topology') && msg.includes('stale'))
    || msg.includes('notprimary')
    || msg.includes('not primary')
    || msg.includes('node is recovering')
    || name.includes('mongoserverselectionerror')
    || name.includes('mongonetworkerror')
  );
}
