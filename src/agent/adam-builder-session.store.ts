/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Builder Session Store
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { BuilderSessionRecord } from './adam-builder.types';

const sessions = new Map<string, BuilderSessionRecord>();

const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function saveBuilderSession(record: BuilderSessionRecord): void {
  pruneExpired();
  sessions.set(record.id, { ...record, updatedAt: Date.now() });
}

export function getBuilderSession(sessionId: string): BuilderSessionRecord | null {
  pruneExpired();
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

export function deleteBuilderSession(sessionId: string): void {
  sessions.delete(sessionId);
}
