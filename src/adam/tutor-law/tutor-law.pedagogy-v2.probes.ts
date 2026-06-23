/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Probes
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

import {
  CrossCurricularCluster,
  IThinkMapType,
} from './tutor-law.pedagogy-v2.types';

export const FEYNMAN_PROBE_BM =
  'Cuba terangkan konsep ini dalam 3–5 ayat mudah — macam anda ajar rakan sekelas yang belum pernah dengar. '
  + 'Jangan guna istilah teknikal dulu; ADAM akan semak di mana jurang pemahaman.';

export const FEYNMAN_PROBE_EN =
  'Try explaining this concept in 3–5 simple sentences — as if teaching a classmate who has never heard it. '
  + 'Skip jargon first; ADAM will check for gaps in understanding.';

export const METACOGNITION_PROBE_BM =
  'Ambil 2 minit refleksi — jawab tiga soalan ini (bullet pendek sudah cukup):\n'
  + '1. Apa satu perkara yang saya belajar hari ini?\n'
  + '2. Apa yang masih kurang jelas?\n'
  + '3. Apa langkah kecil esok untuk perbaiki?';

export const METACOGNITION_PROBE_EN =
  'Take 2 minutes to reflect — answer these three (short bullets are fine):\n'
  + '1. What is one thing I learned today?\n'
  + '2. What is still unclear?\n'
  + '3. What small step will I take tomorrow?';

const ITHINK_SCAFFOLDS: Record<IThinkMapType, string> = {
  [IThinkMapType.BUBBLE]: [
    'Peta Buih — isi sendiri (ADAM tidak isi kandungan siap):',
    '• Pusat (topik): ___________',
    '• Cabang 1: ___________',
    '• Cabang 2: ___________',
    '• Cabang 3: ___________',
    'Cuba isi tiga cabang — ADAM semak selepas itu.',
  ].join('\n'),
  [IThinkMapType.DOUBLE_BUBBLE]: [
    'Peta Double Bubble — bandingkan dua topik:',
    '• Kiri (topik A): ___________',
    '• Kanan (topik B): ___________',
    '• Persamaan (tengah): ___________',
    '• Perbezaan (kiri/kanan): ___________',
  ].join('\n'),
  [IThinkMapType.FLOW]: [
    'Peta Alir — urutan sebab-akibat:',
    '• Mulakan: ___________',
    '• Langkah/seterusnya: ___________ → ___________ → ___________',
    '• Akhir: ___________',
  ].join('\n'),
  [IThinkMapType.MULTI_FLOW]: [
    'Peta Berbilang Alir — sebab & kesan:',
    '• Peristiwa pusat: ___________',
    '• Sebab (kiri): ___________',
    '• Kesan (kanan): ___________',
  ].join('\n'),
  [IThinkMapType.BRIDGE]: [
    'Peta Jambatan — analogi:',
    '• Konsep asal: ___________',
    '• Analogi harian: ___________',
    '• Persamaan: ___________',
  ].join('\n'),
  [IThinkMapType.TREE]: [
    'Peta Pokok — klasifikasi:',
    '• Kategori utama: ___________',
    '• Sub-kategori 1: ___________',
    '• Sub-kategori 2: ___________',
  ].join('\n'),
  [IThinkMapType.CIRCLE]: [
    'Peta Jejari — definisi & konteks:',
    '• Pusat (definisi ringkas): ___________',
    '• Konteks 1: ___________',
    '• Contoh: ___________',
  ].join('\n'),
  [IThinkMapType.BRACE]: [
    'Peta Kurungan — pecahan bahagian:',
    '• Keseluruhan: ___________',
    '• Bahagian 1: ___________',
    '• Bahagian 2: ___________',
  ].join('\n'),
  [IThinkMapType.UNKNOWN]: [
    'Peta i-Think — pilih satu jenis (Buih / Alir / Pokok) dan isi node kosong sendiri.',
    '• Topik: ___________',
    '• Node 1: ___________',
    '• Node 2: ___________',
  ].join('\n'),
};

const CROSS_LINKS: Record<CrossCurricularCluster, string> = {
  [CrossCurricularCluster.HISTORY_GEO_ECON]:
    'Cadangan pautan: Sejarah (polisi/kolonial) ↔ Geografi (lokasi sumber) ↔ Ekonomi/Matematik (nilai dagang, kuantiti). '
    + 'Pilih SATU pautan — pelajar jelaskan sendiri.',
  [CrossCurricularCluster.SCIENCE_MATH]:
    'Cadangan pautan: Konsep sains (contoh kadar tindak balas) ↔ Matematik (graf, unit, nisbah). '
    + 'Minta pelajar nyatakan satu persamaan atau graf yang relevan.',
  [CrossCurricularCluster.LANGUAGE_HUMANITIES]:
    'Cadangan pautan: Bahasa (struktur hujah) ↔ Kemanusiaan (bukti sejarah/sivik). '
    + 'Minta pelajar senaraikan satu bukti teks untuk sokong hujah.',
  [CrossCurricularCluster.STEM_SOCIETY]:
    'Cadangan pautan: STEM (data/teknologi) ↔ masyarakat (kesan sosial). '
    + 'Minta pelajar jelaskan satu kesan kepada komuniti.',
  [CrossCurricularCluster.GENERAL]:
    'Cadangan pautan merentas subjek — pilih dua bidang yang pelajar sebut, minta SATU ayat hubungan.',
};

const FORMATIVE_TEMPLATES: Record<string, string[]> = {
  arithmetic: [
    'Latihan 1: Kira 347 + 256 — tulis digit Sa dulu.',
    'Latihan 2: Ali ada 120 guli, beri 45 — berapa baki? (satu langkah pinjam jika perlu)',
    'Latihan 3: Apa operasi pertama jika soalan ada tambah DAN tolak?',
  ],
  science: [
    'Latihan 1: Nyatakan satu pemboleh ubah manipulasi (MV) dalam eksperimen tadi.',
    'Latihan 2: Apa yang berlaku pada RV jika MV ditingkatkan?',
    'Latihan 3: Tulis satu hipotesis ringkas dalam ayat penuh.',
  ],
  humanities: [
    'Latihan 1: Sebut satu fakta utama + mengapa ia penting (signifikan).',
    'Latihan 2: Apa bukti untuk sokong hujah anda?',
    'Latihan 3: Perspektif alternatif — siapa mungkin tidak bersetuju?',
  ],
  general: [
    'Latihan 1: Ringkaskan idea utama dalam satu ayat.',
    'Latihan 2: Apa soalan susulan anda sendiri tentang topik ini?',
    'Latihan 3: Bagaimana topik ini kait dengan kehidupan harian?',
  ],
};

export function buildIThinkScaffold(mapType: IThinkMapType): string {
  return ITHINK_SCAFFOLDS[mapType] ?? ITHINK_SCAFFOLDS[IThinkMapType.UNKNOWN];
}

export function buildCrossLinkPrompt(cluster: CrossCurricularCluster): string {
  return CROSS_LINKS[cluster] ?? CROSS_LINKS[CrossCurricularCluster.GENERAL];
}

export function buildFormativeQuestion(
  topicKey: string,
  questionIndex: number,
): string {
  const bank = FORMATIVE_TEMPLATES[topicKey] ?? FORMATIVE_TEMPLATES.general!;
  const idx = Math.min(questionIndex, bank.length - 1);
  return bank[idx] ?? bank[0]!;
}

export function inferFormativeTopicKey(
  mathTopic?: string,
  genericDomain?: string,
  hasScience?: boolean,
): string {
  if (mathTopic && /arithmetic|percentage|fraction|algebra/i.test(mathTopic)) {
    return 'arithmetic';
  }
  if (hasScience) return 'science';
  if (genericDomain && genericDomain !== 'UMUM') return 'humanities';
  return 'general';
}

const FIVE_WHYS_STEPS_BM: readonly string[] = [
  'Kenapa #1 (permukaan): Apa sebab langsung yang paling jelas? Tulis satu ayat.',
  'Kenapa #2 (lebih dalam): Kenapa berlaku begitu? Satu sebab seterusnya sahaja.',
  'Kenapa #3: Apa punca di sebalik sebab tadi? Satu lapisan lagi.',
  'Kenapa #4: Apa faktor sistemik, sejarah, atau struktur yang menyokong?',
  'Kenapa #5 (punca akar): Apa punca paling asas yang awak boleh kenal pasti sekarang?',
];

export function buildFiveWhysProbe(depth: number, topicHint?: string | null): string {
  const idx = Math.min(Math.max(depth, 0), FIVE_WHYS_STEPS_BM.length - 1);
  const step = FIVE_WHYS_STEPS_BM[idx] ?? FIVE_WHYS_STEPS_BM[0]!;
  const topic = topicHint?.trim();
  if (!topic) return step;
  return `${step}\n(Konteks: ${topic.slice(0, 100)})`;
}
