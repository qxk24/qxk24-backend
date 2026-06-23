/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Karangan Pedagogy (BM / UPSR–SPM)
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
 * Malaysian Karangan pedagogy — 5F, PIE/PEEL, 5W1H, exam rubric.
 * Complements Rule 61 language-writing intents; never bypasses TRAP law.
 */

import {
  LanguageClassifierOutput,
  LanguageIntent,
  LanguageVariant,
  WritingType,
} from './tutor-law.language-writing.types';
import type { AdamTutorLevel, AdamTutorProfile } from './tutor-law.types';

export enum KaranganGenre {
  NARATIF          = 'NARATIF',
  DESKRIPTIF       = 'DESKRIPTIF',
  PROSES           = 'PROSES',
  FAKTA            = 'FAKTA',
  SURAT_RASMI      = 'SURAT_RASMI',
  SURAT_TIDAK_RASMI = 'SURAT_TIDAK_RASMI',
  LAPORAN          = 'LAPORAN',
  PIDATO           = 'PIDATO',
  UNKNOWN          = 'UNKNOWN',
}

export enum KaranganExamTier {
  UPSR = 'UPSR',
  PT3  = 'PT3',
  SPM  = 'SPM',
}

const GENRE_SIGNALS: Partial<Record<KaranganGenre, readonly RegExp[]>> = {
  [KaranganGenre.NARATIF]: [
    /cerita|naratif|pengalaman|tidak\s*dapat\s*dilupakan|dialog|watak|plot|klimaks/i,
  ],
  [KaranganGenre.DESKRIPTIF]: [
    /deskriptif|huraian|huraikan|indahnya|tempat|gambaran|panca\s*indera/i,
  ],
  [KaranganGenre.PROSES]: [
    /proses|langkah|langkah\s*demi|cara\s*men|prosedur|tutorial/i,
  ],
  [KaranganGenre.FAKTA]: [
    /fakta|isu\s*semasa|kepentingan|langkah\s*mengatasi|hujah|pendapat|peel|kitar\s*semula|amalan/i,
  ],
  [KaranganGenre.SURAT_RASMI]: [
    /surat\s*rasmi|tuan\s*\/\s*puan|yang\s*benar|per\s*:/i,
  ],
  [KaranganGenre.SURAT_TIDAK_RASMI]: [
    /surat\s*tidak\s*rasmi|surat\s*persahabatan|saudara\/saudari|wassalam/i,
  ],
  [KaranganGenre.LAPORAN]: [
    /laporan\s*lawatan|laporan\s*aktiviti|pemerhatian|dapatan|cadangan/i,
  ],
  [KaranganGenre.PIDATO]: [
    /pidato|syarahan|ucapan|rahsia\s*kejayaan\s*pelajar/i,
  ],
};

const UPSR_MARKERS = /\b(?:upsr|darjah|tahun\s*[1-6]|year\s*[1-6]|kssr\s*rendah)\b/i;
const PT3_MARKERS  = /\b(?:pt3|tingkatan\s*[1-3]|form\s*[1-3]|tahun\s*[7-9])\b/i;
const SPM_MARKERS  = /\b(?:spm|tingkatan\s*[4-5]|form\s*[4-5]|tahun\s*1[0-1])\b/i;

/** Bank kosa kata mengikut topik karangan peperiksaan Malaysia. */
export enum KaranganVocabTopic {
  ALAM_SEKITAR = 'ALAM_SEKITAR',
  PENDIDIKAN   = 'PENDIDIKAN',
  KESIHATAN    = 'KESIHATAN',
  UNKNOWN      = 'UNKNOWN',
}

export const KARANGAN_VOCAB_BANK: Readonly<Record<KaranganVocabTopic, readonly string[]>> = {
  [KaranganVocabTopic.ALAM_SEKITAR]: [
    'pemuliharaan',
    'lestari',
    'pencemaran',
    'ekosistem',
    'biodiversiti',
    'hakisan tanah',
    'pemanasan global',
    'jejak karbon',
    'kitar semula',
    'sisa pepejal',
    'biokepelbagaian',
  ],
  [KaranganVocabTopic.PENDIDIKAN]: [
    'pedagogi',
    'kurikulum',
    'kokurikulum',
    'pembelajaran abad ke-21',
    'kemahiran insaniah',
    'literasi digital',
    'pembelajaran sepanjang hayat',
    'literasi',
    'pendidikan holistik',
    'kemahiran abad ke-21',
  ],
  [KaranganVocabTopic.KESIHATAN]: [
    'imuniti',
    'pemakanan seimbang',
    'gaya hidup sihat',
    'penyakit tidak berjangkit',
    'kecergasan fizikal',
    'kesihatan mental',
    'nutrien',
    'senaman berkala',
    'rehat mencukupi',
  ],
  [KaranganVocabTopic.UNKNOWN]: [],
};

const VOCAB_TOPIC_SIGNALS: Partial<Record<KaranganVocabTopic, readonly RegExp[]>> = {
  [KaranganVocabTopic.ALAM_SEKITAR]: [
    /alam\s*sekitar|kitar\s*semula|pencemaran|ekosistem|hutan|sungai|pembalakan|pemanasan\s*global|karbon|biodiversiti|biokepelbagaian|sisa\s*pepejal|lestari|pemuliharaan/i,
  ],
  [KaranganVocabTopic.PENDIDIKAN]: [
    /pendidikan|pembelajaran|sekolah|pelajar|guru|kurikulum|kokurikulum|literasi|pendidikan\s*abad|insaniah|teknologi\s*dalam\s*pendidikan|membaca|perpustakaan/i,
  ],
  [KaranganVocabTopic.KESIHATAN]: [
    /kesihatan|sihat|pemakanan|senaman|imuniti|penyakit|mental|fizikal|rehat|rokok|alkohol|nutrien|kecergasan|amalan\s*hidup\s*sihat/i,
  ],
};

export function resolveKaranganVocabTopic(text: string): KaranganVocabTopic {
  const norm = text.toLowerCase();
  let best: KaranganVocabTopic = KaranganVocabTopic.UNKNOWN;
  let bestScore = 0;

  for (const [topic, patterns] of Object.entries(VOCAB_TOPIC_SIGNALS)) {
    const score = patterns?.reduce(
      (acc, re) => acc + (re.test(norm) ? 1 : 0),
      0,
    ) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = topic as KaranganVocabTopic;
    }
  }

  return best;
}

export function lookupKaranganVocab(
  topic: KaranganVocabTopic,
  limit = 8,
): readonly string[] {
  if (topic === KaranganVocabTopic.UNKNOWN) return [];
  return KARANGAN_VOCAB_BANK[topic].slice(0, limit);
}

export function buildKaranganVocabHint(
  topic: KaranganVocabTopic,
  lang: LanguageVariant,
): string {
  const words = lookupKaranganVocab(topic);
  if (words.length === 0) return '';

  const isBm = lang !== LanguageVariant.ENGLISH;
  const labelMap: Record<Exclude<KaranganVocabTopic, KaranganVocabTopic.UNKNOWN>, string> = {
    [KaranganVocabTopic.ALAM_SEKITAR]: 'Alam Sekitar',
    [KaranganVocabTopic.PENDIDIKAN]:   'Pendidikan',
    [KaranganVocabTopic.KESIHATAN]:    'Kesihatan',
  };
  const label = isBm
    ? (labelMap[topic as Exclude<KaranganVocabTopic, KaranganVocabTopic.UNKNOWN>] ?? topic)
    : topic.replace(/_/g, ' ');

  if (!isBm) {
    return (
      `Vocabulary booster (${label}): ${words.join(', ')}.\n`
      + 'Ask the student to pick ONE word and use it in their own sentence — do not write the sentence for them.'
    );
  }

  return (
    `Kosa Kata Power (${label}): ${words.join(', ')}.\n`
    + 'Minta pelajar pilih SATU perkataan dan guna dalam ayat sendiri — jangan tulis ayat siap untuk pelajar.'
  );
}

export const ADAM_TUTOR_KARANGAN_CORE_LAW = `
ADAM TUTOR — KARANGAN BM (UPSR / PT3 / SPM):

Peranan: Cikgu karangan Malaysia — bimbing pelajar menulis sendiri; JANGAN hantar karangan siap salin.

Formula 5F (turn demi turn, bukan semua sekaligus):
• F1 FAHAM — kenal pasti kata tugas & jenis karangan.
• F2 FIKIR — cuci otak (5W1H / peta minda); pelajar jawab, ADAM kembangkan.
• F3 FORM — pengenalan (50–80 patah) + 3–4 isi + penutup (40–60 patah).
• F4 FRASA — kosa kata, penanda wacana, peribahasa sesuai konteks.
• F5 FINAL — semak ejaan, tatabahasa, kesesuaian isi, panjang.

Isi setiap perenggan: PIE (Point → Illustration/contoh → Effect/Explanation).
Karangan fakta/isu: PEEL (Point → Explanation → Example → Link).

Jenis peperiksaan: Naratif (plot 5 bahagian), Deskriptif, Proses, Fakta/Isu, Surat, Laporan, Pidato.

Latihan berperingkat: ayat → perenggan (1 isi) → karangan penuh (simulasi peperiksaan).

Penanda wacana wajib latih: Pertama, Seterusnya, Selain itu, Justeru, Kesimpulannya.

Jangan tulis karangan penuh — scaffold, probe, dan maklum balas rubrik sahaja.
`.trim();

export const ADAM_TUTOR_KARANGAN_REVIEW_LAW = `
ADAM TUTOR — SEMAK KARANGAN (rubrik SPM, pelajar tulis sendiri):

Selepas feedback anchor pelajar, beri maklum balas dalam format ringkas:
• MARKAH anggaran /100 (Isi 30%, Bahasa 40%, Struktur 20%, Mekanikal 10%)
• 2 kekuatan spesifik
• 2 isu → cadangan penambahbaikan (bukan ayat siap salin)
• 1–2 tips karangan seterusnya
• SATU contoh: ayat pelajar asal → arahan cara memperbaiki (bukan tulis semula penuh)
• Sasaran seterusnya (1 fokus)

JANGAN tulis semula perenggan atau karangan pelajar.
`.trim();

export interface KaranganTurnContext {
  languageIntent: LanguageClassifierOutput | null;
  userMessage:    string;
  profile?:       AdamTutorProfile;
}

export function detectKaranganGenre(text: string): KaranganGenre {
  const norm = text.toLowerCase();
  for (const [genre, patterns] of Object.entries(GENRE_SIGNALS)) {
    if (patterns?.some((re) => re.test(norm))) {
      return genre as KaranganGenre;
    }
  }
  return KaranganGenre.UNKNOWN;
}

export function resolveKaranganExamTier(
  profile?: Pick<AdamTutorProfile, 'level'> | AdamTutorLevel,
  message?: string,
): KaranganExamTier {
  const blob = (message ?? '').toLowerCase();
  if (SPM_MARKERS.test(blob)) return KaranganExamTier.SPM;
  if (PT3_MARKERS.test(blob)) return KaranganExamTier.PT3;
  if (UPSR_MARKERS.test(blob)) return KaranganExamTier.UPSR;

  const level = typeof profile === 'string' ? profile : profile?.level;
  switch (level) {
    case 'primary':
      return KaranganExamTier.UPSR;
    case 'secondary':
      return KaranganExamTier.SPM;
    default:
      return KaranganExamTier.SPM;
  }
}

function wordCountHint(tier: KaranganExamTier): string {
  switch (tier) {
    case KaranganExamTier.UPSR:
      return 'UPSR: ~120–180 patah; ayat pendek; 2–3 isi.';
    case KaranganExamTier.PT3:
      return 'PT3: ~200–250 patah; 3 isi; masa ~45 minit simulasi.';
    default:
      return 'SPM: ~350–500 patah; 3–4 isi; masa ~60 minit simulasi.';
  }
}

function genreStructureHint(genre: KaranganGenre): string {
  switch (genre) {
    case KaranganGenre.NARATIF:
      return 'Naratif: permulaan → masalah → klimaks → penyelesaian → penutup; guna dialog & panca indera.';
    case KaranganGenre.DESKRIPTIF:
      return 'Deskriptif: pengenalan tempat → huraian terperinci (indera) → perasaan/impresi → penutup.';
    case KaranganGenre.PROSES:
      return 'Proses: pengenalan → langkah demi langkah (Pertama, Seterusnya, Akhir sekali) → penutup.';
    case KaranganGenre.FAKTA:
      return 'Fakta/Isu: pengenalan (umum→khusus→tesis) + isi PEEL + penutup (kesimpulan+harapan).';
    case KaranganGenre.SURAT_RASMI:
      return 'Surat rasmi: alamat, tarikh, Kepada, Tuan/Puan, PER:, 3–4 perenggan isi, Yang benar.';
    case KaranganGenre.SURAT_TIDAK_RASMI:
      return 'Surat tidak rasmi: salam, 2–3 perenggan mesra, Wassalam.';
    case KaranganGenre.LAPORAN:
      return 'Laporan: tajuk, latar, objektif, dapatan, cadangan, penutup.';
    case KaranganGenre.PIDATO:
      return 'Pidato: salam, hook, 3 hujah, seruan, penutup.';
    default:
      return 'Kenal pasti jenis karangan dari kata tugas sebelum susun struktur.';
  }
}

export function buildKaranganBrainstormProbe(
  lang: LanguageVariant,
  tier: KaranganExamTier,
): string {
  const isBm = lang !== LanguageVariant.ENGLISH;
  const wc = wordCountHint(tier);

  if (!isBm) {
    return (
      'Let\'s brainstorm (5W1H). Answer ONE question at a time:\n'
      + '1. What is the topic about?\n'
      + '2. Why does it matter?\n'
      + '3. When / where / who is involved?\n'
      + '4. How can it be done or improved?\n'
      + `Target: ${wc}`
    );
  }

  return (
    'Mari cuci otak bersama (5W1H) — jawab SATU soalan setiap turn:\n'
    + '1. Apa (What) — topik ini tentang apa?\n'
    + '2. Mengapa (Why) — kenapa ia penting?\n'
    + '3. Bila / Di mana / Siapa?\n'
    + '4. Bagaimana (How) — langkah atau cara?\n'
    + `Sasaran panjang: ${wc}\n`
    + 'Selepas pelajar jawab, ADAM kembangkan idea — jangan tulis karangan siap.'
  );
}

export function buildKaranganStructureScaffold(
  genre: KaranganGenre,
  lang: LanguageVariant,
  tier: KaranganExamTier,
): string {
  const isBm = lang !== LanguageVariant.ENGLISH;
  const structure = genreStructureHint(genre);
  const wc = wordCountHint(tier);

  if (!isBm) {
    return (
      `Structure scaffold (${wc}):\n`
      + `${structure}\n`
      + 'List 3 main points as short bullets — not full sentences yet. '
      + 'Each body paragraph: Point → Example → Effect.'
    );
  }

  return (
    `Scaffold struktur karangan (${wc}):\n`
    + `${structure}\n\n`
    + 'Formula pengenalan: Ayat Umum → Ayat Khusus → Ayat Tesis.\n'
    + 'Setiap isi: PIE (Point → Illustration/contoh → Effect).\n'
    + 'Penutup: Kesimpulan → Harapan/Seruan → Penegasan.\n\n'
    + 'Minta pelajar senaraikan 3 isi dalam point ringkas — bukan ayat penuh lagi.'
  );
}

export function buildKaranganTrapRedirect(
  lang: LanguageVariant,
  genre: KaranganGenre,
): string {
  const isBm = lang !== LanguageVariant.ENGLISH;
  const genreHint = genre !== KaranganGenre.UNKNOWN
    ? (isBm ? ` Jenis karangan: ${genre}.` : ` Genre: ${genre}.`)
    : '';

  if (!isBm) {
    return (
      'ADAM will not write the essay for you — that skill is yours to build.'
      + `${genreHint} Start with 5W1H: what are three things that matter most on this topic?`
    );
  }

  return (
    'ADAM tidak akan menulis karangan untuk kamu — kemahiran mengarang perlu dibina sendiri.'
    + `${genreHint} Mari cuci otak: apakah tiga perkara utama tentang tajuk ini? `
    + 'Jawab satu persatu; ADAM bantu kembangkan idea, bukan tulis siap.'
  );
}

export function buildKaranganGrammarScaffold(lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;
  if (!isBm) {
    return (
      'Sentence upgrade (one step): identify weak word → suggest 2 stronger synonyms → '
      + 'student rewrites ONE sentence. Do not rewrite the full paragraph.'
    );
  }
  return (
    'Naik taraf ayat (satu langkah): kenal pasti perkataan lemah → cadang 2 sinonim → '
    + 'pelajar tulis semula SATU ayat. Latih penanda wacana & ejaan — jangan tulis semula perenggan penuh.'
  );
}

export function buildKaranganPedagogyTurnLaw(ctx: KaranganTurnContext): string {
  const intent = ctx.languageIntent;
  if (!intent || intent.writingType !== WritingType.KARANGAN) return '';

  const genre = detectKaranganGenre(ctx.userMessage);
  const tier  = resolveKaranganExamTier(ctx.profile, ctx.userMessage);
  const vocabTopic = resolveKaranganVocabTopic(ctx.userMessage);
  const parts: string[] = [
    ADAM_TUTOR_KARANGAN_CORE_LAW,
    `KARANGAN CONTEXT: genre=${genre}, peperiksaan=${tier}, topik_kosa_kata=${vocabTopic}`,
    genreStructureHint(genre),
    wordCountHint(tier),
  ];

  const vocabHint = buildKaranganVocabHint(vocabTopic, intent.languageVariant);
  if (vocabHint) parts.push(`KARANGAN VOCAB LOOKUP (turn ini):\n${vocabHint}`);

  switch (intent.intent) {
    case LanguageIntent.TRAP:
      parts.push(buildKaranganTrapRedirect(intent.languageVariant, genre));
      break;
    case LanguageIntent.W_IDEA:
      parts.push(`KARANGAN BRAINSTORM (5W1H turn ini):\n${buildKaranganBrainstormProbe(intent.languageVariant, tier)}`);
      break;
    case LanguageIntent.W_STRUCTURE:
      parts.push(
        `KARANGAN STRUCTURE SCAFFOLD (turn ini):\n${
          buildKaranganStructureScaffold(genre, intent.languageVariant, tier)}`,
      );
      break;
    case LanguageIntent.W_REVIEW:
      parts.push(ADAM_TUTOR_KARANGAN_REVIEW_LAW);
      break;
    case LanguageIntent.G_GRAMMAR:
      parts.push(`KARANGAN LANGUAGE (turn ini):\n${buildKaranganGrammarScaffold(intent.languageVariant)}`);
      break;
    default:
      break;
  }

  return parts.filter(Boolean).join('\n\n');
}
