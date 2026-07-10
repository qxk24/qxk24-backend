/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Generation Service
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
  isAdamMediaGenerationTurn,
  userWantsGeneratedVideo,
} from './adam-media-generation';
import { runAdamVideoGeneration } from './adam-media-generation.video';
import {
  confirmMediaReservation,
  getMediaQuotaSnapshot,
  mediaQuotaBlockedMessage,
  refundMediaReservation,
  reserveMediaGeneration,
  type MediaQuotaSnapshot,
} from './adam-media-quota.service';
import {
  isAdamMediaGenerationEnabled,
  type MediaQuotaTier,
} from './adam-media-quota-tier';
import { storeAdamGeneratedImage } from './adam-generated-media-storage';
import {
  isLocalVisionConfigured,
  localVisionEngine,
} from '../qxk24brain/deep-ul/local-vision-engine';

export interface AdamMediaGenerationResult {
  hits:           AdamMediaSearchHit[];
  quotaBlocked:   boolean;
  quotaSnapshot?: MediaQuotaSnapshot;
  blockMessage?:  string;
  buyCreditGate?: boolean;
  registerGate?:  boolean;
  upgradeGate?:   boolean;
}

export function buildPrefetchedGeneratedMediaContextBlock(hits: AdamMediaSearchHit[]): string {
  if (hits.length === 0) return '';

  const lines = hits.map((hit, i) => {
    const label = hit.kind === 'video' ? 'Video' : 'Imej';
    return `${i + 1}. [${label} AI] ${hit.title}\n   URL: ${hit.url}\n   Sumber: ${hit.source}`;
  });

  return `
MEDIA DIJANA AI (ilustrasi — bukan foto empirikal):
- Nyatakan dalam jawapan bahawa ini ilustrasi dijana AI.
- Masukkan tag protokol sahaja:
  <adam-chat-image url="URL" alt="keterangan ringkas" />
  <adam-chat-video url="URL" title="tajuk video" />
${lines.join('\n')}
`.trim();
}

export function buildMediaQuotaBlockedContextBlock(message: string): string {
  return `
MEDIA AI — HAD KUOTA:
- Pengguna minta jana media AI tetapi had bulanan / wallet habis.
- Terangkan dengan lembut (BM/BI mengikut pengguna): ${message}
- Jangan reka URL media. Discovery konvensional masih dibenarkan jika ada dalam konteks carian.
`.trim();
}

export async function runAdamMediaGeneration(input: {
  userMessage:  string;
  sessionId:    string;
  userId:       string;
  tier:         MediaQuotaTier;
  isFounder?:   boolean;
  onEvent?:     (event: SSEEventType, data: string) => void;
}): Promise<AdamMediaGenerationResult> {
  if (!isAdamMediaGenerationEnabled()) {
    return { hits: [], quotaBlocked: false };
  }

  if (!isAdamMediaGenerationTurn(input.userMessage, input.isFounder)) {
    return { hits: [], quotaBlocked: false };
  }

  const wantVideo = userWantsGeneratedVideo(input.userMessage);
  if (wantVideo) {
    return runAdamVideoGeneration({
      userMessage: input.userMessage,
      sessionId:   input.sessionId,
      userId:      input.userId,
      tier:        input.tier,
      onEvent:     input.onEvent,
    });
  }

  const snap = await getMediaQuotaSnapshot({ userId: input.userId, tier: input.tier });
  const reserve = await reserveMediaGeneration({
    userId: input.userId,
    tier:   input.tier,
    kind:   'image',
  });

  if (!reserve.ok || !reserve.reservationId) {
    return {
      hits:           [],
      quotaBlocked:   true,
      quotaSnapshot:  snap,
      blockMessage:   reserve.message ?? mediaQuotaBlockedMessage(snap, 'image'),
      buyCreditGate:  reserve.buyCreditGate,
      registerGate:   reserve.registerGate,
      upgradeGate:    reserve.upgradeGate,
    };
  }

  const reservationId = reserve.reservationId;
  const prompt = buildAdamMediaGenerationPrompt(input.userMessage);

  input.onEvent?.(
    'adam_media_generating',
    JSON.stringify({ kind: 'image', prompt: prompt.slice(0, 120) }),
  );

  try {
    if (!isLocalVisionConfigured()) {
      await refundMediaReservation(reservationId);
      console.warn('[adam:media-gen] ADAM_MEDIA_GENERATION_ENABLED=false — generation skipped');
      return {
        hits:         [],
        quotaBlocked: false,
        blockMessage: 'AI image generation is not enabled on this server yet.',
      };
    }

    const buffer = await localVisionEngine.generateImageBuffer(prompt);
    if (!buffer) {
      await refundMediaReservation(reservationId);
      return { hits: [], quotaBlocked: false };
    }

    const publicUrl = await storeAdamGeneratedImage({
      buffer,
      sessionId: input.sessionId,
    });

    if (!publicUrl) {
      await refundMediaReservation(reservationId);
      return { hits: [], quotaBlocked: false };
    }

    await confirmMediaReservation(reservationId);

    const hit: AdamMediaSearchHit = {
      kind:   'image',
      url:    publicUrl,
      title:  prompt.slice(0, 96) || 'AI illustration',
      source: 'adam_generated',
    };

    return { hits: [hit], quotaBlocked: false, quotaSnapshot: snap };
  } catch (err) {
    await refundMediaReservation(reservationId);
    console.error('[adam:media-gen] failed', err);
    return { hits: [], quotaBlocked: false };
  }
}
