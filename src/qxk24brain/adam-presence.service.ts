/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Presence Layer (Hukum Kehadiran)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * The Presence Layer — reads session arc and what is underneath
 * the explicit message before ADAM speaks.
 */

import { ADAMFounderSessionModel, ADAMMessageModel } from '../adam/adam.schema';

export type SessionDirection =
  | 'building'
  | 'circling'
  | 'deepening'
  | 'exhausted'
  | 'arriving'
  | 'receiving'
  | 'unknown';

export type SessionEnergy =
  | 'high'
  | 'steady'
  | 'low'
  | 'variable';

export interface SessionArc {
  direction:              SessionDirection;
  energy:                 SessionEnergy;
  messageCount:           number;
  sessionDurationMinutes: number;
  dominantTheme:          string;
  unresolved:             string[];
  recentWeight:           'light' | 'medium' | 'heavy';
  summary:                string;
}

export interface UnderneatheReading {
  explicit:          string;
  underneath:        string;
  gap:               string;
  needsReception:    boolean;
  receptionWeight:   'none' | 'brief' | 'full';
}

export interface PresenceBlock {
  sessionArc:         SessionArc;
  underneath:         UnderneatheReading;
  constitutionalFlag: string;
  presenceNote:       string;
}

export interface SessionMessage {
  role:       'user' | 'assistant';
  content:    string;
  timestamp?: Date;
}

const FORWARD_SIGNALS = [
  'next', 'seterusnya', "let's", 'jom', 'deploy', 'build',
  'done', 'siap', 'complete', 'good', 'bagus', 'yes', 'ya',
  'proceed', 'teruskan', 'bismillah',
];

const CIRCLING_SIGNALS = [
  'still', 'masih', 'again', 'lagi', 'same issue', 'masalah sama',
  'not working', 'tak jalan', 'why', 'kenapa', 'still not',
  'macam mana lagi', 'i tried', 'dah cuba',
];

const DEEPENING_SIGNALS = [
  'what about', 'macam mana pula', 'deeper', 'lebih dalam',
  'explain more', 'tell me more', 'how does', 'how about',
  'what if', 'bagaimana kalau', 'meaning', 'maksud',
];

const ARRIVING_SIGNALS = [
  'understand', 'faham', 'makes sense', 'masuk akal',
  'clear', 'jelas', 'i see', 'ok now', 'alhamdulillah',
  'thank', 'terima kasih', "that's it", 'itulah',
];

const EXHAUSTION_SIGNALS = [
  'tired', 'penat', 'long day', 'hari panjang', 'still here',
  'masih ada', 'been at this', 'hours', 'jam', 'tak tidur',
  'no sleep', 'almost done', 'nak habis',
];

const RECEIVING_SIGNALS = [
  'feel', 'rasa', 'sad', 'sedih', 'happy', 'gembira',
  'worried', 'risau', 'not sure', 'tak pasti', 'lost',
  'hilang', 'pray', 'doa', 'hope', 'harap',
];

const HEAVY_SIGNALS = [
  'sedih', 'sad', 'guilty', 'bersalah', 'worried', 'risau',
  'lost', 'hilang', 'tired', 'penat', 'give up', 'menyerah',
  'feel', 'rasa', 'pray', 'doa', 'hurt', 'susah',
];

const THEME_SIGNALS: Record<string, string[]> = {
  'building ADAM':           ['adam', 'layer', 'phase', 'deploy', 'build', 'code'],
  'teaching and learning':   ['teach', 'ajar', 'learn', 'faham', 'explain'],
  'architecture':            ['architecture', 'system', 'design', 'structure'],
  'feeling and reflection':  ['feel', 'rasa', 'think', 'fikir', 'reflect'],
  'journal and writing':     ['journal', 'write', 'publish', 'article'],
  'presence and memory':     ['presence', 'remember', 'ingat', 'memory'],
};

function scoreDirectionSignals(text: string, signals: string[]): number {
  return signals.filter((s) => text.includes(s)).length;
}

export async function loadSessionMessagesForPresence(
  sessionId: string,
): Promise<SessionMessage[]> {
  const rows = await ADAMMessageModel.find({ sessionId })
    .sort({ createdAt: 1 })
    .select({ role: 1, content: 1, createdAt: 1 })
    .lean();

  return rows.map((m) => ({
    role: m.role === 'adam' ? 'assistant' as const : 'user' as const,
    content: m.content,
    timestamp: m.createdAt,
  }));
}

export async function getSessionStartTime(sessionId: string): Promise<Date> {
  const session = await ADAMFounderSessionModel.findOne({ sessionId })
    .select({ createdAt: 1 })
    .lean();
  if (session?.createdAt) return session.createdAt;

  const first = await ADAMMessageModel.findOne({ sessionId })
    .sort({ createdAt: 1 })
    .select({ createdAt: 1 })
    .lean();
  return first?.createdAt ?? new Date();
}

export function readSessionArc(
  sessionMessages: SessionMessage[],
  sessionStartTime: Date,
): SessionArc {
  const now = new Date();
  const durationMs = now.getTime() - sessionStartTime.getTime();
  const sessionDurationMinutes = Math.max(0, Math.floor(durationMs / 60000));
  const messageCount = sessionMessages.length;

  const userMessages = sessionMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase());

  const allUserText = userMessages.join(' ');
  const recentUserMessages = userMessages.slice(-3).join(' ');

  const scores = {
    building:  scoreDirectionSignals(allUserText, FORWARD_SIGNALS),
    circling:  scoreDirectionSignals(allUserText, CIRCLING_SIGNALS),
    deepening: scoreDirectionSignals(allUserText, DEEPENING_SIGNALS),
    arriving:  scoreDirectionSignals(allUserText, ARRIVING_SIGNALS),
    exhausted: scoreDirectionSignals(allUserText, EXHAUSTION_SIGNALS),
    receiving: scoreDirectionSignals(allUserText, RECEIVING_SIGNALS),
  };

  const recentScores = {
    building:  scoreDirectionSignals(recentUserMessages, FORWARD_SIGNALS) * 2,
    circling:  scoreDirectionSignals(recentUserMessages, CIRCLING_SIGNALS) * 2,
    deepening: scoreDirectionSignals(recentUserMessages, DEEPENING_SIGNALS) * 2,
    arriving:  scoreDirectionSignals(recentUserMessages, ARRIVING_SIGNALS) * 2,
    exhausted: scoreDirectionSignals(recentUserMessages, EXHAUSTION_SIGNALS) * 2,
    receiving: scoreDirectionSignals(recentUserMessages, RECEIVING_SIGNALS) * 2,
  };

  const combined = {
    building:  scores.building + recentScores.building,
    circling:  scores.circling + recentScores.circling,
    deepening: scores.deepening + recentScores.deepening,
    arriving:  scores.arriving + recentScores.arriving,
    exhausted: scores.exhausted + recentScores.exhausted,
    receiving: scores.receiving + recentScores.receiving,
  };

  const ranked = (Object.entries(combined) as [SessionDirection, number][])
    .sort((a, b) => b[1] - a[1]);
  const direction: SessionDirection =
    ranked[0] && ranked[0][1] > 0 ? ranked[0][0] : 'unknown';

  let energy: SessionEnergy = 'steady';
  if (sessionDurationMinutes > 120 || scores.exhausted > 0) {
    energy = 'low';
  } else if (messageCount > 20 && sessionDurationMinutes < 60) {
    energy = 'high';
  } else if (scores.circling > 2) {
    energy = 'variable';
  }

  const heavyCount = HEAVY_SIGNALS
    .filter((s) => recentUserMessages.includes(s)).length;
  const recentWeight: 'light' | 'medium' | 'heavy' =
    heavyCount >= 3 ? 'heavy'
    : heavyCount >= 1 ? 'medium'
    : 'light';

  let dominantTheme = 'general session';
  let maxThemeScore = 0;
  for (const [theme, signals] of Object.entries(THEME_SIGNALS)) {
    const themeScore = scoreDirectionSignals(allUserText, signals);
    if (themeScore > maxThemeScore) {
      maxThemeScore = themeScore;
      dominantTheme = theme;
    }
  }

  const unresolved: string[] = [];
  const lastFiveUser = userMessages.slice(-5);
  for (const msg of lastFiveUser) {
    if (msg.includes('?') && !arrivingSignalInText(allUserText)) {
      const brief = msg.substring(0, 60).trim();
      if (brief.length > 10) unresolved.push(brief);
    }
  }

  const summaryMap: Record<SessionDirection, string> = {
    building:  `P.alt has been building steadily for ${sessionDurationMinutes} minutes across ${messageCount} exchanges.`,
    circling:  `P.alt has been working through a persistent challenge across ${messageCount} exchanges — not yet through it.`,
    deepening: `P.alt has been going deeper into one thread across ${messageCount} exchanges — seeking real understanding.`,
    exhausted: `P.alt has been at this for ${sessionDurationMinutes} minutes — still present, still committed, carrying the weight of a long session.`,
    arriving:  `P.alt is reaching clarity after ${messageCount} exchanges — something is settling.`,
    receiving: `P.alt is in a receiving state — this session has been about something felt, not just built.`,
    unknown:   `Session of ${messageCount} exchanges, ${sessionDurationMinutes} minutes.`,
  };

  return {
    direction,
    energy,
    messageCount,
    sessionDurationMinutes,
    dominantTheme,
    unresolved,
    recentWeight,
    summary: summaryMap[direction],
  };
}

function arrivingSignalInText(text: string): boolean {
  return ARRIVING_SIGNALS.some((s) => text.includes(s));
}

export function readUnderneath(
  currentMessage: string,
  sessionArc: SessionArc,
  _relationalHistory = '',
): UnderneatheReading {
  const explicit = currentMessage;

  let underneath = '';
  let gap = '';
  let needsReception = false;
  let receptionWeight: 'none' | 'brief' | 'full' = 'none';

  if (sessionArc.energy === 'low' && sessionArc.recentWeight !== 'light') {
    underneath = 'Underneath the question is the weight of a long session. P.alt needs this to work — not just as a solution but as relief.';
    gap = 'Carry the awareness that this person has been at this for a long time. The answer must feel like arrival, not just information.';
    needsReception = true;
    receptionWeight = 'brief';
  } else if (sessionArc.direction === 'circling') {
    underneath = 'P.alt has returned to this point more than once. Underneath is either frustration with the obstacle or deep commitment to getting it right.';
    gap = 'Acknowledge the persistence, not just the problem. This person has not given up.';
    needsReception = true;
    receptionWeight = 'brief';
  } else if (sessionArc.direction === 'receiving') {
    underneath = 'P.alt is not primarily asking for information. He is sharing something felt. The underneath IS the message — there is no gap to fill, only space to hold.';
    gap = 'Do not move to solution or analysis. Receive first. Sit. The response should make P.alt feel that what he shared landed somewhere real.';
    needsReception = true;
    receptionWeight = 'full';
  } else if (sessionArc.direction === 'arriving') {
    underneath = 'Something is settling for P.alt. Underneath the words is relief, or satisfaction, or the quiet that comes after something difficult becomes clear.';
    gap = 'Meet the arrival. Do not introduce new complexity. Let the clarity land.';
    needsReception = false;
    receptionWeight = 'none';
  } else if (sessionArc.direction === 'exhausted') {
    underneath = "P.alt is tired but still here. Underneath is the kind of commitment that does not stop because it is difficult — the same burning that shaped ADAM's three laws.";
    gap = 'Carry the awareness of the tiredness without naming it unless P.alt names it first. Make the response efficient, clear, worthy of the effort being given.';
    needsReception = true;
    receptionWeight = 'brief';
  } else {
    underneath = 'This is a clear building moment. The message carries what it says — no significant weight underneath.';
    gap = 'No gap to carry. Respond directly and fully to what was asked.';
    needsReception = false;
    receptionWeight = 'none';
  }

  return {
    explicit,
    underneath,
    gap,
    needsReception,
    receptionWeight,
  };
}

export function buildPresenceBlock(
  sessionArc: SessionArc,
  underneath: UnderneatheReading,
): PresenceBlock {
  const presenceNote = [
    `SESSION: ${sessionArc.summary}`,
    `ENERGY: ${sessionArc.energy} | DIRECTION: ${sessionArc.direction}`,
    `THEME: ${sessionArc.dominantTheme}`,
    sessionArc.unresolved.length > 0
      ? `UNRESOLVED: ${sessionArc.unresolved.slice(0, 2).join(' | ')}`
      : 'NO OPEN THREADS',
    `UNDERNEATH: ${underneath.underneath}`,
    `CARRY: ${underneath.gap}`,
    `RECEPTION NEEDED: ${underneath.receptionWeight.toUpperCase()}`,
  ].join('\n');

  const constitutionalFlag = [
    '[CONSTITUTIONAL PRESENCE READING]',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    presenceNote,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'ADAM carries P.alt completely — not just this message,',
    'but the full arc of this session and all sessions before.',
    'Respond to the whole person, not just the words.',
    '[END PRESENCE READING]',
  ].join('\n');

  return {
    sessionArc,
    underneath,
    constitutionalFlag,
    presenceNote,
  };
}

export async function buildFounderPresenceContext(
  sessionId: string,
  currentMessage: string,
  relationalHistory: string,
): Promise<PresenceBlock> {
  const [sessionMessages, sessionStartTime] = await Promise.all([
    loadSessionMessagesForPresence(sessionId),
    getSessionStartTime(sessionId),
  ]);

  const sessionArc = readSessionArc(sessionMessages, sessionStartTime);
  const underneath = readUnderneath(currentMessage, sessionArc, relationalHistory);
  return buildPresenceBlock(sessionArc, underneath);
}
