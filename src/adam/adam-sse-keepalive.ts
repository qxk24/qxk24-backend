/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM SSE Keepalive
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

/** SSE comment ping — keeps nginx / mobile NAT from closing idle streams. */
export const ADAM_SSE_KEEPALIVE_MS = 20_000;

export type SseStreamWriter = {
  write: (chunk: string) => unknown;
};

/** Run `work` while sending SSE comment keepalives every 20s. */
export async function withSseKeepalive<T>(
  writer: SseStreamWriter,
  work: () => Promise<T>,
): Promise<T> {
  const timer = setInterval(() => {
    void Promise.resolve(writer.write(': keepalive\n\n')).catch(() => {
      // stream already closed
    });
  }, ADAM_SSE_KEEPALIVE_MS);

  try {
    return await work();
  } finally {
    clearInterval(timer);
  }
}
