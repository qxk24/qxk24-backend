/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Translation Engine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export type TranslationTarget = 'ms' | 'ar';

interface TranslationRule {
  from: string;
  to:   string;
}

const TRANSLATION_RULES: Record<string, TranslationRule[]> = {
  'en->ms': [
    { from: 'The system', to: 'Sistem' },
    { from: 'architecture', to: 'seni bina' },
    { from: 'boundary', to: 'sempadan' },
    { from: 'execution', to: 'pelaksanaan' },
    { from: 'state', to: 'keadaan' },
    { from: 'data', to: 'data' },
    { from: 'reflection', to: 'refleksi' },
    { from: 'principle', to: 'prinsip' },
    { from: 'Universal Operating System', to: 'Sistem Pengendalian Universal' },
  ],
  'en->ar': [
    { from: 'The system', to: 'النظام' },
    { from: 'architecture', to: 'العمارة' },
    { from: 'boundary', to: 'الحدود' },
    { from: 'execution', to: 'التنفيذ' },
    { from: 'principle', to: 'المبدأ' },
  ],
};

const PRESERVED_TERMS = [
  'MASA', 'TENAGA', 'AIR', 'API', 'BUMI', 'CAHAYA', 'RUANG',
  'Alamtologi', 'QXK24', 'ADAM', 'Hukum Z',
];

export function translateDeterministically(text: string, targetLang: TranslationTarget): string {
  const rules = TRANSLATION_RULES[`en->${targetLang}`] ?? [];
  let translated = text;

  for (const rule of rules) {
    const regex = new RegExp(rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translated = translated.replace(regex, rule.to);
  }

  for (const term of PRESERVED_TERMS) {
    const placeholder = `__PRESERVE_${term}__`;
    const restore = new RegExp(placeholder, 'g');
    translated = translated.replace(new RegExp(term, 'gi'), placeholder).replace(restore, term);
  }

  return translated;
}

export function translateJournalField(text: string, targetLang: TranslationTarget): string {
  if (!text.trim()) return text;
  return translateDeterministically(text, targetLang);
}
