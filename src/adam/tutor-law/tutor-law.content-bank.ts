/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Content Bank (ERA_2g)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import type { PlacementSubject } from './tutor-law.placement-bank';

export type ContentKind = 'drill' | 'probe' | 'reading' | 'speaking_prompt';

export interface TutorContentItem {
  id:              string;
  kind:            ContentKind;
  subject:         PlacementSubject;
  conceptTag:      string;
  difficulty:      number;
  skill:           string;
  prompt:          string;
  acceptPatterns?: readonly RegExp[];
  scaffolding?:    string;
  zpdWeight?:      number;
  active:          boolean;
}

type ItemDef = [
  id: string,
  kind: ContentKind,
  subject: PlacementSubject,
  conceptTag: string,
  difficulty: number,
  skill: string,
  prompt: string,
  accept?: RegExp[],
];

function toItem(def: ItemDef): TutorContentItem {
  const [id, kind, subject, conceptTag, difficulty, skill, prompt, accept] = def;
  return {
    id,
    kind,
    subject,
    conceptTag,
    difficulty,
    skill,
    prompt,
    acceptPatterns: accept,
    active:           true,
    zpdWeight:        1,
  };
}

const ITEM_DEFS: ItemDef[] = [
  // English drills (20)
  ['ct-en-d01', 'drill', 'english', 'grammar.tenses.past_simple', -1.5, 'grammar',
    'Fill in: Yesterday I ___ (go) to the market.', [/\bwent\b/i]],
  ['ct-en-d02', 'drill', 'english', 'grammar.tenses.present_simple', -1, 'grammar',
    'She ___ tea every morning. (drink / drinks / drinking)', [/\bdrinks\b/i]],
  ['ct-en-d03', 'drill', 'english', 'grammar.tenses.past_simple', -1, 'grammar',
    'They ___ football last Sunday. (play / played / playing)', [/\bplayed\b/i]],
  ['ct-en-d04', 'drill', 'english', 'grammar.tenses.present_continuous', 0, 'grammar',
    'Listen! The baby ___ . (cry / is crying / cried)', [/\bis\s+crying\b/i]],
  ['ct-en-d05', 'drill', 'english', 'grammar.tenses.past_continuous', 0.5, 'grammar',
    'While I ___ , the phone rang. (sleep / slept / was sleeping)', [/\bwas\s+sleeping\b/i]],
  ['ct-en-d06', 'drill', 'english', 'grammar.tenses.present_perfect', 1, 'grammar',
    'I ___ this movie before. (see / saw / have seen)', [/\bhave\s+seen\b/i]],
  ['ct-en-d07', 'drill', 'english', 'grammar.conditionals', 1.5, 'grammar',
    'If it rains, we ___ at home. (stay / stayed / will stay)', [/\bwill\s+stay\b/i]],
  ['ct-en-d08', 'drill', 'english', 'vocabulary.collocation', -0.5, 'vocabulary',
    'Make a ___ (decide / decision / deciding)', [/\bdecision\b/i]],
  ['ct-en-d09', 'drill', 'english', 'reading.comprehension', 0, 'reading',
    'Ali forgot his umbrella, so he got wet. Why did Ali get wet?', [/\b(umbrella|rain|forgot)\b/i]],
  ['ct-en-d10', 'drill', 'english', 'writing.cohesion', 0.5, 'writing',
    'Choose: I was tired. ___, I went to bed. (However / Therefore / Although)', [/\btherefore\b/i]],
  ['ct-en-d11', 'drill', 'english', 'grammar.articles', -1, 'grammar',
    '___ honest person (a / an / the)', [/\ban\b/i]],
  ['ct-en-d12', 'drill', 'english', 'grammar.irregular_verbs', -0.5, 'grammar',
    'Past tense of "buy": ___', [/\bbought\b/i]],
  ['ct-en-d13', 'drill', 'english', 'grammar.tenses.future', 0, 'grammar',
    'We ___ visit grandma tomorrow. (will / would / going)', [/\bwill\b/i]],
  ['ct-en-d14', 'drill', 'english', 'grammar.tenses.present_simple', 0, 'grammar',
    '___ they like pizza? (Do / Does / Are)', [/\bdo\b/i]],
  ['ct-en-d15', 'drill', 'english', 'grammar.tenses.past_simple', 0, 'grammar',
    'He ___ not finish his homework. (do / does / did)', [/\bdid\b/i]],
  ['ct-en-d16', 'drill', 'english', 'vocabulary.collocation', 0.5, 'vocabulary',
    'Take a ___ (photo / photograph / photographing)', [/\bphoto(graph)?\b/i]],
  ['ct-en-d17', 'drill', 'english', 'reading.comprehension', 0.5, 'reading',
    'Siti studied hard and passed. What helped Siti pass?', [/\b(stud|hard|work)\b/i]],
  ['ct-en-d18', 'drill', 'english', 'writing.structure', 0.5, 'writing',
    'Name ONE part of a paragraph besides the topic sentence.', [/\b(support|detail|example|conclusion|body)\b/i]],
  ['ct-en-d19', 'drill', 'english', 'grammar.articles', 0, 'grammar',
    '___ sun rises in the east. (A / An / The)', [/\bthe\b/i]],
  ['ct-en-d20', 'drill', 'english', 'grammar.tenses.present_perfect', 1.5, 'grammar',
    'How long ___ you lived here? (do / did / have)', [/\bhave\b/i]],

  // English probes (8)
  ['ct-en-p01', 'probe', 'english', 'grammar.tenses.present_simple', 0, 'grammar',
    'When do we add -s to a verb in English? Give one example.', undefined],
  ['ct-en-p02', 'probe', 'english', 'grammar.tenses.past_simple', 0, 'grammar',
    'What is the rule for regular past tense verbs? Try with "walk".', [/\bwalked\b/i]],
  ['ct-en-p03', 'probe', 'english', 'grammar.tenses.present_continuous', 0.5, 'grammar',
    'Why do we use "am/is/are + -ing"? Give your own short sentence.', undefined],
  ['ct-en-p04', 'probe', 'english', 'grammar.conditionals', 1, 'grammar',
    'Complete: If I ___ (be) rich, I would travel.', [/\bwere\b/i]],
  ['ct-en-p05', 'probe', 'english', 'vocabulary.collocation', 0, 'vocabulary',
    'Which sounds natural: "make homework" or "do homework"? Why?', [/\bdo\s+homework\b/i]],
  ['ct-en-p06', 'probe', 'english', 'writing.cohesion', 0.5, 'writing',
    'Name two linking words that show contrast.', [/\b(however|although|but)\b/i]],
  ['ct-en-p07', 'probe', 'english', 'grammar.irregular_verbs', 0, 'grammar',
    'What is the past tense of "write"? Use it in a short sentence.', [/\bwrote\b/i]],
  ['ct-en-p08', 'probe', 'english', 'reading.comprehension', 0.5, 'reading',
    'Read: "The cat hid because it heard thunder." Why did the cat hide?', [/\b(thunder|noise|scared)\b/i]],

  // English reading (4)
  ['ct-en-r01', 'reading', 'english', 'reading.comprehension', 0, 'reading',
    'Read: "Mira saved RM5 each week. After four weeks she bought a book." How much did the book cost?', [/\b20\b/]],
  ['ct-en-r02', 'reading', 'english', 'reading.comprehension', 0.5, 'reading',
    'Read: "Although it was late, Hakim finished his project." Did Hakim finish?', [/\b(yes|finished|did)\b/i]],
  ['ct-en-r03', 'reading', 'english', 'reading.comprehension', 1, 'reading',
    'Read: "The experiment failed twice before the team changed one variable." What did the team change?', [/\b(variable|method|one)\b/i]],
  ['ct-en-r04', 'reading', 'english', 'writing.cohesion', 0.5, 'reading',
    'Read: "First, mix the flour. Next, add water. Finally, bake." What is the last step?', [/\b(bake|oven)\b/i]],

  // Math drills (12)
  ['ct-ma-d01', 'drill', 'math', 'math.arithmetic.addition', -2, 'arithmetic', '12 + 9 = ?', [/\b21\b/]],
  ['ct-ma-d02', 'drill', 'math', 'math.arithmetic.subtraction', -1.5, 'arithmetic', '45 − 18 = ?', [/\b27\b/]],
  ['ct-ma-d03', 'drill', 'math', 'math.arithmetic.multiplication', -1, 'arithmetic', '7 × 8 = ?', [/\b56\b/]],
  ['ct-ma-d04', 'drill', 'math', 'math.arithmetic.division', -0.5, 'arithmetic', '36 ÷ 4 = ?', [/\b9\b/]],
  ['ct-ma-d05', 'drill', 'math', 'math.fractions.operations', 0, 'fractions', '1/2 + 1/4 = ? (pecahan atau perpuluhan)', [/\b3\s*\/\s*4\b/, /\b0\.75\b/]],
  ['ct-ma-d06', 'drill', 'math', 'math.percentage.basic', 0.5, 'percentage', '10% daripada 50 = ?', [/\b5\b/]],
  ['ct-ma-d07', 'drill', 'math', 'math.arithmetic.addition', 0, 'arithmetic', '156 + 44 = ?', [/\b200\b/]],
  ['ct-ma-d08', 'drill', 'math', 'math.arithmetic.subtraction', 0.5, 'arithmetic', '100 − 37 = ?', [/\b63\b/]],
  ['ct-ma-d09', 'drill', 'math', 'math.arithmetic.multiplication', 0.5, 'arithmetic', '12 × 5 = ?', [/\b60\b/]],
  ['ct-ma-d10', 'drill', 'math', 'math.arithmetic.division', 1, 'arithmetic', '72 ÷ 8 = ?', [/\b9\b/]],
  ['ct-ma-d11', 'drill', 'math', 'math.fractions.operations', 1, 'fractions', '2/3 × 3 = ?', [/\b2\b/]],
  ['ct-ma-d12', 'drill', 'math', 'math.percentage.basic', 1.5, 'percentage', '25% daripada 80 = ?', [/\b20\b/]],

  // Math probes (4)
  ['ct-ma-p01', 'probe', 'math', 'math.arithmetic.addition', -1, 'arithmetic',
    'Without counting one-by-one: how do you add 48 + 22 quickly?', [/\b(70|carry|round|50|20)\b/i]],
  ['ct-ma-p02', 'probe', 'math', 'math.fractions.operations', 0.5, 'fractions',
    'Which is bigger: 1/3 or 1/4? Explain in one sentence.', [/\b1\s*\/\s*3\b/i]],
  ['ct-ma-p03', 'probe', 'math', 'math.percentage.basic', 1, 'percentage',
    'What does 50% mean in your own words?', [/\b(half|50|100)\b/i]],
  ['ct-ma-p04', 'probe', 'math', 'math.arithmetic.multiplication', 0, 'arithmetic',
    'Why is 6 × 0 = 0?', undefined],

  // BM drills (8)
  ['ct-bm-d01', 'drill', 'bm', 'bm.spelling', -1, 'ejaan',
    'Pilih ejaan betul: sekolah / skolah / sekolh', [/\bsekolah\b/i]],
  ['ct-bm-d02', 'drill', 'bm', 'bm.grammar.connectors', 0, 'tatabahasa',
    'Dia penat ___ dia berehat. (kerana / tetapi / walaupun)', [/\bkerana\b/i]],
  ['ct-bm-d03', 'drill', 'bm', 'bm.grammar.affixes', 0, 'imbuhan',
    'Imbuhan awalan untuk "tulis": ___', [/\bmenulis\b/i]],
  ['ct-bm-d04', 'drill', 'bm', 'bm.writing.structure', 0.5, 'karangan',
    'Nyatakan SATU unsur wajib karangan BM.', [/\b(pengenalan|isi|penutup)\b/i]],
  ['ct-bm-d05', 'drill', 'bm', 'bm.spelling', 0, 'ejaan',
    'Ejaan betul: perpustakaan / perpustakaan / perpustakaan?', [/\bperpustakaan\b/i]],
  ['ct-bm-d06', 'drill', 'bm', 'bm.grammar.connectors', 0.5, 'tatabahasa',
    'Saya nak pergi, ___ hujan lebat. (tetapi / kerana / dan)', [/\btetapi\b/i]],
  ['ct-bm-d07', 'drill', 'bm', 'bm.grammar.affixes', 0.5, 'imbuhan',
    'Kata dasar untuk "menyanyi": ___', [/\bnyanyi\b/i]],
  ['ct-bm-d08', 'drill', 'bm', 'bm.writing.structure', 1, 'karangan',
    'Apakah fungsi perenggan pengenalan?', [/\b(memperkenalkan|topik|latar|isi)\b/i]],

  // BM probes (4)
  ['ct-bm-p01', 'probe', 'bm', 'bm.spelling', -0.5, 'ejaan',
    'Apakah peraturan ejaan untuk imbuhan "me-" + kata bermula dengan vokal?', undefined],
  ['ct-bm-p02', 'probe', 'bm', 'bm.grammar.connectors', 0, 'tatabahasa',
    'Beri satu contoh ayat dengan kata hubung "walaupun".', [/\bwalaupun\b/i]],
  ['ct-bm-p03', 'probe', 'bm', 'bm.grammar.affixes', 0.5, 'imbuhan',
    'Apakah beza imbuhan awalan dan akhiran? Satu contoh setiap satu.', undefined],
  ['ct-bm-p04', 'probe', 'bm', 'bm.writing.structure', 0.5, 'karangan',
    'Mengapa perenggan isi penting dalam karangan?', [/\b(huraian|bukti|isi|argumen)\b/i]],
];

export const CONTENT_ITEM_BANK: readonly TutorContentItem[] = ITEM_DEFS.map(toItem);

export function getContentItemById(id: string): TutorContentItem | null {
  return CONTENT_ITEM_BANK.find((item) => item.id === id && item.active) ?? null;
}

export function getActiveContentBank(): readonly TutorContentItem[] {
  return CONTENT_ITEM_BANK.filter((item) => item.active);
}
