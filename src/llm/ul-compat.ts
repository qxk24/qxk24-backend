/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : UL Compatibility Stubs
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Legacy Qwen/DashScope hooks retained as no-ops after Phase 14 purge.
 * ADAM runs 100% deterministic UL — no external LLM provider.
 */

/** @deprecated UL mode — external Qwen provider is never active. */
export function isQwenProvider(): boolean {
  return false;
}

/** @deprecated UL mode — content inspection errors cannot occur without DashScope. */
export function isQwenDataInspectionError(_err: unknown): boolean {
  return false;
}

/** User-facing error message for stream failures (UL mode — no provider-specific text). */
export function friendlyLlmError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/timeout|aborted|network/i.test(msg)) {
    return 'ADAM stream interrupted — please try again.';
  }
  return msg || 'ADAM stream interrupted — constitutional synthesis error.';
}
