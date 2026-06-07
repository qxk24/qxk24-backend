/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Episodic Append Gate (Kotak 3 / B)
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
 * Kotak 3 accepts lived teaching evidence (B) only — not founder QA chat.
 */

import {
  founderRequestsConstitutionalMirror,
  founderRequestsTeachingSynthesis,
} from '../../adam/adam-founder-teaching-prompts';
import { isAmaBrainV2Enabled } from './ama.config';

export interface EpisodicAppendInput {
  isFounder:       boolean;
  message:         string;
  uploadIds:       string[];
  teachingContext: string;
}

const QA_OPENERS =
  /^(adam,?\s*)?(apakah|bagaimana|kenapa|bolehkah|adakah|what|how|why|ingat tak|do you remember)/i;

/** Founder meta / uat paste — never episodic evidence */
const META_PASTE_MARKERS =
  /\b(Tahap \d|Langkah \d|Lab chat mixed|UJI_AMA|audit episodicLane|deploy-ama-lab|neuro validation siap|42\/42 tests)\b/i;

/**
 * Returns true when Entity B may append to Kotak 3 (LWJ/Kn).
 * Upload / teaching context always qualify; founder QA does not.
 */
export function shouldAppendEpisodicB(input: EpisodicAppendInput): boolean {
  if (!isAmaBrainV2Enabled() || !input.isFounder) return false;

  if (input.uploadIds.length > 0) return true;
  if (input.teachingContext.trim().length > 0) return true;

  const msg = input.message.trim();
  if (!msg) return false;

  if (/FOUNDER TEACHING DATA/i.test(msg)) return true;
  if (META_PASTE_MARKERS.test(msg)) return false;
  if (founderRequestsConstitutionalMirror(msg)) return false;
  if (founderRequestsTeachingSynthesis(msg)) return false;

  if (isFounderQaTurn(msg)) return false;

  // Teaching absorption — substantive founder teaching text (no upload)
  if (msg.length >= 200) return true;

  return false;
}

function isFounderQaTurn(message: string): boolean {
  const msg = message.trim();
  if (msg.length > 320) return false;
  if (/\?\s*$/.test(msg)) return true;
  if (QA_OPENERS.test(msg)) return true;
  return false;
}
