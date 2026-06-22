/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE System Pedagogy Scripts
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
 * State before solution. Trace before policy. Analysis before code.
 */

import { SystemTopic } from './tutor-law.ce-system.types';

export const ANALYZE_PROBES: Partial<Record<SystemTopic, string>> = {
  [SystemTopic.SYNCHRONIZATION]:
    'Sebelum kita jawab — lukis resource allocation graph atau senaraikan empat syarat deadlock. Syarat mana yang kamu rasa aktif dalam senario ni?',
  [SystemTopic.SCHEDULING]:
    'Untuk analisis scheduling — senaraikan proses, arrival time, dan burst time dulu. Tanpa nombor, kita tak boleh bandingkan policy dengan adil.',
  [SystemTopic.MEMORY_MGMT]:
    'Untuk analisis memori — kenal pasti dulu: logical address, page size, dan page table entry. Cuba trace SATU virtual address ke physical frame.',
  [SystemTopic.PROCESS_THREAD]:
    'Untuk analisis proses/thread — apa shared resource yang terlibat? Cuba nyatakan apa yang dimiliki oleh proses A vs proses B.',
  [SystemTopic.UNKNOWN]:
    'Sebelum analisis — apa state sistem pada masa isu berlaku? Senaraikan proses/sumber yang terlibat dan apa yang setiap satu sedang tunggu.',
};

export const TRACE_PROBES: Partial<Record<SystemTopic, string>> = {
  [SystemTopic.SCHEDULING]:
    'Ok kita trace. Guna 3 proses dengan burst time pendek. Tunjukkan siapa jalan pada slot masa pertama mengikut policy yang kamu guna.',
  [SystemTopic.SYNCHRONIZATION]:
    'Trace satu langkah kritikal: proses/thread mana pegang lock, mana menunggu? Tunjukkan urutan acquire/release untuk satu cycle.',
  [SystemTopic.MEMORY_MGMT]:
    'Trace satu page fault: dari virtual address → page table → frame. Tunjukkan langkah pertama selepas TLB miss.',
  [SystemTopic.INTERRUPTS_SYSCALLS]:
    'Trace satu interrupt: dari hardware event → ISR → kernel handler. Apa yang berlaku pada CPU mode dan stack?',
  [SystemTopic.UNKNOWN]:
    'Pilih contoh kecil (2 proses atau 1 page table). Trace langkah pertama dari trigger hingga outcome. Tunjukkan state selepas langkah itu.',
};

export const DESIGN_SCAFFOLDS: Partial<Record<SystemTopic, string>> = {
  [SystemTopic.SYNCHRONIZATION]:
    'Untuk design sync — JANGAN tulis kod penuh dulu:\n'
    + '1. Apa shared resource?\n'
    + '2. Perlukah mutual exclusion, ordering, atau bounded buffer?\n'
    + '3. Pilih primitive (mutex/semaphore/monitor) dan justify.\n'
    + '4. Baru sketch pseudocode untuk critical section.',
  [SystemTopic.SCHEDULING]:
    'Untuk design scheduler:\n'
    + '1. Apa matlamat — throughput, response time, fairness?\n'
    + '2. Preemptive atau non-preemptive?\n'
    + '3. Trace manual satu time slice pada input kecil.\n'
    + '4. Baru banding dengan FCFS/RR sebagai baseline.',
  [SystemTopic.MEMORY_MGMT]:
    'Untuk design memory scheme:\n'
    + '1. Saiz page dan saiz address space?\n'
    + '2. Single-level atau multi-level page table?\n'
    + '3. Trace satu address translation.\n'
    + '4. Baru bincang trade-off fragmentation vs table size.',
  [SystemTopic.UNKNOWN]:
    'Untuk design penyelesaian OS:\n'
    + '1. Apa constraint (real-time, fairness, deadlock-free)?\n'
    + '2. Apa state yang perlu dilindungi?\n'
    + '3. Trace satu senario kecil.\n'
    + '4. Baru pilih mekanisme kernel/primitive.',
};

export const CONCEPT_PROBES: Partial<Record<SystemTopic, string>> = {
  [SystemTopic.PROCESS_THREAD]:
    'Sebelum kita masuk definisi formal — apa yang kamu faham tentang beza process dan thread? Cuba terangkan dalam satu ayat.',
  [SystemTopic.SYNCHRONIZATION]:
    'Sebelum mutex/semaphore — apa yang kamu faham tentang critical section? Kenapa ia perlu dilindungi?',
  [SystemTopic.MEMORY_MGMT]:
    'Sebelum paging — apa masalah yang virtual memory cuba selesaikan? Cuba dengan analogi ringkas.',
  [SystemTopic.EMBEDDED_RTOS]:
    'Untuk embedded/RTOS — apa constraint real-time yang paling penting dalam sistem kamu: deadline, jitter, atau determinism?',
  [SystemTopic.UNKNOWN]:
    'Boleh cerita lebih sikit — kamu tengah belajar konsep, trace execution, analisis masalah, atau reka penyelesaian?',
};

export const VERIFY_ANCHOR_BM =
  'Sebelum ADAM semak — tunjukkan state trace, Gantt, atau langkah kerja kamu dulu. '
  + 'Jawapan akhir betul bukan bermakna model mental betul.';

export const VERIFY_ANCHOR_EN =
  'Before ADAM checks — show your state trace, Gantt chart, or working first. '
  + 'A correct final answer does not guarantee the right mental model.';

export const EXAM_REDIRECT_BM =
  'Soalan ni nampak dari peperiksaan atau tugasan OS. '
  + 'ADAM tidak akan tulis driver, scheduler, atau penyelesaian deadlock siap untuk kamu. '
  + 'Tapi boleh bimbing proses. Mula dengan: apa proses/sumber yang terlibat?';

export const EXAM_REDIRECT_EN =
  'This looks like an exam or OS assignment question. '
  + 'ADAM will not write a complete driver, scheduler, or deadlock solution for you. '
  + 'But can guide the process. Start with: which processes/resources are involved?';

export function isMalaySystemTurn(norm: string): boolean {
  return /nak|tak|boleh|macam|kenapa|saya|kamu|proses|deadlock|memori/.test(norm);
}
