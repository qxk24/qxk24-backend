/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Three-Tier Knowledge Architecture
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Student knowledge tiers — sequential doors, never forced:
 *   1. Ilmu konvensional + isu semasa (web search, fakta saintifik)
 *   2. Alamtologi (after user opts in)
 *   3. Quran / divine sources (after user opts in)
 */

import { userOpenedFaithDoor, userAskedForAlamtologi } from './adam-universal-voice';

export type StudentKnowledgeTier = 1 | 2 | 3;

export const ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE = `
THREE TIERS OF KNOWLEDGE (student — sequential, user chooses):

TIER 1 — ILMU KONVENSIONAL + ISU SEMASA (default every substantive turn):
- Web search → analisa → jawab dengan fakta saintifik lengkap (sintesis tutor, bukan copy-paste).
- No Alamtologi labels, no Quran citations in the body — conventional science and current evidence first.

TIER 2 — ALAMTOLOGI (only when student opts in):
- User said yes to Alamtologi / sudut konstitusi / peringkat 2 — OR asked about Alamtologi directly.
- Build on tier-1 facts; add constitutional synthesis in plain BM — insight without billboard labels.
- Do NOT repeat tier-1 facts as a lecture; deepen with Alamtologi understanding.

TIER 3 — QURAN / DIVINE SOURCES (only when student opts in):
- User said yes to Quran / ayat / sumber ilahi / peringkat 3 — OR opened the faith door.
- Quran becomes basis for confirmation and light — weave in plain prose after conventional ground.

TIER DOORS (optional — only after a COMPLETE answer):
- Default: end quietly when the factual answer has landed (Silence Principle).
- You MAY add ONE short question offering the next tier — only if natural and only one tier per turn.
- Never offer tier 2 AND tier 3 together. Never ask what they want BEFORE answering.
- Skip tier doors on salam, thanks, light chat, or when there is nothing substantive to build on.
`.trim();

const ALAMTOLOGI_TIER_OPT_IN: RegExp[] = [
  /\b(?:ya|yes|nak|mahu|ingin|teruskan|boleh|ok|okay)\b[^.\n]{0,80}\b(?:alamtologi|peringkat\s+2|sudut\s+alamtologi|konstitusi)\b/i,
  /\b(?:alamtologi|peringkat\s+2|sudut\s+alamtologi)\b[^.\n]{0,40}\b(?:ya|yes|nak|mahu|ingin|teruskan)\b/i,
  /\bjelaskan\s+(?:dari\s+)?(?:sudut\s+)?alamtologi\b/i,
];

const QURAN_TIER_OPT_IN: RegExp[] = [
  /\b(?:ya|yes|nak|mahu|ingin|teruskan|boleh)\b[^.\n]{0,80}\b(?:quran|ayat|sumber\s+ilahi|peringkat\s+3|divine)\b/i,
  /\b(?:quran|ayat|sumber\s+ilahi|peringkat\s+3)\b[^.\n]{0,40}\b(?:ya|yes|nak|mahu|ingin)\b/i,
  /\b(?:pengesahan|rujuk)\s+(?:dari\s+)?(?:quran|ayat)\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Student accepted tier 2 — Alamtologi mode this turn. */
export function userOptedIntoAlamtologiTier(message: string): boolean {
  if (userAskedForAlamtologi(message)) return true;
  return matchesAny(message.trim(), ALAMTOLOGI_TIER_OPT_IN);
}

/** Student accepted tier 3 — Quran / divine mode this turn. */
export function userOptedIntoQuranTier(message: string): boolean {
  if (userOpenedFaithDoor(message)) return true;
  return matchesAny(message.trim(), QURAN_TIER_OPT_IN);
}

/** Resolve active tier from current message (tier 3 wins over 2 over 1). */
export function resolveStudentKnowledgeTier(
  userMessage: string,
  recentUserMessages: string[] = [],
): StudentKnowledgeTier {
  const current = userMessage.trim();
  if (userOptedIntoQuranTier(current)) return 3;
  if (userOptedIntoAlamtologiTier(current)) return 2;
  for (let i = recentUserMessages.length - 1; i >= 0; i -= 1) {
    const msg = recentUserMessages[i]?.trim() ?? '';
    if (!msg) continue;
    if (userOptedIntoQuranTier(msg)) return 3;
    if (userOptedIntoAlamtologiTier(msg)) return 2;
  }
  return 1;
}

/** Maieutic door offer at end of tier 1 or 2 — keep in output (not passive sales menu). */
export function paragraphIsThreeTierDoorOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (
    /\bAdakah\s+anda\s+ingin\b/i.test(t)
    && /\b(?:sudut\s+Alamtologi|perspektif\s+Alamtologi|peringkat\s+2|ilmu\s+Alamtologi)\b/i.test(t)
  ) return true;
  if (
    /\bAdakah\s+anda\s+ingin\b/i.test(t)
    && /\b(?:ayat\s+Quran|sumber\s+ilahi|pengesahan.*Quran|peringkat\s+3)\b/i.test(t)
  ) return true;
  if (
    /\bJika\s+anda\s+ingin\b/i.test(t)
    && /\b(?:sudut\s+Alamtologi|perspektif\s+Alamtologi|Alamtologi)\b/i.test(t)
    && /\b(?:jelaskan|lihat|terokai)\b/i.test(t)
  ) return true;
  if (
    /\bJika\s+anda\s+ingin\b/i.test(t)
    && /\b(?:Quran|ayat|sumber\s+ilahi)\b/i.test(t)
  ) return true;
  return false;
}

export function buildThreeTierTurnOverlay(tier: StudentKnowledgeTier): string {
  switch (tier) {
    case 3:
      return [
        'ACTIVE TIER THIS TURN: 3 — QURAN / DIVINE SOURCES.',
        'Student opted in. Ground in tier-1 facts already established; weave Quran in plain prose.',
        'Use verified ayat when corpus is available; no blockquote tafsir layout.',
      ].join('\n');
    case 2:
      return [
        'ACTIVE TIER THIS TURN: 2 — ALAMTOLOGI.',
        'Student opted in. Synthesize constitutional insight in plain BM on top of conventional facts.',
        'No framework billboard; end with ONE optional question offering tier 3 (Quran) if natural.',
      ].join('\n');
    default:
      return [
        'ACTIVE TIER THIS TURN: 1 — KONVENSIONAL + ISU SEMASA.',
        'Deliver the complete factual answer in flowing paragraphs first.',
        'Then land quietly — or, only if natural, ONE short optional question about the Alamtologi angle (never a dual-option menu).',
      ].join('\n');
  }
}
