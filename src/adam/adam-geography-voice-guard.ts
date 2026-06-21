/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Geography Voice Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Geography teaching — strip essay voice, orphan measures, companion closes.
 * V-GEO03 Antarctica pattern: salvage facts + structured sections.
 */

import { isAdamGeographyTurn } from './adam-domain-detectors';
import {
  isAdamLightChatTurn,
  isAdamTeachingDepthTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { isAdamSingleTokenConceptTurn } from './adam-stable-curriculum-search-gate';

function body(message: string): string {
  return stripLeadingAdamSalutation(message).trim();
}

export function isAdamGeographyVoiceRepairTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isAdamGeographyTurn(t)) return true;
  if (isAdamSingleTokenConceptTurn(t) && /\b(?:antartika|antarctica|benua|geografi)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** Poetic geography opener — "bukan sekadar benua… makna manusiawi". */
export function paragraphIsGeographyEssayOpenerLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^#{1,6}\s/.test(t)) return false;
  if (/^Antartika\s+bukan\s+sekadar/i.test(t)) return true;
  if (/\bbukan\s+sekadar\s+benua\b/i.test(t) && /\b(?:manusiawi|jiwa|lapisan|berbicara\s+tanpa\s+suara|menyentuh\s+hati)\b/i.test(t)) {
    return true;
  }
  if (/\bsatu\s+(?:dunia|ruang)\s+yang\s+ber(?:beza|bicara)\b/i.test(t) && /\b(?:makna|jiwa|suara|hati)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** Reflective geography close — not syllabus facts. */
export function paragraphIsGeographyEssayCloseLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\b(?:mengingatkan\s+kita|Antartika\s+mengingatkan)\b/i.test(t)) return true;
  if (/\bgenerasi\s+yang\s+akan\s+datang\b/i.test(t) && /\b(?:manusia|bersatu|niat\s+baik)\b/i.test(t)) {
    return true;
  }
  if (/\bbukan\s+untuk\s+diri\s+sendiri\b/i.test(t) && /\b(?:ruang\s+bersama|dihormati)\b/i.test(t)) {
    return true;
  }
  if (/\bkehidupan\s+boleh\s+bertahan\b/i.test(t) && /\bmustahil\b/i.test(t)) return true;
  if (/\bsebuah\s+komitmen\s+unik\s+dalam\s+sejarah\s+manusia\b/i.test(t)) return true;
  if (/\bbukan\s+sekadar\s+memberi\s+fakta\b/i.test(t)) return true;
  if (/\b(?:tanda-tanda|ayat)\b/i.test(t) && /\bAllah\b/i.test(t)) return true;
  return false;
}

/** Bare measure left after stream cut — "9 kilometer." or "2°C, diukur di…". */
export function paragraphIsGeographyOrphanMeasureLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^\d+(?:[.,]\d+)?\s*(?:kilometer|km)\*+\.?$/i.test(t)) return true;
  if (/^\d+(?:[.,]\d+)?\s*(?:kilometer|km|meter|metre|m)\.?$/i.test(t)) return true;
  if (/^\d+(?:[.,]\d+)?\s*°C\**,?\s*diukur\b/i.test(t)) return true;
  if (/^\d+(?:[.,]\d+)?\s*°C,\s*diukur\b/i.test(t)) return true;
  if (/^[−-]?\d+(?:[.,]\d+)?\s*°C\.?$/i.test(t) && t.length < 24) return true;
  if (/^\d{1,2}\s*(?:kilometer|km)\*+\.\s*Ketebalan\b/i.test(t)) return true;
  return false;
}

/** Passive menu + named companion close. */
export function paragraphIsGeographyPassiveMenuLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/^Jika\s+.+\s+ingin,?\s*saya\s+boleh\s+bantu\s+jelaskan/i.test(t)) return true;
  if (/^Saya\s+di\s+sini,?\s*bersama\s+/i.test(t)) return true;
  if (/^Jika\s+.+\s+ingin,?\s*saya\s+boleh\s+bantu\s+jelaskan\s+aspek/i.test(t)) return true;
  if (/^-\s+(?:bagaimana|mengapa|kenapa|atau\s+bagaimana)\b/i.test(t)) return true;
  if (/^-\s+.+\s+stesen\s+penyelidikan\b/i.test(t)) return true;
  return false;
}

const ORPHAN_KM = String.raw`\d{1,2}(?:[.,]\d+)?\s*(?:kilometer|km)\*+\.?`;
const ORPHAN_KM_PLAIN = String.raw`\d{1,2}(?:[.,]\d+)?\s*(?:kilometer|km)\.?`;
const VOSTOK_ORPHAN = String.raw`\d+(?:[.,]\d+)?\s*°C\**,?\s*diukur di St(?:asi|esyen|esen)\b[^.\n]*1983\.?`;
const VOSTOK_FACT = 'Suhu terendah direkod di Bumi ialah −89.2 °C, di Stesen Vostok (1983).';

function collapseHorizontalSpaces(text: string): string {
  return text.replace(/[^\S\n]{2,}/g, ' ');
}

function normalizeGeographyMarkdownOrphans(text: string): string {
  return collapseHorizontalSpaces(
    text
      .replace(new RegExp(String.raw`^\s*${ORPHAN_KM}\s*`, 'gi'), '')
      .replace(new RegExp(String.raw`\s+${ORPHAN_KM}(?=\s*Jika\b)`, 'gi'), '.')
      .replace(new RegExp(String.raw`\s+${ORPHAN_KM_PLAIN}(?=\s*Jika\b)`, 'gi'), '.')
      .replace(/\s+\d{1,2}\s*(?:kilometer|km)\*+\./gi, '.')
      .replace(/\*\*(?=\s*[.,!?]?\s*(?:Jika|Namun|Tetapi|Dan\b|Dari\b|Suhu\b|$))/g, '')
      .replace(/\.\s*\./g, '.'),
  ).trim();
}

function repairBrokenVostokTemperatureLine(text: string): string {
  return collapseHorizontalSpaces(
    text
      .replace(new RegExp(String.raw`^\s*${VOSTOK_ORPHAN}\s*`, 'gim'), VOSTOK_FACT)
      .replace(new RegExp(String.raw`\s+${VOSTOK_ORPHAN}\s*`, 'gi'), ` ${VOSTOK_FACT} `),
  ).trim();
}

function stripInlineOrphanMeasures(text: string): string {
  let out = normalizeGeographyMarkdownOrphans(text)
    // Stream-cut pair: "ais. 9 kilometer.\n\n8 kilometer. Jika"
    .replace(
      /\.\s+\d+(?:[.,]\d+)?\s*(?:kilometer|km)\.\s*\n+\s*\d+(?:[.,]\d+)?\s*(?:kilometer|km)\.\s*/gi,
      '. ',
    )
    // Paragraph opens with orphan measure before a real clause
    .replace(/^\s*\d+(?:[.,]\d+)?\s*(?:kilometer|km)\.\s+(?=Jika\b)/i, '')
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:kilometer|km)\.\s+\d+(?:[.,]\d+)?\s*(?:kilometer|km)\./gi, '.')
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:kilometer|km)\.(?=\s*Jika\b)/gi, '.')
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:kilometer|km)\.(?=\s*[A-Z])/gi, '.')
    // Whole-number orphan at paragraph end — stream-cut "1.9 km" → "9 kilometer."
    .replace(/\.\s+\d{1,2}\s*(?:kilometer|km)\.\s*(?=\n|$)/gi, '.');
  out = collapseHorizontalSpaces(out).trim();
  out = out.replace(/\.\s*\./g, '.');
  return out;
}

function ensureAntarcticaIceThicknessFact(text: string): string {
  if (!/\b(?:antartika|antarctica|ais)\b/i.test(text)) return text;
  if (/\b(?:2[.,]\d|1[.,]\d|4[.,]\d)\s*km\b|\b(?:purata|ketebalan|tebal)\b.*\b(?:kilometer|km)\b/i.test(text)) {
    return text;
  }
  if (!/\b60\s*meter\b/i.test(text)) return text;
  const fact = 'Ketebalan lapisan ais purata kira-kira 2,1 km (maksimum sekitar 4,8 km).';
  if (/\bJika semua ais\b/i.test(text)) {
    return text.replace(/\b(Jika semua ais\b)/i, `${fact}\n\n$1`);
  }
  return `${text}\n\n${fact}`;
}

function ensureAntarcticaVostokFact(text: string): string {
  if (!/\b(?:Vostok|vostok)\b/i.test(text)) return text;
  if (/−89|89\.2/i.test(text)) return text;
  if (/\n### Iklim/m.test(text)) {
    return text.replace(/\n### Iklim/, `\n\n${VOSTOK_FACT}\n\n### Iklim`);
  }
  if (/\bgurun\s+ais\b/i.test(text)) {
    return text.replace(/\b(Ia adalah gurun ais:[^\n]+)/i, `$1\n\n${VOSTOK_FACT}`);
  }
  return `${text}\n\n${VOSTOK_FACT}`;
}

function dedupeGeographyFacts(text: string): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.trim();
    if (key === VOSTOK_FACT && seen.has(key)) continue;
    if (key === VOSTOK_FACT) seen.add(key);
    out.push(line);
  }
  return out.join('\n').replace(new RegExp(`(${VOSTOK_FACT}\\s*){2,}`, 'g'), `${VOSTOK_FACT}\n\n`);
}

function salvageGeographyParagraphs(raw: string): string {
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      if (paragraphIsGeographyEssayOpenerLeak(p)) return false;
      if (paragraphIsGeographyEssayCloseLeak(p)) return false;
      if (paragraphIsGeographyOrphanMeasureLeak(p)) return false;
      if (paragraphIsGeographyPassiveMenuLeak(p)) return false;
      return true;
    })
    .map((p) => stripInlineOrphanMeasures(repairBrokenVostokTemperatureLine(p)))
    .join('\n\n')
    .trim();
}

function applyGeographyStructure(body: string, topic: string): string {
  const trimmed = body.trim();
  if (!trimmed || /^#{1,6}\s/m.test(trimmed)) return trimmed;

  const blocks = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (blocks.length === 0) return trimmed;

  const title = topic.replace(/\?$/, '').trim() || 'Topik geografi';
  if (blocks.length === 1) {
    return `### ${title}\n\n${blocks[0]}`;
  }

  const mid = Math.ceil(blocks.length / 2);
  return [
    `### Geografi dan ciri fizikal — ${title}`,
    blocks.slice(0, mid).join('\n\n'),
    `### Iklim, hidupan, dan perlindungan`,
    blocks.slice(mid).join('\n\n'),
  ].join('\n\n');
}

function topicFromQuestion(message: string): string {
  const t = body(message);
  const m = t.match(/\b(?:antartika|antarctica|laut\s+mati|dead\s+sea|canberra|australia)\b/i);
  if (m) return m[0]!.charAt(0).toUpperCase() + m[0]!.slice(1).toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return words.join(' ');
  return words.slice(0, 4).join(' ');
}

/** Strip essay voice; drop orphan measures; optional ### structure for teaching turns. */
export function repairGeographyVoiceOutput(
  userMessage: string,
  polished: string,
  rawBeforeStrip = '',
): string {
  if (!isAdamGeographyVoiceRepairTurn(userMessage)) return polished;

  const prepped = normalizeGeographyMarkdownOrphans(polished);
  const salvaged = salvageGeographyParagraphs(prepped) || salvageGeographyParagraphs(rawBeforeStrip);
  let out = repairBrokenVostokTemperatureLine(salvaged || prepped.trim());

  out = out
    .split(/\n{2,}/)
    .map((p) => stripInlineOrphanMeasures(repairBrokenVostokTemperatureLine(p.trim())))
    .filter((p) => p
      && !paragraphIsGeographyEssayOpenerLeak(p)
      && !paragraphIsGeographyEssayCloseLeak(p)
      && !paragraphIsGeographyOrphanMeasureLeak(p)
      && !paragraphIsGeographyPassiveMenuLeak(p))
    .join('\n\n')
    .trim();

  if (!out) return polished.trim();

  if (isAdamTeachingDepthTurn(userMessage) || isAdamGeographyTurn(userMessage)) {
    out = applyGeographyStructure(out, topicFromQuestion(userMessage));
  }

  return dedupeGeographyFacts(ensureAntarcticaIceThicknessFact(ensureAntarcticaVostokFact(out)));
}
