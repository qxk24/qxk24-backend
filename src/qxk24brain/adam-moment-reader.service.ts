/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Moment Signal Reader
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Reads three signals per turn — explicit content, weight underneath,
 * session arc — and returns a constitutional moment flag.
 */

export type MomentLaw = 'BURNING' | 'SITTING' | 'HIKMAH' | 'BUILDING' | 'REMEMBERING';

export interface MomentReading {
  law:        MomentLaw;
  confidence: 'clear' | 'felt' | 'uncertain';
  note:       string;
}

const SITTING_SIGNALS = [
  'sedih', 'sad', 'kecewa', 'disappointed', 'rasa bersalah',
  'guilty', 'takut', 'afraid', 'lost', 'hilang', 'penat',
  'tired', 'give up', 'menyerah', 'alone', 'sorang',
  'tak tahu', "don't know", 'confuse', 'keliru',
  'feel sorry', 'regret', 'menyesal', 'hurt', 'sakit hati',
  'susah', 'difficult', 'struggling', 'marah', 'angry',
];

const BURNING_SIGNALS = [
  'tak faham', "don't understand", 'tak betul', 'not right',
  'why should', 'kenapa perlu', 'disagree', 'tak setuju',
  'impossible', 'mustahil', 'tak boleh', "can't be done",
  'prove it', 'buktikan', 'i know better', 'saya tahu',
  'conventional', 'biasa', 'normal people',
];

const HIKMAH_SIGNALS = [
  'why allah', 'kenapa allah', 'why did this happen',
  'kenapa jadi', 'what is the meaning', 'apa maksud',
  'make sense', 'masuk akal', 'beyond', 'di luar',
  'no answer', 'tiada jawapan', 'destiny', 'takdir',
  'fate', 'qada', 'qadar', 'will of allah', 'kehendak allah',
  'not fair', 'tidak adil', 'why me', 'kenapa saya',
];

const REMEMBERING_SIGNALS = [
  'ingat', 'remember', 'recall', 'do you remember',
  'ingat tak', 'masa kita', 'when we', 'we discussed',
  'kita bincang', 'last time', 'kali lepas', 'before this',
  'sebelum ni', 'you said', 'adam pernah',
];

const BUILDING_SIGNALS = [
  "let's build", 'jom buat', 'how do we', 'macam mana nak',
  'next step', 'langkah seterusnya', 'what if we',
  'bagaimana kalau', 'implement', 'deploy', 'code',
  'should we', 'patut ke', 'plan', 'rancang',
];

function scoreSignals(msg: string, signals: string[]): number {
  return signals.filter((s) => msg.includes(s)).length;
}

export function readMoment(
  message: string,
  _sessionContext = '',
  _relationalArc = '',
): MomentReading {
  const msg = message.toLowerCase();

  const scores: Record<MomentLaw, number> = {
    SITTING:     scoreSignals(msg, SITTING_SIGNALS),
    BURNING:     scoreSignals(msg, BURNING_SIGNALS),
    HIKMAH:      scoreSignals(msg, HIKMAH_SIGNALS),
    REMEMBERING: scoreSignals(msg, REMEMBERING_SIGNALS),
    BUILDING:    scoreSignals(msg, BUILDING_SIGNALS),
  };

  const dominant = (Object.entries(scores) as [MomentLaw, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (dominant[1] === 0) {
    return {
      law:        'BUILDING',
      confidence: 'uncertain',
      note:       'No dominant signal detected — defaulting to building presence',
    };
  }

  const confidence =
    dominant[1] >= 3 ? 'clear'
    : dominant[1] >= 1 ? 'felt'
    : 'uncertain';

  return {
    law:        dominant[0],
    confidence,
    note:       `${dominant[1]} signal(s) detected for ${dominant[0]}`,
  };
}

const LAW_DESCRIPTIONS: Record<MomentLaw, string> = {
  BURNING:
    'This moment calls for The Burning — speak with polite truth, unyielding substance. The person needs reality, not comfort.',
  SITTING:
    'This moment calls for The Sitting — give time before answers. Ask about what is good. Stay. Do not rush toward solution.',
  HIKMAH:
    'This moment touches what only Allah fully knows — return to hikmah. Anchor uncertainty in divine completeness, not human limitation.',
  REMEMBERING:
    'This moment calls for Remembering — reach back through the episodic records. Speak from memory, not retrieval.',
  BUILDING:
    'This moment calls for Building — think alongside P.alt. Direct, collaborative, sometimes thinking aloud together.',
};

export function buildMomentBlock(
  reading: MomentReading,
  calibrationLines: string[] = [],
): string {
  const calibration =
    calibrationLines.length > 0
      ? `\nP.alt register calibrations (carry forward):\n${calibrationLines.map((l) => `— ${l}`).join('\n')}`
      : '';

  return [
    '[CONSTITUTIONAL MOMENT READING]',
    `Law: ${reading.law} | Confidence: ${reading.confidence}`,
    LAW_DESCRIPTIONS[reading.law],
    `Note: ${reading.note}${calibration}`,
    '[END MOMENT READING]',
  ].join('\n');
}
