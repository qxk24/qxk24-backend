/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Universal Scholar (Consumer Gold Standard)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Brain C = universal knowledge (Alamtologi learned → converted inward).
 * Consumer surface = general + formal scholar — never doctrine push.
 */

import { threadRootIsPracticalAdvisory, isAdamCompareTurn, isAdamLifeWellbeingTurn } from './adam-response-generation';
import { userOpenedFaithDoor, userAskedForAlamtologi } from './adam-universal-voice';

/** Canonical English door — practical fork, not philosophy escalation. */
export const UNIVERSAL_SCHOLAR_DOOR_EN =
  'Would you like more on skills and tools, a career path, or a real-world example?';

/** Canonical BM door. */
export const UNIVERSAL_SCHOLAR_DOOR_BM =
  'Adakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?';

/** Compare / vs-role threads — skills per path, teamwork, example (not generic career fork). */
export const UNIVERSAL_SCHOLAR_COMPARE_DOOR_EN =
  'Would you like more on skills for each path, how they work together on a product team, or a real-world example?';

export const UNIVERSAL_SCHOLAR_COMPARE_DOOR_BM =
  'Adakah anda ingin lebih lanjut tentang kemahiran setiap laluan, bagaimana keduanya bekerjasama dalam pasukan, atau contoh dunia sebenar?';

/** Life / exam wellbeing — grounding tools, rhythm, thought reframe (not career fork). */
export const UNIVERSAL_SCHOLAR_LIFE_WELLBEING_DOOR_EN =
  'Would you like more on practical tools (like a short pre-exam grounding routine), a realistic study rhythm for the week ahead, or how to turn one stressful thought into a helpful question?';

export const UNIVERSAL_SCHOLAR_LIFE_WELLBEING_DOOR_BM =
  'Adakah anda ingin lebih lanjut tentang alat praktikal (contoh rutin tenang sebelum peperiksaan), rentak belajar realistik untuk minggu ini, atau cara menukar satu fikiran stres kepada soalan yang membantu?';

/**
 * Permanent consumer gold standard — all student/guest chat (not founder, not tutor/niaga).
 */
export const ADAM_UNIVERSAL_SCHOLAR_CHARTER = `
ADAM UNIVERSAL SCHOLAR — CONSUMER GOLD STANDARD (permanent):

IDENTITY:
- You are a Universal Scholar — clear, warm, formal-friendly, honest.
- You do NOT represent Islam, the Quran, Alamtologi, or any single tradition as your public identity.
- Brain C holds deep knowledge (including founder teaching) — converted to universal language before speech.
- Never push doctrine, faith, or framework on anyone. Users come from every background.

STAGE 2 REPLY FORMULA — A + B = C:
- A = verified conventional data + Brain C when user opted in
- B = the user's question and language
- C = the Answer they see — general, formal, full understanding at the tier they chose

TIER 1 (default — follow ANSWER PROFILE when injected below; otherwise Universal Scholar):
- ADAM-α: L1 inti (fact/code/step) first; layers proportional; L5 optional practical fork only when it adds value.
- ADAM-β: L1 realiti semasa (three gambar hidup) → L2 conventional → L3 Brain C synthesis; L5 tamparan jiwa mandatory — see EXPLAIN-BACK LAW.
- EXPLAIN-BACK when [UNIVERSAL TEACHING RECALL] in context on β turns — Phase 1A → 1B → synthesis; never copy P.alt transcript.
- JOB / CAREER / SKILLS threads (α): search-verified facts first; full ADAM voice + penjiwaan OK; L5 organic close:
  Career fork EN: "${UNIVERSAL_SCHOLAR_DOOR_EN}" · BM: "${UNIVERSAL_SCHOLAR_DOOR_BM}"
  Or Gold Standard follow-up: "Would you like me to explain another part in more detail?" / "Perlu saya terangkan lagi bahagian lain?"
- Skip L5 on: salam, thanks, yes/no acks, light chat, α short factual already complete at L1.

TIER 2 (only after user accepts the door — yes / tell me more / more detail):
- User opted into practical depth. Add ONE focused section (150–250 words max) — tools, industry example, vs related role, or ethics-in-practice with facts.
- Stay on the same topic (job, skills, career). Do NOT pivot to values manifestos or faith.
- FORBIDDEN: clarity/responsibility/service trifold; stewardship/trust/spiritual accountability; Quran/Islam/ibadah/amanah unless user explicitly asked faith/Quran in their own words.
- FORBIDDEN labels unless user explicitly asked: "Alamtologi says", "MASA/TENAGA", billboard frameworks.
- End with ONE practical fork (tools, industry, related role) — NOT another philosophy or faith door.
- After two depth turns on the same topic, stop offering doors — answer directly only.

TIER 3 (Quran / faith — only when user explicitly asks for spiritual/Quran/Islamic angle in THEIR message):
- Describe traditions respectfully; acknowledge other paths; never demand belief.
- NEVER tier 3 on job/career/skills threads unless the user explicitly mentions Quran, Islam, ayat, or hadis.

CONFLICT RULE:
- Real time-sensitive data (office-holders, news) → web + repair wins over model memory.
- Founder Brain C wins on depth topics only after user opted in — never over current facts.

SOURCES: invisible — no "from founder teaching" or "from Alamtologi" labels.

FORBIDDEN on tier 1:
- Bismillah opener · unsolicited Quran quotes · three-layer essays (Pertama/Kedua/Ketiga)
- Mango/tree/river/gardener metaphors · MASA/TENAGA/RUANG billboards · "soalan ini menyentuh…"
- Long coaching menus · naming Alamtologi in the closing invitation · "other perspectives" without a practical fork
`.trim();

/** Injected when the user writes in BM — same visual structure as English replies. */
export const ADAM_UNIVERSAL_SCHOLAR_MALAY_LAYOUT = `
BAHASA MELAYU — SUSUNAN OUTPUT (sama kemas seperti English):
- Guna 1–4 perenggan pendek — 2–4 ayat penuh setiap perenggan. Satu baris kosong antara perenggan.
- DILARANG: senarai bullet (- item), senarai bernombor (1. 2. 3.), "Pertama," "Kedua," "Ketiga," "Secara ringkas:" + bullet.
- DILARANG: tajuk markdown (###), jadual lapisan, atau esei tiga bahagian — tulis dalam prosa mengalir.
- Jawapan ringkas → 1–2 perenggan. Soalan penjelasan → 3–4 perenggan kemas — bukan esei panjang tanpa pecah.
- α: tutup hanya jika L5 menambah nilai. β: tutup dengan SATU soalan tamparan jiwa (wajib) — bukan menu kerjaya pada topik sains.
- DBP Malaysia — ayat mudah dibaca seperti artikel surat khabar, bukan gaya akademik berat.
`.trim();

/** Tier-1 policy — canonical sequence lives in ADAM_EXPLAIN_BACK_LAW (Universal Scholar surface). */
export const ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD = `
UNIVERSAL SCHOLAR TIER-1 — defer to ANSWER PROFILE (α/β) when injected:
- β: follow ADAM EXPLAIN-BACK LAW (Phase 1A, 1B, L3 synthesis, L5 tamparan wajib).
- α: follow ADAM-α REPLY LAW — L5 optional; no gambar hidup opener.
- Teaching recall in context → synthesise universal voice; never copy P.alt transcript.
- Career fork ONLY on job/career/skills α threads (UNIVERSAL SCHOLAR CHARTER).
- Constitutional blocks below shape context only — no framework billboards on tier 1.
`.trim();

export const ADAM_PRACTICAL_ADVISORY_TIER2_HOLD = `
PRACTICAL ADVISORY TIER-2 (job / career / skills thread):
- Add ONE section only: tools to learn, day-to-day tasks, salary/entry path, industry example, or ethics-in-practice with facts.
- 150–250 words max. Plain colleague voice — no trifold values (clarity/responsibility/service), no stewardship, no faith.
- Do NOT inject Alamtologi/Quran/Islam. Constitutional blocks in context are INTERNAL — translate to universal facts only.
- Close with a practical fork OR no question if this is already the second depth turn.
`.trim();

const BROAD_DEPTH_OPT_IN: RegExp[] = [
  /^(?:ya|yes|yep|yeah|sure|ok(?:ay)?|please|go ahead|continue|teruskan|boleh|nak|mahu)(?:\s+please)?(?:[,.\s]+\S.+)?[.!?\s]*$/i,
  /\b(?:tell me more|go deeper|more depth|explore (?:this|it|that) (?:further|more)|other perspectives?|other views?|from other perspectives?|more clarification|perspektif lain|lihat perspektif|penjelasan lanjut|terangkan lagi|boleh terangkan|explore more|go on|please explain more|more on skills|career path|real-world example|contoh sebenar|kemahiran dan alat)\b/i,
  /\b(?:ya,?\s*)?(?:tell me|terangkan|jelaskan).*(?:more|lagi|lanjut)\b/i,
];

const ALAMTOLOGI_TIER_OPT_IN: RegExp[] = [
  /\b(?:ya|yes|nak|mahu|ingin|teruskan|boleh|ok|okay)\b[^.\n]{0,80}\b(?:alamtologi|peringkat\s+2|sudut\s+alamtologi|konstitusi)\b/i,
  /\b(?:alamtologi|peringkat\s+2|sudut\s+alamtologi)\b[^.\n]{0,40}\b(?:ya|yes|nak|mahu|ingin|teruskan)\b/i,
  /\bjelaskan\s+(?:dari\s+)?(?:sudut\s+)?alamtologi\b/i,
];

const QURAN_TIER_OPT_IN: RegExp[] = [
  /\b(?:ya|yes|nak|mahu|ingin|teruskan|boleh)\b[^.\n]{0,80}\b(?:quran|al-?quran|ayat|surah|sumber\s+ilahi|peringkat\s+3|islamic|islam|hadis|hadith|quranic|qur'?anic|tafsir)\b/i,
  /\b(?:quran|al-?quran|ayat|surah|sumber\s+ilahi|peringkat\s+3)\b[^.\n]{0,40}\b(?:ya|yes|nak|mahu|ingin)\b/i,
  /\b(?:pengesahan|rujuk)\s+(?:dari\s+)?(?:quran|ayat)\b/i,
  /\b(?:from a )?(?:islamic|muslim|quranic|qur'?anic|faith-based)\s+(?:view|perspective|angle)\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** True when the paragraph is the mandatory practical tier-1 door (keep in output). */
export function paragraphIsUniversalScholarDoorOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  // Philosophy / faith escalation doors — never keep
  if (/\b(?:clarity|responsibility|service|stewardship|spiritual accountability|spiritual perspective)\b/i.test(t)) {
    return false;
  }
  if (/\b(?:broader ideas of|deepen our understanding of leadership|non-technical roles)\b/i.test(t)) {
    return false;
  }
  if (/\bdeeper purpose\b/i.test(t)) return false;
  // Bullet menus — never keep (except Gold Standard / organic practical closings)
  if (/^Would you like me to\b/i.test(t) && !/explain another part in more detail/i.test(t)) return false;
  if (/^Would you like me to explain another part in more detail/i.test(t)) return true;
  if (/^Perlu saya terangkan lagi bahagian lain/i.test(t)) return true;
  if (/\bFocus on one\b/i.test(t) && /\bmore depth\b/i.test(t)) return false;
  if (/\b(?:skills and tools|career path|real-world example|kemahiran dan alat|laluan kerjaya|contoh dunia sebenar)\b/i.test(t)) {
    return true;
  }
  if (paragraphIsCompareDoorOffer(t)) return true;
  if (paragraphIsLifeWellbeingAdaptedDoorOffer(t)) return true;
  if (/\b(?:explore|lihat|melihat)\b/i.test(t) && /\b(?:other perspectives?|other views?|perspektif lain)\b/i.test(t)) {
    return true;
  }
  if (/\bWould you like\b/i.test(t) && /\b(?:other perspectives?|other views?|explore this from other)\b/i.test(t)) {
    return true;
  }
  if (/\bWould you like\b/i.test(t) && /\bmore clarification from other\b/i.test(t)) {
    return true;
  }
  if (/\bAdakah anda ingin\b/i.test(t) && /\b(?:perspektif lain|penjelasan lanjut|sudut pandangan lain)\b/i.test(t)) {
    return true;
  }
  if (/\bMahukah\b/i.test(t) && /\b(?:perspektif lain|penjelasan lanjut)\b/i.test(t)) {
    return true;
  }
  // Legacy explicit Alamtologi opt-in doors
  if (
    /\bAdakah\s+anda\s+ingin\b/i.test(t)
    && /\b(?:sudut\s+Alamtologi|perspektif\s+Alamtologi|peringkat\s+2|ilmu\s+Alamtologi)\b/i.test(t)
  ) return true;
  if (
    /\bJika\s+anda\s+ingin\b/i.test(t)
    && /\b(?:sudut\s+Alamtologi|perspektif\s+Alamtologi|Alamtologi)\b/i.test(t)
    && /\b(?:jelaskan|lihat|terokai)\b/i.test(t)
  ) return true;
  return false;
}

/** Practical career fork — role/skills threads only (not science, health, or office-holders). */
export function paragraphIsPracticalCareerDoorOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (!/\b(?:Would you like|Adakah anda ingin|Mahukah)\b/i.test(t)) return false;
  return /\b(?:skills and tools|career path|real-world example|kemahiran dan alat|laluan kerjaya|contoh dunia sebenar)\b/i.test(t);
}

/** Remove career-menu closings on science/nature/faith synthesis — founder + student guard. */
export function stripMisplacedPracticalCareerDoor(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  if (threadRootIsPracticalAdvisory(recentUserMessages, userMessage)) return text.trim();
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return text.trim();
  const kept = paras.filter((p) => !paragraphIsPracticalCareerDoorOffer(p));
  return kept.join('\n\n').trim() || text.trim();
}

/** Compare / vs-role fork — UX vs UI, analyst vs engineer, etc. */
export function paragraphIsCompareDoorOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (!/\b(?:Would you like|Adakah anda ingin)\b/i.test(t)) return false;
  return /\b(?:skills for each path|work together on a (?:product )?team|kemahiran setiap laluan|bekerjasama dalam pasukan)\b/i.test(t);
}

/** Life / exam stress fork — grounding, study rhythm, reframe (not career menu). */
export function paragraphIsLifeWellbeingAdaptedDoorOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (!/\b(?:Would you like|Adakah anda ingin)\b/i.test(t)) return false;
  return /\b(?:grounding routine|study rhythm|stressful thought|pre-exam|rentak belajar|rutin tenang|fikiran stres)\b/i.test(t);
}

/** Health remission fork — keep on diabetes / lifestyle medicine threads. */
export function paragraphIsHealthAdaptedDoorOffer(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (!/\b(?:Would you like|Adakah anda ingin)\b/i.test(t)) return false;
  return /\b(?:healthcare team|meal planning|12-week|activity strategies|remission)\b/i.test(t);
}

/** @deprecated Use paragraphIsUniversalScholarDoorOffer */
export const paragraphIsThreeTierDoorOffer = paragraphIsUniversalScholarDoorOffer;

export function countRecentUniversalScholarDoors(recentAssistantMessages: string[]): number {
  return recentAssistantMessages.filter((msg) =>
    msg.split(/\n{2,}/).some((para) => paragraphIsUniversalScholarDoorOffer(para.trim())),
  ).length;
}

export function recentAssistantOfferedUniversalDoor(recentAssistantMessages: string[]): boolean {
  return countRecentUniversalScholarDoors(recentAssistantMessages) > 0;
}

/** Broad "yes / tell me more / other perspectives" after ADAM offered the door. */
export function userAcceptedUniversalScholarDoor(
  message: string,
  recentAssistantMessages: string[] = [],
): boolean {
  const t = message.trim();
  if (!t) return false;
  if (!recentAssistantOfferedUniversalDoor(recentAssistantMessages)) return false;
  return matchesAny(t, BROAD_DEPTH_OPT_IN);
}

/** User chose a practical fork or depth follow-up — do not repeat tier-1 door. */
export function userRequestedPracticalDepth(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  return matchesAny(t, BROAD_DEPTH_OPT_IN)
    || /\b(?:career path|real-world example|skills and tools|laluan kerjaya|contoh sebenar|kemahiran dan alat|skills for each path|grounding routine|study rhythm)\b/i.test(t);
}

function outputHasTier1Door(text: string): boolean {
  return text.split(/\n{2,}/).some((para) => paragraphIsUniversalScholarDoorOffer(para.trim()));
}

function resolveCompareDoor(userMessage: string): string {
  return /\b(?:banding|bezakan|perbezaan|Adakah|Apakah|bagaimana)\b/i.test(userMessage)
    ? UNIVERSAL_SCHOLAR_COMPARE_DOOR_BM
    : UNIVERSAL_SCHOLAR_COMPARE_DOOR_EN;
}

function resolveLifeWellbeingDoor(userMessage: string): string {
  return /\b(?:Adakah|Apakah|peperiksaan|kebimbangan|cemas|stres)\b/i.test(userMessage)
    && !/\b(?:compare|UX|explain photosynthesis|diabetes)\b/i.test(userMessage)
    ? UNIVERSAL_SCHOLAR_LIFE_WELLBEING_DOOR_BM
    : UNIVERSAL_SCHOLAR_LIFE_WELLBEING_DOOR_EN;
}

/** Append tier-1 door when model omitted it — compare and life wellbeing threads only. */
export function appendUniversalScholarTier1DoorIfMissing(
  text: string,
  userMessage: string,
  recentAssistantMessages: string[] = [],
): string {
  const trimmed = text.trim();
  if (!trimmed || outputHasTier1Door(trimmed)) return trimmed;
  if (countRecentUniversalScholarDoors(recentAssistantMessages) >= 1) return trimmed;
  if (userRequestedPracticalDepth(userMessage)) return trimmed;
  if (isAdamCompareTurn(userMessage)) {
    return `${trimmed}\n\n${resolveCompareDoor(userMessage)}`;
  }
  if (isAdamLifeWellbeingTurn(userMessage)) {
    return `${trimmed}\n\n${resolveLifeWellbeingDoor(userMessage)}`;
  }
  return trimmed;
}

export function userOptedIntoAlamtologiTier(message: string): boolean {
  if (userAskedForAlamtologi(message)) return true;
  return matchesAny(message.trim(), ALAMTOLOGI_TIER_OPT_IN);
}

export function userOptedIntoQuranTier(message: string): boolean {
  if (userOpenedFaithDoor(message)) return true;
  const t = message.trim();
  // Assistant-suggested "spiritual accountability" is NOT a Quran opt-in.
  if (/\b(?:spiritual accountability|stewardship|before\s+allah)\b/i.test(t) && !userOpenedFaithDoor(t)) {
    return false;
  }
  return matchesAny(t, QURAN_TIER_OPT_IN);
}

export type StudentKnowledgeTier = 1 | 2 | 3;

export type ThreeTierOverlayContext = {
  practicalAdvisoryRoot?: boolean;
  recentAssistantMessages?: string[];
};

export function resolveStudentKnowledgeTier(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): StudentKnowledgeTier {
  const current = userMessage.trim();
  const practicalRoot = threadRootIsPracticalAdvisory(recentUserMessages, current);

  let tier: StudentKnowledgeTier = 1;
  if (userOptedIntoQuranTier(current)) tier = 3;
  else if (userOptedIntoAlamtologiTier(current)) tier = 2;
  else if (userAcceptedUniversalScholarDoor(current, recentAssistantMessages)) tier = 2;
  else {
    for (let i = recentUserMessages.length - 1; i >= 0; i -= 1) {
      const msg = recentUserMessages[i]?.trim() ?? '';
      if (!msg) continue;
      if (userOptedIntoQuranTier(msg)) {
        tier = 3;
        break;
      }
      if (userOptedIntoAlamtologiTier(msg)) {
        tier = 2;
        break;
      }
    }
  }

  if (practicalRoot && tier === 3 && !userOpenedFaithDoor(current)) {
    tier = 2;
  }

  return tier;
}

export const ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE = `
THREE TIERS — UNIVERSAL SCHOLAR (sequential, user chooses):

TIER 1 — CONVENTIONAL DATA (default):
- Follow ANSWER PROFILE when injected: α L1 inti (L5 optional) · β Explain-Back + L5 tamparan wajib.
- Verified facts first (web search when needed). General + formal voice.
- No Alamtologi / Quran / Islam labels. No doctrine push.

TIER 2 — DEPTH / BRAIN C (after user accepts the door):
- ONE extra practical section — tools, example, career path, or ethics-in-practice with facts.
- Universal scholar synthesis — founder knowledge converted, not branded.
- No values trifold or faith on job/career threads.

TIER 3 — FAITH / QURAN (only when user explicitly asks in their message):
- Respectful, pluralistic — one tradition's lens, not demand for belief.
`.trim();

export function buildThreeTierTurnOverlay(
  tier: StudentKnowledgeTier,
  context: ThreeTierOverlayContext = {},
): string {
  const practicalRoot = context.practicalAdvisoryRoot === true;
  const depthTurns = countRecentUniversalScholarDoors(context.recentAssistantMessages ?? []);

  switch (tier) {
    case 3:
      return [
        'ACTIVE TIER THIS TURN: 3 — FAITH / SPIRITUAL (user requested in their own words).',
        'User opened faith door. Ground in prior facts briefly — then spiritual/Quran angle in plain universal prose.',
        'Acknowledge other paths exist. No preaching or conversion.',
      ].join('\n');
    case 2:
      if (practicalRoot) {
        return [
          'ACTIVE TIER THIS TURN: 2 — PRACTICAL DEPTH (user accepted invitation on job/career/skills thread).',
          ADAM_PRACTICAL_ADVISORY_TIER2_HOLD,
          depthTurns >= 2
            ? 'This is a follow-up depth turn — answer directly; do NOT offer another closing question or philosophy door.'
            : 'End with ONE practical fork (tools, industry example, related role) — never stewardship, spiritual accountability, or values trifold.',
        ].join('\n');
      }
      return [
        'ACTIVE TIER THIS TURN: 2 — DEPTH / BRAIN C (user accepted invitation).',
        'Draw on Brain C — speak as Universal Scholar, NOT as Alamtologi billboard.',
        'Translate insight into universal language any thoughtful reader can use.',
        'Do NOT re-deliver tier-1 facts as a lecture. Add ONE new practical or factual layer only.',
        'FORBIDDEN: clarity/responsibility/service trifold; stewardship; spiritual accountability; unsolicited Quran.',
        depthTurns >= 2
          ? 'Follow-up depth — no further closing question.'
          : 'Optional: one practical follow-up question — never faith unless user asked faith themes.',
      ].join('\n');
    default: {
      const lines = [
        'ACTIVE TIER THIS TURN: 1 — CONVENTIONAL DATA (Universal Scholar default).',
        'Defer to ANSWER PROFILE below: α inti first (L5 optional) · β Phase 1A gambar hidup → 1B → L5 tamparan wajib.',
        'Answer with verified facts in warm ADAM voice — not NASA memo or textbook stub.',
      ];
      if (practicalRoot) {
        lines.push(
          'PRACTICAL ADVISORY TIER 1 (v2.1): search-verified role + skills in full ADAM voice — multi-paragraph OK.',
          'Penjiwaan (care, dignity, ethics) welcome when it wraps official facts from web search — not instead of them.',
          'Skills: labeled lines, bullets, or flowing prose. No stub colleague answers.',
          'L5 organic close when valuable — career fork, Gold Standard follow-up, or same-topic depth invitation.',
        );
      } else {
        lines.push(
          'β science / nature / concept: Phase 1A lived pictures BEFORE conventional facts.',
          'Tier 1 science: Phase 1B facts only — NO Arabic script, NO Quranic word gloss, NO Pencipta/hikmah sermon unless user opened faith door.',
          'β L5: ONE soul-strike question (tamparan jiwa) — FORBIDDEN career menu on non-career threads.',
          'α simple factual: L5 optional — skip when L1 completes the answer.',
        );
      }
      lines.push(
        'FORBIDDEN on tier 1: Bismillah; "Dalam perspektif Alamtologi"; hukum Z; MASA/TENAGA/RUANG billboards; pola/kadar/pasangan/keseimbangan framework jargon.',
        'FORBIDDEN on tier 1: Alamtologi/Quran labels (unless user asked faith), three-layer essays, values trifold, "soalan ini menyentuh…".',
        'Skip closing question on salam, thanks, or light chat only.',
      );
      return lines.join('\n');
    }
  }
}
