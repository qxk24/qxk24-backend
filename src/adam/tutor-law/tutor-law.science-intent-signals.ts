/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Science Intent Signals
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

import { ExperimentPhase } from './tutor-law.science-intent.types';

export const FACTUAL_MS = [
  'apa itu', 'apa maksud', 'definisi', 'apakah', 'jelaskan',
  'terangkan', 'siapa', 'bila', 'di mana berlaku',
  'apa fungsi', 'apa peranan', 'apa beza', 'mengapa penting',
  'sejarah', 'latar belakang', 'fakta',
  'berapa masa', 'masa yang diambil',
  'berapa lama', 'berapa jauh', 'berapa cepat', 'berapa besar',
  'berapa tinggi', 'berapa berat', 'berapa suhu', 'berapa jarak',
] as const;

export const FACTUAL_EN = [
  'what is', 'what are', 'define', 'definition', 'who discovered',
  'when was', 'where does', 'what does', 'explain', 'describe',
  'what is the role', 'what is the function', 'difference between',
  'why is it important', 'history of', 'fact about',
  'how long', 'how far', 'how fast', 'how much does it weigh',
] as const;

export const CALCULATION_MS = [
  'kirakan', 'kira', 'cari nilai', 'dapatkan', 'hitung',
  'berapakah nilai', 'guna formula', 'apply formula',
  'selesaikan', 'buktikan secara matematik',
] as const;

export const CALCULATION_EN = [
  'calculate', 'compute', 'find the value', 'determine',
  'use the formula', 'solve', 'what is the value of',
  'prove mathematically',
] as const;

export const EXPERIMENT_MS = [
  'eksperimen', 'prosedur', 'kaedah', 'radas', 'peralatan',
  'hipotesis', 'pemboleh ubah', 'pemboleh ubah dimanipulasi',
  'pemboleh ubah bergerak balas', 'pemboleh ubah dimalarkan',
  'keputusan', 'pemerhatian', 'jadual', 'graf', 'data',
  'analisis', 'kesimpulan', 'punca ralat', 'rawatan',
  'sebab keputusan berbeza', 'kenapa nilai lain',
] as const;

export const EXPERIMENT_EN = [
  'experiment', 'procedure', 'method', 'apparatus', 'equipment',
  'hypothesis', 'variable', 'manipulated variable',
  'responding variable', 'controlled variable',
  'results', 'observation', 'table', 'graph', 'data',
  'analysis', 'conclusion', 'source of error', 'anomalous result',
  'why is my result different', 'why did i get',
] as const;

export const EXAM_DIRECT_SIGNALS = [
  'tolong jawab', 'tolong selesaikan', 'jawabkan', 'buatkan',
  'soalan peperiksaan', 'soalan spm', 'soalan pt3', 'soalan upsr',
  'soalan ujian', 'kerja sekolah', 'tugasan', 'assignment',
  'answer this', 'solve this for me', 'do this question',
] as const;

export const BIOLOGY_SIGNALS = [
  'sel', 'cell', 'osmosis', 'fotosintesis', 'photosynthesis',
  'mitosis', 'meiosis', 'dna', 'gen', 'gene', 'ekosistem',
  'ecosystem', 'respirasi', 'respiration', 'enzim', 'enzyme',
  'hormon', 'hormone', 'neuron', 'tumbuhan', 'haiwan', 'protein',
] as const;

export const CHEMISTRY_SIGNALS = [
  'atom', 'molekul', 'molecule', 'unsur', 'element', 'sebatian',
  'compound', 'tindak balas', 'reaction', 'asid', 'acid',
  'alkali', 'base', 'garam', 'salt', 'mol', 'molar',
  'elektrolisis', 'electrolysis', 'ikatan', 'bond', 'ph',
  'oksigen', 'karbon', 'hidrogen', 'nitrogen',
] as const;

export const PHYSICS_SIGNALS = [
  'daya', 'force', 'jisim', 'mass', 'berat', 'weight',
  'halaju', 'velocity', 'laju', 'speed', 'pecutan', 'acceleration',
  'tekanan', 'pressure', 'tenaga', 'energy', 'kuasa', 'power',
  'elektrik', 'electric', 'magnetik', 'magnetic', 'cahaya', 'light',
  'bunyi', 'sound', 'haba', 'heat', 'suhu', 'temperature',
  'inersia', 'inertia', 'momentum', 'graviti', 'gravity',
] as const;

export const GEOGRAPHY_SIGNALS = [
  'iklim', 'climate', 'cuaca', 'weather', 'sungai', 'river',
  'gunung', 'mountain', 'lautan', 'ocean', 'tanah', 'soil',
  'hakisan', 'erosion', 'banjir', 'flood', 'gempa', 'earthquake',
  'gunung berapi', 'volcano', 'peta', 'map', 'koordinat',
] as const;

export const SCIENCE_DOMAIN_MARKERS = [
  ...BIOLOGY_SIGNALS,
  ...CHEMISTRY_SIGNALS,
  ...PHYSICS_SIGNALS,
  ...GEOGRAPHY_SIGNALS,
  'fizik', 'sains', 'biologi', 'kimia', 'geografi', 'astronomi',
  'physics', 'science', 'biology', 'chemistry', 'geography',
] as const;

export const PHASE_SIGNALS: Record<ExperimentPhase, readonly string[]> = {
  [ExperimentPhase.HYPOTHESIS]: [
    'hipotesis', 'hypothesis', 'jangkaan', 'predict', 'andaian',
    'saya rasa akan', 'i think it will', 'expected result',
  ],
  [ExperimentPhase.PROCEDURE]: [
    'prosedur', 'procedure', 'langkah', 'step', 'kaedah', 'method',
    'macam mana nak buat', 'how to conduct', 'radas', 'apparatus',
  ],
  [ExperimentPhase.VARIABLES]: [
    'pemboleh ubah', 'variable', 'dimanipulasi', 'manipulated',
    'bergerak balas', 'responding', 'dimalarkan', 'controlled',
    'apa yang berubah', 'what changes',
  ],
  [ExperimentPhase.RESULTS]: [
    'keputusan', 'result', 'data', 'bacaan', 'reading',
    'nilai', 'value', 'pemerhatian', 'observation', 'jadual', 'table',
  ],
  [ExperimentPhase.ANALYSIS]: [
    'analisis', 'analysis', 'graf', 'graph', 'trend', 'corak',
    'pattern', 'hubungan', 'relationship', 'kenapa nilai', 'why result',
  ],
  [ExperimentPhase.CONCLUSION]: [
    'kesimpulan', 'conclusion', 'terbukti', 'proven', 'disokong',
    'supported', 'hipotesis diterima', 'hypothesis accepted',
  ],
  [ExperimentPhase.UNKNOWN]: [],
};

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function signalHit(norm: string, signal: string): boolean {
  if (signal.includes(' ')) return norm.includes(signal);
  const re = new RegExp(`\\b${escapeRegExp(signal)}\\b`, 'i');
  return re.test(norm);
}

export function countSignalHits(norm: string, signals: readonly string[]): number {
  return signals.filter((signal) => signalHit(norm, signal)).length;
}
