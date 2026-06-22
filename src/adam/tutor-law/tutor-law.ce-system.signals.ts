/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE System Intent Signals
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

import { SystemTopic } from './tutor-law.ce-system.types';

export const SYS_CONCEPT_SIGNALS = [
  'apa itu', 'apa maksud', 'tak faham', 'explain', 'terangkan', 'what is',
  'macam mana', 'how does', 'beza antara', 'apa beza', 'difference between',
  'kenapa', 'why', 'don\'t understand', 'confused',
] as const;

export const SYS_ANALYZE_SIGNALS = [
  'kenapa berlaku', 'why does', 'what causes', 'apa punca', 'analisis',
  'analyze', 'analyse', 'diagnose', 'diagnosis', 'kenapa deadlock',
  'why deadlock', 'race condition', 'keadaan lumba', 'starvation',
  'priority inversion', 'contention', 'persaingan',
] as const;

export const SYS_TRACE_SIGNALS = [
  'trace', 'jejak', 'step through', 'ikut langkah', 'timeline',
  'execution order', 'urutan pelaksanaan', 'context switch trace',
  'page table walk', 'gantt', 'simulate execution', 'simulasi pelaksanaan',
  'what happens when', 'apa berlaku bila', 'walk through',
] as const;

export const SYS_DESIGN_SIGNALS = [
  'design', 'reka', 'implement', 'laksanakan', 'how to prevent',
  'cara elak', 'cara hindar', 'how to solve', 'macam mana nak selesaikan',
  'buat scheduler', 'design scheduler', 'write mutex', 'tulis semaphore',
  'prevent deadlock', 'elak deadlock', 'synchronization strategy',
] as const;

export const SYS_VERIFY_SIGNALS = [
  'betul tak', 'correct', 'is this right', 'sahkan', 'verify',
  'output saya', 'my answer', 'jawapan saya', 'check my',
  'semak jawapan', 'adakah ini betul',
] as const;

export const SYS_EXAM_SIGNALS = [
  'tolong selesaikan', 'jawabkan', 'siapkan', 'tugasan', 'assignment',
  'soalan peperiksaan', 'do this for me', 'solve this for me',
  'write the driver', 'tulis driver', 'complete the solution',
] as const;

export const SYS_TOPIC_SIGNALS: Record<SystemTopic, readonly string[]> = {
  [SystemTopic.PROCESS_THREAD]:      ['process', 'proses', 'thread', 'benang', 'fork', 'exec', 'pcb', 'create process'],
  [SystemTopic.SCHEDULING]:          ['scheduling', 'penjadual', 'scheduler', 'fcfs', 'round robin', 'priority', 'preemption', 'context switch'],
  [SystemTopic.SYNCHRONIZATION]:     ['deadlock', 'kebuntuan', 'mutex', 'semaphore', 'monitor', 'race condition', 'critical section', 'sinkronisasi', 'synchronisation'],
  [SystemTopic.MEMORY_MGMT]:         ['paging', 'segmentation', 'virtual memory', 'page fault', 'tlb', 'pengurusan memori', 'memory management', 'address translation'],
  [SystemTopic.FILE_SYSTEMS]:        ['file system', 'sistem fail', 'inode', 'directory', 'fat', 'ext4', 'journaling'],
  [SystemTopic.INTERRUPTS_SYSCALLS]: ['interrupt', 'gangguan', 'trap', 'system call', 'syscall', 'handler', 'isr'],
  [SystemTopic.EMBEDDED_RTOS]:       ['embedded', 'firmware', 'rtos', 'real-time', 'device driver', 'pemacu peranti', 'dma', 'interrupt latency'],
  [SystemTopic.UNKNOWN]:             [],
};

export const SYS_SCENARIO_MARKERS = [
  'dua proses', 'two process', 'process a', 'process b', 'thread a',
  'resource allocation', 'peruntukan sumber', 'hold and wait',
  'banker', 'dining philosopher', 'producer consumer',
] as const;

export const SYS_CODE_MARKERS = [
  'pthread', 'fork()', 'sem_wait', 'mutex_lock', 'wait()', 'signal(',
  'open(', 'read(', 'write(', 'mmap', '#include <pthread',
] as const;

export const SYS_TIMING_MARKERS = [
  'gantt', 'timeline', 'arrival time', 'burst time', 'waiting time',
  'turnaround', 'response time', 'masa tiba', 'masa tanggapan',
] as const;

export function countSystemHits(norm: string, signals: readonly string[]): number {
  return signals.filter((signal) => {
    if (signal.includes(' ')) return norm.includes(signal);
    const re = new RegExp(`\\b${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(norm);
  }).length;
}

export function detectSystemTopic(
  norm: string,
  prior: SystemTopic | null,
): SystemTopic {
  const topicBoosts: Array<{ pattern: RegExp; topic: SystemTopic }> = [
    { pattern: /\b(?:deadlock|kebuntuan|mutex|semaphore|race condition)\b/, topic: SystemTopic.SYNCHRONIZATION },
    { pattern: /\b(?:round robin|gantt|fcfs|scheduling|penjadual)\b/, topic: SystemTopic.SCHEDULING },
    { pattern: /\b(?:page fault|virtual memory|paging|tlb)\b/, topic: SystemTopic.MEMORY_MGMT },
    { pattern: /\b(?:file system|sistem fail|inode)\b/, topic: SystemTopic.FILE_SYSTEMS },
    { pattern: /\b(?:interrupt|system call|syscall|isr)\b/, topic: SystemTopic.INTERRUPTS_SYSCALLS },
    { pattern: /\b(?:rtos|embedded|firmware|device driver)\b/, topic: SystemTopic.EMBEDDED_RTOS },
  ];
  for (const { pattern, topic } of topicBoosts) {
    if (pattern.test(norm)) return topic;
  }

  let best: SystemTopic = SystemTopic.UNKNOWN;
  let bestScore = 0;
  for (const [topic, signals] of Object.entries(SYS_TOPIC_SIGNALS)) {
    if (topic === SystemTopic.UNKNOWN) continue;
    const score = countSystemHits(norm, signals);
    if (score > bestScore) {
      bestScore = score;
      best = topic as SystemTopic;
    }
  }
  return bestScore > 0 ? best : (prior ?? SystemTopic.UNKNOWN);
}
