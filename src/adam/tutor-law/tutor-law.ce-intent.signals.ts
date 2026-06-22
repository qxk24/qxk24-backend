/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Intent Signals
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

import { CEAbstractionLayer } from './tutor-law.ce-intent.types';

export const HW_SIGNALS = [
  'logic gate', 'gerbang logik', 'boolean', 'truth table', 'jadual kebenaran',
  'flip flop', 'register', 'alu', 'arithmetic logic unit',
  'multiplexer', 'mux', 'decoder', 'encoder', 'adder', 'penjumlah',
  'circuit', 'litar', 'schematic', 'karnaugh', 'k-map',
  'cpu', 'processor', 'pipeline', 'cache', 'memory hierarchy',
  'clock cycle', 'instruction set', 'isa', 'risc', 'cisc',
  'verilog', 'vhdl', 'fpga', 'datapath', 'control unit',
  'binary', 'binari', 'hex', 'hexadecimal', 'two\'s complement',
] as const;

export const THEORY_SIGNALS = [
  'algorithm', 'algoritma', 'complexity', 'kompleksiti',
  'big o', 'big-o', 'o(n)', 'o(log', 'o(n²)', 'omega', 'theta',
  'time complexity', 'space complexity', 'asymptotic',
  'sorting', 'searching', 'graph algorithm', 'dynamic programming',
  'recursion', 'rekursi', 'divide and conquer',
  'automata', 'turing machine', 'finite state', 'fsm', 'dfa', 'nfa',
  'regular language', 'context free', 'grammar', 'cfg',
  'p vs np', 'np-complete', 'np-hard', 'reducibility',
  'proof', 'buktikan', 'derive', 'terbitan', 'induction', 'induksi',
  'correctness', 'loop invariant', 'invariant',
] as const;

export const SYSTEM_SIGNALS = [
  'operating system', 'sistem operasi', 'kernel',
  'process', 'proses', 'thread', 'scheduling', 'penjadual',
  'context switch', 'preemption', 'priority',
  'deadlock', 'kebuntuan', 'starvation', 'race condition',
  'mutex', 'semaphore', 'monitor', 'synchronisation', 'sinkronisasi',
  'memory management', 'pengurusan memori', 'paging', 'segmentation',
  'virtual memory', 'page fault', 'tlb',
  'file system', 'sistem fail', 'inode', 'directory',
  'interrupt', 'gangguan', 'trap', 'system call',
  'embedded', 'firmware', 'rtos', 'real-time',
  'device driver', 'pemacu peranti', 'dma',
] as const;

export const NETWORK_SIGNALS = [
  'network', 'rangkaian', 'protocol', 'protokol',
  'tcp', 'udp', 'ip', 'http', 'https', 'dns', 'dhcp',
  'osi', 'osi model', 'tcp/ip', 'layer', 'lapisan',
  'router', 'switch', 'hub', 'gateway', 'firewall',
  'packet', 'paket', 'frame', 'datagram',
  'routing', 'penghalaan', 'bgp', 'ospf', 'rip',
  'socket', 'port', 'handshake', 'three-way handshake',
  'bandwidth', 'latency', 'throughput', 'congestion',
  'mac address', 'arp', 'nat', 'subnet', 'cidr',
  'tls', 'ssl', 'encryption', 'enkripsi', 'certificate',
] as const;

export const SE_SIGNALS = [
  'design pattern', 'solid', 'dry', 'mvc', 'mvvm',
  'unit test', 'integration test', 'tdd', 'bdd',
  'ci/cd', 'git', 'agile', 'scrum', 'kanban',
  'refactor', 'technical debt', 'code review',
] as const;

export const DB_SIGNALS = [
  'database', 'pangkalan data', 'sql', 'nosql', 'mongodb',
  'b-tree', 'index', 'indeks', 'query optimisation',
  'acid', 'transaction', 'transaksi', 'normalisation',
  'join', 'foreign key', 'primary key', 'schema',
] as const;

export const COMPILER_SIGNALS = [
  'compiler', 'pengkompil', 'lexer', 'parser', 'tokeniser',
  'abstract syntax tree', 'ast', 'semantic analysis',
  'code generation', 'optimisation pass', 'llvm', 'grammar',
  'regular expression', 'regex', 'bnf', 'ebnf',
] as const;

export const DISCRETE_SIGNALS = [
  'set theory', 'teori set', 'propositional logic', 'logik cadangan',
  'predicate logic', 'proof by induction', 'combination', 'permutation',
  'graph theory', 'teori graf', 'tree', 'spanning tree',
  'modular arithmetic', 'number theory', 'rsa', 'cryptography primer',
] as const;

export const SECURITY_DEFENSIVE = [
  'detect', 'prevent', 'defend', 'patch', 'vulnerability analysis',
  'penetration testing concept', 'security audit', 'threat model',
  'input validation', 'sanitisation', 'xss prevention', 'csrf protection',
  'how does attack work', 'buffer overflow concept', 'sql injection concept',
] as const;

export const SECURITY_EXPLOIT = [
  'exploit', 'write exploit', 'create exploit', 'payload', 'shellcode',
  'crack password', 'brute force', 'keylogger', 'backdoor',
  'rootkit', 'malware', 'ransomware', 'bypass authentication',
  'reverse shell', 'privilege escalation code', 'metasploit script',
] as const;

export const CE_DOMAIN_MARKERS = [
  ...HW_SIGNALS,
  ...THEORY_SIGNALS,
  ...SYSTEM_SIGNALS,
  ...NETWORK_SIGNALS,
  ...SE_SIGNALS,
  ...DB_SIGNALS,
  ...COMPILER_SIGNALS,
  ...DISCRETE_SIGNALS,
] as const;

export const DIAGRAM_SIGNALS = [
  'circuit', 'litar', 'schematic', 'diagram', 'truth table', 'jadual kebenaran',
  'k-map', 'karnaugh', 'fsm diagram', 'state diagram',
] as const;

export const LAYER_SIGNALS: Record<CEAbstractionLayer, readonly string[]> = {
  [CEAbstractionLayer.SILICON]:     ['transistor', 'cmos', 'mosfet', 'vlsi', 'fabrication'],
  [CEAbstractionLayer.GATE]:        ['logic gate', 'boolean', 'and gate', 'or gate', 'nand', 'nor', 'xor', 'truth table'],
  [CEAbstractionLayer.REGISTER]:    ['register', 'alu', 'datapath', 'flip flop', 'counter', 'shift register'],
  [CEAbstractionLayer.MICROARCH]:   ['pipeline', 'cache', 'branch prediction', 'out of order', 'superscalar', 'clock cycle'],
  [CEAbstractionLayer.OS]:          ['process', 'thread', 'scheduler', 'memory management', 'file system', 'system call'],
  [CEAbstractionLayer.NETWORK]:     ['packet', 'protocol', 'socket', 'port', 'router', 'tcp', 'udp', 'http'],
  [CEAbstractionLayer.APPLICATION]: ['api', 'function', 'class', 'library', 'framework', 'application'],
  [CEAbstractionLayer.UNKNOWN]:     [],
};

export function countCEHits(norm: string, signals: readonly string[]): number {
  return signals.filter((s) => norm.includes(s)).length;
}

export function hasCEEquationPattern(raw: string): boolean {
  return /O\(|Ω\(|Θ\(|∑|∀|∃|⊆|∈|→|↔|¬|∧|∨|≤|≥|≠|\^|log\s*n/i.test(raw);
}
