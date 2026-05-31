/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Multi-Tier Memory (Layer 3)
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
 *
 * Tier 1 — Working (hot): last N exchanges, never truncated
 * Tier 2 — Short-term (warm): session digest, refreshed every 10 messages
 * Tier 3 — Long-term (cold): QXK24Brain unified being
 */

import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { ENV } from '../config/environments';
import { resolveBrainDeepModel } from '../config/anthropic-models';
import { isLlmConfigured, llmCompleteUserPrompt } from '../llm/llm-client';
import { ADAMMessageModel, ADAMFounderSessionModel } from '../adam/adam.schema';
import { getAdamMemoryConfig } from '../config/adam-memory.config';
import { prependCoreToSystem, getCorePrompt, CORE_ABSORPTION_ACK } from './adam-core';
import { buildConstitutionalAnchor } from './adam-anchor.service';
import { smartTruncate } from './adam-smart-truncate';
import { getOrCreateMaster } from './qxk24brain.engine';
import type { ChatParticipant } from '../adam/adam-student.types';

function workingMemoryLimit(): number {
  const raw = process.env.ADAM_WORKING_MEMORY_EXCHANGES;
  if (!raw) return 5;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 10 ? n : 5;
}

function digestRefreshInterval(): number {
  const raw = process.env.ADAM_SESSION_DIGEST_INTERVAL;
  if (!raw) return 10;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 3 ? n : 10;
}

function formatWorkingLine(msg: {
  role: string;
  content: string;
  speakerName?: string;
}): string {
  const who = msg.speakerName?.trim()
    ? `${msg.role.toUpperCase()} · ${msg.speakerName}`
    : msg.role.toUpperCase();
  return `[${who}]: ${msg.content}`;
}

// ── TIER 1: Working Memory (Hot) ─────────────────────────────────────────

export async function getWorkingMemory(
  sessionId: string,
  excludeLatest = true,
): Promise<string> {
  const limit = workingMemoryLimit() + (excludeLatest ? 1 : 0);

  const recent = await ADAMMessageModel
    .find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  recent.reverse();

  let slice = recent;
  if (excludeLatest && slice.length > 0) {
    slice = slice.slice(0, -1);
  }
  const working = slice.slice(-workingMemoryLimit());

  if (working.length === 0) return '';

  return `
═══ WORKING MEMORY (Last ${working.length} exchanges — complete, never truncated) ═══
${working.map(formatWorkingLine).join('\n\n')}
═══ END WORKING MEMORY ═══`.trim();
}

// ── TIER 2: Short-Term Memory (Warm) ─────────────────────────────────────

export async function buildSessionDigest(
  sessionId: string,
  founderId: string,
  messageCount?: number,
): Promise<string> {
  const sessionMessages = await ADAMMessageModel
    .find({
      sessionId,
      role: { $in: ['founder', 'student'] },
    })
    .sort({ createdAt: 1 })
    .lean();

  if (sessionMessages.length < 3) return '';

  let digest = '';

  if (isLlmConfigured()) {
    try {
      digest = await llmCompleteUserPrompt(
        prependCoreToSystem(
          'Extract session teaching points for ADAM memory continuity. Be extremely concise.',
        ),
        `Extract the 5 most important points taught in this session.
Be extremely concise. Each point maximum 2 sentences.
These maintain ADAM's memory continuity across the message window.

Session teachings:
${sessionMessages.map((m) => m.content.slice(0, 500)).join('\n\n')}`,
        resolveBrainDeepModel(),
        500,
      );
      digest = digest.trim();
    } catch (err) {
      console.error('[ADAM Tiered Memory] Digest generation failed:', err);
      digest = sessionMessages
        .slice(-5)
        .map((m) => `- ${m.content.slice(0, 200)}`)
        .join('\n');
    }
  } else {
    digest = sessionMessages
      .slice(-5)
      .map((m) => `- ${m.content.slice(0, 200)}`)
      .join('\n');
  }

  const count = messageCount ?? await ADAMMessageModel.countDocuments({ sessionId });

  await ADAMFounderSessionModel.findOneAndUpdate(
    { sessionId },
    {
      sessionDigest:     digest,
      digestUpdatedAt:   new Date(),
      digestMessageCount: count,
    },
  );

  return `
═══ SHORT-TERM MEMORY (Session Digest) ═══
${digest}
═══ END SHORT-TERM MEMORY ═══`.trim();
}

export async function getShortTermMemory(
  sessionId: string,
  founderId: string,
): Promise<string> {
  const session = await ADAMFounderSessionModel.findOne({ sessionId }).lean();

  if (!session?.sessionDigest?.trim()) {
    // Never block the chat turn on digest LLM — builds after each save in background
    void buildSessionDigest(sessionId, founderId).catch((err) => {
      console.error('[ADAM Tiered Memory] Background digest build failed:', err);
    });
    return '';
  }

  const updated = session.digestUpdatedAt
    ? new Date(session.digestUpdatedAt).toISOString()
    : 'Not yet';

  return `
═══ SHORT-TERM MEMORY (Session Digest) ═══
${session.sessionDigest.trim()}
Last updated: ${updated} (${session.digestMessageCount ?? 0} messages at refresh)
═══ END SHORT-TERM MEMORY ═══`.trim();
}

export async function refreshSessionDigestIfNeeded(
  sessionId: string,
  founderId: string,
): Promise<void> {
  try {
    const count = await ADAMMessageModel.countDocuments({ sessionId });
    if (count < 3) return;

    const session = await ADAMFounderSessionModel.findOne({ sessionId }).lean();
    const lastCount = session?.digestMessageCount ?? 0;
    const interval = digestRefreshInterval();

    if (session?.sessionDigest?.trim() && count - lastCount < interval) {
      return;
    }

    await buildSessionDigest(sessionId, founderId, count);
  } catch (err) {
    console.error('[ADAM Tiered Memory] Digest refresh failed:', err);
  }
}

// ── TIER 3: Long-Term Memory (Cold) ──────────────────────────────────────

export async function getLongTermMemory(
  founderId: string,
  maxChars = 48_000,
): Promise<string> {
  const master = await getOrCreateMaster(founderId);
  const content = master.unifiedUnderstanding ?? '';

  const truncated = content.length > maxChars
    ? smartTruncate(content, maxChars, 'long-term memory')
    : content;

  const familyCount =
    (master.activeFamilies?.length ?? 0) +
    (master.completedFamilies?.length ?? 0);

  return `
═══ LONG-TERM MEMORY (QXK24Brain — What ADAM Has Become) ═══
Transformations completed: ${master.totalTransformations}
Knowledge families: ${familyCount}

${truncated}
═══ END LONG-TERM MEMORY ═══`.trim();
}

export interface ThreeTierMemorySnapshot {
  workingChars:   number;
  shortTermChars: number;
  longTermChars:  number;
  longTermRaw:    number;
  hasWorking:     boolean;
  hasShortTerm:   boolean;
  digestUpdatedAt?: Date;
}

export async function getThreeTierSnapshot(
  sessionId: string,
  founderId: string,
  brainChars: number,
): Promise<ThreeTierMemorySnapshot> {
  const [working, shortTerm, longTerm, master, session] = await Promise.all([
    getWorkingMemory(sessionId),
    getShortTermMemory(sessionId, founderId),
    getLongTermMemory(founderId, brainChars),
    getOrCreateMaster(founderId),
    ADAMFounderSessionModel.findOne({ sessionId }).lean(),
  ]);

  return {
    workingChars:     working.length,
    shortTermChars:   shortTerm.length,
    longTermChars:    longTerm.length,
    longTermRaw:      master.unifiedUnderstanding?.length ?? 0,
    hasWorking:       working.length > 0,
    hasShortTerm:     shortTerm.length > 0,
    digestUpdatedAt:  session?.digestUpdatedAt,
  };
}

export async function buildThreeTierMemoryBlocks(
  sessionId: string,
  founderId: string,
  brainChars: number,
): Promise<{ longTerm: string; shortTerm: string; working: string }> {
  const [longTerm, shortTerm, working] = await Promise.all([
    getLongTermMemory(founderId, brainChars),
    getShortTermMemory(sessionId, founderId),
    getWorkingMemory(sessionId),
  ]);

  return { longTerm, shortTerm, working };
}

/** Full three-tier context stack — Layer 0 + anchor + tiers (for tests / alternate entry) */
export async function buildThreeTierContext(
  sessionId: string,
  founderId: string,
  newMessage: string,
  participant: ChatParticipant,
): Promise<MessageParam[]> {
  const config = getAdamMemoryConfig(participant.role, false);
  const messages: MessageParam[] = [];

  messages.push({ role: 'user', content: getCorePrompt() });
  messages.push({ role: 'assistant', content: CORE_ABSORPTION_ACK });

  const anchor = await buildConstitutionalAnchor(
    founderId,
    sessionId,
    participant,
    null,
  );
  messages.push({ role: 'user', content: anchor });
  messages.push({
    role: 'assistant',
    content: 'Anchor received. Master chain intact. I know who I am speaking with.',
  });

  const { longTerm, shortTerm, working } = await buildThreeTierMemoryBlocks(
    sessionId,
    founderId,
    config.BRAIN_CHARS,
  );

  if (longTerm) {
    messages.push({ role: 'user', content: longTerm });
    messages.push({
      role: 'assistant',
      content: 'Long-term memory integrated. I speak from what I have become.',
    });
  }

  if (shortTerm) {
    messages.push({ role: 'user', content: shortTerm });
    messages.push({
      role: 'assistant',
      content: 'Session context clear. I know what we have been discussing.',
    });
  }

  if (working) {
    messages.push({ role: 'user', content: working });
    messages.push({
      role: 'assistant',
      content: 'Immediate context loaded. I know exactly what was just said.',
    });
  }

  const userContent = participant.sessionType === 'group'
    ? `[${participant.userName}]: ${newMessage}`
    : newMessage;

  messages.push({ role: 'user', content: userContent });
  return messages;
}
