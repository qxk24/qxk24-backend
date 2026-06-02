/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge — Record Mapper
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { VerificationAuthority } from './types/verification.types';
import type { TeachingRecord } from './crystalliser';

const QURAN_REF_RE = /Quran\s+(\d{1,3}:\d{1,3})/i;

/** Fitra-Iman sprint chain nodes — canonical constitutional family */
const FITRA_IMAN_CHAIN_NODES = new Set([
  'fitra', 'fitrah', 'aql', 'iman', 'tawakkul', 'rizq', 'amal', 'maqasid', 'quran', 'taqwa',
]);

const FITRA_IMAN_FAMILY = 'Fitra — Iman';

const CHAIN_EQ_EXPLICIT =
  /A\s*\+\s*B\s*=\s*C:\s*([A-Za-z\u00C0-\u024f]+)\s*\+\s*([A-Za-z\u00C0-\u024f]+)\s*=\s*([^.\n]+)/i;

const CHAIN_EQ_INLINE =
  /\b(Fitra|Fitrah|Aql|Iman|Tawakkul|Rizq|Amal|Maqasid|Quran|Taqwa)\s*\+\s*(Fitra|Fitrah|Aql|Iman|Tawakkul|Rizq|Amal|Maqasid|Quran|Taqwa)\s*=\s*([^.\n]+)/i;

function canonicalChainNode(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  const map: Record<string, string> = {
    fitra:  'Fitra',
    fitrah: 'Fitra',
    aql:    'Aql',
    iman:   'Iman',
    tawakkul: 'Tawakkul',
    rizq:   'Rizq',
    amal:   'Amal',
    maqasid: 'Maqasid',
    quran:  'Quran',
    taqwa:  'Taqwa',
  };
  return map[key] ?? raw.trim();
}

function isChainNode(name: string): boolean {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  return FITRA_IMAN_CHAIN_NODES.has(key === 'fitrah' ? 'fitra' : key);
}

export interface ParsedChainEquation {
  nodeA: string;
  nodeB: string;
  nodeC: string;
}

/** Parse A+B=C chain from founder teaching — Fitra + Aql = Iman, etc. */
export function parseChainEquation(text: string): ParsedChainEquation | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const explicit = trimmed.match(CHAIN_EQ_EXPLICIT);
  if (explicit) {
    const nodeA = canonicalChainNode(explicit[1]);
    const nodeB = canonicalChainNode(explicit[2]);
    const nodeC = explicit[3].trim();
    if (isChainNode(nodeA) && isChainNode(nodeB)) {
      return { nodeA, nodeB, nodeC };
    }
  }

  const inline = trimmed.match(CHAIN_EQ_INLINE);
  if (inline) {
    const nodeA = canonicalChainNode(inline[1]);
    const nodeB = canonicalChainNode(inline[2]);
    const nodeC = inline[3].trim();
    if (isChainNode(nodeA) && isChainNode(nodeB)) {
      return { nodeA, nodeB, nodeC };
    }
  }

  return null;
}

/** When chain nodes are present, use Fitra-Iman family — not Alamtologi principle lens */
export function inferChainFamily(nodeA: string, nodeB: string): string {
  if (isChainNode(nodeA) || isChainNode(nodeB)) return FITRA_IMAN_FAMILY;
  return '';
}

export function stageToKnowledgeLevel(stage: number): number {
  const clamped = Math.max(1, Math.min(7, stage || 1));
  return Math.min(6, Math.max(1, Math.ceil((clamped / 7) * 6)));
}

export function inferSubRegion(family: string, principle: string): string {
  const f = family.toLowerCase();
  if (/aqidah|iman|tawhid|fitra/i.test(f)) return 'aqidah';
  if (/ibadah|solat|puasa/i.test(f)) return 'ibadah';
  if (/fiqh|hukum/i.test(f)) return 'fiqh';
  if (/alamtologi|aidil|constitutional/i.test(f)) return 'alamtologi';
  if (/nafs|psych|soul/i.test(f)) return 'psychology';
  if (/mal|econom|rizq/i.test(f)) return 'economics';
  if (/nasl|family|marriage/i.test(f)) return 'family';
  if (/health|nafs/i.test(principle.toLowerCase())) return 'health';
  return 'general';
}

export function extractQuranReference(...texts: string[]): string {
  for (const t of texts) {
    const m = t.match(QURAN_REF_RE);
    if (m) return `Quran ${m[1]}`;
  }
  return '';
}

export function inferPrimaryAuthority(
  quranReference: string,
  principle: string,
): VerificationAuthority {
  if (quranReference) return 'quran';
  if (/alamtologi|aidil|constitutional|quran/i.test(principle)) return 'alamtologi';
  return 'alamtologi';
}

/** Map live adam_teaching_records row → crystalliser input */
export function mapAdamTeachingRecord(input: {
  _id: string | { toString(): string };
  recordId: string;
  transformationId: string;
  sessionId?: string;
  founderMessageId?: string;
  principle: string;
  family: string;
  stage: number;
  teachingIntent: string;
  outcomeSummary: string;
  relationalTags?: string[];
  entity_C_uid: string;
  createdAt?: Date;
}): TeachingRecord {
  const teachingIntent = input.teachingIntent.trim();
  const outcomeSummary = input.outcomeSummary.trim();
  const quranReference = extractQuranReference(teachingIntent, outcomeSummary);
  const primaryAuthority = inferPrimaryAuthority(quranReference, input.principle);

  const chain = parseChainEquation(teachingIntent);
  const family = chain
    ? inferChainFamily(chain.nodeA, chain.nodeB)
    : input.family;
  const subRegion = chain ? 'aqidah' : inferSubRegion(input.family, input.principle);
  const level = stageToKnowledgeLevel(input.stage);

  const entity_A = chain ? chain.nodeA : `${input.principle} — ${input.family}`;
  const entity_B = chain
    ? chain.nodeB
    : teachingIntent.slice(0, 2000);
  const tracePrinciple = chain ? chain.nodeA : input.principle;

  const confidence =
    primaryAuthority === 'quran'
      ? 1.0
      : quranReference
        ? 0.9
        : 0.85;

  const relationalTags = [...(input.relationalTags ?? [])];
  if (chain) {
    for (const tag of [chain.nodeA, chain.nodeB, 'fitra-iman'].map((t) => t.toLowerCase())) {
      if (!relationalTags.includes(tag)) relationalTags.push(tag);
    }
  }

  return {
    _id: typeof input._id === 'string' ? input._id : input._id.toString(),
    recordId: input.recordId,
    transformationId: input.transformationId,
    sessionId: input.sessionId ?? '',
    founderMessageId: input.founderMessageId ?? '',
    entity_A,
    entity_B,
    entity_C: outcomeSummary,
    relationship: 'A + B = C',
    family,
    subRegion,
    level,
    relationalTags,
    quranReference,
    quranRootTrace: {
      ayah: quranReference.replace(/^Quran\s+/i, '') || '6:38',
      text: outcomeSummary.slice(0, 280) || teachingIntent.slice(0, 280),
      principle: tracePrinciple,
      traceReason: chain
        ? `Fitra-Iman chain: ${chain.nodeA} + ${chain.nodeB} = ${chain.nodeC.slice(0, 80)}`
        : `Founder teaching transformation ${input.transformationId}`,
      tracedBy: primaryAuthority === 'quran' ? 'quran' : 'alamtologi',
      confidence,
    },
    confidenceScore: confidence,
    primaryAuthority,
    entity_C_uid: input.entity_C_uid,
    createdAt: input.createdAt ?? new Date(),
  };
}
