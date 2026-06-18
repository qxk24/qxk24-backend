/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing — Emotional Signal (S3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

import {
  isAdamLightChatTurn,
  isAdamLifeWellbeingTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamRelationalPersonalTurn,
} from '../../adam-response-generation';
import { isAdamProseCraftTurn } from '../../adam-prose-craft';
import { isAdamCurrentAffairsTurn } from '../../adam-web-search';
import type { AdamAffectiveTone } from '../adam-turn-gate.types';

const GRATITUDE_ASK =
  /\b(?:terima\s+kasih|thank\s+you|thanks|syukran|alhamdulillah|grateful|bersyukur|appreciate)\b/i;

const GRIEF_ASK =
  /\b(?:kehilangan|kematian|meninggal|passed\s+away|grief|duka|berkabung|mourning|lost\s+(?:my|a)\s+(?:mother|father|parent|child|friend))\b/i;

const FRUSTRATION_ASK =
  /\b(?:frustrated|marah|geram|annoyed|salah\s+jawapan|wrong\s+answer|tidak\s+betul|you\s+are\s+wrong|bukan\s+itu|that's\s+incorrect)\b/i;

/** EmotionalSignalReader — relational tone without lane routing. */
export function readEmotionalSignal(message: string): AdamAffectiveTone {
  const t = message.trim();
  if (isAdamProseCraftTurn(t)) return 'prose-craft';
  if (isAdamLightChatTurn(t)) return 'light';
  if (FRUSTRATION_ASK.test(t)) return 'frustrated';
  if (GRIEF_ASK.test(t)) return 'grief';
  if (GRATITUDE_ASK.test(t) && !/\?/.test(t)) return 'grateful';
  if (isAdamPracticalAdvisoryTurn(t)) return 'practical';
  if (isAdamRelationalPersonalTurn(t)) return 'relational';
  if (isAdamLifeWellbeingTurn(t)) return 'stressed';
  if (isAdamCurrentAffairsTurn(t)) return 'substantive';
  return 'substantive';
}

/** Entity correction — user fixes ADAM's fact (EQ situation helper). */
export function isAdamEntityCorrectionTurn(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return /\b(?:salah|wrong|incorrect|bukan\s+itu|sebenarnya|actually|correction|pembetulan|bukan\s+\w+\s+tetapi)\b/i.test(t)
    && /\b(?:itu|that|jawapan|answer|nama|name|tahun|year)\b/i.test(t);
}
