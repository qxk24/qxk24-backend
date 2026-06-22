/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Theory Pedagogy Scripts
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
 *
 * Intuition before notation. Trace before derive complexity.
 */

import { TheoryTopic } from './tutor-law.ce-theory.types';

export const COMPLEXITY_PROBES: Partial<Record<TheoryTopic, string>> = {
  [TheoryTopic.SORTING]:
    'Sebelum kita derive complexity — trace algoritma ni dengan input kecil dulu. Guna n=5 elemen. Kira berapa kali operasi perbandingan berlaku. Tunjukkan trace tu.',
  [TheoryTopic.GRAPH_ALGO]:
    'Untuk complexity graf — kita perlu tahu V (vertices) dan E (edges) dulu. Trace algoritma untuk graf kecil (3-4 node). Berapa kali setiap node dilawati?',
  [TheoryTopic.DYNAMIC_PROG]:
    'DP complexity datang dari bilangan subproblem × masa setiap subproblem. Berapa subproblem yang unik ada? Lukis memoization table untuk input kecil dulu.',
  [TheoryTopic.UNKNOWN]:
    'Sebelum kita bagi O-notation — trace algoritma untuk input kecil dulu. Kira operasi asas yang berlaku. Tunjukkan trace tu, kita derive dari situ.',
};

export const PROOF_PROBES: Partial<Record<TheoryTopic, string>> = {
  [TheoryTopic.PROOF_TECHNIQUES]:
    'Sebelum kita tulis proof formal — apa INTUISI kamu? Kenapa kamu rasa statement ni betul? Terangkan dalam bahasa biasa dulu.',
  [TheoryTopic.SORTING]:
    'Untuk prove correctness — apa loop invariant yang kamu cadangkan? Cuba tulis: "Pada akhir setiap iterasi, [X] adalah benar." Apa X?',
  [TheoryTopic.DYNAMIC_PROG]:
    'Proof DP biasanya guna induction ke atas subproblem size. Apa base case kamu? Apa yang kamu nak prove untuk kes n dari kes n-1?',
  [TheoryTopic.UNKNOWN]:
    'Untuk mulakan proof — apa intuisi kamu kenapa statement ini benar? Jangan tulis notasi dulu. Terangkan logik dalam bahasa biasa.',
};

export const DESIGN_SCAFFOLDS: Partial<Record<TheoryTopic, string>> = {
  [TheoryTopic.SORTING]:
    'Untuk design algoritma sort:\n1. Apa strategi asas — comparison-based atau non-comparison?\n2. Berapa complexity yang kita targetkan?\n3. Adakah kita ada memory constraint?\nJawab tiga soalan ni dulu.',
  [TheoryTopic.GRAPH_ALGO]:
    'Untuk design graph algorithm:\n1. Graf directed atau undirected?\n2. Ada weight pada edge?\n3. Apa yang kita cari — shortest path, connected component, cycle?\nKenal pasti dulu.',
  [TheoryTopic.DYNAMIC_PROG]:
    'Untuk design DP:\n1. Apa subproblem structure?\n2. Apa recurrence relation?\n3. Bottom-up atau top-down?\nCuba jawab soalan 1 dulu: apa maklumat yang cukup untuk solve subproblem terkecil?',
  [TheoryTopic.UNKNOWN]:
    'Untuk design algoritma:\n1. Apa input dan output?\n2. Apa constraint — masa, memori, saiz input?\n3. Adakah ada pattern yang kamu kenal dalam masalah ni (sort, search, graph)?\nMula dengan soalan 1.',
};

export const TRACE_ANCHORS: Partial<Record<TheoryTopic, string>> = {
  [TheoryTopic.SORTING]:
    'Ok kita trace. Guna array kecil: [5, 2, 8, 1]. Tunjukkan langkah pertama algoritma pada array ni.',
  [TheoryTopic.GRAPH_ALGO]:
    'Untuk trace — lukis graf kecil (4 node, beberapa edge). Tunjukkan node mana yang dikunjungi pertama dan kenapa.',
  [TheoryTopic.DYNAMIC_PROG]:
    'Trace DP dengan input kecil. Lukis table memoization. Isi satu cell dulu — tunjukkan bagaimana nilai tu dikira.',
  [TheoryTopic.AUTOMATA]:
    'Trace DFA/NFA dengan string pendek. Ikut setiap simbol satu persatu — tunjukkan state selepas setiap input simbol.',
  [TheoryTopic.UNKNOWN]:
    'Cuba trace algoritma ni dengan contoh kecil. Pilih input yang mudah, ikut setiap langkah. Tunjukkan langkah pertama.',
};

export const CONCEPT_PROBES: Partial<Record<TheoryTopic, string>> = {
  [TheoryTopic.COMPLEXITY]:
    'Sebelum bincang P vs NP — kamu faham apa yang dimaksudkan dengan "menyelesaikan" masalah dalam masa polynomial? Cuba terangkan dengan kata-kata kamu sendiri.',
  [TheoryTopic.AUTOMATA]:
    'Sebelum kita bincang DFA — kamu tahu tak apa itu finite state? Terangkan dalam satu ayat apa yang finite state machine buat.',
  [TheoryTopic.DYNAMIC_PROG]:
    'Sebelum masuk DP — apa beza memoization dengan tabulation? Cuba terangkan mana satu dari atas ke bawah dan mana dari bawah ke atas.',
  [TheoryTopic.UNKNOWN]:
    'Sebelum kita mula — apa yang kamu dah tahu tentang topik ni? Terangkan dalam satu ayat.',
};

export const EXAM_REDIRECT_BM =
  'Soalan ni nampak dari peperiksaan atau tugasan. '
  + 'ADAM tidak akan selesaikan atau buktikan untuk kamu. '
  + 'Tapi ADAM boleh bimbing kamu memahami cara mendekatinya. '
  + 'Mula dengan: apa jenis masalah ni — sorting, graph, DP, automata, atau proof?';

export const EXAM_REDIRECT_EN =
  'This looks like an exam or assignment question. '
  + 'ADAM will not solve or complete the proof for you. '
  + 'But ADAM can guide you on how to approach it. '
  + 'Start with: what kind of problem is this — sorting, graph, DP, automata, or proof?';

export function isMalayTheoryTurn(norm: string): boolean {
  return /nak|tak|boleh|macam|kenapa|saya|kamu|algoritma|buktikan/.test(norm);
}
