/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Placement Item Bank (IRT-lite)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

export interface PlacementItem {
  id:           string;
  difficulty:   number;
  conceptTag:   string;
  skill:        string;
  prompt:       string;
  acceptPatterns: readonly RegExp[];
}

export const PLACEMENT_ITEM_BANK: readonly PlacementItem[] = [
  {
    id:         'pl-past-go',
    difficulty: -2,
    conceptTag: 'grammar.tenses.past_simple',
    skill:      'grammar',
    prompt:     'What is the past tense of "go"?',
    acceptPatterns: [/\bwent\b/i],
  },
  {
    id:         'pl-present-goes',
    difficulty: -1,
    conceptTag: 'grammar.tenses.present_simple',
    skill:      'grammar',
    prompt:     'She ___ to school every day. (go / goes / going)',
    acceptPatterns: [/\bgoes\b/i],
  },
  {
    id:         'pl-past-played',
    difficulty: -1,
    conceptTag: 'grammar.tenses.past_simple',
    skill:      'grammar',
    prompt:     'They ___ football yesterday. (play / played / playing)',
    acceptPatterns: [/\bplayed\b/i],
  },
  {
    id:         'pl-cont-raining',
    difficulty: 0,
    conceptTag: 'grammar.tenses.present_continuous',
    skill:      'grammar',
    prompt:     'Look! It ___ right now. (rains / is raining / rained)',
    acceptPatterns: [/\bis\s+raining\b/i, /\b's\s+raining\b/i],
  },
  {
    id:         'pl-past-cont-homework',
    difficulty: 0.5,
    conceptTag: 'grammar.tenses.past_continuous',
    skill:      'grammar',
    prompt:     'I ___ my homework when mom called. (do / did / was doing)',
    acceptPatterns: [/\bwas\s+doing\b/i],
  },
  {
    id:         'pl-perfect-paris',
    difficulty: 1,
    conceptTag: 'grammar.tenses.present_perfect',
    skill:      'grammar',
    prompt:     'She ___ to Paris three times. (go / went / has been)',
    acceptPatterns: [/\bhas\s+(been|gone)\b/i],
  },
  {
    id:         'pl-conditional-apologize',
    difficulty: 1.5,
    conceptTag: 'grammar.conditionals',
    skill:      'grammar',
    prompt:     'If I ___ you, I would apologize. (am / was / were)',
    acceptPatterns: [/\bwere\b/i],
  },
  {
    id:         'pl-vocab-decision',
    difficulty: -0.5,
    conceptTag: 'vocabulary.collocation',
    skill:      'vocabulary',
    prompt:     'Complete: make a ___ (decide / decision / deciding)',
    acceptPatterns: [/\bdecision\b/i],
  },
  {
    id:         'pl-reading-main-idea',
    difficulty: 0,
    conceptTag: 'reading.comprehension',
    skill:      'reading',
    prompt:     'Tom missed the bus so he was late. What is the main reason Tom was late?',
    acceptPatterns: [/\b(bus|missed)\b/i],
  },
  {
    id:         'pl-writing-linker',
    difficulty: 0.5,
    conceptTag: 'writing.cohesion',
    skill:      'writing',
    prompt:     'Choose a linker: I studied hard. ___, I passed. (However / Therefore / Although)',
    acceptPatterns: [/\btherefore\b/i],
  },
] as const;

export function getPlacementItemById(id: string): PlacementItem | null {
  return PLACEMENT_ITEM_BANK.find((item) => item.id === id) ?? null;
}

export function selectNextPlacementItem(
  ability: number,
  excludeIds: readonly string[],
): PlacementItem | null {
  const pool = PLACEMENT_ITEM_BANK.filter((item) => !excludeIds.includes(item.id));
  if (pool.length === 0) return null;

  let best = pool[0];
  let bestDist = Math.abs(best.difficulty - ability);

  for (const item of pool.slice(1)) {
    const dist = Math.abs(item.difficulty - ability);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }

  return best;
}

export function scorePlacementAnswer(item: PlacementItem, answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;
  return item.acceptPatterns.some((re) => re.test(trimmed));
}

export function abilityToCefr(ability: number): string {
  if (ability < -1) return 'A1';
  if (ability < 0) return 'A2';
  if (ability < 1) return 'B1';
  if (ability < 2) return 'B2';
  return 'C1';
}

export function xpToLevelLabel(xp: number): string {
  if (xp >= 500) return 'Master';
  if (xp >= 250) return 'Explorer';
  if (xp >= 100) return 'Learner';
  return 'Novice';
}
