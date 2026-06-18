/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Sleep & Wake Protocol
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Per-learner sleep/wake — mirror Founder protocol, learner voice.
 */

import { ADAMFounderSessionModel } from './adam.schema';
import {
  acknowledgeWakeProtocol,
  adamSleepProtocol,
  getTimeSince,
} from '../qxk24brain/adam-sleep-wake.service';

function studentSessionInactivityMs(): number {
  const raw = process.env.ADAM_STUDENT_SESSION_SLEEP_MS ?? process.env.ADAM_SESSION_SLEEP_MS;
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 60_000) return n;
  }
  return 30 * 60 * 1000;
}

/** Close stale learner session — sleep synthesis + L7 LLM refresh. */
export async function closeInactiveStudentSessions(
  studentId: string,
): Promise<string | null> {
  if (!studentId?.trim()) return null;

  const threshold = studentSessionInactivityMs();
  const cutoff = new Date(Date.now() - threshold);

  const stale = await ADAMFounderSessionModel.findOne({
    founderId:    studentId,
    sessionType:  'student',
    active:       true,
    lastActiveAt: { $lt: cutoff },
  }).lean();

  if (!stale) return null;
  await adamSleepProtocol(stale.sessionId, studentId);
  return stale.sessionId;
}

/** Wake block when learner returns after a closed session. */
export async function buildStudentWakeProtocolBlock(
  studentId: string,
  studentName: string,
  currentSessionId: string,
): Promise<string> {
  const current = await ADAMFounderSessionModel.findOne({
    sessionId: currentSessionId,
    founderId: studentId,
  }).lean();
  if (current?.wakeAcknowledged) return '';

  const formatBlock = (synthesis: string, timeSince: string) => `
[WAKING CONTEXT — Last learning session]
${studentName.trim() || 'Pelajar'} returns after ${timeSince}.

In the last session, this was most significant:
${synthesis.trim()}

Continue from this journey naturally — use "perjalanan kita" language, not memory metaphors.
`.trim();

  if (current?.closureSynthesis?.trim() && current.masa_closed) {
    return formatBlock(current.closureSynthesis, getTimeSince(current.masa_closed));
  }

  const lastClosed = await ADAMFounderSessionModel.findOne({
    founderId:        studentId,
    sessionType:      'student',
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

  return formatBlock(lastClosed.closureSynthesis, timeSince);
}

export { acknowledgeWakeProtocol as acknowledgeStudentWakeProtocol };
