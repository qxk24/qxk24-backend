/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Intent Probes
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

import { GenericDomain } from './tutor-law.generic-intent.types';

export const SIGNIFICANCE_BY_DOMAIN: Record<GenericDomain, string> = {
  [GenericDomain.SEJARAH]:
    'Baik. Sekarang boleh kamu jelaskan MENGAPA peristiwa atau tokoh ini penting dalam konteks sejarah?',
  [GenericDomain.GEOGRAFI]:
    'Tepat. Boleh kamu terangkan bagaimana faktor geografi ini mempengaruhi kehidupan manusia di kawasan tu?',
  [GenericDomain.EKONOMI]:
    'Betul. Sekarang fikirkan: apakah kesan perkara ini terhadap kehidupan harian rakyat biasa?',
  [GenericDomain.SASTERA]:
    'Tepat. Boleh kamu jelaskan mengapa penulis memilih untuk memasukkan elemen ini dalam karya tersebut?',
  [GenericDomain.KOMSAS]:
    'Betul. Sekarang, apa kaitan fakta ni dengan tema utama teks yang kamu pelajari?',
  [GenericDomain.SIVIK]:
    'Betul. Boleh kamu terangkan bagaimana hak atau tanggungjawab ini mempengaruhi kehidupan bermasyarakat?',
  [GenericDomain.SENI]:
    'Betul. Apa yang buatkan elemen seni ini penting atau unik dalam konteks karya tersebut?',
  [GenericDomain.UMUM]:
    'Betul. Sekarang boleh kamu jelaskan mengapa perkara ini penting atau bagaimana ia berkaitan dengan apa yang kamu pelajari?',
};

export const ARGUMENT_PROBE_BY_DOMAIN: Record<GenericDomain, string> = {
  [GenericDomain.SEJARAH]:
    'Soalan analisis yang bagus. Sebelum kita bincang — apa pandangan awal kamu? Apa SATU faktor yang kamu rasa paling penting?',
  [GenericDomain.GEOGRAFI]:
    'Untuk soalan ni, kita perlu analisis. Apa hubungan yang kamu nampak antara faktor-faktor yang terlibat? Cuba terangkan dalam satu ayat.',
  [GenericDomain.EKONOMI]:
    'Soalan ekonomi yang baik. Apa yang kamu faham tentang konsep asas yang terlibat? Kita bina hujah dari situ.',
  [GenericDomain.SASTERA]:
    'Tafsiran sastera boleh berbeza — tiada jawapan tunggal yang "betul". Apa pandangan kamu sendiri, dan apa bukti dalam teks yang menyokong pandangan tu?',
  [GenericDomain.KOMSAS]:
    'Untuk analisis Komsas, mula dari teks itu sendiri. Ayat atau bahagian mana yang kamu rasa paling berkaitan dengan soalan ni?',
  [GenericDomain.SIVIK]:
    'Soalan nilai yang baik. Apa pendapat peribadi kamu tentang isu ni, dan kenapa kamu berpendapat begitu?',
  [GenericDomain.SENI]:
    'Analisis seni melibatkan perasaan dan teknik. Apa yang kamu nampak atau rasai pertama sekali bila tengok/dengar karya ni?',
  [GenericDomain.UMUM]:
    'Soalan yang memerlukan analisis. Sebelum kita bincang lebih lanjut — apa pandangan awal kamu, dan apa yang membuat kamu berpendapat begitu?',
};

export const REVIEW_ANCHOR =
  'ADAM akan tengok apa yang kamu tulis. Sebelum beri maklum balas — '
  + 'bahagian mana yang kamu rasa paling tidak puas hati atau paling tidak pasti?';

export const EXAM_REDIRECT_MS =
  'Soalan ni nampak seperti soalan peperiksaan atau tugasan. '
  + 'ADAM tidak akan jawab terus — tapi boleh bimbing kamu cara mendekati soalan ini. '
  + 'Mula dengan: apa konsep atau kemahiran utama yang kamu rasa soalan ini uji?';

export const EXAM_REDIRECT_EN =
  'This looks like an exam or assignment question. '
  + 'ADAM won\'t answer it directly — but can guide you on how to approach it. '
  + 'Start here: what concept or skill do you think this question is testing?';

export function buildAmbiguousProbe(isMs: boolean): string {
  return isMs
    ? 'Boleh cerita lebih sikit — adakah kamu nak tahu fakta, nak buat analisis, nak semak kerja yang dah buat, atau nak faham konsep?'
    : 'Can you tell me more — are you looking for a fact, need to analyse something, want feedback on work you\'ve done, or trying to understand a concept?';
}
