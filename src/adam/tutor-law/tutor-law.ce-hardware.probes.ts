/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Hardware Pedagogy Scripts
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
 * Truth table before circuit. Boolean expression before implementation.
 */

import { HardwareTopic } from './tutor-law.ce-hardware.types';

export const CONCEPT_PROBES: Partial<Record<HardwareTopic, string>> = {
  [HardwareTopic.BOOLEAN_ALGEBRA]:
    'Sebelum kita bincang algebra Boolean — kamu dah faham asas logic gate (AND, OR, NOT) tak? Cuba terangkan dalam satu ayat apa yang AND gate buat.',
  [HardwareTopic.COMBINATIONAL]:
    'Ok, sebelum reka litar — kamu dah ada truth table untuk fungsi yang kamu nak implement? Kalau belum, tu langkah pertama kita.',
  [HardwareTopic.SEQUENTIAL]:
    'Sequential circuit melibatkan state. Sebelum kita mula — boleh kamu terangkan apa beza combinational circuit dengan sequential circuit?',
  [HardwareTopic.COMPUTER_ARCH]:
    'Soalan seni bina komputer. Di peringkat mana kamu tengah belajar — instruction set level, datapath level, atau pipeline level?',
  [HardwareTopic.NUMBER_SYSTEMS]:
    'Sistem nombor asas dulu. Boleh kamu tunjukkan cara kamu convert nombor decimal ke binary? Cuba buat satu contoh.',
  [HardwareTopic.HDL]:
    'Sebelum tulis HDL — kamu dah ada schematic atau truth table untuk litar yang nak di-implement? HDL adalah cara express litar yang kamu dah design.',
  [HardwareTopic.UNKNOWN]:
    'Boleh cerita lebih sikit — kamu tengah buat apa sekarang? Reka litar, trace output, atau nak faham konsep?',
};

export const TRACE_PROBES: Partial<Record<HardwareTopic, string>> = {
  [HardwareTopic.COMBINATIONAL]:
    'Ok ada litar. Sebelum kita trace bersama — ambil satu row dalam truth table (pilih mana-mana). Trace output untuk row tu sendiri dulu. Tunjukkan nilai di setiap gate.',
  [HardwareTopic.SEQUENTIAL]:
    'Untuk sequential circuit, trace mengikut clock cycle. Ambil state awal dan input pertama. Apa state seterusnya? Tunjukkan berdasarkan state transition table.',
  [HardwareTopic.COMPUTER_ARCH]:
    'Untuk trace CPU pipeline — identify dulu instruction yang kamu trace dan peringkat pipeline mana (IF, ID, EX, MEM, WB). Tunjukkan instruction tu di peringkat pertama.',
  [HardwareTopic.UNKNOWN]:
    'Untuk trace litar ini — pilih satu set nilai input. Trace nilai di setiap node dari input ke output, satu gate pada satu masa. Tunjukkan langkah pertama kamu.',
};

export const VERIFY_ANCHOR_BM =
  'Sebelum ADAM semak — tunjukkan truth table atau cara kerja kamu dulu. '
  + 'Output yang betul bukan bermakna kaedah betul: kita perlu semak kedua-duanya.';

export const VERIFY_ANCHOR_EN =
  'Before ADAM checks — show your truth table or working first. '
  + 'A correct output doesn\'t guarantee a correct method: we need to check both.';

export const EXAM_REDIRECT_BM =
  'Soalan ni nampak seperti dari peperiksaan atau tugasan. '
  + 'ADAM tidak akan reka atau selesaikan litar untuk kamu. '
  + 'Tapi boleh bimbing kamu melalui proses. '
  + 'Mula dengan: berapa input yang ada dalam soalan ni, dan apa yang output patut buat?';

export const EXAM_REDIRECT_EN =
  'This looks like an exam or assignment question. '
  + 'ADAM won\'t design or complete the circuit for you. '
  + 'But can guide you through the process. '
  + 'Start with: how many inputs does this problem have, and what should the output do?';

const DESIGN_STEPS: Record<HardwareTopic, string[]> = {
  [HardwareTopic.COMBINATIONAL]: [
    'Langkah 1: Kenal pasti input dan output — berapa input? Apa yang output patut buat?',
    'Langkah 2: Bina truth table — senaraikan semua kombinasi input yang mungkin.',
    'Langkah 3: Tulis Boolean expression dari truth table (SOP atau POS).',
    'Langkah 4: Ringkaskan expression (K-map atau De Morgan jika perlu).',
    'Langkah 5: Barulah lukis litar dari expression yang telah diringkaskan.',
  ],
  [HardwareTopic.SEQUENTIAL]: [
    'Langkah 1: Kenal pasti state sistem — berapa state yang ada?',
    'Langkah 2: Lukis state diagram — state mana ke state mana, berdasarkan input apa?',
    'Langkah 3: Bina state transition table.',
    'Langkah 4: Pilih jenis flip-flop (D, JK, T) dan bina excitation table.',
    'Langkah 5: Barulah reka litar dari excitation equations.',
  ],
  [HardwareTopic.BOOLEAN_ALGEBRA]: [
    'Langkah 1: Tulis expression yang nak diringkaskan.',
    'Langkah 2: Kenal pasti hukum mana yang boleh diapply (complement, idempotent, De Morgan).',
    'Langkah 3: Apply satu hukum pada satu masa — tunjukkan setiap langkah.',
    'Langkah 4: Verify dengan truth table — expression lama dan baru mesti sama.',
  ],
  [HardwareTopic.UNKNOWN]: [
    'Langkah 1: Kenal pasti keperluan — apa input, apa output, apa fungsi?',
    'Langkah 2: Bina truth table atau state diagram dulu sebelum implement.',
    'Langkah 3: Derive expression atau equation.',
    'Langkah 4: Baru implement dalam gate atau flip-flop.',
  ],
  [HardwareTopic.COMPUTER_ARCH]:    [],
  [HardwareTopic.MEMORY_SYSTEMS]:   [],
  [HardwareTopic.NUMBER_SYSTEMS]:   [],
  [HardwareTopic.HDL]:              [],
};

export function buildHardwareDesignScaffold(topic: HardwareTopic, isBm: boolean): string {
  const topicSteps = DESIGN_STEPS[topic] ?? DESIGN_STEPS[HardwareTopic.UNKNOWN];
  if (topicSteps.length === 0) {
    return isBm
      ? 'Untuk soalan seni bina ini — mula dengan kenal pasti komponen yang terlibat, kemudian trace aliran data melalui komponen tersebut. Cuba describe komponen pertama dulu.'
      : 'For this architecture question — start by identifying the components involved, then trace the data flow. Try describing the first component.';
  }

  const intro = isBm
    ? 'Ok, kita design step by step. JANGAN terus lukis litar dulu:\n\n'
    : 'Let\'s design step by step. DON\'T draw the circuit yet:\n\n';

  return intro + topicSteps.join('\n');
}

export function isMalayHardwareTurn(norm: string): boolean {
  return /nak|tak|boleh|macam|kenapa|saya|kamu|litar|gerbang/.test(norm);
}
