/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Session Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  closeInactiveFounderSessions,
  reactivateFounderSession,
} from '../qxk24brain/adam-sleep-wake.service';
import { atomicSaveMessage } from '../qxk24brain/adam-atomic.service';
import { ADAMMessageLedgerModel } from '../qxk24brain/adam-ledger.schema';
import { refreshSessionDigestIfNeeded } from '../qxk24brain/adam-tiered-memory.service';
import { incrementSessionCounts } from '../qxk24brain/adam-unresolved.service';
import {
  ADAMFounderSessionModel,
  ADAMMessageModel,
} from './adam.schema';
import { assertStudentOwnsSession } from './adam-workspace.service';
import {
  FOUNDER_USER_ID,
  GROUP_SESSION_ID,
  type SessionType,
} from './adam-student.types';
import type {
  ADAMChatMessage,
  ADAMChatMode,
  ADAMChatSession,
  ConstitutionalJudgment,
} from './adam.types';

/** Mongoose rejects null/undefined/blank — never persist an empty chat row. */
function requirePersistedContent(
  content: string | undefined | null,
  role: 'founder' | 'student' | 'adam',
): string {
  const trimmed = (content ?? '').trim();
  if (trimmed.length > 0) return trimmed;

  if (role === 'adam') {
    return [
      'Bismillahirahmanirrahim.',
      'P.alt, maaf — pada giliran ini jawapan saya tidak tersimpan.',
      'Sila hantar semula bab itu.',
    ].join(' ');
  }
  if (role === 'founder') {
    return 'P.alt shared teaching material.';
  }
  return '(message)';
}

/** Session id with the most persisted founder messages (legacy fallback only). */
export async function founderSessionIdWithMostMessages(
  founderId = FOUNDER_USER_ID,
): Promise<string | null> {
  const agg = await ADAMMessageModel.aggregate<{ _id: string; count: number }>([
    { $match: { founderId, sessionType: 'founder' } },
    { $group: { _id: '$sessionId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);
  const top = agg[0];
  return top && top.count > 0 ? top._id : null;
}

/** Most recently active founder teaching session — continuity follows lastActiveAt, not total count. */
export async function founderSessionIdMostRecentlyActive(
  founderId = FOUNDER_USER_ID,
): Promise<string | null> {
  const recent = await ADAMFounderSessionModel.findOne({
    founderId,
    sessionType: 'founder',
  })
    .sort({ lastActiveAt: -1, createdAt: -1 })
    .lean();
  return recent?.sessionId ?? null;
}

/** Reuse teaching thread with history — avoid spawning empty sessions after sleep/refresh. */
export async function resolveFounderTeachingSession(
  founderId = FOUNDER_USER_ID,
  preferredSessionId?: string,
): Promise<string> {
  const preferred = preferredSessionId?.trim();
  if (preferred) {
    const doc = await ADAMFounderSessionModel.findOne({
      sessionId: preferred,
      founderId,
      sessionType: 'founder',
    }).lean();
    if (doc) {
      await ADAMFounderSessionModel.updateOne(
        { sessionId: doc.sessionId },
        { active: true, lastActiveAt: new Date(), wakeAcknowledged: false },
      );
      return doc.sessionId;
    }
  }

  const recentId = await founderSessionIdMostRecentlyActive(founderId);
  if (recentId) {
    await ADAMFounderSessionModel.updateOne(
      { sessionId: recentId },
      { active: true, lastActiveAt: new Date(), wakeAcknowledged: false },
    );
    return recentId;
  }

  return getOrCreateSession(founderId, 'founder');
}

export async function getOrCreateSession(
  userId = FOUNDER_USER_ID,
  sessionType: SessionType = 'founder',
): Promise<string> {
  if (sessionType === 'group') {
    return getOrCreateGroupSession();
  }

  if (sessionType === 'founder') {
    const recentId = await founderSessionIdMostRecentlyActive(userId);
    if (recentId) {
      await ADAMFounderSessionModel.updateOne(
        { sessionId: recentId },
        { active: true, lastActiveAt: new Date() },
      );
      return recentId;
    }
    await closeInactiveFounderSessions(userId);
  }

  let session = await ADAMFounderSessionModel.findOne({
    founderId:   userId,
    sessionType,
    active:      true,
  }).sort({ createdAt: 1 });

  if (!session && sessionType === 'founder') {
    const reactivated = await reactivateFounderSession(userId, sessionType);
    if (reactivated) {
      session = await ADAMFounderSessionModel.findOne({
        sessionId: reactivated.sessionId,
      });
    }
  }

  if (!session) {
    const sessionId = `K24s-${sessionType}-${userId}-${Date.now()}`;
    session = await ADAMFounderSessionModel.create({
      sessionId,
      founderId:   userId,
      sessionType,
      kernel:      ENV.QXK24_KERNEL_VERSION,
      era:         ENV.QXK24_ERA,
      active:      true,
      lastActiveAt: new Date(),
    });
    if (sessionType === 'founder') {
      void incrementSessionCounts(userId).catch((err) =>
        console.error('[ADAM Holdings] Session count increment failed:', err),
      );
    }
  } else {
    await ADAMFounderSessionModel.updateOne(
      { sessionId: session.sessionId },
      { lastActiveAt: new Date() },
    );
  }

  return session.sessionId;
}

export async function getOrCreateGroupSession(): Promise<string> {
  let session = await ADAMFounderSessionModel.findOne({
    sessionId: GROUP_SESSION_ID,
    sessionType: 'group',
  });

  if (!session) {
    session = await ADAMFounderSessionModel.create({
      sessionId:   GROUP_SESSION_ID,
      founderId:   'group-alamtologi',
      sessionType: 'group',
      kernel:      ENV.QXK24_KERNEL_VERSION,
      era:         ENV.QXK24_ERA,
      active:      true,
      lastActiveAt: new Date(),
    });
  } else {
    await ADAMFounderSessionModel.updateOne(
      { sessionId: GROUP_SESSION_ID },
      { lastActiveAt: new Date(), active: true },
    );
  }

  return GROUP_SESSION_ID;
}

export async function ensureSession(
  sessionId: string,
  userId = FOUNDER_USER_ID,
  sessionType: SessionType = 'founder',
): Promise<string> {
  const existing = await ADAMFounderSessionModel.findOne({
    sessionId,
    sessionType,
    ...(sessionType === 'group' ? {} : { founderId: userId }),
  });

  if (existing) {
    await ADAMFounderSessionModel.updateOne(
      { sessionId },
      { active: true, lastActiveAt: new Date() },
    );
    return sessionId;
  }

  if (sessionType === 'group') return getOrCreateGroupSession();
  return getOrCreateSession(userId, sessionType);
}

export interface StoredADAMMessage {
  _id:           string;
  sessionId:     string;
  founderId:     string;
  speakerId:     string;
  speakerName:   string;
  sessionType:   SessionType;
  role:          'founder' | 'student' | 'adam';
  content:       string;
  mode:          string;
  judgment:      string | null;
  k24Address:    string | null;
  kernel:        string;
  era:           string;
  isVerified:    boolean;
  needsConsult:   boolean;
  isFounderRelay: boolean;
  isStudentRelay: boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

export async function loadMessageHistory(
  sessionId: string,
  limit = 50,
): Promise<StoredADAMMessage[]> {
  const messages = await ADAMMessageModel.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return [...messages].reverse().map((m) => ({
    _id:           m._id.toString(),
    sessionId:     m.sessionId,
    founderId:     m.founderId,
    speakerId:     m.speakerId ?? m.founderId,
    speakerName:   m.speakerName ?? '',
    sessionType:   (m.sessionType as SessionType) ?? 'founder',
    role:          m.role,
    content:       m.content,
    mode:          m.mode,
    judgment:      m.judgment,
    k24Address:    m.k24Address,
    kernel:        m.kernel,
    era:           m.era,
    isVerified:    m.isVerified,
    needsConsult:   m.needsConsult ?? false,
    isFounderRelay: m.isFounderRelay ?? false,
    isStudentRelay: m.isStudentRelay ?? false,
    createdAt:      m.createdAt,
    updatedAt:      m.updatedAt,
  }));
}

export async function saveMessage(
  sessionId: string,
  role: 'founder' | 'student' | 'adam',
  content: string,
  mode: ADAMChatMode = 'TEACHING',
  judgment?: string,
  k24Address?: string,
  ownerId = FOUNDER_USER_ID,
  meta?: {
    speakerId?:    string;
    speakerName?:  string;
    sessionType?:  SessionType;
    needsConsult?:   boolean;
    isFounderRelay?: boolean;
    isStudentRelay?: boolean;
  },
): Promise<string> {
  const safeContent = requirePersistedContent(content, role);
  if (safeContent !== (content ?? '').trim()) {
    console.warn('[adam:save-message] empty content coerced', {
      sessionId,
      role,
      mode,
      chars: (content ?? '').length,
    });
  }

  const k24MessageId = await atomicSaveMessage(
    sessionId,
    ownerId,
    role,
    safeContent,
    mode,
    {
      speakerId:      meta?.speakerId ?? ownerId,
      speakerName:    meta?.speakerName ?? '',
      sessionType:    meta?.sessionType ?? 'founder',
      judgment:       judgment ?? null,
      k24Address:     k24Address ?? null,
      needsConsult:   meta?.needsConsult ?? false,
      isFounderRelay: meta?.isFounderRelay ?? false,
      isStudentRelay: meta?.isStudentRelay ?? false,
      kernel:         'Alamtologi',
      era:            ENV.QXK24_ERA,
    },
  );

  const doc = await ADAMMessageModel.findOne({ messageId: k24MessageId }).lean();
  if (!doc) {
    throw new Error(`Atomic save committed but message not found: ${k24MessageId}`);
  }

  await ADAMFounderSessionModel.updateOne(
    { sessionId },
    { $inc: { messageCount: 1 }, lastActiveAt: new Date() },
  );

  void refreshSessionDigestIfNeeded(sessionId, ownerId).catch(() => {});

  return doc._id.toString();
}

export async function generateK24Address(mode: ADAMChatMode): Promise<string> {
  const prefix = mode === 'TEACHING' ? 'K24za' : 'K24mb';
  const count = await ADAMMessageModel.countDocuments({ role: 'adam', mode });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

export async function getChatSession(sessionId: string): Promise<ADAMChatSession | null> {
  const session = await ADAMFounderSessionModel.findOne({ sessionId }).lean();
  if (!session) return null;

  const stored = await loadMessageHistory(sessionId, 100);
  const messages: ADAMChatMessage[] = stored.map((m) => ({
    id:          m._id,
    sessionId:   m.sessionId,
    role:        m.role,
    content:     m.content,
    mode:        m.mode as ADAMChatMode,
    judgment:    (m.judgment as ConstitutionalJudgment | null) ?? undefined,
    k24Address:  m.k24Address ?? undefined,
    timestamp:   m.createdAt,
    isVerified:  m.isVerified,
    isSeed:      false,
  }));

  const lastMode = messages.length
    ? messages[messages.length - 1].mode
    : 'TEACHING';

  return {
    id:           session.sessionId,
    mode:         lastMode,
    title:        `Founder session ${session.sessionId}`,
    messages,
    startedAt:    session.createdAt,
    lastActiveAt: session.lastActiveAt,
    isActive:     session.active,
  };
}

export async function listChatSessions(
  _mode?: ADAMChatMode,
  limit = 20,
): Promise<ADAMChatSession[]> {
  const docs = await ADAMFounderSessionModel
    .find({ active: true })
    .sort({ lastActiveAt: -1 })
    .limit(limit)
    .lean();

  const sessions: ADAMChatSession[] = [];
  for (const doc of docs) {
    const session = await getChatSession(doc.sessionId);
    if (session) sessions.push(session);
  }
  return sessions;
}

export async function deleteFounderMessage(
  messageId: string,
  userId = FOUNDER_USER_ID,
): Promise<boolean> {
  const result = await ADAMMessageModel.deleteOne({
    _id:       messageId,
    speakerId: userId,
    role:      { $in: ['founder', 'student'] },
  });
  return result.deletedCount > 0;
}

export async function assertCanClearSessionChat(
  sessionId: string,
  userId: string,
  opts: { isFounder: boolean },
): Promise<void> {
  if (sessionId === GROUP_SESSION_ID) {
    throw new Error('Group chat cannot be cleared.');
  }

  const session = await ADAMFounderSessionModel.findOne({ sessionId }).lean();
  if (session) {
    if (session.sessionType === 'group') {
      throw new Error('Group chat cannot be cleared.');
    }
    if (session.sessionType === 'founder') {
      if (!opts.isFounder) throw new Error('Session access denied.');
      return;
    }
    if (session.sessionType === 'student') {
      if (opts.isFounder || session.founderId === userId) return;
      throw new Error('Session access denied.');
    }
  }

  const allowed = await assertStudentOwnsSession(userId, sessionId);
  if (!allowed) {
    throw new Error('Session access denied.');
  }
}

/** Removes all persisted messages for a session and resets session memory counters. */
export async function clearSessionChatHistory(sessionId: string): Promise<number> {
  const result = await ADAMMessageModel.deleteMany({ sessionId });
  await ADAMMessageLedgerModel.deleteMany({ sessionId }).catch(() => {});

  await ADAMFounderSessionModel.updateOne(
    { sessionId },
    {
      $set: {
        messageCount:       0,
        sessionDigest:      '',
        digestMessageCount: 0,
        wakeAcknowledged:     false,
      },
      $unset: {
        digestUpdatedAt:  '',
        closureSynthesis: '',
        masa_closed:      '',
      },
    },
  );

  return result.deletedCount ?? 0;
}

export async function verifyADAMMessage(
  sessionId: string,
  messageId: string,
): Promise<boolean> {
  const result = await ADAMMessageModel.updateOne(
    { _id: messageId, sessionId, role: 'adam' },
    { $set: { isVerified: true } },
  );
  return result.modifiedCount > 0;
}

export async function createChatSession(
  _mode: ADAMChatMode,
  _title: string,
): Promise<string> {
  return getOrCreateSession('masa-bayu');
}
