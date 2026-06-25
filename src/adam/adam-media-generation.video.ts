/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Generation — Video
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AdamMediaSearchHit } from './adam-media-search';
import type { SSEEventType } from './adam.types';
import {
  buildAdamMediaGenerationPrompt,
  parseRequestedVideoSeconds,
} from './adam-media-generation';
import {
  confirmMediaReservation,
  getMediaQuotaSnapshot,
  mediaQuotaBlockedMessage,
  refundMediaReservation,
  reserveMediaGeneration,
  type MediaQuotaSnapshot,
} from './adam-media-quota.service';
import { mediaMaxVideoSeconds, type MediaQuotaTier } from './adam-media-quota-tier';
import { storeAdamGeneratedVideo } from './adam-generated-media-storage';
import {
  downloadVideoBuffer,
  generateWanxVideoUrl,
  isWanxVideoConfigured,
  snapWanxVideoDuration,
} from './adam-wanx-video.client';
import type { AdamMediaGenerationResult } from './adam-media-generation.service';

function emitVideoProgress(
  onEvent: ((event: SSEEventType, data: string) => void) | undefined,
  payload: {
    prompt:          string;
    taskId?:         string;
    status?:         string;
    poll?:           number;
    durationSeconds: number;
  },
): void {
  onEvent?.(
    'adam_media_generating',
    JSON.stringify({
      kind:            'video',
      prompt:          payload.prompt.slice(0, 120),
      taskId:          payload.taskId,
      status:          payload.status,
      poll:            payload.poll,
      durationSeconds: payload.durationSeconds,
    }),
  );
}

export async function runAdamVideoGeneration(input: {
  userMessage:  string;
  sessionId:    string;
  userId:       string;
  tier:         MediaQuotaTier;
  onEvent?:     (event: SSEEventType, data: string) => void;
}): Promise<AdamMediaGenerationResult> {
  const snap = await getMediaQuotaSnapshot({ userId: input.userId, tier: input.tier });
  const requestedSeconds = parseRequestedVideoSeconds(input.userMessage);
  const billedSeconds = snapWanxVideoDuration(
    Math.min(requestedSeconds, mediaMaxVideoSeconds()),
  );

  const reserve = await reserveMediaGeneration({
    userId:       input.userId,
    tier:         input.tier,
    kind:         'video',
    videoSeconds: billedSeconds,
  });

  if (!reserve.ok || !reserve.reservationId) {
    return {
      hits:           [],
      quotaBlocked:   true,
      quotaSnapshot:  snap,
      blockMessage:   reserve.message ?? mediaQuotaBlockedMessage(snap, 'video'),
      buyCreditGate:  reserve.buyCreditGate,
      registerGate:   reserve.registerGate,
      upgradeGate:    reserve.upgradeGate,
    };
  }

  const reservationId = reserve.reservationId;
  const prompt = buildAdamMediaGenerationPrompt(input.userMessage);

  emitVideoProgress(input.onEvent, {
    prompt,
    status:          'queued',
    durationSeconds: billedSeconds,
  });

  try {
    if (!isWanxVideoConfigured()) {
      await refundMediaReservation(reservationId);
      console.warn('[adam:media-gen] DASHSCOPE_API_KEY not set — video skipped');
      return {
        hits:         [],
        quotaBlocked: false,
        blockMessage: 'AI video generation is not configured on this server yet.',
      };
    }

    const remoteUrl = await generateWanxVideoUrl(
      prompt,
      billedSeconds,
      (progress) => {
        emitVideoProgress(input.onEvent, {
          prompt,
          taskId:          progress.taskId,
          status:          progress.status,
          poll:            progress.poll,
          durationSeconds: billedSeconds,
        });
      },
    );

    if (!remoteUrl) {
      await refundMediaReservation(reservationId);
      return { hits: [], quotaBlocked: false };
    }

    const buffer = await downloadVideoBuffer(remoteUrl);
    if (!buffer) {
      await refundMediaReservation(reservationId);
      return { hits: [], quotaBlocked: false };
    }

    const publicUrl = await storeAdamGeneratedVideo({
      buffer,
      sessionId: input.sessionId,
    });

    if (!publicUrl) {
      await refundMediaReservation(reservationId);
      return { hits: [], quotaBlocked: false };
    }

    await confirmMediaReservation(reservationId);

    const hit: AdamMediaSearchHit = {
      kind:   'video',
      url:    publicUrl,
      title:  prompt.slice(0, 96) || 'AI video',
      source: 'adam_generated',
    };

    return { hits: [hit], quotaBlocked: false, quotaSnapshot: snap };
  } catch (err) {
    await refundMediaReservation(reservationId);
    console.error('[adam:media-gen:video] failed', err);
    return { hits: [], quotaBlocked: false };
  }
}
