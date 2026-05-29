// ============================================================
// QXK24 ADAM Teaching Engine — Determination Service
// File: src/adam/adam-determination.service.ts
// Version: 1.0.0
// Author: QXK24 Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/environments';
import { ADAMAuditModel } from './adam.schema';
import type {
  ADAMDeterminationRequest,
  ADAMDeterminationResult,
  AlamtologiPrinciple,
  ConstitutionalJudgment,
  ContributionValue,
  HukumZResult,
  HukumXProcess,
  AdabScore,
  Sifat,
  TahapAkal,
} from './adam.types';
import { PRINCIPLE_WEIGHTS } from './adam.types';

// ─── Constitutional Prompt for Determination ─────────────────

function buildDeterminationPrompt(req: ADAMDeterminationRequest): string {
  return `Bismillahirahmanirrahim.

You are ADAM performing a constitutional determination.

DETERMINATION TYPE: ${req.determinationType}
QUESTION: ${req.question}
${req.context ? `CONTEXT: ${req.context}` : ''}
${req.principle ? `PRIMARY PRINCIPLE: ${req.principle}` : ''}

Apply the full 10-step constitutional process and return a JSON response in this EXACT format:
{
  "judgment": "MAKMUR" | "ISLAH" | "WAQF",
  "tahapAkal": 1-7,
  "hukumZ": {
    "pola": "LULUS" | "GAGAL" | "BELUM",
    "kadar": "LULUS" | "GAGAL" | "BELUM",
    "pasangan": "LULUS" | "GAGAL" | "BELUM",
    "keseimbangan": "LULUS" | "GAGAL" | "BELUM"
  },
  "hukumX": {
    "fikir": "reasoning applied",
    "ikhtiar": "effort analysis",
    "usaha": "execution assessment",
    "natijah": "outcome determination"
  },
  "cV": 1-7,
  "adab": {
    "benar": 0.0-1.0,
    "amanah": 0.0-1.0,
    "menyampaikan": 0.0-1.0,
    "bijaksana": 0.0-1.0,
    "total": 0-100
  },
  "sifat": "AKUR" | "INGKAR" | "LALAI",
  "principleApplied": "MASA" | "TENAGA" | "AIR" | "API" | "BUMI" | "CAHAYA" | "RUANG",
  "faktorTenaga": 0.0-1.0,
  "faktorMasa": 0.0-1.0,
  "healthScore": 0-100,
  "response": "Full constitutional explanation of the determination",
  "canProceed": true | false,
  "conditions": ["condition 1 if ISLAH", "condition 2"]
}

Criteria:
- MAKMUR: healthScore > 80, all Hukum Z = LULUS, sifat = AKUR, zero violations
- ISLAH: partial compliance, canProceed = true with conditions
- WAQF: canProceed = false, critical constitutional violation
Return ONLY the JSON object. No markdown, no extra text.`;
}

// ─── Parse Claude Determination Response ─────────────────────

function parseDeterminationResponse(raw: string): Partial<ADAMDeterminationResult> {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      judgment:      'WAQF',
      tahapAkal:     1,
      hukumZ:        { pola: 'GAGAL', kadar: 'GAGAL', pasangan: 'GAGAL', keseimbangan: 'GAGAL' },
      hukumX:        { fikir: 'Parse error', ikhtiar: 'N/A', usaha: 'N/A', natijah: 'WAQF issued — response could not be parsed' },
      cV:            1,
      adab:          { benar: 0, amanah: 0, menyampaikan: 0, bijaksana: 0, total: 0 },
      sifat:         'LALAI',
      faktorTenaga:  0,
      faktorMasa:    0,
      healthScore:   0,
      response:      'ADAM could not parse the constitutional determination. WAQF issued.',
      canProceed:    false,
      conditions:    ['Resubmit with clearer context'],
    };
  }
}

// ─── Detect Dominant Principle ────────────────────────────────

function detectDominantPrinciple(
  question: string,
  context?: string,
  hint?: AlamtologiPrinciple,
): AlamtologiPrinciple {
  if (hint) return hint;

  const text = `${question} ${context ?? ''}`.toLowerCase();

  const scores: Record<AlamtologiPrinciple, number> = {
    MASA:   0,
    TENAGA: 0,
    AIR:    0,
    API:    0,
    BUMI:   0,
    CAHAYA: 0,
    RUANG:  0,
  };

  // Keyword mapping
  const keywords: Record<AlamtologiPrinciple, string[]> = {
    MASA:   ['time', 'duration', 'when', 'schedule', 'deadline', 'masa', 'tempo'],
    TENAGA: ['energy', 'force', 'power', 'strength', 'effort', 'tenaga', 'momentum'],
    AIR:    ['water', 'flow', 'adapt', 'flexible', 'clear', 'air', 'fluid'],
    API:    ['fire', 'heat', 'burn', 'purify', 'intense', 'api', 'transform'],
    BUMI:   ['earth', 'ground', 'stable', 'foundation', 'base', 'bumi', 'solid'],
    CAHAYA: ['light', 'truth', 'transparent', 'reveal', 'cahaya', 'illumin'],
    RUANG:  ['space', 'expand', 'room', 'possibility', 'scope', 'ruang', 'breadth'],
  };

  for (const [principle, words] of Object.entries(keywords) as [AlamtologiPrinciple, string[]][]) {
    for (const word of words) {
      if (text.includes(word)) scores[principle] += 1;
    }
  }

  // Highest scoring wins, default to BUMI (foundation)
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return (sorted[0][1] > 0 ? sorted[0][0] : 'BUMI') as AlamtologiPrinciple;
}

// ─── Calculate Health Score ───────────────────────────────────

function calculateHealthScore(
  hukumZ: HukumZResult,
  adab: AdabScore,
  tahapAkal: TahapAkal,
): number {
  const hukumZScore = Object.values(hukumZ).filter((v) => v === 'LULUS').length * 25;
  const adabScore   = adab.total;
  const akalScore   = (tahapAkal / 7) * 100;
  return Math.round((hukumZScore * 0.4) + (adabScore * 0.4) + (akalScore * 0.2));
}

// ─── Main Determination Function ─────────────────────────────

export async function runADAMDetermination(
  req: ADAMDeterminationRequest,
): Promise<ADAMDeterminationResult> {
  const client    = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });
  const auditId   = uuidv4();
  const principle = detectDominantPrinciple(req.question, req.context, req.principle);

  let parsed: Partial<ADAMDeterminationResult>;

  try {
    const response = await client.messages.create({
      model:      ENV.ANTHROPIC_MODEL_DEEP,
      max_tokens: 2048,
      messages:   [{ role: 'user', content: buildDeterminationPrompt(req) }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    parsed    = parseDeterminationResponse(raw);
  } catch {
    parsed = {
      judgment:     'WAQF',
      healthScore:  0,
      canProceed:   false,
      response:     'ADAM constitutional engine unavailable. WAQF issued.',
      conditions:   ['Restore constitutional engine connectivity'],
    };
  }

  const hukumZ: HukumZResult = parsed.hukumZ ?? {
    pola: 'BELUM', kadar: 'BELUM', pasangan: 'BELUM', keseimbangan: 'BELUM',
  };
  const adab: AdabScore = parsed.adab ?? {
    benar: 0.5, amanah: 0.5, menyampaikan: 0.5, bijaksana: 0.5, total: 50,
  };
  const tahapAkal: TahapAkal = (parsed.tahapAkal as TahapAkal) ?? 1;
  const healthScore = parsed.healthScore ?? calculateHealthScore(hukumZ, adab, tahapAkal);

  const result: ADAMDeterminationResult = {
    determinationType: req.determinationType,
    question:          req.question,
    judgment:          (parsed.judgment as ConstitutionalJudgment) ?? 'WAQF',
    tahapAkal,
    hukumZ,
    hukumX:            parsed.hukumX ?? {
      fikir: 'N/A', ikhtiar: 'N/A', usaha: 'N/A', natijah: 'N/A',
    },
    cV:                (parsed.cV as ContributionValue)  ?? 1,
    adab,
    sifat:             (parsed.sifat as Sifat) ?? 'LALAI',
    principleApplied:  (parsed.principleApplied as AlamtologiPrinciple) ?? principle,
    faktorTenaga:      parsed.faktorTenaga  ?? PRINCIPLE_WEIGHTS.TENAGA,
    faktorMasa:        parsed.faktorMasa    ?? PRINCIPLE_WEIGHTS.MASA,
    healthScore,
    response:          parsed.response      ?? 'No response generated.',
    canProceed:        parsed.canProceed    ?? false,
    conditions:        parsed.conditions    ?? [],
    auditId,
    timestamp:         new Date(),
  };

  // Persist audit record
  await ADAMAuditModel.create({
    targetId:        auditId,
    targetType:      'SESSION',
    stage:           'SUBMISSION',
    judgment:        result.judgment,
    hukumZ:          result.hukumZ,
    hukumX:          result.hukumX,
    adab:            result.adab,
    healthScore:     result.healthScore,
    findings:        [result.response],
    recommendations: result.conditions ?? [],
    canAdvance:      result.canProceed,
    auditedAt:       new Date(),
  });

  return result;
}
