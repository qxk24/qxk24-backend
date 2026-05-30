/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Chat Response Parser
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { CONSULT_PHRASE } from './adam-system-prompts';
import type {
  AlamtologiPrinciple,
  ConstitutionalJudgment,
  TahapAkal,
} from './adam.types';

export interface FounderBroadcast {
  message: string;
  target:  string;
}

export interface StudentToFounderRelay {
  message: string;
}

export function parseConsultBlock(fullResponse: string): {
  reason:        string;
  cleanResponse: string;
  needsConsult:  boolean;
} {
  let reason = '';
  const consultMatch = fullResponse.match(/<adam_consult>(.*?)<\/adam_consult>/s);
  if (consultMatch) {
    try {
      const parsed = JSON.parse(consultMatch[1]);
      reason = parsed.reason ?? '';
    } catch {
      reason = 'Student question requires Founder guidance.';
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_consult>.*?<\/adam_consult>/s, '')
    .trim();

  const needsConsult =
    Boolean(reason) ||
    cleanResponse.includes(CONSULT_PHRASE) ||
    fullResponse.includes(CONSULT_PHRASE);

  return { reason, cleanResponse, needsConsult };
}

export function parseBroadcastBlocks(fullResponse: string): {
  broadcasts:    FounderBroadcast[];
  cleanResponse: string;
} {
  const broadcasts: FounderBroadcast[] = [];
  const regex = /<adam_broadcast>([\s\S]*?)<\/adam_broadcast>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fullResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: string; target?: string };
      const text = parsed.message?.trim();
      if (!text) continue;
      broadcasts.push({
        message: text,
        target:  (parsed.target?.trim().toLowerCase() || 'all'),
      });
    } catch {
      // skip malformed block
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_broadcast>[\s\S]*?<\/adam_broadcast>/g, '')
    .trim();

  return { broadcasts, cleanResponse };
}

export function parseToFounderBlocks(fullResponse: string): {
  relays:        StudentToFounderRelay[];
  cleanResponse: string;
} {
  const relays: StudentToFounderRelay[] = [];
  const regex = /<adam_to_founder>([\s\S]*?)<\/adam_to_founder>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fullResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: string };
      const text = parsed.message?.trim();
      if (text) relays.push({ message: text });
    } catch {
      // skip malformed block
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_to_founder>[\s\S]*?<\/adam_to_founder>/g, '')
    .trim();

  return { relays, cleanResponse };
}

export function founderWantsStudentRelay(message: string): boolean {
  return /\b(tell them|tell the students|convey|sampaikan|send to|hantar kepada|all students|semua pelajar|to the group|kepada pelajar|pass to)\b/i.test(
    message,
  );
}

export function studentWantsFounderRelay(message: string): boolean {
  return /\b(founder|pengasas|masa\s*bayu|convey|sampaikan|pass\s+to|tell\s+the\s+founder|tanya\s+(?:ke\s+)?pengasas|hantar\s+(?:ke\s+)?pengasas)\b/i.test(
    message,
  );
}

export function parseJudgmentBlock(fullResponse: string): {
  judgment: ConstitutionalJudgment;
  tahapAkal: TahapAkal;
  healthScore: number;
  principleApplied: AlamtologiPrinciple;
  cleanResponse: string;
} {
  let judgment: ConstitutionalJudgment = 'ISLAH';
  let tahapAkal: TahapAkal = 3;
  let healthScore = 75;
  let principleApplied: AlamtologiPrinciple = 'CAHAYA';

  const judgmentMatch = fullResponse.match(
    /<adam_judgment>(.*?)<\/adam_judgment>/s,
  );

  if (judgmentMatch) {
    try {
      const parsed = JSON.parse(judgmentMatch[1]);
      judgment = parsed.judgment ?? 'ISLAH';
      tahapAkal = parsed.tahapAkal ?? 3;
      healthScore = parsed.healthScore ?? 75;
      principleApplied = parsed.principle ?? 'CAHAYA';
    } catch {
      judgment = 'ISLAH';
    }
  }

  const cleanResponse = fullResponse
    .replace(/<adam_judgment>.*?<\/adam_judgment>/s, '')
    .trim();

  return { judgment, tahapAkal, healthScore, principleApplied, cleanResponse };
}
