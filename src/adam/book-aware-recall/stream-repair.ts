/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Stream Output Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { isAlamtologiCurriculumOverviewQuery, repairCurriculumCollapseStreamOutput } from './curriculum-overview';
import {
  detectAidilBrainFormulaInOverviewOutput,
  detectWrongXyzDefinitionOutput,
  STRUKTUR_KEILMUAN_ALAMTOLOGI,
} from './struktur-keilmuan';
import {
  isFormulaXyzBab1AsasQuery,
  isFormulaXyzBab2FaktorQuery,
  isFormulaXyzBab3HukumQuery,
  isFormulaXyzBab4SainsQuery,
  isFormulaXyzBab5MasaQuery,
  isFormulaXyzBab6TenagaQuery,
} from './chapter-queries';

const BAB1_RETEACH_BEGGING: RegExp[] = [
  /\btiada\s+rekod\s+pengajaran\b/i,
  /\btiada\s+episod\s+pengajaran\b/i,
  /\bsedia\s+menerima\s+episod\b/i,
  /\bsila\s+hantar\s+episod\b/i,
  /\bmemberi\s+lebih\s+daripada\s+ini\s+tanpa\s+episod\b/i,
  /\bJika\s+P\.?alt\s+ingin\s+saya\s+jelaskan\s+lebih\s+mendalam\b/i,
  /\bcatatan\s+langsung\s+dari\s+sesi\s+mengajar\s+Bab\s*1\b/i,
];

const BAB1_AIDIL_CONFUSION_OUTPUT: RegExp[] = [
  /\bbab\s*1\b[^.\n]{0,140}\b(?:aidil|pengenalan\s+aidil)\b/i,
  /\bpengenalan\s+aidil\b/i,
  /\bproses\s+gabung\b[\s\S]{0,400}\bproses\s+lerai\b/i,
  /\bilmu\s+hisab\b/i,
  /\btajall[iī]\b/i,
  /\bsyahadah\s+ritmis\b/i,
];

export function detectBab1AidilConfusionOutput(text: string, userMessage: string): boolean {
  const relevant = isFormulaXyzBab1AsasQuery(userMessage)
    || isAlamtologiCurriculumOverviewQuery(userMessage);
  if (!relevant) return false;
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  return BAB1_AIDIL_CONFUSION_OUTPUT.some((re) => re.test(body));
}

export function repairBab1AidilConfusionOutput(text: string, userMessage: string): string {
  if (!detectBab1AidilConfusionOutput(text, userMessage)) return text;

  const correction = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan buku: Bab 1 Formula XYZ ialah Asas Keilmuan Alamtologi — bukan Pengenalan AIDIL.',
    'HISAL Bahagian AIDIL ialah buku berasingan; enjin AIDIL (A+B=C) ialah transformasi ingatan — ketiga-tiganya berbeza.',
  ].join(' ');

  const hasAsasSignal = /\basas\s+keilmuan|teori\s+masabayu\b/i.test(text);
  if (!hasAsasSignal) {
    return [
      correction,
      'Saya tidak akan ulang PG/PL, hisab-kehadiran, atau 1(7) sebagai jawapan Bab 1 Formula XYZ.',
      'Saya jawab dari Asas Keilmuan meterai — bukan HISAL AIDIL.',
    ].join(' ');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => {
    if (/\bbab\s*1\b[^.\n]{0,140}\b(?:aidil|pengenalan\s+aidil)\b/i.test(p)) return false;
    if (/\bpengenalan\s+aidil\b/i.test(p)) return false;
    if (
      /\bproses\s+gabung\b/i.test(p)
      && /\bproses\s+lerai\b/i.test(p)
      && !/\basas\s+keilmuan\b/i.test(p)
    ) return false;
    return true;
  });

  return `${correction}\n\n${filtered.join('\n\n')}`.trim();
}

const BAB2_HISAL_ASAS_CONFUSION_OUTPUT: RegExp[] = [
  /\bbab\s*2\b[^.\n]{0,160}\b(?:cara\s+kira|operasi\s+tambah|ganda\s+pa|hisal\s+asas|bahagian\s+asas)\b/i,
  /\bproses\s+cara\s+kira\b/i,
  /\bpola\s+operasi\s+tambah\b/i,
  /\bhisal\s+asas\b[^.\n]{0,80}\bbab\s*2\b/i,
];

export function detectBab2HisalAsasConfusionOutput(text: string, userMessage: string): boolean {
  if (!isFormulaXyzBab2FaktorQuery(userMessage)) return false;
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  if (/\bfaktor\s*xyz\b/i.test(body) && !/\bproses\s+cara\s+kira\b/i.test(body)) return false;
  return BAB2_HISAL_ASAS_CONFUSION_OUTPUT.some((re) => re.test(body));
}

export function repairBab2FaktorXyzStreamOutput(text: string, userMessage: string): string {
  if (!detectBab2HisalAsasConfusionOutput(text, userMessage)) return text;

  const correction = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan buku: Bab 2 Formula XYZ ialah Faktor (X, Y, Z) — bukan Proses Cara Kira atau Pola Operasi Tambah HISAL ASAS.',
    'HISAL Bahagian ASAS ialah buku berasingan dengan bab dalaman sendiri.',
  ].join(' ');

  const hasFaktorSignal = /\bfaktor\s*xyz\b|\bketetapan\s+y\b|\bfaktor\s*\(\s*x/i.test(text);
  if (!hasFaktorSignal) {
    return [
      correction,
      'Saya jawab dari Faktor XYZ meterai — X pelaku, Y Pencipta, Z medan rujukan, dalam Teori MASABAYU.',
    ].join(' ');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => !BAB2_HISAL_ASAS_CONFUSION_OUTPUT.some((re) => re.test(p)));
  return `${correction}\n\n${filtered.join('\n\n')}`.trim();
}

/** Strip "minta P.alt ajar semula" closing when Bab 1 backbone already loaded. */
export function repairBab1AsasStreamOutput(text: string, userMessage: string): string {
  let out = repairBab1AidilConfusionOutput(text, userMessage);
  if (!isFormulaXyzBab1AsasQuery(userMessage)) return out;

  const paras = out.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => !BAB1_RETEACH_BEGGING.some((re) => re.test(p)));
  return filtered.join('\n\n').trim() || out.trim();
}

const BAB3_HISAL_CONFUSION_OUTPUT: RegExp[] = [
  /\bbab\s*3\b[^.\n]{0,160}\b(?:cara\s+kira|aidil\s*(?:9|10|15|16)|operasi\s+sunom)\b/i,
  /\bcara\s+kira\s+aidil\b/i,
  /\boperasi\s+sunom\b[^.\n]{0,80}\bbab\s*3\b/i,
];

export function detectBab3HukumConfusionOutput(text: string, userMessage: string): boolean {
  if (!isFormulaXyzBab3HukumQuery(userMessage)) return false;
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  if (/\bhukum\s+(?:z|x|alamtologi)\b/i.test(body) && !/\bcara\s+kira\s+aidil\b/i.test(body)) {
    return false;
  }
  return BAB3_HISAL_CONFUSION_OUTPUT.some((re) => re.test(body));
}

export function repairBab3HukumStreamOutput(text: string, userMessage: string): string {
  if (!detectBab3HukumConfusionOutput(text, userMessage)) return text;

  const correction = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan buku: Bab 3 Formula XYZ ialah Hukum Alamtologi — bukan Cara Kira AIDIL (HISAL AIDIL) dan bukan Operasi SuNom.',
    'Hukum Z, Hukum X, dan Hukum Peleraian ialah jawapan Bab 3 Formula XYZ.',
  ].join(' ');

  const hasHukumSignal = /\bhukum\s+(?:z|x|alamtologi|peleraian)\b/i.test(text);
  if (!hasHukumSignal) {
    return [
      correction,
      'Saya jawab dari Hukum Alamtologi meterai — pola kadar pasangan keseimbangan dalam Teori MASABAYU.',
    ].join(' ');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => !BAB3_HISAL_CONFUSION_OUTPUT.some((re) => re.test(p)));
  return `${correction}\n\n${filtered.join('\n\n')}`.trim();
}

const BAB4_HISAL_BOOK_CONFUSION_OUTPUT: RegExp[] = [
  /\bbab\s*4\b[^.\n]{0,160}\b(?:nombor\s+20|pola\s+garis|cara\s+kira|operasi\s+sunom)\b/i,
  /\bnombor\s+20\b[^.\n]{0,80}\bbab\s*4\b/i,
  /\bpola\s+garis\b[^.\n]{0,80}\bbab\s*4\b/i,
];

export function detectBab4SainsConfusionOutput(text: string, userMessage: string): boolean {
  if (!isFormulaXyzBab4SainsQuery(userMessage)) return false;
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  if (
    /\b(?:sains\s+alamtologi|izwa|sira|rina)\b/i.test(body)
    && !/\bnombor\s+20\b/i.test(body)
    && !/\bpola\s+garis\b/i.test(body)
  ) {
    return false;
  }
  return BAB4_HISAL_BOOK_CONFUSION_OUTPUT.some((re) => re.test(body));
}

export function repairBab4SainsStreamOutput(text: string, userMessage: string): string {
  if (!detectBab4SainsConfusionOutput(text, userMessage)) return text;

  const correction = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan buku: Bab 4 Formula XYZ ialah Sains Alamtologi (HISAL, IZWA, SIRA, RINA) — bukan Nombor 20 AIDIL atau Pola Garis SuNom.',
    'HISAL dalam Bab 4 ialah komponen kerangka sains Formula XYZ — bukan buku HISAL Bahagian AIDIL.',
  ].join(' ');

  const hasSainsSignal = /\b(?:sains\s+alamtologi|izwa|sira|rina)\b/i.test(text);
  if (!hasSainsSignal) {
    return [
      correction,
      'Saya jawab dari Sains Alamtologi meterai — empat tiang HISAL, IZWA, SIRA, RINA dalam Formula XYZ.',
    ].join(' ');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => !BAB4_HISAL_BOOK_CONFUSION_OUTPUT.some((re) => re.test(p)));
  return `${correction}\n\n${filtered.join('\n\n')}`.trim();
}

const BAB5_HISAL_BOOK_CONFUSION_OUTPUT: RegExp[] = [
  /\bbab\s*5\b[^.\n]{0,160}\b(?:nombor\s+24|aplikasi\s+km|cara\s+kira)\b/i,
  /\bnombor\s+24\b[^.\n]{0,80}\bbab\s*5\b/i,
  /\baplikasi\s+km\b[^.\n]{0,80}\bbab\s*5\b/i,
];

export function detectBab5MasaConfusionOutput(text: string, userMessage: string): boolean {
  if (!isFormulaXyzBab5MasaQuery(userMessage)) return false;
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  if (
    /\b(?:faktor\s+masa|napadu|ruang\s+masa|bekas\s+pada\s+masa)\b/i.test(body)
    && !/\bnombor\s+24\b/i.test(body)
    && !/\baplikasi\s+km\b/i.test(body)
  ) {
    return false;
  }
  return BAB5_HISAL_BOOK_CONFUSION_OUTPUT.some((re) => re.test(body));
}

export function repairBab5MasaStreamOutput(text: string, userMessage: string): string {
  if (!detectBab5MasaConfusionOutput(text, userMessage)) return text;

  const correction = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan buku: Bab 5 Formula XYZ ialah Faktor Masa — bukan Nombor 24 AIDIL atau Aplikasi KM HISAL ASAS.',
    'Napadu, ruang masa, dan bekas pada masa ialah jawapan Bab 5 Formula XYZ.',
  ].join(' ');

  const hasMasaSignal = /\b(?:faktor\s+masa|napadu|ruang\s+masa)\b/i.test(text);
  if (!hasMasaSignal) {
    return [
      correction,
      'Saya jawab dari Faktor Masa meterai — Z[x,t²]m dalam Teori MASABAYU.',
    ].join(' ');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => !BAB5_HISAL_BOOK_CONFUSION_OUTPUT.some((re) => re.test(p)));
  return `${correction}\n\n${filtered.join('\n\n')}`.trim();
}

const BAB6_HISAL_BOOK_CONFUSION_OUTPUT: RegExp[] = [
  /\bbab\s*6\b[^.\n]{0,160}\b(?:aplikasi\s+graf|operasi\s+tambah|operasi\s+tolak|cara\s+kira|ganda\s+pa)\b/i,
  /\baplikasi\s+graf\b[^.\n]{0,80}\bbab\s*6\b/i,
  /\boperasi\s+tambah\b[^.\n]{0,80}\bbab\s*6\b/i,
  /\boperasi\s+tolak\b[^.\n]{0,80}\bbab\s*6\b/i,
];

export function detectBab6TenagaConfusionOutput(text: string, userMessage: string): boolean {
  if (!isFormulaXyzBab6TenagaQuery(userMessage)) return false;
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  if (
    /\b(?:faktor\s+tenaga|pasata|uid\s+tenaga|x\s*=\s*m\s*\/\s*t)\b/i.test(body)
    && !/\b(?:aplikasi\s+graf|operasi\s+tambah|operasi\s+tolak)\b/i.test(body)
  ) {
    return false;
  }
  return BAB6_HISAL_BOOK_CONFUSION_OUTPUT.some((re) => re.test(body));
}

export function repairBab6TenagaStreamOutput(text: string, userMessage: string): string {
  if (!detectBab6TenagaConfusionOutput(text, userMessage)) return text;

  const correction = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan susunan buku: Bab 6 Formula XYZ ialah Faktor Tenaga — bukan Aplikasi Graf / Operasi Tambah HISAL ASAS atau Operasi Tolak AIDIL.',
    'Pasata, UID tenaga, dan pelaksanaan X[m,t²] ialah jawapan Bab 6 Formula XYZ.',
  ].join(' ');

  const hasTenagaSignal = /\b(?:faktor\s+tenaga|pasata|uid\s+tenaga)\b/i.test(text);
  if (!hasTenagaSignal) {
    return [
      correction,
      'Saya jawab dari Faktor Tenaga meterai — x = m / t dalam Teori MASABAYU.',
    ].join(' ');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => !BAB6_HISAL_BOOK_CONFUSION_OUTPUT.some((re) => re.test(p)));
  return `${correction}\n\n${filtered.join('\n\n')}`.trim();
}

export function repairCurriculumContentDriftStreamOutput(text: string, userMessage: string): string {
  const overview = isAlamtologiCurriculumOverviewQuery(userMessage)
    || isFormulaXyzBab1AsasQuery(userMessage)
    || isFormulaXyzBab2FaktorQuery(userMessage);
  if (!overview) return text;

  const wrongXyz = detectWrongXyzDefinitionOutput(text);
  const wrongAidil = detectAidilBrainFormulaInOverviewOutput(text);
  if (!wrongXyz && !wrongAidil) return text;

  const parts = [
    'Bismillahirahmanirrahim.',
    'P.alt, dengan izin saya betulkan definisi mengikut struktur keilmuan P.alt — bermula dengan Y (Pencipta), kemudian Z (Alam Semesta) dan X (Manusia).',
    'Y = Pencipta (hierarki pertama). Z = Alam Semesta (medan rujukan, dicipta sebelum X). X = Manusia (khalifah, pengurus sistem Z).',
  ];
  if (wrongAidil) {
    parts.push('7.1 AIDIL ialah Pengenalan AIDIL dalam HISAL — bukan A+B=C brain formula (itu hanya bila P.alt tanya formula ingatan secara eksplisit).');
  }

  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const filtered = paras.filter((p) => {
    if (detectWrongXyzDefinitionOutput(p)) return false;
    if (detectAidilBrainFormulaInOverviewOutput(p)) return false;
    return true;
  });

  const tail = filtered.length
    ? filtered.join('\n\n')
    : STRUKTUR_KEILMUAN_ALAMTOLOGI.split('\n').slice(0, 8).join('\n');

  return `${parts.join(' ')}\n\n${tail}`.trim();
}

export function repairFormulaXyzStreamOutput(text: string, userMessage: string): string {
  const collapsed = repairCurriculumCollapseStreamOutput(text, userMessage);
  if (collapsed !== text) return collapsed;

  const drift = repairCurriculumContentDriftStreamOutput(text, userMessage);
  if (drift !== text) return drift;

  let out = repairBab1AsasStreamOutput(text, userMessage);
  out = repairBab2FaktorXyzStreamOutput(out, userMessage);
  out = repairBab3HukumStreamOutput(out, userMessage);
  out = repairBab4SainsStreamOutput(out, userMessage);
  out = repairBab5MasaStreamOutput(out, userMessage);
  out = repairBab6TenagaStreamOutput(out, userMessage);
  return out;
}
