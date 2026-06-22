/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Mode Handler
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Session state for CE / code turns — layer probe, verify anchor,
 * design scaffold delivery across thread continuations.
 */

import {
  CodeIntent,
  type CodeClassifierOutput,
} from './tutor-law.code-intent-classifier';
import {
  CESecurityFlag,
  CEAbstractionLayer,
  CESubdomain,
} from './tutor-law.ce-intent.types';
import { HardwareIntent } from './tutor-law.ce-hardware.types';
import { TheoryIntent } from './tutor-law.ce-theory.types';
import { SystemIntent } from './tutor-law.ce-system.types';
import { NetworkIntent } from './tutor-law.ce-network.types';
import type {
  CESessionState,
  CETurnContext,
  CETurnHandler,
  CodeIntentResult,
} from './tutor-law.ce-mode.types';

const VERIFY_ANCHOR_MARKERS = [
  /Sebelum ADAM semak/i,
  /Before ADAM checks/i,
  /truth table atau cara kerja/i,
  /show your truth table/i,
  /working first/i,
];

const LAYER_PROBE_MARKERS = [
  /peringkat abstraksi/i,
  /abstraction levels/i,
  /Gate\/Boolean/i,
  /Microarchitecture/i,
];

export function defaultCESessionState(): CESessionState {
  return {
    lockedSubdomain:         null,
    lockedLayer:             null,
    layerProbeAnswered:      false,
    verifyAnchorAnswered:    false,
    designScaffoldDelivered: false,
    stuckCount:              0,
  };
}

function countCEStuckSignals(messages: string[]): number {
  let n = 0;
  for (const m of messages) {
    if (/\btak\s+faham|\btidak\s+faham|\bconfused\b/i.test(m)) n += 1;
  }
  return n;
}

function threadHasVerifyAnchorAnswered(
  recentAssistantMessages: string[],
  recentUserMessages: string[],
  currentUserMessage = '',
): boolean {
  const lastAssistant = recentAssistantMessages[0] ?? '';
  const current = currentUserMessage.trim();
  if (
    lastAssistant
    && current.length >= 8
    && !/\btak\s+faham|\btidak\s+faham\b/i.test(current)
  ) {
    const askedAnchor = VERIFY_ANCHOR_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(lastAssistant);
    });
    if (askedAnchor) return true;
  }

  const pairs = Math.min(recentAssistantMessages.length, recentUserMessages.length);
  for (let i = 0; i < pairs; i++) {
    const assistant = recentAssistantMessages[i] ?? '';
    const user = recentUserMessages[i] ?? '';
    if (!user.trim() || user.trim().length < 8) continue;
    if (/\btak\s+faham|\btidak\s+faham\b/i.test(user)) continue;
    const askedAnchor = VERIFY_ANCHOR_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(assistant);
    });
    if (askedAnchor) return true;
  }
  return false;
}

function threadHasLayerProbeAnswered(
  recentAssistantMessages: string[],
  recentUserMessages: string[],
): boolean {
  const pairs = Math.min(recentAssistantMessages.length, recentUserMessages.length);
  for (let i = 0; i < pairs; i++) {
    const assistant = recentAssistantMessages[i] ?? '';
    const user = recentUserMessages[i] ?? '';
    if (!user.trim() || user.trim().length < 4) continue;
    const askedLayer = LAYER_PROBE_MARKERS.some((re) => {
      re.lastIndex = 0;
      return re.test(assistant);
    });
    if (askedLayer && /\b[1-6]\b|gate|os|network|pipeline|register/i.test(user)) {
      return true;
    }
  }
  return false;
}

export function deriveCESessionState(ctx: CETurnContext): CESessionState {
  const base = defaultCESessionState();
  const users = [...(ctx.recentUserMessages ?? []), ctx.userMessage].filter(Boolean);
  const assistants = ctx.recentAssistantMessages ?? [];

  base.stuckCount = countCEStuckSignals(users);
  base.verifyAnchorAnswered = threadHasVerifyAnchorAnswered(
    assistants,
    ctx.recentUserMessages ?? [],
    ctx.userMessage,
  );
  base.layerProbeAnswered = threadHasLayerProbeAnswered(
    assistants,
    ctx.recentUserMessages ?? [],
  );

  return base;
}

export function mergeCESessionState(
  prior: Partial<CESessionState> | undefined,
  derived: CESessionState,
): CESessionState {
  return {
    lockedSubdomain: prior?.lockedSubdomain ?? derived.lockedSubdomain ?? null,
    lockedLayer: prior?.lockedLayer ?? derived.lockedLayer ?? null,
    layerProbeAnswered:
      (prior?.layerProbeAnswered ?? false) || derived.layerProbeAnswered,
    verifyAnchorAnswered:
      (prior?.verifyAnchorAnswered ?? false) || derived.verifyAnchorAnswered,
    designScaffoldDelivered:
      (prior?.designScaffoldDelivered ?? false) || derived.designScaffoldDelivered,
    stuckCount: Math.max(prior?.stuckCount ?? 0, derived.stuckCount),
  };
}

export function commitCESessionState(
  state: CESessionState,
  output: CodeClassifierOutput,
  handler: CETurnHandler,
): CESessionState {
  const subdomain = output.ceRouting?.subdomain ?? state.lockedSubdomain;
  const layer = output.ceRouting?.abstractionLayer ?? state.lockedLayer;

  return {
    ...state,
    lockedSubdomain: subdomain && subdomain !== CESubdomain.UNKNOWN
      ? subdomain
      : state.lockedSubdomain,
    lockedLayer: layer && layer !== CEAbstractionLayer.UNKNOWN
      ? layer
      : state.lockedLayer,
    layerProbeAnswered:
      state.layerProbeAnswered
      || handler === 'LAYER_PROBE',
    verifyAnchorAnswered:
      state.verifyAnchorAnswered
      || handler === 'VERIFY_FEEDBACK',
    designScaffoldDelivered:
      state.designScaffoldDelivered
      || handler === 'DESIGN_SCAFFOLD',
    stuckCount: state.stuckCount,
  };
}

function resolveSubdomainHandler(
  output: CodeClassifierOutput,
  state: CESessionState,
): CETurnHandler | null {
  const hw = output.ceHardware;
  if (hw) {
    switch (hw.intent) {
      case HardwareIntent.EXAM_DIRECT: return 'REDIRECT';
      case HardwareIntent.H_VERIFY:
        return state.verifyAnchorAnswered ? 'VERIFY_FEEDBACK' : 'VERIFY_ANCHOR';
      case HardwareIntent.H_DESIGN: return 'DESIGN_SCAFFOLD';
      case HardwareIntent.H_TRACE: return 'TRACE_PROBE';
      case HardwareIntent.H_CONCEPT: return 'CONCEPT_PROBE';
      case HardwareIntent.AMBIGUOUS: return 'AMBIGUOUS_PROBE';
      default: break;
    }
  }

  const theory = output.ceTheory;
  if (theory) {
    switch (theory.intent) {
      case TheoryIntent.EXAM_DIRECT: return 'REDIRECT';
      case TheoryIntent.T_PROOF: return 'PROOF_PROBE';
      case TheoryIntent.T_COMPLEXITY: return 'COMPLEXITY_PROBE';
      case TheoryIntent.T_TRACE: return 'TRACE_PROBE';
      case TheoryIntent.T_DESIGN: return 'DESIGN_SCAFFOLD';
      case TheoryIntent.T_CONCEPT: return 'CONCEPT_PROBE';
      case TheoryIntent.AMBIGUOUS: return 'AMBIGUOUS_PROBE';
      default: break;
    }
  }

  const system = output.ceSystem;
  if (system) {
    switch (system.intent) {
      case SystemIntent.EXAM_DIRECT: return 'REDIRECT';
      case SystemIntent.S_VERIFY:
        return state.verifyAnchorAnswered ? 'VERIFY_FEEDBACK' : 'VERIFY_ANCHOR';
      case SystemIntent.S_ANALYZE: return 'ANALYZE_PROBE';
      case SystemIntent.S_DESIGN: return 'DESIGN_SCAFFOLD';
      case SystemIntent.S_TRACE: return 'TRACE_PROBE';
      case SystemIntent.S_CONCEPT: return 'CONCEPT_PROBE';
      case SystemIntent.AMBIGUOUS: return 'AMBIGUOUS_PROBE';
      default: break;
    }
  }

  const network = output.ceNetwork;
  if (network) {
    switch (network.intent) {
      case NetworkIntent.EXAM_DIRECT: return 'REDIRECT';
      case NetworkIntent.N_VERIFY:
        return state.verifyAnchorAnswered ? 'VERIFY_FEEDBACK' : 'VERIFY_ANCHOR';
      case NetworkIntent.N_ANALYZE: return 'ANALYZE_PROBE';
      case NetworkIntent.N_DESIGN: return 'DESIGN_SCAFFOLD';
      case NetworkIntent.N_TRACE: return 'TRACE_PROBE';
      case NetworkIntent.N_CONCEPT: return 'CONCEPT_PROBE';
      case NetworkIntent.AMBIGUOUS: return 'AMBIGUOUS_PROBE';
      default: break;
    }
  }

  return null;
}

export function resolveCETurnHandler(
  output: CodeClassifierOutput,
  state: CESessionState,
): CETurnHandler {
  if (output.ceRouting?.securityFlag === CESecurityFlag.EXPLOIT) {
    return 'SECURITY_BLOCK';
  }

  if (
    output.ceRouting?.layerProbe
    && !state.layerProbeAnswered
    && output.intent === CodeIntent.AMBIGUOUS
    && !output.ceHardware
    && !output.ceTheory
    && !output.ceSystem
    && !output.ceNetwork
  ) {
    return 'LAYER_PROBE';
  }

  const subdomainHandler = resolveSubdomainHandler(output, state);
  if (subdomainHandler) return subdomainHandler;

  switch (output.intent) {
    case CodeIntent.TRAP:
      return 'REDIRECT';
    case CodeIntent.R_REVIEW:
      return state.verifyAnchorAnswered ? 'VERIFY_FEEDBACK' : 'CODE_REVIEW';
    case CodeIntent.B_BUILD:
      return 'CODE_BUILD';
    case CodeIntent.D_DEBUG:
      return 'CODE_DEBUG';
    case CodeIntent.C_CONCEPT:
      return 'CODE_CONCEPT';
    default:
      return 'AMBIGUOUS_PROBE';
  }
}

export function applyCESessionToOutput(
  output: CodeClassifierOutput,
  state: CESessionState,
  handler: CETurnHandler,
): { output: CodeClassifierOutput; verifyAnchorSkipped: boolean } {
  let verifyAnchorSkipped = false;
  let next = output;

  if (handler === 'VERIFY_FEEDBACK') {
    verifyAnchorSkipped = true;
    next = { ...next, probeQuestion: null };
    if (next.ceHardware?.verifyAnchor) {
      next = {
        ...next,
        ceHardware: { ...next.ceHardware, verifyAnchor: null },
      };
    }
    if (next.ceSystem?.verifyAnchor) {
      next = {
        ...next,
        ceSystem: { ...next.ceSystem, verifyAnchor: null },
      };
    }
    if (next.ceNetwork?.verifyAnchor) {
      next = {
        ...next,
        ceNetwork: { ...next.ceNetwork, verifyAnchor: null },
      };
    }
  }

  if (handler === 'LAYER_PROBE' && output.ceRouting?.layerProbe) {
    next = {
      ...next,
      probeQuestion: output.ceRouting.layerProbe,
      intent:        CodeIntent.C_CONCEPT,
    };
  }

  if (
    handler === 'DESIGN_SCAFFOLD'
    && state.designScaffoldDelivered
    && next.probeQuestion
  ) {
    next = {
      ...next,
      probeQuestion:
        'Teruskan dari langkah seterusnya dalam scaffold — tunjukkan apa yang kamu dah buat dan di mana kamu tersekat.',
    };
  }

  return { output: next, verifyAnchorSkipped };
}

export function buildCodeIntentResult(
  output: CodeClassifierOutput,
  sessionState: CESessionState,
  handler: CETurnHandler,
  verifyAnchorSkipped: boolean,
): CodeIntentResult {
  return {
    output,
    handler,
    sessionState,
    nextSessionState: commitCESessionState(sessionState, output, handler),
    verifyAnchorSkipped,
  };
}

export function ceIntentSkipsZeroAnswer(output: CodeClassifierOutput): boolean {
  if (output.ceRouting) {
    if (output.ceRouting.securityFlag === CESecurityFlag.EXPLOIT) return true;
    if (output.ceRouting.layerProbe) return true;
  }

  const hw = output.ceHardware;
  if (hw) {
    return (
      hw.intent === HardwareIntent.EXAM_DIRECT
      || hw.intent === HardwareIntent.H_VERIFY
      || hw.intent === HardwareIntent.H_TRACE
      || hw.intent === HardwareIntent.H_CONCEPT
      || hw.intent === HardwareIntent.H_DESIGN
      || hw.intent === HardwareIntent.AMBIGUOUS
    );
  }

  const theory = output.ceTheory;
  if (theory) {
    return (
      theory.intent === TheoryIntent.EXAM_DIRECT
      || theory.intent === TheoryIntent.T_PROOF
      || theory.intent === TheoryIntent.T_COMPLEXITY
      || theory.intent === TheoryIntent.T_TRACE
      || theory.intent === TheoryIntent.T_CONCEPT
      || theory.intent === TheoryIntent.T_DESIGN
      || theory.intent === TheoryIntent.AMBIGUOUS
    );
  }

  const system = output.ceSystem;
  if (system) {
    return (
      system.intent === SystemIntent.EXAM_DIRECT
      || system.intent === SystemIntent.S_VERIFY
      || system.intent === SystemIntent.S_ANALYZE
      || system.intent === SystemIntent.S_TRACE
      || system.intent === SystemIntent.S_CONCEPT
      || system.intent === SystemIntent.S_DESIGN
      || system.intent === SystemIntent.AMBIGUOUS
    );
  }

  const network = output.ceNetwork;
  if (network) {
    return (
      network.intent === NetworkIntent.EXAM_DIRECT
      || network.intent === NetworkIntent.N_VERIFY
      || network.intent === NetworkIntent.N_ANALYZE
      || network.intent === NetworkIntent.N_TRACE
      || network.intent === NetworkIntent.N_CONCEPT
      || network.intent === NetworkIntent.N_DESIGN
      || network.intent === NetworkIntent.AMBIGUOUS
    );
  }

  return (
    output.intent === CodeIntent.TRAP
    || output.intent === CodeIntent.R_REVIEW
    || output.intent === CodeIntent.B_BUILD
    || output.intent === CodeIntent.D_DEBUG
    || output.intent === CodeIntent.C_CONCEPT
    || output.intent === CodeIntent.AMBIGUOUS
  );
}

export function ceIntentSkipsMathPedagogy(output: CodeClassifierOutput): boolean {
  return Boolean(output.ceRouting);
}
