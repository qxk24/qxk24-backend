/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Layer Gate (Layer 1 vs Layer 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Layer 1 (open): chat Q&A only — no journal, book, or app generation.
 * Layer 2 (flag): ADAM Jurnal / Kod — opens after full testing.
 */

import type { StreamingApi } from 'hono/utils/stream';
import type { ADAMChatMode } from '../adam/adam.types';
import { detectServerIntent } from './adam-layer-intent';
import { isLayer2Open, userHasServerAccess } from './adam-server-access.service';
import { serverDisplayName } from './adam-server-pricing.config';
import {
  AdamServerId,
  type LayerGateBlockReason,
  type LayerGateCheckResult,
} from './adam-server.types';

const PLANS_URL = '/plans';

function blockMessage(
  server: AdamServerId,
  reason: LayerGateBlockReason,
  userName?: string,
): string {
  const name = serverDisplayName(server);
  const greet = userName ? `${userName}, ` : '';

  if (reason === 'LAYER2_TESTING') {
    return (
      `Bismillah. ${greet}permintaan anda memerlukan ${name} — server output profesional ADAM. `
      + 'Server ini sedang dalam ujian dalaman dan akan dibuka selepas ujian penuh selesai. '
      + 'Buat masa ini, pada Lapisan 1 saya hanya boleh berbincang dan menjawab soalan dengan anda. '
      + `Lihat pelan di ${PLANS_URL}.`
    );
  }

  if (reason === 'NO_SERVER_SUBSCRIPTION') {
    return (
      `Bismillah. ${greet}untuk menjana ${reasonLabel(server)}, anda perlu melanggan ${name} — `
      + 'langganan berasingan daripada chat percuma. '
      + 'Pada Lapisan 1, saya hanya boleh soal jawab; saya tidak menghasilkan jurnal, buku, atau aplikasi. '
      + `Lihat ${PLANS_URL} untuk pilih server yang sesuai.`
    );
  }

  return (
    `Bismillah. ${greet}pada Lapisan 1 (chat ADAM), saya hanya boleh berbincang dan menjawab soalan — `
    + `saya tidak boleh ${actionLabel(server)} untuk anda. `
    + `Untuk output profesional, langgan ${name} apabila dibuka. `
    + `Butiran di ${PLANS_URL}.`
  );
}

function reasonLabel(server: AdamServerId): string {
  switch (server) {
    case AdamServerId.JURNAL: return 'jurnal akademik';
    case AdamServerId.KOD:    return 'kod dan aplikasi';
    default:                  return 'output ini';
  }
}

function actionLabel(server: AdamServerId): string {
  switch (server) {
    case AdamServerId.JURNAL: return 'menulis atau meneruskan jurnal';
    case AdamServerId.KOD:    return 'membina kod atau aplikasi';
    default:                  return 'menghasilkan output ini';
  }
}

export async function runLayerGatePreCheck(params: {
  userId?:   string;
  message:   string;
  mode?:     ADAMChatMode;
  isFounder: boolean;
  userName?: string;
}): Promise<LayerGateCheckResult> {
  const layer2Enabled = isLayer2Open();

  if (params.isFounder) {
    return {
      allowed:       true,
      server:        null,
      reason:        null,
      message:       null,
      plansUrl:      PLANS_URL,
      layer2Enabled,
      layer2Open:    layer2Enabled,
    };
  }

  const server = detectServerIntent(params.message, params.mode);
  if (!server) {
    return {
      allowed:       true,
      server:        null,
      reason:        null,
      message:       null,
      plansUrl:      PLANS_URL,
      layer2Enabled,
      layer2Open:    layer2Enabled,
    };
  }

  if (!layer2Enabled) {
    return {
      allowed:       false,
      server,
      reason:        'LAYER2_TESTING',
      message:       blockMessage(server, 'LAYER2_TESTING', params.userName),
      plansUrl:      PLANS_URL,
      layer2Enabled: false,
      layer2Open:    false,
    };
  }

  const hasSub = params.userId
    ? await userHasServerAccess(params.userId, server)
    : false;

  if (!hasSub) {
    const reason: LayerGateBlockReason = params.userId
      ? 'NO_SERVER_SUBSCRIPTION'
      : 'LAYER1_CHAT_ONLY';

    return {
      allowed:       false,
      server,
      reason,
      message:       blockMessage(server, reason, params.userName),
      plansUrl:      PLANS_URL,
      layer2Enabled: true,
      layer2Open:    true,
    };
  }

  return {
    allowed:       true,
    server,
    reason:        null,
    message:       null,
    plansUrl:      PLANS_URL,
    layer2Enabled: true,
    layer2Open:    true,
  };
}

export function layerGateStatusPayload(result: LayerGateCheckResult): Record<string, unknown> {
  return {
    allowed:       result.allowed,
    server:        result.server,
    serverSlug:    result.server?.toLowerCase() ?? null,
    reason:        result.reason,
    message:       result.message,
    plansUrl:      result.plansUrl,
    layer2Enabled: result.layer2Enabled,
    layer2Open:    result.layer2Open,
  };
}

export async function streamLayerGateBlockedTurn(
  s: StreamingApi,
  sessionId: string,
  result: LayerGateCheckResult,
): Promise<void> {
  await s.write(
    `event: adam_server_gate\ndata: ${JSON.stringify(layerGateStatusPayload(result))}\n\n`,
  );

  const closing = result.message ?? 'Output ini memerlukan langganan server ADAM.';

  await s.write(`event: adam_thinking\ndata: ${JSON.stringify({ sessionId })}\n\n`);
  await s.write(`event: adam_chunk\ndata: ${JSON.stringify({ text: closing })}\n\n`);
  await s.write(
    `event: adam_complete\ndata: ${JSON.stringify({
      sessionId,
      response:      closing,
      judgment:      'ISLAH',
      layerGate:     true,
      server:        result.server,
      layer2Open:    result.layer2Open,
    })}\n\n`,
  );
}
