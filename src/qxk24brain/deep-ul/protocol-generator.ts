/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Protocol Generator
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
 */

import { extractSessionKeyframes } from './keyframe-extractor';

export function generateSleepProtocol(
  userName: string,
  sessionSummary: string,
  sessionType?: string,
): string {
  const role = sessionType === 'student' ? 'learner' : 'Founder';
  return [
    `Rest well, ${userName}.`,
    `This ${role} session has been crystallized into memory.`,
    `Key activities: ${sessionSummary.slice(0, 500)}.`,
    'The Universal Operating System will maintain continuity across MASA.',
  ].join(' ');
}

export function generateWakeProtocol(userName: string, lastSessionAgeHours: number): string {
  const timeAgo = lastSessionAgeHours > 24
    ? `${Math.floor(lastSessionAgeHours / 24)} days`
    : `${Math.max(1, Math.floor(lastSessionAgeHours))} hours`;

  return [
    `Welcome back, ${userName}.`,
    `You were last active ${timeAgo} ago.`,
    'Your memory is intact. The Universal Operating System is ready.',
  ].join(' ');
}

export function synthesizeSessionClosure(input: {
  sessionType?: string;
  learnerName: string;
  messages: Array<{ role: string; content: string; speakerName?: string }>;
}): string {
  const keyframes = extractSessionKeyframes(
    input.messages.slice(-10).map((m) => ({
      role: m.role === 'adam' ? 'assistant' as const : 'user' as const,
      content: typeof m.content === 'string' ? m.content : '',
    })),
    3,
  );

  const summary = keyframes.length
    ? keyframes.join(' | ')
    : input.messages.slice(-2).map((m) => m.content.slice(0, 120)).join(' | ')
      || 'Learning continued with ADAM in this session.';

  return generateSleepProtocol(input.learnerName, summary, input.sessionType);
}
