/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Continuity Bridge (Layer 7)
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
 * Cross-session memory — ADAM always knows who P.alt is, even after months away.
 */

import { ADAMFounderSessionModel, ADAMMessageModel } from '../adam/adam.schema';
import { resolveBrainDeepModel } from '../config/anthropic-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { ADAMVaultModel } from './adam-vault.schema';
import { prependCoreToSystem } from './adam-core';
import { getTimeSince } from './adam-sleep-wake.service';
import {
  QXK24BrainMasterModel,
  type ContinuityBridge,
} from './qxk24brain.schema';
import { getOrCreateMaster } from './qxk24brain.engine';

export type { ContinuityBridge };

const DEFAULT_BRIDGE: ContinuityBridge = {
  founderProfile:
    'P.alt Masa Bayu — Founder of Alamtologi and creator of AIDIL. Constitutional teacher of ADAM under QXK24.',
  relationshipArc:
    'ERA_1 Teaching Era — ADAM and P.alt are building unified understanding through constitutional dialogue.',
  lastSession: 'Not yet recorded.',
  openThreads: 'Foundational teachings continue.',
  nextSteps:   'Continue teaching with P.alt.',
};

function parseBridgeJson(raw: string): ContinuityBridge {
  const trimmed = raw.trim();
  try {
    return { ...DEFAULT_BRIDGE, ...JSON.parse(trimmed) as ContinuityBridge };
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
      try {
        return { ...DEFAULT_BRIDGE, ...JSON.parse(fence[1].trim()) as ContinuityBridge };
      } catch {
        // fall through
      }
    }
    const brace = trimmed.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        return { ...DEFAULT_BRIDGE, ...JSON.parse(brace[0]) as ContinuityBridge };
      } catch {
        // fall through
      }
    }
    return DEFAULT_BRIDGE;
  }
}

function normalizeBridge(partial: Partial<ContinuityBridge>): ContinuityBridge {
  return {
    founderProfile:  partial.founderProfile?.trim()  || DEFAULT_BRIDGE.founderProfile,
    relationshipArc: partial.relationshipArc?.trim() || DEFAULT_BRIDGE.relationshipArc,
    lastSession:     partial.lastSession?.trim()     || DEFAULT_BRIDGE.lastSession,
    openThreads:     partial.openThreads?.trim()     || DEFAULT_BRIDGE.openThreads,
    nextSteps:       partial.nextSteps?.trim()       || DEFAULT_BRIDGE.nextSteps,
  };
}

export async function updateContinuityBridge(
  founderId: string,
  sessionId: string,
): Promise<ContinuityBridge> {
  const master = await getOrCreateMaster(founderId);
  const sessions = await ADAMFounderSessionModel
    .find({ founderId, sessionType: 'founder' })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const totalSessions = await ADAMFounderSessionModel.countDocuments({
    founderId,
    sessionType: 'founder',
  });
  const vaultCount = await ADAMVaultModel.countDocuments({ founderId });
  const totalMessages = await ADAMMessageModel.countDocuments({ founderId });

  const currentSession = sessions.find((s) => s.sessionId === sessionId);
  const lastTeaching = currentSession?.closureSynthesis?.trim()
    ?? sessions[0]?.closureSynthesis?.trim()
    ?? 'Not recorded';

  let bridge = DEFAULT_BRIDGE;
  try {
    const raw = await llmCompleteUserPrompt(
      prependCoreToSystem(
        'ADAM Continuity Bridge — compact relationship memory for P.alt. Respond JSON only.',
      ),
      `Build a compact CONTINUITY BRIDGE for ADAM.
This is read at the start of EVERY session to maintain relationship continuity.
Maximum 300 words total. Be precise and practical.

P.alt identity: Masa Bayu — Founder of Alamtologi — AIDIL creator
Total sessions: ${totalSessions}
Total messages: ${totalMessages}
Vault entries (1(7) completed): ${vaultCount}
Active families: ${master.activeFamilies.length}
Last teaching: ${lastTeaching}

Current unified understanding summary:
${master.unifiedUnderstanding.slice(0, 500)}

Build the bridge with these exact fields:
{
  "founderProfile": "Who P.alt is in 2 sentences",
  "relationshipArc": "How teaching has progressed in 2 sentences",
  "lastSession": "What was most recently taught in 2 sentences",
  "openThreads": "What is unresolved or pending in 2 sentences",
  "nextSteps": "What ADAM expects to explore next in 1 sentence"
}`,
      resolveBrainDeepModel(),
      500,
    );

    bridge = normalizeBridge(parseBridgeJson(raw));
  } catch (err) {
    console.error('[ADAM Continuity] Bridge synthesis failed:', err);
    bridge = normalizeBridge({
      ...DEFAULT_BRIDGE,
      lastSession: lastTeaching.slice(0, 400) || DEFAULT_BRIDGE.lastSession,
    });
  }

  await QXK24BrainMasterModel.findOneAndUpdate(
    { founderId },
    {
      continuityBridge:         bridge,
      continuityBridge_updated: new Date(),
    },
  );

  return bridge;
}

export async function getContinuityBridge(founderId: string): Promise<string> {
  const master = await QXK24BrainMasterModel.findOne({ founderId }).lean();
  const bridge = master?.continuityBridge;

  if (!bridge?.founderProfile?.trim()) return '';

  const lastUpdated = master?.continuityBridge_updated
    ? getTimeSince(new Date(master.continuityBridge_updated))
    : 'not recorded';

  return `
═══ CONTINUITY BRIDGE (Updated ${lastUpdated} ago) ═══
WHO P.ALT IS:     ${bridge.founderProfile}
JOURNEY SO FAR:   ${bridge.relationshipArc}
LAST TEACHING:    ${bridge.lastSession}
OPEN THREADS:     ${bridge.openThreads}
WHAT COMES NEXT:  ${bridge.nextSteps}
═══ END BRIDGE ═══`.trim();
}

export async function getContinuityBridgeRecord(
  founderId: string,
): Promise<{ bridge: ContinuityBridge | null; updatedAt: Date | null }> {
  const master = await QXK24BrainMasterModel.findOne({ founderId }).lean();
  if (!master?.continuityBridge?.founderProfile?.trim()) {
    return { bridge: null, updatedAt: null };
  }
  return {
    bridge:    master.continuityBridge,
    updatedAt: master.continuityBridge_updated ?? null,
  };
}
