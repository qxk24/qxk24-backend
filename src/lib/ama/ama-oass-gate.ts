/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA OASS Gate (Controlled Cross-Lane)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * OASS activates only when ALL trigger conditions are met.
 * Corpus callosum analogue — intentional, not automatic.
 */

import type { AmaFlowMode } from './ama.types';
import { AMA_OASS_CONFIDENCE_THRESHOLD } from './ama.types';
import { routeAmaFlow } from './ama-flow.service';
import { isAmaTamatOassEnabled } from './ama.config';

export interface OassTriggerEvaluation {
  active:           boolean;
  temporalMarker:   boolean;
  explicitEmotion:  boolean;
  selfReference:    boolean;
  notTechnical:     boolean;
  founderRecall:    boolean;
  /** 3 of 4 core conditions — flagged for retrospective audit */
  partialMatch:     boolean;
  reasons:          string[];
}

const TEMPORAL_RE =
  /\b(sejak|waktu\s+itu|masa\s+itu|bulan\s+lepas|minggu\s+lepas|hari\s+tu|ketika\s+itu|dulu|semalam|tadi|when\s+we|that\s+time|last\s+(week|month|year))\b/i;

const EMOTION_RE =
  /\b(rasa\s+salah|rasa\s+gelisah|rasa\s+tenang|rasa\s+lega|takut|sedih|gembira|risau|cemas|confused|afraid|worried|peaceful|relieved|rasa\s+macam)\b/i;

const SELF_REF_RE =
  /\b(saya|aku|diri\s+saya|myself|i\s+feel|i\s+felt|i\s+have\s+been)\b/i;

const TECHNICAL_RE =
  /\b(formula|algoritma|berapa|apa\s+definisi|definisi|usul|faktor\s+masa|x\s*=\s*m\s*\/\s*t|what\s+is\s+the\s+definition|calculate|derive)\b/i;

const FOUNDER_RECALL_RE =
  /\b(ingat\s+tak|ingat\s+ke|do\s+you\s+remember|tunjuk\s+data\s+asal|data\s+asal)\b/i;

/** Founder recall bypasses the 4-condition gate — always OASS-eligible */
export function isFounderRecallMessage(message: string): boolean {
  return FOUNDER_RECALL_RE.test(message.trim());
}

/**
 * OASS trigger — ALL four must be true (unless founder recall).
 * Technical questions block OASS even with emotion present.
 */
export function evaluateOassTrigger(message: string): OassTriggerEvaluation {
  const text = message.trim();
  const founderRecall = isFounderRecallMessage(text);

  const temporalMarker  = TEMPORAL_RE.test(text);
  const explicitEmotion = EMOTION_RE.test(text);
  const selfReference   = SELF_REF_RE.test(text);
  const notTechnical    = !TECHNICAL_RE.test(text);

  const coreCount = [temporalMarker, explicitEmotion, selfReference, notTechnical]
    .filter(Boolean).length;

  const partialMatch = coreCount >= 3 && !founderRecall;

  const active = founderRecall
    || (temporalMarker && explicitEmotion && selfReference && notTechnical);

  const reasons: string[] = [];
  if (founderRecall) reasons.push('founder_recall');
  if (temporalMarker) reasons.push('temporal_marker');
  if (explicitEmotion) reasons.push('explicit_emotion');
  if (selfReference) reasons.push('self_reference');
  if (!notTechnical) reasons.push('blocked_technical');
  if (partialMatch) reasons.push('partial_match_audit');

  return {
    active,
    temporalMarker,
    explicitEmotion,
    selfReference,
    notTechnical,
    founderRecall,
    partialMatch,
    reasons,
  };
}

/** Retrospective scan — questions meeting 3/4 conditions need OASS review */
export function needsOassRetrospectiveAudit(message: string): boolean {
  const ev = evaluateOassTrigger(message);
  return ev.partialMatch && !ev.active;
}

export interface OassActivation {
  active:    boolean;
  mode:      AmaFlowMode;
  reasons:   string[];
  trigger:   OassTriggerEvaluation;
}

/**
 * Tahap 3 — OASS activates only on constitutional triggers:
 * - Founder recall (bypass)
 * - Student deep turn (all 4 conditions)
 * - Mixed lane low-confidence fallback (<85%)
 */
export function resolveOassActivation(message: string): OassActivation {
  const trigger = evaluateOassTrigger(message);
  const route = routeAmaFlow(message);
  const reasons = [...trigger.reasons];

  if (!isAmaTamatOassEnabled()) {
    return { active: false, mode: 'OAT', reasons: ['oass_disabled'], trigger };
  }

  if (trigger.active) {
    return { active: true, mode: 'OASS', reasons, trigger };
  }

  if (route.needsOass && route.confidence < AMA_OASS_CONFIDENCE_THRESHOLD) {
    reasons.push('mixed_lane_low_confidence');
    return { active: true, mode: 'OASS', reasons, trigger };
  }

  return { active: false, mode: 'OAT', reasons, trigger };
}
