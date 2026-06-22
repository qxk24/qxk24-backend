/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Education Intent Signals
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

export const QURAN_SIGNALS = [
  'quran', 'al-quran', 'alquran', 'surah', 'firman allah', 'wahyu', 'tafsir',
  'terjemahan quran', 'maksud ayat', 'ayat quran', 'ayat al-quran',
  'verse', 'juzuk', 'juz', 'maqasid', 'ulumul quran',
  'tajwid', 'hafaz', 'hifz', 'mutashabihat',
] as const;

export const HADITH_SIGNALS = [
  'hadith', 'hadis', 'hadis nabi', 'sabda nabi', 'riwayat',
  'bukhari', 'muslim', 'tirmizi', 'abu daud', 'nasai', 'ibnu majah',
  'sahih', 'hasan', 'daif', 'maudu', 'isnad', 'sanad',
  'perawi', 'mukhrij', 'sunnah', 'sirah nabawiyyah',
] as const;

export const FIQH_SIGNALS = [
  'hukum', 'halal', 'haram', 'makruh', 'sunat', 'mubah', 'wajib',
  'fardu', 'fardu ain', 'fardu kifayah', 'fiqh', 'mazhab',
  'syafii', 'hanafi', 'maliki', 'hanbali', 'ijtihad',
  'solat', 'puasa', 'zakat', 'haji', 'umrah', 'wuduk', 'tayamum',
  'ibadah', 'muamalah', 'nikah', 'talak', 'faraid', 'wasiat',
  'boleh ke', 'boleh tak', 'is it allowed', 'is it permissible',
  'cara buat', 'tatacara', 'procedure untuk',
] as const;

export const IMAN_SIGNALS = [
  'iman', 'rukun iman', 'rukun islam', 'tauhid', 'tawhid',
  'kufur', 'syirik', 'nifaq', 'sifat allah', 'asmaul husna',
  'malaikat', 'kitab allah', 'rasul', 'akhirat', 'qada', 'qadar',
  'pillar of faith', 'pillar of islam', 'attributes of allah',
  'existence of god', 'bukti wujud allah', 'kalam',
  'pendidikan islam iman', 'bab iman',
] as const;

export const AKHLAQ_SIGNALS = [
  'akhlak', 'akhlaq', 'adab islam', 'budi pekerti',
  'sifat mahmudah', 'sifat mazmumah', 'sabar', 'syukur', 'tawaduk',
  'ikhlas', 'amanah', 'hasad', 'riak', 'ujub', 'takbur',
  'husnul zhan', 'suuzzan', 'silaturrahim',
] as const;

export const HISTORY_SIGNALS = [
  'sirah', 'sejarah islam', 'tamadun islam', 'khulafa rashidin',
  'abu bakar', 'umar', 'uthman', 'ali', 'khalifah',
  'bani umayyah', 'bani abbasiyah', 'ottoman', 'mamluk',
  'perang badar', 'perang uhud', 'perang khandak',
  'hijrah', 'israk mikraj', 'fathu makkah', 'ghazwah',
  'islamic civilization', 'golden age of islam',
] as const;

export const COMPARE_SIGNALS = [
  'kristian', 'christian', 'yahudi', 'jewish', 'buddha', 'buddhism',
  'hindu', 'hinduism', 'agama lain', 'other religion',
  'beza islam dengan', 'compare islam', 'dialog antara agama',
  'interfaith', 'persamaan antara', 'perbezaan antara agama',
] as const;

export const FABRICATION_SIGNALS = [
  'tuliskan ayat', 'berikan ayat', 'tulis hadis', 'berikan hadis',
  'nyatakan ayat quran', 'sebut ayat', 'baca ayat',
  'write the verse', 'give me the verse', 'give me the hadith',
  'quote the quran', 'cite the hadith', 'what does the quran say exactly',
  'ayat tentang', 'hadis tentang', 'quran verse about',
] as const;

export const ISLAMIC_DOMAIN_MARKERS = [
  ...QURAN_SIGNALS,
  ...HADITH_SIGNALS,
  ...FIQH_SIGNALS,
  ...IMAN_SIGNALS,
  ...AKHLAQ_SIGNALS,
  ...HISTORY_SIGNALS,
  ...COMPARE_SIGNALS,
  'pendidikan islam', 'islamic studies', 'spm pi',
] as const;

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
