/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Theory Intent Signals
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { TheoryTopic } from './tutor-law.ce-theory.types';

export const THEORY_CONCEPT_SIGNALS = [
  'apa itu', 'tak faham', 'explain', 'terangkan', 'what is',
  'macam mana', 'how does', 'beza antara', 'apa beza', 'difference between',
  'kenapa', 'why', 'intuisi', 'intuition',
] as const;

export const THEORY_COMPLEXITY_SIGNALS = [
  'complexity', 'kompleksiti', 'big o', 'big-o', 'o(n', 'o(log',
  'time complexity', 'space complexity', 'asymptotic', 'worst case',
  'average case', 'best case', 'omega', 'theta', 'recurrence',
  'master theorem', 'analisis', 'analyse', 'how fast', 'berapa laju',
] as const;

export const THEORY_TRACE_SIGNALS = [
  'trace', 'jejak', 'simulate', 'simulasi', 'run through',
  'step through', 'ikut langkah', 'tunjuk cara', 'contoh input',
  'example input', 'dry run', 'manual trace',
] as const;

export const THEORY_PROOF_SIGNALS = [
  'proof', 'buktikan', 'prove', 'terbukti', 'tunjukkan bahawa',
  'show that', 'derive', 'terbitan', 'induction', 'induksi',
  'contradiction', 'kontradiksi', 'loop invariant', 'invariant',
  'correctness', 'ketepatan', 'formal', 'by contradiction',
] as const;

export const THEORY_DESIGN_SIGNALS = [
  'design algorithm', 'reka algoritma', 'how to solve', 'macam mana nak selesaikan',
  'algorithm for', 'algoritma untuk', 'approach', 'pendekatan',
  'strategy', 'strategi', 'solve problem', 'selesaikan masalah',
] as const;

export const THEORY_EXAM_SIGNALS = [
  'tolong selesaikan', 'jawabkan', 'siapkan', 'tugasan', 'assignment',
  'soalan peperiksaan', 'do this for me', 'solve this for me',
  'complete the proof', 'write the algorithm',
] as const;

export const THEORY_TOPIC_SIGNALS: Record<TheoryTopic, readonly string[]> = {
  [TheoryTopic.SORTING]:          ['sort', 'susun', 'bubble', 'merge', 'quick', 'heap', 'insertion', 'selection', 'radix', 'counting sort'],
  [TheoryTopic.GRAPH_ALGO]:       ['graph', 'graf', 'bfs', 'dfs', 'dijkstra', 'bellman', 'floyd', 'prim', 'kruskal', 'topological', 'shortest path', 'laluan terpendek'],
  [TheoryTopic.DYNAMIC_PROG]:     ['dynamic programming', 'dp', 'pengaturcaraan dinamik', 'memoization', 'tabulation', 'subproblem', 'optimal substructure', 'overlapping'],
  [TheoryTopic.GREEDY]:           ['greedy', 'tamak', 'locally optimal', 'activity selection', 'huffman', 'optimal lokal'],
  [TheoryTopic.DIVIDE_CONQUER]:   ['divide and conquer', 'bahagi dan takluk', 'merge sort', 'binary search', 'carian binari', 'strassen'],
  [TheoryTopic.COMPLEXITY]:       ['p vs np', 'np-complete', 'np-hard', 'nondeterministic', 'reduction', 'penurunan', 'decidable', 'undecidable', 'halting problem'],
  [TheoryTopic.AUTOMATA]:         ['automata', 'dfa', 'nfa', 'pda', 'turing machine', 'mesin turing', 'finite state', 'fsm', 'transition function'],
  [TheoryTopic.FORMAL_LANG]:      ['regular language', 'context free', 'cfg', 'grammar', 'tatabahasa', 'pumping lemma', 'chomsky', 'derivation'],
  [TheoryTopic.PROOF_TECHNIQUES]: ['induction', 'induksi', 'base case', 'kes asas', 'inductive step', 'contradiction', 'contrapositive', 'direct proof'],
  [TheoryTopic.DISCRETE_MATH]:    ['set', 'himpunan', 'relation', 'hubungan', 'function', 'fungsi', 'bijection', 'modular', 'combination', 'permutation', 'binomial'],
  [TheoryTopic.UNKNOWN]:          [],
};

export function countTheoryHits(norm: string, signals: readonly string[]): number {
  return signals.filter((signal) => {
    if (signal.includes(' ')) return norm.includes(signal);
    const re = new RegExp(`\\b${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(norm);
  }).length;
}

export function detectTheoryTopic(
  norm: string,
  prior: TheoryTopic | null,
): TheoryTopic {
  let best: TheoryTopic = TheoryTopic.UNKNOWN;
  let bestScore = 0;
  for (const [topic, signals] of Object.entries(THEORY_TOPIC_SIGNALS)) {
    if (topic === TheoryTopic.UNKNOWN) continue;
    const score = countTheoryHits(norm, signals);
    if (score > bestScore) {
      bestScore = score;
      best = topic as TheoryTopic;
    }
  }
  return bestScore > 0 ? best : (prior ?? TheoryTopic.UNKNOWN);
}
