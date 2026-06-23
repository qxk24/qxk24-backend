/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Placement Item Bank (MVP static 20)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

export type PlacementSubject = 'english' | 'math' | 'bm';

export interface PlacementItem {
  id:               string;
  subject:          PlacementSubject;
  difficulty:       number;
  conceptTag:       string;
  skill:            string;
  prompt:           string;
  acceptPatterns:   readonly RegExp[];
}

/** MVP Fasa 1 — same 20 questions, fixed order, for every student. */
export const PLACEMENT_TARGET_QUESTIONS = 20;

export const STATIC_PLACEMENT_ORDER: readonly string[] = [
  'pl-past-go',
  'pl-math-add-20',
  'pl-present-goes',
  'pl-bm-ejaan-permainan',
  'pl-past-played',
  'pl-math-sub-33',
  'pl-cont-raining',
  'pl-bm-hubung-kerana',
  'pl-past-cont-homework',
  'pl-math-mul-42',
  'pl-perfect-paris',
  'pl-bm-awalan-menulis',
  'pl-conditional-apologize',
  'pl-math-div-8',
  'pl-vocab-decision',
  'pl-math-frac-three-quarters',
  'pl-reading-main-idea',
  'pl-bm-karangan-unsur',
  'pl-writing-linker',
  'pl-math-pct-20',
] as const;

export const PLACEMENT_ITEM_BANK: readonly PlacementItem[] = [
  {
    id: 'pl-past-go', subject: 'english', difficulty: -2,
    conceptTag: 'grammar.tenses.past_simple', skill: 'grammar',
    prompt: 'What is the past tense of "go"?',
    acceptPatterns: [/\bwent\b/i],
  },
  {
    id: 'pl-present-goes', subject: 'english', difficulty: -1,
    conceptTag: 'grammar.tenses.present_simple', skill: 'grammar',
    prompt: 'She ___ to school every day. (go / goes / going)',
    acceptPatterns: [/\bgoes\b/i],
  },
  {
    id: 'pl-past-played', subject: 'english', difficulty: -1,
    conceptTag: 'grammar.tenses.past_simple', skill: 'grammar',
    prompt: 'They ___ football yesterday. (play / played / playing)',
    acceptPatterns: [/\bplayed\b/i],
  },
  {
    id: 'pl-cont-raining', subject: 'english', difficulty: 0,
    conceptTag: 'grammar.tenses.present_continuous', skill: 'grammar',
    prompt: 'Look! It ___ right now. (rains / is raining / rained)',
    acceptPatterns: [/\bis\s+raining\b/i, /\b's\s+raining\b/i],
  },
  {
    id: 'pl-past-cont-homework', subject: 'english', difficulty: 0.5,
    conceptTag: 'grammar.tenses.past_continuous', skill: 'grammar',
    prompt: 'I ___ my homework when mom called. (do / did / was doing)',
    acceptPatterns: [/\bwas\s+doing\b/i],
  },
  {
    id: 'pl-perfect-paris', subject: 'english', difficulty: 1,
    conceptTag: 'grammar.tenses.present_perfect', skill: 'grammar',
    prompt: 'She ___ to Paris three times. (go / went / has been)',
    acceptPatterns: [/\bhas\s+(been|gone)\b/i],
  },
  {
    id: 'pl-conditional-apologize', subject: 'english', difficulty: 1.5,
    conceptTag: 'grammar.conditionals', skill: 'grammar',
    prompt: 'If I ___ you, I would apologize. (am / was / were)',
    acceptPatterns: [/\bwere\b/i],
  },
  {
    id: 'pl-vocab-decision', subject: 'english', difficulty: -0.5,
    conceptTag: 'vocabulary.collocation', skill: 'vocabulary',
    prompt: 'Complete: make a ___ (decide / decision / deciding)',
    acceptPatterns: [/\bdecision\b/i],
  },
  {
    id: 'pl-reading-main-idea', subject: 'english', difficulty: 0,
    conceptTag: 'reading.comprehension', skill: 'reading',
    prompt: 'Tom missed the bus so he was late. What is the main reason Tom was late?',
    acceptPatterns: [/\b(bus|missed)\b/i],
  },
  {
    id: 'pl-writing-linker', subject: 'english', difficulty: 0.5,
    conceptTag: 'writing.cohesion', skill: 'writing',
    prompt: 'Choose a linker: I studied hard. ___, I passed. (However / Therefore / Although)',
    acceptPatterns: [/\btherefore\b/i],
  },
  {
    id: 'pl-math-add-20', subject: 'math', difficulty: -2,
    conceptTag: 'math.arithmetic.addition', skill: 'arithmetic',
    prompt: 'Berapakah 12 + 8?',
    acceptPatterns: [/\b20\b/],
  },
  {
    id: 'pl-math-sub-33', subject: 'math', difficulty: -1,
    conceptTag: 'math.arithmetic.subtraction', skill: 'arithmetic',
    prompt: 'Berapakah 50 − 17?',
    acceptPatterns: [/\b33\b/],
  },
  {
    id: 'pl-math-mul-42', subject: 'math', difficulty: 0,
    conceptTag: 'math.arithmetic.multiplication', skill: 'arithmetic',
    prompt: 'Berapakah 6 × 7?',
    acceptPatterns: [/\b42\b/],
  },
  {
    id: 'pl-math-div-8', subject: 'math', difficulty: 0,
    conceptTag: 'math.arithmetic.division', skill: 'arithmetic',
    prompt: 'Berapakah 24 ÷ 3?',
    acceptPatterns: [/\b8\b/],
  },
  {
    id: 'pl-math-frac-three-quarters', subject: 'math', difficulty: 0.5,
    conceptTag: 'math.fractions.operations', skill: 'fractions',
    prompt: 'Berapakah 1/2 + 1/4? (jawab sebagai pecahan atau perpuluhan)',
    acceptPatterns: [/\b3\s*\/\s*4\b/, /\b0\.75\b/, /\b0,75\b/],
  },
  {
    id: 'pl-math-pct-20', subject: 'math', difficulty: 1,
    conceptTag: 'math.percentage.basic', skill: 'percentage',
    prompt: 'Berapakah 25% daripada 80?',
    acceptPatterns: [/\b20\b/],
  },
  {
    id: 'pl-bm-ejaan-permainan', subject: 'bm', difficulty: -1,
    conceptTag: 'bm.spelling', skill: 'ejaan',
    prompt: 'Pilih ejaan betul: permainan / permainn / prmainan',
    acceptPatterns: [/\bpermainan\b/i],
  },
  {
    id: 'pl-bm-hubung-kerana', subject: 'bm', difficulty: 0,
    conceptTag: 'bm.grammar.connectors', skill: 'tatabahasa',
    prompt: 'Saya lapar ___ saya makan nasi. (kerana / tetapi / walaupun)',
    acceptPatterns: [/\bkerana\b/i],
  },
  {
    id: 'pl-bm-awalan-menulis', subject: 'bm', difficulty: 0.5,
    conceptTag: 'bm.grammar.affixes', skill: 'imbuhan',
    prompt: 'Apakah kata berimbuhan awalan untuk "tulis"? (menulis / menulisi / tulisan)',
    acceptPatterns: [/\bmenulis\b/i],
  },
  {
    id: 'pl-bm-karangan-unsur', subject: 'bm', difficulty: 0.5,
    conceptTag: 'bm.writing.structure', skill: 'karangan',
    prompt: 'Nyatakan SATU unsur wajib dalam karangan BM: pengenalan, isi, atau penutup.',
    acceptPatterns: [/\bpengenalan\b/i, /\bisi\b/i, /\bpenutup\b/i],
  },
] as const;

export function getPlacementItemById(id: string): PlacementItem | null {
  return PLACEMENT_ITEM_BANK.find((item) => item.id === id) ?? null;
}

export function getStaticPlacementItemByIndex(index: number): PlacementItem | null {
  const id = STATIC_PLACEMENT_ORDER[index];
  if (!id) return null;
  return getPlacementItemById(id);
}

/** @deprecated Adaptive pick — retained for tests; production uses static order. */
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

export function percentToRuleLevel(percent: number): string {
  if (percent >= 0.8) return 'KUAT';
  if (percent >= 0.5) return 'MEMBINA';
  return 'ASAS';
}

export function detectEnglishLevelFromAbility(ability: number): string {
  return abilityToCefr(ability);
}

export function detectMathLevelFromPercent(percent: number): string {
  const band = percentToRuleLevel(percent);
  if (band === 'KUAT') return 'MATH_KUAT';
  if (band === 'MEMBINA') return 'MATH_MEMBINA';
  return 'MATH_ASAS';
}

export function detectBmLevelFromPercent(percent: number): string {
  const band = percentToRuleLevel(percent);
  if (band === 'KUAT') return 'BM_KUAT';
  if (band === 'MEMBINA') return 'BM_MEMBINA';
  return 'BM_ASAS';
}

export function xpToLevelLabel(xp: number): string {
  if (xp >= 500) return 'Master';
  if (xp >= 250) return 'Explorer';
  if (xp >= 100) return 'Learner';
  return 'Novice';
}
