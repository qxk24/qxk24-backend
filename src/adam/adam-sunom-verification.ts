/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM SuNom World Sensing (Pancaindera Fasa 1–4)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * HISAL SuNom verification — position before speech.
 * Maps: Picu Lerai → Biasan → Lidah (Gabung) → Lika gate.
 */

import type { LlmSearchResult } from '../llm/llm-types';
import {
  buildTechnicalVerificationFallback,
  paragraphShouldStripAfterVerificationFailure,
  resolveTechnicalPrecisionTurn,
} from './adam-factual-grounding';
import { perPicuSupportCounts, scorePicuGabung } from './adam-sunom-lidah';
import type { KmSensingSnapshot } from './adam-sunom-km-sensing';

/** Four SuNom starting anchors (alamat mula). */
export type AlamatMulaId = 'a1' | 'g1' | 'a7' | 'g7';

/** Biasan cardinal channels — world sensing directions. */
export type BiasanChannel = 'UT' | 'TR' | 'ST' | 'BR';

/** Picu gabung consensus tier (HISAL Sa/Du/Ga/Pa). */
export type PicuGabungKadar = 'Sa' | 'Du' | 'Ga' | 'Pa';

/** Lika completion state for a technical turn. */
export type LikaState = 'pasif' | 'sa' | 'ga' | 'pa';

export interface SunomEvidenceHit extends LlmSearchResult {
  snippet?:    string;
  fetched?:    boolean;
  fetchError?: string;
}

export interface PicuLerai {
  value: number;
  unit:  string;
  raw:   string;
}

export interface BiasanAnchorReport {
  channel:    BiasanChannel;
  alamatMula: AlamatMulaId;
  active:     boolean;
  supportHits: number;
  snippetBacked?: boolean;
}

export interface SunomVerificationReport {
  picuInOutput:       PicuLerai[];
  lika:               LikaState;
  kadar:              PicuGabungKadar;
  ratioLabel:         string;
  tenaga:             number;
  anchors:            BiasanAnchorReport[];
  searchUsed:         boolean;
  searchDropped:      boolean;
  unsupportedClaims:  number;
  snippetBackedHits?: number;
  kmPeringkat?:       string;
}

export interface SunomVerificationInput {
  outputText?:         string;
  /** Pre–factual-grounding model text — used for picu/lika when post-strip text is empty. */
  rawOutputText?:      string;
  userMessage:         string;
  recentUserMessages?: string[];
  searchResults?:      SunomEvidenceHit[];
  searchUsed?:         boolean;
  searchDropped?:      boolean;
  kmSensing?:          KmSensingSnapshot;
}

export const LIKA_PASIF_USER_NOTE =
  'Catatan: Pengesahan SuNom (lika pasif) — ADAM tidak dapat melengkapkan gelung bukti '
  + 'pada giliran ini. Angka teknikal di bawah tidak disahkan; sila rujuk sumber rasmi atau hantar semula.';

const PRECISE_CLAIM_RE =
  /\b(\d[\d.,]*)\s*(?:@\s*(\d[\d.,]*)\s*(?:rpm|RPM))?\s*(nm|N·m|Nm|PS|ps|hp|HP|cc|CC|rpm|RPM|mg|ML|ml|mAh|GHz|MHz|kW|kPa|bar|°C|pH|ppm|mol|kg|kcal|kalori|W\b|V\b|A\b)\b/gi;

const PH_VALUE_RE = /\bpH\s*(?:adalah|ialah|=|:)?\s*(\d[\d.,]*)\b/gi;

const PH_CONTEXT_VALUE_RE =
  /\bpH\b[^.\n]{0,80}\b(?:ialah|adalah|=|:)\s*(\d[\d.,]*)\b/gi;

const UNIT_ALIASES: Record<string, string> = {
  nm: 'nm',
  'n·m': 'nm',
  ps: 'ps',
  hp: 'hp',
  cc: 'cc',
  rpm: 'rpm',
  mg: 'mg',
  ml: 'ml',
  mah: 'mah',
  ghz: 'ghz',
  mhz: 'mhz',
  kw: 'kw',
  kpa: 'kpa',
  bar: 'bar',
  '°c': 'c',
  ph: 'ph',
  ppm: 'ppm',
  mol: 'mol',
  kg: 'kg',
  kcal: 'kcal',
  kalori: 'kcal',
  w: 'w',
  v: 'v',
  a: 'a',
};

const OFFICIAL_URL_HINT =
  /\.gov\.|\.edu\.|wikipedia\.org|manual|specification|datasheet|brochure|official|service[- ]?guide|owner[- ]?guide/i;

function normalizeUnit(raw: string): string {
  const key = raw.toLowerCase().replace(/\s+/g, '');
  return UNIT_ALIASES[key] ?? key;
}

function parseNumericToken(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Extract precise technical picu from model output. */
export function extractPicuLerai(text: string): PicuLerai[] {
  const found: PicuLerai[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(PRECISE_CLAIM_RE)) {
    const valueRaw = match[1];
    const unitRaw = match[3];
    if (!valueRaw || !unitRaw) continue;

    const value = parseNumericToken(valueRaw);
    if (value === null) continue;

    const unit = normalizeUnit(unitRaw);
    const raw = match[0].trim();
    const key = `${value}|${unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ value, unit, raw });
  }

  for (const match of text.matchAll(PH_VALUE_RE)) {
    const valueRaw = match[1];
    if (!valueRaw) continue;
    const value = parseNumericToken(valueRaw);
    if (value === null) continue;
    const key = `${value}|ph`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ value, unit: 'ph', raw: match[0].trim() });
  }

  for (const match of text.matchAll(PH_CONTEXT_VALUE_RE)) {
    const valueRaw = match[1];
    if (!valueRaw) continue;
    const value = parseNumericToken(valueRaw);
    if (value === null) continue;
    const key = `${value}|ph`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ value, unit: 'ph', raw: match[0].trim() });
  }

  return found;
}

/** Full evidence blob — title + URL + fetched snippet (Phase 2 Lidah). */
export function evidenceBlob(hit: SunomEvidenceHit): string {
  return `${hit.title ?? ''} ${hit.url ?? ''} ${hit.snippet ?? ''}`.trim();
}

function numberAppearsInText(value: number, text: string): boolean {
  const intVal = Math.round(value);
  const patterns = [String(value), String(intVal), value.toFixed(1)];
  const lower = text.toLowerCase();
  return patterns.some((p) => {
    if (!p) return false;
    const re = new RegExp(`(?:~|≈|about|around|sekitar|±)?\\s*${p.replace('.', '\\.')}\\b`, 'i');
    return re.test(lower);
  });
}

function unitContextOk(picu: PicuLerai, blob: string): boolean {
  const b = blob.toLowerCase();
  if (picu.unit === 'nm') return /\bnm\b|torque|tork|tenaga|twist/i.test(b);
  if (picu.unit === 'ps') return /\bps\b|hp|kuasa|power/i.test(b);
  if (picu.unit === 'cc') return /\bcc\b|engine|enjin|displacement/i.test(b);
  if (picu.unit === 'ph') return /\bph\b|asid|alkali|laut|ocean|sea/i.test(b);
  if (picu.unit === 'mg') return /\bmg\b|dos|dose|paracetamol|ubat/i.test(b);
  return true;
}

/** Picu support against enriched evidence (Mata + Lidah + Jari). */
export function picuSupportedByEvidence(picu: PicuLerai, evidence: SunomEvidenceHit[]): number {
  let hits = 0;
  for (const hit of evidence) {
    const blob = evidenceBlob(hit);
    if (!blob) continue;
    if (!numberAppearsInText(picu.value, blob)) continue;
    if (!unitContextOk(picu, blob)) continue;
    hits += hit.fetched && hit.snippet ? 2 : 1;
  }
  return hits;
}

function countOfficialSupport(evidence: SunomEvidenceHit[], picu: PicuLerai[]): number {
  let count = 0;
  for (const hit of evidence) {
    const url = hit.url ?? '';
    if (!OFFICIAL_URL_HINT.test(url) && !OFFICIAL_URL_HINT.test(hit.title ?? '')) continue;
    if (picu.some((p) => numberAppearsInText(p.value, evidenceBlob(hit)))) count += 1;
  }
  return count;
}

function countIndependentUrlSupport(evidence: SunomEvidenceHit[], picu: PicuLerai[]): number {
  const urls = new Set<string>();
  for (const hit of evidence) {
    const url = hit.url?.trim();
    if (!url) continue;
    if (picu.some((p) => picuSupportedByEvidence(p, [hit]) > 0)) urls.add(url);
  }
  return urls.size;
}

function likaFromKadar(
  kadar: PicuGabungKadar,
  unsupportedClaims: number,
  picuLen: number,
): LikaState {
  if (picuLen === 0) return 'pa';
  if (unsupportedClaims === picuLen) return 'pasif';
  if (kadar === 'Pa') return 'pa';
  if (kadar === 'Ga') return 'ga';
  return 'sa';
}

function tenagaFromKadar(kadar: PicuGabungKadar, lika: LikaState): number {
  if (lika === 'pasif') return kadar === 'Sa' ? 2 : 1;
  if (kadar === 'Pa' || lika === 'pa') return 7;
  if (kadar === 'Ga' || lika === 'ga') return 5;
  return 3;
}

function resolveKadarAndLika(input: {
  picu: PicuLerai[];
  searchUsed: boolean;
  searchDropped: boolean;
  evidence: SunomEvidenceHit[];
  technicalTurn: boolean;
}): Pick<
  SunomVerificationReport,
  'lika' | 'kadar' | 'ratioLabel' | 'tenaga' | 'unsupportedClaims' | 'anchors' | 'snippetBackedHits'
> {
  const { picu, searchUsed, searchDropped, evidence, technicalTurn } = input;

  const perPicu = perPicuSupportCounts(evidence, picu);
  const trSupport = perPicu.length ? Math.max(...perPicu.map((n) => Math.ceil(n / 2)), 0) : 0;
  const utSupport = countOfficialSupport(evidence, picu);
  const stSupport = countIndependentUrlSupport(evidence, picu);
  const brSupport = evidence.filter((e) => e.fetched && e.snippet).length >= 2 ? 1 : 0;

  const snippetBackedHits = evidence.filter((e) => e.fetched && e.snippet && e.snippet.length >= 40).length;

  const anchors: BiasanAnchorReport[] = [
    {
      channel: 'UT',
      alamatMula: 'a1',
      active: utSupport > 0,
      supportHits: utSupport,
      snippetBacked: evidence.some(
        (e) => e.fetched && e.snippet && OFFICIAL_URL_HINT.test(e.url ?? ''),
      ),
    },
    {
      channel: 'TR',
      alamatMula: 'g1',
      active: trSupport > 0,
      supportHits: trSupport,
      snippetBacked: snippetBackedHits > 0,
    },
    {
      channel: 'ST',
      alamatMula: 'a7',
      active: stSupport >= 2,
      supportHits: stSupport,
      snippetBacked: stSupport >= 2 && snippetBackedHits >= 1,
    },
    {
      channel: 'BR',
      alamatMula: 'g7',
      active: brSupport > 0,
      supportHits: brSupport,
      snippetBacked: brSupport > 0,
    },
  ];

  let unsupportedClaims = 0;
  for (let i = 0; i < picu.length; i += 1) {
    if ((perPicu[i] ?? 0) === 0) unsupportedClaims += 1;
  }

  if (!technicalTurn || picu.length === 0) {
    return {
      lika: 'pa',
      kadar: 'Pa',
      ratioLabel: '4:1',
      tenaga: 7,
      unsupportedClaims: 0,
      anchors,
      snippetBackedHits,
    };
  }

  if (!searchUsed || searchDropped || evidence.length === 0) {
    return {
      lika: 'pasif',
      kadar: 'Sa',
      ratioLabel: '1:1',
      tenaga: 1,
      unsupportedClaims: picu.length,
      anchors,
      snippetBackedHits,
    };
  }

  const gabung = scorePicuGabung(evidence, picu.length, perPicu);
  const lika = likaFromKadar(gabung.kadar, unsupportedClaims, picu.length);
  const tenaga = tenagaFromKadar(gabung.kadar, lika);

  if (unsupportedClaims === picu.length) {
    // Search ran with hits but picu not in titles/snippets — soften to sa, not full pasif wipe.
    return {
      lika: 'sa',
      kadar: gabung.kadar,
      ratioLabel: gabung.ratioLabel,
      tenaga: tenagaFromKadar(gabung.kadar, 'sa'),
      unsupportedClaims,
      anchors,
      snippetBackedHits: gabung.snippetBackedHits,
    };
  }

  return {
    lika,
    kadar: gabung.kadar,
    ratioLabel: gabung.ratioLabel,
    tenaga,
    unsupportedClaims,
    anchors,
    snippetBackedHits: gabung.snippetBackedHits,
  };
}

/** Run SuNom world-sensing verification on a completed turn. */
export function runSunomVerification(input: SunomVerificationInput): SunomVerificationReport {
  const recent = input.recentUserMessages ?? [];
  const ctx = resolveTechnicalPrecisionTurn(input.userMessage, recent);
  const evidence = input.searchResults ?? [];
  const picuInOutput = extractPicuLerai(input.outputText ?? '');

  const core = resolveKadarAndLika({
    picu: picuInOutput,
    searchUsed: input.searchUsed === true,
    searchDropped: input.searchDropped === true,
    evidence,
    technicalTurn: ctx.isActive,
  });

  return {
    picuInOutput,
    searchUsed: input.searchUsed === true,
    searchDropped: input.searchDropped === true,
    kmPeringkat: input.kmSensing?.peringkat,
    ...core,
  };
}

const PRECISE_SPEC_LINE =
  /\b\d+[\d.,]*\s*(?:@\s*\d[\d.,]*\s*)?(?:nm|N·m|Nm|PS|ps|hp|cc|rpm|mg|ml|mAh|GHz|MHz|kW|kPa|bar|°C|pH|ppm|mol|kg|kcal)\b|\bpH\b[^.\n]{0,80}\b(?:ialah|adalah|=|:)\s*\d[\d.,]*/i;

const QUALITATIVE_SPEC_CLAIM =
  /\b(?:tiada\s+(?:perbezaan|beza)|sama\s+(?:sepenuhnya|sahaja)?|identical|no\s+difference)\b/i;

const TECH_SPEC_TOPIC =
  /\b(?:tork|torque|kuasa|power|enjin|engine|transmisi|transmission|gear\s+ratio|pengecasan|output\s+enjin)\b/i;

const TRIM_VARIANT_COMPARE =
  /\b(?:elite|exclusive|standard|premium|variant|varian|trim|spec\s+level)\b/i;

const HOLLOW_TECH_TEASER =
  /\b(?:berikut|di\s+bawah|below)\b[^.\n]{0,50}\b(?:perbandingan|comparison|ringkas|spesifikasi|spec|jadual|table)\b/i;

const PASSIVE_TECH_MENU =
  /\bAdakah\s+anda\s+(?:ingin|sedang\s+mempertimbangkan)\b|\batau\s+(?:perlukan\s+penjelasan|ingin\s+membanding)|\bmodel\s+(?:kereta\s+)?lain\b|\bmempertimbangkan\s+pembelian\b|\b0[\s–-]100\s*km|\bpenggunaan\s+bahan\s+api\b|\bsaya\s+boleh\s+bantu\s+dengan\s+detail\b|\bhow\s+does\s+.+\s+affect\b/i;

const USEFUL_TECH_CLARIFIER =
  /\b(?:tahun|chassis|kod\s+varian|varian\s+khas|spesifikasi\s+tepat|carian\s+semula)\b/i;

const VERIFICATION_CATATAN_PREFIX = /^Catatan:\s/m;

/** Confident trim/spec comparison without verified picu — strip when lika is pasif. */
function paragraphHasUnverifiedQualitativeSpec(paragraph: string): boolean {
  if (!TECH_SPEC_TOPIC.test(paragraph)) return false;
  if (QUALITATIVE_SPEC_CLAIM.test(paragraph)) return true;
  if (TRIM_VARIANT_COMPARE.test(paragraph) && /\b(?:sama|tiada|beza|perbezaan|identical)\b/i.test(paragraph)) {
    return true;
  }
  return false;
}

function paragraphIsHollowTechnicalTeaser(paragraph: string): boolean {
  if (!TECH_SPEC_TOPIC.test(paragraph)) return false;
  if (extractPicuLerai(paragraph).length > 0) return false;
  if (HOLLOW_TECH_TEASER.test(paragraph)) return true;
  if (TRIM_VARIANT_COMPARE.test(paragraph) && /\b(?:mengikut\s+varian|semua\s+model|perbandingan)\b/i.test(paragraph)) {
    return true;
  }
  return false;
}

function paragraphIsPassiveTechMenu(paragraph: string): boolean {
  return PASSIVE_TECH_MENU.test(paragraph);
}

function paragraphIsUsefulTechClarifier(paragraph: string): boolean {
  return USEFUL_TECH_CLARIFIER.test(paragraph) && !paragraphIsPassiveTechMenu(paragraph);
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Markdown/inline URLs not present in search evidence — likely fabricated after failed lika. */
function paragraphHasUnverifiedSourceCitations(
  paragraph: string,
  evidence: SunomEvidenceHit[],
): boolean {
  const citedHosts: string[] = [];
  for (const match of paragraph.matchAll(/\((https?:\/\/[^)\s]+)\)/g)) {
    const host = hostFromUrl(match[1] ?? '');
    if (host) citedHosts.push(host);
  }
  if (citedHosts.length === 0) return false;

  const evidenceHosts = evidence
    .map((hit) => hostFromUrl(hit.url ?? ''))
    .filter((h): h is string => Boolean(h));

  if (evidenceHosts.length === 0) return citedHosts.length > 0;

  return !citedHosts.some((cited) =>
    evidenceHosts.some(
      (evidenceHost) => cited === evidenceHost
        || cited.endsWith(`.${evidenceHost}`)
        || evidenceHost.endsWith(`.${cited}`),
    ),
  );
}

function searchAttemptedWithEvidence(
  report: SunomVerificationReport,
  evidence: SunomEvidenceHit[],
): boolean {
  return report.searchUsed === true
    && report.searchDropped !== true
    && evidence.length > 0;
}

function shouldStripPasifParagraph(
  paragraph: string,
  report: SunomVerificationReport,
  evidence: SunomEvidenceHit[],
  userMessage = '',
  recentUserMessages: string[] = [],
): boolean {
  if (paragraphShouldStripAfterVerificationFailure(paragraph, userMessage, recentUserMessages)) return true;
  if (paragraphHasUnverifiedSourceCitations(paragraph, evidence)) return true;
  if (
    !searchAttemptedWithEvidence(report, evidence)
    && paragraphHasUnsupportedPicu(paragraph, report.picuInOutput, evidence)
  ) return true;
  if (paragraphHasUnverifiedQualitativeSpec(paragraph)) return true;
  if (paragraphIsHollowTechnicalTeaser(paragraph)) return true;
  if (paragraphIsPassiveTechMenu(paragraph)) return true;
  return false;
}

function specNumberAppearsInEvidence(value: number, evidence: SunomEvidenceHit[]): boolean {
  const tokens = new Set<string>([
    String(value),
    value.toFixed(1),
    String(Math.round(value)),
  ]);
  return evidence.some((hit) => {
    const blob = `${hit.title ?? ''} ${hit.snippet ?? ''}`;
    for (const token of tokens) {
      if (blob.includes(token)) return true;
    }
    return false;
  });
}

const PARAGRAPH_MEASURED_VALUE =
  /\b(\d[\d.,]*)\s*(nm|n·m|ps|hp|cc|rpm|mg|ml|k\b|°c|kw|kpa|bar|ppm|mol)\b/gi;

function paragraphHasEvidenceBackedPicu(
  paragraph: string,
  evidence: SunomEvidenceHit[],
): boolean {
  if (evidence.length === 0) return false;

  const localPicu = extractPicuLerai(paragraph);
  if (localPicu.some((p) => picuSupportedByEvidence(p, evidence) > 0)) return true;

  for (const match of paragraph.matchAll(PARAGRAPH_MEASURED_VALUE)) {
    const value = parseNumericToken(match[1] ?? '');
    if (value === null) continue;
    const unit = normalizeUnit(match[2] ?? '');
    if (!specNumberAppearsInEvidence(value, evidence)) continue;
    if (unitContextOk({ value, unit, raw: match[0] ?? '' }, evidence.map(evidenceBlob).join(' '))) {
      return true;
    }
  }
  return false;
}

/** After lika pasif — only search-backed picu or honest context clarifiers; else echo ask. */
function resolvePasifGateBody(
  kept: string[],
  userMessage: string,
  recentUserMessages: string[],
  evidence: SunomEvidenceHit[],
): string {
  const allowed = kept.filter(
    (p) => paragraphHasEvidenceBackedPicu(p, evidence) || paragraphIsUsefulTechClarifier(p),
  );
  if (allowed.length > 0) return allowed.join('\n\n').trim();
  void userMessage;
  void recentUserMessages;
  return '';
}

function paragraphHasUnsupportedPicu(
  paragraph: string,
  picu: PicuLerai[],
  evidence: SunomEvidenceHit[],
): boolean {
  if (!PRECISE_SPEC_LINE.test(paragraph)) return false;
  const localPicu = extractPicuLerai(paragraph);
  if (localPicu.length === 0) return PRECISE_SPEC_LINE.test(paragraph);
  return localPicu.every((p) => picuSupportedByEvidence(p, evidence) === 0);
}

function textHasUnverifiedTechnicalParagraphs(
  text: string,
  report: SunomVerificationReport,
  evidence: SunomEvidenceHit[],
  userMessage = '',
  recentUserMessages: string[] = [],
): boolean {
  return text.split(/\n{2,}/).some((para) => {
    const trimmed = para.trim();
    if (!trimmed || VERIFICATION_CATATAN_PREFIX.test(trimmed)) return false;
    return shouldStripPasifParagraph(trimmed, report, evidence, userMessage, recentUserMessages);
  });
}

/** Post-stream gate — only when lika pasif or a paragraph fails verification. */
export function applySunomVerificationGate(
  text: string,
  report: SunomVerificationReport,
  evidence: SunomEvidenceHit[] = [],
  options?: { userMessage?: string; recentUserMessages?: string[] },
): string {
  const userMessage = options?.userMessage ?? '';
  const recentUserMessages = options?.recentUserMessages ?? [];
  const technicalTurn = resolveTechnicalPrecisionTurn(userMessage, recentUserMessages).isActive;
  const hasUnverified = textHasUnverifiedTechnicalParagraphs(
    text,
    report,
    evidence,
    userMessage,
    recentUserMessages,
  );
  const activeGate = report.lika === 'pasif' || (technicalTurn && hasUnverified);

  if (!activeGate) return text;
  if (!technicalTurn && report.picuInOutput.length === 0) return text;

  const paragraphs = text.split(/\n{2,}/);
  const kept: string[] = [];
  let stripped = false;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (VERIFICATION_CATATAN_PREFIX.test(trimmed)) {
      stripped = true;
      continue;
    }
    if (shouldStripPasifParagraph(trimmed, report, evidence, userMessage, recentUserMessages)) {
      stripped = true;
      continue;
    }
    kept.push(trimmed);
  }

  if (!stripped) return text.trim();

  if (report.lika !== 'pasif' && kept.length > 0) {
    return kept.join('\n\n').trim();
  }

  return resolvePasifGateBody(kept, userMessage, recentUserMessages, evidence);
}

/** Verify + gate (input should be enriched via adam-sunom-pipeline when possible). */
export function sanitizeSunomVerifiedOutput(
  text: string,
  input: SunomVerificationInput,
): string {
  const verifyText = (input.rawOutputText ?? input.outputText ?? text).trim();
  const report = runSunomVerification({ ...input, outputText: verifyText });
  return applySunomVerificationGate(text, report, input.searchResults ?? [], {
    userMessage:         input.userMessage,
    recentUserMessages:  input.recentUserMessages,
  });
}

/** @deprecated Use picuSupportedByEvidence */
export function picuSupportedBySearch(picu: PicuLerai, results: LlmSearchResult[]): number {
  return picuSupportedByEvidence(picu, results);
}
