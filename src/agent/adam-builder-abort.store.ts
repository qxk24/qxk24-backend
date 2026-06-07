/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Builder Abort Store
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

const controllers = new Map<string, AbortController>();

function sessionIdAliases(sessionId: string): string[] {
  if (sessionId.startsWith('build_')) {
    return [sessionId, sessionId.slice(6)];
  }
  return [sessionId, `build_${sessionId}`];
}

export function createBuilderAbortController(
  sessionId: string,
  aliases: string[] = [],
): AbortController {
  const controller = new AbortController();
  const keys = new Set([sessionId, ...aliases]);
  for (const key of keys) {
    controllers.set(key, controller);
  }
  return controller;
}

export function releaseBuilderAbort(sessionId: string): void {
  const controller = controllers.get(sessionId);
  if (!controller) return;
  for (const [key, ctrl] of controllers.entries()) {
    if (ctrl === controller) controllers.delete(key);
  }
}

export function abortBuilderSession(sessionId: string): boolean {
  for (const id of sessionIdAliases(sessionId)) {
    const controller = controllers.get(id);
    if (controller && !controller.signal.aborted) {
      controller.abort();
      releaseBuilderAbort(id);
      return true;
    }
  }
  return false;
}

export function getBuilderAbortSignal(sessionId: string): AbortSignal | undefined {
  for (const id of sessionIdAliases(sessionId)) {
    const controller = controllers.get(id);
    if (controller) return controller.signal;
  }
  return undefined;
}
