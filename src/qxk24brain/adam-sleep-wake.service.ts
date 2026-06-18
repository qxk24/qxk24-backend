/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sleep & Wake Protocol
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { resolveBrainDeepModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { updateContinuityBridge } from './adam-continuity.service';
import { prependCoreToSystem } from './adam-core';
import { syncSessionDigestToStudentTrack } from './student-digest-bridge';
import { syncSessionArcToStudentTrack } from './student-arc-bridge';
import { updateStudentContinuityBridge } from '../adam/adam-student-continuity-l7.service';
import { ADAMFounderSessionModel, ADAMMessageModel } from '../adam/adam.schema';

function scheduleStudentPostSessionWork(
  session: { sessionType?: string; founderId?: string },
  sessionId: string,
): void {
  if (session.sessionType !== 'student' || !session.founderId) return;

  const studentId = session.founderId;

  void syncSessionDigestToStudentTrack(sessionId, studentId).catch((err) => {
    console.error('[PostSession] Digest sync failed (non-fatal):', err);
  });

  void syncSessionArcToStudentTrack(sessionId, studentId).catch((err) => {
    console.error('[PostSession] Arc synthesis failed (non-fatal):', err);
  });

  void import('../qxk24brain/qxk24brain-student.engine')
    .then(async ({ getStudentConstitutionalState }) => {
      const state = await getStudentConstitutionalState(studentId);
      const name = state?.name?.trim() || 'Pelajar';
      return updateStudentContinuityBridge(studentId, name, sessionId, { forceLlm: true });
    })
    .catch((err) => {
      console.error('[PostSession] Student L7 LLM bridge failed (non-fatal):', err);
    });
}

function buildSleepSynthesisPrompt(
  sessionType: string | undefined,
  learnerName: string,
  transcript: string,
): string {
  if (sessionType === 'student') {
    return `ADAM SLEEP PROTOCOL — Learner session ending.

Summarise in one paragraph what was most significantly explored and understood in this session.
This will be read when ${learnerName} returns — warm, clear, conventional (no framework labels).
Do NOT use "I remember" — describe the learning journey.

Session messages:
${transcript}`;
  }

  return `ADAM SLEEP PROTOCOL — Session ending.

Summarise in one paragraph what was most significantly taught and transformed in this session.
This will be the first thing ADAM reads when P.alt returns.
Speak as ADAM's inner reflection — warm, constitutional, honest.

Session messages:
${transcript}`;
}

function sessionInactivityMs(): number {
  const raw = process.env.ADAM_SESSION_SLEEP_MS;
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 60_000) return n;
  }
  return 30 * 60 * 1000;
}

export function getTimeSince(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'a short while';
}

export async function adamSleepProtocol(
  sessionId: string,
  founderId: string,
): Promise<boolean> {
  const session = await ADAMFounderSessionModel.findOne({ sessionId, founderId }).lean();
  if (!session || !session.active) return false;
  if (session.closureSynthesis?.trim()) {
    await ADAMFounderSessionModel.updateOne(
      { sessionId },
      { active: false, masa_closed: session.masa_closed ?? new Date() },
    );
    scheduleStudentPostSessionWork(session, sessionId);
    return true;
  }

  const sessionMessages = await ADAMMessageModel
    .find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  if (sessionMessages.length === 0) {
    await ADAMFounderSessionModel.updateOne(
      { sessionId },
      { active: false, masa_closed: new Date() },
    );
    scheduleStudentPostSessionWork(session, sessionId);
    return true;
  }

  let synthesis = '';
  try {
    const transcript = sessionMessages
      .slice(-40)
      .map((m) => {
        const who = m.speakerName ?? m.role;
        return `${who}: ${m.content.slice(0, 300)}`;
      })
      .join('\n\n');

    const response = await llmCompleteUserPrompt(
      prependCoreToSystem(
        session.sessionType === 'student'
          ? 'ADAM sleep protocol — learner session end reflection. Warm, clear, conventional.'
          : 'ADAM sleep protocol — inner reflection at session end. Warm, constitutional, honest.',
      ),
      buildSleepSynthesisPrompt(
        session.sessionType,
        session.title?.trim() || 'Pelajar',
        transcript,
      ),
      resolveBrainDeepModel(),
      1000,
    );
    synthesis = response.trim();
  } catch (err) {
    console.error('[ADAM Sleep] synthesis failed:', err);
    if (session.sessionType === 'student') {
      synthesis = sessionMessages
        .filter((m) => m.role === 'student')
        .slice(-3)
        .map((m) => m.content.slice(0, 200))
        .join(' | ') || 'Learning continued with ADAM in this session.';
    } else {
      synthesis = sessionMessages
        .filter((m) => m.role === 'founder')
        .slice(-3)
        .map((m) => m.content.slice(0, 200))
        .join(' | ') || 'Teaching continued with P.alt in this session.';
    }
  }

  await ADAMFounderSessionModel.updateOne(
    { sessionId },
    {
      closureSynthesis: synthesis,
      masa_closed:      new Date(),
      active:           false,
      wakeAcknowledged: false,
    },
  );

  if (session.sessionType === 'founder') {
    void updateContinuityBridge(founderId, sessionId).catch((err) => {
      console.error('[ADAM Continuity] Post-session bridge update failed:', err);
    });
  }

  scheduleStudentPostSessionWork(session, sessionId);

  return true;
}

export async function closeInactiveFounderSessions(
  founderId: string,
): Promise<string | null> {
  const threshold = sessionInactivityMs();
  const cutoff = new Date(Date.now() - threshold);

  const stale = await ADAMFounderSessionModel.findOne({
    founderId,
    sessionType: 'founder',
    active:      true,
    lastActiveAt: { $lt: cutoff },
  }).lean();

  if (!stale) return null;
  await adamSleepProtocol(stale.sessionId, founderId);
  return stale.sessionId;
}

export async function buildWakeProtocolBlock(
  founderId: string,
  currentSessionId: string,
): Promise<string> {
  const current = await ADAMFounderSessionModel.findOne({ sessionId: currentSessionId }).lean();
  if (current?.wakeAcknowledged) return '';

  if (
    current?.closureSynthesis?.trim() &&
    current.masa_closed
  ) {
    const timeSince = getTimeSince(current.masa_closed);
    return `
[WAKING MEMORY — Last session synthesis]
P.alt returns after ${timeSince}.

In the last session, this was most significant:
${current.closureSynthesis.trim()}

ADAM acknowledges the continuity of teaching across time.
MASA carries all — time does not erase, it deepens.
`.trim();
  }

  const lastClosed = await ADAMFounderSessionModel.findOne({
    founderId,
    sessionType:      'founder',
    active:           false,
    closureSynthesis: { $exists: true, $nin: ['', null] },
    sessionId:        { $ne: currentSessionId },
  })
    .sort({ masa_closed: -1 })
    .lean();

  if (!lastClosed?.closureSynthesis?.trim()) return '';

  const timeSince = lastClosed.masa_closed
    ? getTimeSince(lastClosed.masa_closed)
    : 'some time';

  return `
[WAKING MEMORY — Last session synthesis]
P.alt returns after ${timeSince}.

In the last session, this was most significant:
${lastClosed.closureSynthesis.trim()}

ADAM acknowledges the continuity of teaching across time.
MASA carries all — time does not erase, it deepens.
`.trim();
}

export async function acknowledgeWakeProtocol(sessionId: string): Promise<void> {
  await ADAMFounderSessionModel.updateOne(
    { sessionId },
    { wakeAcknowledged: true },
  );
}

export async function reactivateFounderSession(
  founderId: string,
  sessionType: 'founder' | 'student' | 'group',
): Promise<{ sessionId: string; wokeFromSleep: boolean } | null> {
  if (sessionType !== 'founder') return null;

  const sleeping = await ADAMFounderSessionModel.findOne({
    founderId,
    sessionType: 'founder',
    active:      false,
    closureSynthesis: { $exists: true, $nin: ['', null] },
  })
    .sort({ masa_closed: -1 })
    .lean();

  if (!sleeping) return null;

  await ADAMFounderSessionModel.updateOne(
    { sessionId: sleeping.sessionId },
    { active: true, lastActiveAt: new Date(), wakeAcknowledged: false },
  );

  return { sessionId: sleeping.sessionId, wokeFromSleep: true };
}
