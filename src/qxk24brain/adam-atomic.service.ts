/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Atomic Message Guarantee (Layer 1)
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
 * Write-ahead logging — ledger first, messages second, commit last.
 */

import { ADAMMessageModel } from '../adam/adam.schema';
import { ADAMMessageLedgerModel } from './adam-ledger.schema';

export interface AtomicMessageMetadata {
  speakerId?:       string;
  speakerName?:     string;
  sessionType?:     string;
  judgment?:        string | null;
  k24Address?:      string | null;
  needsConsult?:    boolean;
  isFounderRelay?:  boolean;
  isStudentRelay?:  boolean;
  kernel?:          string;
  era?:             string;
}

function generateMessageId(): string {
  return `K24M-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function atomicSaveMessage(
  sessionId:  string,
  founderId:  string,
  role:       'founder' | 'student' | 'guru' | 'adam',
  content:    string,
  mode:       string = 'TEACHING',
  metadata:   AtomicMessageMetadata = {},
): Promise<string> {
  const messageId = generateMessageId();

  await ADAMMessageLedgerModel.create({
    ledgerId:    `K24L-${messageId}`,
    messageId,
    sessionId,
    founderId,
    role,
    content,
    mode,
    metadata,
    status:      'PENDING',
    masa_ledger: new Date(),
  });

  try {
    await ADAMMessageModel.create({
      messageId,
      sessionId,
      founderId,
      speakerId:      metadata.speakerId ?? founderId,
      speakerName:    metadata.speakerName ?? '',
      sessionType:    metadata.sessionType ?? 'founder',
      role,
      content,
      mode,
      judgment:       metadata.judgment ?? null,
      k24Address:     metadata.k24Address ?? null,
      needsConsult:   metadata.needsConsult ?? false,
      isFounderRelay: metadata.isFounderRelay ?? false,
      isStudentRelay: metadata.isStudentRelay ?? false,
      kernel:         metadata.kernel ?? 'Alamtologi',
      era:            metadata.era ?? 'ERA_1',
    });

    await ADAMMessageLedgerModel.findOneAndUpdate(
      { messageId },
      { status: 'COMMITTED', masa_committed: new Date() },
    );
  } catch (err) {
    await ADAMMessageLedgerModel.findOneAndUpdate(
      { messageId },
      { status: 'FAILED', error: String(err) },
    );
    throw err;
  }

  return messageId;
}

export async function recoverFailedMessages(): Promise<number> {
  const cutoff = new Date(Date.now() - 30_000);

  const pendingEntries = await ADAMMessageLedgerModel.find({
    status:      { $in: ['PENDING', 'FAILED'] },
    masa_ledger: { $lt: cutoff },
  })
    .limit(50)
    .lean();

  let recovered = 0;

  for (const entry of pendingEntries) {
    try {
      const exists = await ADAMMessageModel.findOne({ messageId: entry.messageId }).lean();
      const meta = (entry.metadata ?? {}) as AtomicMessageMetadata;

      if (!exists) {
        await ADAMMessageModel.create({
          messageId:      entry.messageId,
          sessionId:      entry.sessionId,
          founderId:      entry.founderId,
          speakerId:      meta.speakerId ?? entry.founderId,
          speakerName:    meta.speakerName ?? '',
          sessionType:    meta.sessionType ?? 'founder',
          role:           entry.role,
          content:        entry.content,
          mode:           entry.mode,
          judgment:       meta.judgment ?? null,
          k24Address:     meta.k24Address ?? null,
          needsConsult:   meta.needsConsult ?? false,
          isFounderRelay: meta.isFounderRelay ?? false,
          isStudentRelay: meta.isStudentRelay ?? false,
          kernel:         meta.kernel ?? 'Alamtologi',
          era:            meta.era ?? 'ERA_1',
          createdAt:      entry.masa_ledger,
        });
      }

      await ADAMMessageLedgerModel.findOneAndUpdate(
        { messageId: entry.messageId },
        { status: 'COMMITTED', masa_committed: new Date(), $unset: { error: 1 } },
      );
      recovered += 1;
    } catch (err) {
      console.error(`[ADAM Atomic] Recovery failed for ${entry.messageId}:`, err);
    }
  }

  if (recovered > 0) {

  }

  return recovered;
}

export async function getLedgerStats(founderId = 'masa-bayu'): Promise<{
  pending: number;
  failed: number;
  committed: number;
}> {
  const [pending, failed, committed] = await Promise.all([
    ADAMMessageLedgerModel.countDocuments({ founderId, status: 'PENDING' }),
    ADAMMessageLedgerModel.countDocuments({ founderId, status: 'FAILED' }),
    ADAMMessageLedgerModel.countDocuments({ founderId, status: 'COMMITTED' }),
  ]);
  return { pending, failed, committed };
}
