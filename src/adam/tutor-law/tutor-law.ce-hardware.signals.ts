/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Hardware Intent Signals
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

import { HardwareTopic } from './tutor-law.ce-hardware.types';

export const HW_CONCEPT_SIGNALS = [
  'apa itu', 'apa maksud', 'tak faham', 'explain', 'terangkan',
  'beza antara', 'apa beza', 'kenapa', 'bagaimana', 'what is', 'how does',
  'don\'t understand', 'confused', 'difference between',
] as const;

export const HW_DESIGN_SIGNALS = [
  'reka', 'design', 'bina', 'build', 'create', 'implement',
  'lukis litar', 'draw circuit', 'buat litar', 'make circuit',
  'implement using', 'guna gate', 'using gates',
  'reka bentuk', 'cipta', 'how to make', 'macam mana nak buat',
] as const;

export const HW_TRACE_SIGNALS = [
  'trace', 'jejak', 'output untuk', 'output for', 'nilai output',
  'apa output', 'what is the output', 'nilai bila', 'value when',
  'simulasi', 'simulate', 'step through', 'ikut langkah',
  'waveform', 'timing diagram',
] as const;

export const HW_VERIFY_SIGNALS = [
  'betul tak', 'correct', 'is this right', 'sahkan', 'verify',
  'output saya', 'my output', 'jawapan saya', 'my answer',
  'truth table saya', 'my truth table', 'check litar',
] as const;

export const HW_EXAM_SIGNALS = [
  'tolong selesaikan', 'tolong reka', 'jawabkan', 'siapkan',
  'soalan peperiksaan', 'tugasan', 'assignment',
  'do this for me', 'solve this', 'design this for me',
] as const;

export const HW_TOPIC_SIGNALS: Record<HardwareTopic, readonly string[]> = {
  [HardwareTopic.BOOLEAN_ALGEBRA]: ['boolean', 'algebra boolean', 'demorgan', 'simplify', 'ringkaskan', 'sop', 'pos', 'minterm', 'maxterm'],
  [HardwareTopic.COMBINATIONAL]:    ['gate', 'and', 'or', 'nand', 'nor', 'xor', 'xnor', 'not', 'mux', 'multiplexer', 'decoder', 'encoder', 'adder', 'subtractor', 'comparator'],
  [HardwareTopic.SEQUENTIAL]:       ['flip flop', 'ff', 'd flip', 'jk flip', 't flip', 'sr flip', 'counter', 'kaunter', 'register', 'shift register', 'fsm', 'state machine', 'mesin keadaan'],
  [HardwareTopic.COMPUTER_ARCH]:    ['cpu', 'processor', 'pipeline', 'paip', 'cache', 'ingatan cache', 'branch', 'instruction', 'arahan', 'isa', 'risc', 'cisc', 'datapath'],
  [HardwareTopic.MEMORY_SYSTEMS]:   ['dram', 'sram', 'memory', 'memori', 'hierarchy', 'hierarki', 'rom', 'eeprom', 'flash', 'bandwidth memori'],
  [HardwareTopic.NUMBER_SYSTEMS]:   ['binary', 'binari', 'hexadecimal', 'hex', 'octal', 'two\'s complement', 'pelengkap dua', 'ieee 754', 'floating point'],
  [HardwareTopic.HDL]:              ['verilog', 'vhdl', 'systemverilog', 'module', 'always block', 'assign', 'wire', 'reg', 'testbench'],
  [HardwareTopic.UNKNOWN]:          [],
};

export const HW_TRUTH_TABLE_MARKERS = [
  'truth table', 'jadual kebenaran', '| a |', '| b |', 'input output',
] as const;

export const HW_CIRCUIT_DESC_MARKERS = [
  'circuit', 'litar', 'gate', 'gerbang', 'schematic', 'wiring',
] as const;

export const HW_HDL_MARKERS = [
  'verilog', 'vhdl', 'systemverilog', 'module ', 'always @', 'assign ',
] as const;

export function countHardwareHits(norm: string, signals: readonly string[]): number {
  return signals.filter((signal) => {
    if (signal.includes(' ')) return norm.includes(signal);
    const re = new RegExp(`\\b${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(norm);
  }).length;
}

export function detectHardwareTopic(
  norm: string,
  prior: HardwareTopic | null,
): HardwareTopic {
  let best: HardwareTopic = HardwareTopic.UNKNOWN;
  let bestScore = 0;
  for (const [topic, signals] of Object.entries(HW_TOPIC_SIGNALS)) {
    if (topic === HardwareTopic.UNKNOWN) continue;
    const score = countHardwareHits(norm, signals);
    if (score > bestScore) {
      bestScore = score;
      best = topic as HardwareTopic;
    }
  }
  return bestScore > 0 ? best : (prior ?? HardwareTopic.UNKNOWN);
}
