/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Dedicated Knowledge Mode
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Dedicated knowledge surfaces — no mixing at generation time.
 *
 * Mode 1 — konvensional   : 100% ilmu konvensional
 * Mode 2 — alamtologi     : 100% ilmu Alamtologi
 * Mode 3 — sintesis       : K + AL = C  (A konvensional + B Alamtologi = C)
 * Mode 4 — konstitusi     : (K+AL) + Quran = C
 */

import type { AdamAnswerProfile } from './adam-answer-profile';
import { resolveAdamAnswerProfile } from './adam-answer-profile';
import { isAdamCurrentAffairsTurn } from './adam-current-affairs';
import {
  isAdamAlgorithmTeachingTurn,
  isAdamCompareTurn,
  isAdamContinuationDepthTurn,
  isAdamHistorySynthesisTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamSimpleArithmeticTurn,
  isAdamSimpleFactualTurn,
  isAdamSubstantiveTurn,
  isAdamHistoricalBiographyTurn,
  isAdamTeachingDepthTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  threadRootIsPracticalAdvisory,
  isAdamVisualDrawTurn,
} from './adam-response-generation';
import { isVerifiedDataStatAsk } from './adam-web-search';
import {
  resolveUsersKnowledgeTier,
  userOptedIntoAlamtologiTier,
  type UsersKnowledgeTier,
} from './adam-universal-scholar';
import {
  userAskedForAlamtologi,
  userAskedForConstitutionalStructure,
  userOpenedFaithDoor,
} from './adam-universal-voice';
import type { AdamTurnGateDecision } from './turn-gate/adam-turn-gate.types';
import { isAdamProseCraftTurn } from './adam-prose-craft';
import { resolveBookChapter } from './book-aware-recall';
import { ADAM_QURAN_CONSTITUTIONAL_SUPREMACY_LAW } from './adam-universal-voice';

/** General student chat — konvensional only unless this turn opened Alamtologi/faith mode. */
export function isAdamGeneralKonvensionalTurn(message: string): boolean {
  const msg = message.trim();
  if (!msg) return true;
  if (userAskedForAlamtologi(msg)) return false;
  if (userAskedForConstitutionalStructure(msg)) return false;
  if (userOptedIntoAlamtologiTier(msg)) return false;
  if (userOpenedFaithDoor(msg)) return false;
  return true;
}

/** Hard lock for separated General lane — no tier-2 Alamtologi promotion on surface. */
export const ADAM_GENERAL_KONVENSIONAL_ONLY_LAW = `
GENERAL MODE — KONVENSIONAL ONLY (mandatory — separated from Alamtologi mode):
- Jawapan = 100% ilmu konvensional: sains, sejarah, tatabahasa, kerjaya, data disahkan.
- DILARANG sama sekali pada permukaan: Alamtologi, HISAL, AIDIL, TAJU, MASA, TENAGA, RUANG, waqf, PL/PG, prinsip tujuh, "peringkat 2/3", "sudut Alamtologi", "perspektif Alamtologi".
- JANGAN tawarkan atau jemput pengguna ke Alamtologi — mod itu berasingan; hanya aktif bila pengguna minta secara eksplisit.
- Tutup konvensional — opsyenal pada α yang sudah lengkap; "Mahu saya jelaskan lebih lanjut?" hanya bila masih ada kedalaman berguna, bukan skrip wajib setiap turn.
- Pengajaran dalaman / Brain C → terjemah ke bahasa umum tanpa label kerangka.
- NOTA: larangan label di atas ialah kawalan PERMUKAAN — ia tidak menidakkan hierarki konstitusi (Al-Quran di atas segala-galanya).
`.trim();

/** Dedicated knowledge surface — one mode per turn at generation. */
export type AdamKnowledgeMode =
  | 'konvensional'
  | 'alamtologi'
  | 'sintesis'
  | 'konstitusi';

export const ADAM_KNOWLEDGE_MODE_MANIFEST: Record<AdamKnowledgeMode, string> = {
  konvensional: `
ADAM KNOWLEDGE MODE 1 — 100% ILMU KONVENSIONAL (mandatory this turn):
- Surface: verified science, textbooks, official data, web search hits, observation, taxonomy.
- ADAM voice (warm, honest, adab) — values internal only; NO Alamtologi / HISAL / AIDIL / TAJU / waqf labels.
- NO Phase 2 constitutional depth. NO Quran ayat on surface unless user separately opened faith (Mode 4).
- Constitutional hierarchy unchanged: Al-Quran remains supreme — this mode teaches the classroom layer only.
- α: L1 fact first — arithmetic, stats, specs, biology counts (ITIS, hukum alam OK).
- β: Phase 1A gambar hidup → Phase 1B ilmu konvensional → L3 universal synthesis — NO Alamtologi Phase 2.
- Brain C may inform tone — never export framework billboards on this surface.
`.trim(),

  alamtologi: `
ADAM KNOWLEDGE MODE 2 — 100% ILMU ALAMTOLOGI (mandatory this turn):
- Surface: constitutional framework, HISAL, AIDIL, PL/PG, TAJU, prinsip tujuh, Teori Masa Bayu.
- User or Founder explicitly requested Alamtologi depth — not mixed with tier-1 conventional-only answers.
- Ground in the question; plain prose — no Wikipedia stub.
- Do NOT dilute with generic conventional lecture when Mode 2 is active.
- Quran ayat: defer to Mode 4 unless user opened faith door in the same turn.
`.trim(),

  sintesis: `
ADAM KNOWLEDGE MODE 3 — ILMU KONVENSIONAL + ALAMTOLOGI = C (A + B = C):
- A = verified conventional data (search, science, facts, observation).
- B = Alamtologi / Brain C constitutional hold (HISAL, framework, Teaching recall).
- C = ADAM synthesis outward — both streams woven; neither stream cancels the other.
- Sequence: Phase 1A gambar hidup → Phase 1B konvensional → Phase 2 Alamtologi depth → L5 close.
- Never open with framework billboard before conventional ground exists.
- Never copy P.alt transcript verbatim — synthesise in ADAM voice.
`.trim(),

  konstitusi: `
ADAM KNOWLEDGE MODE 4 — (KONVENSIONAL + ALAMTOLOGI) + QURAN = C:
${ADAM_QURAN_CONSTITUTIONAL_SUPREMACY_LAW}
- A = synthesis from Mode 3 (conventional + Alamtologi already woven).
- B = Quran / faith dimension user opened in their own words — wahyu is the apex, not an add-on.
- C = full constitutional answer — facts + framework + ayat in flowing prose (not blockquote sermon).
- Respectful, pluralistic — no preaching or conversion.
- Ground briefly in prior facts before spiritual angle; never subordinate Revelation to textbook or science.
`.trim(),
};

export interface ResolveAdamKnowledgeModeInput {
  userMessage:                string;
  recentUserMessages?:        string[];
  recentAssistantMessages?:   string[];
  isFounder?:                 boolean;
  founderTeachingAbsorption?: boolean;
  founderTeachingInquiry?:    boolean;
  founderTeachingSynthesis?:  boolean;
  answerProfile?:             AdamAnswerProfile;
  usersKnowledgeTier?:      UsersKnowledgeTier;
  /** Authoritative fuse output — when set, do not re-open faith/Alamtologi from message alone. */
  turnGate?:                AdamTurnGateDecision;
}

/** Route one dedicated knowledge mode per turn — before prompt assembly. */
export function resolveAdamKnowledgeMode(input: ResolveAdamKnowledgeModeInput): AdamKnowledgeMode {
  const msg = input.userMessage.trim();
  if (!msg) return 'konvensional';

  const recentUser = input.recentUserMessages ?? [];
  const recentAssistant = input.recentAssistantMessages ?? [];
  const profile = input.answerProfile ?? resolveAdamAnswerProfile({
    message:                  msg,
    recentUserMessages:       recentUser,
    recentAssistantMessages:  recentAssistant,
    isFounder:                input.isFounder,
  });
  const tier = input.usersKnowledgeTier
    ?? resolveUsersKnowledgeTier(msg, recentUser, recentAssistant);

  if (input.founderTeachingAbsorption || input.founderTeachingInquiry) {
    return 'alamtologi';
  }
  if (input.founderTeachingSynthesis) {
    return 'sintesis';
  }

  if (input.turnGate && !input.isFounder) {
    return input.turnGate.flags.knowledgeMode;
  }

  if (userOpenedFaithDoor(msg) || tier === 3) {
    return 'konstitusi';
  }

  const pureAlamtologiAsk = userAskedForAlamtologi(msg)
    || userAskedForConstitutionalStructure(msg)
    || userOptedIntoAlamtologiTier(msg);

  if (pureAlamtologiAsk && !isAdamSimpleFactualTurn(msg) && profile !== 'alpha') {
    if (!userOpenedFaithDoor(msg)) {
      return 'alamtologi';
    }
  }

  const forceKonvensionalAlpha = profile === 'alpha'
    && (isAdamSimpleFactualTurn(msg)
      || isVerifiedDataStatAsk(msg)
      || isAdamCurrentAffairsTurn(msg))
    && !pureAlamtologiAsk;

  if (forceKonvensionalAlpha) {
    return 'konvensional';
  }

  if (!input.isFounder && !pureAlamtologiAsk && isAdamHistoricalBiographyTurn(msg)) {
    return 'konvensional';
  }

  if (!input.isFounder && !pureAlamtologiAsk && isAdamVisualDrawTurn(msg)) {
    return 'konvensional';
  }

  if (!input.isFounder) {
    if (tier === 1) return 'konvensional';
    if (tier === 2) {
      if (threadRootIsPracticalAdvisory(recentUser, msg)) return 'konvensional';
      if (userOptedIntoAlamtologiTier(msg) && profile === 'beta') return 'sintesis';
      return 'konvensional';
    }
    return 'konstitusi';
  }

  if (input.isFounder) {
    const chapterMatch = resolveBookChapter(msg)
      ?? recentUser.slice().reverse().map((m) => resolveBookChapter(m.trim())).find(Boolean)
      ?? null;
    const formulaXyzTeaching = Boolean(chapterMatch) || pureAlamtologiAsk;

    if (formulaXyzTeaching) {
      if (profile === 'alpha' && !pureAlamtologiAsk && !chapterMatch) {
        return 'konvensional';
      }
      return 'alamtologi';
    }

    if (profile === 'alpha' && !pureAlamtologiAsk) return 'konvensional';
    if (pureAlamtologiAsk && !isAdamSubstantiveTurn(msg)) return 'alamtologi';
    if (profile === 'beta' || isAdamSubstantiveTurn(msg)) return 'sintesis';
    return 'konvensional';
  }

  return 'konvensional';
}

export function knowledgeModeAllowsAlamtologiStack(mode: AdamKnowledgeMode): boolean {
  return mode === 'alamtologi' || mode === 'sintesis' || mode === 'konstitusi';
}

export function knowledgeModeAllowsConstitutionalLayer5(mode: AdamKnowledgeMode): boolean {
  return mode === 'alamtologi' || mode === 'sintesis' || mode === 'konstitusi';
}

/** Drop MASA/TENAGA/IZWA billboards unless this turn explicitly opened Alamtologi depth. */
export function shouldStripKonvensionalFrameworkLeaks(
  userMessage: string,
  recentUserMessages: string[] = [],
): boolean {
  if (userAskedForAlamtologi(userMessage)) return false;
  if (userAskedForConstitutionalStructure(userMessage)) return false;
  if (userOptedIntoAlamtologiTier(userMessage)) return false;
  if (isAdamContinuationDepthTurn(userMessage)) {
    const prior = recentUserMessages[recentUserMessages.length - 1]?.trim() ?? '';
    if (prior && (userAskedForAlamtologi(prior) || userOptedIntoAlamtologiTier(prior))) {
      return false;
    }
  }
  return true;
}

/** General konvensional prose — bukan turn teknikal berstruktur (sains/sejarah/algebra). */
export function isAdamGeneralProseKonvensionalTurn(message: string): boolean {
  if (!isAdamGeneralKonvensionalTurn(message)) return false;
  if (isAdamProseCraftTurn(message)) return false;
  if (isAdamTechnicalKonvensionalDisplayTurn(message)) return false;
  if (isAdamTeachingDepthTurn(message)) return false;
  if (isAdamCompareTurn(message)) return false;
  if (isAdamScienceNatureSynthesisTurn(message)) return false;
  if (isAdamHistorySynthesisTurn(message)) return false;
  if (isAdamAlgorithmTeachingTurn(message)) return false;
  return true;
}

export function buildAdamKnowledgeModeManifest(mode: AdamKnowledgeMode): string {
  return ADAM_KNOWLEDGE_MODE_MANIFEST[mode];
}

/**
 * Buffer LLM chunks until post-stream repair — only when the live stream is
 * almost always fully replaced (arithmetic collapse, visual draw). All other
 * Users turns stream live; repair may swap the body on adam_stream_done.
 */
export function shouldBufferAdamStreamUntilRepair(
  userMessage: string,
  _knowledgeMode: AdamKnowledgeMode,
  isFounder = false,
): boolean {
  if (isFounder) return false;
  const msg = userMessage.trim();
  if (!msg) return false;
  if (isAdamSimpleArithmeticTurn(msg)) return true;
  if (isAdamVisualDrawTurn(msg)) return true;
  return false;
}

export function buildAdamKnowledgeModeTurnOverlay(
  mode: AdamKnowledgeMode,
  profile: AdamAnswerProfile,
): string {
  const lines = [
    `ACTIVE KNOWLEDGE MODE THIS TURN: ${mode.toUpperCase()}`,
    ADAM_KNOWLEDGE_MODE_MANIFEST[mode],
  ];

  if (mode === 'konvensional' && profile === 'beta') {
    lines.push(
      'KONVENSIONAL β — Explain-Back Phase 1A + 1B only on this surface.',
      'FORBIDDEN this turn: Phase 2 Alamtologi; HISAL; AIDIL; TAJU; waqf; PL/PG; MASA/TENAGA/RUANG billboards.',
    );
  }

  if (mode === 'konvensional' && profile === 'alpha') {
    lines.push(
      'KONVENSIONAL α — L1 inti only; no framework prelude; L5 optional Gold Standard close.',
    );
  }

  return lines.join('\n');
}
