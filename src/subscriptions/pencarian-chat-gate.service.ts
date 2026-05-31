/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Pencarian Chat Gate
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

import type { StreamingApi } from 'hono/utils/stream';
import {
  checkPencarianLimit,
  type PencarianCheckResult,
} from './pencarian-tracker.service';
import { loadMessageHistory } from '../adam/adam-chat-session.service';
import { isPencarianTier, type SubscriptionAccess } from './subscription-access.service';

export async function buildSessionHistory(sessionId: string): Promise<string[]> {
  const stored = await loadMessageHistory(sessionId, 40);
  return stored
    .filter((m) => m.role === 'student' || m.role === 'founder')
    .map((m) => m.content)
    .reverse();
}

export async function runPencarianPreCheck(
  userId:         string,
  sessionId:      string,
  messageContent: string,
): Promise<PencarianCheckResult> {
  const sessionHistory = await buildSessionHistory(sessionId);
  return checkPencarianLimit(userId, sessionId, messageContent, sessionHistory);
}

export function pencarianStatusPayload(result: PencarianCheckResult): Record<string, unknown> {
  return {
    messagesUsed:      result.messagesUsed,
    messagesRemaining: result.messagesRemaining,
    totalLimit:        result.totalLimit,
    currentStage:      result.currentStage,
    showWarning:       result.showWarning,
    limitReached:      result.limitReached,
    stageTransition:   result.stageTransition,
    invitePelajar:     result.invitePelajar,
  };
}

export async function streamPencarianClosingTurn(
  s: StreamingApi,
  sessionId: string,
  result: PencarianCheckResult,
): Promise<void> {
  await s.write(
    `event: pencarian_status\ndata: ${JSON.stringify(pencarianStatusPayload(result))}\n\n`,
  );

  if (result.showWarning) {
    await s.write(
      `event: pencarian_warning\ndata: ${JSON.stringify({
        messagesUsed: result.messagesUsed,
        totalLimit:   result.totalLimit,
        message:      'Perjalanan kamu hampir ke penghujung — 20 mesej lagi.',
      })}\n\n`,
    );
  }

  const closing = result.closingMessage ?? 'Perjalanan Pencarian kamu telah mencapai had.';

  await s.write(`event: adam_thinking\ndata: ${JSON.stringify({ sessionId })}\n\n`);
  await s.write(`event: adam_chunk\ndata: ${JSON.stringify({ text: closing })}\n\n`);
  await s.write(
    `event: adam_complete\ndata: ${JSON.stringify({
      sessionId,
      response:  closing,
      judgment:  'ISLAH',
      pencarian: true,
      limitReached: true,
    })}\n\n`,
  );
}

export function shouldRunPencarianGate(access: SubscriptionAccess | null): boolean {
  return Boolean(access && isPencarianTier(access));
}
