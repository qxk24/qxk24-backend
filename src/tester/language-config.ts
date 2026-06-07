/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Tester Language Config (Backend)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export interface LanguageOption {
  code:       string;
  name:       string;
  nativeName: string;
}

const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  ms: 'Bahasa Melayu', id: 'Bahasa Indonesia', tl: 'Filipino', th: 'ภาษาไทย',
  vi: 'Tiếng Việt', km: 'ភាសាខ្មែរ', my: 'မြန်မာဘာသာ', lo: 'ພາສາລາວ',
  zh: '中文（简体）', 'zh-TW': '中文（繁體）', ja: '日本語', ko: '한국어',
  hi: 'हिन्दी', bn: 'বাংলা', ur: 'اردو', ta: 'தமிழ்', te: 'తెలుగు',
  mr: 'मराठी', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ', si: 'සිංහල', ne: 'नेपाली',
  ar: 'العربية', fa: 'فارسی', tr: 'Türkçe', he: 'עברית', ku: 'Kurdî',
  kk: 'Қазақша', uz: "O'zbek", en: 'English', fr: 'Français', de: 'Deutsch',
  es: 'Español', pt: 'Português', it: 'Italiano', nl: 'Nederlands',
  sv: 'Svenska', no: 'Norsk', da: 'Dansk', fi: 'Suomi', pl: 'Polski',
  cs: 'Čeština', sk: 'Slovenčina', hu: 'Magyar', ro: 'Română',
  bg: 'Български', hr: 'Hrvatski', sr: 'Српски', uk: 'Українська',
  ru: 'Русский', el: 'Ελληνικά', ca: 'Català', sw: 'Kiswahili',
  ha: 'Hausa', yo: 'Yorùbá', ig: 'Igbo', am: 'አማርኛ', so: 'Soomaali',
  zu: 'isiZulu', xh: 'isiXhosa', af: 'Afrikaans', 'pt-BR': 'Português (Brasil)',
  'es-MX': 'Español (México)', qu: 'Runa Simi', mi: 'Te Reo Māori',
  haw: 'ʻŌlelo Hawaiʻi',
};

export function getLanguageByCode(code: string): LanguageOption | undefined {
  const nativeName = LANGUAGE_NATIVE_NAMES[code];
  if (!nativeName) return undefined;
  return { code, name: nativeName, nativeName };
}
