/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Gateway Client (Plas prescan)
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

import { ENV } from '../config/environments';

export interface PlasPrescanRequest {
  input: string;
  studentId: string;
  sessionId: string;
}

export interface PlasPrescanResponse {
  shortCircuit: boolean;
  sessionId: string;
  displayContent?: string;
  markerDisplay?: string;
  metadata?: {
    constitutionalState?: 0 | 1;
    plasATriggered?: boolean;
    threatCategory?: string;
    form?: string;
  };
  unavailable?: boolean;
  error?: string;
}

function gatewayBaseUrl(): string {
  return ENV.ADAM_GATEWAY_URL.replace(/\/$/, '');
}

/**
 * Point 1 Plas prescan via internal ADAM Gateway HTTP (Path A).
 * Returns null when disabled or gateway unreachable (fail-open unless fail-closed).
 */
export async function fetchPlasPrescan(
  request: PlasPrescanRequest,
): Promise<PlasPrescanResponse | null> {
  if (!ENV.ADAM_GATEWAY_PLAS_ENABLED) return null;

  const url = `${gatewayBaseUrl()}/api/adam/plas/prescan`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.ADAM_GATEWAY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ADAM gateway prescan HTTP ${response.status}`);
    }

    return (await response.json()) as PlasPrescanResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[ADAM Gateway] Plas prescan failed:', message);

    if (ENV.ADAM_GATEWAY_PLAS_FAIL_CLOSED) {
      return {
        shortCircuit: true,
        sessionId: request.sessionId,
        displayContent:
          'Constitutional protection is temporarily unavailable. This turn cannot be processed.',
        markerDisplay: ':= 0 Suspended',
        metadata: { constitutionalState: 0, plasATriggered: true },
        unavailable: true,
        error: message,
      };
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function formatPlasBlockedResponse(prescan: PlasPrescanResponse): string {
  const body =
    prescan.displayContent ??
    'This question cannot be processed constitutionally at this time.';
  const marker = prescan.markerDisplay ?? ':= 0 Suspended';
  if (body.includes(marker)) return body.trim();
  return `${body.trim()}\n\n${marker}`;
}
